import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, CalendarRange } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatPerPersonPrice, formatPersonMinimum, formatUsdPrice } from '../../lib/formatting';
import type { ReservationPanelType } from '../../types/booking';

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
  booking_minimum?: number;
  active: boolean;
  display_order: number;
}

interface EventsProps {
  onBook?: (intent: { type: ReservationPanelType; eventId?: string }) => void;
}

const EVENT_IMAGE_FALLBACKS: Record<string, string> = {
  'Island Mixology Class': 'https://raw.githubusercontent.com/CAJustise/the-spoonbill/main/public/images/library/misc/mixologyclass.png',
  'Pacific Rim Tasting Night': 'https://raw.githubusercontent.com/CAJustise/the-spoonbill/main/public/images/library/misc/tiki-noir.png',
};

const Events: React.FC<EventsProps> = ({ onBook }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('active', true)
        .order('display_order');

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
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
    <div className="space-y-16">
      <div className="prose prose-lg max-w-none">
        <p className="text-xl text-gray-600 font-garamond mb-12">
          Experience the vibrant atmosphere of The Spoonbill Lounge with our signature events and special occasions.
        </p>

        <div className="grid gap-12">
          {events.map((event) => (
            <div key={event.id} className="bg-white/80 backdrop-blur-sm rounded-lg overflow-hidden shadow-lg">
              <div className="aspect-w-16 aspect-h-9 relative">
                <img
                  src={event.image_url || EVENT_IMAGE_FALLBACKS[event.title] || ''}
                  alt={event.title}
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-display font-bold text-gray-900 mb-4">
                  {event.title}
                </h3>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-5 w-5 mr-2" />
                    <span className="font-garamond">{event.date}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-5 w-5 mr-2" />
                    <span className="font-garamond">{event.time}</span>
                  </div>
                  {event.price && (
                    <div className="flex items-center text-gray-600">
                      <span className="font-garamond font-medium">
                        {event.booking_type === 'class'
                          ? formatPerPersonPrice(event.price)
                          : formatUsdPrice(event.price)}
                      </span>
                    </div>
                  )}
                  {event.booking_type === 'class' && event.booking_minimum && event.booking_minimum > 1 && (
                    <div className="flex items-center text-gray-600">
                      <span className="font-garamond text-sm">{formatPersonMinimum(event.booking_minimum)}</span>
                    </div>
                  )}
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span className="font-garamond">The Spoonbill Lounge</span>
                  </div>
                </div>
                <div className="text-gray-600 font-garamond mb-6 whitespace-pre-line">
                  {event.description}
                </div>
                {event.booking_type && (
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        onBook?.({
                          type:
                            event.booking_type === 'class'
                              ? 'classes'
                              : event.booking_type === 'event'
                                ? 'events'
                                : 'dining',
                          eventId: event.booking_type === 'class' ? event.id : undefined,
                        })
                      }
                      className="flex items-center justify-center px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 transition-colors"
                    >
                      {event.booking_type === 'class' && (
                        <>
                          <Calendar className="h-5 w-5 mr-2" />
                          Book Class
                        </>
                      )}
                      {event.booking_type === 'event' && (
                        <>
                          <CalendarRange className="h-5 w-5 mr-2" />
                          Inquire About Event
                        </>
                      )}
                      {event.booking_type === 'reservation' && (
                        <>
                          <Calendar className="h-5 w-5 mr-2" />
                          Reserve Spot
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Private Events Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg overflow-hidden shadow-lg mt-16 p-6">
          <h3 className="text-2xl font-display font-bold text-gray-900 mb-4">
            Host Your Private Event
          </h3>
          <p className="text-gray-600 font-garamond mb-6">
            Looking to host a special celebration, corporate event, or private party? The Spoonbill Lounge offers a unique tropical setting for your next gathering. Our team will work with you to create a customized experience that your guests will never forget.
          </p>
          <button
            type="button"
            onClick={() => onBook?.({ type: 'events' })}
            className="inline-flex items-center justify-center px-6 py-3 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 transition-colors"
          >
            <CalendarRange className="h-5 w-5 mr-2" />
            Book Private Event
          </button>
        </div>
      </div>
    </div>
  );
};

export default Events;
