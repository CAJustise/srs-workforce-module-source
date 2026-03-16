export interface LaborBreakInput {
  start_time: string;
  end_time?: string | null;
  paid_break?: boolean | null;
  break_type?: string | null;
  expected_minutes?: number | null;
}

export interface LaborPunchInput {
  id: string;
  employee_id: string;
  clock_in: string;
  clock_out?: string | null;
  rate: number;
  breaks?: LaborBreakInput[];
}

interface Segment {
  employee_id: string;
  dayKey: string;
  weekKey: string;
  dayOffset: number;
  startsAt: number;
  hours: number;
  rate: number;
}

interface RegularAllocation {
  startsAt: number;
  hours: number;
  rate: number;
}

export interface CaliforniaLaborSummary {
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
  totalCost: number;
}

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

const toLocalDayKey = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startOfWeek = (value: Date) => {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() - next.getDay());
  return next;
};

const weekKeyFor = (value: Date) => toLocalDayKey(startOfWeek(value));

const isBreakPaid = (entry: LaborBreakInput, actualMinutes: number) => {
  if (entry.paid_break === true) return true;
  if (entry.paid_break === false) return false;

  const type = String(entry.break_type || '').toLowerCase();
  if (type.includes('paid') || type.includes('rest')) return true;
  if (type.includes('unpaid') || type.includes('meal')) return false;

  if (entry.expected_minutes !== undefined && entry.expected_minutes !== null) {
    return Number(entry.expected_minutes) <= 15;
  }

  return actualMinutes <= 15;
};

const unpaidBreakHours = (entries: LaborBreakInput[] = [], nowMs: number) =>
  entries.reduce((total, entry) => {
    const startMs = new Date(entry.start_time).getTime();
    const endMs = new Date(entry.end_time || nowMs).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) return total;
    const minutes = (endMs - startMs) / MINUTE_MS;
    if (isBreakPaid(entry, minutes)) return total;
    return total + minutes / 60;
  }, 0);

