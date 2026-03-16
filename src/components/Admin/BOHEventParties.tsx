import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Save, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface EventBookingRecord {
  id: string;
  source_booking_id?: string;
  booking_source?: 'event' | 'class';
  event_type: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  company_name?: string;
  guest_count: number;
  event_date: string;
  event_time: string;
  duration_hours?: number;
  budget_range?: string;
  setup_requirements?: string;
  special_requests?: string;
  catering_needed?: boolean;
  bar_service_needed?: boolean;
  av_equipment_needed?: boolean;
  status?: string;
}

interface ClassBookingRecord {
  id: string;
  class_title?: string;
  class_date?: string;
  class_time?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  guest_count: number;
  special_requests?: string;
  status?: string;
}

interface TimeSlotRecord {
  id: string;
  start_time: string;
  end_time: string;
  day_of_week: number;
  capacity: number;
  is_event_slot: boolean;
  active: boolean;
}

const STATUS_OPTIONS = ['pending', 'confirmed', 'contracted', 'completed', 'cancelled'];
const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const formatClock = (value: string) => {
  if (!value) return '';
  const [hours, minutes] = value.split(':');
  const date = new Date();
  date.setHours(Number(hours || 0), Number(minutes || 0), 0, 0);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

interface BOHEventPartiesProps {
  canManageCapacity?: boolean;
  canEditBookings?: boolean;
  canDeleteBookings?: boolean;
}

const BOHEventParties: React.FC<BOHEventPartiesProps> = ({
  canManageCapacity = true,
  canEditBookings = true,
  canDeleteBookings = true,
}) => {
  const [bookings, setBookings] = useState<EventBookingRecord[]>([]);
  const [slots, setSlots] = useState<TimeSlotRecord[]>([]);
  const [slotDrafts, setSlotDrafts] = useState<Record<string, string>>({});
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingBooking, setEditingBooking] = useState<EventBookingRecord | null>(null);

  const fetchBookings = async () => {
    const [eventBookingsRes, classBookingsRes] = await Promise.all([
      supabase.from('event_bookings').select('*').order('event_date').order('event_time'),
      supabase.from('class_bookings').select('*').order('class_date').order('class_time'),
    ]);

    if (eventBookingsRes.error) {
      throw new Error(eventBookingsRes.error.message || 'Failed to load event/party bookings');
    }
    if (classBookingsRes.error) {
      throw new Error(classBookingsRes.error.message || 'Failed to load class bookings');
    }

    const eventRows = ((eventBookingsRes.data as EventBookingRecord[]) || []).map((booking) => ({
      ...booking,
      booking_source: 'event' as const,
      source_booking_id: booking.id,
    }));

    const classRows = ((classBookingsRes.data as ClassBookingRecord[]) || []).map((booking) => ({
      id: `class_${booking.id}`,
      source_booking_id: booking.id,
      booking_source: 'class' as const,
      event_type: booking.class_title || 'Class Reservation',
      customer_name: booking.customer_name,
      customer_email: booking.customer_email,
      customer_phone: booking.customer_phone,
      guest_count: Number(booking.guest_count || 0),
      event_date: booking.class_date || '',
      event_time: booking.class_time || '00:00:00',
      duration_hours: 2,
      budget_range: '',
      setup_requirements: 'Class reservation',
      special_requests: booking.special_requests || '',
      status: booking.status || 'pending',
      catering_needed: false,
      bar_service_needed: false,
      av_equipment_needed: false,
    }));

    const merged = [...eventRows, ...classRows].sort((a, b) => {
      const left = `${a.event_date || ''} ${a.event_time || ''}`;
      const right = `${b.event_date || ''} ${b.event_time || ''}`;
      return left.localeCompare(right);
    });

    setBookings(merged);
  };

  const fetchSlots = async () => {
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .eq('is_event_slot', true)
      .order('day_of_week')
      .order('start_time');

    if (error) {
      throw new Error(error.message || 'Failed to load event slots');
    }

    const normalizedSlots = (data as TimeSlotRecord[]) || [];
    setSlots(normalizedSlots);
    setSlotDrafts(
      normalizedSlots.reduce((accumulator, slot) => {
        accumulator[slot.id] = String(slot.capacity ?? 0);
        return accumulator;
      }, {} as Record<string, string>),
    );
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchBookings(), fetchSlots()]);
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

  const summary = useMemo(() => {
    const pending = bookings.filter((booking) => (booking.status || 'pending') === 'pending').length;
    const confirmed = bookings.filter((booking) => (booking.status || 'pending') === 'confirmed').length;
    const guestVolume = bookings.reduce((total, booking) => total + Number(booking.guest_count || 0), 0);
    return {
      total: bookings.length,
      pending,
      confirmed,
      guestVolume,
    };
  }, [bookings]);

  const filteredBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        const matchesDate = filterDate ? booking.event_date === filterDate : true;
        const normalizedStatus = (booking.status || 'pending').toLowerCase();
        const matchesStatus = filterStatus === 'all' ? true : normalizedStatus === filterStatus;
        return matchesDate && matchesStatus;
      }),
    [bookings, filterDate, filterStatus],
  );

  const daySlots = useMemo(
    () =>
      slots.filter((slot) => slot.day_of_week === selectedDay).sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [slots, selectedDay],
  );

  const handleSlotCapacitySave = async (slot: TimeSlotRecord) => {
    if (!canManageCapacity) return;

    const nextCapacity = Number(slotDrafts[slot.id] ?? slot.capacity);
    if (Number.isNaN(nextCapacity) || nextCapacity < 1) {
      alert('Capacity must be 1 or greater.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('time_slots')
        .update({ capacity: nextCapacity })
        .eq('id', slot.id);
      if (error) throw error;
      await fetchSlots();
    } catch (error) {
      alert(`Failed to update event slot capacity: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBooking = async (booking: EventBookingRecord) => {
    if (!canDeleteBookings) return;
    if (booking.booking_source === 'class') {
      alert('Class reservations are managed in BOH Classes.');
      return;
    }
    if (!confirm('Delete this private event booking?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('event_bookings')
        .delete()
        .eq('id', booking.source_booking_id || booking.id);
      if (error) throw error;
      await fetchBookings();
    } catch (error) {
      alert(`Failed to delete booking: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleBookingUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    if (!canEditBookings) return;
    event.preventDefault();
    if (!editingBooking) return;
    if (editingBooking.booking_source === 'class') {
      alert('Class reservations are managed in BOH Classes.');
      setEditingBooking(null);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = {
      event_type: String(formData.get('event_type') || '').trim(),
      customer_name: String(formData.get('customer_name') || '').trim(),
      customer_email: String(formData.get('customer_email') || '').trim(),
      customer_phone: String(formData.get('customer_phone') || '').trim(),
      company_name: String(formData.get('company_name') || '').trim(),
      guest_count: Number(formData.get('guest_count') || 1),
      event_date: String(formData.get('event_date') || '').trim(),
      event_time: String(formData.get('event_time') || '').trim(),
      duration_hours: Number(formData.get('duration_hours') || 2),
      budget_range: String(formData.get('budget_range') || '').trim(),
      setup_requirements: String(formData.get('setup_requirements') || '').trim(),
      special_requests: String(formData.get('special_requests') || '').trim(),
      status: String(formData.get('status') || 'pending').trim().toLowerCase(),
      catering_needed: Boolean(formData.get('catering_needed')),
      bar_service_needed: Boolean(formData.get('bar_service_needed')),
      av_equipment_needed: Boolean(formData.get('av_equipment_needed')),
    };

    if (!payload.customer_name || !payload.customer_email || !payload.event_date || !payload.event_time) {
      alert('Name, email, date, and time are required.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('event_bookings')
        .update(payload)
        .eq('id', editingBooking.source_booking_id || editingBooking.id);

      if (error) throw error;
      await fetchBookings();
      setEditingBooking(null);
    } catch (error) {
      alert(`Failed to update booking: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Event / Parties Calendar</h1>
          <p className="text-gray-600 font-garamond">
            Manage private event bookings{canManageCapacity ? ', with configurable event-slot capacities.' : '.'}
          </p>
          {!canManageCapacity && (
            <p className="text-sm text-gray-500 font-garamond mt-1">
              Event slot setup is view-only in this portal.
            </p>
          )}
        </div>

        <div className="grid sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 uppercase tracking-wide">Total Requests</div>
            <div className="text-2xl font-display font-bold text-gray-900">{summary.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 uppercase tracking-wide">Pending</div>
            <div className="text-2xl font-display font-bold text-amber-600">{summary.pending}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 uppercase tracking-wide">Confirmed</div>
            <div className="text-2xl font-display font-bold text-green-600">{summary.confirmed}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 uppercase tracking-wide">Total Guests</div>
            <div className="text-2xl font-display font-bold text-gray-900">{summary.guestVolume}</div>
          </div>
        </div>

        <section className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <h2 className="text-xl font-display font-bold text-gray-900">Event Slot Capacities</h2>
            <select
              value={selectedDay}
              onChange={(event) => setSelectedDay(Number(event.target.value))}
              className="px-3 py-2 border rounded-lg"
            >
              {DAY_LABELS.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {daySlots.map((slot) => (
              <div
                key={slot.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-gray-100 rounded-lg p-3"
              >
                <div className="font-garamond text-gray-800">
                  {formatClock(slot.start_time)} - {formatClock(slot.end_time)}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={slotDrafts[slot.id] ?? slot.capacity}
                    onChange={(event) =>
                      setSlotDrafts((previous) => ({
                        ...previous,
                        [slot.id]: event.target.value,
                      }))
                    }
                    disabled={!canManageCapacity}
                    className="w-24 px-3 py-2 border rounded-lg disabled:bg-gray-100 disabled:text-gray-500"
                  />
                  {canManageCapacity && (
                    <button
                      type="button"
                      onClick={() => void handleSlotCapacitySave(slot)}
                      disabled={saving}
                      className="px-3 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-display font-bold text-gray-900">Bookings</h2>
            <div className="flex flex-wrap gap-2">
              <input
                type="date"
                value={filterDate}
                onChange={(event) => setFilterDate(event.target.value)}
                className="px-3 py-2 border rounded-lg"
              />
              <select
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">All Statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status[0].toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date / Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Event</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Host</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Guests</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{booking.event_date}</div>
                      <div className="text-sm text-gray-500">{formatClock(booking.event_time)}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-900">{booking.event_type || 'Private Event'}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{booking.customer_name}</div>
                      <div className="text-sm text-gray-500">{booking.customer_email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-900">{booking.guest_count}</td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-gray-700">{booking.status || 'pending'}</span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                          {canEditBookings && booking.booking_source !== 'class' && (
                            <button
                              type="button"
                              onClick={() => setEditingBooking(booking)}
                          className="inline-flex items-center justify-center p-2 text-ocean-600 hover:text-ocean-700"
                          title="Edit booking"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                          {canDeleteBookings && booking.booking_source !== 'class' && (
                            <button
                              type="button"
                              onClick={() => void handleDeleteBooking(booking)}
                              className="inline-flex items-center justify-center p-2 text-red-600 hover:text-red-700"
                              title="Delete booking"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          {booking.booking_source === 'class' && (
                            <span className="text-xs text-ocean-700">Manage in Classes</span>
                          )}
                          {!canEditBookings && !canDeleteBookings && booking.booking_source !== 'class' && (
                            <span className="text-sm text-gray-400">View Only</span>
                          )}
                    </td>
                  </tr>
                ))}
                {!filteredBookings.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No event, party, or class bookings found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {editingBooking && canEditBookings && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-xl font-display font-bold text-gray-900">Edit Event/Party Booking</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <input
                    name="event_type"
                    defaultValue={editingBooking.event_type || ''}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    name="company_name"
                    defaultValue={editingBooking.company_name || ''}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    name="guest_count"
                    defaultValue={editingBooking.guest_count}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="event_date"
                    defaultValue={editingBooking.event_date}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    name="event_time"
                    defaultValue={editingBooking.event_time}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    name="duration_hours"
                    defaultValue={editingBooking.duration_hours || 2}
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
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status[0].toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range</label>
                <input
                  name="budget_range"
                  defaultValue={editingBooking.budget_range || ''}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="catering_needed"
                    defaultChecked={Boolean(editingBooking.catering_needed)}
                    className="rounded border-gray-300"
                  />
                  Catering Needed
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="bar_service_needed"
                    defaultChecked={Boolean(editingBooking.bar_service_needed)}
                    className="rounded border-gray-300"
                  />
                  Bar Service Needed
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="av_equipment_needed"
                    defaultChecked={Boolean(editingBooking.av_equipment_needed)}
                    className="rounded border-gray-300"
                  />
                  AV Equipment Needed
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Setup Requirements</label>
                <textarea
                  rows={2}
                  name="setup_requirements"
                  defaultValue={editingBooking.setup_requirements || ''}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                <textarea
                  rows={2}
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

export default BOHEventParties;
