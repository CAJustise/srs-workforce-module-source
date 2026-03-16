import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, Repeat, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { derivePortalCapabilities, getRoleIdsForUser, getTeamMemberForUser } from '../../lib/bohRoles';
import { formatPerPersonPrice, formatPersonMinimum } from '../../lib/formatting';

interface ClassEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  price: string | null;
  image_url: string;
  booking_type: 'class' | 'event' | 'reservation' | null;
  booking_url: string | null;
  booking_capacity?: number;
  booking_minimum?: number;
  active: boolean;
  display_order: number;
}

interface ClassSession {
  id: string;
  event_id: string;
  class_date: string;
  class_time: string;
  capacity_override: number | null;
  minimum_override: number | null;
  active: boolean;
  created_at?: string;
}

interface ClassBooking {
  id: string;
  event_id: string;
  class_session_id?: string;
  class_title?: string;
  class_date?: string;
  class_time?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  guest_count: number;
  special_requests?: string;
  status?: string;
  created_at?: string;
}

interface SessionDraft {
  event_id: string;
  class_date: string;
  class_time: string;
  capacity_override: string;
  minimum_override: string;
  active: boolean;
}

interface RecurringDraft {
  event_id: string;
  start_date: string;
  start_time: string;
  recurrence: 'weekly' | 'monthly';
  occurrences: number;
  capacity_override: string;
  minimum_override: string;
  active: boolean;
}

const CLASS_STATUS_OPTIONS = ['pending', 'confirmed', 'checked-in', 'completed', 'cancelled'];

const formatClock = (value: string) => {
  if (!value) return '';
  const [hours, minutes] = value.split(':');
  const date = new Date();
  date.setHours(Number(hours || 0), Number(minutes || 0), 0, 0);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const toTimeInputValue = (value: string) => value.slice(0, 5);

const toTimeWithSeconds = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`;
  return trimmed;
};

const toNullableNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric)) return null;
  return numeric;
};

const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildRecurringDates = (startDate: string, recurrence: 'weekly' | 'monthly', occurrences: number) => {
  const base = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) return [];

  return Array.from({ length: Math.max(1, occurrences) }, (_, index) => {
    const next = new Date(base);
    if (index > 0) {
      if (recurrence === 'weekly') {
        next.setDate(base.getDate() + index * 7);
      } else {
        next.setMonth(base.getMonth() + index);
      }
    }
    return formatDateValue(next);
  });
};

const nextGeneratedId = (prefix: string) => {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${random}`;
};

interface BOHClassesProps {
  canManageClassSetup?: boolean;
  canEditBookings?: boolean;
  canDeleteBookings?: boolean;
}

