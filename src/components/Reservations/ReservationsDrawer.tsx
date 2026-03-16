import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  getSlotAvailability,
  validateClassCapacity,
  validateSlotCapacity,
  type SlotAvailability,
} from '../../lib/bookingCapacity';
import { formatPerPersonPrice, formatPersonMinimum } from '../../lib/formatting';
import type { ReservationIntent, ReservationPanelType } from '../../types/booking';

interface ReservationsDrawerProps {
  intent?: ReservationIntent | null;
}

interface ClassEvent {
  id: string;
  event_id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  price: string | null;
  booking_capacity: number;
  booking_minimum: number;
  enrolled: number;
  remaining: number;
}

const DEFAULT_DINING_FORM = {
  name: '',
  email: '',
  phone: '',
  specialRequests: '',
};

const DEFAULT_EVENT_FORM = {
  name: '',
  email: '',
  phone: '',
  companyName: '',
  eventType: '',
  guestCount: 10,
  duration: 2,
  budgetRange: '',
  cateringNeeded: false,
  barServiceNeeded: false,
  avEquipmentNeeded: false,
  setupRequirements: '',
  specialRequests: '',
};

const DEFAULT_CLASS_FORM = {
  name: '',
  email: '',
  phone: '',
  specialRequests: '',
};

const formatTime = (time: string) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const date = new Date();
  date.setHours(parseInt(hours || '0', 10));
  date.setMinutes(parseInt(minutes || '0', 10));
  date.setSeconds(0);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const ReservationsDrawer: React.FC<ReservationsDrawerProps> = ({ intent }) => {
  const [reservationType, setReservationType] = useState<ReservationPanelType>('dining');
  const [step, setStep] = useState(1);
  const [date, setDate] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [timeSlots, setTimeSlots] = useState<SlotAvailability[]>([]);
  const [classEvents, setClassEvents] = useState<ClassEvent[]>([]);
  const [selectedClassEventId, setSelectedClassEventId] = useState('');
  const [requestedClassEventId, setRequestedClassEventId] = useState<string | null>(null);
  const [classGuestCount, setClassGuestCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [diningForm, setDiningForm] = useState(DEFAULT_DINING_FORM);
  const [eventForm, setEventForm] = useState(DEFAULT_EVENT_FORM);
  const [classForm, setClassForm] = useState(DEFAULT_CLASS_FORM);

  const selectedClassEvent = useMemo(
    () => classEvents.find((classEvent) => classEvent.id === selectedClassEventId) || null,
    [classEvents, selectedClassEventId],
  );
  const selectedClassMinimum = Math.max(1, Number(selectedClassEvent?.booking_minimum || 1));

  const requestedGuestsForTimeSlot = reservationType === 'events' ? eventForm.guestCount : partySize;

  useEffect(() => {
    void fetchClassEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!intent) return;
    setReservationType(intent.type);
    setStep(1);
    setError(null);
    setSelectedTimeSlot('');
    if (intent.type === 'classes' && intent.eventId) {
      const matchingClassSession = classEvents.find((classEvent) => classEvent.event_id === intent.eventId);
      if (matchingClassSession) {
        setSelectedClassEventId(matchingClassSession.id);
        setRequestedClassEventId(null);
      } else {
        setRequestedClassEventId(intent.eventId);
      }
    }
  }, [intent, classEvents]);

  useEffect(() => {
    if (!date || reservationType === 'classes') {
      setTimeSlots([]);
      return;
    }
    void fetchAvailableTimeSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, reservationType]);

  useEffect(() => {
    if (classGuestCount < selectedClassMinimum) {
      setClassGuestCount(selectedClassMinimum);
    }
  }, [classGuestCount, selectedClassMinimum]);

  const fetchClassEvents = async () => {
    try {
      const [{ data: classes, error: classError }, { data: sessions, error: sessionsError }, { data: bookings, error: bookingsError }] = await Promise.all([
        supabase
          .from('events')
          .select('*')
          .eq('booking_type', 'class')
          .eq('active', true)
          .order('date')
          .order('time'),
        supabase
          .from('class_sessions')
          .select('*')
          .eq('active', true)
          .order('class_date')
          .order('class_time'),
        supabase
          .from('class_bookings')
          .select('*'),
      ]);

      if (classError) throw classError;
      if (sessionsError) throw sessionsError;
      if (bookingsError) throw bookingsError;

      const classEventMap = (Array.isArray(classes) ? classes : []).reduce((accumulator, classEvent) => {
        const id = String((classEvent as { id?: unknown }).id || '');
        if (!id) return accumulator;
        accumulator[id] = classEvent;
        return accumulator;
      }, {} as Record<string, unknown>);

      const sessionByScheduleKey = (Array.isArray(sessions) ? sessions : []).reduce((accumulator, session) => {
        const key = `${String((session as { event_id?: unknown }).event_id || '')}::${String((session as { class_date?: unknown }).class_date || '')}::${String((session as { class_time?: unknown }).class_time || '')}`;
        accumulator[key] = String((session as { id?: unknown }).id || '');
        return accumulator;
      }, {} as Record<string, string>);

      const enrollmentMap = (Array.isArray(bookings) ? bookings : []).reduce((accumulator, booking) => {
        const status = String((booking as { status?: unknown }).status || 'pending').toLowerCase();
        if (status === 'cancelled' || status === 'declined') {
          return accumulator;
        }
        const eventId = String((booking as { event_id?: unknown }).event_id || '').trim();
        const sessionId = String((booking as { class_session_id?: unknown }).class_session_id || '').trim();
        const classDate = String((booking as { class_date?: unknown }).class_date || '').trim();
        const classTime = String((booking as { class_time?: unknown }).class_time || '').trim();
        const guests = Number((booking as { guest_count?: unknown }).guest_count || 0);
        if (sessionId) {
          accumulator[sessionId] = (accumulator[sessionId] || 0) + guests;
          return accumulator;
        }
        if (eventId && classDate && classTime) {
          const fallbackSessionKey = `${eventId}::${classDate}::${classTime}`;
          const fallbackSessionId = sessionByScheduleKey[fallbackSessionKey];
          if (fallbackSessionId) {
            accumulator[fallbackSessionId] = (accumulator[fallbackSessionId] || 0) + guests;
          }
        }
        return accumulator;
      }, {} as Record<string, number>);

      const normalizedClasses = (Array.isArray(sessions) ? sessions : [])
        .map((session) => {
          const sessionId = String((session as { id?: unknown }).id || '');
          const eventId = String((session as { event_id?: unknown }).event_id || '');
          const classEvent = classEventMap[eventId] as Record<string, unknown> | undefined;
          if (!sessionId || !classEvent) return null;

          const capacity = Number(
            (session as { capacity_override?: unknown }).capacity_override ??
              (classEvent as { booking_capacity?: unknown }).booking_capacity ??
              0,
          );
          const minimum = Math.max(
            1,
            Number(
              (session as { minimum_override?: unknown }).minimum_override ??
                (classEvent as { booking_minimum?: unknown }).booking_minimum ??
                1,
            ),
          );
          const enrolled = enrollmentMap[sessionId] || 0;

          return {
            id: sessionId,
            event_id: eventId,
            title: String((classEvent as { title?: unknown }).title || ''),
            description: String((classEvent as { description?: unknown }).description || ''),
            date: String((session as { class_date?: unknown }).class_date || ''),
            time: String((session as { class_time?: unknown }).class_time || ''),
            price: ((classEvent as { price?: unknown }).price as string | null) || null,
            booking_capacity: capacity,
            booking_minimum: minimum,
            enrolled,
            remaining: Math.max(0, capacity - enrolled),
          } satisfies ClassEvent;
        })
        .filter(Boolean) as ClassEvent[];

      normalizedClasses.sort((a, b) => {
        const dateComparison = a.date.localeCompare(b.date);
        if (dateComparison !== 0) return dateComparison;
        return a.time.localeCompare(b.time);
      });

      setClassEvents(normalizedClasses);

      if (requestedClassEventId) {
        const matchingSession = normalizedClasses.find((classEvent) => classEvent.event_id === requestedClassEventId);
        if (matchingSession) {
          setSelectedClassEventId(matchingSession.id);
          setRequestedClassEventId(null);
        }
      }

      if (selectedClassEventId && !normalizedClasses.some((classEvent) => classEvent.id === selectedClassEventId)) {
        setSelectedClassEventId('');
      }
    } catch (fetchError) {
      console.error('Error loading classes:', fetchError);
      setError('Error loading classes. Please try again.');
    }
  };

  const fetchAvailableTimeSlots = async () => {
    try {
      setLoading(true);
      setError(null);

      const bookingType = reservationType === 'events' ? 'events' : 'dining';
      const availability = await getSlotAvailability(date, bookingType);
      setTimeSlots(availability);

      if (!availability.some((slot) => slot.startTime === selectedTimeSlot)) {
        setSelectedTimeSlot('');
      }
    } catch (fetchError) {
      console.error('Error fetching time slots:', fetchError);
      setError('Error loading available times. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetReservationStepData = () => {
    setStep(1);
    setDate('');
    setSelectedTimeSlot('');
    setPartySize(2);
    setEventForm(DEFAULT_EVENT_FORM);
    setDiningForm(DEFAULT_DINING_FORM);
  };

  const handleDiningSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const capacityResult = await validateSlotCapacity(date, selectedTimeSlot, partySize, 'dining');
      if (!capacityResult.allowed) {
        setError(capacityResult.message);
        return;
      }

      const { error: insertError } = await supabase
        .from('reservations')
        .insert([
          {
            customer_name: diningForm.name,
            customer_email: diningForm.email,
            customer_phone: diningForm.phone,
            party_size: partySize,
            reservation_date: date,
            reservation_time: selectedTimeSlot,
            special_requests: diningForm.specialRequests,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      alert('Reservation submitted successfully. Our host team will confirm shortly.');
      resetReservationStepData();
      await fetchAvailableTimeSlots();
    } catch (submitError) {
      console.error('Error submitting reservation:', submitError);
      setError((submitError as Error).message || 'Error submitting reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEventSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const capacityResult = await validateSlotCapacity(date, selectedTimeSlot, eventForm.guestCount, 'events');
      if (!capacityResult.allowed) {
        setError(capacityResult.message);
        return;
      }

      const { error: insertError } = await supabase
        .from('event_bookings')
        .insert([
          {
            event_type: eventForm.eventType || 'Private Event',
            customer_name: eventForm.name,
            customer_email: eventForm.email,
            customer_phone: eventForm.phone,
            company_name: eventForm.companyName,
            guest_count: eventForm.guestCount,
            event_date: date,
            event_time: selectedTimeSlot,
            duration_hours: eventForm.duration,
            budget_range: eventForm.budgetRange,
            catering_needed: eventForm.cateringNeeded,
            bar_service_needed: eventForm.barServiceNeeded,
            av_equipment_needed: eventForm.avEquipmentNeeded,
            setup_requirements: eventForm.setupRequirements,
            special_requests: eventForm.specialRequests,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      alert('Private event request submitted. Our team will contact you shortly.');
      resetReservationStepData();
      await fetchAvailableTimeSlots();
    } catch (submitError) {
      console.error('Error submitting private event booking:', submitError);
      setError((submitError as Error).message || 'Error submitting event booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClassSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!selectedClassEventId) {
        setError('Please select a class.');
        return;
      }

      if (classGuestCount < selectedClassMinimum) {
        setError(`This class requires at least ${selectedClassMinimum} guests per booking.`);
        return;
      }

      if (!selectedClassEvent) {
        setError('Selected class session could not be found.');
        return;
      }

      const capacityResult = await validateClassCapacity(
        selectedClassEvent.event_id,
        selectedClassEvent.id,
        classGuestCount,
      );
      if (!capacityResult.allowed) {
        setError(capacityResult.message);
        return;
      }

      const classEvent = selectedClassEvent;

      const { error: insertError } = await supabase
        .from('class_bookings')
        .insert([
          {
            event_id: classEvent.event_id,
            class_session_id: selectedClassEventId,
            class_title: classEvent.title,
            class_date: classEvent.date,
            class_time: classEvent.time,
            customer_name: classForm.name,
            customer_email: classForm.email,
            customer_phone: classForm.phone,
            guest_count: classGuestCount,
            special_requests: classForm.specialRequests,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      alert('Class signup submitted. We will confirm your spot shortly.');
      setClassForm(DEFAULT_CLASS_FORM);
      setClassGuestCount(1);
      await fetchClassEvents();
    } catch (submitError) {
      console.error('Error submitting class booking:', submitError);
      setError((submitError as Error).message || 'Error submitting class signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchReservationType = (nextType: ReservationPanelType) => {
    setReservationType(nextType);
    setStep(1);
    setSelectedTimeSlot('');
    setError(null);
  };

  const renderTimeSlotButtons = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {timeSlots.map((slot) => {
        const enoughCapacity = slot.remaining >= requestedGuestsForTimeSlot;
        return (
          <button
            key={slot.id}
            type="button"
            onClick={() => setSelectedTimeSlot(slot.startTime)}
            disabled={!enoughCapacity}
            className={`px-3 py-2 rounded-lg border text-left transition-colors ${
              selectedTimeSlot === slot.startTime
                ? 'bg-ocean-600 text-white border-ocean-600'
                : enoughCapacity
                  ? 'border-gray-300 hover:border-ocean-600'
                  : 'border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <div>{formatTime(slot.startTime)}</div>
            <div className={`text-xs ${selectedTimeSlot === slot.startTime ? 'text-ocean-100' : 'text-gray-500'}`}>
              {slot.remaining} spots left
            </div>
          </button>
        );
      })}
      {!timeSlots.length && !loading && (
        <div className="text-sm text-gray-500 col-span-full">No available times for the selected date.</div>
      )}
    </div>
  );

  const renderDiningReservationForm = () => (
    <div className="space-y-8">
      {step === 1 ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Party Size</label>
            <select
              value={partySize}
              onChange={(event) => setPartySize(parseInt(event.target.value, 10))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
                <option key={size} value={size}>
                  {size} {size === 1 ? 'Guest' : 'Guests'}
                </option>
              ))}
            </select>
          </div>

          {date && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              {renderTimeSlotButtons()}
            </div>
          )}

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!date || !selectedTimeSlot}
              className="px-6 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleDiningSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={diningForm.name}
              onChange={(event) => setDiningForm((previous) => ({ ...previous, name: event.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={diningForm.email}
              onChange={(event) => setDiningForm((previous) => ({ ...previous, email: event.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={diningForm.phone}
              onChange={(event) => setDiningForm((previous) => ({ ...previous, phone: event.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
            <textarea
              value={diningForm.specialRequests}
              onChange={(event) =>
                setDiningForm((previous) => ({ ...previous, specialRequests: event.target.value }))
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-2 text-gray-600 hover:text-gray-900"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Reservation'}
            </button>
          </div>
        </form>
      )}
    </div>
  );

  const renderEventBookingForm = () => (
    <div className="space-y-8">
      {step === 1 ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select
              value={eventForm.eventType}
              onChange={(event) => setEventForm((previous) => ({ ...previous, eventType: event.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
              required
            >
              <option value="">Select event type</option>
              <option value="Corporate">Corporate Event</option>
              <option value="Birthday">Birthday Celebration</option>
              <option value="Anniversary">Anniversary</option>
              <option value="Wedding">Wedding Reception</option>
              <option value="Holiday">Holiday Party</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
            <input
              type="number"
              min={10}
              max={200}
              value={eventForm.guestCount}
              onChange={(event) =>
                setEventForm((previous) => ({ ...previous, guestCount: parseInt(event.target.value || '10', 10) }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
              required
            />
          </div>

          {date && eventForm.eventType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              {renderTimeSlotButtons()}
            </div>
          )}

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!date || !eventForm.eventType || !selectedTimeSlot}
              className="px-6 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleEventSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
            <input
              type="text"
              value={eventForm.name}
              onChange={(event) => setEventForm((previous) => ({ ...previous, name: event.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={eventForm.email}
              onChange={(event) => setEventForm((previous) => ({ ...previous, email: event.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={eventForm.phone}
              onChange={(event) => setEventForm((previous) => ({ ...previous, phone: event.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name (Optional)</label>
            <input
              type="text"
              value={eventForm.companyName}
              onChange={(event) => setEventForm((previous) => ({ ...previous, companyName: event.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label>
            <input
              type="number"
              min={2}
              max={10}
              value={eventForm.duration}
              onChange={(event) =>
                setEventForm((previous) => ({ ...previous, duration: parseInt(event.target.value || '2', 10) }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range</label>
            <select
              value={eventForm.budgetRange}
              onChange={(event) => setEventForm((previous) => ({ ...previous, budgetRange: event.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
              required
            >
              <option value="">Select budget range</option>
              <option value="$1,000 - $2,500">$1,000 - $2,500</option>
              <option value="$2,500 - $5,000">$2,500 - $5,000</option>
              <option value="$5,000 - $10,000">$5,000 - $10,000</option>
              <option value="$10,000+">$10,000+</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={eventForm.cateringNeeded}
                onChange={(event) =>
                  setEventForm((previous) => ({ ...previous, cateringNeeded: event.target.checked }))
                }
                className="rounded border-gray-300 text-ocean-600 focus:ring-ocean-500"
              />
              Catering Service Needed
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={eventForm.barServiceNeeded}
                onChange={(event) =>
                  setEventForm((previous) => ({ ...previous, barServiceNeeded: event.target.checked }))
                }
                className="rounded border-gray-300 text-ocean-600 focus:ring-ocean-500"
              />
              Bar Service Needed
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={eventForm.avEquipmentNeeded}
                onChange={(event) =>
                  setEventForm((previous) => ({ ...previous, avEquipmentNeeded: event.target.checked }))
                }
                className="rounded border-gray-300 text-ocean-600 focus:ring-ocean-500"
              />
              AV Equipment Needed
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Setup Requirements</label>
            <textarea
              value={eventForm.setupRequirements}
              onChange={(event) =>
                setEventForm((previous) => ({ ...previous, setupRequirements: event.target.value }))
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
            <textarea
              value={eventForm.specialRequests}
              onChange={(event) =>
                setEventForm((previous) => ({ ...previous, specialRequests: event.target.value }))
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-2 text-gray-600 hover:text-gray-900"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Event Request'}
            </button>
          </div>
        </form>
      )}
    </div>
  );

  const renderClassBookingForm = () => (
    <form onSubmit={handleClassSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Choose Class</label>
        <select
          value={selectedClassEventId}
          onChange={(event) => setSelectedClassEventId(event.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
          required
        >
          <option value="">Select a class</option>
          {classEvents.map((classEvent) => (
            <option key={classEvent.id} value={classEvent.id}>
              {classEvent.title} | {classEvent.date} {formatTime(classEvent.time)} | {classEvent.remaining} spots left
              {classEvent.booking_minimum > 1 ? ` | ${classEvent.booking_minimum} person minimum` : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedClassEvent && (
        <div className="border border-ocean-100 bg-ocean-50/50 rounded-lg p-4 space-y-2">
          <div className="font-display font-bold text-gray-900">{selectedClassEvent.title}</div>
          <div className="text-sm text-gray-700">
            {selectedClassEvent.date} at {formatTime(selectedClassEvent.time)}
          </div>
          {selectedClassEvent.price && (
            <div className="text-sm text-gray-700">{formatPerPersonPrice(selectedClassEvent.price)}</div>
          )}
          <div className="text-sm text-gray-700">
            {selectedClassEvent.enrolled}/{selectedClassEvent.booking_capacity} enrolled
          </div>
          {selectedClassEvent.booking_minimum > 1 && (
            <div className="text-sm text-gray-700">{formatPersonMinimum(selectedClassEvent.booking_minimum)}</div>
          )}
          <p className="text-sm text-gray-600">{selectedClassEvent.description}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
        <input
          type="number"
          min={selectedClassMinimum}
          max={20}
          value={classGuestCount}
          onChange={(event) =>
            setClassGuestCount(Math.max(selectedClassMinimum, parseInt(event.target.value || String(selectedClassMinimum), 10)))
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input
          type="text"
          value={classForm.name}
          onChange={(event) => setClassForm((previous) => ({ ...previous, name: event.target.value }))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={classForm.email}
          onChange={(event) => setClassForm((previous) => ({ ...previous, email: event.target.value }))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
        <input
          type="tel"
          value={classForm.phone}
          onChange={(event) => setClassForm((previous) => ({ ...previous, phone: event.target.value }))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
        <textarea
          value={classForm.specialRequests}
          onChange={(event) =>
            setClassForm((previous) => ({ ...previous, specialRequests: event.target.value }))
          }
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
        />
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !selectedClassEventId}
          className="px-6 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Class Signup'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-8">
      <div className="prose prose-lg max-w-none">
        <p className="text-xl text-gray-600 font-garamond leading-relaxed">
          Reserve your experience at The Spoonbill Lounge. Book dining, private events, and classes directly through
          our in-house team.
        </p>

        <div className="grid grid-cols-3 gap-px bg-gray-200 rounded-lg overflow-hidden my-8">
          <button
            onClick={() => switchReservationType('dining')}
            className={`py-4 text-base sm:text-lg font-garamond transition-colors ${
              reservationType === 'dining' ? 'bg-ocean-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Reservations
          </button>
          <button
            onClick={() => switchReservationType('events')}
            className={`py-4 text-base sm:text-lg font-garamond transition-colors ${
              reservationType === 'events' ? 'bg-ocean-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Event / Parties
          </button>
          <button
            onClick={() => switchReservationType('classes')}
            className={`py-4 text-base sm:text-lg font-garamond transition-colors ${
              reservationType === 'classes' ? 'bg-ocean-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Classes
          </button>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-display font-bold text-gray-900 mb-4">
            {reservationType === 'dining'
              ? 'Make a Reservation'
              : reservationType === 'events'
                ? 'Plan a Private Event'
                : 'Book a Class'}
          </h3>

          {reservationType === 'dining' && renderDiningReservationForm()}
          {reservationType === 'events' && renderEventBookingForm()}
          {reservationType === 'classes' && renderClassBookingForm()}
        </div>
      </div>
    </div>
  );
};

export default ReservationsDrawer;
