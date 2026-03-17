import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  PauseCircle,
  PlayCircle,
  Plus,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  canAccessSection,
  derivePortalCapabilities,
  getRoleIdsForUser,
  getTeamMemberForUser,
  hasAnySectionAccess,
  type PortalCapabilities,
} from '../../lib/bohRoles';
import {
  formatScheduleWindowForDisplay,
  formatScheduleWindowForTimeZone,
  getScheduleLocalTimeZone,
  persistScheduleUsTimeZone,
  readScheduleUsTimeZone,
  persistScheduleTimeDisplayMode,
  readScheduleTimeDisplayMode,
  US_SCHEDULE_TIME_ZONE_OPTIONS,
  type ScheduleTimeDisplayMode,
} from '../../lib/scheduleTimezone';

interface WorkforceShift {
  id: string;
  employee_id: string;
  role_id: string;
  location_id?: string;
  station_id?: string | null;
  start_time: string;
  end_time: string;
  wage_rate?: number;
  status?: string;
}

interface WorkforceRole {
  id: string;
  name: string;
  role_section?: string | null;
  display_order?: number;
  department_id?: string;
  hourly_rate?: number;
}

interface WorkforceEmployeeRole {
  id: string;
  employee_id: string;
  role_id: string;
  hourly_rate?: number;
  primary_role?: boolean;
  active?: boolean;
}

interface WorkforceDepartment {
  id: string;
  name: string;
}

interface WorkforceEmployee {
  id: string;
  user_id?: string;
  name: string;
  email?: string;
  title?: string;
  pto_unit?: 'hours' | 'days' | string;
}

interface WorkforcePunch {
  id: string;
  employee_id: string;
  shift_id: string;
  clock_in: string;
  clock_out?: string | null;
  status?: string;
}

interface WorkforceBreak {
  id: string;
  punch_id: string;
  start_time: string;
  end_time?: string | null;
  break_type?: string | null;
  paid_break?: boolean;
  expected_minutes?: number | null;
}

interface WorkforceTask {
  id: string;
  title: string;
  assigned_employee_id?: string;
  assigned_role_id?: string;
  station_id?: string;
  due_time?: string;
  completion_status?: string;
  critical?: boolean;
  completed_by?: string;
  completed_at?: string;
  verified_by?: string;
  verified_at?: string;
}

interface WorkforceLogEntry {
  id: string;
  author_name?: string;
  timestamp: string;
  category?: string;
  severity?: string;
  message: string;
}

interface WorkforcePtoBalance {
  id: string;
  employee_id: string;
  accrued_hours?: number;
  used_hours?: number;
  available_hours?: number;
  pto_unit?: 'hours' | 'days' | string;
}

interface WorkforceCompanyHoliday {
  id: string;
  holiday_date: string;
  name: string;
  notes?: string;
  active?: boolean;
}

interface WorkforceEvent {
  id: string;
  event_type: string;
  actor_id?: string;
  subject_type?: string;
  subject_id?: string;
  timestamp: string;
  metadata_json?: unknown;
}

interface WorkforceTimeOffRequest {
  id: string;
  employee_id: string;
  request_type: 'sick' | 'pto' | string;
  start_date: string;
  end_date: string;
  hours?: number;
  status?: 'pending' | 'approved' | 'denied' | string;
  notes?: string;
  created_at?: string;
}

interface WorkforceTimeOffBlock {
  id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  active?: boolean;
}

const MINUTE_MS = 60 * 1000;

const EMPTY_CAPABILITIES: PortalCapabilities = {
  canViewReservations: false,
  canViewEventsParties: false,
  canViewClasses: false,
  operationsClassesReadOnly: false,
  canAccessMenuManagement: false,
  canAccessOperations: false,
  canAccessWorkforce: false,
  canAccessContentManagement: false,
  canAccessCareerManagement: false,
  canAccessInvestment: false,
  canAccessSettings: false,
  canManageSchedule: false,
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatTimeWindow = (startTime: string, endTime: string) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return `${startTime} - ${endTime}`;
  return `${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
};

const formatTimeOnly = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const formatBreakTypeLabel = (entry: WorkforceBreak) => {
  const type = String(entry.break_type || '').toLowerCase();
  if (type.includes('rest_15') || type.includes('15')) return '15 paid';
  if (type.includes('meal_30') || type.includes('30')) return '30 unpaid';
  if (entry.paid_break === true) return 'Paid break';
  if (entry.paid_break === false) return 'Unpaid break';
  return 'Break';
};

const getBreakExpectedMinutes = (entry: WorkforceBreak) => {
  const explicit = Number(entry.expected_minutes);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const type = String(entry.break_type || '').toLowerCase();
  if (type.includes('meal') || type.includes('unpaid') || type.includes('30')) return 30;
  if (type.includes('rest') || type.includes('paid') || type.includes('15')) return 15;
  return 0;
};

const getBreakDurationMinutes = (entry: WorkforceBreak, nowMs = Date.now()) => {
  const startMs = new Date(entry.start_time).getTime();
  const endMs = new Date(entry.end_time || nowMs).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) return 0;
  return (endMs - startMs) / MINUTE_MS;
};

const isBreakUnpaid = (entry: WorkforceBreak, durationMinutes: number) => {
  if (entry.paid_break === true) return false;
  if (entry.paid_break === false) return true;
  const type = String(entry.break_type || '').toLowerCase();
  if (type.includes('unpaid') || type.includes('meal')) return true;
  if (type.includes('paid') || type.includes('rest')) return false;
  const expected = getBreakExpectedMinutes(entry);
  if (expected > 0) return expected >= 30;
  return durationMinutes >= 30;
};

const formatDurationLabel = (minutesValue: number) => {
  if (!Number.isFinite(minutesValue) || minutesValue <= 0) return '0m';
  const totalMinutes = Math.max(0, Math.round(minutesValue));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
};

const getPunchWorkedMinutes = (punch: WorkforcePunch, punchBreaks: WorkforceBreak[], nowMs = Date.now()) => {
  const clockInMs = new Date(punch.clock_in).getTime();
  const clockOutMs = new Date(punch.clock_out || nowMs).getTime();
  if (Number.isNaN(clockInMs) || Number.isNaN(clockOutMs) || clockOutMs <= clockInMs) return 0;

  const grossMinutes = (clockOutMs - clockInMs) / MINUTE_MS;
  const unpaidMinutes = punchBreaks.reduce((total, entry) => {
    const durationMinutes = getBreakDurationMinutes(entry, nowMs);
    return isBreakUnpaid(entry, durationMinutes) ? total + durationMinutes : total;
  }, 0);

  return Math.max(0, grossMinutes - unpaidMinutes);
};

const formatHoursTotalLabel = (minutesValue: number) =>
  `${(Math.max(0, minutesValue) / 60).toFixed(2)}h`;

const formatDateLabel = (value: string) => {
  const [yearRaw, monthRaw, dayRaw] = value.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!year || !month || !day) return value;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateShort = (value: Date) =>
  value.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

const PTO_HOURS_PER_DAY = 8;

const normalizePtoUnit = (value: unknown): 'hours' | 'days' =>
  String(value || '').toLowerCase() === 'days' ? 'days' : 'hours';

const ptoHoursToDisplay = (hoursValue: number, unit: 'hours' | 'days') =>
  unit === 'days' ? hoursValue / PTO_HOURS_PER_DAY : hoursValue;

const ptoDisplayToHours = (displayValue: number, unit: 'hours' | 'days') =>
  unit === 'days' ? displayValue * PTO_HOURS_PER_DAY : displayValue;

const formatPtoValue = (value: number) => (Number.isFinite(value) ? (Math.round(value * 10) / 10).toFixed(1) : '0.0');
const formatPtoUnitLabel = (unit: 'hours' | 'days') => (unit === 'days' ? 'Days' : 'Hours');

const normalizeRoleSection = (value: string) => {
  const next = String(value || '').trim();
  return next || 'General';
};

const parseDisplayOrder = (value: unknown, fallback = Number.MAX_SAFE_INTEGER) => {
  const next = Number(value);
  if (!Number.isFinite(next) || next <= 0) return fallback;
  return Math.round(next);
};

const normalizeTaskStatus = (value: unknown): 'open' | 'completed' | 'verified' => {
  const next = String(value || 'open').trim().toLowerCase();
  if (next === 'verified' || next === 'closed') return 'verified';
  if (next === 'completed') return 'completed';
  return 'open';
};

const formatLocalStorageDateTime = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:00`;
};

const rollTaskDueTimeForwardToCurrentDay = (dueTime: string, minDate: Date) => {
  const parsed = new Date(dueTime);
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.getTime() >= minDate.getTime()) return null;

  const next = new Date(parsed);
  let safety = 0;
  while (next.getTime() < minDate.getTime() && safety < 400) {
    next.setDate(next.getDate() + 1);
    safety += 1;
  }
  if (next.getTime() < minDate.getTime()) return null;
  return formatLocalStorageDateTime(next);
};

const LOG_CATEGORY_OPTIONS = [
  { value: 'refund', label: 'Refund' },
  { value: 'escalation', label: 'Escallation' },
  { value: 'notes', label: 'Notes' },
] as const;

const LOG_PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
] as const;

const normalizeLogCategory = (value: unknown): 'refund' | 'escalation' | 'notes' => {
  const next = String(value || '').trim().toLowerCase();
  if (next === 'refund') return 'refund';
  if (next === 'escalation' || next === 'escallation' || next === 'incident') return 'escalation';
  return 'notes';
};

const normalizeLogPriority = (value: unknown): 'low' | 'medium' | 'high' => {
  const next = String(value || '').trim().toLowerCase();
  if (next === 'high' || next === 'critical') return 'high';
  if (next === 'medium' || next === 'warning') return 'medium';
  return 'low';
};

const getLogCategoryLabel = (value: unknown) =>
  LOG_CATEGORY_OPTIONS.find((option) => option.value === normalizeLogCategory(value))?.label || 'Notes';

const getLogPriorityLabel = (value: unknown) =>
  LOG_PRIORITY_OPTIONS.find((option) => option.value === normalizeLogPriority(value))?.label || 'Low';

const toDateKey = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const startOfWeek = (value: Date) => {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() - next.getDay());
  return next;
};

const addDays = (value: Date, days: number) => {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
};

const rangesOverlap = (startA: string, endA: string, startB: string, endB: string) =>
  !(endA < startB || endB < startA);

const dateKeyToUtcDay = (value: string) => {
  const [yearRaw, monthRaw, dayRaw] = value.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!year || !month || !day) return null;
  return Math.floor(Date.UTC(year, month - 1, day) / (24 * 60 * 60 * 1000));
};

const utcDayToDateKey = (utcDay: number) => {
  const value = new Date(utcDay * 24 * 60 * 60 * 1000);
  return value.toISOString().slice(0, 10);
};

const getInclusiveDateSpanDays = (startDate: string, endDate: string) => {
  const startDay = dateKeyToUtcDay(startDate);
  const endDay = dateKeyToUtcDay(endDate);
  if (startDay === null || endDay === null || endDay < startDay) return 0;
  return endDay - startDay + 1;
};

const formatTimeOffTypeLabel = (value: unknown) => {
  const next = String(value || '').trim().toLowerCase();
  if (next === 'pto') return 'PTO';
  if (next === 'sick') return 'Sick';
  return 'Time Off';
};

const parseEventMetadata = (raw: unknown): Record<string, unknown> => {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
};

const normalizeTimeOffStatus = (value: unknown): 'pending' | 'approved' | 'denied' => {
  const next = String(value || 'pending').trim().toLowerCase();
  if (next === 'approved') return 'approved';
  if (next === 'denied') return 'denied';
  return 'pending';
};

const formatWeekday = (value: Date) =>
  value.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

