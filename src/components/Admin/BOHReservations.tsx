import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, Save, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ReservationRecord {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  special_requests?: string;
  status?: string;
  created_at?: string;
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

const STATUS_OPTIONS = ['pending', 'confirmed', 'seated', 'completed', 'cancelled'];
const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const formatClock = (value: string) => {
  if (!value) return '';
  const [hours, minutes] = value.split(':');
  const date = new Date();
  date.setHours(Number(hours || 0), Number(minutes || 0), 0, 0);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

interface BOHReservationsProps {
  canManageCapacity?: boolean;
  canCreateReservations?: boolean;
  canEditReservations?: boolean;
  canDeleteReservations?: boolean;
}

const BOHReservations: React.FC<BOHReservationsProps> = ({
  canManageCapacity = true,
  canCreateReservations = true,
  canEditReservations = true,
  canDeleteReservations = true,
}) => {
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [slots, setSlots] = useState<TimeSlotRecord[]>([]);
  const [slotDrafts, setSlotDrafts] = useState<Record<string, string>>({});
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreateReservationOpen, setIsCreateReservationOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<ReservationRecord | null>(null);

  const fetchReservations = async () => {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('reservation_date')
      .order('reservation_time');

    if (error) {
      throw new Error(error.message || 'Failed to load reservations');
    }

    setReservations((data as ReservationRecord[]) || []);
  };

  const fetchSlots = async () => {
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .eq('is_event_slot', false)
      .order('day_of_week')
      .order('start_time');

    if (error) {
      throw new Error(error.message || 'Failed to load reservation slots');
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
      await Promise.all([fetchReservations(), fetchSlots()]);
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
    const pending = reservations.filter((reservation) => (reservation.status || 'pending') === 'pending').length;
    const confirmed = reservations.filter((reservation) => (reservation.status || 'pending') === 'confirmed').length;
    return {
      total: reservations.length,
      pending,
      confirmed,
    };
  }, [reservations]);

  const filteredReservations = useMemo(
    () =>
      reservations.filter((reservation) => {
        const matchesDate = filterDate ? reservation.reservation_date === filterDate : true;
        const normalizedStatus = (reservation.status || 'pending').toLowerCase();
        const matchesStatus = filterStatus === 'all' ? true : normalizedStatus === filterStatus;
        return matchesDate && matchesStatus;
      }),
    [reservations, filterDate, filterStatus],
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
      alert(`Failed to update slot capacity: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReservation = async (reservationId: string) => {
    if (!canDeleteReservations) return;
    if (!confirm('Delete this reservation?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', reservationId);

      if (error) throw error;
      await fetchReservations();
    } catch (error) {
      alert(`Failed to delete reservation: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReservationUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    if (!canEditReservations) return;
    event.preventDefault();
    if (!editingReservation) return;

    const formData = new FormData(event.currentTarget);
    const payload = {
      customer_name: String(formData.get('customer_name') || '').trim(),
      customer_email: String(formData.get('customer_email') || '').trim(),
      customer_phone: String(formData.get('customer_phone') || '').trim(),
      party_size: Number(formData.get('party_size') || 1),
      reservation_date: String(formData.get('reservation_date') || '').trim(),
      reservation_time: String(formData.get('reservation_time') || '').trim(),
      special_requests: String(formData.get('special_requests') || '').trim(),
      status: String(formData.get('status') || 'pending').trim().toLowerCase(),
    };

    if (!payload.customer_name || !payload.customer_email || !payload.reservation_date || !payload.reservation_time) {
      alert('Name, email, date, and time are required.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('reservations')
        .update(payload)
        .eq('id', editingReservation.id);
      if (error) throw error;
      await fetchReservations();
      setEditingReservation(null);
    } catch (error) {
      alert(`Failed to update reservation: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReservationCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    if (!canCreateReservations) return;
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const payload = {
      customer_name: String(formData.get('customer_name') || '').trim(),
      customer_email: String(formData.get('customer_email') || '').trim(),
      customer_phone: String(formData.get('customer_phone') || '').trim(),
      party_size: Number(formData.get('party_size') || 1),
      reservation_date: String(formData.get('reservation_date') || '').trim(),
      reservation_time: String(formData.get('reservation_time') || '').trim(),
      special_requests: String(formData.get('special_requests') || '').trim(),
      status: String(formData.get('status') || 'confirmed').trim().toLowerCase(),
    };

    if (!payload.customer_name || !payload.customer_email || !payload.reservation_date || !payload.reservation_time) {
      alert('Name, email, date, and time are required.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('reservations').insert([payload]);
      if (error) throw error;
      await fetchReservations();
      setIsCreateReservationOpen(false);
    } catch (error) {
      alert(`Failed to create reservation: ${(error as Error).message}`);
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">Reservations Calendar</h1>
            <p className="text-gray-600 font-garamond">
              Review incoming reservation requests{canManageCapacity ? ' and control reservation slot capacities.' : '.'}
            </p>
            {!canManageCapacity && (
              <p className="text-sm text-gray-500 font-garamond mt-1">
                Reservation slot setup is view-only in this portal.
              </p>
            )}
          </div>
          {canCreateReservations && (
            <button
              type="button"
              onClick={() => setIsCreateReservationOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700"
            >
              <Plus className="h-4 w-4" />
              Add Reservation
            </button>
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 uppercase tracking-wide">Total</div>
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
        </div>

        <section className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <h2 className="text-xl font-display font-bold text-gray-900">Reservation Slot Capacities</h2>
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Guest</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Party</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                    {canEditReservations || canDeleteReservations ? 'Actions' : 'View'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReservations.map((reservation) => (
                  <tr key={reservation.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{reservation.reservation_date}</div>
                      <div className="text-sm text-gray-500">{formatClock(reservation.reservation_time)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{reservation.customer_name}</div>
                      <div className="text-sm text-gray-500">{reservation.customer_email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-900">{reservation.party_size}</td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-gray-700">{reservation.status || 'pending'}</span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {canEditReservations && (
                        <button
                          type="button"
                          onClick={() => setEditingReservation(reservation)}
                          className="inline-flex items-center justify-center p-2 text-ocean-600 hover:text-ocean-700"
                          title="Edit reservation"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                      {canDeleteReservations && (
                        <button
                          type="button"
                          onClick={() => void handleDeleteReservation(reservation.id)}
                          className="inline-flex items-center justify-center p-2 text-red-600 hover:text-red-700"
                          title="Delete reservation"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      {!canEditReservations && !canDeleteReservations && (
                        <span className="text-sm text-gray-400">View Only</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!filteredReservations.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No reservations found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {isCreateReservationOpen && canCreateReservations && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-xl font-display font-bold text-gray-900">Add Reservation</h3>
              <button
                type="button"
                onClick={() => setIsCreateReservationOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(event) => void handleReservationCreate(event)} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input name="customer_name" required className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" name="customer_email" required className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input name="customer_phone" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Party Size</label>
                  <input type="number" min={1} max={20} name="party_size" defaultValue={2} required className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" name="reservation_date" required className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input type="time" name="reservation_time" required className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select name="status" defaultValue="confirmed" className="w-full px-3 py-2 border rounded-lg">
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status[0].toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                <textarea rows={3} name="special_requests" className="w-full px-3 py-2 border rounded-lg" />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateReservationOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-ocean-600 text-white hover:bg-ocean-700 disabled:opacity-60"
                >
                  Create Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingReservation && canEditReservations && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-xl font-display font-bold text-gray-900">Edit Reservation</h3>
              <button
                type="button"
                onClick={() => setEditingReservation(null)}
                className="p-2 text-gray-500 hover:text-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(event) => void handleReservationUpdate(event)} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    name="customer_name"
                    defaultValue={editingReservation.customer_name}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="customer_email"
                    defaultValue={editingReservation.customer_email}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    name="customer_phone"
                    defaultValue={editingReservation.customer_phone}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Party Size</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    name="party_size"
                    defaultValue={editingReservation.party_size}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="reservation_date"
                    defaultValue={editingReservation.reservation_date}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    name="reservation_time"
                    defaultValue={editingReservation.reservation_time}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    defaultValue={editingReservation.status || 'pending'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                <textarea
                  rows={3}
                  name="special_requests"
                  defaultValue={editingReservation.special_requests || ''}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingReservation(null)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-ocean-600 text-white hover:bg-ocean-700 disabled:opacity-60"
                >
                  Save Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BOHReservations;
