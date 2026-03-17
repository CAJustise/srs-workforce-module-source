import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Edit2,
  FileText,
  Mail,
  MessageSquareText,
  NotebookPen,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
  Users,
} from 'lucide-react';
import { supabase, supabaseAdmin } from '../../lib/supabase';
import { calculateCaliforniaLaborSummary } from '../../lib/caLabor';
import {
  formatScheduleWindowForDisplay,
  getScheduleLocalTimeZone,
  persistScheduleTimeDisplayMode,
  readScheduleTimeDisplayMode,
  type ScheduleTimeDisplayMode,
} from '../../lib/scheduleTimezone';

interface WorkforceEmployee {
  id: string;
  user_id?: string;
  name: string;
  email?: string;
  phone?: string;
  title?: string;
  status: 'active' | 'inactive' | string;
  default_location_id: string;
  hire_date?: string;
  pay_basis?: string;
  hourly_rate?: number;
  availability?: string;
  login_username?: string;
  login_password?: string;
  attendance_score?: number;
  compensation_amount?: number;
  compensation_weekly_hours?: number;
  compensation_monthly_hours?: number;
  pto_unit?: 'hours' | 'days' | string;
}

interface TeamMemberPermissions {
  id: string;
  user_id: string;
  email: string;
  name: string;
  title: string;
  portal?: string;
  can_view_reservations: boolean;
  can_view_events_parties: boolean;
  can_view_classes: boolean;
  can_access_menu_management: boolean;
  can_access_operations: boolean;
  can_access_workforce: boolean;
  can_access_content_management: boolean;
  can_access_career_management: boolean;
  can_access_investment: boolean;
  can_access_settings: boolean;
  can_manage_schedule: boolean;
  operations_classes_read_only: boolean;
  active: boolean;
}

interface WorkforceEmployeeDocument {
  id: string;
  employee_id: string;
  doc_type: string;
  file_name: string;
  file_path: string;
  public_url: string;
  notes?: string;
  uploaded_at?: string;
  created_at?: string;
}

interface WorkforceRole {
  id: string;
  name: string;
  hourly_rate?: number;
  department_id?: string;
  active?: boolean;
  role_section?: string;
  display_order?: number;
}

interface WorkforceStation {
  id: string;
  name: string;
  department_id?: string;
}