export const calculateCaliforniaLaborSummary = (
  punches: LaborPunchInput[],
  now = new Date(),
): CaliforniaLaborSummary => {
  const nowMs = now.getTime();
  const segments: Segment[] = [];

  punches.forEach((punch) => {
    const clockInMs = new Date(punch.clock_in).getTime();
    const clockOutMs = new Date(punch.clock_out || nowMs).getTime();
    if (Number.isNaN(clockInMs) || Number.isNaN(clockOutMs) || clockOutMs <= clockInMs) return;

    const grossHours = (clockOutMs - clockInMs) / HOUR_MS;
    const unpaidHours = unpaidBreakHours(punch.breaks || [], nowMs);
    const netHours = Math.max(0, grossHours - unpaidHours);
    if (netHours <= 0) return;

    const clockInDate = new Date(clockInMs);
    const dayKey = toLocalDayKey(clockInDate);
    const weekStart = startOfWeek(clockInDate);
    const dayOffset = Math.round(
      (new Date(`${dayKey}T00:00:00`).getTime() - weekStart.getTime()) / (24 * HOUR_MS),
    );

    segments.push({
      employee_id: punch.employee_id,
      dayKey,
      weekKey: weekKeyFor(clockInDate),
      dayOffset,
      startsAt: clockInMs,
      hours: netHours,
      rate: Number(punch.rate || 0),
    });
  });

  if (!segments.length) {
    return {
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      doubleTimeHours: 0,
      totalCost: 0,
    };
  }

  let totalHours = 0;
  let regularHours = 0;
  let overtimeHours = 0;
  let doubleTimeHours = 0;
  let totalCost = 0;

  const segmentsByEmployeeWeek = new Map<string, Segment[]>();
  segments.forEach((segment) => {
    const key = `${segment.employee_id}::${segment.weekKey}`;
    const existing = segmentsByEmployeeWeek.get(key) || [];
    existing.push(segment);
    segmentsByEmployeeWeek.set(key, existing);
  });

  segmentsByEmployeeWeek.forEach((employeeWeekSegments) => {
    employeeWeekSegments.sort((a, b) => a.startsAt - b.startsAt);
    let weekRegularHours = 0;

    const daysWorked = new Set(
      employeeWeekSegments.filter((segment) => segment.hours > 0).map((segment) => segment.dayOffset),
    );
    const seventhDayOffset = daysWorked.size === 7 ? 6 : -1;

    const segmentsByDay = new Map<string, Segment[]>();
    employeeWeekSegments.forEach((segment) => {
      const key = segment.dayKey;
      const existing = segmentsByDay.get(key) || [];
      existing.push(segment);
      segmentsByDay.set(key, existing);
    });

    const orderedDayKeys = Array.from(segmentsByDay.keys()).sort((a, b) => a.localeCompare(b));
    const regularAllocations: RegularAllocation[] = [];

    orderedDayKeys.forEach((dayKey) => {
      const daySegments = (segmentsByDay.get(dayKey) || []).slice().sort((a, b) => a.startsAt - b.startsAt);
      const dayHours = daySegments.reduce((sum, segment) => sum + segment.hours, 0);
      totalHours += dayHours;

      const first = daySegments[0];
      const isSeventhDay = first.dayOffset === seventhDayOffset;

      let regularQuota = 0;
      let overtimeQuota = 0;
      let doubleTimeQuota = 0;

      if (isSeventhDay) {
        overtimeQuota = Math.min(8, dayHours);
        doubleTimeQuota = Math.max(0, dayHours - 8);
      } else {
        regularQuota = Math.min(8, dayHours);
        overtimeQuota = Math.max(0, Math.min(dayHours, 12) - 8);
        doubleTimeQuota = Math.max(0, dayHours - 12);
      }

      daySegments.forEach((segment) => {
        let remaining = segment.hours;

        if (regularQuota > 0) {
          const regularPart = Math.min(remaining, regularQuota);
          regularQuota -= regularPart;
          remaining -= regularPart;
          regularHours += regularPart;
          weekRegularHours += regularPart;
          totalCost += regularPart * segment.rate;
          regularAllocations.push({
            startsAt: segment.startsAt,
            hours: regularPart,
            rate: segment.rate,
          });
        }

        if (overtimeQuota > 0 && remaining > 0) {
          const overtimePart = Math.min(remaining, overtimeQuota);
          overtimeQuota -= overtimePart;
          remaining -= overtimePart;
          overtimeHours += overtimePart;
          totalCost += overtimePart * segment.rate * 1.5;
        }

        if (doubleTimeQuota > 0 && remaining > 0) {
          const doublePart = Math.min(remaining, doubleTimeQuota);
          doubleTimeQuota -= doublePart;
          remaining -= doublePart;
          doubleTimeHours += doublePart;
          totalCost += doublePart * segment.rate * 2;
        }

        if (remaining > 0) {
          // Defensive fallback for rounding edge cases.
          regularHours += remaining;
          weekRegularHours += remaining;
          totalCost += remaining * segment.rate;
          regularAllocations.push({
            startsAt: segment.startsAt,
            hours: remaining,
            rate: segment.rate,
          });
        }
      });
    });

    if (weekRegularHours > 40) {
      let weeklyOvertimeToPromote = weekRegularHours - 40;

      regularAllocations
        .slice()
        .sort((a, b) => b.startsAt - a.startsAt)
        .forEach((allocation) => {
          if (weeklyOvertimeToPromote <= 0) return;
          const promoted = Math.min(allocation.hours, weeklyOvertimeToPromote);
          weeklyOvertimeToPromote -= promoted;
          weekRegularHours -= promoted;
          regularHours -= promoted;
          overtimeHours += promoted;
          // Upgrade from 1x already counted to 1.5x total.
          totalCost += promoted * allocation.rate * 0.5;
        });
    }
  });

  return {
    totalHours,
    regularHours,
    overtimeHours,
    doubleTimeHours,
    totalCost,
  };
};
