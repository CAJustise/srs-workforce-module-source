export type ScheduleTimeDisplayMode = 'eastern' | 'local';

export const SCHEDULE_SOURCE_TIME_ZONE = 'America/New_York';
export const SCHEDULE_TIME_DISPLAY_STORAGE_KEY = 'srs_schedule_time_display_mode';
export const SCHEDULE_US_TIME_ZONE_STORAGE_KEY = 'srs_schedule_us_time_zone';
export const DEFAULT_US_SCHEDULE_TIME_ZONE = 'America/New_York';

export const US_SCHEDULE_TIME_ZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Phoenix', label: 'Arizona (MST)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'America/Anchorage', label: 'Alaska (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HST)' },
] as const;

interface DateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const DATE_TIME_PARTS_REGEX = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/;

const parseDateTimeParts = (value: string): DateTimeParts | null => {
  const next = String(value || '').trim();
  const match = DATE_TIME_PARTS_REGEX.exec(next);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] || 0);

  if ([year, month, day, hour, minute, second].some((part) => Number.isNaN(part))) return null;
  return { year, month, day, hour, minute, second };
};

const formatWallClockTime = (parts: DateTimeParts) =>
  new Date(Date.UTC(2000, 0, 1, parts.hour, parts.minute, parts.second)).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  });

const offsetFormatterByZone = new Map<string, Intl.DateTimeFormat>();

const getOffsetFormatter = (timeZone: string) => {
  const existing = offsetFormatterByZone.get(timeZone);
  if (existing) return existing;

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  offsetFormatterByZone.set(timeZone, formatter);
  return formatter;
};

const parseOffsetMinutes = (value: string) => {
  if (!value) return 0;
  const normalized = value.trim().toUpperCase();
  if (normalized === 'GMT' || normalized === 'UTC') return 0;
  const match = normalized.match(/(?:GMT|UTC)([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!match) return 0;

  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number(match[2] || 0);
  const minutes = Number(match[3] || 0);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return sign * (hours * 60 + minutes);
};

const getTimeZoneOffsetMinutesAtUtc = (timeZone: string, utcMs: number) => {
  const formatter = getOffsetFormatter(timeZone);
  const parts = formatter.formatToParts(new Date(utcMs));
  const offsetLabel = parts.find((part) => part.type === 'timeZoneName')?.value || 'GMT';
  return parseOffsetMinutes(offsetLabel);
};

const parseEasternWallClockToDate = (value: string) => {
  const parts = parseDateTimeParts(value);
  if (!parts) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  }

  const naiveUtcMs = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const initialOffsetMinutes = getTimeZoneOffsetMinutesAtUtc(SCHEDULE_SOURCE_TIME_ZONE, naiveUtcMs);
  let resolvedUtcMs = naiveUtcMs - initialOffsetMinutes * 60000;
  const resolvedOffsetMinutes = getTimeZoneOffsetMinutesAtUtc(SCHEDULE_SOURCE_TIME_ZONE, resolvedUtcMs);

  if (resolvedOffsetMinutes !== initialOffsetMinutes) {
    resolvedUtcMs = naiveUtcMs - resolvedOffsetMinutes * 60000;
  }

  const resolvedDate = new Date(resolvedUtcMs);
  if (Number.isNaN(resolvedDate.getTime())) return null;
  return resolvedDate;
};

export const getScheduleLocalTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';

export const readScheduleTimeDisplayMode = (): ScheduleTimeDisplayMode => {
  if (typeof window === 'undefined') return 'eastern';
  const saved = window.localStorage.getItem(SCHEDULE_TIME_DISPLAY_STORAGE_KEY);
  return saved === 'local' ? 'local' : 'eastern';
};

export const persistScheduleTimeDisplayMode = (mode: ScheduleTimeDisplayMode) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SCHEDULE_TIME_DISPLAY_STORAGE_KEY, mode);
};

export const readScheduleUsTimeZone = () => {
  if (typeof window === 'undefined') return DEFAULT_US_SCHEDULE_TIME_ZONE;
  const saved = window.localStorage.getItem(SCHEDULE_US_TIME_ZONE_STORAGE_KEY);
  if (!saved) return DEFAULT_US_SCHEDULE_TIME_ZONE;
  return US_SCHEDULE_TIME_ZONE_OPTIONS.some((option) => option.value === saved)
    ? saved
    : DEFAULT_US_SCHEDULE_TIME_ZONE;
};

export const persistScheduleUsTimeZone = (timeZone: string) => {
  if (typeof window === 'undefined') return;
  if (!US_SCHEDULE_TIME_ZONE_OPTIONS.some((option) => option.value === timeZone)) return;
  window.localStorage.setItem(SCHEDULE_US_TIME_ZONE_STORAGE_KEY, timeZone);
};

export const formatScheduleTimeForTimeZone = (value: string, timeZone: string) => {
  const parts = parseDateTimeParts(value);
  const date = parseEasternWallClockToDate(value);
  if (!date) return parts ? formatWallClockTime(parts) : String(value || '');

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  });
};

export const formatScheduleWindowForTimeZone = (
  startTime: string,
  endTime: string,
  timeZone: string,
) => `${formatScheduleTimeForTimeZone(startTime, timeZone)} - ${formatScheduleTimeForTimeZone(endTime, timeZone)}`;

export const formatScheduleTimeForDisplay = (
  value: string,
  mode: ScheduleTimeDisplayMode,
) => {
  if (mode === 'eastern') {
    return formatScheduleTimeForTimeZone(value, SCHEDULE_SOURCE_TIME_ZONE);
  }

  const parts = parseDateTimeParts(value);
  const date = parseEasternWallClockToDate(value);
  if (!date) return parts ? formatWallClockTime(parts) : String(value || '');

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const formatScheduleWindowForDisplay = (
  startTime: string,
  endTime: string,
  mode: ScheduleTimeDisplayMode,
) => `${formatScheduleTimeForDisplay(startTime, mode)} - ${formatScheduleTimeForDisplay(endTime, mode)}`;
