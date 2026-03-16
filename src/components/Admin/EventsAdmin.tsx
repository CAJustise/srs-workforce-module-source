import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { formatPerPersonPrice, formatUsdPrice } from '../../lib/formatting';

interface Event {
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
  active: boolean;
  display_order: number;
}

const EventsAdmin: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      alert('Error fetching events: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const eventData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      price: formData.get('price') as string || null,
      image_url: formData.get('image_url') as string,
      booking_type: formData.get('booking_type') as 'class' | 'event' | 'reservation' | null,
      booking_url: null,
      booking_capacity: Number(formData.get('booking_capacity') || 0) || null,
      active: formData.get('active') === 'on',
      display_order: parseInt(formData.get('display_order') as string) || 0,
    };

    try {
      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', editingEvent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('events')
          .insert([eventData]);
        if (error) throw error;
      }

      await fetchEvents();
      setIsFormOpen(false);
      setEditingEvent(null);
      form.reset();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event: ' + (error as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error deleting event: ' + (error as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-display font-bold">Events</h1>
          <button
            onClick={() => {
              setEditingEvent(null);
              setIsFormOpen(true);
            }}
            className="bg-ocean-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-ocean-700"
          >
            <Plus className="h-5 w-5" />
            Add Event
          </button>
        </div>

        {isFormOpen && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingEvent?.title}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="text"
                  name="date"
                  required
                  defaultValue={editingEvent?.date}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Every Tuesday, Daily, March 15, 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="text"
                  name="time"
                  required
                  defaultValue={editingEvent?.time}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., 6 PM - 10 PM"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <input
                  type="text"
                  name="price"
                  defaultValue={editingEvent?.price || ''}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., $95 per person (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  name="image_url"
                  required
                  defaultValue={editingEvent?.image_url}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Type
                </label>
                <select
                  name="booking_type"
                  defaultValue={editingEvent?.booking_type || ''}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">No Booking Required</option>
                  <option value="class">Class</option>
                  <option value="event">Event</option>
                  <option value="reservation">Reservation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Capacity
                </label>
                <input
                  type="number"
                  min={0}
                  name="booking_capacity"
                  defaultValue={editingEvent?.booking_capacity ?? 0}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., 24"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  name="display_order"
                  defaultValue={editingEvent?.display_order || 0}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={editingEvent?.active ?? true}
                    className="rounded border-gray-300 text-ocean-600 focus:ring-ocean-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={4}
                  required
                  defaultValue={editingEvent?.description}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingEvent(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700"
              >
                {editingEvent ? 'Update' : 'Create'} Event
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id} className={!event.active ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{event.title}</div>
                    {event.price && (
                      <div className="text-sm text-gray-500">
                        {event.booking_type === 'class'
                          ? formatPerPersonPrice(event.price)
                          : formatUsdPrice(event.price)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{event.date}</div>
                    <div className="text-sm text-gray-500">{event.time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="capitalize">{event.booking_type || 'None'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {event.booking_capacity ?? '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {event.active ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-gray-500">Inactive</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => {
                        setEditingEvent(event);
                        setIsFormOpen(true);
                      }}
                      className="text-ocean-600 hover:text-ocean-700 mr-4"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EventsAdmin;