const buildPtoRequestDraft = () => {
  const today = new Date().toISOString().slice(0, 10);
  return {
    request_type: 'pto',
    start_date: today,
    end_date: today,
    notes: '',
  };
};

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [savingAction, setSavingAction] = useState(false);
  const [capabilities, setCapabilities] = useState<PortalCapabilities>(EMPTY_CAPABILITIES);
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentUserName, setCurrentUserName] = useState('Manager');
  const [shifts, setShifts] = useState<WorkforceShift[]>([]);
  const [roles, setRoles] = useState<WorkforceRole[]>([]);
  const [employeeRoles, setEmployeeRoles] = useState<WorkforceEmployeeRole[]>([]);
  const [departments, setDepartments] = useState<WorkforceDepartment[]>([]);
  const [employees, setEmployees] = useState<WorkforceEmployee[]>([]);
  const [logs, setLogs] = useState<WorkforceLogEntry[]>([]);
  const [punches, setPunches] = useState<WorkforcePunch[]>([]);
  const [breaks, setBreaks] = useState<WorkforceBreak[]>([]);
  const [tasks, setTasks] = useState<WorkforceTask[]>([]);
  const [ptoBalances, setPtoBalances] = useState<WorkforcePtoBalance[]>([]);
  const [companyHolidays, setCompanyHolidays] = useState<WorkforceCompanyHoliday[]>([]);
  const [events, setEvents] = useState<WorkforceEvent[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<WorkforceTimeOffRequest[]>([]);
  const [timeOffBlocks, setTimeOffBlocks] = useState<WorkforceTimeOffBlock[]>([]);
  const [showLogEntryForm, setShowLogEntryForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showPtoRequestForm, setShowPtoRequestForm] = useState(false);
  const [editingPtoRequestId, setEditingPtoRequestId] = useState('');
  const [weeklyScheduleOffset, setWeeklyScheduleOffset] = useState(0);
  const [scheduleTimeDisplayMode, setScheduleTimeDisplayMode] = useState<ScheduleTimeDisplayMode>(() =>
    readScheduleTimeDisplayMode(),
  );
  const [selectedUsTimeZone, setSelectedUsTimeZone] = useState(() => readScheduleUsTimeZone());
  const [isSupervisorProfile, setIsSupervisorProfile] = useState(false);
  const [clockNowMs, setClockNowMs] = useState(() => Date.now());
  const [editingLogEntryId, setEditingLogEntryId] = useState('');
  const [logDraft, setLogDraft] = useState({
    category: 'notes',
    severity: 'low',
    message: '',
  });
  const [logEditDraft, setLogEditDraft] = useState({
    category: 'notes',
    severity: 'low',
    message: '',
  });
  const [taskDraft, setTaskDraft] = useState({
    title: '',
    assigned_employee_id: '',
    due_date: new Date().toISOString().slice(0, 10),
    due_time: '18:00',
    critical: false,
  });
  const [ptoRequestDraft, setPtoRequestDraft] = useState(() => buildPtoRequestDraft());
  const rollingTaskForwardRef = useRef(false);
  const localScheduleTimeZone = useMemo(() => getScheduleLocalTimeZone(), []);

  const loadDashboardData = useCallback(
    async (userId: string, userEmail = '') => {
      const roleIds = await getRoleIdsForUser(userId);
      const teamMember = await getTeamMemberForUser(userId, userEmail);
      const nextCapabilities = derivePortalCapabilities(roleIds, teamMember);

      const [
        shiftsRes,
        rolesRes,
        employeeRolesRes,
        departmentsRes,
        employeesRes,
        logsRes,
        punchesRes,
        breaksRes,
        tasksRes,
        ptoBalancesRes,
        companyHolidaysRes,
        eventsRes,
        timeOffRequestsRes,
        timeOffBlocksRes,
      ] = await Promise.all([
        supabase.from('workforce_shifts').select('*').order('start_time'),
        supabase.from('workforce_roles').select('*').order('name'),
        supabase.from('workforce_employee_roles').select('*').order('created_at'),
        supabase.from('workforce_departments').select('*').order('name'),
        supabase.from('workforce_employees').select('*').order('name'),
        supabase.from('workforce_log_entries').select('*').order('timestamp', { ascending: false }),
        supabase.from('workforce_punches').select('*').order('clock_in', { ascending: false }),
        supabase.from('workforce_breaks').select('*').order('start_time', { ascending: false }),
        supabase.from('workforce_tasks').select('*').order('due_time'),
        supabase.from('workforce_pto_balances').select('*').order('updated_at', { ascending: false }),
        supabase.from('workforce_company_holidays').select('*').order('holiday_date'),
        supabase.from('workforce_events').select('*').order('timestamp', { ascending: false }),
        supabase.from('workforce_time_off_requests').select('*').order('start_date'),
        supabase.from('workforce_time_off_blocks').select('*').order('start_date'),
      ]);

      setCapabilities(nextCapabilities);
      setShifts((shiftsRes.data as WorkforceShift[]) || []);
      setRoles((rolesRes.data as WorkforceRole[]) || []);
      setEmployeeRoles((employeeRolesRes.data as WorkforceEmployeeRole[]) || []);
      setDepartments((departmentsRes.data as WorkforceDepartment[]) || []);
      setEmployees((employeesRes.data as WorkforceEmployee[]) || []);
      setLogs((logsRes.data as WorkforceLogEntry[]) || []);
      setPunches((punchesRes.data as WorkforcePunch[]) || []);
      setBreaks((breaksRes.data as WorkforceBreak[]) || []);
      setTasks((tasksRes.data as WorkforceTask[]) || []);
      setPtoBalances((ptoBalancesRes.data as WorkforcePtoBalance[]) || []);
      setCompanyHolidays((companyHolidaysRes.data as WorkforceCompanyHoliday[]) || []);
      setEvents((eventsRes.data as WorkforceEvent[]) || []);
      setTimeOffRequests((timeOffRequestsRes.data as WorkforceTimeOffRequest[]) || []);
      setTimeOffBlocks((timeOffBlocksRes.data as WorkforceTimeOffBlock[]) || []);
      setCurrentUserName(teamMember?.name || userEmail || 'Manager');
      setIsSupervisorProfile(Boolean(teamMember?.can_manage_schedule));
    },
    [],
  );

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user?.id) return;
        if (!active) return;

        setCurrentUserId(session.user.id);
        setCurrentUserEmail(String(session.user.email || ''));
        await loadDashboardData(session.user.id, String(session.user.email || ''));
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [loadDashboardData]);

  useEffect(() => {
    persistScheduleTimeDisplayMode(scheduleTimeDisplayMode);
  }, [scheduleTimeDisplayMode]);

  useEffect(() => {
    persistScheduleUsTimeZone(selectedUsTimeZone);
  }, [selectedUsTimeZone]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setClockNowMs(Date.now());
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const todayKey = new Date().toISOString().slice(0, 10);
  const thisWeekStart = startOfWeek(new Date());
  const currentWeekStart = useMemo(() => addDays(thisWeekStart, weeklyScheduleOffset * 7), [thisWeekStart, weeklyScheduleOffset]);
  const currentWeekEnd = addDays(currentWeekStart, 7);
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(currentWeekStart, index)), [currentWeekStart]);
  const weekDateKeys = useMemo(() => weekDates.map((date) => date.toISOString().slice(0, 10)), [weekDates]);
  const canViewPreviousScheduleWeek = weeklyScheduleOffset > 0;
  const canViewNextScheduleWeek = weeklyScheduleOffset < 3;
  const weekRangeLabel = useMemo(() => {
    const first = weekDates[0];
    const last = weekDates[6];
    if (!first || !last) return '';
    return `${formatDateShort(first)} - ${formatDateShort(last)}`;
  }, [weekDates]);

  const employeeById = useMemo(
    () =>
      employees.reduce((accumulator, employee) => {
        accumulator[employee.id] = employee;
        return accumulator;
      }, {} as Record<string, WorkforceEmployee>),
    [employees],
  );

  const roleById = useMemo(
    () =>
      roles.reduce((accumulator, role) => {
        accumulator[role.id] = role;
        return accumulator;
      }, {} as Record<string, WorkforceRole>),
    [roles],
  );

  const orderedRoles = useMemo(
    () =>
      roles
        .slice()
        .sort((a, b) => {
          const orderA = parseDisplayOrder(a.display_order);
          const orderB = parseDisplayOrder(b.display_order);
          if (orderA !== orderB) return orderA - orderB;

          const sectionA = normalizeRoleSection(String(a.role_section || ''));
          const sectionB = normalizeRoleSection(String(b.role_section || ''));
          if (sectionA !== sectionB) return sectionA.localeCompare(sectionB);

          return String(a.name || '').localeCompare(String(b.name || ''));
        }),
    [roles],
  );

  const roleOrderIndexById = useMemo(
    () =>
      orderedRoles.reduce((accumulator, role, index) => {
        accumulator[role.id] = index;
        return accumulator;
      }, {} as Record<string, number>),
    [orderedRoles],
  );

  const departmentById = useMemo(
    () =>
      departments.reduce((accumulator, department) => {
        accumulator[department.id] = department;
        return accumulator;
      }, {} as Record<string, WorkforceDepartment>),
    [departments],
  );

  const employeeRoleAssignmentsByEmployeeId = useMemo(
    () =>
      employeeRoles.reduce((accumulator, assignment) => {
        if (!assignment.employee_id) return accumulator;
        if (!accumulator[assignment.employee_id]) {
          accumulator[assignment.employee_id] = [];
        }
        accumulator[assignment.employee_id].push(assignment);
        return accumulator;
      }, {} as Record<string, WorkforceEmployeeRole[]>),
    [employeeRoles],
  );

  useEffect(() => {
    if (!taskDraft.assigned_employee_id && employees.length > 0) {
      setTaskDraft((current) => ({ ...current, assigned_employee_id: employees[0].id }));
    }
  }, [employees, taskDraft.assigned_employee_id]);

  const shiftsToday = useMemo(
    () => shifts.filter((shift) => toDateKey(shift.start_time) === todayKey),
    [shifts, todayKey],
  );

  const scheduleByDepartment = useMemo(() => {
    const grouped: Record<string, WorkforceShift[]> = {};

    shiftsToday.forEach((shift) => {
      const role = roleById[shift.role_id];
      const roleSection = String(role?.role_section || '').trim();
      const roleName = String(role?.name || '').trim();
      const departmentFromRole = departmentById[String(role?.department_id || '')]?.name || '';
      const departmentName = roleSection || roleName || departmentFromRole || 'Unassigned';
      if (!grouped[departmentName]) grouped[departmentName] = [];
      grouped[departmentName].push(shift);
    });

    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [departmentById, roleById, shiftsToday]);

  const openPunches = useMemo(() => punches.filter((punch) => !punch.clock_out), [punches]);

  const managerLog = useMemo(
    () =>
      logs
        .slice()
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, 8),
    [logs],
  );

  const stationAlerts = useMemo(
    () =>
      tasks.filter((task) => {
        const status = normalizeTaskStatus(task.completion_status);
        if (status !== 'open') return false;
        if (task.critical) return true;
        if (!task.due_time) return false;
        return new Date(task.due_time).getTime() < Date.now();
      }),
    [tasks],
  );

  const punchesByShiftId = useMemo(
    () =>
      punches.reduce((accumulator, punch) => {
        if (!punch.shift_id) return accumulator;
        if (!accumulator[punch.shift_id]) {
          accumulator[punch.shift_id] = [];
        }
        accumulator[punch.shift_id].push(punch);
        return accumulator;
      }, {} as Record<string, WorkforcePunch[]>),
    [punches],
  );

  const visibleTaskGroups = useMemo(() => {
    const grouped: Record<string, WorkforceTask[]> = {};

    tasks.forEach((task) => {
      const status = normalizeTaskStatus(task.completion_status);
      if (status === 'verified') return;
      const key = String(task.assigned_employee_id || 'unassigned');
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(task);
    });

    const rankByStatus = (status: 'open' | 'completed' | 'verified') => {
      if (status === 'open') return 0;
      if (status === 'completed') return 1;
      return 2;
    };

    const sortedGroups = Object.entries(grouped).map(([assigneeId, groupTasks]) => {
      const sortedTasks = groupTasks.slice().sort((a, b) => {
        const statusA = normalizeTaskStatus(a.completion_status);
        const statusB = normalizeTaskStatus(b.completion_status);
        const rankA = rankByStatus(statusA);
        const rankB = rankByStatus(statusB);
        if (rankA !== rankB) return rankA - rankB;

        const dueA = a.due_time ? new Date(a.due_time).getTime() : Number.MAX_SAFE_INTEGER;
        const dueB = b.due_time ? new Date(b.due_time).getTime() : Number.MAX_SAFE_INTEGER;
        const safeDueA = Number.isNaN(dueA) ? Number.MAX_SAFE_INTEGER : dueA;
        const safeDueB = Number.isNaN(dueB) ? Number.MAX_SAFE_INTEGER : dueB;
        if (safeDueA !== safeDueB) return safeDueA - safeDueB;

        return String(a.title || '').localeCompare(String(b.title || ''));
      });

      const assigneeName =
        assigneeId === 'unassigned' ? 'Unassigned' : employeeById[assigneeId]?.name || 'Unknown Team Member';
      return { assigneeId, assigneeName, tasks: sortedTasks };
    });

    sortedGroups.sort((a, b) => {
      const aUnassigned = a.assigneeId === 'unassigned';
      const bUnassigned = b.assigneeId === 'unassigned';
      if (aUnassigned !== bUnassigned) return aUnassigned ? 1 : -1;
      return a.assigneeName.localeCompare(b.assigneeName);
    });

    return sortedGroups;
  }, [employeeById, tasks]);

  const myEmployee = useMemo(() => {
    const normalizedEmail = currentUserEmail.trim().toLowerCase();
    return (
      employees.find((employee) => {
        const employeeUserId = String(employee.user_id || '');
        if (employeeUserId && employeeUserId === currentUserId) return true;
        if (!normalizedEmail) return false;
        return String(employee.email || '').trim().toLowerCase() === normalizedEmail;
      }) || null
    );
  }, [currentUserEmail, currentUserId, employees]);

  const selectedUsTimeZoneLabel = useMemo(
    () =>
      US_SCHEDULE_TIME_ZONE_OPTIONS.find((option) => option.value === selectedUsTimeZone)?.label || 'Eastern (ET)',
    [selectedUsTimeZone],
  );

  const formatSelectedScheduleWindow = useCallback(
    (startTime: string, endTime: string) =>
      scheduleTimeDisplayMode === 'local'
        ? formatScheduleWindowForDisplay(startTime, endTime, 'local')
        : formatScheduleWindowForTimeZone(startTime, endTime, selectedUsTimeZone),
    [scheduleTimeDisplayMode, selectedUsTimeZone],
  );

  const missedPunchDigest = useMemo(() => {
    const digest: Array<{ id: string; code: string; message: string; level: 'warning' | 'critical'; sortKey: number }> = [];
    const graceMs = 15 * MINUTE_MS;

    shiftsToday.forEach((shift) => {
      const startMs = new Date(shift.start_time).getTime();
      const endMs = new Date(shift.end_time).getTime();
      if (Number.isNaN(startMs) || Number.isNaN(endMs)) return;

      const employeeName = employeeById[shift.employee_id]?.name || 'Unassigned';
      const linkedPunches = (punchesByShiftId[shift.id] || [])
        .slice()
        .sort((a, b) => String(a.clock_in || '').localeCompare(String(b.clock_in || '')));
      const hasAnyPunch = linkedPunches.length > 0;
      const openPunch = linkedPunches.find((punch) => !punch.clock_out) || null;

      if (!hasAnyPunch && clockNowMs > startMs + graceMs) {
        const isCritical = clockNowMs > endMs + graceMs;
        digest.push({
          id: `missed-in-${shift.id}`,
          code: isCritical ? 'NO_SHOW' : 'MISSED_CLOCK_IN',
          message: `${employeeName} has no punch for ${formatSelectedScheduleWindow(shift.start_time, shift.end_time)}.`,
          level: isCritical ? 'critical' : 'warning',
          sortKey: startMs,
        });
      }

      if (openPunch && clockNowMs > endMs + graceMs) {
        digest.push({
          id: `missed-out-${openPunch.id}`,
          code: 'MISSED_CLOCK_OUT',
          message: `${employeeName} is still clocked in after scheduled end ${formatTimeOnly(shift.end_time)}.`,
          level: 'warning',
          sortKey: endMs,
        });
      }
    });

    return digest
      .sort((a, b) => {
        if (a.level !== b.level) return a.level === 'critical' ? -1 : 1;
        return b.sortKey - a.sortKey;
      })
      .slice(0, 8);
  }, [clockNowMs, employeeById, formatSelectedScheduleWindow, punchesByShiftId, shiftsToday]);

  const myPtoNotifications = useMemo(() => {
    if (!myEmployee) return [];
    const myRequestIds = new Set(
      timeOffRequests
        .filter((request) => request.employee_id === myEmployee.id)
        .map((request) => String(request.id)),
    );

    const notifications = events
      .filter((event) => String(event.subject_type || '') === 'time_off_request')
      .map((event) => {
        const metadata = parseEventMetadata(event.metadata_json);
        const metadataEmployeeId = String(metadata.employee_id || '');
        const belongsToMe =
          metadataEmployeeId === myEmployee.id || myRequestIds.has(String(event.subject_id || ''));
        if (!belongsToMe) return null;

        const eventType = String(event.event_type || '');
        const status = normalizeTimeOffStatus(metadata.status);
        let message = '';
        if (eventType === 'TIME_OFF_REQUEST_SUBMITTED') {
          message = 'Request submitted and pending supervisor review.';
        } else if (eventType === 'TIME_OFF_REQUEST_STATUS_UPDATED') {
          message =
            status === 'approved'
              ? 'Your request was approved.'
              : status === 'denied'
                ? 'Your request was denied.'
                : 'Your request is pending review.';
        } else if (eventType === 'TIME_OFF_REQUEST_EDITED_PENDING') {
          message = 'Edited request was reset to pending for supervisor review.';
        } else if (eventType === 'TIME_OFF_REQUEST_DELETED') {
          message = 'Request was deleted.';
        } else {
          return null;
        }

        return {
          id: event.id,
          message,
          timestamp: event.timestamp,
        };
      })
      .filter((entry): entry is { id: string; message: string; timestamp: string } => Boolean(entry))
      .sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')))
      .slice(0, 6);

    return notifications;
  }, [events, myEmployee, timeOffRequests]);

  const myPtoBalance = useMemo(() => {
    if (!myEmployee) return null;
    return ptoBalances.find((entry) => entry.employee_id === myEmployee.id) || null;
  }, [myEmployee, ptoBalances]);

  const myPtoUnit = useMemo(
    () => normalizePtoUnit(myEmployee?.pto_unit ?? myPtoBalance?.pto_unit),
    [myEmployee?.pto_unit, myPtoBalance?.pto_unit],
  );

  const myPtoAvailableDisplay = useMemo(
    () => ptoHoursToDisplay(Number(myPtoBalance?.available_hours || 0), myPtoUnit),
    [myPtoBalance?.available_hours, myPtoUnit],
  );

  const draftRequestedDays = useMemo(
    () => getInclusiveDateSpanDays(ptoRequestDraft.start_date, ptoRequestDraft.end_date),
    [ptoRequestDraft.end_date, ptoRequestDraft.start_date],
  );

  const draftRequestedDisplayAmount = useMemo(
    () => (myPtoUnit === 'days' ? draftRequestedDays : draftRequestedDays * PTO_HOURS_PER_DAY),
    [draftRequestedDays, myPtoUnit],
  );

  const activeTimeOffBlocks = useMemo(
    () =>
      timeOffBlocks
        .filter((block) => block.active !== false)
        .slice()
        .sort((a, b) => a.start_date.localeCompare(b.start_date)),
    [timeOffBlocks],
  );

  const myUpcomingTimeOffRequests = useMemo(() => {
    if (!myEmployee) return [];
    return timeOffRequests
      .filter((request) => request.employee_id === myEmployee.id && request.end_date >= todayKey)
      .slice()
      .sort((a, b) => `${a.start_date}${a.created_at || ''}`.localeCompare(`${b.start_date}${b.created_at || ''}`));
  }, [myEmployee, timeOffRequests, todayKey]);

  const editingPtoRequest = useMemo(() => {
    if (!editingPtoRequestId || !myEmployee) return null;
    return (
      timeOffRequests.find(
        (request) => request.id === editingPtoRequestId && request.employee_id === myEmployee.id,
      ) || null
    );
  }, [editingPtoRequestId, myEmployee, timeOffRequests]);

  const approvedTimeOffByEmployeeDate = useMemo(() => {
    const grouped: Record<string, WorkforceTimeOffRequest[]> = {};

    timeOffRequests.forEach((request) => {
      if (normalizeTimeOffStatus(request.status) !== 'approved') return;
      if (!request.employee_id || !request.start_date || !request.end_date) return;

      const startDay = dateKeyToUtcDay(request.start_date);
      const endDay = dateKeyToUtcDay(request.end_date);
      if (startDay === null || endDay === null || endDay < startDay) return;

      for (let day = startDay; day <= endDay; day += 1) {
        const key = `${request.employee_id}::${utcDayToDateKey(day)}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(request);
      }
    });

    return grouped;
  }, [timeOffRequests]);

  const approvedTimeOffToday = useMemo(() => {
    const entries = employees
      .map((employee) => {
        const requests = approvedTimeOffByEmployeeDate[`${employee.id}::${todayKey}`] || [];
        if (!requests.length) return null;
        const typeLabels = Array.from(new Set(requests.map((request) => formatTimeOffTypeLabel(request.request_type))));
        return {
          employeeId: employee.id,
          employeeName: employee.name,
          typeLabels,
        };
      })
      .filter((entry): entry is { employeeId: string; employeeName: string; typeLabels: string[] } => Boolean(entry))
      .sort((a, b) => a.employeeName.localeCompare(b.employeeName));

    return entries;
  }, [approvedTimeOffByEmployeeDate, employees, todayKey]);

  const activeCompanyHolidays = useMemo(
    () =>
      companyHolidays
        .filter((holiday) => holiday.active !== false && holiday.holiday_date >= todayKey)
        .slice()
        .sort((a, b) => a.holiday_date.localeCompare(b.holiday_date)),
    [companyHolidays, todayKey],
  );

  const upcomingCompanyHolidays = useMemo(() => activeCompanyHolidays.slice(0, 6), [activeCompanyHolidays]);

  const nextCompanyHoliday = useMemo(() => upcomingCompanyHolidays[0] || null, [upcomingCompanyHolidays]);

  const myShiftsToday = useMemo(() => {
    if (!myEmployee) return [];
    return shiftsToday
      .filter((shift) => shift.employee_id === myEmployee.id)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [myEmployee, shiftsToday]);

  const myOpenPunch = useMemo(() => {
    if (!myEmployee) return null;
    return (
      punches
        .filter((punch) => punch.employee_id === myEmployee.id && !punch.clock_out)
        .sort((a, b) => b.clock_in.localeCompare(a.clock_in))[0] || null
    );
  }, [myEmployee, punches]);

  const myOpenBreak = useMemo(() => {
    if (!myOpenPunch) return null;
    return (
      breaks
        .filter((entry) => entry.punch_id === myOpenPunch.id && !entry.end_time)
        .sort((a, b) => b.start_time.localeCompare(a.start_time))[0] || null
    );
  }, [breaks, myOpenPunch]);

  const myBreaksForOpenPunch = useMemo(() => {
    if (!myOpenPunch) return [];
    return breaks
      .filter((entry) => entry.punch_id === myOpenPunch.id)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [breaks, myOpenPunch]);

  const myWorkedMinutes = useMemo(() => {
    if (!myOpenPunch) return 0;
    const clockInMs = new Date(myOpenPunch.clock_in).getTime();
    if (Number.isNaN(clockInMs)) return 0;
    const grossMinutes = Math.max(0, (clockNowMs - clockInMs) / MINUTE_MS);
    const unpaidMinutes = myBreaksForOpenPunch.reduce((total, entry) => {
      const durationMinutes = getBreakDurationMinutes(entry, clockNowMs);
      return isBreakUnpaid(entry, durationMinutes) ? total + durationMinutes : total;
    }, 0);
    return Math.max(0, grossMinutes - unpaidMinutes);
  }, [clockNowMs, myBreaksForOpenPunch, myOpenPunch]);

  const myUnpaidBreakMinutesForOpenPunch = useMemo(
    () =>
      myBreaksForOpenPunch.reduce((total, entry) => {
        const durationMinutes = getBreakDurationMinutes(entry, clockNowMs);
        return isBreakUnpaid(entry, durationMinutes) ? total + durationMinutes : total;
      }, 0),
    [clockNowMs, myBreaksForOpenPunch],
  );

  const myOpenBreakExpectedMinutes = useMemo(() => (myOpenBreak ? getBreakExpectedMinutes(myOpenBreak) : 0), [myOpenBreak]);
  const myOpenBreakElapsedMinutes = useMemo(
    () => (myOpenBreak ? getBreakDurationMinutes(myOpenBreak, clockNowMs) : 0),
    [clockNowMs, myOpenBreak],
  );
  const myOpenBreakRemainingMinutes = useMemo(() => {
    if (!myOpenBreak || myOpenBreakExpectedMinutes <= 0) return 0;
    return Math.max(0, myOpenBreakExpectedMinutes - myOpenBreakElapsedMinutes);
  }, [myOpenBreak, myOpenBreakElapsedMinutes, myOpenBreakExpectedMinutes]);
  const canEndMyOpenBreak = !myOpenBreak || myOpenBreakRemainingMinutes <= 0;

  const myPunchIdsToday = useMemo(() => {
    if (!myEmployee) return new Set<string>();
    return new Set(
      punches
        .filter((punch) => punch.employee_id === myEmployee.id && toDateKey(punch.clock_in) === todayKey)
        .map((punch) => punch.id),
    );
  }, [myEmployee, punches, todayKey]);

  const myLatestPunchToday = useMemo(() => {
    if (!myEmployee) return null;
    return (
      punches
        .filter((punch) => punch.employee_id === myEmployee.id && toDateKey(punch.clock_in) === todayKey)
        .sort((a, b) => String(b.clock_in || '').localeCompare(String(a.clock_in || '')))[0] || null
    );
  }, [myEmployee, punches, todayKey]);

  const myLatestPunchBreaks = useMemo(() => {
    if (!myLatestPunchToday) return [];
    return breaks.filter((entry) => entry.punch_id === myLatestPunchToday.id);
  }, [breaks, myLatestPunchToday]);

  const myLatestPunchWorkedMinutes = useMemo(
    () =>
      myLatestPunchToday
        ? getPunchWorkedMinutes(myLatestPunchToday, myLatestPunchBreaks, clockNowMs)
        : 0,
    [clockNowMs, myLatestPunchBreaks, myLatestPunchToday],
  );

  const myCompletedBreaksToday = useMemo(
    () =>
      breaks
        .filter((entry) => Boolean(entry.end_time) && myPunchIdsToday.has(entry.punch_id))
        .sort((a, b) => String(b.end_time || '').localeCompare(String(a.end_time || ''))),
    [breaks, myPunchIdsToday],
  );

  const myCurrentShift = useMemo(() => {
    if (myOpenPunch) {
      return shifts.find((shift) => shift.id === myOpenPunch.shift_id) || null;
    }
    return myShiftsToday[0] || null;
  }, [myOpenPunch, myShiftsToday, shifts]);

  const weeklyShifts = useMemo(() => {
    const base = shifts
      .filter((shift) => {
        const start = new Date(shift.start_time).getTime();
        if (Number.isNaN(start)) return false;
        return start >= currentWeekStart.getTime() && start < currentWeekEnd.getTime();
      })
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    if (capabilities.canManageSchedule) return base;
    if (!myEmployee) return [];
    return base.filter((shift) => shift.employee_id === myEmployee.id);
  }, [capabilities.canManageSchedule, currentWeekEnd, currentWeekStart, myEmployee, shifts]);

  const weeklyRoleRankByEmployeeId = useMemo(() => {
    const rankByEmployee: Record<string, number> = {};

    weeklyShifts.forEach((shift) => {
      const rank = roleOrderIndexById[shift.role_id] ?? Number.MAX_SAFE_INTEGER;
      const current = rankByEmployee[shift.employee_id];
      if (current === undefined || rank < current) {
        rankByEmployee[shift.employee_id] = rank;
      }
    });

    return rankByEmployee;
  }, [roleOrderIndexById, weeklyShifts]);

  const weeklyScheduleEmployees = useMemo(() => {
    if (!capabilities.canManageSchedule) {
      return myEmployee ? [myEmployee] : [];
    }

    const employeeIdsWithShiftsOrTimeOff = new Set(weeklyShifts.map((shift) => shift.employee_id));

    employees.forEach((employee) => {
      const hasApprovedTimeOffInWeek = weekDateKeys.some(
        (dateKey) => (approvedTimeOffByEmployeeDate[`${employee.id}::${dateKey}`] || []).length > 0,
      );
      if (hasApprovedTimeOffInWeek) {
        employeeIdsWithShiftsOrTimeOff.add(employee.id);
      }
    });

    return employees
      .filter((employee) => employeeIdsWithShiftsOrTimeOff.has(employee.id))
      .sort((a, b) => {
        const assignmentsA = (employeeRoleAssignmentsByEmployeeId[a.id] || []).filter(
          (assignment) => assignment.active !== false,
        );
        const assignmentsB = (employeeRoleAssignmentsByEmployeeId[b.id] || []).filter(
          (assignment) => assignment.active !== false,
        );

        const primaryA = assignmentsA.find((assignment) => Boolean(assignment.primary_role)) || assignmentsA[0];
        const primaryB = assignmentsB.find((assignment) => Boolean(assignment.primary_role)) || assignmentsB[0];

        const primaryRankA = primaryA ? roleOrderIndexById[primaryA.role_id] ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
        const primaryRankB = primaryB ? roleOrderIndexById[primaryB.role_id] ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;

        const rankA = Math.min(primaryRankA, weeklyRoleRankByEmployeeId[a.id] ?? Number.MAX_SAFE_INTEGER);
        const rankB = Math.min(primaryRankB, weeklyRoleRankByEmployeeId[b.id] ?? Number.MAX_SAFE_INTEGER);

        if (rankA !== rankB) return rankA - rankB;
        return a.name.localeCompare(b.name);
      });
  }, [
    capabilities.canManageSchedule,
    employeeRoleAssignmentsByEmployeeId,
    employees,
    myEmployee,
    roleOrderIndexById,
    approvedTimeOffByEmployeeDate,
    weekDateKeys,
    weeklyRoleRankByEmployeeId,
    weeklyShifts,
  ]);

  const weeklyShiftsByEmployeeAndDate = useMemo(() => {
    const grouped: Record<string, WorkforceShift[]> = {};

    weeklyShifts.forEach((shift) => {
      const dateKey = toDateKey(shift.start_time);
      const cellKey = `${shift.employee_id}::${dateKey}`;
      if (!grouped[cellKey]) grouped[cellKey] = [];
      grouped[cellKey].push(shift);
    });

    Object.values(grouped).forEach((cellShifts) => {
      cellShifts.sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    return grouped;
  }, [weeklyShifts]);

  const refreshAfterAction = useCallback(async () => {
    if (!currentUserId) return;
    await loadDashboardData(currentUserId, currentUserEmail);
  }, [currentUserEmail, currentUserId, loadDashboardData]);

  const createWorkforceEvent = useCallback(
    async (
      eventType: string,
      subjectType: string,
      subjectId: string,
      metadata: Record<string, unknown> = {},
    ) => {
      const { error } = await supabase.from('workforce_events').insert([
        {
          event_type: eventType,
          actor_id: currentUserId || null,
          subject_type: subjectType,
          subject_id: subjectId,
          location_id: 'wf_loc_main',
          timestamp: new Date().toISOString(),
          metadata_json: metadata,
          correlation_id: `corr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        },
      ]);
      if (error) {
        throw new Error(error.message || 'Failed to write workforce event');
      }
    },
    [currentUserId],
  );

  useEffect(() => {
    if (!capabilities.canManageSchedule) return;
    if (!tasks.length) return;
    if (rollingTaskForwardRef.current) return;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const updates = tasks
      .map((task) => {
        if (normalizeTaskStatus(task.completion_status) !== 'open') return null;
        if (!task.due_time) return null;

        const nextDueTime = rollTaskDueTimeForwardToCurrentDay(task.due_time, todayStart);
        if (!nextDueTime || nextDueTime === task.due_time) return null;
        return { id: task.id, due_time: nextDueTime };
      })
      .filter((entry): entry is { id: string; due_time: string } => Boolean(entry));

    if (!updates.length) return;

    rollingTaskForwardRef.current = true;
    const rollForwardTasks = async () => {
      try {
        const results = await Promise.all(
          updates.map((entry) => supabase.from('workforce_tasks').update({ due_time: entry.due_time }).eq('id', entry.id)),
        );
        const firstError = results.find((result) => result.error)?.error;
        if (firstError) throw firstError;
        await refreshAfterAction();
      } catch (error) {
        console.error('Failed to roll open tasks to current day', error);
      } finally {
        rollingTaskForwardRef.current = false;
      }
    };

    void rollForwardTasks();
  }, [capabilities.canManageSchedule, refreshAfterAction, tasks]);

  const createManagerLogEntry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!capabilities.canManageSchedule) return;
    if (!logDraft.message.trim()) {
      alert('Log message is required.');
      return;
    }

    setSavingAction(true);
    try {
      const { error } = await supabase.from('workforce_log_entries').insert([
        {
          author_name: currentUserName || currentUserEmail || 'Manager',
          timestamp: new Date().toISOString(),
          location_id: 'wf_loc_main',
          category: logDraft.category,
          severity: logDraft.severity,
          message: logDraft.message.trim(),
        },
      ]);
      if (error) throw error;

      setLogDraft((current) => ({ ...current, message: '' }));
      setShowLogEntryForm(false);
      await refreshAfterAction();
    } catch (error) {
      alert(`Failed to add log entry: ${(error as Error).message}`);
    } finally {
      setSavingAction(false);
    }
  };

  const beginEditLogEntry = (entry: WorkforceLogEntry) => {
    if (!capabilities.canManageSchedule) return;
    setEditingLogEntryId(entry.id);
    setShowLogEntryForm(false);
    setLogEditDraft({
      category: normalizeLogCategory(entry.category),
      severity: normalizeLogPriority(entry.severity),
      message: String(entry.message || ''),
    });
  };

  const cancelEditLogEntry = () => {
    setEditingLogEntryId('');
    setLogEditDraft({
      category: 'notes',
      severity: 'low',
      message: '',
    });
  };

  const saveLogEntryEdit = async (entryId: string) => {
    if (!capabilities.canManageSchedule) return;
    if (!logEditDraft.message.trim()) {
      alert('Log message is required.');
      return;
    }

    setSavingAction(true);
    try {
      const { error } = await supabase
        .from('workforce_log_entries')
        .update({
          category: logEditDraft.category,
          severity: logEditDraft.severity,
          message: logEditDraft.message.trim(),
        })
        .eq('id', entryId);
      if (error) throw error;

      cancelEditLogEntry();
      await refreshAfterAction();
    } catch (error) {
      alert(`Failed to update log entry: ${(error as Error).message}`);
    } finally {
      setSavingAction(false);
    }
  };

  const deleteLogEntry = async (entryId: string) => {
    if (!capabilities.canManageSchedule) return;
    const confirmed = window.confirm('Delete this activity log entry?');
    if (!confirmed) return;

    setSavingAction(true);
    try {
      const { error } = await supabase.from('workforce_log_entries').delete().eq('id', entryId);
      if (error) throw error;

      if (editingLogEntryId === entryId) {
        cancelEditLogEntry();
      }
      await refreshAfterAction();
    } catch (error) {
      alert(`Failed to delete log entry: ${(error as Error).message}`);
    } finally {
      setSavingAction(false);
    }
  };

  const createTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!capabilities.canManageSchedule) return;
    if (!taskDraft.title.trim()) {
      alert('Task title is required.');
      return;
    }
    if (!taskDraft.assigned_employee_id) {
      alert('Please assign a team member.');
      return;
    }

    const dueDate = taskDraft.due_date || new Date().toISOString().slice(0, 10);
    const dueClock = taskDraft.due_time || '18:00';
    const dueTime = `${dueDate}T${dueClock}:00`;

    setSavingAction(true);
    try {
      const { error } = await supabase.from('workforce_tasks').insert([
        {
          title: taskDraft.title.trim(),
          assigned_employee_id: taskDraft.assigned_employee_id,
          location_id: 'wf_loc_main',
          due_time: dueTime,
          completion_status: 'open',
          critical: taskDraft.critical,
        },
      ]);
      if (error) throw error;

      setTaskDraft((current) => ({ ...current, title: '', critical: false }));
      setShowTaskForm(false);
      await refreshAfterAction();
    } catch (error) {
      alert(`Failed to create task: ${(error as Error).message}`);
    } finally {
      setSavingAction(false);
    }
  };

  const beginEditMyTimeOffRequest = (request: WorkforceTimeOffRequest) => {
    if (!myEmployee || request.employee_id !== myEmployee.id) {
      alert('You can only edit your own request.');
      return;
    }
    setEditingPtoRequestId(request.id);
    setPtoRequestDraft({
      request_type: String(request.request_type || 'pto').toLowerCase() === 'sick' ? 'sick' : 'pto',
      start_date: request.start_date,
      end_date: request.end_date,
      notes: String(request.notes || ''),
    });
    setShowPtoRequestForm(true);
  };

  const cancelEditMyTimeOffRequest = () => {
    setEditingPtoRequestId('');
    setPtoRequestDraft(buildPtoRequestDraft());
    setShowPtoRequestForm(false);
  };

  const adjustMyPtoBalance = async (deltaHours: number) => {
    if (!myEmployee || !Number.isFinite(deltaHours) || deltaHours === 0) return;

    const accruedHours = Number(myPtoBalance?.accrued_hours || 80);
    const currentUsedHours = Number(myPtoBalance?.used_hours || 0);
    const nextUsedHours = Math.max(0, currentUsedHours + deltaHours);
    const nextAvailableHours = Math.max(0, accruedHours - nextUsedHours);

    if (myPtoBalance?.id) {
      const { error } = await supabase
        .from('workforce_pto_balances')
        .update({
          used_hours: nextUsedHours,
          available_hours: nextAvailableHours,
          pto_unit: myPtoUnit,
          updated_at: new Date().toISOString(),
        })
        .eq('id', myPtoBalance.id);
      if (error) throw error;
      return;
    }

    if (nextUsedHours <= 0) return;

    const { error } = await supabase.from('workforce_pto_balances').insert([
      {
        employee_id: myEmployee.id,
        accrued_hours: accruedHours,
        used_hours: nextUsedHours,
        available_hours: nextAvailableHours,
        pto_unit: myPtoUnit,
        updated_at: new Date().toISOString(),
      },
    ]);
    if (error) throw error;
  };

  const saveMyTimeOffRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!myEmployee) {
      alert('Your login is not linked to an employee profile yet.');
      return;
    }

    const existing =
      editingPtoRequestId
        ? timeOffRequests.find((request) => request.id === editingPtoRequestId && request.employee_id === myEmployee.id) || null
        : null;
    if (editingPtoRequestId && !existing) {
      alert('You can only edit your own request.');
      return;
    }

    if (!ptoRequestDraft.start_date || !ptoRequestDraft.end_date) {
      alert('Start and end dates are required.');
      return;
    }
    if (ptoRequestDraft.end_date < ptoRequestDraft.start_date) {
      alert('End date cannot be before start date.');
      return;
    }
    if (ptoRequestDraft.start_date < todayKey) {
      alert('Only current or future dates can be requested from Today.');
      return;
    }

    const requestedDays = getInclusiveDateSpanDays(ptoRequestDraft.start_date, ptoRequestDraft.end_date);
    if (requestedDays <= 0) {
      alert('Select a valid date range.');
      return;
    }
    const requestDisplayAmount = myPtoUnit === 'days' ? requestedDays : requestedDays * PTO_HOURS_PER_DAY;
    const requestHours = ptoDisplayToHours(requestDisplayAmount, myPtoUnit);
    if (!Number.isFinite(requestHours) || requestHours <= 0) {
      alert('Could not calculate request amount from selected dates.');
      return;
    }

    const requestType = String(ptoRequestDraft.request_type || 'pto').toLowerCase();
    const approvedPtoHoursBeingEdited =
      existing &&
      normalizeTimeOffStatus(existing.status) === 'approved' &&
      String(existing.request_type || '').toLowerCase() === 'pto'
        ? Number(existing.hours || 0)
        : 0;
    const effectiveAvailableHours = Number(myPtoBalance?.available_hours || 0) + approvedPtoHoursBeingEdited;
    if (requestType === 'pto' && requestHours > effectiveAvailableHours) {
      alert('Requested PTO exceeds your available balance.');
      return;
    }

    if (requestType !== 'sick') {
      const overlappingBlock = activeTimeOffBlocks.find((block) =>
        rangesOverlap(ptoRequestDraft.start_date, ptoRequestDraft.end_date, block.start_date, block.end_date),
      );
      if (overlappingBlock) {
        alert(
          `Requests are blocked for ${overlappingBlock.start_date} to ${overlappingBlock.end_date}${overlappingBlock.reason ? ` (${overlappingBlock.reason})` : ''}.`,
        );
        return;
      }

      const overlappingHoliday = activeCompanyHolidays.find((holiday) =>
        rangesOverlap(ptoRequestDraft.start_date, ptoRequestDraft.end_date, holiday.holiday_date, holiday.holiday_date),
      );
      if (overlappingHoliday) {
        alert(`"${overlappingHoliday.name}" is a company holiday. Request is not needed for that date.`);
        return;
      }
    }

    const payload = {
      request_type: requestType,
      start_date: ptoRequestDraft.start_date,
      end_date: ptoRequestDraft.end_date,
      hours: requestHours,
      notes: ptoRequestDraft.notes.trim() || null,
    };

    setSavingAction(true);
    try {
      if (editingPtoRequestId) {
        const previousStatus = normalizeTimeOffStatus(existing?.status);
        const { error } = await supabase
          .from('workforce_time_off_requests')
          .update({
            ...payload,
            status: 'pending',
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPtoRequestId)
          .eq('employee_id', myEmployee.id);
        if (error) throw error;

        if (approvedPtoHoursBeingEdited > 0) {
          await adjustMyPtoBalance(-approvedPtoHoursBeingEdited);
        }

        await createWorkforceEvent('TIME_OFF_REQUEST_EDITED_PENDING', 'time_off_request', editingPtoRequestId, {
          employee_id: myEmployee.id,
          previous_status: previousStatus,
          status: 'pending',
          request_type: requestType,
          start_date: ptoRequestDraft.start_date,
          end_date: ptoRequestDraft.end_date,
          channels: ['in_app', 'email'],
          recipient_email: myEmployee.email || currentUserEmail || null,
        });
      } else {
        const { data: createdRequest, error } = await supabase.from('workforce_time_off_requests').insert([
          {
            employee_id: myEmployee.id,
            ...payload,
            status: 'pending',
          },
        ]).select('*').single();
        if (error) throw error;

        await createWorkforceEvent('TIME_OFF_REQUEST_SUBMITTED', 'time_off_request', String(createdRequest.id), {
          employee_id: myEmployee.id,
          status: 'pending',
          request_type: requestType,
          start_date: ptoRequestDraft.start_date,
          end_date: ptoRequestDraft.end_date,
          channels: ['in_app', 'email'],
          recipient_email: myEmployee.email || currentUserEmail || null,
        });
      }

      setEditingPtoRequestId('');
      setShowPtoRequestForm(false);
      setPtoRequestDraft(buildPtoRequestDraft());
      await refreshAfterAction();
    } catch (error) {
      alert(`Failed to save request: ${(error as Error).message}`);
    } finally {
      setSavingAction(false);
    }
  };

  const deleteMyTimeOffRequest = async (request: WorkforceTimeOffRequest) => {
    if (!myEmployee || request.employee_id !== myEmployee.id) {
      alert('You can only delete your own request.');
      return;
    }
    if (!window.confirm('Delete this PTO request?')) return;

    setSavingAction(true);
    try {
      const approvedPtoHoursBeingDeleted =
        normalizeTimeOffStatus(request.status) === 'approved' &&
        String(request.request_type || '').toLowerCase() === 'pto'
          ? Number(request.hours || 0)
          : 0;

      const { error } = await supabase
        .from('workforce_time_off_requests')
        .delete()
        .eq('id', request.id)
        .eq('employee_id', myEmployee.id);
      if (error) throw error;

      if (approvedPtoHoursBeingDeleted > 0) {
        await adjustMyPtoBalance(-approvedPtoHoursBeingDeleted);
      }

      if (editingPtoRequestId === request.id) {
        cancelEditMyTimeOffRequest();
      }

      await createWorkforceEvent('TIME_OFF_REQUEST_DELETED', 'time_off_request', request.id, {
        employee_id: myEmployee.id,
        previous_status: normalizeTimeOffStatus(request.status),
        request_type: request.request_type,
        start_date: request.start_date,
        end_date: request.end_date,
        channels: ['in_app', 'email'],
        recipient_email: myEmployee.email || currentUserEmail || null,
      });
      await refreshAfterAction();
    } catch (error) {
      alert(`Failed to delete request: ${(error as Error).message}`);
    } finally {
      setSavingAction(false);
    }
  };

  const canCurrentUserCompleteTask = (task: WorkforceTask) => {
    if (capabilities.canManageSchedule) return true;
    if (!myEmployee?.id) return false;
    return String(task.assigned_employee_id || '') === myEmployee.id;
  };

  const markTaskCompleted = async (task: WorkforceTask) => {
    if (normalizeTaskStatus(task.completion_status) !== 'open') return;
    if (!canCurrentUserCompleteTask(task)) return;

    const actorName = myEmployee?.name || currentUserName || currentUserEmail || 'Team Member';

    setSavingAction(true);
    try {
      const { error } = await supabase
        .from('workforce_tasks')
        .update({
          completion_status: 'completed',
          completed_by: actorName,
          completed_at: new Date().toISOString(),
        })
        .eq('id', task.id);
      if (error) throw error;

      await refreshAfterAction();
    } catch (error) {
      alert(`Failed to complete task: ${(error as Error).message}`);
    } finally {
      setSavingAction(false);
    }
  };

  const verifyTask = async (task: WorkforceTask) => {
    if (!capabilities.canManageSchedule || !isSupervisorProfile) {
      alert('Only supervisor profiles can verify tasks.');
      return;
    }
    const status = normalizeTaskStatus(task.completion_status);
    if (status === 'verified') return;
    if (status !== 'completed') {
      alert('Task must be marked completed before verification.');
      return;
    }

    const actorName = currentUserName || currentUserEmail || 'Supervisor';
    const verifiedAt = new Date().toISOString();

    setSavingAction(true);
    try {
      const { error } = await supabase
        .from('workforce_tasks')
        .update({
          completion_status: 'verified',
          verified_by: actorName,
          verified_at: verifiedAt,
          completed_by: task.completed_by || actorName,
          completed_at: task.completed_at || verifiedAt,
        })
        .eq('id', task.id);
      if (error) throw error;

      await refreshAfterAction();
    } catch (error) {
      alert(`Failed to verify task: ${(error as Error).message}`);
    } finally {
      setSavingAction(false);
    }
  };

  const ensureShiftForClockIn = async () => {
    if (!myEmployee) throw new Error('No workforce profile is linked to this login.');

    if (myCurrentShift) {
      return myCurrentShift;
    }

    const myAssignments = (employeeRoleAssignmentsByEmployeeId[myEmployee.id] || []).filter(
      (assignment) => assignment.active !== false,
    );
    const primaryAssignment =
      myAssignments.find((assignment) => Boolean(assignment.primary_role)) || myAssignments[0];
    const roleId = primaryAssignment?.role_id || roles[0]?.id || 'wf_role_server';
    const roleRate = Number(primaryAssignment?.hourly_rate || roleById[roleId]?.hourly_rate || 24);
    const now = new Date();
    const end = addDays(now, 0);
    end.setHours(now.getHours() + 8);

    const { data, error } = await supabase
      .from('workforce_shifts')
      .insert([
        {
          employee_id: myEmployee.id,
          role_id: roleId,
          location_id: 'wf_loc_main',
          station_id: null,
          start_time: now.toISOString(),
          end_time: end.toISOString(),
          break_rules: 'ca_standard',
          wage_rate: roleRate,
          status: 'in_progress',
        },
      ])
      .select('*')
      .single();

    if (error) throw error;
    return data as WorkforceShift;
  };

  const clockIn = async () => {
    if (!myEmployee) {
      alert('No workforce profile is linked to this login.');
      return;
    }
    if (myOpenPunch) return;

    setSavingAction(true);
    try {
      const shift = await ensureShiftForClockIn();
      const { error } = await supabase.from('workforce_punches').insert([
        {
          employee_id: myEmployee.id,
          shift_id: shift.id,
          clock_in: new Date().toISOString(),
          status: 'open',
          verified_location: true,
          verified_photo: false,
        },
      ]);
      if (error) throw error;

      await supabase.from('workforce_shifts').update({ status: 'in_progress' }).eq('id', shift.id);
      await refreshAfterAction();
    } catch (error) {
      alert(`Clock in failed: ${(error as Error).message}`);
    } finally {
      setSavingAction(false);
    }
  };

  const clockOut = async () => {
    if (!myOpenPunch) return;
    if (myOpenBreak) {
      const elapsedMinutes = getBreakDurationMinutes(myOpenBreak);
      const requiredMinutes = getBreakExpectedMinutes(myOpenBreak);
      if (requiredMinutes > 0 && elapsedMinutes < requiredMinutes) {
        alert(
          `You cannot clock out yet. Finish your ${requiredMinutes}-minute break first (${Math.ceil(requiredMinutes - elapsedMinutes)} minute(s) remaining).`,
        );
        return;
      }
    }

    setSavingAction(true);
    try {
      if (myOpenBreak) {
        await supabase
          .from('workforce_breaks')
          .update({ end_time: new Date().toISOString() })
          .eq('id', myOpenBreak.id);
      }

      const { error } = await supabase
        .from('workforce_punches')
        .update({ clock_out: new Date().toISOString(), status: 'closed' })
        .eq('id', myOpenPunch.id);
      if (error) throw error;

      await supabase.from('workforce_shifts').update({ status: 'completed' }).eq('id', myOpenPunch.shift_id);
      await refreshAfterAction();
    } catch (error) {
      alert(`Clock out failed: ${(error as Error).message}`);
    } finally {
      setSavingAction(false);
    }
  };

  const startBreak = async (type: 'rest_15_paid' | 'meal_30_unpaid') => {
    if (!myOpenPunch) {
      alert('Clock in before starting a break.');
      return;
    }
    if (myOpenBreak) {
      alert('End the current break first.');
      return;
    }

    const expectedMinutes = type === 'rest_15_paid' ? 15 : 30;
    const paidBreak = type === 'rest_15_paid';

    setSavingAction(true);
    try {
      const { error } = await supabase.from('workforce_breaks').insert([
        {
          punch_id: myOpenPunch.id,
          start_time: new Date().toISOString(),
          break_type: type,
          expected_minutes: expectedMinutes,
          paid_break: paidBreak,
        },
      ]);
      if (error) throw error;
      await refreshAfterAction();
    } catch (error) {
      alert(`Failed to start break: ${(error as Error).message}`);
    } finally {
      setSavingAction(false);
    }
  };

  const endBreak = async () => {
    if (!myOpenBreak) return;
    const elapsedMinutes = getBreakDurationMinutes(myOpenBreak);
    const requiredMinutes = getBreakExpectedMinutes(myOpenBreak);
    if (requiredMinutes > 0 && elapsedMinutes < requiredMinutes) {
      alert(
        `This break must be at least ${requiredMinutes} minutes. Please wait ${Math.ceil(requiredMinutes - elapsedMinutes)} more minute(s).`,
      );
      return;
    }

    setSavingAction(true);
    try {
      const { error } = await supabase
        .from('workforce_breaks')
        .update({ end_time: new Date().toISOString() })
        .eq('id', myOpenBreak.id);
      if (error) throw error;
      await refreshAfterAction();
    } catch (error) {
      alert(`Failed to end break: ${(error as Error).message}`);
    } finally {
      setSavingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600" />
      </div>
    );
  }

  const canSeeToday = canAccessSection(capabilities, 'operations');

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-none px-4 py-6 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Today</h1>
          <p className="text-gray-600 font-garamond">
            Live view of time clock, staffing, schedules, tasks, and activity.
          </p>
        </div>

        {!hasAnySectionAccess(capabilities) && (
          <div className="bg-white border border-gray-100 rounded-lg shadow p-6 text-gray-600">
            No dashboard sections are assigned to your account yet.
          </div>
        )}

        {!canSeeToday && hasAnySectionAccess(capabilities) && (
          <div className="bg-white border border-gray-100 rounded-lg shadow p-6 text-gray-600">
            Your account currently has no access to the Today dashboard.
          </div>
        )}

        {canSeeToday && (
          <section className="bg-white rounded-lg shadow p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm md:text-base font-semibold text-gray-900">View by time zone</div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedUsTimeZone}
                  onChange={(event) => {
                    setSelectedUsTimeZone(event.target.value);
                    setScheduleTimeDisplayMode('eastern');
                  }}
                  className={`px-3 py-1.5 text-sm rounded-lg border ${scheduleTimeDisplayMode === 'eastern' ? 'border-ocean-300 bg-ocean-50 text-ocean-900' : 'border-gray-200 text-gray-700 bg-white'}`}
                  title="Show schedule times in selected US timezone"
                >
                  {US_SCHEDULE_TIME_ZONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setScheduleTimeDisplayMode('local')}
                  className={`px-3 py-1.5 text-sm rounded-lg border ${scheduleTimeDisplayMode === 'local' ? 'bg-ocean-600 border-ocean-600 text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                  title="Show schedule times in your local timezone"
                >
                  Local
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {scheduleTimeDisplayMode === 'local'
                ? `Current view: Local (${localScheduleTimeZone})`
                : `Current view: ${selectedUsTimeZoneLabel}`}
            </div>
          </section>
        )}

        {canSeeToday && (
          <section className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-display font-bold text-gray-900 flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-ocean-600" />
                My Time Clock
              </h2>
              {myEmployee && (
                <div className="text-sm text-gray-500">
                  {myEmployee.name} {myEmployee.title ? `• ${myEmployee.title}` : ''}
                </div>
              )}
            </div>

            {!myEmployee && (
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
                This login is not linked to a workforce employee profile yet.
              </div>
            )}

            {myEmployee && (
              <>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-gray-100 p-3">
                    <div className="text-xs uppercase tracking-wide text-gray-500">Current Shift</div>
                    <div className="text-sm font-medium text-gray-900 mt-1">
                      {myCurrentShift
                        ? formatSelectedScheduleWindow(myCurrentShift.start_time, myCurrentShift.end_time)
                        : 'No shift found'}
                    </div>
                    {myLatestPunchToday && (
                      <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                        <div className="text-xs text-gray-700">
                          Clock In: {formatTimeOnly(myLatestPunchToday.clock_in) || '-'}
                        </div>
                        <div className="text-xs text-gray-700">
                          Clock Out: {myLatestPunchToday.clock_out ? formatTimeOnly(myLatestPunchToday.clock_out) : '--'}
                        </div>
                        <div className="text-xs font-medium text-gray-900">
                          Total Hours: {formatHoursTotalLabel(myLatestPunchWorkedMinutes)}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg border border-gray-100 p-3">
                    <div className="text-xs uppercase tracking-wide text-gray-500">Clock Status</div>
                    <div className="text-sm font-medium text-gray-900 mt-1">
                      {myOpenPunch
                        ? `Clocked In${formatTimeOnly(myOpenPunch.clock_in) ? ` at ${formatTimeOnly(myOpenPunch.clock_in)}` : ''}`
                        : 'Clocked Out'}
                    </div>
                    {myOpenPunch && (
                      <div className="text-xs text-gray-600 mt-1">
                        Worked: {formatDurationLabel(myWorkedMinutes)}
                        {myUnpaidBreakMinutesForOpenPunch > 0
                          ? ` (includes ${formatDurationLabel(myUnpaidBreakMinutesForOpenPunch)} unpaid break)`
                          : ''}
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg border border-gray-100 p-3">
                    <div className="text-xs uppercase tracking-wide text-gray-500">Break Status</div>
                    <div className="text-sm font-medium text-gray-900 mt-1">
                      {myOpenBreak
                        ? `On break (${formatBreakTypeLabel(myOpenBreak)})${formatTimeOnly(myOpenBreak.start_time) ? ` since ${formatTimeOnly(myOpenBreak.start_time)}` : ''} • ${formatDurationLabel(myOpenBreakElapsedMinutes)} elapsed`
                        : 'Not on break'}
                    </div>
                    {myCompletedBreaksToday.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="text-[11px] uppercase tracking-wide text-gray-500">Breaks taken today</div>
                        <div className="mt-1 space-y-1">
                          {myCompletedBreaksToday.slice(0, 3).map((entry) => (
                            <div key={entry.id} className="text-xs text-gray-700">
                              {formatBreakTypeLabel(entry)}: {formatTimeWindow(entry.start_time, entry.end_time || entry.start_time)} ({formatDurationLabel(getBreakDurationMinutes(entry, clockNowMs))})
                            </div>
                          ))}
                          {myCompletedBreaksToday.length > 3 && (
                            <div className="text-xs text-gray-500">+{myCompletedBreaksToday.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!myOpenPunch ? (
                    <button
                      type="button"
                      onClick={() => void clockIn()}
                      disabled={savingAction}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      <PlayCircle className="h-4 w-4" />
                      Clock In
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void clockOut()}
                      disabled={savingAction}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      <PauseCircle className="h-4 w-4" />
                      Clock Out
                    </button>
                  )}

                  {myOpenPunch && !myOpenBreak && (
                    <>
                      <button
                        type="button"
                        onClick={() => void startBreak('rest_15_paid')}
                        disabled={savingAction}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-ocean-200 text-ocean-700 hover:bg-ocean-50 disabled:opacity-60"
                      >
                        15m Paid Break
                      </button>
                      <button
                        type="button"
                        onClick={() => void startBreak('meal_30_unpaid')}
                        disabled={savingAction}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                      >
                        30m Unpaid Break
                      </button>
                    </>
                  )}

                  {myOpenBreak && (
                    <>
                      <button
                        type="button"
                        onClick={() => void endBreak()}
                        disabled={savingAction || !canEndMyOpenBreak}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-200 text-amber-800 hover:bg-amber-50 disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        End Break
                      </button>
                      {!canEndMyOpenBreak && (
                        <div className="self-center text-xs text-amber-700">
                          Break can end in {formatDurationLabel(myOpenBreakRemainingMinutes)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {canSeeToday && (
          <section className="order-1 grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500 uppercase tracking-wide">Today&apos;s Shifts</div>
              <div className="text-2xl font-display font-bold text-gray-900">{shiftsToday.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500 uppercase tracking-wide">Clocked In</div>
              <div className="text-2xl font-display font-bold text-gray-900">{openPunches.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500 uppercase tracking-wide">Open Alerts</div>
              <div className="text-2xl font-display font-bold text-gray-900">{stationAlerts.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500 uppercase tracking-wide">My PTO Available</div>
              <div className="text-2xl font-display font-bold text-gray-900">
                {formatPtoValue(myPtoAvailableDisplay)}
                {myPtoUnit === 'days' ? 'd' : 'h'}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500 uppercase tracking-wide">Next Company Holiday</div>
              {nextCompanyHoliday ? (
                <>
                  <div className="text-lg font-display font-bold text-gray-900">{nextCompanyHoliday.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{formatDateLabel(nextCompanyHoliday.holiday_date)}</div>
                </>
              ) : (
                <div className="text-base font-semibold text-gray-500">None Scheduled</div>
              )}
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500 uppercase tracking-wide">Missed Punches</div>
              <div className="text-2xl font-display font-bold text-gray-900">{missedPunchDigest.length}</div>
              <div className="text-xs text-gray-500 mt-1">Today digest</div>
            </div>
          </section>
        )}

        {canSeeToday && (
          <section className="order-3 space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-display font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-ocean-600" />
                  Today&apos;s Schedule by Department
                </h2>
                <div className="space-y-3">
                  {scheduleByDepartment.map(([departmentName, departmentShifts]) => (
                    <div key={departmentName} className="border border-gray-100 rounded-lg p-3">
                      <div className="font-semibold text-gray-900 mb-2">
                        {departmentName} ({departmentShifts.length})
                      </div>
                      <div className="space-y-1">
                        {departmentShifts
                          .slice()
                          .sort((a, b) => a.start_time.localeCompare(b.start_time))
                          .map((shift) => (
                            <div key={shift.id} className="text-sm text-gray-700">
                              {employeeById[shift.employee_id]?.name || 'Unassigned'} •{' '}
                              {formatSelectedScheduleWindow(shift.start_time, shift.end_time)}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                  {!scheduleByDepartment.length && (
                    <div className="text-sm text-gray-500">No shifts scheduled for today.</div>
                  )}
                  {approvedTimeOffToday.length > 0 && (
                    <div className="border border-amber-200 bg-amber-50 rounded-lg p-3">
                      <div className="text-xs uppercase tracking-wide text-amber-800 font-semibold mb-2">
                        Approved Time Off Today
                      </div>
                      <div className="space-y-1">
                        {approvedTimeOffToday.map((entry) => (
                          <div key={entry.employeeId} className="text-sm text-amber-900">
                            {entry.employeeName} • {entry.typeLabels.join(', ')}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-display font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-ocean-600" />
                  PTO Requests
                </h2>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-xs text-gray-500">Future requests only</div>
                  {myEmployee && (
                    <button
                      type="button"
                      onClick={() => {
                        if (showPtoRequestForm && !editingPtoRequestId) {
                          setShowPtoRequestForm(false);
                          return;
                        }
                        setEditingPtoRequestId('');
                        setPtoRequestDraft(buildPtoRequestDraft());
                        setShowPtoRequestForm(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-ocean-200 rounded-md text-ocean-700 hover:bg-ocean-50 text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      {showPtoRequestForm && !editingPtoRequestId ? 'Close' : 'Request More Time'}
                    </button>
                  )}
                </div>

                {!myEmployee && (
                  <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
                    Link this login to an employee profile to request time off.
                  </div>
                )}

                {showPtoRequestForm && myEmployee && (
                  <form onSubmit={(event) => void saveMyTimeOffRequest(event)} className="mb-3 grid gap-2 bg-gray-50 border border-gray-100 rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={ptoRequestDraft.request_type}
                        onChange={(event) => setPtoRequestDraft((current) => ({ ...current, request_type: event.target.value }))}
                        className="px-3 py-2 border rounded-lg"
                      >
                        <option value="sick">Sick Time</option>
                        <option value="pto">PTO</option>
                      </select>
                      <div className="px-3 py-2 border rounded-lg bg-white text-sm text-gray-700">
                        {formatPtoUnitLabel(myPtoUnit)} requested: {formatPtoValue(draftRequestedDisplayAmount)}
                        {myPtoUnit === 'days' ? 'd' : 'h'}
                      </div>
                    </div>
                    {editingPtoRequest && normalizeTimeOffStatus(editingPtoRequest.status) === 'approved' && (
                      <div className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5">
                        Editing an approved request will set it back to pending for review.
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={ptoRequestDraft.start_date}
                        onChange={(event) =>
                          setPtoRequestDraft((current) => ({
                            ...current,
                            start_date: event.target.value,
                            end_date: event.target.value,
                          }))
                        }
                        className="px-3 py-2 border rounded-lg"
                      />
                      <input
                        type="date"
                        value={ptoRequestDraft.end_date}
                        onChange={(event) => setPtoRequestDraft((current) => ({ ...current, end_date: event.target.value }))}
                        className="px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <input
                      value={ptoRequestDraft.notes}
                      onChange={(event) => setPtoRequestDraft((current) => ({ ...current, notes: event.target.value }))}
                      className="px-3 py-2 border rounded-lg"
                      placeholder="Notes (optional)"
                    />
                    <button
                      type="submit"
                      disabled={savingAction || draftRequestedDays <= 0}
                      className="px-3 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 disabled:opacity-60"
                    >
                      {editingPtoRequestId ? 'Save Changes' : 'Submit Request'}
                    </button>
                    <button
                      type="button"
                      onClick={() => cancelEditMyTimeOffRequest()}
                      disabled={savingAction}
                      className="px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </form>
                )}

                <div className="space-y-2">
                  {myUpcomingTimeOffRequests.map((request) => {
                    const status = normalizeTimeOffStatus(request.status);
                    const requestedDays = getInclusiveDateSpanDays(request.start_date, request.end_date);
                    const displayAmount =
                      requestedDays > 0
                        ? myPtoUnit === 'days'
                          ? requestedDays
                          : requestedDays * PTO_HOURS_PER_DAY
                        : ptoHoursToDisplay(Number(request.hours || 0), myPtoUnit);
                    const toneClass =
                      status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : status === 'denied'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-800';
                    return (
                      <div key={request.id} className="border border-gray-100 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{formatTimeOffTypeLabel(request.request_type)}</div>
                            <div className="text-xs text-gray-600">
                              {formatDateLabel(request.start_date)} to {formatDateLabel(request.end_date)}
                            </div>
                            <div className="text-xs text-gray-600 mt-0.5">
                              {formatPtoValue(displayAmount)}
                              {myPtoUnit === 'days' ? 'd' : 'h'}
                            </div>
                            {request.notes && <div className="text-xs text-gray-500 mt-1">{request.notes}</div>}
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium uppercase ${toneClass}`}>
                            {status}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => beginEditMyTimeOffRequest(request)}
                            disabled={savingAction}
                            className="px-2 py-1 text-xs rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-60"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteMyTimeOffRequest(request)}
                            disabled={savingAction}
                            className="px-2 py-1 text-xs rounded-md border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-60"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {!myUpcomingTimeOffRequests.length && (
                    <div className="text-sm text-gray-500">No future requests submitted yet.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-display font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-ocean-600" />
                {capabilities.canManageSchedule ? 'Weekly Schedule' : 'My Weekly Schedule'}
              </h2>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-gray-600">View range: this week + 3 weeks</div>
                <div className="inline-flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setWeeklyScheduleOffset((current) => Math.max(0, current - 1))}
                    disabled={!canViewPreviousScheduleWeek}
                    className="p-2 rounded-lg border border-gray-200 bg-white text-gray-700 disabled:opacity-40"
                    title="Previous week"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 min-w-[160px] text-center">
                    {weekRangeLabel}
                  </div>
                  <button
                    type="button"
                    onClick={() => setWeeklyScheduleOffset((current) => Math.min(3, current + 1))}
                    disabled={!canViewNextScheduleWeek}
                    className="p-2 rounded-lg border border-gray-200 bg-white text-gray-700 disabled:opacity-40"
                    title="Next week"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase w-44">Employee</th>
                      {weekDates.map((date) => (
                        <th key={date.toISOString()} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase min-w-[140px]">
                          {formatWeekday(date)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {weeklyScheduleEmployees.map((employee) => (
                      <tr key={employee.id}>
                        <td className="px-3 py-3 align-top font-medium text-gray-900 border-r border-gray-100">{employee.name}</td>
                        {weekDates.map((date) => {
                          const dateKey = date.toISOString().slice(0, 10);
                          const cellKey = `${employee.id}::${dateKey}`;
                          const dayShifts = weeklyShiftsByEmployeeAndDate[cellKey] || [];
                          const approvedRequests = approvedTimeOffByEmployeeDate[cellKey] || [];
                          const hasApprovedTimeOff = approvedRequests.length > 0;
                          const approvedTypeLabels = Array.from(
                            new Set(approvedRequests.map((request) => formatTimeOffTypeLabel(request.request_type))),
                          );

                          return (
                            <td
                              key={cellKey}
                              className={`px-3 py-2 align-top border-r border-gray-100 last:border-r-0 ${hasApprovedTimeOff ? 'bg-amber-50/60' : ''}`}
                            >
                              <div className="space-y-2">
                                {hasApprovedTimeOff && (
                                  <div className="text-[11px] uppercase tracking-wide font-semibold text-amber-800">
                                    Approved {approvedTypeLabels.join(' / ')}{approvedTypeLabels.length > 0 ? '' : ' Time Off'}
                                  </div>
                                )}
                                {dayShifts.length > 0 ? (
                                  dayShifts.map((shift) => (
                                    <div key={shift.id} className="rounded-md border border-gray-100 bg-gray-50 px-2 py-1.5">
                                      <div className="text-xs font-semibold text-gray-900">
                                        {formatSelectedScheduleWindow(shift.start_time, shift.end_time)}
                                      </div>
                                      <div className="text-[11px] text-gray-600">
                                        {roleById[shift.role_id]?.name || 'Role'}
                                      </div>
                                    </div>
                                  ))
                                ) : hasApprovedTimeOff ? (
                                  <div className="text-xs text-amber-800 py-1">No shift scheduled (time off)</div>
                                ) : (
                                  <div className="text-xs text-gray-400 py-1">Off</div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {!weeklyScheduleEmployees.length && (
                      <tr>
                        <td colSpan={weekDates.length + 1} className="px-3 py-4 text-sm text-gray-500 text-center">
                          No weekly schedule data available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-display font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-ocean-600" />
                Company Holidays
              </h2>
              <div className="space-y-2">
                {upcomingCompanyHolidays.map((holiday) => (
                  <div key={holiday.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-900">
                      {formatDateLabel(holiday.holiday_date)} - {holiday.name}
                    </div>
                    {holiday.notes && <div className="text-xs text-gray-500 mt-1">{holiday.notes}</div>}
                  </div>
                ))}
                {!upcomingCompanyHolidays.length && (
                  <div className="text-sm text-gray-500">No upcoming company holidays have been added yet.</div>
                )}
              </div>
            </div>
          </section>
        )}

        {canSeeToday && (
          <section className="order-2 grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-display font-bold text-gray-900 flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-ocean-600" />
                    Task Board
                  </h2>
                  <div className="text-xs text-gray-500 mt-1">Open alerts: {stationAlerts.length}</div>
                </div>
                {capabilities.canManageSchedule && (
                  <button
                    type="button"
                    onClick={() => setShowTaskForm((current) => !current)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-ocean-200 rounded-md text-ocean-700 hover:bg-ocean-50 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Task
                  </button>
                )}
              </div>

              {showTaskForm && capabilities.canManageSchedule && (
                <form onSubmit={(event) => void createTask(event)} className="grid grid-cols-1 gap-2 bg-gray-50 border border-gray-100 rounded-lg p-3">
                  <input
                    value={taskDraft.title}
                    onChange={(event) => setTaskDraft((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Task title"
                    className="px-3 py-2 border rounded-lg"
                    required
                  />
                  <select
                    value={taskDraft.assigned_employee_id}
                    onChange={(event) => setTaskDraft((current) => ({ ...current, assigned_employee_id: event.target.value }))}
                    className="px-3 py-2 border rounded-lg"
                    required
                  >
                    {!employees.length && <option value="">No team members available</option>}
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={taskDraft.due_date}
                      onChange={(event) => setTaskDraft((current) => ({ ...current, due_date: event.target.value }))}
                      className="px-3 py-2 border rounded-lg"
                    />
                    <input
                      type="time"
                      value={taskDraft.due_time}
                      onChange={(event) => setTaskDraft((current) => ({ ...current, due_time: event.target.value }))}
                      className="px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={taskDraft.critical}
                      onChange={(event) => setTaskDraft((current) => ({ ...current, critical: event.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    Critical task
                  </label>
                  <button
                    type="submit"
                    disabled={savingAction}
                    className="px-3 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 disabled:opacity-60"
                  >
                    Save Task
                  </button>
                </form>
              )}

              <div className="space-y-3">
                {visibleTaskGroups.map((group) => (
                  <div key={group.assigneeId} className="rounded-lg border border-gray-100 overflow-hidden">
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-gray-900">{group.assigneeName}</div>
                      <div className="text-xs text-gray-500">
                        {group.tasks.length} task{group.tasks.length === 1 ? '' : 's'}
                      </div>
                    </div>
                    <div className="p-2 space-y-2">
                      {group.tasks.map((task) => {
                        const status = normalizeTaskStatus(task.completion_status);
                        const completed = status === 'completed';
                        const isAlert = stationAlerts.some((alert) => alert.id === task.id);
                        const dueMs = task.due_time ? new Date(task.due_time).getTime() : Number.NaN;
                        const isOverdue =
                          status === 'open' && Number.isFinite(dueMs) && dueMs < Date.now();
                        const canCompleteTask = status === 'open' && canCurrentUserCompleteTask(task);
                        const canVerifyTask =
                          capabilities.canManageSchedule && isSupervisorProfile && status === 'completed';
                        const toneClass = completed
                          ? 'border-green-200 bg-green-50'
                          : isOverdue
                            ? 'border-red-200 bg-red-50'
                            : 'border-gray-100 bg-white';
                        const dueTextClass = completed ? 'text-green-700' : isOverdue ? 'text-red-700' : 'text-gray-500';

                        return (
                          <div key={task.id} className={`border rounded-lg p-3 flex items-start justify-between gap-4 ${toneClass}`}>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{task.title}</div>
                              <div className="text-xs text-gray-600">Assigned to {group.assigneeName}</div>
                              <div className={`text-xs mt-0.5 ${dueTextClass}`}>
                                {task.due_time ? `Due ${formatDateTime(task.due_time)}` : 'No due date'}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                {task.critical && (
                                  <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                                    Critical
                                  </span>
                                )}
                                {isAlert && status === 'open' && (
                                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                    <AlertTriangle className="h-3 w-3" />
                                    Alert
                                  </span>
                                )}
                                {isOverdue && (
                                  <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                    Overdue
                                  </span>
                                )}
                                {completed && (
                                  <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                    Completed, waiting verification
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1 min-w-[190px]">
                              <label className="flex items-center gap-2 text-xs text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={completed}
                                  disabled={savingAction || !canCompleteTask || completed}
                                  onChange={(event) => {
                                    if (event.target.checked) {
                                      void markTaskCompleted(task);
                                    }
                                  }}
                                  className="rounded border-gray-300"
                                />
                                Completed
                              </label>
                              <label className="flex items-center gap-2 text-xs text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={false}
                                  disabled={savingAction || !canVerifyTask}
                                  onChange={(event) => {
                                    if (event.target.checked) {
                                      void verifyTask(task);
                                    }
                                  }}
                                  className="rounded border-gray-300"
                                />
                                Verified By Supervisor
                              </label>
                              {completed ? (
                                <div className="text-[11px] text-green-700">Awaiting supervisor verification</div>
                              ) : isOverdue ? (
                                <div className="text-[11px] text-red-700">Past due</div>
                              ) : (
                                <div className="text-[11px] text-gray-500">Open</div>
                              )}
                              {completed && !isSupervisorProfile && (
                                <div className="text-[11px] text-gray-500">Supervisor profile required to verify.</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {!visibleTaskGroups.length && <div className="text-sm text-gray-500">No tasks yet.</div>}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-4 grid gap-3">
                <div className="rounded-lg border border-gray-100 p-3">
                  <div className="text-sm font-semibold text-gray-900">Missed Punch Digest</div>
                  <div className="text-xs text-gray-500 mt-0.5">Today only</div>
                  <div className="mt-2 space-y-1.5">
                    {missedPunchDigest.slice(0, 5).map((entry) => (
                      <div key={entry.id} className={`text-xs rounded-md px-2 py-1 ${entry.level === 'critical' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>
                        <span className="font-semibold mr-1">{entry.code}:</span>
                        {entry.message}
                      </div>
                    ))}
                    {missedPunchDigest.length === 0 && (
                      <div className="text-xs text-green-700 bg-green-50 rounded-md px-2 py-1">
                        No missed punch exceptions detected.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-100 p-3">
                  <div className="text-sm font-semibold text-gray-900">PTO Notifications</div>
                  <div className="text-xs text-gray-500 mt-0.5">Recent updates for your requests</div>
                  <div className="mt-2 space-y-1.5">
                    {myPtoNotifications.map((entry) => (
                      <div key={entry.id} className="rounded-md bg-gray-50 px-2 py-1.5">
                        <div className="text-xs text-gray-800">{entry.message}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{formatDateTime(entry.timestamp)}</div>
                      </div>
                    ))}
                    {myPtoNotifications.length === 0 && (
                      <div className="text-xs text-gray-500 bg-gray-50 rounded-md px-2 py-1">
                        No PTO notifications yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-display font-bold text-gray-900 flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-ocean-600" />
                  Daily Activity Log
                </h2>
                {capabilities.canManageSchedule && (
                  <button
                    type="button"
                    onClick={() => {
                      cancelEditLogEntry();
                      setShowLogEntryForm((current) => !current);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-ocean-200 rounded-md text-ocean-700 hover:bg-ocean-50 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Entry
                  </button>
                )}
              </div>

              {showLogEntryForm && capabilities.canManageSchedule && (
                <form onSubmit={(event) => void createManagerLogEntry(event)} className="mb-4 grid gap-2 bg-gray-50 border border-gray-100 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={logDraft.category}
                      onChange={(event) => setLogDraft((current) => ({ ...current, category: event.target.value }))}
                      className="px-3 py-2 border rounded-lg"
                    >
                      {LOG_CATEGORY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={logDraft.severity}
                      onChange={(event) => setLogDraft((current) => ({ ...current, severity: event.target.value }))}
                      className="px-3 py-2 border rounded-lg"
                    >
                      {LOG_PRIORITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    rows={3}
                    value={logDraft.message}
                    onChange={(event) => setLogDraft((current) => ({ ...current, message: event.target.value }))}
                    placeholder="Add refund details, escalation notes, or daily updates..."
                    className="px-3 py-2 border rounded-lg"
                    required
                  />
                  <button
                    type="submit"
                    disabled={savingAction}
                    className="px-3 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 disabled:opacity-60"
                  >
                    Save Entry
                  </button>
                </form>
              )}

              <div className="space-y-3">
                {managerLog.map((entry) => {
                  const isEditing = editingLogEntryId === entry.id;
                  if (isEditing && capabilities.canManageSchedule) {
                    return (
                      <form
                        key={entry.id}
                        onSubmit={(event) => {
                          event.preventDefault();
                          void saveLogEntryEdit(entry.id);
                        }}
                        className="border border-ocean-200 bg-ocean-50/40 rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-gray-900">{entry.author_name || 'Manager'}</span>
                          <span className="text-xs text-gray-500">{formatDateTime(entry.timestamp)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={logEditDraft.category}
                            onChange={(event) => setLogEditDraft((current) => ({ ...current, category: event.target.value }))}
                            className="px-3 py-2 border rounded-lg"
                          >
                            {LOG_CATEGORY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <select
                            value={logEditDraft.severity}
                            onChange={(event) => setLogEditDraft((current) => ({ ...current, severity: event.target.value }))}
                            className="px-3 py-2 border rounded-lg"
                          >
                            {LOG_PRIORITY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <textarea
                          rows={3}
                          value={logEditDraft.message}
                          onChange={(event) => setLogEditDraft((current) => ({ ...current, message: event.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg"
                          required
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="submit"
                            disabled={savingAction}
                            className="px-3 py-1.5 bg-ocean-600 text-white rounded-md hover:bg-ocean-700 disabled:opacity-60 text-sm"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditLogEntry}
                            disabled={savingAction}
                            className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-60 text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteLogEntry(entry.id)}
                            disabled={savingAction}
                            className="px-3 py-1.5 border border-red-200 rounded-md text-red-700 hover:bg-red-50 disabled:opacity-60 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </form>
                    );
                  }

                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => beginEditLogEntry(entry)}
                      disabled={!capabilities.canManageSchedule}
                      className={`w-full border rounded-lg p-3 text-left ${
                        capabilities.canManageSchedule
                          ? 'border-gray-100 hover:border-ocean-200 hover:bg-ocean-50/30 cursor-pointer'
                          : 'border-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{entry.author_name || 'Manager'}</span>
                        <span className="text-xs text-gray-500">{formatDateTime(entry.timestamp)}</span>
                      </div>
                      <div className="text-xs uppercase text-gray-500 mb-1">
                        {getLogCategoryLabel(entry.category)} • {getLogPriorityLabel(entry.severity)}
                      </div>
                      <div className="text-sm text-gray-700 whitespace-pre-line">{entry.message}</div>
                      {capabilities.canManageSchedule && (
                        <div className="mt-2 text-[11px] text-ocean-700">Click to edit or delete</div>
                      )}
                    </button>
                  );
                })}
                {!managerLog.length && <div className="text-sm text-gray-500">No log entries yet.</div>}
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