const BOHClasses: React.FC<BOHClassesProps> = ({
  canManageClassSetup: canManageClassSetupProp = true,
  canEditBookings: canEditBookingsProp = true,
  canDeleteBookings: canDeleteBookingsProp = true,
}) => {
  const [classEvents, setClassEvents] = useState<ClassEvent[]>([]);
  const [classSessions, setClassSessions] = useState<ClassSession[]>([]);
  const [classBookings, setClassBookings] = useState<ClassBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [classesReadOnly, setClassesReadOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isClassFormOpen, setIsClassFormOpen] = useState(false);
  const [editingClassEvent, setEditingClassEvent] = useState<ClassEvent | null>(null);
  const [editingBooking, setEditingBooking] = useState<ClassBooking | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const [isSessionFormOpen, setIsSessionFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ClassSession | null>(null);
  const [sessionDraft, setSessionDraft] = useState<SessionDraft>({
    event_id: '',
    class_date: '',
    class_time: '',
    capacity_override: '',
    minimum_override: '',
    active: true,
  });

  const [isRecurringFormOpen, setIsRecurringFormOpen] = useState(false);
  const [recurringDraft, setRecurringDraft] = useState<RecurringDraft>({
    event_id: '',
    start_date: '',
    start_time: '',
    recurrence: 'weekly',
    occurrences: 4,
    capacity_override: '',
    minimum_override: '',
    active: true,
  });

  const fetchClassEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('booking_type', 'class')
      .order('display_order')
      .order('date')
      .order('time');

    if (error) {
      throw new Error(error.message || 'Failed to load class templates');
    }

    setClassEvents((data as ClassEvent[]) || []);
  };

  const fetchClassSessions = async () => {
    const { data, error } = await supabase
      .from('class_sessions')
      .select('*')
      .order('class_date')
      .order('class_time');

    if (error) {
      throw new Error(error.message || 'Failed to load class sessions');
    }

    setClassSessions((data as ClassSession[]) || []);
  };

  const fetchClassBookings = async () => {
    const { data, error } = await supabase
      .from('class_bookings')
      .select('*')
      .order('class_date')
      .order('class_time');

    if (error) {
      throw new Error(error.message || 'Failed to load class bookings');
    }

    setClassBookings((data as ClassBooking[]) || []);
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchClassEvents(), fetchClassSessions(), fetchClassBookings()]);
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let active = true;

    const resolveAccess = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user?.id) return;

        const roleIds = await getRoleIdsForUser(session.user.id);
        const teamMember = await getTeamMemberForUser(session.user.id);
        const capabilities = derivePortalCapabilities(roleIds, teamMember);

        if (active) {
          setClassesReadOnly(Boolean(capabilities.operationsClassesReadOnly));
        }
      } finally {
        if (active) {
          setPermissionsLoading(false);
        }
      }
    };

    void resolveAccess();

    return () => {
      active = false;
    };
  }, []);

  const canManageClassSetup = canManageClassSetupProp && !classesReadOnly;
  const canEditBookings = canEditBookingsProp && !classesReadOnly;
  const canDeleteBookings = canDeleteBookingsProp && !classesReadOnly;

  const classEventMap = useMemo(
    () =>
      classEvents.reduce((accumulator, classEvent) => {
        accumulator[classEvent.id] = classEvent;
        return accumulator;
      }, {} as Record<string, ClassEvent>),
    [classEvents],
  );

  const classSessionMap = useMemo(
    () =>
      classSessions.reduce((accumulator, session) => {
        accumulator[session.id] = session;
        return accumulator;
      }, {} as Record<string, ClassSession>),
    [classSessions],
  );

  const classSessionByScheduleKey = useMemo(
    () =>
      classSessions.reduce((accumulator, session) => {
        const key = `${session.event_id}::${session.class_date}::${session.class_time}`;
        accumulator[key] = session;
        return accumulator;
      }, {} as Record<string, ClassSession>),
    [classSessions],
  );

  const bookingLoadBySession = useMemo(
    () =>
      classBookings.reduce((accumulator, booking) => {
        const status = (booking.status || 'pending').toLowerCase();
        if (status === 'cancelled' || status === 'declined') {
          return accumulator;
        }

        const guests = Number(booking.guest_count || 0);
        const sessionId = String(booking.class_session_id || '').trim();

        if (sessionId) {
          accumulator[sessionId] = (accumulator[sessionId] || 0) + guests;
          return accumulator;
        }

        if (booking.event_id && booking.class_date && booking.class_time) {
          const key = `${booking.event_id}::${booking.class_date}::${booking.class_time}`;
          const fallbackSession = classSessionByScheduleKey[key];
          if (fallbackSession?.id) {
            accumulator[fallbackSession.id] = (accumulator[fallbackSession.id] || 0) + guests;
          }
        }

        return accumulator;
      }, {} as Record<string, number>),
    [classBookings, classSessionByScheduleKey],
  );

  const bookingLoadByEvent = useMemo(
    () =>
      classSessions.reduce((accumulator, session) => {
        accumulator[session.event_id] = (accumulator[session.event_id] || 0) + (bookingLoadBySession[session.id] || 0);
        return accumulator;
      }, {} as Record<string, number>),
    [classSessions, bookingLoadBySession],
  );

  const filteredBookings = useMemo(
    () =>
      classBookings.filter((booking) => {
        if (filterStatus === 'all') return true;
        return (booking.status || 'pending').toLowerCase() === filterStatus;
      }),
    [classBookings, filterStatus],
  );

  const resetSessionDraft = (eventId = '') => {
    setSessionDraft({
      event_id: eventId || classEvents[0]?.id || '',
      class_date: '',
      class_time: '',
      capacity_override: '',
      minimum_override: '',
      active: true,
    });
  };

  const resetRecurringDraft = (eventId = '') => {
    setRecurringDraft({
      event_id: eventId || classEvents[0]?.id || '',
      start_date: '',
      start_time: '',
      recurrence: 'weekly',
      occurrences: 4,
      capacity_override: '',
      minimum_override: '',
      active: true,
    });
  };

  const ensureTemplateSession = async (eventId: string, payload: { date: string; time: string; booking_capacity: number; booking_minimum: number; active: boolean }) => {
    const matchingSession = classSessions.find(
      (session) =>
        session.event_id === eventId &&
        session.class_date === payload.date &&
        session.class_time === toTimeWithSeconds(payload.time),
    );

    if (matchingSession) {
      return;
    }

    const { error } = await supabase.from('class_sessions').insert([
      {
        event_id: eventId,
        class_date: payload.date,
        class_time: toTimeWithSeconds(payload.time),
        capacity_override: payload.booking_capacity,
        minimum_override: payload.booking_minimum,
        active: payload.active,
      },
    ]);

    if (error) {
      throw new Error(error.message || 'Failed to seed base class session');
    }
  };

  const handleOpenCreateClass = () => {
    if (!canManageClassSetup) return;
    setEditingClassEvent(null);
    setIsClassFormOpen(true);
  };

  const handleOpenEditClass = (classEvent: ClassEvent) => {
    if (!canManageClassSetup) return;
    setEditingClassEvent(classEvent);
    setIsClassFormOpen(true);
  };

  const handleOpenCreateSession = (eventId = '') => {
    if (!canManageClassSetup) return;
    setEditingSession(null);
    resetSessionDraft(eventId);
    setIsSessionFormOpen(true);
  };

  const handleOpenEditSession = (session: ClassSession) => {
    if (!canManageClassSetup) return;
    setEditingSession(session);
    setSessionDraft({
      event_id: session.event_id,
      class_date: session.class_date,
      class_time: toTimeInputValue(session.class_time),
      capacity_override: session.capacity_override == null ? '' : String(session.capacity_override),
      minimum_override: session.minimum_override == null ? '' : String(session.minimum_override),
      active: session.active,
    });
    setIsSessionFormOpen(true);
  };

  const handleOpenRecurring = (eventId = '') => {
    if (!canManageClassSetup) return;
    resetRecurringDraft(eventId);
    setIsRecurringFormOpen(true);
  };

  const handleClassSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    if (!canManageClassSetup) return;
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const classId = editingClassEvent?.id || nextGeneratedId('event_class');
    const payload = {
      id: classId,
      title: String(formData.get('title') || '').trim(),
      description: String(formData.get('description') || '').trim(),
      date: String(formData.get('date') || '').trim(),
      time: toTimeWithSeconds(String(formData.get('time') || '').trim()),
      price: String(formData.get('price') || '').trim() || null,
      image_url: String(formData.get('image_url') || '').trim(),
      booking_type: 'class' as const,
      booking_url: null,
      booking_capacity: Number(formData.get('booking_capacity') || 16),
      booking_minimum: Number(formData.get('booking_minimum') || 1),
      display_order: Number(formData.get('display_order') || 0),
      active: Boolean(formData.get('active')),
    };

    if (!payload.title || !payload.description || !payload.date || !payload.time || !payload.image_url) {
      alert('Title, description, date, time, and image URL are required.');
      return;
    }

    if (payload.booking_minimum < 1) {
      alert('Minimum guest count must be at least 1.');
      return;
    }

    if (payload.booking_minimum > payload.booking_capacity) {
      alert('Minimum guest count cannot be greater than class capacity.');
      return;
    }

    setSaving(true);
    try {
      if (editingClassEvent) {
        const { error } = await supabase
          .from('events')
          .update(payload)
          .eq('id', editingClassEvent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('events')
          .insert([payload]);
        if (error) throw error;
      }

      await ensureTemplateSession(classId, payload);
      await Promise.all([fetchClassEvents(), fetchClassSessions()]);
      setIsClassFormOpen(false);
      setEditingClassEvent(null);
    } catch (error) {
      alert(`Failed to save class template: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!canManageClassSetup) return;
    if (!confirm('Delete this class template and all of its future sessions? Existing signups will remain in class bookings.')) return;

    setSaving(true);
    try {
      const { error: sessionError } = await supabase
        .from('class_sessions')
        .delete()
        .eq('event_id', classId);
      if (sessionError) throw sessionError;

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', classId);
      if (error) throw error;

      await Promise.all([fetchClassEvents(), fetchClassSessions(), fetchClassBookings()]);
    } catch (error) {
      alert(`Failed to delete class template: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSessionSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    if (!canManageClassSetup) return;
    event.preventDefault();

    const eventId = sessionDraft.event_id;
    const classDate = sessionDraft.class_date;
    const classTime = toTimeWithSeconds(sessionDraft.class_time);
    const capacityOverride = toNullableNumber(sessionDraft.capacity_override);
    const minimumOverride = toNullableNumber(sessionDraft.minimum_override);

    if (!eventId || !classDate || !classTime) {
      alert('Class, date, and time are required.');
      return;
    }

    if (minimumOverride != null && minimumOverride < 1) {
      alert('Minimum guests must be at least 1 when provided.');
      return;
    }

    if (minimumOverride != null && capacityOverride != null && minimumOverride > capacityOverride) {
      alert('Minimum guests cannot be greater than capacity.');
      return;
    }

    if (!editingSession) {
      const duplicate = classSessions.find(
        (session) =>
          session.event_id === eventId &&
          session.class_date === classDate &&
          session.class_time === classTime,
      );
      if (duplicate) {
        alert('A class session already exists for that class/date/time.');
        return;
      }
    }

    setSaving(true);
    try {
      if (editingSession) {
        const { error } = await supabase
          .from('class_sessions')
          .update({
            event_id: eventId,
            class_date: classDate,
            class_time: classTime,
            capacity_override: capacityOverride,
            minimum_override: minimumOverride,
            active: sessionDraft.active,
          })
          .eq('id', editingSession.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('class_sessions').insert([
          {
            event_id: eventId,
            class_date: classDate,
            class_time: classTime,
            capacity_override: capacityOverride,
            minimum_override: minimumOverride,
            active: sessionDraft.active,
          },
        ]);

        if (error) throw error;
      }

      await Promise.all([fetchClassSessions(), fetchClassBookings()]);
      setIsSessionFormOpen(false);
      setEditingSession(null);
      resetSessionDraft();
    } catch (error) {
      alert(`Failed to save class session: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRecurringSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    if (!canManageClassSetup) return;
    event.preventDefault();

    const eventId = recurringDraft.event_id;
    const startDate = recurringDraft.start_date;
    const startTime = toTimeWithSeconds(recurringDraft.start_time);
    const occurrences = Math.max(1, Number(recurringDraft.occurrences || 1));
    const capacityOverride = toNullableNumber(recurringDraft.capacity_override);
    const minimumOverride = toNullableNumber(recurringDraft.minimum_override);

    if (!eventId || !startDate || !startTime) {
      alert('Class, start date, and start time are required.');
      return;
    }

    if (minimumOverride != null && minimumOverride < 1) {
      alert('Minimum guests must be at least 1 when provided.');
      return;
    }

    if (minimumOverride != null && capacityOverride != null && minimumOverride > capacityOverride) {
      alert('Minimum guests cannot be greater than capacity.');
      return;
    }

    const dates = buildRecurringDates(startDate, recurringDraft.recurrence, occurrences);
    if (!dates.length) {
      alert('Could not generate recurring dates from the selected start date.');
      return;
    }

    const existingKeys = new Set(
      classSessions.map((session) => `${session.event_id}::${session.class_date}::${session.class_time}`),
    );

    const payload = dates
      .map((dateValue) => ({
        id: nextGeneratedId('class_session'),
        event_id: eventId,
        class_date: dateValue,
        class_time: startTime,
        capacity_override: capacityOverride,
        minimum_override: minimumOverride,
        active: recurringDraft.active,
      }))
      .filter((session) => !existingKeys.has(`${session.event_id}::${session.class_date}::${session.class_time}`));

    if (!payload.length) {
      alert('All generated sessions already exist.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('class_sessions').insert(payload);
      if (error) throw error;

      await fetchClassSessions();
      setIsRecurringFormOpen(false);
      resetRecurringDraft();
    } catch (error) {
      alert(`Failed to generate recurring sessions: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!canManageClassSetup) return;
    if (!confirm('Delete this class session? Existing signups will remain for historical records.')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('class_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      await Promise.all([fetchClassSessions(), fetchClassBookings()]);
    } catch (error) {
      alert(`Failed to delete class session: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleBookingDelete = async (bookingId: string) => {
    if (!canDeleteBookings) return;
    if (!confirm('Delete this class signup?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('class_bookings')
        .delete()
        .eq('id', bookingId);
      if (error) throw error;
      await fetchClassBookings();
    } catch (error) {
      alert(`Failed to delete class booking: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleBookingUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    if (!canEditBookings) return;
    event.preventDefault();
    if (!editingBooking) return;

    const formData = new FormData(event.currentTarget);
    const payload = {
      customer_name: String(formData.get('customer_name') || '').trim(),
      customer_email: String(formData.get('customer_email') || '').trim(),
      customer_phone: String(formData.get('customer_phone') || '').trim(),
      guest_count: Number(formData.get('guest_count') || 1),
      special_requests: String(formData.get('special_requests') || '').trim(),
      status: String(formData.get('status') || 'pending').trim().toLowerCase(),
    };

    if (!payload.customer_name || !payload.customer_email) {
      alert('Name and email are required.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('class_bookings')
        .update(payload)
        .eq('id', editingBooking.id);
      if (error) throw error;
      await fetchClassBookings();
      setEditingBooking(null);
    } catch (error) {
      alert(`Failed to update class booking: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">Classes Calendar</h1>
            <p className="text-gray-600 font-garamond">
              {canManageClassSetup
                ? 'Build class templates, generate weekly/monthly sessions, and manage attendee signups.'
                : 'View class templates and sessions while managing class reservations.'}
            </p>
            {!canManageClassSetup && (
              <p className="text-sm text-gray-500 font-garamond mt-1">Class setup is view-only in this portal.</p>
            )}
          </div>
          {canManageClassSetup && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleOpenCreateSession()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-ocean-200 text-ocean-700 rounded-lg hover:bg-ocean-50"
              >
                <Plus className="h-4 w-4" />
                Add Session
              </button>
              <button
                type="button"
                onClick={() => handleOpenRecurring()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-ocean-200 text-ocean-700 rounded-lg hover:bg-ocean-50"
              >
                <Repeat className="h-4 w-4" />
                Generate Recurring
              </button>
              <button
                type="button"
                onClick={handleOpenCreateClass}
                className="inline-flex items-center gap-2 px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700"
              >
                <Plus className="h-4 w-4" />
                Add Class Template
              </button>
            </div>
          )}
        </div>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-display font-bold text-gray-900 mb-4">Class Templates</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Default Date / Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Default Capacity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sessions</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                    {canManageClassSetup ? 'Actions' : 'View'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {classEvents.map((classEvent) => {
                  const defaultCapacity = Number(classEvent.booking_capacity || 0);
                  const minimum = Number(classEvent.booking_minimum || 1);
                  const sessionCount = classSessions.filter((session) => session.event_id === classEvent.id).length;
                  const enrolled = bookingLoadByEvent[classEvent.id] || 0;

                  return (
                    <tr key={classEvent.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{classEvent.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-2">{classEvent.description}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{classEvent.date}</div>
                        <div className="text-sm text-gray-500">{formatClock(classEvent.time)}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-900">{formatPerPersonPrice(classEvent.price) || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900">{defaultCapacity} seats</div>
                        {minimum > 1 && <div className="text-sm text-gray-500">{formatPersonMinimum(minimum)}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900">{sessionCount} sessions</div>
                        <div className="text-sm text-gray-500">{enrolled} booked</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={classEvent.active ? 'text-green-600' : 'text-gray-500'}>
                          {classEvent.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {canManageClassSetup ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenCreateSession(classEvent.id)}
                              className="inline-flex items-center justify-center p-2 text-ocean-600 hover:text-ocean-700"
                              title="Add session"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditClass(classEvent)}
                              className="inline-flex items-center justify-center p-2 text-ocean-600 hover:text-ocean-700"
                              title="Edit class template"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteClass(classEvent.id)}
                              className="inline-flex items-center justify-center p-2 text-red-600 hover:text-red-700"
                              title="Delete class template"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">View Only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!classEvents.length && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No class templates configured yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-display font-bold text-gray-900 mb-4">Class Sessions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date / Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Capacity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                    {canManageClassSetup ? 'Actions' : 'View'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {classSessions.map((session) => {
                  const classEvent = classEventMap[session.event_id];
                  const capacity = session.capacity_override ?? Number(classEvent?.booking_capacity || 0);
                  const minimum = Math.max(1, session.minimum_override ?? Number(classEvent?.booking_minimum || 1));
                  const enrolled = bookingLoadBySession[session.id] || 0;
                  const remaining = Math.max(0, capacity - enrolled);

                  return (
                    <tr key={session.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{classEvent?.title || 'Class Session'}</div>
                        <div className="text-sm text-gray-500">{classEvent?.description || 'No description'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{session.class_date}</div>
                        <div className="text-sm text-gray-500">{formatClock(session.class_time)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900">
                          {enrolled}/{capacity}
                        </div>
                        <div className="text-sm text-gray-500">{remaining} remaining</div>
                        {minimum > 1 && <div className="text-sm text-gray-500">{formatPersonMinimum(minimum)}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={session.active ? 'text-green-600' : 'text-gray-500'}>
                          {session.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {canManageClassSetup ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEditSession(session)}
                              className="inline-flex items-center justify-center p-2 text-ocean-600 hover:text-ocean-700"
                              title="Edit class session"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteSession(session.id)}
                              className="inline-flex items-center justify-center p-2 text-red-600 hover:text-red-700"
                              title="Delete class session"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">View Only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!classSessions.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No class sessions scheduled yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <h2 className="text-xl font-display font-bold text-gray-900">Class Bookings</h2>
            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="all">All Statuses</option>
              {CLASS_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status[0].toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Guest</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Party</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                    {canEditBookings || canDeleteBookings ? 'Actions' : 'View'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.map((booking) => {
                  const session = booking.class_session_id ? classSessionMap[booking.class_session_id] : null;
                  const fallbackKey = `${booking.event_id || ''}::${booking.class_date || ''}::${booking.class_time || ''}`;
                  const fallbackSession = session || classSessionByScheduleKey[fallbackKey];
                  const classEvent = classEventMap[booking.event_id] || (fallbackSession ? classEventMap[fallbackSession.event_id] : null);

                  return (
                    <tr key={booking.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {booking.class_title || classEvent?.title || 'Class Session'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.class_date || fallbackSession?.class_date || classEvent?.date || '-'}{' '}
                          {formatClock(booking.class_time || fallbackSession?.class_time || classEvent?.time || '')}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{booking.customer_name}</div>
                        <div className="text-sm text-gray-500">{booking.customer_email}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-900">{booking.guest_count}</td>
                      <td className="px-4 py-3">
                        <span className="capitalize text-gray-700">{booking.status || 'pending'}</span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {canEditBookings && (
                          <button
                            type="button"
                            onClick={() => setEditingBooking(booking)}
                            className="inline-flex items-center justify-center p-2 text-ocean-600 hover:text-ocean-700"
                            title="Edit booking"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        {canDeleteBookings && (
                          <button
                            type="button"
                            onClick={() => void handleBookingDelete(booking.id)}
                            className="inline-flex items-center justify-center p-2 text-red-600 hover:text-red-700"
                            title="Delete booking"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        {!canEditBookings && !canDeleteBookings && (
                          <span className="text-sm text-gray-400">View Only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!filteredBookings.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No class bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {canManageClassSetup && isClassFormOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-xl font-display font-bold text-gray-900">
                {editingClassEvent ? 'Edit Class Template' : 'Add Class Template'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsClassFormOpen(false);
                  setEditingClassEvent(null);
                }}
                className="p-2 text-gray-500 hover:text-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(event) => void handleClassSubmit(event)} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    name="title"
                    defaultValue={editingClassEvent?.title || ''}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    name="price"
                    defaultValue={editingClassEvent?.price || ''}
                    placeholder="$85"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Date</label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={editingClassEvent?.date || ''}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Time</label>
                  <input
                    type="time"
                    name="time"
                    defaultValue={toTimeInputValue(editingClassEvent?.time || '')}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Capacity</label>
                  <input
                    type="number"
                    min={1}
                    name="booking_capacity"
                    defaultValue={editingClassEvent?.booking_capacity ?? 16}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Guests</label>
                  <input
                    type="number"
                    min={1}
                    name="booking_minimum"
                    defaultValue={editingClassEvent?.booking_minimum ?? 1}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    min={0}
                    name="display_order"
                    defaultValue={editingClassEvent?.display_order ?? 0}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    name="image_url"
                    defaultValue={editingClassEvent?.image_url || ''}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={4}
                    defaultValue={editingClassEvent?.description || ''}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={editingClassEvent?.active ?? true}
                      className="rounded border-gray-300"
                    />
                    Active
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsClassFormOpen(false);
                    setEditingClassEvent(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-ocean-600 text-white hover:bg-ocean-700 disabled:opacity-60"
                >
                  {editingClassEvent ? 'Save Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {canManageClassSetup && isSessionFormOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-xl font-display font-bold text-gray-900">
                {editingSession ? 'Edit Class Session' : 'Add Class Session'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsSessionFormOpen(false);
                  setEditingSession(null);
                  resetSessionDraft();
                }}
                className="p-2 text-gray-500 hover:text-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(event) => void handleSessionSubmit(event)} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Template</label>
                  <select
                    value={sessionDraft.event_id}
                    onChange={(event) => setSessionDraft((current) => ({ ...current, event_id: event.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select class</option>
                    {classEvents.map((classEvent) => (
                      <option key={classEvent.id} value={classEvent.id}>
                        {classEvent.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={sessionDraft.class_date}
                    onChange={(event) => setSessionDraft((current) => ({ ...current, class_date: event.target.value }))}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={sessionDraft.class_time}
                    onChange={(event) => setSessionDraft((current) => ({ ...current, class_time: event.target.value }))}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity Override (optional)</label>
                  <input
                    type="number"
                    min={1}
                    value={sessionDraft.capacity_override}
                    onChange={(event) =>
                      setSessionDraft((current) => ({ ...current, capacity_override: event.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Override (optional)</label>
                  <input
                    type="number"
                    min={1}
                    value={sessionDraft.minimum_override}
                    onChange={(event) =>
                      setSessionDraft((current) => ({ ...current, minimum_override: event.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={sessionDraft.active}
                      onChange={(event) =>
                        setSessionDraft((current) => ({ ...current, active: event.target.checked }))
                      }
                      className="rounded border-gray-300"
                    />
                    Active
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsSessionFormOpen(false);
                    setEditingSession(null);
                    resetSessionDraft();
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-ocean-600 text-white hover:bg-ocean-700 disabled:opacity-60"
                >
                  {editingSession ? 'Save Session' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {canManageClassSetup && isRecurringFormOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-xl font-display font-bold text-gray-900">Generate Recurring Sessions</h3>
              <button
                type="button"
                onClick={() => {
                  setIsRecurringFormOpen(false);
                  resetRecurringDraft();
                }}
                className="p-2 text-gray-500 hover:text-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(event) => void handleRecurringSubmit(event)} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Template</label>
                  <select
                    value={recurringDraft.event_id}
                    onChange={(event) => setRecurringDraft((current) => ({ ...current, event_id: event.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select class</option>
                    {classEvents.map((classEvent) => (
                      <option key={classEvent.id} value={classEvent.id}>
                        {classEvent.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={recurringDraft.start_date}
                    onChange={(event) => setRecurringDraft((current) => ({ ...current, start_date: event.target.value }))}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={recurringDraft.start_time}
                    onChange={(event) => setRecurringDraft((current) => ({ ...current, start_time: event.target.value }))}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Repeat</label>
                  <select
                    value={recurringDraft.recurrence}
                    onChange={(event) =>
                      setRecurringDraft((current) => ({
                        ...current,
                        recurrence: event.target.value as 'weekly' | 'monthly',
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">How Many Sessions</label>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    value={recurringDraft.occurrences}
                    onChange={(event) =>
                      setRecurringDraft((current) => ({
                        ...current,
                        occurrences: Number(event.target.value || 1),
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity Override (optional)</label>
                  <input
                    type="number"
                    min={1}
                    value={recurringDraft.capacity_override}
                    onChange={(event) =>
                      setRecurringDraft((current) => ({ ...current, capacity_override: event.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Override (optional)</label>
                  <input
                    type="number"
                    min={1}
                    value={recurringDraft.minimum_override}
                    onChange={(event) =>
                      setRecurringDraft((current) => ({ ...current, minimum_override: event.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={recurringDraft.active}
                      onChange={(event) =>
                        setRecurringDraft((current) => ({ ...current, active: event.target.checked }))
                      }
                      className="rounded border-gray-300"
                    />
                    Active
                  </label>
                </div>
                <div className="md:col-span-2 text-sm text-gray-500">
                  Tip: run this again with a different day/time to add multiple weekly or monthly class slots.
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsRecurringFormOpen(false);
                    resetRecurringDraft();
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-ocean-600 text-white hover:bg-ocean-700 disabled:opacity-60"
                >
                  Generate Sessions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingBooking && canEditBookings && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-xl font-display font-bold text-gray-900">Edit Class Booking</h3>
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                className="p-2 text-gray-500 hover:text-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(event) => void handleBookingUpdate(event)} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    name="customer_name"
                    defaultValue={editingBooking.customer_name}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="customer_email"
                    defaultValue={editingBooking.customer_email}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    name="customer_phone"
                    defaultValue={editingBooking.customer_phone}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    name="guest_count"
                    defaultValue={editingBooking.guest_count}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    defaultValue={editingBooking.status || 'pending'}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {CLASS_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status[0].toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                <textarea
                  rows={3}
                  name="special_requests"
                  defaultValue={editingBooking.special_requests || ''}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-ocean-600 text-white hover:bg-ocean-700 disabled:opacity-60"
                >
                  Save Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BOHClasses;