interface WorkforceShift {
  id: string;
  employee_id: string;
  role_id: string;
  location_id: string;
  station_id?: string;
  start_time: string;
  end_time: string;
  wage_rate?: number;
  status?: string;
  override_reason?: string | null;
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

interface WorkforceEmployeeRoleAssignment {
  id: string;
  employee_id: string;
  role_id: string;
  hourly_rate?: number;
  primary_role?: boolean;
  active?: boolean;
  created_at?: string;
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
}

interface WorkforceLogEntry {
  id: string;
  author_name?: string;
  timestamp: string;
  category?: string;
  severity?: string;
  message: string;
}

interface WorkforceEvent {
  id: string;
  event_type: string;
  actor_id?: string;
  subject_type?: string;
  subject_id?: string;
  timestamp: string;
  metadata_json?: string;
}

interface WorkforceScheduleTemplate {
  id: string;
  name: string;
  location_id?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

interface WorkforceScheduleTemplateShift {
  id: string;
  template_id: string;
  day_offset: number;
  employee_id: string;
  role_id: string;
  station_id?: string;
  start_time: string;
  end_time: string;
  wage_rate?: number;
}

interface WorkforceTimeOffRequest {
  id: string;
  employee_id: string;
  request_type: 'sick' | 'day_off' | 'pto' | string;
  start_date: string;
  end_date: string;
  hours?: number;
  status?: 'pending' | 'approved' | 'denied' | string;
  notes?: string;
  status_note?: string;
  status_updated_by?: string;
  status_updated_at?: string;
  created_at?: string;
  updated_at?: string;
}

interface WorkforcePtoBalance {
  id: string;
  employee_id: string;
  accrued_hours?: number;
  used_hours?: number;
  available_hours?: number;
  pto_unit?: 'hours' | 'days' | string;
  updated_at?: string;
}

interface WorkforceTimeOffBlock {
  id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  active?: boolean;
  created_at?: string;
}

interface WorkforceCompanyHoliday {
  id: string;
  holiday_date: string;
  name: string;
  notes?: string;
  active?: boolean;
  created_at?: string;
}

interface WorkforceDashboardSnapshot {
  id: string;
  snapshot_type?: string;
  snapshot_date?: string;
  payload_json?: string;
  created_at?: string;
  updated_at?: string;
}

interface WorkforceAuthAdminApi {
  createUser?: (payload: {
    email: string;
    password: string;
  }) => Promise<{
    data?: { user?: { id?: string | null } | null } | null;
    error?: unknown;
  }>;
  updateUserById?: (userId: string, payload: Record<string, string>) => Promise<{ error?: unknown }>;
}

type ScheduleViewMode = 'week' | 'day';

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

const toDateTimeLocalInput = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const fromDateTimeLocalInput = (value: string) => {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
};

const formatHours = (value: number) => `${value.toFixed(1)}h`;

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const addDays = (value: Date, days: number) => {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
};

const formatDateKey = (value: Date) => {
  const normalized = new Date(value);
  normalized.setHours(0, 0, 0, 0);
  return normalized.toISOString().slice(0, 10);
};

const fromDateKey = (value: string) => {
  const parsed = new Date(`${value}T00:00:00`);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const startOfWeek = (value: Date) => {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() - next.getDay());
  return next;
};

const clampDate = (value: Date, minDate: Date, maxDate: Date) => {
  if (value.getTime() < minDate.getTime()) return new Date(minDate);
  if (value.getTime() > maxDate.getTime()) return new Date(maxDate);
  return value;
};

const extractTimePart = (dateTimeValue: string) => {
  const value = String(dateTimeValue || '').trim();
  if (!value) return '00:00:00';
  if (value.includes('T')) {
    return value.split('T')[1].slice(0, 8).padEnd(8, '0');
  }
  return value.slice(0, 8).padEnd(8, '0');
};

const toTimeLabel = (dateTimeValue: string) => extractTimePart(dateTimeValue).slice(0, 5);

const toMinutes = (timeValue: string) => {
  const [hours, minutes] = timeValue.split(':');
  return Number(hours || 0) * 60 + Number(minutes || 0);
};

const toDateTime = (dateKey: string, timeValue: string) => `${dateKey}T${extractTimePart(timeValue)}`;

const shiftDurationMinutes = (shift: WorkforceShift) => {
  const startMinutes = toMinutes(toTimeLabel(shift.start_time));
  const endMinutes = toMinutes(toTimeLabel(shift.end_time));
  if (endMinutes > startMinutes) {
    return endMinutes - startMinutes;
  }
  return endMinutes + 24 * 60 - startMinutes;
};

const formatDateShort = (value: Date) =>
  value.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

const formatDateHeader = (value: Date) =>
  value.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

const makeRoleId = (name: string) => {
  const base = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 28) || 'custom';
  return `wf_role_${base}_${Math.random().toString(36).slice(2, 7)}`;
};

const normalizeRoleSection = (value: string) => {
  const next = String(value || '').trim();
  return next || 'General';
};

const parseDisplayOrder = (value: unknown, fallback = 0) => {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  if (next <= 0) return fallback;
  return Math.round(next);
};

const PTO_HOURS_PER_DAY = 8;
const LOG_ARCHIVE_RETENTION_DAYS = 365;
const LOG_ARCHIVE_SNAPSHOT_TYPE = 'log_archive_daily';

const normalizePtoUnit = (value: unknown): 'hours' | 'days' =>
  String(value || '').toLowerCase() === 'days' ? 'days' : 'hours';

const ptoHoursToDisplay = (hoursValue: number, unit: 'hours' | 'days') =>
  unit === 'days' ? hoursValue / PTO_HOURS_PER_DAY : hoursValue;

const ptoDisplayToHours = (displayValue: number, unit: 'hours' | 'days') =>
  unit === 'days' ? displayValue * PTO_HOURS_PER_DAY : displayValue;

const normalizeTimeOffStatus = (value: unknown): 'pending' | 'approved' | 'denied' => {
  const next = String(value || 'pending').trim().toLowerCase();
  if (next === 'approved') return 'approved';
  if (next === 'denied') return 'denied';
  return 'pending';
};

const timeOffStatusRank = (value: unknown) => {
  const normalized = normalizeTimeOffStatus(value);
  if (normalized === 'pending') return 0;
  if (normalized === 'approved') return 1;
  return 2;
};

const formatTimeOffTypeLabel = (value: unknown) => {
  const next = String(value || '').trim().toLowerCase();
  if (next === 'pto') return 'PTO';
  if (next === 'sick') return 'Sick';
  if (next === 'day_off') return 'Day Off';
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

const toJsonText = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
};

const isTaskClosed = (task: WorkforceTask) => {
  const status = String(task.completion_status || 'open').toLowerCase();
  return status === 'completed' || status === 'verified' || status === 'closed';
};

const formatDecimalInput = (value: number) => {
  if (!Number.isFinite(value)) return '0';
  return String(Math.round(value * 100) / 100);
};

const calculateDerivedHourlyRate = (
  payBasis: string,
  compensationAmount: number,
  weeklyHours: number,
  monthlyHours: number,
) => {
  if (!Number.isFinite(compensationAmount) || compensationAmount < 0) return 0;
  if (payBasis === 'weekly') {
    if (!Number.isFinite(weeklyHours) || weeklyHours <= 0) return 0;
    return compensationAmount / weeklyHours;
  }
  if (payBasis === 'monthly') {
    if (!Number.isFinite(monthlyHours) || monthlyHours <= 0) return 0;
    return compensationAmount / monthlyHours;
  }
  return compensationAmount;
};

const buildEmployeeDraft = (roleId = '', hourlyRate = '24') => ({
  name: '',
  email: '',
  phone: '',
  title: '',
  role_id: roleId,
  pay_basis: 'hourly',
  hourly_rate: hourlyRate,
  weekly_hours: '40',
  monthly_hours: '173.33',
  hire_date: new Date().toISOString().slice(0, 10),
  availability: 'Open availability',
  login_username: '',
  login_password: '',
  pto_unit: 'hours',
  pto_accrued_hours: '80',
  pto_used_hours: '0',
  can_access_menu_management: false,
  can_access_operations: true,
  can_access_workforce: false,
  can_manage_schedule: false,
  can_access_content_management: false,
  can_access_career_management: false,
  can_access_investment: false,
  can_access_settings: false,
  can_view_reservations: false,
  can_view_events_parties: false,
  can_view_classes: false,
  operations_classes_read_only: false,
  active: true,
});

const buildRoleRateDraft = (
  roleId = '',
  hourlyRate = '24',
  primaryRole = false,
) => ({
  id: `role_draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  role_id: roleId,
  hourly_rate: hourlyRate,
  primary_role: primaryRole,
  active: true,
});

const buildShiftDraft = () => ({
  employee_id: '',
  role_id: '',
  station_id: '',
  date: new Date().toISOString().slice(0, 10),
  start_time: '17:00',
  end_time: '23:00',
  wage_rate: '',
});

interface WorkforceManagementProps {
  archiveOnly?: boolean;
}

const WorkforceManagement: React.FC<WorkforceManagementProps> = ({ archiveOnly = false }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [employees, setEmployees] = useState<WorkforceEmployee[]>([]);
  const [employeeRoles, setEmployeeRoles] = useState<WorkforceEmployeeRoleAssignment[]>([]);
  const [roles, setRoles] = useState<WorkforceRole[]>([]);
  const [stations, setStations] = useState<WorkforceStation[]>([]);
  const [shifts, setShifts] = useState<WorkforceShift[]>([]);
  const [punches, setPunches] = useState<WorkforcePunch[]>([]);
  const [breaks, setBreaks] = useState<WorkforceBreak[]>([]);
  const [tasks, setTasks] = useState<WorkforceTask[]>([]);
  const [logEntries, setLogEntries] = useState<WorkforceLogEntry[]>([]);
  const [events, setEvents] = useState<WorkforceEvent[]>([]);
  const [dashboardSnapshots, setDashboardSnapshots] = useState<WorkforceDashboardSnapshot[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberPermissions[]>([]);
  const [employeeDocuments, setEmployeeDocuments] = useState<WorkforceEmployeeDocument[]>([]);
  const [scheduleTemplates, setScheduleTemplates] = useState<WorkforceScheduleTemplate[]>([]);
  const [scheduleTemplateShifts, setScheduleTemplateShifts] = useState<WorkforceScheduleTemplateShift[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<WorkforceTimeOffRequest[]>([]);
  const [ptoBalances, setPtoBalances] = useState<WorkforcePtoBalance[]>([]);
  const [timeOffBlocks, setTimeOffBlocks] = useState<WorkforceTimeOffBlock[]>([]);
  const [companyHolidays, setCompanyHolidays] = useState<WorkforceCompanyHoliday[]>([]);

  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<WorkforceEmployee | null>(null);
  const [employeeEditorMode, setEmployeeEditorMode] = useState<'create' | 'edit'>('edit');
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [savingRoleId, setSavingRoleId] = useState('');
  const [creatingRole, setCreatingRole] = useState(false);

  const [actorUserId, setActorUserId] = useState('system');
  const [actorEmail, setActorEmail] = useState('');
  const [actorName, setActorName] = useState('Manager');
  const [scheduleView, setScheduleView] = useState<ScheduleViewMode>('week');
  const [scheduleTimeDisplayMode, setScheduleTimeDisplayMode] = useState<ScheduleTimeDisplayMode>(() =>
    readScheduleTimeDisplayMode(),
  );
  const [scheduleAnchorDate, setScheduleAnchorDate] = useState(startOfToday());
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [draggingShiftId, setDraggingShiftId] = useState<string | null>(null);
  const [editingShiftId, setEditingShiftId] = useState('');
  const localScheduleTimeZone = useMemo(() => getScheduleLocalTimeZone(), []);
  const allowAuthAdminSync = String(import.meta.env.VITE_WORKFORCE_ALLOW_AUTH_ADMIN_SYNC || '').toLowerCase() === 'true';

  const [employeeDraft, setEmployeeDraft] = useState(() => buildEmployeeDraft());
  const [employeeRoleDrafts, setEmployeeRoleDrafts] = useState<Array<ReturnType<typeof buildRoleRateDraft>>>([]);
  const [roleDraft, setRoleDraft] = useState({
    name: '',
    role_section: 'General',
    display_order: '1',
    hourly_rate: '24',
  });
  const [roleEditsById, setRoleEditsById] = useState<
    Record<string, { name: string; role_section: string; display_order: string; hourly_rate: string }>
  >({});

  const [documentDraft, setDocumentDraft] = useState({
    doc_type: 'ID Scan',
    notes: '',
  });

  const [shiftDraft, setShiftDraft] = useState(buildShiftDraft);

  const [taskDraft, setTaskDraft] = useState({
    title: '',
    assigned_role_id: '',
    station_id: '',
    due_date: new Date().toISOString().slice(0, 10),
    due_time: '18:00',
    critical: false,
  });

  const [logDraft, setLogDraft] = useState({
    category: 'operations',
    severity: 'info',
    message: '',
  });

  const [timeOffBlockDraft, setTimeOffBlockDraft] = useState({
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
    reason: '',
  });
  const [holidayDraft, setHolidayDraft] = useState({
    holiday_date: new Date().toISOString().slice(0, 10),
    name: '',
    notes: '',
  });
  const [timecardDateKey, setTimecardDateKey] = useState(() => new Date().toISOString().slice(0, 10));
  const [archiveDateKey, setArchiveDateKey] = useState(() => new Date().toISOString().slice(0, 10));
  const [punchAdjustmentsById, setPunchAdjustmentsById] = useState<
    Record<string, { clock_in: string; clock_out: string }>
  >({});
  const [breakAdjustmentsById, setBreakAdjustmentsById] = useState<
    Record<string, { start_time: string; end_time: string }>
  >({});
  const [savingTimeEntryId, setSavingTimeEntryId] = useState('');
  const [syncingArchive, setSyncingArchive] = useState(false);
  const showLegacyStationTasks = false;
  const archiveSyncRef = useRef(false);

  const fetchAll = async () => {
    const [
      employeesRes,
      employeeRolesRes,
      rolesRes,
      stationsRes,
      shiftsRes,
      punchesRes,
      breaksRes,
      tasksRes,
      logsRes,
      eventsRes,
      snapshotsRes,
      teamMembersRes,
      employeeDocumentsRes,
      scheduleTemplatesRes,
      scheduleTemplateShiftsRes,
      timeOffRequestsRes,
      ptoBalancesRes,
      timeOffBlocksRes,
      companyHolidaysRes,
    ] = await Promise.all([
      supabase.from('workforce_employees').select('*').order('name'),
      supabase.from('workforce_employee_roles').select('*').order('created_at'),
      supabase.from('workforce_roles').select('*').order('name'),
      supabase.from('workforce_stations').select('*').order('name'),
      supabase.from('workforce_shifts').select('*').order('start_time'),
      supabase.from('workforce_punches').select('*').order('clock_in'),
      supabase.from('workforce_breaks').select('*').order('start_time'),
      supabase.from('workforce_tasks').select('*').order('due_time'),
      supabase.from('workforce_log_entries').select('*').order('timestamp'),
      supabase.from('workforce_events').select('*').order('timestamp', { ascending: false }),
      supabase.from('workforce_dashboard_snapshots').select('*').order('snapshot_date', { ascending: false }),
      supabase.from('team_members').select('*').order('name'),
      supabase.from('workforce_employee_documents').select('*').order('uploaded_at', { ascending: false }),
      supabase.from('workforce_schedule_templates').select('*').order('name'),
      supabase.from('workforce_schedule_template_shifts').select('*').order('day_offset'),
      supabase.from('workforce_time_off_requests').select('*').order('start_date'),
      supabase.from('workforce_pto_balances').select('*').order('employee_id'),
      supabase.from('workforce_time_off_blocks').select('*').order('start_date'),
      supabase.from('workforce_company_holidays').select('*').order('holiday_date'),
    ]);

    const errors = [
      employeesRes.error,
      employeeRolesRes.error,
      rolesRes.error,
      stationsRes.error,
      shiftsRes.error,
      punchesRes.error,
      breaksRes.error,
      tasksRes.error,
      logsRes.error,
      eventsRes.error,
      snapshotsRes.error,
      teamMembersRes.error,
      employeeDocumentsRes.error,
      scheduleTemplatesRes.error,
      scheduleTemplateShiftsRes.error,
      timeOffRequestsRes.error,
      ptoBalancesRes.error,
      timeOffBlocksRes.error,
      companyHolidaysRes.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      throw new Error(errors[0]?.message || 'Failed loading Workforce data');
    }

    setEmployees((employeesRes.data as WorkforceEmployee[]) || []);
    setEmployeeRoles((employeeRolesRes.data as WorkforceEmployeeRoleAssignment[]) || []);
    setRoles(
      ((rolesRes.data as WorkforceRole[]) || [])
        .filter((role) => role.active !== false)
        .sort((a, b) => {
          const orderA = parseDisplayOrder(a.display_order, Number.MAX_SAFE_INTEGER);
          const orderB = parseDisplayOrder(b.display_order, Number.MAX_SAFE_INTEGER);
          if (orderA !== orderB) return orderA - orderB;
          const sectionA = normalizeRoleSection(String(a.role_section || ''));
          const sectionB = normalizeRoleSection(String(b.role_section || ''));
          if (sectionA !== sectionB) return sectionA.localeCompare(sectionB);
          return String(a.name || '').localeCompare(String(b.name || ''));
        }),
    );
    setStations((stationsRes.data as WorkforceStation[]) || []);
    setShifts((shiftsRes.data as WorkforceShift[]) || []);
    setPunches((punchesRes.data as WorkforcePunch[]) || []);
    setBreaks((breaksRes.data as WorkforceBreak[]) || []);
    setTasks((tasksRes.data as WorkforceTask[]) || []);
    setLogEntries((logsRes.data as WorkforceLogEntry[]) || []);
    setEvents((eventsRes.data as WorkforceEvent[]) || []);
    setDashboardSnapshots((snapshotsRes.data as WorkforceDashboardSnapshot[]) || []);
    setTeamMembers((teamMembersRes.data as TeamMemberPermissions[]) || []);
    setEmployeeDocuments((employeeDocumentsRes.data as WorkforceEmployeeDocument[]) || []);
    setScheduleTemplates((scheduleTemplatesRes.data as WorkforceScheduleTemplate[]) || []);
    setScheduleTemplateShifts((scheduleTemplateShiftsRes.data as WorkforceScheduleTemplateShift[]) || []);
    setTimeOffRequests((timeOffRequestsRes.data as WorkforceTimeOffRequest[]) || []);
    setPtoBalances((ptoBalancesRes.data as WorkforcePtoBalance[]) || []);
    setTimeOffBlocks((timeOffBlocksRes.data as WorkforceTimeOffBlock[]) || []);
    setCompanyHolidays((companyHolidaysRes.data as WorkforceCompanyHoliday[]) || []);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user?.id) {
          setActorUserId(session.user.id);
          setActorEmail(String(session.user.email || ''));
          setActorName(String(session.user.email || 'Manager'));
        }

        await fetchAll();
      } catch (error) {
        alert((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, []);

  useEffect(() => {
    persistScheduleTimeDisplayMode(scheduleTimeDisplayMode);
  }, [scheduleTimeDisplayMode]);

  useEffect(() => {
    if (!employeeDraft.role_id && roles.length > 0) {
      setEmployeeDraft((current) => ({
        ...current,
        role_id: roles[0].id,
        title: current.title || roles[0].name,
        hourly_rate: current.hourly_rate || String(roles[0].hourly_rate || 24),
      }));
    }

    if (employeeRoleDrafts.length === 0 && roles.length > 0) {
      setEmployeeRoleDrafts([
        buildRoleRateDraft(roles[0].id, String(roles[0].hourly_rate || 24), true),
      ]);
    }
  }, [employeeDraft.role_id, employeeRoleDrafts.length, roles]);

  useEffect(() => {
    setRoleEditsById((current) => {
      const next: Record<string, { name: string; role_section: string; display_order: string; hourly_rate: string }> = {};
      roles.forEach((role) => {
        next[role.id] = {
          name: current[role.id]?.name ?? String(role.name || ''),
          role_section: current[role.id]?.role_section ?? normalizeRoleSection(String(role.role_section || '')),
          display_order: current[role.id]?.display_order ?? String(parseDisplayOrder(role.display_order, 1)),
          hourly_rate: current[role.id]?.hourly_rate ?? String(role.hourly_rate ?? 0),
        };
      });
      return next;
    });
  }, [roles]);

  useEffect(() => {
    if (!shiftDraft.employee_id && employees.length > 0) {
      const firstEmployee = employees[0];
      setShiftDraft((current) => ({
        ...current,
        employee_id: firstEmployee.id,
      }));
    }

    if (!shiftDraft.role_id && roles.length > 0) {
      setShiftDraft((current) => ({
        ...current,
        role_id: roles[0].id,
        wage_rate: current.wage_rate || String(roles[0].hourly_rate || 24),
      }));
    }

    if (!shiftDraft.station_id && stations.length > 0) {
      setShiftDraft((current) => ({
        ...current,
        station_id: stations[0].id,
      }));
    }
  }, [employees, roles, shiftDraft.employee_id, shiftDraft.role_id, shiftDraft.station_id, stations]);

  useEffect(() => {
    if (!taskDraft.assigned_role_id && roles.length > 0) {
      setTaskDraft((current) => ({ ...current, assigned_role_id: roles[0].id }));
    }

    if (!taskDraft.station_id && stations.length > 0) {
      setTaskDraft((current) => ({ ...current, station_id: stations[0].id }));
    }
  }, [roles, stations, taskDraft.assigned_role_id, taskDraft.station_id]);

  useEffect(() => {
    if (!selectedTemplateId && scheduleTemplates.length > 0) {
      setSelectedTemplateId(scheduleTemplates[0].id);
    }
  }, [scheduleTemplates, selectedTemplateId]);

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
          const orderA = parseDisplayOrder(a.display_order, Number.MAX_SAFE_INTEGER);
          const orderB = parseDisplayOrder(b.display_order, Number.MAX_SAFE_INTEGER);
          if (orderA !== orderB) return orderA - orderB;

          const sectionA = normalizeRoleSection(String(a.role_section || ''));
          const sectionB = normalizeRoleSection(String(b.role_section || ''));
          if (sectionA !== sectionB) return sectionA.localeCompare(sectionB);

          return String(a.name || '').localeCompare(String(b.name || ''));
        }),
    [roles],
  );

  const roleGroups = useMemo(() => {
    const grouped = new Map<string, WorkforceRole[]>();
    orderedRoles.forEach((role) => {
      const section = normalizeRoleSection(String(role.role_section || ''));
      if (!grouped.has(section)) {
        grouped.set(section, []);
      }
      grouped.get(section)?.push(role);
    });

    return Array.from(grouped.entries()).map(([section, items]) => ({
      section,
      items,
    }));
  }, [orderedRoles]);

  const roleOrderIndexById = useMemo(
    () =>
      orderedRoles.reduce((accumulator, role, index) => {
        accumulator[role.id] = index;
        return accumulator;
      }, {} as Record<string, number>),
    [orderedRoles],
  );

  const employeeById = useMemo(
    () =>
      employees.reduce((accumulator, employee) => {
        accumulator[employee.id] = employee;
        return accumulator;
      }, {} as Record<string, WorkforceEmployee>),
    [employees],
  );

  const employeeByEmail = useMemo(
    () =>
      employees.reduce((accumulator, employee) => {
        const key = String(employee.email || '').trim().toLowerCase();
        if (!key || accumulator[key]) return accumulator;
        accumulator[key] = employee;
        return accumulator;
      }, {} as Record<string, WorkforceEmployee>),
    [employees],
  );

  const employeeByUserId = useMemo(
    () =>
      employees.reduce((accumulator, employee) => {
        if (!employee.user_id) return accumulator;
        accumulator[String(employee.user_id)] = employee;
        return accumulator;
      }, {} as Record<string, WorkforceEmployee>),
    [employees],
  );

  const stationById = useMemo(
    () =>
      stations.reduce((accumulator, station) => {
        accumulator[station.id] = station;
        return accumulator;
      }, {} as Record<string, WorkforceStation>),
    [stations],
  );

  const teamMemberByUserId = useMemo(
    () =>
      teamMembers.reduce((accumulator, member) => {
        if (!member.user_id) return accumulator;
        accumulator[member.user_id] = member;
        return accumulator;
      }, {} as Record<string, TeamMemberPermissions>),
    [teamMembers],
  );

  const teamMemberByEmail = useMemo(
    () =>
      teamMembers.reduce((accumulator, member) => {
        const key = String(member.email || '').trim().toLowerCase();
        if (!key || accumulator[key]) return accumulator;
        accumulator[key] = member;
        return accumulator;
      }, {} as Record<string, TeamMemberPermissions>),
    [teamMembers],
  );

  const actorTeamMember =
    teamMemberByUserId[actorUserId] ||
    (actorEmail ? teamMemberByEmail[actorEmail.trim().toLowerCase()] : undefined);
  const actorCanManageSchedule = actorTeamMember
    ? Boolean(actorTeamMember.can_manage_schedule || actorTeamMember.can_access_workforce)
    : true;

  const employeeRoleAssignmentsByEmployeeId = useMemo(
    () =>
      employeeRoles.reduce((accumulator, assignment) => {
        if (!assignment.employee_id) return accumulator;
        if (!accumulator[assignment.employee_id]) {
          accumulator[assignment.employee_id] = [];
        }
        accumulator[assignment.employee_id].push(assignment);
        return accumulator;
      }, {} as Record<string, WorkforceEmployeeRoleAssignment[]>),
    [employeeRoles],
  );

  const roleUsageCountById = useMemo(() => {
    const counts: Record<string, number> = {};

    employeeRoles.forEach((assignment) => {
      if (!assignment.role_id || assignment.active === false) return;
      counts[assignment.role_id] = (counts[assignment.role_id] || 0) + 1;
    });

    shifts.forEach((shift) => {
      if (!shift.role_id) return;
      counts[shift.role_id] = (counts[shift.role_id] || 0) + 1;
    });

    scheduleTemplateShifts.forEach((templateShift) => {
      if (!templateShift.role_id) return;
      counts[templateShift.role_id] = (counts[templateShift.role_id] || 0) + 1;
    });

    return counts;
  }, [employeeRoles, scheduleTemplateShifts, shifts]);

  const roleRateByEmployeeIdRoleId = useMemo(
    () =>
      employeeRoles.reduce((accumulator, assignment) => {
        if (!assignment.employee_id || !assignment.role_id) return accumulator;
        const employeeId = assignment.employee_id;
        if (!accumulator[employeeId]) {
          accumulator[employeeId] = {};
        }
        accumulator[employeeId][assignment.role_id] = Number(
          assignment.hourly_rate ?? roleById[assignment.role_id]?.hourly_rate ?? 0,
        );
        return accumulator;
      }, {} as Record<string, Record<string, number>>),
    [employeeRoles, roleById],
  );

  const ptoByEmployeeId = useMemo(
    () =>
      ptoBalances.reduce((accumulator, balance) => {
        accumulator[balance.employee_id] = balance;
        return accumulator;
      }, {} as Record<string, WorkforcePtoBalance>),
    [ptoBalances],
  );

  const ptoUnitByEmployeeId = useMemo(() => {
    const accumulator: Record<string, 'hours' | 'days'> = {};

    employees.forEach((employee) => {
      accumulator[employee.id] = normalizePtoUnit(employee.pto_unit);
    });

    ptoBalances.forEach((balance) => {
      if (!balance.employee_id) return;
      if (!accumulator[balance.employee_id]) {
        accumulator[balance.employee_id] = normalizePtoUnit(balance.pto_unit);
      }
    });

    return accumulator;
  }, [employees, ptoBalances]);

  const getEmployeePtoUnit = (employeeId: string) => ptoUnitByEmployeeId[employeeId] || 'hours';

  const rolesForSelectedShiftEmployee = useMemo(() => {
    if (!shiftDraft.employee_id) return orderedRoles;
    const assignments = (employeeRoleAssignmentsByEmployeeId[shiftDraft.employee_id] || []).filter(
      (assignment) => assignment.active !== false,
    );
    if (!assignments.length) return orderedRoles;
    const allowedRoleIds = new Set(assignments.map((assignment) => assignment.role_id));
    return orderedRoles.filter((role) => allowedRoleIds.has(role.id));
  }, [employeeRoleAssignmentsByEmployeeId, orderedRoles, shiftDraft.employee_id]);

  const roleGroupsForSelectedShiftEmployee = useMemo(() => {
    const grouped = new Map<string, WorkforceRole[]>();
    rolesForSelectedShiftEmployee.forEach((role) => {
      const section = normalizeRoleSection(String(role.role_section || ''));
      if (!grouped.has(section)) {
        grouped.set(section, []);
      }
      grouped.get(section)?.push(role);
    });

    return Array.from(grouped.entries()).map(([section, items]) => ({
      section,
      items,
    }));
  }, [rolesForSelectedShiftEmployee]);

  const shiftDraftCalculatedRate = useMemo(
    () =>
      Number(
        roleRateByEmployeeIdRoleId[shiftDraft.employee_id]?.[shiftDraft.role_id] ||
          roleById[shiftDraft.role_id]?.hourly_rate ||
          0,
      ),
    [roleById, roleRateByEmployeeIdRoleId, shiftDraft.employee_id, shiftDraft.role_id],
  );

  useEffect(() => {
    if (!shiftDraft.employee_id) return;

    const assignments = (employeeRoleAssignmentsByEmployeeId[shiftDraft.employee_id] || []).filter(
      (assignment) => assignment.active !== false,
    );
    if (!assignments.length) return;

    const primaryAssignment =
      assignments.find((assignment) => Boolean(assignment.primary_role)) || assignments[0];
    const allowedRoleIds = new Set(assignments.map((assignment) => assignment.role_id));
    const currentRate =
      roleRateByEmployeeIdRoleId[shiftDraft.employee_id]?.[shiftDraft.role_id] ??
      roleById[shiftDraft.role_id]?.hourly_rate ??
      0;

    setShiftDraft((current) => {
      const nextRoleId = allowedRoleIds.has(current.role_id) ? current.role_id : primaryAssignment.role_id;
      const nextRate =
        roleRateByEmployeeIdRoleId[current.employee_id]?.[nextRoleId] ??
        roleById[nextRoleId]?.hourly_rate ??
        currentRate;
      const shouldReplaceRate = !current.wage_rate || current.role_id !== nextRoleId;

      if (current.role_id === nextRoleId && !shouldReplaceRate) {
        return current;
      }

      return {
        ...current,
        role_id: nextRoleId,
        wage_rate: shouldReplaceRate ? String(nextRate) : current.wage_rate,
      };
    });
  }, [employeeRoleAssignmentsByEmployeeId, roleById, roleRateByEmployeeIdRoleId, shiftDraft.employee_id, shiftDraft.role_id]);

  const today = startOfToday();
  const schedulerMinDate = addDays(today, -28);
  const schedulerMaxDate = addDays(today, 28);

  const scheduleWindowStart = useMemo(() => {
    if (scheduleView === 'week') {
      return startOfWeek(scheduleAnchorDate);
    }
    const normalized = new Date(scheduleAnchorDate);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }, [scheduleAnchorDate, scheduleView]);

  const scheduleDates = useMemo(() => {
    const count = scheduleView === 'week' ? 7 : 1;
    return Array.from({ length: count }, (_, index) => addDays(scheduleWindowStart, index));
  }, [scheduleView, scheduleWindowStart]);

  const scheduleDateKeys = useMemo(
    () => scheduleDates.map((date) => formatDateKey(date)),
    [scheduleDates],
  );

  const scheduleDateSet = useMemo(
    () => new Set(scheduleDateKeys),
    [scheduleDateKeys],
  );

  const shiftsInWindow = useMemo(
    () =>
      shifts.filter((shift) => {
        const key = formatDateKey(new Date(shift.start_time));
        return scheduleDateSet.has(key);
      }),
    [scheduleDateSet, shifts],
  );

  const shiftsByEmployeeAndDate = useMemo(
    () =>
      shiftsInWindow.reduce((accumulator, shift) => {
        const dateKey = formatDateKey(new Date(shift.start_time));
        const key = `${shift.employee_id}::${dateKey}`;
        if (!accumulator[key]) {
          accumulator[key] = [];
        }
        accumulator[key].push(shift);
        return accumulator;
      }, {} as Record<string, WorkforceShift[]>),
    [shiftsInWindow],
  );

  const shiftById = useMemo(
    () =>
      shifts.reduce((accumulator, shift) => {
        accumulator[shift.id] = shift;
        return accumulator;
      }, {} as Record<string, WorkforceShift>),
    [shifts],
  );

  const approvedTimeOffRequestsByEmployeeDate = useMemo(() => {
    const accumulator: Record<string, WorkforceTimeOffRequest[]> = {};

    timeOffRequests.forEach((request) => {
      const status = normalizeTimeOffStatus(request.status);
      if (status !== 'approved') return;
      if (!request.employee_id || !request.start_date || !request.end_date) return;

      const start = fromDateKey(request.start_date);
      const end = fromDateKey(request.end_date);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;

      const cursor = new Date(start);
      while (cursor.getTime() <= end.getTime()) {
        const key = `${request.employee_id}::${formatDateKey(cursor)}`;
        if (!accumulator[key]) {
          accumulator[key] = [];
        }
        accumulator[key].push(request);
        cursor.setDate(cursor.getDate() + 1);
      }
    });

    return accumulator;
  }, [timeOffRequests]);

  const approvedTimeOffDatesByEmployee = useMemo(() => {
    const accumulator: Record<string, Set<string>> = {};
    Object.keys(approvedTimeOffRequestsByEmployeeDate).forEach((key) => {
      const [employeeId, dateKey] = key.split('::');
      if (!employeeId || !dateKey) return;
      if (!accumulator[employeeId]) {
        accumulator[employeeId] = new Set<string>();
      }
      accumulator[employeeId].add(dateKey);
    });
    return accumulator;
  }, [approvedTimeOffRequestsByEmployeeDate]);

  const getApprovedTimeOffConflictsForShift = useCallback(
    (employeeId: string, startAt: string, endAt: string) => {
      const startDate = new Date(startAt);
      const endDate = new Date(endAt);
      if (!employeeId || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return [];

      const startDay = fromDateKey(formatDateKey(startDate));
      const endDay = fromDateKey(formatDateKey(endDate));
      if (Number.isNaN(startDay.getTime()) || Number.isNaN(endDay.getTime())) return [];

      const requestById: Record<string, WorkforceTimeOffRequest> = {};
      const cursor = new Date(startDay);
      while (cursor.getTime() <= endDay.getTime()) {
        const key = `${employeeId}::${formatDateKey(cursor)}`;
        (approvedTimeOffRequestsByEmployeeDate[key] || []).forEach((request) => {
          requestById[request.id] = request;
        });
        cursor.setDate(cursor.getDate() + 1);
      }

      return Object.values(requestById).sort((a, b) =>
        `${a.start_date}${a.end_date}`.localeCompare(`${b.start_date}${b.end_date}`),
      );
    },
    [approvedTimeOffRequestsByEmployeeDate],
  );

  const activeTimeOffBlocks = useMemo(
    () =>
      timeOffBlocks
        .filter((block) => block.active !== false && block.start_date && block.end_date)
        .slice()
        .sort((a, b) => `${a.start_date}${a.end_date}`.localeCompare(`${b.start_date}${b.end_date}`)),
    [timeOffBlocks],
  );

  const activeCompanyHolidays = useMemo(
    () =>
      companyHolidays
        .filter((holiday) => holiday.active !== false && holiday.holiday_date)
        .slice()
        .sort((a, b) => String(a.holiday_date || '').localeCompare(String(b.holiday_date || ''))),
    [companyHolidays],
  );

  const upcomingCompanyHolidays = useMemo(
    () =>
      activeCompanyHolidays
        .filter((holiday) => holiday.holiday_date >= formatDateKey(today))
        .slice(0, 8),
    [activeCompanyHolidays, today],
  );

  const ptoAuditTrailEntries = useMemo(() => {
    const entries = events
      .filter((event) => String(event.subject_type || '') === 'time_off_request')
      .map((event) => {
        const metadata = parseEventMetadata(event.metadata_json);
        const status = normalizeTimeOffStatus(metadata.status);
        const previousStatus = normalizeTimeOffStatus(metadata.previous_status);
        const employeeName =
          String(metadata.employee_name || '') ||
          employeeById[String(metadata.employee_id || '')]?.name ||
          'Employee';
        const actorLookupId = String(event.actor_id || '');
        const actorName =
          teamMemberByUserId[actorLookupId]?.name ||
          employeeByUserId[actorLookupId]?.name ||
          actorLookupId ||
          'System';

        let summary = event.event_type;
        if (event.event_type === 'TIME_OFF_REQUEST_SUBMITTED') {
          summary = `${employeeName} submitted a ${formatTimeOffTypeLabel(metadata.request_type)} request.`;
        } else if (event.event_type === 'TIME_OFF_REQUEST_STATUS_UPDATED') {
          summary = `${employeeName} status changed ${previousStatus} -> ${status}.`;
        } else if (event.event_type === 'TIME_OFF_REQUEST_EDITED_PENDING') {
          summary = `${employeeName} edited request and reset to pending.`;
        } else if (event.event_type === 'TIME_OFF_REQUEST_DELETED') {
          summary = `${employeeName} deleted a request.`;
        }

        return {
          id: event.id,
          summary,
          actorName,
          status,
          previousStatus,
          statusNote: String(metadata.status_note || ''),
          requestType: formatTimeOffTypeLabel(metadata.request_type),
          startDate: String(metadata.start_date || ''),
          endDate: String(metadata.end_date || ''),
          timestamp: event.timestamp,
        };
      })
      .sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')))
      .slice(0, 24);

    return entries;
  }, [employeeById, employeeByUserId, events, teamMemberByUserId]);

  const todayKey = today.toISOString().slice(0, 10);

  const shiftsToday = useMemo(
    () =>
      shifts.filter((shift) => {
        const start = new Date(shift.start_time);
        if (Number.isNaN(start.getTime())) return false;
        return start.toISOString().slice(0, 10) === todayKey;
      }),
    [shifts, todayKey],
  );

  const punchByShiftId = useMemo(
    () =>
      punches.reduce((accumulator, punch) => {
        if (!accumulator[punch.shift_id]) {
          accumulator[punch.shift_id] = [];
        }
        accumulator[punch.shift_id].push(punch);
        return accumulator;
      }, {} as Record<string, WorkforcePunch[]>),
    [punches],
  );

  const openPunches = useMemo(() => punches.filter((punch) => !punch.clock_out), [punches]);
  const breaksByPunchId = useMemo(
    () =>
      breaks.reduce((accumulator, entry) => {
        if (!accumulator[entry.punch_id]) {
          accumulator[entry.punch_id] = [];
        }
        accumulator[entry.punch_id].push(entry);
        return accumulator;
      }, {} as Record<string, WorkforceBreak[]>),
    [breaks],
  );
  const currentWeekStart = useMemo(() => startOfWeek(today), [today]);
  const currentWeekEnd = useMemo(() => addDays(currentWeekStart, 7), [currentWeekStart]);

  const timecardMinDateKey = useMemo(
    () => formatDateKey(addDays(today, -29)),
    [today],
  );
  const timecardMaxDateKey = todayKey;

  useEffect(() => {
    setTimecardDateKey((current) => {
      if (!current) return timecardMaxDateKey;
      if (current < timecardMinDateKey) return timecardMinDateKey;
      if (current > timecardMaxDateKey) return timecardMaxDateKey;
      return current;
    });
  }, [timecardMaxDateKey, timecardMinDateKey]);

  const selectedTimecardDate = useMemo(
    () => fromDateKey(timecardDateKey),
    [timecardDateKey],
  );
  const canViewEarlierTimecards = timecardDateKey > timecardMinDateKey;
  const canViewLaterTimecards = timecardDateKey < timecardMaxDateKey;

  const timecardPunchesForDate = useMemo(
    () =>
      punches
        .filter((punch) => formatDateKey(new Date(punch.clock_in)) === timecardDateKey)
        .slice()
        .sort((a, b) => {
          const aShift = shiftById[a.shift_id];
          const bShift = shiftById[b.shift_id];
          const aOrder = roleOrderIndexById[aShift?.role_id || ''] ?? Number.MAX_SAFE_INTEGER;
          const bOrder = roleOrderIndexById[bShift?.role_id || ''] ?? Number.MAX_SAFE_INTEGER;
          if (aOrder !== bOrder) return aOrder - bOrder;
          const aName = employeeById[a.employee_id]?.name || '';
          const bName = employeeById[b.employee_id]?.name || '';
          if (aName !== bName) return aName.localeCompare(bName);
          return String(a.clock_in || '').localeCompare(String(b.clock_in || ''));
        }),
    [employeeById, punches, roleOrderIndexById, shiftById, timecardDateKey],
  );

  const currentWeekPunches = useMemo(
    () =>
      punches.filter((punch) => {
        const startsAt = new Date(punch.clock_in).getTime();
        if (Number.isNaN(startsAt)) return false;
        return startsAt >= currentWeekStart.getTime() && startsAt < currentWeekEnd.getTime();
      }),
    [currentWeekEnd, currentWeekStart, punches],
  );

  const scheduledHours = useMemo(
    () =>
      shiftsToday.reduce((total, shift) => {
        const start = new Date(shift.start_time).getTime();
        const end = new Date(shift.end_time).getTime();
        if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return total;
        return total + (end - start) / 3600000;
      }, 0),
    [shiftsToday],
  );

  const caLaborSummary = useMemo(() => {
    const punchInput = currentWeekPunches.map((punch) => {
      const shift = shifts.find((candidate) => candidate.id === punch.shift_id);
      const fallbackRoleRate = shift?.role_id ? Number(roleById[shift.role_id]?.hourly_rate || 0) : 0;
      const fallbackAssignedRate = shift?.employee_id && shift?.role_id
        ? Number(roleRateByEmployeeIdRoleId[shift.employee_id]?.[shift.role_id] || 0)
        : 0;
      const rate = Number(shift?.wage_rate || fallbackAssignedRate || fallbackRoleRate || 0);

      return {
        id: punch.id,
        employee_id: punch.employee_id,
        clock_in: punch.clock_in,
        clock_out: punch.clock_out,
        rate,
        breaks: breaks.filter((entry) => entry.punch_id === punch.id),
      };
    });

    return calculateCaliforniaLaborSummary(punchInput, new Date());
  }, [breaks, currentWeekPunches, roleById, roleRateByEmployeeIdRoleId, shifts]);

  const workedHours = caLaborSummary.totalHours;
  const laborCost = caLaborSummary.totalCost;

  const unresolvedCriticalTasks = useMemo(
    () =>
      tasks.filter(
        (task) => Boolean(task.critical) && !isTaskClosed(task),
      ),
    [tasks],
  );

  const complianceWarnings = useMemo(() => {
    const warnings: Array<{ code: string; message: string; severity: 'warning' | 'critical' }> = [];

    shiftsToday.forEach((shift) => {
      const start = new Date(shift.start_time);
      if (Number.isNaN(start.getTime())) return;
      const hasPunch = (punchByShiftId[shift.id] || []).length > 0;
      if (start.getTime() < Date.now() && !hasPunch) {
        const employeeName = employeeById[shift.employee_id]?.name || 'Unassigned';
        warnings.push({
          code: 'LATE_OR_MISSED_PUNCH',
          severity: 'warning',
          message: `${employeeName} is scheduled but has not punched in for ${formatDateTime(shift.start_time)}.`,
        });
      }
    });

    openPunches.forEach((punch) => {
      const clockInTime = new Date(punch.clock_in).getTime();
      if (Number.isNaN(clockInTime)) return;
      const durationHours = (Date.now() - clockInTime) / 3600000;

      const linkedBreaks = breaks.filter((candidate) => candidate.punch_id === punch.id);
      const employeeName = employeeById[punch.employee_id]?.name || 'Employee';
      const hasMealBreak = linkedBreaks.some((entry) => {
        const explicitUnpaid = entry.paid_break === false;
        const type = String(entry.break_type || '').toLowerCase();
        if (explicitUnpaid || type.includes('meal') || type.includes('unpaid')) return true;
        if (entry.expected_minutes !== undefined && entry.expected_minutes !== null) {
          return Number(entry.expected_minutes) >= 30;
        }
        const startMs = new Date(entry.start_time).getTime();
        const endMs = new Date(entry.end_time || new Date().toISOString()).getTime();
        if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) return false;
        return (endMs - startMs) / 60000 >= 30;
      });

      if (durationHours > 5 && !hasMealBreak) {
        warnings.push({
          code: 'MEAL_BREAK_MISSING',
          severity: durationHours > 6 ? 'critical' : 'warning',
          message: `${employeeName} has worked ${durationHours.toFixed(1)}h with no recorded break.`,
        });
      }

      if (durationHours > 8) {
        warnings.push({
          code: 'OVERTIME_RISK',
          severity: 'warning',
          message: `${employeeName} is in overtime risk at ${durationHours.toFixed(1)}h.`,
        });
      }
    });

    return warnings;
  }, [breaks, employeeById, openPunches, punchByShiftId, shiftsToday]);

  const taskAlerts = useMemo(() => {
    const nowMs = Date.now();
    return tasks
      .filter((task) => {
        if (isTaskClosed(task)) return false;
        if (task.critical) return true;
        if (!task.due_time) return false;
        const dueMs = new Date(task.due_time).getTime();
        if (Number.isNaN(dueMs)) return false;
        return dueMs < nowMs;
      })
      .slice()
      .sort((a, b) => String(a.due_time || '').localeCompare(String(b.due_time || '')));
  }, [tasks]);

  const todayActivityLogEntries = useMemo(
    () =>
      logEntries
        .filter((entry) => formatDateKey(new Date(entry.timestamp)) === todayKey)
        .slice()
        .sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || ''))),
    [logEntries, todayKey],
  );

  const todayClockLogEntries = useMemo(
    () =>
      punches
        .filter((punch) => formatDateKey(new Date(punch.clock_in)) === todayKey)
        .slice()
        .sort((a, b) => String(a.clock_in || '').localeCompare(String(b.clock_in || '')))
        .map((punch) => {
          const shift = shiftById[punch.shift_id];
          return {
            id: punch.id,
            employee_name: employeeById[punch.employee_id]?.name || 'Employee',
            role_name: shift?.role_id ? roleById[shift.role_id]?.name || 'Role' : 'Role',
            clock_in: punch.clock_in,
            clock_out: punch.clock_out || null,
            status: punch.status || (punch.clock_out ? 'closed' : 'open'),
            breaks: (breaksByPunchId[punch.id] || [])
              .slice()
              .sort((a, b) => String(a.start_time || '').localeCompare(String(b.start_time || '')))
              .map((entry) => ({
                id: entry.id,
                break_type: String(entry.break_type || 'break'),
                start_time: entry.start_time,
                end_time: entry.end_time || null,
                paid_break: Boolean(entry.paid_break),
              })),
          };
        }),
    [breaksByPunchId, employeeById, punches, roleById, shiftById, todayKey],
  );

  const todayScheduleArchiveEntries = useMemo(
    () =>
      shiftsToday
        .slice()
        .sort((a, b) => {
          const roleOrderA = roleOrderIndexById[a.role_id] ?? Number.MAX_SAFE_INTEGER;
          const roleOrderB = roleOrderIndexById[b.role_id] ?? Number.MAX_SAFE_INTEGER;
          if (roleOrderA !== roleOrderB) return roleOrderA - roleOrderB;
          if (a.start_time !== b.start_time) return String(a.start_time).localeCompare(String(b.start_time));
          const employeeA = employeeById[a.employee_id]?.name || '';
          const employeeB = employeeById[b.employee_id]?.name || '';
          return employeeA.localeCompare(employeeB);
        })
        .map((shift) => ({
          id: shift.id,
          employee_name: employeeById[shift.employee_id]?.name || 'Employee',
          role_name: roleById[shift.role_id]?.name || 'Role',
          role_section: normalizeRoleSection(String(roleById[shift.role_id]?.role_section || 'General')),
          station_name: stationById[String(shift.station_id || '')]?.name || 'Unassigned',
          start_time: shift.start_time,
          end_time: shift.end_time,
          status: String(shift.status || 'scheduled'),
        })),
    [employeeById, roleById, roleOrderIndexById, shiftsToday, stationById],
  );

  const todayTaskArchiveEntries = useMemo(
    () =>
      tasks
        .slice()
        .sort((a, b) => String(a.due_time || '').localeCompare(String(b.due_time || '')))
        .map((task) => ({
          id: task.id,
          title: task.title,
          assigned_to:
            employeeById[String(task.assigned_employee_id || '')]?.name ||
            roleById[String(task.assigned_role_id || '')]?.name ||
            'Unassigned',
          station_name: stationById[String(task.station_id || '')]?.name || null,
          due_time: task.due_time || null,
          completion_status: String(task.completion_status || 'open'),
          critical: Boolean(task.critical),
          completed_by: task.completed_by || null,
          completed_at: task.completed_at || null,
        })),
    [employeeById, roleById, stationById, tasks],
  );

  const todayAlertArchiveEntries = useMemo(
    () => [
      ...complianceWarnings.map((warning, index) => ({
        id: `compliance_${index}`,
        source: 'compliance',
        severity: warning.severity,
        label: warning.code,
        message: warning.message,
      })),
      ...taskAlerts.map((task) => ({
        id: `task_${task.id}`,
        source: 'task',
        severity: task.critical ? 'critical' : 'warning',
        label: task.title,
        message: task.due_time ? `Due ${formatDateTime(task.due_time)}` : 'No due date set',
      })),
    ],
    [complianceWarnings, taskAlerts],
  );

  const todayLogArchivePayload = useMemo(
    () => ({
      snapshot_date: todayKey,
      tasks: todayTaskArchiveEntries,
      clock_logs: todayClockLogEntries,
      alerts: todayAlertArchiveEntries,
      daily_schedule: todayScheduleArchiveEntries,
      daily_activity_log: todayActivityLogEntries.map((entry) => ({
        id: entry.id,
        author_name: entry.author_name || 'Manager',
        timestamp: entry.timestamp,
        category: entry.category || 'notes',
        severity: entry.severity || 'low',
        message: entry.message,
      })),
      summary: {
        task_count: todayTaskArchiveEntries.length,
        clock_log_count: todayClockLogEntries.length,
        alert_count: todayAlertArchiveEntries.length,
        schedule_count: todayScheduleArchiveEntries.length,
        activity_count: todayActivityLogEntries.length,
      },
    }),
    [
      todayAlertArchiveEntries,
      todayActivityLogEntries,
      todayClockLogEntries,
      todayKey,
      todayScheduleArchiveEntries,
      todayTaskArchiveEntries,
    ],
  );

  const todayLogArchivePayloadJson = useMemo(() => JSON.stringify(todayLogArchivePayload), [todayLogArchivePayload]);

  const logArchiveSnapshots = useMemo(
    () =>
      dashboardSnapshots
        .filter((snapshot) => {
          const snapshotDate = String(snapshot.snapshot_date || '');
          if (!snapshotDate) return false;
          const snapshotType = String(snapshot.snapshot_type || LOG_ARCHIVE_SNAPSHOT_TYPE);
          return snapshotType === LOG_ARCHIVE_SNAPSHOT_TYPE;
        })
        .slice()
        .sort((a, b) => {
          const dateA = String(a.snapshot_date || '');
          const dateB = String(b.snapshot_date || '');
          if (dateA !== dateB) return dateB.localeCompare(dateA);
          return String(b.created_at || '').localeCompare(String(a.created_at || ''));
        }),
    [dashboardSnapshots],
  );

  const archiveEarliestDateKey = useMemo(
    () => formatDateKey(addDays(today, -(LOG_ARCHIVE_RETENTION_DAYS - 1))),
    [today],
  );

  const selectedLogArchiveSnapshot = useMemo(
    () =>
      logArchiveSnapshots.find((snapshot) => String(snapshot.snapshot_date || '') === archiveDateKey) || null,
    [archiveDateKey, logArchiveSnapshots],
  );

  const selectedLogArchivePayload = useMemo(() => {
    if (!selectedLogArchiveSnapshot?.payload_json) return null;
    const raw = selectedLogArchiveSnapshot.payload_json;
    if (typeof raw !== 'string') return raw as Record<string, unknown>;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }, [selectedLogArchiveSnapshot]);

  const selectedArchiveTasks = useMemo(
    () => (Array.isArray(selectedLogArchivePayload?.tasks) ? selectedLogArchivePayload.tasks : []),
    [selectedLogArchivePayload],
  );

  const selectedArchiveClockLogs = useMemo(
    () => (Array.isArray(selectedLogArchivePayload?.clock_logs) ? selectedLogArchivePayload.clock_logs : []),
    [selectedLogArchivePayload],
  );

  const selectedArchiveAlerts = useMemo(
    () => (Array.isArray(selectedLogArchivePayload?.alerts) ? selectedLogArchivePayload.alerts : []),
    [selectedLogArchivePayload],
  );

  const selectedArchiveSchedule = useMemo(
    () => (Array.isArray(selectedLogArchivePayload?.daily_schedule) ? selectedLogArchivePayload.daily_schedule : []),
    [selectedLogArchivePayload],
  );

  const selectedArchiveActivityLog = useMemo(
    () =>
      Array.isArray(selectedLogArchivePayload?.daily_activity_log)
        ? selectedLogArchivePayload.daily_activity_log
        : [],
    [selectedLogArchivePayload],
  );

  const selectedArchiveSummary = useMemo(() => {
    const summary = selectedLogArchivePayload?.summary;
    if (!summary || typeof summary !== 'object') return null;
    return summary as Record<string, unknown>;
  }, [selectedLogArchivePayload]);

  const archiveDateLabel = useMemo(() => formatDateHeader(fromDateKey(archiveDateKey)), [archiveDateKey]);

  const canViewEarlierArchiveDate = archiveDateKey > archiveEarliestDateKey;
  const canViewLaterArchiveDate = archiveDateKey < todayKey;

  const shiftArchiveDate = (days: number) => {
    setArchiveDateKey((current) => {
      const base = current ? fromDateKey(current) : fromDateKey(todayKey);
      const next = addDays(base, days);
      const clamped = clampDate(next, fromDateKey(archiveEarliestDateKey), fromDateKey(todayKey));
      return formatDateKey(clamped);
    });
  };

  useEffect(() => {
    setArchiveDateKey((current) => {
      if (!current) return todayKey;
      if (current < archiveEarliestDateKey) return archiveEarliestDateKey;
      if (current > todayKey) return todayKey;
      return current;
    });
  }, [archiveEarliestDateKey, todayKey]);

  useEffect(() => {
    if (!loading && actorCanManageSchedule) return;
    archiveSyncRef.current = false;
    setSyncingArchive(false);
  }, [actorCanManageSchedule, loading]);

  useEffect(() => {
    if (loading || !actorCanManageSchedule || archiveSyncRef.current) return;

    const todaySnapshot =
      logArchiveSnapshots.find((snapshot) => String(snapshot.snapshot_date || '') === todayKey) || null;
    const shouldCreateTodaySnapshot = !todaySnapshot;
    const shouldUpdateTodaySnapshot = Boolean(
      todaySnapshot && toJsonText(todaySnapshot.payload_json) !== todayLogArchivePayloadJson,
    );

    const staleSnapshots = logArchiveSnapshots.filter((snapshot) => {
      const snapshotDate = String(snapshot.snapshot_date || '');
      if (!snapshotDate) return false;
      return snapshotDate < archiveEarliestDateKey;
    });

    if (!shouldCreateTodaySnapshot && !shouldUpdateTodaySnapshot && !staleSnapshots.length) return;

    archiveSyncRef.current = true;
    setSyncingArchive(true);

    const syncArchive = async () => {
      try {
        if (shouldCreateTodaySnapshot) {
          const { error } = await supabase.from('workforce_dashboard_snapshots').insert([
            {
              snapshot_type: LOG_ARCHIVE_SNAPSHOT_TYPE,
              snapshot_date: todayKey,
              location_id: 'wf_loc_main',
              payload_json: todayLogArchivePayloadJson,
            },
          ]);
          if (error) throw error;
        } else if (shouldUpdateTodaySnapshot && todaySnapshot?.id) {
          const { error } = await supabase
            .from('workforce_dashboard_snapshots')
            .update({
              payload_json: todayLogArchivePayloadJson,
              snapshot_type: LOG_ARCHIVE_SNAPSHOT_TYPE,
              snapshot_date: todayKey,
            })
            .eq('id', todaySnapshot.id);
          if (error) throw error;
        }

        for (const snapshot of staleSnapshots) {
          if (!snapshot.id) continue;
          const { error } = await supabase.from('workforce_dashboard_snapshots').delete().eq('id', snapshot.id);
          if (error) throw error;
        }

        await fetchAll();
      } catch (error) {
        console.error('Failed to sync log archive snapshot', error);
      } finally {
        setSyncingArchive(false);
        archiveSyncRef.current = false;
      }
    };

    void syncArchive();
  }, [
    actorCanManageSchedule,
    archiveEarliestDateKey,
    loading,
    logArchiveSnapshots,
    todayKey,
    todayLogArchivePayloadJson,
  ]);

  const recordEvent = async (
    eventType: string,
    subjectType: string,
    subjectId: string,
    metadata: Record<string, unknown> = {},
  ) => {
    const { error } = await supabase.from('workforce_events').insert([
      {
        event_type: eventType,
        actor_id: actorUserId,
        subject_type: subjectType,
        subject_id: subjectId,
        location_id: 'wf_loc_main',
        timestamp: new Date().toISOString(),
        metadata_json: JSON.stringify(metadata),
        correlation_id: `corr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      },
    ]);

    if (error) {
      throw new Error(error.message || 'Failed to write event log');
    }
  };

  const openCreateEmployeeEditor = () => {
    const defaultRole = roles[0];
    const defaultRate = String(defaultRole?.hourly_rate || 24);
    setEmployeeEditorMode('create');
    setEditingEmployee(null);
    setEmployeeDraft(
      buildEmployeeDraft(defaultRole?.id || '', defaultRate),
    );
    setEmployeeRoleDrafts([buildRoleRateDraft(defaultRole?.id || '', defaultRate, true)]);
    setDocumentDraft({ doc_type: 'ID Scan', notes: '' });
    setShowEmployeeForm(true);
  };

  const openEditEmployeeEditor = (employee: WorkforceEmployee) => {
    const assignments = (employeeRoleAssignmentsByEmployeeId[employee.id] || []).filter(
      (assignment) => assignment.active !== false,
    );
    const primaryAssignment =
      assignments.find((assignment) => Boolean(assignment.primary_role)) || assignments[0];
    const primaryRoleId = primaryAssignment?.role_id || roles[0]?.id || '';
    const primaryRate = Number(
      primaryAssignment?.hourly_rate ?? employee.hourly_rate ?? roleById[primaryRoleId]?.hourly_rate ?? 24,
    );
    const teamMember = teamMemberByUserId[String(employee.user_id || '')];
    const pto = ptoByEmployeeId[employee.id];
    const ptoUnit = normalizePtoUnit(employee.pto_unit ?? pto?.pto_unit);
    const canManageSchedule =
      teamMember?.can_manage_schedule !== undefined
        ? Boolean(teamMember.can_manage_schedule)
        : Boolean(teamMember?.can_access_workforce);
    const payBasis =
      employee.pay_basis === 'weekly' || employee.pay_basis === 'monthly'
        ? employee.pay_basis
        : 'hourly';
    const compensationAmount = Number(
      employee.compensation_amount ?? employee.hourly_rate ?? primaryRate,
    );
    const weeklyHours = Number(employee.compensation_weekly_hours ?? 40);
    const monthlyHours = Number(employee.compensation_monthly_hours ?? 173.33);

    const assignmentDrafts =
      assignments.length > 0
        ? assignments.map((assignment, index) =>
            buildRoleRateDraft(
              assignment.role_id,
              String(assignment.hourly_rate ?? roleById[assignment.role_id]?.hourly_rate ?? 24),
              Boolean(assignment.primary_role) || index === 0,
            ),
          )
        : [buildRoleRateDraft(primaryRoleId, String(primaryRate), true)];

    setEmployeeEditorMode('edit');
    setEditingEmployee(employee);
    setEmployeeRoleDrafts(assignmentDrafts);
    setEmployeeDraft({
      name: employee.name || '',
      email: String(employee.email || ''),
      phone: String(employee.phone || ''),
      title: String(employee.title || roleById[primaryRoleId]?.name || ''),
      role_id: primaryRoleId,
      pay_basis: payBasis,
      hourly_rate: formatDecimalInput(compensationAmount),
      weekly_hours: formatDecimalInput(weeklyHours),
      monthly_hours: formatDecimalInput(monthlyHours),
      hire_date: String(employee.hire_date || new Date().toISOString().slice(0, 10)),
      availability: String(employee.availability || 'Open availability'),
      login_username: String(employee.login_username || employee.email || ''),
      login_password: String(employee.login_password || ''),
      pto_unit: ptoUnit,
      pto_accrued_hours: formatDecimalInput(ptoHoursToDisplay(Number(pto?.accrued_hours ?? 80), ptoUnit)),
      pto_used_hours: formatDecimalInput(ptoHoursToDisplay(Number(pto?.used_hours ?? 0), ptoUnit)),
      can_access_menu_management: false,
      can_access_operations:
        teamMember?.can_access_operations !== undefined
          ? Boolean(teamMember.can_access_operations)
          : true,
      can_access_workforce: canManageSchedule,
      can_manage_schedule: canManageSchedule,
      can_access_content_management: false,
      can_access_career_management: false,
      can_access_investment: false,
      can_access_settings: false,
      can_view_reservations: false,
      can_view_events_parties: false,
      can_view_classes: false,
      operations_classes_read_only: false,
      active: employee.status !== 'inactive',
    });
    setDocumentDraft({ doc_type: 'ID Scan', notes: '' });
    setShowEmployeeForm(true);
  };

  const closeEmployeeEditor = () => {
    setShowEmployeeForm(false);
    setEditingEmployee(null);
    setEmployeeRoleDrafts([]);
  };

  const ptoAccruedValue = Number(employeeDraft.pto_accrued_hours || 0);
  const ptoUsedValue = Number(employeeDraft.pto_used_hours || 0);
  const ptoAvailableValue = Math.max(0, ptoAccruedValue - ptoUsedValue);
  const compensationAmountValue = Number(employeeDraft.hourly_rate || 0);
  const weeklyHoursValue = Number(employeeDraft.weekly_hours || 0);
  const monthlyHoursValue = Number(employeeDraft.monthly_hours || 0);
  const derivedHourlyRateValue = calculateDerivedHourlyRate(
    employeeDraft.pay_basis,
    compensationAmountValue,
    weeklyHoursValue,
    monthlyHoursValue,
  );
  const canCalculateDerivedHourly =
    employeeDraft.pay_basis === 'hourly' ||
    (employeeDraft.pay_basis === 'weekly' && weeklyHoursValue > 0) ||
    (employeeDraft.pay_basis === 'monthly' && monthlyHoursValue > 0);

  const setPtoUnit = (nextUnit: 'hours' | 'days') => {
    setEmployeeDraft((current) => {
      const currentUnit = current.pto_unit === 'days' ? 'days' : 'hours';
      if (currentUnit === nextUnit) return current;

      const currentMultiplier = currentUnit === 'days' ? PTO_HOURS_PER_DAY : 1;
      const nextMultiplier = nextUnit === 'days' ? PTO_HOURS_PER_DAY : 1;

      const accruedInHours = Number(current.pto_accrued_hours || 0) * currentMultiplier;
      const usedInHours = Number(current.pto_used_hours || 0) * currentMultiplier;

      return {
        ...current,
        pto_unit: nextUnit,
        pto_accrued_hours: formatDecimalInput(accruedInHours / nextMultiplier),
        pto_used_hours: formatDecimalInput(usedInHours / nextMultiplier),
      };
    });
  };

  const addRoleDraftRow = () => {
    const fallbackRole = roles[0]?.id || '';
    const fallbackRate = String(roleById[fallbackRole]?.hourly_rate || 24);
    setEmployeeRoleDrafts((current) => [
      ...current,
      buildRoleRateDraft(fallbackRole, fallbackRate, current.length === 0),
    ]);
  };

  const updateRoleDraft = (
    rowId: string,
    patch: Partial<ReturnType<typeof buildRoleRateDraft>>,
  ) => {
    setEmployeeRoleDrafts((current) =>
      current.map((row) => {
        if (row.id !== rowId) return row;
        const nextRoleId = patch.role_id ?? row.role_id;
        const nextHourlyRate =
          patch.hourly_rate ??
          (patch.role_id ? String(roleById[nextRoleId]?.hourly_rate ?? row.hourly_rate ?? '24') : row.hourly_rate);
        return {
          ...row,
          ...patch,
          role_id: nextRoleId,
          hourly_rate: nextHourlyRate,
        };
      }),
    );
  };

  const removeRoleDraft = (rowId: string) => {
    setEmployeeRoleDrafts((current) => {
      const remaining = current.filter((row) => row.id !== rowId);
      if (remaining.length === 0) {
        return [buildRoleRateDraft(roles[0]?.id || '', String(roles[0]?.hourly_rate || 24), true)];
      }
      if (!remaining.some((row) => row.primary_role)) {
        remaining[0] = { ...remaining[0], primary_role: true };
      }
      return remaining;
    });
  };

  const setPrimaryRoleDraft = (rowId: string) => {
    setEmployeeRoleDrafts((current) =>
      current.map((row) => ({
        ...row,
        primary_role: row.id === rowId,
      })),
    );
  };

  const upsertTeamMemberPermissions = async (
    userId: string,
    email: string,
    name: string,
    title: string,
    active: boolean,
  ) => {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = teamMembers.find(
      (member) =>
        (userId && member.user_id === userId) ||
        (normalizedEmail && String(member.email || '').trim().toLowerCase() === normalizedEmail),
    );

    const canAccessOperations = Boolean(employeeDraft.can_access_operations);
    const canManageSchedule = Boolean(employeeDraft.can_manage_schedule);
    const payload = {
      user_id: userId,
      email,
      name,
      title,
      portal: existing?.portal || 'staff',
      can_access_menu_management: false,
      can_access_operations: canAccessOperations,
      can_access_workforce: canManageSchedule,
      can_manage_schedule: canManageSchedule,
      can_access_content_management: false,
      can_access_career_management: false,
      can_access_investment: false,
      can_access_settings: false,
      can_view_reservations: false,
      can_view_events_parties: false,
      can_view_classes: false,
      operations_classes_read_only: false,
      active,
    };

    if (existing?.id) {
      const { error } = await supabase.from('team_members').update(payload).eq('id', existing.id);
      if (error) throw error;
      return;
    }

    const { error } = await supabase.from('team_members').insert([
      {
        id: `tm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        ...payload,
      },
    ]);
    if (error) throw error;
  };

  const createRoleDefinition = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const roleName = roleDraft.name.trim();
    if (!roleName) {
      alert('Role name is required.');
      return;
    }

    const duplicate = roles.some(
      (role) => String(role.name || '').trim().toLowerCase() === roleName.toLowerCase(),
    );
    if (duplicate) {
      alert('A role with that name already exists.');
      return;
    }

    setCreatingRole(true);
    try {
      const roleSection = normalizeRoleSection(roleDraft.role_section);
      const sectionOrders = roles
        .filter((role) => normalizeRoleSection(String(role.role_section || '')) === roleSection)
        .map((role) => parseDisplayOrder(role.display_order, 0));
      const nextDisplayOrder = Math.max(0, ...sectionOrders) + 1;
      const displayOrder = parseDisplayOrder(roleDraft.display_order, nextDisplayOrder);
      const hourlyRate = Number(roleDraft.hourly_rate || 0);
      const payload = {
        id: makeRoleId(roleName),
        name: roleName,
        role_section: roleSection,
        display_order: displayOrder,
        hourly_rate: Number.isFinite(hourlyRate) ? hourlyRate : 0,
        active: true,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('workforce_roles').insert([payload]);
      if (error) throw error;

      await fetchAll();
      setRoleDraft({
        name: '',
        role_section: roleSection,
        display_order: String(nextDisplayOrder + 1),
        hourly_rate: String(payload.hourly_rate || 0),
      });
      setShowRoleForm(false);
    } catch (error) {
      alert(`Failed to create role: ${(error as Error).message}`);
    } finally {
      setCreatingRole(false);
    }
  };

  const saveRoleDefinition = async (role: WorkforceRole) => {
    const edit = roleEditsById[role.id];
    if (!edit) return;

    const roleName = String(edit.name || '').trim();
    if (!roleName) {
      alert('Role name is required.');
      return;
    }

    const duplicate = roles.some(
      (candidate) =>
        candidate.id !== role.id &&
        String(candidate.name || '').trim().toLowerCase() === roleName.toLowerCase(),
    );
    if (duplicate) {
      alert('A role with that name already exists.');
      return;
    }

    setSavingRoleId(role.id);
    try {
      const roleSection = normalizeRoleSection(edit.role_section);
      const sectionOrders = roles
        .filter(
          (candidate) =>
            candidate.id !== role.id &&
            normalizeRoleSection(String(candidate.role_section || '')) === roleSection,
        )
        .map((candidate) => parseDisplayOrder(candidate.display_order, 0));
      const nextDisplayOrder = Math.max(0, ...sectionOrders) + 1;
      const displayOrder = parseDisplayOrder(edit.display_order, nextDisplayOrder);
      const hourlyRate = Number(edit.hourly_rate || 0);
      const { error } = await supabase
        .from('workforce_roles')
        .update({
          name: roleName,
          role_section: roleSection,
          display_order: displayOrder,
          hourly_rate: Number.isFinite(hourlyRate) ? hourlyRate : 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', role.id);
      if (error) throw error;
      await fetchAll();
    } catch (error) {
      alert(`Failed to save role: ${(error as Error).message}`);
    } finally {
      setSavingRoleId('');
    }
  };

  const archiveRoleDefinition = async (role: WorkforceRole) => {
    if (roles.length <= 1) {
      alert('At least one active role is required.');
      return;
    }

    const usageCount = Number(roleUsageCountById[role.id] || 0);
    if (usageCount > 0) {
      alert(`This role is still in use (${usageCount} linked records). Reassign team/schedule records first.`);
      return;
    }

    if (!window.confirm(`Archive role "${role.name}"?`)) return;

    setSavingRoleId(role.id);
    try {
      const { error } = await supabase
        .from('workforce_roles')
        .update({
          active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', role.id);
      if (error) throw error;
      await fetchAll();
    } catch (error) {
      alert(`Failed to archive role: ${(error as Error).message}`);
    } finally {
      setSavingRoleId('');
    }
  };

  const ensureUserLogin = async (fallbackEmail: string) => {
    const loginUsername = employeeDraft.login_username.trim() || fallbackEmail.trim();
    const loginPassword = employeeDraft.login_password.trim();
    let nextUserId = String(editingEmployee?.user_id || '').trim();
    const normalizedLoginUsername = loginUsername.trim().toLowerCase();

    if (!nextUserId && normalizedLoginUsername) {
      const existingTeamMember = teamMembers.find(
        (member) => String(member.email || '').trim().toLowerCase() === normalizedLoginUsername,
      );
      if (existingTeamMember?.user_id) {
        nextUserId = String(existingTeamMember.user_id);
      } else if (employeeByEmail[normalizedLoginUsername]?.user_id) {
        nextUserId = String(employeeByEmail[normalizedLoginUsername].user_id || '');
      }
    }

    if (!loginUsername) {
      return {
        userId: nextUserId,
        loginUsername: '',
      };
    }

    if (!allowAuthAdminSync) {
      return {
        userId: nextUserId,
        loginUsername,
      };
    }

    const adminApi = (
      supabaseAdmin as unknown as {
        auth?: { admin?: WorkforceAuthAdminApi };
      }
    )?.auth?.admin;
    if (!adminApi) {
      return {
        userId: nextUserId,
        loginUsername,
      };
    }

    if (!nextUserId && typeof adminApi.createUser === 'function') {
      const { data, error } = await adminApi.createUser({
        email: loginUsername,
        password: loginPassword || 'spoonbill-temp',
      });

      if (error) {
        const existingTeam = teamMembers.find(
          (member) =>
            String(member.email || '').trim().toLowerCase() === loginUsername.trim().toLowerCase(),
        );
        if (existingTeam?.user_id) {
          nextUserId = existingTeam.user_id;
        } else {
          throw error;
        }
      } else if (data?.user?.id) {
        nextUserId = String(data.user.id);
      }
    }

    if (nextUserId && typeof adminApi.updateUserById === 'function') {
      const updatePayload: Record<string, string> = {};
      if (loginUsername) updatePayload.email = loginUsername;
      if (loginPassword) updatePayload.password = loginPassword;

      if (Object.keys(updatePayload).length > 0) {
        const { error } = await adminApi.updateUserById(nextUserId, updatePayload);
        if (error) throw error;
      }
    }

    return {
      userId: nextUserId,
      loginUsername,
    };
  };

  const saveEmployeeProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!employeeDraft.name.trim()) {
      alert('Employee name is required.');
      return;
    }
    const payBasis =
      employeeDraft.pay_basis === 'weekly' || employeeDraft.pay_basis === 'monthly'
        ? employeeDraft.pay_basis
        : 'hourly';
    const compensationAmount = Number(employeeDraft.hourly_rate || 0);
    const weeklyHours = Number(employeeDraft.weekly_hours || 0);
    const monthlyHours = Number(employeeDraft.monthly_hours || 0);

    if (payBasis === 'weekly' && weeklyHours <= 0) {
      alert('Weekly hours must be greater than 0 to calculate hourly rate.');
      return;
    }

    if (payBasis === 'monthly' && monthlyHours <= 0) {
      alert('Monthly hours must be greater than 0 to calculate hourly rate.');
      return;
    }

    const derivedHourlyCompensation = calculateDerivedHourlyRate(
      payBasis,
      compensationAmount,
      weeklyHours,
      monthlyHours,
    );
    if (derivedHourlyCompensation <= 0) {
      alert('Compensation must be greater than 0.');
      return;
    }

    const normalizedRoleAssignments = employeeRoleDrafts
      .map((row, index) => ({
        role_id: String(row.role_id || '').trim(),
        hourly_rate: derivedHourlyCompensation,
        primary_role: Boolean(row.primary_role) || index === 0,
      }))
      .filter((row) => row.role_id)
      .filter((row, index, rows) => rows.findIndex((candidate) => candidate.role_id === row.role_id) === index);

    if (normalizedRoleAssignments.length === 0) {
      alert('At least one role is required.');
      return;
    }

    const primaryRoleAssignment =
      normalizedRoleAssignments.find((row) => row.primary_role) || normalizedRoleAssignments[0];
    const primaryRoleId = primaryRoleAssignment.role_id;
    const primaryRoleRate = derivedHourlyCompensation;

    if (!employeeDraft.email.trim()) {
      alert('Company email is required so this employee can be linked to the existing dashboard login.');
      return;
    }

    setSaving(true);
    try {
      const normalizedEmail = employeeDraft.email.trim();
      const { userId, loginUsername } = await ensureUserLogin(normalizedEmail);
      const employeeEmail = normalizedEmail || loginUsername;
      const active = Boolean(employeeDraft.active);

      const employeePayload = {
        user_id: userId || null,
        name: employeeDraft.name.trim(),
        email: employeeEmail || null,
        phone: employeeDraft.phone.trim() || null,
        title: employeeDraft.title.trim() || roleById[primaryRoleId]?.name || 'Employee',
        status: active ? 'active' : 'inactive',
        default_location_id: 'wf_loc_main',
        hire_date: employeeDraft.hire_date,
        pay_basis: payBasis,
        hourly_rate: derivedHourlyCompensation,
        compensation_amount: compensationAmount,
        compensation_weekly_hours: weeklyHours,
        compensation_monthly_hours: monthlyHours,
        availability: employeeDraft.availability.trim() || 'Open availability',
        pto_unit: normalizePtoUnit(employeeDraft.pto_unit),
        login_username: loginUsername || employeeEmail || null,
        login_password: allowAuthAdminSync ? employeeDraft.login_password.trim() || null : null,
        attendance_score: editingEmployee?.attendance_score ?? 100,
      };

      let employeeId = editingEmployee?.id || '';

      if (employeeEditorMode === 'create') {
        const { data: employeeRow, error } = await supabase
          .from('workforce_employees')
          .insert([employeePayload])
          .select('*')
          .single();
        if (error) throw error;
        employeeId = String(employeeRow.id || '');
      } else {
        const { error } = await supabase
          .from('workforce_employees')
          .update(employeePayload)
          .eq('id', employeeId);
        if (error) throw error;
      }

      const { error: clearRoleError } = await supabase
        .from('workforce_employee_roles')
        .delete()
        .eq('employee_id', employeeId);
      if (clearRoleError) throw clearRoleError;

      const roleAssignmentRows = normalizedRoleAssignments.map((assignment, index) => ({
        id: `wf_er_${employeeId}_${assignment.role_id}_${Date.now()}_${index}`,
        employee_id: employeeId,
        role_id: assignment.role_id,
        hourly_rate: Number(assignment.hourly_rate || roleById[assignment.role_id]?.hourly_rate || 24),
        primary_role: assignment.role_id === primaryRoleId,
        active: true,
      }));

      const { error: roleInsertError } = await supabase
        .from('workforce_employee_roles')
        .insert(roleAssignmentRows);
      if (roleInsertError) throw roleInsertError;

      const { error: shiftRateUpdateError } = await supabase
        .from('workforce_shifts')
        .update({
          wage_rate: primaryRoleRate,
        })
        .eq('employee_id', employeeId)
        .eq('role_id', primaryRoleId);
      if (shiftRateUpdateError) {
        // Non-blocking: historical shifts can keep historical rates.
      }

      const { error: setPrimaryRoleShiftError } = await supabase
        .from('workforce_shifts')
        .update({
          role_id: primaryRoleId,
          wage_rate: primaryRoleRate,
        })
        .eq('employee_id', employeeId)
        .eq('role_id', null);
      if (setPrimaryRoleShiftError) {
        // Non-blocking fallback in case no null-role shifts exist.
      }

      const ptoUnit = normalizePtoUnit(employeeDraft.pto_unit);
      const accrued = ptoDisplayToHours(Number(employeeDraft.pto_accrued_hours || 0), ptoUnit);
      const used = ptoDisplayToHours(Number(employeeDraft.pto_used_hours || 0), ptoUnit);
      const available = Math.max(0, accrued - used);
      const existingPto = ptoByEmployeeId[employeeId];

      if (existingPto?.id) {
        const { error: ptoError } = await supabase
          .from('workforce_pto_balances')
          .update({
            accrued_hours: accrued,
            used_hours: used,
            available_hours: available,
            pto_unit: ptoUnit,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPto.id);
        if (ptoError) throw ptoError;
      } else {
        const { error: ptoInsertError } = await supabase
          .from('workforce_pto_balances')
          .insert([
            {
              employee_id: employeeId,
              accrued_hours: accrued,
              used_hours: used,
              available_hours: available,
              pto_unit: ptoUnit,
              updated_at: new Date().toISOString(),
            },
          ]);
        if (ptoInsertError) throw ptoInsertError;
      }

      if (userId || employeeEmail) {
        await upsertTeamMemberPermissions(
          userId || '',
          employeeEmail,
          employeeDraft.name.trim(),
          employeeDraft.title.trim() || roleById[primaryRoleId]?.name || 'Employee',
          active,
        );
      }

      await recordEvent(
        employeeEditorMode === 'create' ? 'EMPLOYEE_CREATED' : 'EMPLOYEE_UPDATED',
        'employee',
        employeeId,
        {
          role_ids: normalizedRoleAssignments.map((assignment) => assignment.role_id),
        },
      );

      await fetchAll();
      closeEmployeeEditor();
    } catch (error) {
      alert(`Failed to save employee profile: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const uploadEmployeeDocument = async (file: File) => {
    if (!editingEmployee?.id) return;
    setUploadingDocument(true);
    try {
      const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const filePath = `${editingEmployee.id}/${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('employee-documents')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('employee-documents').getPublicUrl(filePath);

      const { error: insertError } = await supabase.from('workforce_employee_documents').insert([
        {
          employee_id: editingEmployee.id,
          doc_type: documentDraft.doc_type.trim() || 'Document',
          file_name: file.name,
          file_path: filePath,
          public_url: publicUrl,
          notes: documentDraft.notes.trim(),
          uploaded_at: new Date().toISOString(),
        },
      ]);
      if (insertError) throw insertError;

      await recordEvent('EMPLOYEE_DOCUMENT_UPLOADED', 'employee', editingEmployee.id, {
        file_name: file.name,
        doc_type: documentDraft.doc_type.trim() || 'Document',
      });

      await fetchAll();
      setDocumentDraft((current) => ({ ...current, notes: '' }));
    } catch (error) {
      alert(`Failed to upload document: ${(error as Error).message}`);
    } finally {
      setUploadingDocument(false);
    }
  };

  const deleteEmployeeDocument = async (document: WorkforceEmployeeDocument) => {
    if (!confirm('Delete this employee document?')) return;

    setSaving(true);
    try {
      await supabase.storage.from('employee-documents').remove([document.file_path]);
      const { error } = await supabase
        .from('workforce_employee_documents')
        .delete()
        .eq('id', document.id);
      if (error) throw error;

      await recordEvent('EMPLOYEE_DOCUMENT_DELETED', 'employee', document.employee_id, {
        file_name: document.file_name,
      });
      await fetchAll();
    } catch (error) {
      alert(`Failed to delete document: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const openCreateShiftForm = () => {
    setEditingShiftId('');
    setShiftDraft((current) => ({
      ...buildShiftDraft(),
      employee_id: current.employee_id || employees[0]?.id || '',
      role_id: current.role_id || roles[0]?.id || '',
      station_id: current.station_id || stations[0]?.id || '',
    }));
    setShowShiftForm(true);
  };

  const openEditShiftForm = (shift: WorkforceShift) => {
    const startDate = new Date(shift.start_time);
    const shiftDate = Number.isNaN(startDate.getTime())
      ? new Date().toISOString().slice(0, 10)
      : formatDateKey(startDate);

    setEditingShiftId(shift.id);
    setShiftDraft({
      employee_id: shift.employee_id || '',
      role_id: shift.role_id || '',
      station_id: String(shift.station_id || ''),
      date: shiftDate,
      start_time: toTimeLabel(shift.start_time),
      end_time: toTimeLabel(shift.end_time),
      wage_rate: String(shift.wage_rate || ''),
    });
    setShowShiftForm(true);
  };

  const cancelShiftEditor = () => {
    setShowShiftForm(false);
    setEditingShiftId('');
    setShiftDraft(buildShiftDraft());
  };

  const requestPtoOverrideReason = (
    employeeId: string,
    startAt: string,
    endAt: string,
    contextLabel: string,
  ) => {
    const conflicts = getApprovedTimeOffConflictsForShift(employeeId, startAt, endAt);
    if (!conflicts.length) {
      return {
        conflicts: [] as WorkforceTimeOffRequest[],
        overrideReason: '',
      };
    }

    const employeeName = employeeById[employeeId]?.name || 'This team member';
    const conflictSummary = conflicts
      .map(
        (request) =>
          `${request.start_date} to ${request.end_date} (${formatTimeOffTypeLabel(request.request_type)})`,
      )
      .join('\n');

    const reason = window.prompt(
      `${employeeName} has approved time off during this ${contextLabel}:\n${conflictSummary}\n\nEnter an override reason to continue scheduling:`,
      '',
    );

    if (!reason || !reason.trim()) {
      return null;
    }

    return {
      conflicts,
      overrideReason: reason.trim(),
    };
  };

  const saveShiftDraft = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!shiftDraft.employee_id || !shiftDraft.role_id || !shiftDraft.date) {
      alert('Employee, role, and date are required.');
      return;
    }

    if (shiftDraft.end_time === shiftDraft.start_time) {
      alert('Start and end time cannot be the same.');
      return;
    }

    const startAt = `${shiftDraft.date}T${shiftDraft.start_time}:00`;
    const endAt = `${shiftDraft.date}T${shiftDraft.end_time}:00`;

    const overrideDecision = requestPtoOverrideReason(
      shiftDraft.employee_id,
      startAt,
      endAt,
      'shift',
    );
    if (overrideDecision === null) {
      alert('Shift save cancelled. Override reason is required when approved time off exists.');
      return;
    }
    const conflictRequestIds = overrideDecision.conflicts.map((request) => request.id);
    const overrideReason = overrideDecision.overrideReason || null;

    setSaving(true);
    try {
      if (editingShiftId) {
        const { error } = await supabase
          .from('workforce_shifts')
          .update({
            employee_id: shiftDraft.employee_id,
            role_id: shiftDraft.role_id,
            station_id: shiftDraft.station_id || null,
            start_time: startAt,
            end_time: endAt,
            wage_rate: shiftDraftCalculatedRate,
            override_reason: overrideReason,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingShiftId);
        if (error) throw error;

        await recordEvent('SHIFT_UPDATED', 'shift', editingShiftId, {
          employee_id: shiftDraft.employee_id,
          role_id: shiftDraft.role_id,
          start_time: startAt,
          end_time: endAt,
          override_reason: overrideReason,
          pto_conflict_request_ids: conflictRequestIds,
        });
      } else {
        const { data: shiftRow, error } = await supabase
          .from('workforce_shifts')
          .insert([
            {
              employee_id: shiftDraft.employee_id,
              role_id: shiftDraft.role_id,
              location_id: 'wf_loc_main',
              station_id: shiftDraft.station_id || null,
              start_time: startAt,
              end_time: endAt,
              break_rules: 'ca_standard',
              wage_rate: shiftDraftCalculatedRate,
              override_reason: overrideReason,
              status: 'draft',
            },
          ])
          .select('*')
          .single();

        if (error) throw error;

        await recordEvent('SHIFT_CREATED', 'shift', String(shiftRow.id), {
          employee_id: shiftDraft.employee_id,
          role_id: shiftDraft.role_id,
          start_time: startAt,
          end_time: endAt,
          override_reason: overrideReason,
          pto_conflict_request_ids: conflictRequestIds,
        });
      }

      await fetchAll();
      cancelShiftEditor();
    } catch (error) {
      alert(`Failed to save shift: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const createShiftCopy = async (
    baseShift: WorkforceShift,
    targetDateKey: string,
    targetEmployeeId?: string,
    options?: { overrideReasonForConflicts?: string | null; contextLabel?: string },
  ) => {
    const startClock = `${toTimeLabel(baseShift.start_time)}:00`;
    const endClock = `${toTimeLabel(baseShift.end_time)}:00`;
    const startAt = toDateTime(targetDateKey, startClock);

    const startsAtMinutes = toMinutes(toTimeLabel(baseShift.start_time));
    const endsAtMinutes = toMinutes(toTimeLabel(baseShift.end_time));
    const crossesMidnight = endsAtMinutes <= startsAtMinutes;
    const endDateKey = crossesMidnight ? formatDateKey(addDays(fromDateKey(targetDateKey), 1)) : targetDateKey;
    const endAt = toDateTime(endDateKey, endClock);
    const employeeId = targetEmployeeId || baseShift.employee_id;

    const conflicts = getApprovedTimeOffConflictsForShift(employeeId, startAt, endAt);
    let overrideReason = '';
    if (conflicts.length > 0) {
      if (options?.overrideReasonForConflicts && options.overrideReasonForConflicts.trim()) {
        overrideReason = options.overrideReasonForConflicts.trim();
      } else {
        const decision = requestPtoOverrideReason(
          employeeId,
          startAt,
          endAt,
          options?.contextLabel || 'shift copy',
        );
        if (!decision) {
          throw new Error('Override reason is required when approved time off exists.');
        }
        overrideReason = decision.overrideReason;
      }
    }

    const payload = {
      employee_id: employeeId,
      role_id: baseShift.role_id,
      location_id: baseShift.location_id || 'wf_loc_main',
      station_id: baseShift.station_id || null,
      start_time: startAt,
      end_time: endAt,
      break_rules: 'ca_standard',
      wage_rate: Number(baseShift.wage_rate || roleById[baseShift.role_id]?.hourly_rate || 24),
      override_reason: overrideReason || null,
      status: 'draft',
    };

    const { data: shiftRow, error } = await supabase
      .from('workforce_shifts')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to duplicate shift');
    }

    await recordEvent('SHIFT_DUPLICATED', 'shift', String(shiftRow.id), {
      source_shift_id: baseShift.id,
      employee_id: payload.employee_id,
      start_time: payload.start_time,
      end_time: payload.end_time,
      override_reason: overrideReason || null,
      pto_conflict_request_ids: conflicts.map((request) => request.id),
    });
  };

  const deleteShift = async (shift: WorkforceShift) => {
    if (!confirm('Delete this shift?')) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('workforce_shifts').delete().eq('id', shift.id);
      if (error) throw error;

      await recordEvent('SHIFT_DELETED', 'shift', shift.id, {
        employee_id: shift.employee_id,
      });

      await fetchAll();
    } catch (error) {
      alert(`Failed to delete shift: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const duplicateShiftToCell = async (shift: WorkforceShift, targetDateKey: string, targetEmployeeId?: string) => {
    setSaving(true);
    try {
      await createShiftCopy(shift, targetDateKey, targetEmployeeId, {
        contextLabel: 'duplicated shift',
      });
      await fetchAll();
    } catch (error) {
      alert(`Failed to duplicate shift: ${(error as Error).message}`);
    } finally {
      setSaving(false);
      setDraggingShiftId(null);
    }
  };

  const copyPreviousWeek = async () => {
    if (scheduleView !== 'week') {
      alert('Switch to week view to copy a week schedule.');
      return;
    }

    if (!confirm('Copy previous week shifts into this week? Existing shifts will remain.')) {
      return;
    }

    const currentWeekStart = startOfWeek(scheduleWindowStart);
    const previousWeekStart = addDays(currentWeekStart, -7);
    const previousWeekKeys = Array.from({ length: 7 }, (_, index) => formatDateKey(addDays(previousWeekStart, index)));
    const previousWeekSet = new Set(previousWeekKeys);

    const sourceShifts = shifts.filter((shift) =>
      previousWeekSet.has(formatDateKey(new Date(shift.start_time))),
    );

    if (!sourceShifts.length) {
      alert('No shifts found in the previous week.');
      return;
    }

    setSaving(true);
    try {
      const plannedCopies = sourceShifts.map((shift) => {
        const sourceDate = fromDateKey(formatDateKey(new Date(shift.start_time)));
        const dayOffset = Math.round((sourceDate.getTime() - previousWeekStart.getTime()) / 86400000);
        const targetDateKey = formatDateKey(addDays(currentWeekStart, dayOffset));
        return { shift, targetDateKey };
      });

      const conflictCount = plannedCopies.reduce((count, entry) => {
        const startAt = toDateTime(entry.targetDateKey, `${toTimeLabel(entry.shift.start_time)}:00`);
        const endAt = toDateTime(entry.targetDateKey, `${toTimeLabel(entry.shift.end_time)}:00`);
        return count + getApprovedTimeOffConflictsForShift(entry.shift.employee_id, startAt, endAt).length;
      }, 0);

      let overrideReasonForConflicts: string | null = null;
      if (conflictCount > 0) {
        const reason = window.prompt(
          `${conflictCount} approved PTO conflict(s) were found while copying the week. Enter one override reason to continue:`,
          '',
        );
        if (!reason || !reason.trim()) {
          throw new Error('Copy cancelled. Override reason is required for approved PTO conflicts.');
        }
        overrideReasonForConflicts = reason.trim();
      }

      for (const entry of plannedCopies) {
        await createShiftCopy(entry.shift, entry.targetDateKey, entry.shift.employee_id, {
          overrideReasonForConflicts,
          contextLabel: 'copied shift',
        });
      }

      await recordEvent('SCHEDULE_COPIED_PREVIOUS_WEEK', 'schedule', formatDateKey(currentWeekStart), {
        source_week_start: formatDateKey(previousWeekStart),
        shifts_copied: sourceShifts.length,
        pto_override_reason: overrideReasonForConflicts,
      });

      await fetchAll();
    } catch (error) {
      alert(`Failed to copy previous week: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const applyScheduleTemplate = async () => {
    if (scheduleView !== 'week') {
      alert('Switch to week view to apply schedule templates.');
      return;
    }

    if (!selectedTemplateId) {
      alert('Choose a template first.');
      return;
    }

    const templateRows = scheduleTemplateShifts.filter((shift) => shift.template_id === selectedTemplateId);
    if (!templateRows.length) {
      alert('This template has no shifts yet.');
      return;
    }

    setSaving(true);
    try {
      const baseWeekStart = startOfWeek(scheduleWindowStart);

      const plannedTemplateCopies = templateRows.map((templateShift) => {
        const targetDate = addDays(baseWeekStart, Number(templateShift.day_offset || 0));
        const targetDateKey = formatDateKey(targetDate);
        return { templateShift, targetDateKey };
      });

      const templateConflictCount = plannedTemplateCopies.reduce((count, entry) => {
        const startAt = toDateTime(entry.targetDateKey, entry.templateShift.start_time);
        const endAt = toDateTime(entry.targetDateKey, entry.templateShift.end_time);
        return (
          count +
          getApprovedTimeOffConflictsForShift(entry.templateShift.employee_id, startAt, endAt).length
        );
      }, 0);

      let overrideReasonForConflicts: string | null = null;
      if (templateConflictCount > 0) {
        const reason = window.prompt(
          `${templateConflictCount} approved PTO conflict(s) were found while applying the template. Enter one override reason to continue:`,
          '',
        );
        if (!reason || !reason.trim()) {
          throw new Error('Template apply cancelled. Override reason is required for approved PTO conflicts.');
        }
        overrideReasonForConflicts = reason.trim();
      }

      for (const entry of plannedTemplateCopies) {
        const templateShift = entry.templateShift;
        const targetDateKey = entry.targetDateKey;

        const pseudoShift: WorkforceShift = {
          id: templateShift.id,
          employee_id: templateShift.employee_id,
          role_id: templateShift.role_id,
          location_id: 'wf_loc_main',
          station_id: templateShift.station_id,
          start_time: toDateTime(targetDateKey, templateShift.start_time),
          end_time: toDateTime(targetDateKey, templateShift.end_time),
          wage_rate: templateShift.wage_rate,
          status: 'draft',
        };

        await createShiftCopy(pseudoShift, targetDateKey, templateShift.employee_id, {
          overrideReasonForConflicts,
          contextLabel: 'template shift',
        });
      }

      await recordEvent('SCHEDULE_TEMPLATE_APPLIED', 'schedule_template', selectedTemplateId, {
        week_start: formatDateKey(baseWeekStart),
        shift_count: templateRows.length,
        pto_override_reason: overrideReasonForConflicts,
      });

      await fetchAll();
    } catch (error) {
      alert(`Failed to apply template: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const saveWeekAsTemplate = async () => {
    if (scheduleView !== 'week') {
      alert('Switch to week view to save templates.');
      return;
    }

    const templateName = prompt('Template name');
    if (!templateName || !templateName.trim()) return;

    const baseWeekStart = startOfWeek(scheduleWindowStart);
    const shiftsToSave = shifts.filter((shift) => {
      const shiftDate = fromDateKey(formatDateKey(new Date(shift.start_time)));
      const dayOffset = Math.round((shiftDate.getTime() - baseWeekStart.getTime()) / 86400000);
      return dayOffset >= 0 && dayOffset <= 6;
    });

    if (!shiftsToSave.length) {
      alert('No shifts in this week to save.');
      return;
    }

    setSaving(true);
    try {
      const { data: templateRow, error: templateError } = await supabase
        .from('workforce_schedule_templates')
        .insert([
          {
            name: templateName.trim(),
            location_id: 'wf_loc_main',
            created_by: actorName,
          },
        ])
        .select('*')
        .single();

      if (templateError) throw templateError;

      const templateId = String(templateRow.id);

      const templateShiftRows = shiftsToSave.map((shift) => {
        const shiftDate = fromDateKey(formatDateKey(new Date(shift.start_time)));
        const dayOffset = Math.round((shiftDate.getTime() - baseWeekStart.getTime()) / 86400000);
        return {
          template_id: templateId,
          day_offset: dayOffset,
          employee_id: shift.employee_id,
          role_id: shift.role_id,
          station_id: shift.station_id || null,
          start_time: extractTimePart(shift.start_time),
          end_time: extractTimePart(shift.end_time),
          wage_rate: Number(shift.wage_rate || roleById[shift.role_id]?.hourly_rate || 24),
        };
      });

      const { error: templateShiftsError } = await supabase
        .from('workforce_schedule_template_shifts')
        .insert(templateShiftRows);

      if (templateShiftsError) throw templateShiftsError;

      await recordEvent('SCHEDULE_TEMPLATE_SAVED', 'schedule_template', templateId, {
        week_start: formatDateKey(baseWeekStart),
        shift_count: templateShiftRows.length,
      });

      await fetchAll();
      setSelectedTemplateId(templateId);
    } catch (error) {
      alert(`Failed to save template: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateTimeOffStatus = async (
    request: WorkforceTimeOffRequest,
    status: 'approved' | 'denied' | 'pending',
  ) => {
    const previousStatus = String(request.status || 'pending').toLowerCase();
    if (previousStatus === status) return;

    let statusNote = String(request.status_note || '').trim();
    if (status === 'denied') {
      const denialReason = window.prompt('Denial reason (required):', statusNote);
      if (!denialReason || !denialReason.trim()) {
        alert('A denial reason is required.');
        return;
      }
      statusNote = denialReason.trim();
    } else if (status === 'approved') {
      const approvalNote = window.prompt('Approval note (optional):', statusNote);
      if (approvalNote !== null) {
        statusNote = approvalNote.trim();
      }
    }

    const nowIso = new Date().toISOString();
    const employeeRecord = employeeById[request.employee_id];

    setSaving(true);
    try {
      const { error } = await supabase
        .from('workforce_time_off_requests')
        .update({
          status,
          status_note: statusNote || null,
          status_updated_by: actorUserId,
          status_updated_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', request.id);

      if (error) throw error;

      if (String(request.request_type || '').toLowerCase() === 'pto') {
        const pto = ptoByEmployeeId[request.employee_id];
        const requestHours = Number(request.hours || 0);
        const deltaHours =
          previousStatus !== 'approved' && status === 'approved'
            ? requestHours
            : previousStatus === 'approved' && status !== 'approved'
              ? -requestHours
              : 0;
        if (deltaHours !== 0) {
          const accrued = Number(pto?.accrued_hours || 0);
          const used = Math.max(0, Number(pto?.used_hours || 0) + deltaHours);
          const available = Math.max(0, accrued - used);
          const ptoUnit = getEmployeePtoUnit(request.employee_id);

          if (pto?.id) {
            const { error: ptoError } = await supabase
              .from('workforce_pto_balances')
              .update({
                used_hours: used,
                available_hours: available,
                pto_unit: ptoUnit,
                updated_at: nowIso,
              })
              .eq('id', pto.id);
            if (ptoError) throw ptoError;
          } else {
            const { error: ptoInsertError } = await supabase
              .from('workforce_pto_balances')
              .insert([
                {
                  employee_id: request.employee_id,
                  accrued_hours: 80,
                  used_hours: Math.max(0, deltaHours),
                  available_hours: Math.max(0, 80 - Math.max(0, deltaHours)),
                  pto_unit: ptoUnit,
                  updated_at: nowIso,
                },
              ]);
            if (ptoInsertError) throw ptoInsertError;
          }
        }
      }

      await recordEvent('TIME_OFF_REQUEST_STATUS_UPDATED', 'time_off_request', request.id, {
        employee_id: request.employee_id,
        employee_name: employeeRecord?.name || 'Employee',
        previous_status: previousStatus,
        status,
        status_note: statusNote || null,
        channels: ['in_app', 'email'],
        recipient_email: employeeRecord?.email || null,
      });
      await fetchAll();
    } catch (error) {
      alert(`Failed to update request status: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const createTimeOffBlock = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!timeOffBlockDraft.start_date || !timeOffBlockDraft.end_date) {
      alert('Start and end dates are required.');
      return;
    }
    if (timeOffBlockDraft.end_date < timeOffBlockDraft.start_date) {
      alert('End date cannot be before start date.');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('workforce_time_off_blocks')
        .insert([
          {
            start_date: timeOffBlockDraft.start_date,
            end_date: timeOffBlockDraft.end_date,
            reason: timeOffBlockDraft.reason.trim() || null,
            active: true,
            created_at: new Date().toISOString(),
          },
        ])
        .select('*')
        .single();
      if (error) throw error;

      await recordEvent('TIME_OFF_BLOCK_CREATED', 'time_off_block', String(data.id), {
        start_date: timeOffBlockDraft.start_date,
        end_date: timeOffBlockDraft.end_date,
      });

      await fetchAll();
      setTimeOffBlockDraft((current) => ({
        ...current,
        reason: '',
      }));
    } catch (error) {
      alert(`Failed to save blocked dates: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteTimeOffBlock = async (block: WorkforceTimeOffBlock) => {
    if (!window.confirm('Remove this blocked date range?')) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('workforce_time_off_blocks').delete().eq('id', block.id);
      if (error) throw error;

      await recordEvent('TIME_OFF_BLOCK_REMOVED', 'time_off_block', block.id, {
        start_date: block.start_date,
        end_date: block.end_date,
      });
      await fetchAll();
    } catch (error) {
      alert(`Failed to remove blocked dates: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const createCompanyHoliday = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!holidayDraft.holiday_date || !holidayDraft.name.trim()) {
      alert('Holiday date and name are required.');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('workforce_company_holidays')
        .insert([
          {
            holiday_date: holidayDraft.holiday_date,
            name: holidayDraft.name.trim(),
            notes: holidayDraft.notes.trim() || null,
            active: true,
            created_at: new Date().toISOString(),
          },
        ])
        .select('*')
        .single();
      if (error) throw error;

      await recordEvent('COMPANY_HOLIDAY_CREATED', 'company_holiday', String(data.id), {
        holiday_date: holidayDraft.holiday_date,
        name: holidayDraft.name.trim(),
      });

      await fetchAll();
      setHolidayDraft((current) => ({
        ...current,
        name: '',
        notes: '',
      }));
    } catch (error) {
      alert(`Failed to add company holiday: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteCompanyHoliday = async (holiday: WorkforceCompanyHoliday) => {
    if (!window.confirm(`Remove holiday "${holiday.name}"?`)) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('workforce_company_holidays').delete().eq('id', holiday.id);
      if (error) throw error;

      await recordEvent('COMPANY_HOLIDAY_REMOVED', 'company_holiday', holiday.id, {
        holiday_date: holiday.holiday_date,
        name: holiday.name,
      });
      await fetchAll();
    } catch (error) {
      alert(`Failed to remove holiday: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const moveScheduleWindow = (direction: -1 | 1) => {
    const step = scheduleView === 'week' ? 7 : 1;
    setScheduleAnchorDate((current) =>
      clampDate(addDays(current, step * direction), schedulerMinDate, schedulerMaxDate),
    );
  };

  const scheduleStep = scheduleView === 'week' ? 7 : 1;
  const canMoveSchedulePrev = addDays(scheduleAnchorDate, -scheduleStep).getTime() >= schedulerMinDate.getTime();
  const canMoveScheduleNext = addDays(scheduleAnchorDate, scheduleStep).getTime() <= schedulerMaxDate.getTime();

  const scheduleLabel = useMemo(() => {
    if (scheduleDates.length === 0) return '';
    if (scheduleView === 'day') {
      return formatDateHeader(scheduleDates[0]);
    }
    return `${formatDateShort(scheduleDates[0])} - ${formatDateShort(scheduleDates[scheduleDates.length - 1])}`;
  }, [scheduleDates, scheduleView]);

  const orderedEmployees = useMemo(
    () =>
      employees
        .slice()
        .sort((a, b) => {
          const aAssignments = (employeeRoleAssignmentsByEmployeeId[a.id] || []).filter(
            (assignment) => assignment.active !== false,
          );
          const bAssignments = (employeeRoleAssignmentsByEmployeeId[b.id] || []).filter(
            (assignment) => assignment.active !== false,
          );

          const aPrimary = aAssignments.find((assignment) => Boolean(assignment.primary_role)) || aAssignments[0];
          const bPrimary = bAssignments.find((assignment) => Boolean(assignment.primary_role)) || bAssignments[0];

          const aOrder = roleOrderIndexById[aPrimary?.role_id || ''] ?? Number.MAX_SAFE_INTEGER;
          const bOrder = roleOrderIndexById[bPrimary?.role_id || ''] ?? Number.MAX_SAFE_INTEGER;
          if (aOrder !== bOrder) return aOrder - bOrder;

          return a.name.localeCompare(b.name);
        }),
    [employeeRoleAssignmentsByEmployeeId, employees, roleOrderIndexById],
  );

  const dayViewShifts = useMemo(() => {
    if (scheduleView !== 'day' || scheduleDateKeys.length === 0) return [];
    const currentDateKey = scheduleDateKeys[0];
    return shifts.filter((shift) => formatDateKey(new Date(shift.start_time)) === currentDateKey);
  }, [scheduleDateKeys, scheduleView, shifts]);

  const editingEmployeeDocuments = useMemo(
    () =>
      editingEmployee
        ? employeeDocuments.filter((document) => document.employee_id === editingEmployee.id)
        : [],
    [editingEmployee, employeeDocuments],
  );

  const shiftTimecardDate = (direction: -1 | 1) => {
    setTimecardDateKey((current) => {
      const fallback = timecardMaxDateKey;
      const currentDate = current ? fromDateKey(current) : fromDateKey(fallback);
      const minDate = fromDateKey(timecardMinDateKey);
      const maxDate = fromDateKey(timecardMaxDateKey);
      const next = clampDate(addDays(currentDate, direction), minDate, maxDate);
      return formatDateKey(next);
    });
  };

  const savePunchAdjustment = async (punch: WorkforcePunch) => {
    if (!actorCanManageSchedule) return;

    const draft = punchAdjustmentsById[punch.id] || {
      clock_in: toDateTimeLocalInput(punch.clock_in),
      clock_out: toDateTimeLocalInput(punch.clock_out),
    };

    const clockInValue = fromDateTimeLocalInput(draft.clock_in);
    const clockOutValue = draft.clock_out ? fromDateTimeLocalInput(draft.clock_out) : '';

    if (!clockInValue) {
      alert('Clock in time is required.');
      return;
    }

    if (draft.clock_out && !clockOutValue) {
      alert('Clock out time is invalid.');
      return;
    }

    if (clockOutValue && new Date(clockOutValue).getTime() < new Date(clockInValue).getTime()) {
      alert('Clock out must be after clock in.');
      return;
    }

    setSavingTimeEntryId(`punch:${punch.id}`);
    try {
      const { error } = await supabase
        .from('workforce_punches')
        .update({
          clock_in: clockInValue,
          clock_out: clockOutValue || null,
          status: clockOutValue ? 'closed' : 'open',
        })
        .eq('id', punch.id);

      if (error) throw error;

      if (punch.shift_id) {
        const { error: shiftError } = await supabase
          .from('workforce_shifts')
          .update({ status: clockOutValue ? 'completed' : 'in_progress' })
          .eq('id', punch.shift_id);

        if (shiftError) throw shiftError;
      }

      await recordEvent('PUNCH_ADJUSTED', 'punch', punch.id, {
        shift_id: punch.shift_id,
        clock_in: clockInValue,
        clock_out: clockOutValue || null,
      });

      await fetchAll();
    } catch (error) {
      alert(`Failed to save punch: ${(error as Error).message}`);
    } finally {
      setSavingTimeEntryId('');
    }
  };

  const saveBreakAdjustment = async (entry: WorkforceBreak) => {
    if (!actorCanManageSchedule) return;

    const draft = breakAdjustmentsById[entry.id] || {
      start_time: toDateTimeLocalInput(entry.start_time),
      end_time: toDateTimeLocalInput(entry.end_time),
    };

    const startValue = fromDateTimeLocalInput(draft.start_time);
    const endValue = draft.end_time ? fromDateTimeLocalInput(draft.end_time) : '';

    if (!startValue) {
      alert('Break start time is required.');
      return;
    }

    if (draft.end_time && !endValue) {
      alert('Break end time is invalid.');
      return;
    }

    if (endValue && new Date(endValue).getTime() < new Date(startValue).getTime()) {
      alert('Break end must be after break start.');
      return;
    }

    setSavingTimeEntryId(`break:${entry.id}`);
    try {
      const { error } = await supabase
        .from('workforce_breaks')
        .update({
          start_time: startValue,
          end_time: endValue || null,
        })
        .eq('id', entry.id);

      if (error) throw error;

      await recordEvent('BREAK_ADJUSTED', 'break', entry.id, {
        punch_id: entry.punch_id,
        start_time: startValue,
        end_time: endValue || null,
      });

      await fetchAll();
    } catch (error) {
      alert(`Failed to save break: ${(error as Error).message}`);
    } finally {
      setSavingTimeEntryId('');
    }
  };

  const publishTodaySchedule = async () => {
    setSaving(true);
    try {
      const publishable = shiftsToday.filter(
        (shift) => String(shift.status || '').toLowerCase() !== 'published',
      );

      await Promise.all(
        publishable.map((shift) =>
          supabase.from('workforce_shifts').update({ status: 'published' }).eq('id', shift.id),
        ),
      );

      await recordEvent('SHIFT_PUBLISHED', 'schedule', todayKey, {
        published_count: publishable.length,
      });

      await fetchAll();
    } catch (error) {
      alert(`Failed to publish schedule: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const clockInShift = async (shift: WorkforceShift) => {
    const existingOpen = (punchByShiftId[shift.id] || []).find((punch) => !punch.clock_out);
    if (existingOpen) return;

    setSaving(true);
    try {
      const { data: punchRow, error } = await supabase
        .from('workforce_punches')
        .insert([
          {
            employee_id: shift.employee_id,
            shift_id: shift.id,
            clock_in: new Date().toISOString(),
            status: 'open',
            verified_location: true,
            verified_photo: false,
          },
        ])
        .select('*')
        .single();

      if (error) throw error;

      await supabase.from('workforce_shifts').update({ status: 'in_progress' }).eq('id', shift.id);
      await recordEvent('PUNCH_IN', 'punch', String(punchRow.id), { shift_id: shift.id });
      await fetchAll();
    } catch (error) {
      alert(`Failed to clock in: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const clockOutShift = async (shift: WorkforceShift) => {
    const existingOpen = (punchByShiftId[shift.id] || []).find((punch) => !punch.clock_out);
    if (!existingOpen) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('workforce_punches')
        .update({ clock_out: new Date().toISOString(), status: 'closed' })
        .eq('id', existingOpen.id);

      if (error) throw error;

      await supabase.from('workforce_shifts').update({ status: 'completed' }).eq('id', shift.id);
      await recordEvent('PUNCH_OUT', 'punch', String(existingOpen.id), { shift_id: shift.id });
      await fetchAll();
    } catch (error) {
      alert(`Failed to clock out: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const createTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!taskDraft.title.trim()) {
      alert('Task title is required.');
      return;
    }

    const dueTime = `${taskDraft.due_date}T${taskDraft.due_time}:00`;

    setSaving(true);
    try {
      const { data: taskRow, error } = await supabase
        .from('workforce_tasks')
        .insert([
          {
            title: taskDraft.title.trim(),
            assigned_role_id: taskDraft.assigned_role_id,
            location_id: 'wf_loc_main',
            station_id: taskDraft.station_id || null,
            due_time: dueTime,
            completion_status: 'open',
            critical: taskDraft.critical,
          },
        ])
        .select('*')
        .single();

      if (error) throw error;

      await recordEvent('TASK_OPENED', 'task', String(taskRow.id), {
        assigned_role_id: taskDraft.assigned_role_id,
        due_time: dueTime,
      });

      await fetchAll();
      setShowTaskForm(false);
      setTaskDraft((current) => ({ ...current, title: '', critical: false }));
    } catch (error) {
      alert(`Failed to create task: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const completeTask = async (task: WorkforceTask) => {
    if (String(task.completion_status || '').toLowerCase() === 'completed') return;

    setSaving(true);
    try {
      const completedAt = new Date().toISOString();
      const { error } = await supabase
        .from('workforce_tasks')
        .update({
          completion_status: 'completed',
          completed_by: actorName,
          completed_at: completedAt,
        })
        .eq('id', task.id);

      if (error) throw error;

      await recordEvent('TASK_COMPLETED', 'task', task.id, {
        completed_by: actorName,
      });

      await fetchAll();
    } catch (error) {
      alert(`Failed to complete task: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const createLogEntry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!logDraft.message.trim()) {
      alert('Log entry message is required.');
      return;
    }

    setSaving(true);
    try {
      const { data: row, error } = await supabase
        .from('workforce_log_entries')
        .insert([
          {
            author_name: actorName,
            timestamp: new Date().toISOString(),
            location_id: 'wf_loc_main',
            category: logDraft.category,
            severity: logDraft.severity,
            message: logDraft.message.trim(),
          },
        ])
        .select('*')
        .single();

      if (error) throw error;

      await recordEvent('LOG_ENTRY_CREATED', 'log_entry', String(row.id), {
        category: logDraft.category,
        severity: logDraft.severity,
      });

      await fetchAll();
      setShowLogForm(false);
      setLogDraft((current) => ({ ...current, message: '' }));
    } catch (error) {
      alert(`Failed to add log entry: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const buildUpcomingScheduleDigest = (employee: WorkforceEmployee) => {
    const now = startOfToday();
    const end = addDays(now, 7);
    const upcomingShifts = shifts
      .filter((shift) => {
        if (shift.employee_id !== employee.id) return false;
        const start = new Date(shift.start_time);
        if (Number.isNaN(start.getTime())) return false;
        return start.getTime() >= now.getTime() && start.getTime() < end.getTime();
      })
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    if (!upcomingShifts.length) {
      return `Hi ${employee.name},\n\nYou have no scheduled shifts for the next 7 days.\n\n- SRS Team Hub`;
    }

    const shiftLines = upcomingShifts.map((shift) => {
      const start = new Date(shift.start_time);
      const endTime = new Date(shift.end_time);
      const dateLabel = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const timeLabel = `${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
      const roleLabel = roleById[shift.role_id]?.name || 'Shift';
      return `${dateLabel}: ${roleLabel} (${timeLabel})`;
    });

    return `Hi ${employee.name},\n\nHere is your schedule for the next 7 days:\n${shiftLines.join('\n')}\n\n- SRS Team Hub`;
  };

  const emailScheduleToEmployee = (employee: WorkforceEmployee) => {
    const toEmail = String(employee.email || '').trim();
    if (!toEmail) {
      alert('Add a contact email first.');
      return;
    }

    const subject = encodeURIComponent('Your Team Schedule (Next 7 Days)');
    const body = encodeURIComponent(buildUpcomingScheduleDigest(employee));
    window.location.href = `mailto:${encodeURIComponent(toEmail)}?subject=${subject}&body=${body}`;
  };

  const textScheduleToEmployee = (employee: WorkforceEmployee) => {
    const rawPhone = String(employee.phone || '').trim();
    if (!rawPhone) {
      alert('Add a phone number first.');
      return;
    }

    const normalizedPhone = rawPhone.replace(/[^\d+]/g, '');
    const body = encodeURIComponent(buildUpcomingScheduleDigest(employee));
    window.location.href = `sms:${normalizedPhone}?body=${body}`;
  };

  const renderLogArchiveSection = (orderClass = 'order-7') => (
    <section className={`${orderClass} bg-white rounded-lg shadow p-6 space-y-4`.trim()}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-gray-900">Log Archive</h2>
          <p className="text-sm text-gray-500">
            Daily snapshots of tasks, clock logs, alerts, daily schedule, and daily activity log. Retained for {LOG_ARCHIVE_RETENTION_DAYS} days.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftArchiveDate(-1)}
            disabled={!canViewEarlierArchiveDate}
            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-700 disabled:opacity-40"
            title="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <input
            type="date"
            value={archiveDateKey}
            min={archiveEarliestDateKey}
            max={todayKey}
            onChange={(event) => setArchiveDateKey(event.target.value || todayKey)}
            className="px-3 py-2 border rounded-lg"
          />
          <button
            type="button"
            onClick={() => shiftArchiveDate(1)}
            disabled={!canViewLaterArchiveDate}
            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-700 disabled:opacity-40"
            title="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!actorCanManageSchedule && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
          Supervisor access is required to view the Log Archive.
        </div>
      )}

      {actorCanManageSchedule && (
        <>
          <div className="text-sm text-gray-600 flex flex-wrap items-center gap-3">
            <span>Viewing {archiveDateLabel}</span>
            <span className="text-gray-400">•</span>
            <span>{logArchiveSnapshots.length} archived day(s)</span>
            {syncingArchive && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-ocean-700">Syncing today&apos;s snapshot...</span>
              </>
            )}
          </div>

          {selectedLogArchiveSnapshot && selectedLogArchivePayload ? (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Tasks</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {Number(selectedArchiveSummary?.task_count ?? selectedArchiveTasks.length)}
                  </div>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Clock Logs</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {Number(selectedArchiveSummary?.clock_log_count ?? selectedArchiveClockLogs.length)}
                  </div>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Alerts</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {Number(selectedArchiveSummary?.alert_count ?? selectedArchiveAlerts.length)}
                  </div>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Schedule Entries</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {Number(selectedArchiveSummary?.schedule_count ?? selectedArchiveSchedule.length)}
                  </div>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Activity Entries</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {Number(selectedArchiveSummary?.activity_count ?? selectedArchiveActivityLog.length)}
                  </div>
                </div>
              </div>

              <div className="grid xl:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-100 p-4 space-y-2">
                  <h3 className="font-semibold text-gray-900">Tasks</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {selectedArchiveTasks.slice(0, 24).map((taskRaw, index) => {
                      const task = (taskRaw as Record<string, unknown>) || {};
                      const taskId = String(task.id || `task_${index}`);
                      const taskTitle = String(task.title || 'Task');
                      const taskAssigned = String(task.assigned_to || 'Unassigned');
                      const taskStatus = String(task.completion_status || 'open');
                      const taskDue = String(task.due_time || '');
                      const taskCritical = Boolean(task.critical);
                      return (
                        <div key={taskId} className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                          <div className="text-sm font-medium text-gray-900">{taskTitle}</div>
                          <div className="text-xs text-gray-600">
                            {taskAssigned} • {taskStatus}
                            {taskCritical ? ' • Critical' : ''}
                          </div>
                          {taskDue && <div className="text-xs text-gray-500">Due {formatDateTime(taskDue)}</div>}
                        </div>
                      );
                    })}
                    {!selectedArchiveTasks.length && (
                      <div className="text-sm text-gray-500">No tasks archived for this date.</div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-100 p-4 space-y-2">
                  <h3 className="font-semibold text-gray-900">Clock In & Out Logs</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {selectedArchiveClockLogs.slice(0, 24).map((logRaw, index) => {
                      const clockLog = (logRaw as Record<string, unknown>) || {};
                      const entryId = String(clockLog.id || `clock_${index}`);
                      const employee = String(clockLog.employee_name || 'Employee');
                      const role = String(clockLog.role_name || 'Role');
                      const clockIn = String(clockLog.clock_in || '');
                      const clockOut = String(clockLog.clock_out || '');
                      const breakCount = Array.isArray(clockLog.breaks) ? clockLog.breaks.length : 0;
                      return (
                        <div key={entryId} className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                          <div className="text-sm font-medium text-gray-900">{employee}</div>
                          <div className="text-xs text-gray-600">
                            {role} • In {formatDateTime(clockIn)} • Out {clockOut ? formatDateTime(clockOut) : 'Open'}
                          </div>
                          <div className="text-xs text-gray-500">{breakCount} break(s)</div>
                        </div>
                      );
                    })}
                    {!selectedArchiveClockLogs.length && (
                      <div className="text-sm text-gray-500">No clock logs archived for this date.</div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-100 p-4 space-y-2">
                  <h3 className="font-semibold text-gray-900">Alerts</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {selectedArchiveAlerts.slice(0, 24).map((alertRaw, index) => {
                      const alertEntry = (alertRaw as Record<string, unknown>) || {};
                      const alertId = String(alertEntry.id || `alert_${index}`);
                      const alertSeverity = String(alertEntry.severity || 'warning').toLowerCase();
                      const severityClass =
                        alertSeverity === 'critical'
                          ? 'text-red-700 bg-red-50 border-red-100'
                          : 'text-amber-700 bg-amber-50 border-amber-100';
                      return (
                        <div key={alertId} className={`rounded-md border px-3 py-2 ${severityClass}`}>
                          <div className="text-sm font-medium">{String(alertEntry.label || 'Alert')}</div>
                          <div className="text-xs">{String(alertEntry.message || '')}</div>
                        </div>
                      );
                    })}
                    {!selectedArchiveAlerts.length && (
                      <div className="text-sm text-gray-500">No alerts archived for this date.</div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-100 p-4 space-y-2">
                  <h3 className="font-semibold text-gray-900">Daily Schedule</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {selectedArchiveSchedule.slice(0, 24).map((shiftRaw, index) => {
                      const shiftEntry = (shiftRaw as Record<string, unknown>) || {};
                      const shiftId = String(shiftEntry.id || `schedule_${index}`);
                      return (
                        <div key={shiftId} className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                          <div className="text-sm font-medium text-gray-900">
                            {String(shiftEntry.employee_name || 'Employee')}
                          </div>
                          <div className="text-xs text-gray-600">
                            {String(shiftEntry.role_name || 'Role')} • {String(shiftEntry.role_section || 'General')} •{' '}
                            {String(shiftEntry.station_name || 'Unassigned')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDateTime(String(shiftEntry.start_time || ''))} - {formatDateTime(String(shiftEntry.end_time || ''))}
                          </div>
                        </div>
                      );
                    })}
                    {!selectedArchiveSchedule.length && (
                      <div className="text-sm text-gray-500">No schedule entries archived for this date.</div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-100 p-4 space-y-2 xl:col-span-2">
                  <h3 className="font-semibold text-gray-900">Daily Activity Log</h3>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {selectedArchiveActivityLog.slice(0, 40).map((entryRaw, index) => {
                      const entry = (entryRaw as Record<string, unknown>) || {};
                      const entryId = String(entry.id || `activity_${index}`);
                      return (
                        <div key={entryId} className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-medium text-gray-900">
                              {String(entry.author_name || 'Manager')}
                            </div>
                            <div className="text-xs text-gray-500">{formatDateTime(String(entry.timestamp || ''))}</div>
                          </div>
                          <div className="text-xs uppercase tracking-wide text-gray-500">
                            {String(entry.category || 'notes')} • {String(entry.severity || 'low')}
                          </div>
                          <div className="text-sm text-gray-700 whitespace-pre-line">{String(entry.message || '')}</div>
                        </div>
                      );
                    })}
                    {!selectedArchiveActivityLog.length && (
                      <div className="text-sm text-gray-500">No activity log entries archived for this date.</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-4 text-center">
              No archived snapshot found for this date.
            </div>
          )}
        </>
      )}
    </section>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600" />
      </div>
    );
  }

  if (archiveOnly) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-none px-4 py-6 flex flex-col gap-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900">LOG ARCHIVE</h1>
              <p className="text-gray-600 font-garamond">
                Supervisor snapshot history for tasks, clock logs, alerts, schedule, and activity.
              </p>
            </div>
          </div>
          {renderLogArchiveSection('')}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-none px-4 py-6 flex flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">TEAM</h1>
            <p className="text-gray-600 font-garamond">
              Team profiles, scheduling, labor controls, and workforce operations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void publishTodaySchedule()}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            Publish Today's Schedule
          </button>
        </div>

        <section className="order-1 grid sm:grid-cols-2 lg:grid-cols-7 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 uppercase tracking-wide">Team Members</div>
            <div className="text-2xl font-display font-bold text-gray-900">{employees.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 uppercase tracking-wide">Shifts Today</div>
            <div className="text-2xl font-display font-bold text-gray-900">{shiftsToday.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 uppercase tracking-wide">Live Clocked In</div>
            <div className="text-2xl font-display font-bold text-green-600">{openPunches.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 uppercase tracking-wide">Critical Tasks</div>
            <div className="text-2xl font-display font-bold text-amber-600">{unresolvedCriticalTasks.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 uppercase tracking-wide">Scheduled Hours</div>
            <div className="text-2xl font-display font-bold text-gray-900">{formatHours(scheduledHours)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 uppercase tracking-wide">Labor Cost (Live)</div>
            <div className="text-2xl font-display font-bold text-gray-900">${laborCost.toFixed(0)}</div>
            <div className="text-xs text-gray-500 mt-1">
              CA OT {caLaborSummary.overtimeHours.toFixed(1)}h, DT {caLaborSummary.doubleTimeHours.toFixed(1)}h
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 uppercase tracking-wide">Upcoming Holidays</div>
            <div className="text-2xl font-display font-bold text-gray-900">{upcomingCompanyHolidays.length}</div>
          </div>
        </section>

        <section className="order-6 bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-display font-bold text-gray-900">Role Library</h2>
              <p className="text-sm text-gray-500">
                Define role sections, ordering, and names used across Team Members and Scheduler.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowRoleForm((current) => !current)}
              className="inline-flex items-center gap-2 px-3 py-2 border border-ocean-200 text-ocean-700 rounded-lg hover:bg-ocean-50"
            >
              <Plus className="h-4 w-4" />
              Add Role
            </button>
          </div>

          {showRoleForm && (
            <form
              onSubmit={(event) => void createRoleDefinition(event)}
              className="grid md:grid-cols-10 gap-3 bg-gray-50 p-4 rounded-lg border border-gray-100"
            >
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Role Name</label>
                <input
                  value={roleDraft.name}
                  onChange={(event) => setRoleDraft((current) => ({ ...current, name: event.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g. Project Coordinator"
                  required
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
                <input
                  value={roleDraft.role_section}
                  onChange={(event) =>
                    setRoleDraft((current) => ({
                      ...current,
                      role_section: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g. Customer Support"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Display Order</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={roleDraft.display_order}
                  onChange={(event) =>
                    setRoleDraft((current) => ({
                      ...current,
                      display_order: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="md:col-span-1 flex items-end">
                <button
                  type="submit"
                  disabled={creatingRole}
                  className="w-full px-3 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 disabled:opacity-60"
                >
                  Save
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Section</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Order</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Linked Records</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {roleGroups.map((group) => (
                  <React.Fragment key={group.section}>
                    <tr className="bg-gray-50">
                      <td
                        colSpan={5}
                        className="px-3 py-2 text-xs font-semibold tracking-wide uppercase text-gray-500"
                      >
                        {group.section}
                      </td>
                    </tr>
                    {group.items.map((role) => {
                      const edit = roleEditsById[role.id] || {
                        name: String(role.name || ''),
                        role_section: normalizeRoleSection(String(role.role_section || '')),
                        display_order: String(parseDisplayOrder(role.display_order, 1)),
                        hourly_rate: String(role.hourly_rate ?? 0),
                      };
                      const usageCount = Number(roleUsageCountById[role.id] || 0);
                      const isSavingThisRole = savingRoleId === role.id;
                      return (
                        <tr key={role.id}>
                          <td className="px-3 py-2">
                            <input
                              value={edit.name}
                              onChange={(event) =>
                                setRoleEditsById((current) => ({
                                  ...current,
                                  [role.id]: {
                                    ...(current[role.id] || edit),
                                    name: event.target.value,
                                  },
                                }))
                              }
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              value={edit.role_section}
                              onChange={(event) =>
                                setRoleEditsById((current) => ({
                                  ...current,
                                  [role.id]: {
                                    ...(current[role.id] || edit),
                                    role_section: event.target.value,
                                  },
                                }))
                              }
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={edit.display_order}
                              onChange={(event) =>
                                setRoleEditsById((current) => ({
                                  ...current,
                                  [role.id]: {
                                    ...(current[role.id] || edit),
                                    display_order: event.target.value,
                                  },
                                }))
                              }
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700">{usageCount}</td>
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => void saveRoleDefinition(role)}
                                disabled={isSavingThisRole || creatingRole}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                              >
                                <Save className="h-4 w-4" />
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => void archiveRoleDefinition(role)}
                                disabled={isSavingThisRole || creatingRole}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-md border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-60"
                              >
                                <Trash2 className="h-4 w-4" />
                                Archive
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
                {!roles.length && (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-sm text-gray-500 text-center">
                      No active roles yet. Add one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {showEmployeeForm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h3 className="text-xl font-display font-bold text-gray-900">
                  {employeeEditorMode === 'create' ? 'Add Employee' : 'Edit Employee'}
                </h3>
                <button
                  type="button"
                  onClick={closeEmployeeEditor}
                  className="p-2 text-gray-500 hover:text-gray-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={(event) => void saveEmployeeProfile(event)} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Team Member Name</label>
                    <input
                      value={employeeDraft.name}
                      onChange={(event) => setEmployeeDraft((current) => ({ ...current, name: event.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Title</label>
                    <input
                      value={employeeDraft.title}
                      onChange={(event) => setEmployeeDraft((current) => ({ ...current, title: event.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Supervisor, Coordinator, Specialist..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={employeeDraft.hire_date}
                      onChange={(event) => setEmployeeDraft((current) => ({ ...current, hire_date: event.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pay Basis</label>
                    <select
                      value={employeeDraft.pay_basis}
                      onChange={(event) =>
                        setEmployeeDraft((current) => ({ ...current, pay_basis: event.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {employeeDraft.pay_basis === 'weekly'
                        ? 'Weekly Amount ($)'
                        : employeeDraft.pay_basis === 'monthly'
                          ? 'Monthly Amount ($)'
                          : 'Hourly Amount ($)'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={employeeDraft.hourly_rate}
                      onChange={(event) =>
                        setEmployeeDraft((current) => ({ ...current, hourly_rate: event.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  {employeeDraft.pay_basis === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Hours</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={employeeDraft.weekly_hours}
                        onChange={(event) =>
                          setEmployeeDraft((current) => ({ ...current, weekly_hours: event.target.value }))
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  )}
                  {employeeDraft.pay_basis === 'monthly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Hours</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={employeeDraft.monthly_hours}
                        onChange={(event) =>
                          setEmployeeDraft((current) => ({ ...current, monthly_hours: event.target.value }))
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Calculated Hourly ($/hr)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={formatDecimalInput(derivedHourlyRateValue)}
                      readOnly
                      className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-700"
                    />
                    {!canCalculateDerivedHourly && (
                      <p className="mt-1 text-xs text-amber-700">
                        Enter {employeeDraft.pay_basis === 'monthly' ? 'monthly' : 'weekly'} hours to calculate hourly rate.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={employeeDraft.email}
                      onChange={(event) => setEmployeeDraft((current) => ({ ...current, email: event.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="teammember@yourcompany.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={employeeDraft.phone}
                      onChange={(event) => setEmployeeDraft((current) => ({ ...current, phone: event.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="(555) 555-5555"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                    <textarea
                      rows={2}
                      value={employeeDraft.availability}
                      onChange={(event) => setEmployeeDraft((current) => ({ ...current, availability: event.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g. Mon-Fri PM, unavailable Sundays"
                    />
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Roles + Pay Rates</h4>
                    <button
                      type="button"
                      onClick={addRoleDraftRow}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-ocean-200 text-ocean-700 rounded-md text-sm hover:bg-ocean-50"
                    >
                      <Plus className="h-4 w-4" />
                      Add Role
                    </button>
                  </div>

                  <div className="space-y-2">
                    {employeeRoleDrafts.map((roleRow, index) => (
                      <div key={roleRow.id} className="grid md:grid-cols-12 gap-2 items-end border border-gray-100 rounded-lg p-2">
                        <label className="md:col-span-2 inline-flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="radio"
                            name="primary-role"
                            checked={Boolean(roleRow.primary_role)}
                            onChange={() => setPrimaryRoleDraft(roleRow.id)}
                          />
                          Primary
                        </label>

                        <div className="md:col-span-5">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                          <select
                            value={roleRow.role_id}
                            onChange={(event) =>
                              updateRoleDraft(roleRow.id, {
                                role_id: event.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg"
                          >
                            {roleGroups.map((group) => (
                              <optgroup key={group.section} label={group.section}>
                                {group.items.map((role) => (
                                  <option key={role.id} value={role.id}>
                                    {role.name}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-3">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Rate ($/hr, auto)</label>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={formatDecimalInput(derivedHourlyRateValue)}
                            readOnly
                            className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-700"
                          />
                        </div>

                        <div className="md:col-span-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeRoleDraft(roleRow.id)}
                            disabled={employeeRoleDrafts.length <= 1}
                            className="inline-flex items-center gap-1 px-2.5 py-2 border border-gray-200 rounded-md text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                            title={index === 0 ? 'Keep at least one role' : 'Remove role'}
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-gray-900">Directory Mapping (Optional)</h4>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Login Email Override</label>
                      <input
                        type="email"
                        value={employeeDraft.login_username}
                        onChange={(event) => setEmployeeDraft((current) => ({ ...current, login_username: event.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Uses company email when blank"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password (Admin Sync Only)</label>
                      <input
                        type="text"
                        value={employeeDraft.login_password}
                        onChange={(event) => setEmployeeDraft((current) => ({ ...current, login_password: event.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder={allowAuthAdminSync ? 'Used only when auth-admin sync is enabled' : 'Disabled unless auth-admin sync is enabled'}
                      />
                    </div>
                    <label className="inline-flex items-end gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={employeeDraft.active}
                        onChange={(event) => setEmployeeDraft((current) => ({ ...current, active: event.target.checked }))}
                        className="rounded border-gray-300"
                      />
                      Active
                    </label>
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-gray-900">PTO Balance</h4>
                  <div className="max-w-xs">
                    <label className="block text-sm font-medium text-gray-700 mb-1">PTO Unit</label>
                    <select
                      value={employeeDraft.pto_unit}
                      onChange={(event) => setPtoUnit(event.target.value === 'days' ? 'days' : 'hours')}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Starting PTO ({employeeDraft.pto_unit === 'days' ? 'Days' : 'Hours'})
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={employeeDraft.pto_accrued_hours}
                        onChange={(event) => setEmployeeDraft((current) => ({ ...current, pto_accrued_hours: event.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Used PTO ({employeeDraft.pto_unit === 'days' ? 'Days' : 'Hours'})
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={employeeDraft.pto_used_hours}
                        onChange={(event) => setEmployeeDraft((current) => ({ ...current, pto_used_hours: event.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Available PTO ({employeeDraft.pto_unit === 'days' ? 'Days' : 'Hours'})
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={formatDecimalInput(ptoAvailableValue)}
                        readOnly
                        className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-700"
                      />
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-gray-900">Access Levels</h4>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-700">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={employeeDraft.can_access_operations}
                        onChange={(event) => setEmployeeDraft((current) => ({ ...current, can_access_operations: event.target.checked }))}
                        className="rounded border-gray-300"
                      />
                      Today Dashboard
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={employeeDraft.can_manage_schedule}
                        onChange={(event) =>
                          setEmployeeDraft((current) => ({
                            ...current,
                            can_manage_schedule: event.target.checked,
                            can_access_workforce: event.target.checked,
                            can_access_operations: event.target.checked ? true : current.can_access_operations,
                          }))
                        }
                        className="rounded border-gray-300"
                      />
                      Supervisor (Team + Schedule Write)
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Team access is automatically tied to supervisor mode. Non-supervisors only see Today with read-only schedule visibility.
                  </p>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-gray-900">Employee Files</h4>
                  {editingEmployee ? (
                    <>
                      <div className="grid md:grid-cols-3 gap-3">
                        <select
                          value={documentDraft.doc_type}
                          onChange={(event) => setDocumentDraft((current) => ({ ...current, doc_type: event.target.value }))}
                          className="px-3 py-2 border rounded-lg"
                        >
                          <option value="ID Scan">ID Scan</option>
                          <option value="Compliance Certificate">Compliance Certificate</option>
                          <option value="Write Up">Write Up</option>
                          <option value="Annual Review">Annual Review</option>
                          <option value="Certification">Certification</option>
                          <option value="Other">Other</option>
                        </select>
                        <input
                          value={documentDraft.notes}
                          onChange={(event) => setDocumentDraft((current) => ({ ...current, notes: event.target.value }))}
                          className="px-3 py-2 border rounded-lg md:col-span-2"
                          placeholder="Optional notes"
                        />
                      </div>
                      <label className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer w-fit">
                        <Upload className="h-4 w-4" />
                        Upload Document
                        <input
                          type="file"
                          className="hidden"
                          disabled={uploadingDocument}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            void uploadEmployeeDocument(file);
                            event.target.value = '';
                          }}
                        />
                      </label>
                      <div className="space-y-2">
                        {editingEmployeeDocuments.map((document) => (
                          <div key={document.id} className="flex items-center justify-between gap-3 border border-gray-100 rounded-lg p-2">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{document.file_name}</div>
                              <div className="text-xs text-gray-500">{document.doc_type} • {formatDateTime(document.uploaded_at || document.created_at)}</div>
                              {document.notes && <div className="text-xs text-gray-500">{document.notes}</div>}
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={document.public_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs px-2 py-1 border rounded-md text-gray-700 hover:bg-gray-50"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                View
                              </a>
                              <button
                                type="button"
                                onClick={() => void deleteEmployeeDocument(document)}
                                className="inline-flex items-center gap-1 text-xs px-2 py-1 border rounded-md text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                        {!editingEmployeeDocuments.length && (
                          <div className="text-sm text-gray-500">No files uploaded yet.</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Save the employee first, then upload ID scans, certifications, write-ups, and annual reviews.
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeEmployeeEditor}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 disabled:opacity-60"
                  >
                    {employeeEditorMode === 'create' ? 'Create Employee' : 'Save Employee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <section className="order-5 bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-display font-bold text-gray-900">Team Members</h2>
            <button
              type="button"
              onClick={openCreateEmployeeEditor}
              className="inline-flex items-center gap-2 px-3 py-2 border border-ocean-200 text-ocean-700 rounded-lg hover:bg-ocean-50"
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Attendance</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map((employee) => {
                  const assignments = employeeRoleAssignmentsByEmployeeId[employee.id] || [];
                  const primaryAssignment =
                    assignments.find((assignment) => Boolean(assignment.primary_role)) || assignments[0];
                  const roleName = roleById[primaryAssignment?.role_id || '']?.name || employee.title || '-';
                  return (
                    <tr key={employee.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{employee.name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{employee.email || '-'}</div>
                        <div className="text-sm text-gray-500">{employee.phone || '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-900">{roleName}</td>
                      <td className="px-4 py-3 text-gray-900">{Math.round(Number(employee.attendance_score || 0))}%</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => emailScheduleToEmployee(employee)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
                            title="Email next 7 days schedule"
                          >
                            <Mail className="h-4 w-4" />
                            Email
                          </button>
                          <button
                            type="button"
                            onClick={() => textScheduleToEmployee(employee)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
                            title="Text next 7 days schedule"
                          >
                            <MessageSquareText className="h-4 w-4" />
                            Text
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditEmployeeEditor(employee)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="order-2 bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-display font-bold text-gray-900">Scheduler</h2>
              <p className="text-sm text-gray-500">
                Drag a shift onto another day/employee cell to duplicate. Range supports 4 weeks back and 4 weeks ahead.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setScheduleView('day')}
                className={`px-3 py-2 rounded-lg border ${scheduleView === 'day' ? 'bg-ocean-600 border-ocean-600 text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                Day
              </button>
              <button
                type="button"
                onClick={() => setScheduleView('week')}
                className={`px-3 py-2 rounded-lg border ${scheduleView === 'week' ? 'bg-ocean-600 border-ocean-600 text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => setScheduleAnchorDate(startOfToday())}
                className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Today
              </button>
              <div className="inline-flex items-center rounded-lg border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setScheduleTimeDisplayMode('eastern')}
                  className={`px-3 py-2 text-sm ${scheduleTimeDisplayMode === 'eastern' ? 'bg-ocean-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  title="Show schedule times in Eastern Time"
                >
                  ET
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleTimeDisplayMode('local')}
                  className={`px-3 py-2 text-sm border-l border-gray-200 ${scheduleTimeDisplayMode === 'local' ? 'bg-ocean-600 text-white border-l-ocean-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  title="Show schedule times in your local timezone"
                >
                  Local
                </button>
              </div>
            </div>
          </div>

          <div className="text-sm md:text-base font-semibold text-gray-800">
            Schedule time view: {scheduleTimeDisplayMode === 'eastern' ? 'Eastern (America/New_York)' : `Local (${localScheduleTimeZone})`}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border border-gray-100 rounded-lg p-3 bg-gray-50">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => moveScheduleWindow(-1)}
                disabled={!canMoveSchedulePrev}
                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-700 disabled:opacity-40"
                title={scheduleView === 'week' ? 'Previous week' : 'Previous day'}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-900">
                <CalendarDays className="h-4 w-4 text-ocean-600" />
                <span className="font-medium">{scheduleLabel}</span>
              </div>
              <button
                type="button"
                onClick={() => moveScheduleWindow(1)}
                disabled={!canMoveScheduleNext}
                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-700 disabled:opacity-40"
                title={scheduleView === 'week' ? 'Next week' : 'Next day'}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (showShiftForm) {
                    cancelShiftEditor();
                    return;
                  }
                  openCreateShiftForm();
                }}
                className="inline-flex items-center gap-2 px-3 py-2 border border-ocean-200 text-ocean-700 rounded-lg hover:bg-ocean-50"
              >
                <Plus className="h-4 w-4" />
                {showShiftForm ? 'Close Shift Form' : 'Add Shift'}
              </button>
              <button
                type="button"
                onClick={() => void copyPreviousWeek()}
                disabled={saving || scheduleView !== 'week'}
                className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
                Copy Previous Week
              </button>
              <select
                value={selectedTemplateId}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                {!scheduleTemplates.length && <option value="">No Templates</option>}
                {scheduleTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void applyScheduleTemplate()}
                disabled={saving || scheduleView !== 'week' || !selectedTemplateId}
                className="px-3 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 disabled:opacity-50"
              >
                Apply Template
              </button>
              <button
                type="button"
                onClick={() => void saveWeekAsTemplate()}
                disabled={saving || scheduleView !== 'week'}
                className="px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Save Week Template
              </button>
            </div>
          </div>

          {showShiftForm && (
            <form onSubmit={(event) => void saveShiftDraft(event)} className="grid md:grid-cols-8 gap-3 bg-gray-50 p-4 rounded-lg">
              <select
                value={shiftDraft.employee_id}
                onChange={(event) => {
                  const employeeId = event.target.value;
                  const assignments = (employeeRoleAssignmentsByEmployeeId[employeeId] || []).filter(
                    (assignment) => assignment.active !== false,
                  );
                  const primaryAssignment =
                    assignments.find((assignment) => Boolean(assignment.primary_role)) || assignments[0];
                  const nextRoleId = primaryAssignment?.role_id || shiftDraft.role_id;

                  setShiftDraft((current) => ({
                    ...current,
                    employee_id: employeeId,
                    role_id: nextRoleId,
                  }));
                }}
                className="px-3 py-2 border rounded-lg"
              >
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
              <select
                value={shiftDraft.role_id}
                onChange={(event) => {
                  const roleId = event.target.value;
                  setShiftDraft((current) => ({
                    ...current,
                    role_id: roleId,
                  }));
                }}
                className="px-3 py-2 border rounded-lg"
              >
                {roleGroupsForSelectedShiftEmployee.map((group) => (
                  <optgroup key={group.section} label={group.section}>
                    {group.items.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <input
                type="date"
                value={shiftDraft.date}
                onChange={(event) => setShiftDraft((current) => ({ ...current, date: event.target.value }))}
                className="px-3 py-2 border rounded-lg"
                min={formatDateKey(schedulerMinDate)}
                max={formatDateKey(schedulerMaxDate)}
              />
              <input
                type="time"
                value={shiftDraft.start_time}
                onChange={(event) => setShiftDraft((current) => ({ ...current, start_time: event.target.value }))}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="time"
                value={shiftDraft.end_time}
                onChange={(event) => setShiftDraft((current) => ({ ...current, end_time: event.target.value }))}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="number"
                min={0}
                step={0.01}
                value={formatDecimalInput(shiftDraftCalculatedRate)}
                readOnly
                className="px-3 py-2 border rounded-lg bg-gray-50 text-gray-700"
                placeholder="Auto"
              />
              <div className="md:col-span-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={cancelShiftEditor}
                  disabled={saving}
                  className="px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 disabled:opacity-60"
                >
                  {editingShiftId ? 'Update Shift' : 'Save Shift'}
                </button>
              </div>
            </form>
          )}

          {scheduleView === 'week' ? (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-40 px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
                    {scheduleDates.map((date) => (
                      <th key={formatDateKey(date)} className="px-2 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        <div>{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className="normal-case text-sm text-gray-700">{formatDateShort(date)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orderedEmployees.map((employee) => (
                    <tr key={employee.id} className="align-top border-t border-gray-100">
                      <td className="px-3 py-3 border-r border-gray-100">
                        <div className="font-medium text-gray-900">{employee.name}</div>
                        <div className="text-xs text-gray-500">{employee.title || 'Team Member'}</div>
                        <div className="text-xs text-gray-500">
                          PTO:{' '}
                          {formatDecimalInput(
                            ptoHoursToDisplay(
                              Number(ptoByEmployeeId[employee.id]?.available_hours || 0),
                              getEmployeePtoUnit(employee.id),
                            ),
                          )}
                          {getEmployeePtoUnit(employee.id) === 'days' ? 'd' : 'h'}
                        </div>
                      </td>
                      {scheduleDateKeys.map((dateKey) => {
                        const cellKey = `${employee.id}::${dateKey}`;
                        const cellShifts = (shiftsByEmployeeAndDate[cellKey] || [])
                          .slice()
                          .sort((a, b) => a.start_time.localeCompare(b.start_time));
                        const hasApprovedTimeOff = Boolean(
                          approvedTimeOffDatesByEmployee[employee.id]?.has(dateKey),
                        );

                        return (
                          <td
                            key={cellKey}
                            className={`px-1.5 py-2 border-r border-gray-100 ${hasApprovedTimeOff ? 'bg-amber-50/60' : 'bg-white'}`}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={() => {
                              if (!draggingShiftId) return;
                              const sourceShift = shifts.find((shift) => shift.id === draggingShiftId);
                              if (!sourceShift) return;
                              void duplicateShiftToCell(sourceShift, dateKey, employee.id);
                            }}
                          >
                            {hasApprovedTimeOff && (
                              <div className="text-[11px] uppercase tracking-wide text-amber-700 font-semibold mb-1">
                                Approved Time Off
                              </div>
                            )}
                            <div className="space-y-1">
                              {cellShifts.map((shift) => (
                                <div
                                  key={shift.id}
                                  draggable
                                  onDragStart={() => setDraggingShiftId(shift.id)}
                                  onDragEnd={() => setDraggingShiftId(null)}
                                  onClick={() => openEditShiftForm(shift)}
                                  className="rounded-md border border-ocean-200 bg-ocean-50 px-2 py-1 text-xs text-ocean-900 cursor-pointer hover:bg-ocean-100"
                                >
                                  <div className="font-semibold truncate">{roleById[shift.role_id]?.name || 'Role'}</div>
                                  <div className="truncate">
                                    {formatScheduleWindowForDisplay(shift.start_time, shift.end_time, scheduleTimeDisplayMode)}
                                  </div>
                                  <div className="mt-1 flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        const nextDate = addDays(fromDateKey(dateKey), 1);
                                        const nextDateKey = formatDateKey(nextDate);
                                        if (
                                          nextDate.getTime() < schedulerMinDate.getTime() ||
                                          nextDate.getTime() > schedulerMaxDate.getTime()
                                        ) {
                                          alert('Cannot duplicate outside the 4-week range.');
                                          return;
                                        }
                                        void duplicateShiftToCell(shift, nextDateKey, shift.employee_id);
                                      }}
                                      className="text-ocean-700 hover:text-ocean-900"
                                      title="Duplicate to next day"
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        void deleteShift(shift);
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                      title="Delete shift"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {!cellShifts.length && (
                                <div className="text-[11px] text-gray-400 py-3 text-center border border-dashed border-gray-200 rounded-md">
                                  Drop shift here
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                Daily view for {scheduleLabel}. Dragging shifts is supported in week view.
              </div>
              {orderedEmployees.map((employee) => {
                const employeeShifts = dayViewShifts
                  .filter((shift) => shift.employee_id === employee.id)
                  .sort((a, b) => a.start_time.localeCompare(b.start_time));
                const dayKey = scheduleDateKeys[0];
                const hasApprovedTimeOff = dayKey
                  ? Boolean(approvedTimeOffDatesByEmployee[employee.id]?.has(dayKey))
                  : false;

                return (
                  <div key={employee.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div>
                        <div className="font-medium text-gray-900">{employee.name}</div>
                        <div className="text-xs text-gray-500">{employee.title || 'Team Member'}</div>
                      </div>
                      {hasApprovedTimeOff && (
                        <span className="text-xs font-semibold uppercase tracking-wide text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                          Time Off
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {employeeShifts.map((shift) => (
                        <div
                          key={shift.id}
                          onClick={() => openEditShiftForm(shift)}
                          className="rounded-md border border-ocean-200 bg-ocean-50 px-3 py-2 flex items-center justify-between gap-3 cursor-pointer hover:bg-ocean-100"
                        >
                          <div className="text-sm">
                            <div className="font-semibold text-ocean-900">{roleById[shift.role_id]?.name || 'Role'}</div>
                            <div className="text-ocean-800">
                              {formatScheduleWindowForDisplay(shift.start_time, shift.end_time, scheduleTimeDisplayMode)} ({(shiftDurationMinutes(shift) / 60).toFixed(1)}h)
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void clockInShift(shift);
                              }}
                              className="px-2 py-1 text-xs rounded-md bg-green-100 text-green-800 hover:bg-green-200"
                            >
                              Clock In
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void clockOutShift(shift);
                              }}
                              className="px-2 py-1 text-xs rounded-md bg-red-100 text-red-700 hover:bg-red-200"
                            >
                              Clock Out
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void deleteShift(shift);
                              }}
                              className="p-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {!employeeShifts.length && (
                        <div className="text-sm text-gray-500">No shift assigned.</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="order-3 bg-white rounded-lg shadow p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-display font-bold text-gray-900">Clock In Logs</h2>
              <p className="text-sm text-gray-500">
                Supervisor timecard adjustments for clock in/out and break in/out (last 30 days).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => shiftTimecardDate(-1)}
                disabled={!canViewEarlierTimecards}
                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-700 disabled:opacity-40"
                title="Previous day"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <input
                type="date"
                value={timecardDateKey}
                min={timecardMinDateKey}
                max={timecardMaxDateKey}
                onChange={(event) => {
                  const nextDate = event.target.value;
                  if (!nextDate) return;
                  if (nextDate < timecardMinDateKey) {
                    setTimecardDateKey(timecardMinDateKey);
                    return;
                  }
                  if (nextDate > timecardMaxDateKey) {
                    setTimecardDateKey(timecardMaxDateKey);
                    return;
                  }
                  setTimecardDateKey(nextDate);
                }}
                className="px-3 py-2 border rounded-lg"
              />
              <button
                type="button"
                onClick={() => shiftTimecardDate(1)}
                disabled={!canViewLaterTimecards}
                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-700 disabled:opacity-40"
                title="Next day"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Showing {formatDateHeader(selectedTimecardDate)}
          </div>

          {!actorCanManageSchedule && (
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
              Supervisor access is required to save timecard adjustments.
            </div>
          )}

          <div className="space-y-2.5">
            {timecardPunchesForDate.map((punch) => {
              const shift = shiftById[punch.shift_id];
              const roleName = shift?.role_id ? roleById[shift.role_id]?.name || 'Role' : 'Role';
              const employeeName = employeeById[punch.employee_id]?.name || 'Employee';
              const punchDraft = punchAdjustmentsById[punch.id] || {
                clock_in: toDateTimeLocalInput(punch.clock_in),
                clock_out: toDateTimeLocalInput(punch.clock_out),
              };
              const punchBreaks = (breaksByPunchId[punch.id] || [])
                .slice()
                .sort((a, b) => String(a.start_time || '').localeCompare(String(b.start_time || '')));
              const isSavingPunch = savingTimeEntryId === `punch:${punch.id}`;

              return (
                <div key={punch.id} className="border border-gray-100 rounded-lg p-2.5 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-gray-900">{employeeName}</div>
                      <div className="text-xs text-gray-500">
                        {roleName}{' '}
                        {shift
                          ? `• Shift ${formatScheduleWindowForDisplay(shift.start_time, shift.end_time, scheduleTimeDisplayMode)}`
                          : ''}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">Punch ID: {punch.id}</div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Clock In</label>
                      <input
                        type="datetime-local"
                        value={punchDraft.clock_in}
                        onChange={(event) =>
                          setPunchAdjustmentsById((current) => ({
                            ...current,
                            [punch.id]: {
                              ...(current[punch.id] || punchDraft),
                              clock_in: event.target.value,
                            },
                          }))
                        }
                        disabled={!actorCanManageSchedule || Boolean(savingTimeEntryId)}
                        className="w-full px-2 py-1.5 text-sm border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Clock Out</label>
                      <input
                        type="datetime-local"
                        value={punchDraft.clock_out}
                        onChange={(event) =>
                          setPunchAdjustmentsById((current) => ({
                            ...current,
                            [punch.id]: {
                              ...(current[punch.id] || punchDraft),
                              clock_out: event.target.value,
                            },
                          }))
                        }
                        disabled={!actorCanManageSchedule || Boolean(savingTimeEntryId)}
                        className="w-full px-2 py-1.5 text-sm border rounded-md"
                      />
                    </div>
                    <div className="md:self-end">
                      <button
                        type="button"
                        onClick={() => void savePunchAdjustment(punch)}
                        disabled={!actorCanManageSchedule || Boolean(savingTimeEntryId)}
                        className="w-full md:w-auto inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {isSavingPunch ? 'Saving...' : 'Save Punch'}
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-2 space-y-1.5">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Break Entries</div>
                    {punchBreaks.map((entry) => {
                      const breakDraft = breakAdjustmentsById[entry.id] || {
                        start_time: toDateTimeLocalInput(entry.start_time),
                        end_time: toDateTimeLocalInput(entry.end_time),
                      };
                      const isSavingBreak = savingTimeEntryId === `break:${entry.id}`;
                      return (
                        <div key={entry.id} className="rounded-md border border-gray-100 bg-gray-50 p-2 space-y-1.5">
                          <div className="text-xs text-gray-500">
                            {String(entry.break_type || 'break').replace(/_/g, ' ')} • {entry.paid_break ? 'Paid' : 'Unpaid'}
                          </div>
                          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
                            <div>
                              <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Break In</label>
                              <input
                                type="datetime-local"
                                value={breakDraft.start_time}
                                onChange={(event) =>
                                  setBreakAdjustmentsById((current) => ({
                                    ...current,
                                    [entry.id]: {
                                      ...(current[entry.id] || breakDraft),
                                      start_time: event.target.value,
                                    },
                                  }))
                                }
                                disabled={!actorCanManageSchedule || Boolean(savingTimeEntryId)}
                                className="w-full px-2 py-1.5 text-sm border rounded-md bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Break Out</label>
                              <input
                                type="datetime-local"
                                value={breakDraft.end_time}
                                onChange={(event) =>
                                  setBreakAdjustmentsById((current) => ({
                                    ...current,
                                    [entry.id]: {
                                      ...(current[entry.id] || breakDraft),
                                      end_time: event.target.value,
                                    },
                                  }))
                                }
                                disabled={!actorCanManageSchedule || Boolean(savingTimeEntryId)}
                                className="w-full px-2 py-1.5 text-sm border rounded-md bg-white"
                              />
                            </div>
                            <div className="md:self-end">
                              <button
                                type="button"
                                onClick={() => void saveBreakAdjustment(entry)}
                                disabled={!actorCanManageSchedule || Boolean(savingTimeEntryId)}
                                className="w-full md:w-auto inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                              >
                                <Save className="h-3.5 w-3.5" />
                                {isSavingBreak ? 'Saving...' : 'Save Break'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {!punchBreaks.length && (
                      <div className="text-sm text-gray-500">No breaks recorded for this punch.</div>
                    )}
                  </div>
                </div>
              );
            })}

            {!timecardPunchesForDate.length && (
              <div className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-4 text-center">
                No clock activity on this date.
              </div>
            )}
          </div>
        </section>

        <section className="order-4 bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-display font-bold text-gray-900">Time Off + PTO</h2>
              <p className="text-sm text-gray-500">Track sick time, day off requests, and PTO balances.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Dates</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {timeOffRequests
                  .slice()
                  .sort((a, b) => {
                    const statusRankDelta = timeOffStatusRank(a.status) - timeOffStatusRank(b.status);
                    if (statusRankDelta !== 0) return statusRankDelta;

                    const dateDelta = `${a.start_date}${a.created_at || ''}`.localeCompare(
                      `${b.start_date}${b.created_at || ''}`,
                    );
                    if (dateDelta !== 0) return dateDelta;

                    return String(employeeById[a.employee_id]?.name || '').localeCompare(
                      String(employeeById[b.employee_id]?.name || ''),
                    );
                  })
                  .map((request) => {
                    const unit = getEmployeePtoUnit(request.employee_id);
                    return (
                      <tr key={request.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{employeeById[request.employee_id]?.name || 'Employee'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 capitalize">{String(request.request_type || 'day_off').replace('_', ' ')}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {request.start_date} to {request.end_date}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatDecimalInput(ptoHoursToDisplay(Number(request.hours || 0), unit))}
                          {unit === 'days' ? 'd' : 'h'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="capitalize text-gray-700">{normalizeTimeOffStatus(request.status)}</span>
                          {request.status_note && (
                            <div className="text-[11px] text-gray-500 mt-0.5">Note: {request.status_note}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <select
                            value={normalizeTimeOffStatus(request.status)}
                            onChange={(event) =>
                              void updateTimeOffStatus(
                                request,
                                event.target.value as 'pending' | 'approved' | 'denied',
                              )
                            }
                            disabled={saving}
                            className="px-2 py-1.5 text-xs rounded-md border border-gray-200 bg-white text-gray-700"
                            title="Update request status"
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="denied">Denied</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                {!timeOffRequests.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                      No time-off requests yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-gray-100 p-3">
            <div className="text-sm font-semibold text-gray-900">PTO Audit Trail</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Status changes, edits, and deletes for review.
            </div>
            <div className="mt-2 space-y-2 max-h-56 overflow-y-auto pr-1">
              {ptoAuditTrailEntries.map((entry) => (
                <div key={entry.id} className="rounded-md border border-gray-100 bg-gray-50 px-2 py-2">
                  <div className="text-xs font-medium text-gray-900">{entry.summary}</div>
                  <div className="text-[11px] text-gray-600 mt-0.5">
                    {entry.requestType}
                    {entry.startDate && entry.endDate ? ` • ${entry.startDate} to ${entry.endDate}` : ''}
                  </div>
                  {entry.statusNote && (
                    <div className="text-[11px] text-gray-700 mt-0.5">Note: {entry.statusNote}</div>
                  )}
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {entry.actorName} • {formatDateTime(entry.timestamp)}
                  </div>
                </div>
              ))}
              {!ptoAuditTrailEntries.length && (
                <div className="text-xs text-gray-500">No PTO audit events yet.</div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {orderedEmployees.map((employee) => {
              const pto = ptoByEmployeeId[employee.id];
              const unit = getEmployeePtoUnit(employee.id);
              return (
                <div key={`pto-${employee.id}`} className="rounded-lg border border-gray-100 p-3">
                  <div className="font-medium text-gray-900">{employee.name}</div>
                  <div className="text-xs text-gray-500">{employee.title || 'Employee'}</div>
                  <div className="mt-2 text-sm text-gray-700">
                    <div>
                      Accrued: {formatDecimalInput(ptoHoursToDisplay(Number(pto?.accrued_hours || 0), unit))}
                      {unit === 'days' ? 'd' : 'h'}
                    </div>
                    <div>
                      Used: {formatDecimalInput(ptoHoursToDisplay(Number(pto?.used_hours || 0), unit))}
                      {unit === 'days' ? 'd' : 'h'}
                    </div>
                    <div className="font-semibold">
                      Available: {formatDecimalInput(ptoHoursToDisplay(Number(pto?.available_hours || 0), unit))}
                      {unit === 'days' ? 'd' : 'h'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="border border-gray-100 rounded-lg p-4 space-y-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Request Blackout Dates</h3>
                <p className="text-xs text-gray-500">Block PTO/day-off requests for specific date ranges.</p>
              </div>
              <form onSubmit={(event) => void createTimeOffBlock(event)} className="grid sm:grid-cols-4 gap-2">
                <input
                  type="date"
                  value={timeOffBlockDraft.start_date}
                  onChange={(event) =>
                    setTimeOffBlockDraft((current) => ({ ...current, start_date: event.target.value }))
                  }
                  className="px-3 py-2 border rounded-lg"
                  required
                />
                <input
                  type="date"
                  value={timeOffBlockDraft.end_date}
                  onChange={(event) =>
                    setTimeOffBlockDraft((current) => ({ ...current, end_date: event.target.value }))
                  }
                  className="px-3 py-2 border rounded-lg"
                  required
                />
                <input
                  value={timeOffBlockDraft.reason}
                  onChange={(event) =>
                    setTimeOffBlockDraft((current) => ({ ...current, reason: event.target.value }))
                  }
                  className="px-3 py-2 border rounded-lg"
                  placeholder="Reason (optional)"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 disabled:opacity-60"
                >
                  Save Block
                </button>
              </form>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {activeTimeOffBlocks.map((block) => (
                  <div key={block.id} className="border border-gray-100 rounded-md px-3 py-2 flex items-start justify-between gap-2">
                    <div className="text-sm text-gray-700">
                      <div className="font-medium text-gray-900">
                        {block.start_date} to {block.end_date}
                      </div>
                      {block.reason && <div className="text-xs text-gray-500">{block.reason}</div>}
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteTimeOffBlock(block)}
                      disabled={saving}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="Remove block"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {!activeTimeOffBlocks.length && (
                  <div className="text-sm text-gray-500">No blocked date ranges yet.</div>
                )}
              </div>
            </div>

            <div className="border border-gray-100 rounded-lg p-4 space-y-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Company Holidays</h3>
                <p className="text-xs text-gray-500">Set non-working company holidays shown on Today.</p>
              </div>
              <form onSubmit={(event) => void createCompanyHoliday(event)} className="grid sm:grid-cols-4 gap-2">
                <input
                  type="date"
                  value={holidayDraft.holiday_date}
                  onChange={(event) =>
                    setHolidayDraft((current) => ({ ...current, holiday_date: event.target.value }))
                  }
                  className="px-3 py-2 border rounded-lg"
                  required
                />
                <input
                  value={holidayDraft.name}
                  onChange={(event) => setHolidayDraft((current) => ({ ...current, name: event.target.value }))}
                  className="px-3 py-2 border rounded-lg"
                  placeholder="Holiday name"
                  required
                />
                <input
                  value={holidayDraft.notes}
                  onChange={(event) => setHolidayDraft((current) => ({ ...current, notes: event.target.value }))}
                  className="px-3 py-2 border rounded-lg"
                  placeholder="Notes (optional)"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 disabled:opacity-60"
                >
                  Save Holiday
                </button>
              </form>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {activeCompanyHolidays.map((holiday) => (
                  <div key={holiday.id} className="border border-gray-100 rounded-md px-3 py-2 flex items-start justify-between gap-2">
                    <div className="text-sm text-gray-700">
                      <div className="font-medium text-gray-900">
                        {holiday.holiday_date} - {holiday.name}
                      </div>
                      {holiday.notes && <div className="text-xs text-gray-500">{holiday.notes}</div>}
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteCompanyHoliday(holiday)}
                      disabled={saving}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="Remove holiday"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {!activeCompanyHolidays.length && (
                  <div className="text-sm text-gray-500">No company holidays yet.</div>
                )}
              </div>
            </div>
          </div>
        </section>

        {showLegacyStationTasks && (
          <>
            <section className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold text-gray-900">Cleaning Calendar</h2>
              <button
                type="button"
                onClick={() => setShowTaskForm((current) => !current)}
                className="inline-flex items-center gap-2 px-3 py-2 border border-ocean-200 text-ocean-700 rounded-lg hover:bg-ocean-50"
              >
                <Plus className="h-4 w-4" />
                Add Task
              </button>
            </div>

            {showTaskForm && (
              <form onSubmit={(event) => void createTask(event)} className="grid grid-cols-1 gap-3 bg-gray-50 p-4 rounded-lg">
                <input
                  value={taskDraft.title}
                  onChange={(event) => setTaskDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Task title"
                  className="px-3 py-2 border rounded-lg"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={taskDraft.assigned_role_id}
                    onChange={(event) =>
                      setTaskDraft((current) => ({ ...current, assigned_role_id: event.target.value }))
                    }
                    className="px-3 py-2 border rounded-lg"
                  >
                    {roleGroups.map((group) => (
                      <optgroup key={group.section} label={group.section}>
                        {group.items.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <select
                    value={taskDraft.station_id}
                    onChange={(event) => setTaskDraft((current) => ({ ...current, station_id: event.target.value }))}
                    className="px-3 py-2 border rounded-lg"
                  >
                    {stations.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                  disabled={saving}
                  className="px-3 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 disabled:opacity-60"
                >
                  Save Task
                </button>
              </form>
            )}

            <div className="space-y-2">
              {tasks.slice(0, 8).map((task) => {
                const completed = String(task.completion_status || '').toLowerCase() === 'completed';
                return (
                  <div key={task.id} className="border border-gray-100 rounded-lg p-3 flex items-center justify-between gap-3">
                    <div>
                      <div className={`font-medium ${completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {task.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {roleById[task.assigned_role_id || '']?.name || 'Role'} • {stationById[task.station_id || '']?.name || 'Station'}
                      </div>
                      <div className="text-sm text-gray-500">Due {formatDateTime(task.due_time)}</div>
                    </div>
                    {!completed ? (
                      <button
                        type="button"
                        onClick={() => void completeTask(task)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Complete
                      </button>
                    ) : (
                      <span className="text-sm text-green-700">Done</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold text-gray-900">Manager Log Book</h2>
              <button
                type="button"
                onClick={() => setShowLogForm((current) => !current)}
                className="inline-flex items-center gap-2 px-3 py-2 border border-ocean-200 text-ocean-700 rounded-lg hover:bg-ocean-50"
              >
                <NotebookPen className="h-4 w-4" />
                Add Entry
              </button>
            </div>

            {showLogForm && (
              <form onSubmit={(event) => void createLogEntry(event)} className="grid grid-cols-1 gap-3 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={logDraft.category}
                    onChange={(event) => setLogDraft((current) => ({ ...current, category: event.target.value }))}
                    className="px-3 py-2 border rounded-lg"
                  >
                    <option value="operations">Operations</option>
                    <option value="incident">Incident</option>
                    <option value="inventory">Inventory</option>
                    <option value="safety">Safety</option>
                    <option value="staffing">Staffing</option>
                  </select>
                  <select
                    value={logDraft.severity}
                    onChange={(event) => setLogDraft((current) => ({ ...current, severity: event.target.value }))}
                    className="px-3 py-2 border rounded-lg"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <textarea
                  rows={3}
                  value={logDraft.message}
                  onChange={(event) => setLogDraft((current) => ({ ...current, message: event.target.value }))}
                  placeholder="Shift note, incident, equipment issue, or handoff update..."
                  className="px-3 py-2 border rounded-lg"
                  required
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 disabled:opacity-60"
                >
                  Save Entry
                </button>
              </form>
            )}

            <div className="space-y-3">
              {logEntries
                .slice()
                .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
                .slice(0, 8)
                .map((entry) => (
                  <div key={entry.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{entry.author_name || 'Manager'}</span>
                      <span className="text-xs text-gray-500">{formatDateTime(entry.timestamp)}</span>
                    </div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                      {entry.category || 'operations'} • {entry.severity || 'info'}
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-line">{entry.message}</div>
                  </div>
                ))}
            </div>
              </div>
            </section>

            <section className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-display font-bold text-gray-900 mb-4">Compliance Alerts</h2>
            <div className="space-y-3">
              {complianceWarnings.map((warning, index) => (
                <div key={`${warning.code}-${index}`} className="border border-gray-100 rounded-lg p-3 flex items-start gap-3">
                  <AlertTriangle className={`h-5 w-5 mt-0.5 ${warning.severity === 'critical' ? 'text-red-600' : 'text-amber-600'}`} />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{warning.code}</div>
                    <div className="text-sm text-gray-700">{warning.message}</div>
                  </div>
                </div>
              ))}
              {complianceWarnings.length === 0 && (
                <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg p-3">
                  No active compliance exceptions right now.
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-2">Analytics Snapshot</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-500">Worked Hours</div>
                  <div className="font-semibold text-gray-900">{formatHours(workedHours)}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-500">Schedule Adherence</div>
                  <div className="font-semibold text-gray-900">
                    {scheduledHours > 0 ? `${Math.min(100, Math.round((workedHours / scheduledHours) * 100))}%` : '0%'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-500">Open Events</div>
                  <div className="font-semibold text-gray-900">{events.length}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-500">Live Coverage</div>
                  <div className="font-semibold text-gray-900">{openPunches.length} stations</div>
                </div>
              </div>
            </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-display font-bold text-gray-900 mb-4">Canonical Event Ledger</h2>
            <p className="text-sm text-gray-600 mb-4">
              Every action is captured as a typed event so scheduling, time tracking, tasks, compliance, and analytics stay in sync.
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {events.slice(0, 16).map((event) => (
                <div key={event.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-gray-900">{event.event_type}</div>
                    <div className="text-xs text-gray-500">{formatDateTime(event.timestamp)}</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {event.subject_type || 'subject'}:{' '}
                    <span className="font-mono">{event.subject_id || '-'}</span>
                  </div>
                </div>
              ))}
              {!events.length && (
                <div className="text-sm text-gray-500">No events yet.</div>
              )}
            </div>
              </div>
            </section>

            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-display font-bold text-gray-900 mb-4">V1 Scope Anchors</h2>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="rounded-lg border border-gray-100 p-4">
                  <div className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-ocean-600" />
                    Workforce Planning
                  </div>
                  <p className="text-gray-600">Team roster, roles, stations, shifts, publish flow, and live reassignment controls.</p>
                </div>
                <div className="rounded-lg border border-gray-100 p-4">
                  <div className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-ocean-600" />
                    Labor Tracking
                  </div>
                  <p className="text-gray-600">Clock in/out ledger, overtime and break signals, and station-level labor cost visibility.</p>
                </div>
                <div className="rounded-lg border border-gray-100 p-4">
                  <div className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-ocean-600" />
                    Operations Control
                  </div>
                  <p className="text-gray-600">Task execution, manager logbook, and event-backed audit trail for reliable BOH decisions.</p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default WorkforceManagement;
