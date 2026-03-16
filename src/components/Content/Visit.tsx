import React from 'react';
import { MapPin, Phone, Mail, Clock, CalendarDays, GlassWater, UtensilsCrossed } from 'lucide-react';

const Visit: React.FC = () => {
  return (
    <div className="space-y-12">
      <div className="prose prose-lg max-w-none">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-lg shadow-lg">
          <div className="flex items-start mb-6">
            <MapPin className="h-6 w-6 text-ocean-600 mr-3 mt-1" />
            <div>
              <h3 className="text-2xl font-display font-bold text-gray-900">Location</h3>
              <p className="text-gray-600 font-garamond mt-2">
                230 Portofino Way<br />
                Redondo Beach, CA 90277
              </p>
              <a 
                href="https://maps.google.com/?q=230+Portofino+Way,+Redondo+Beach,+CA+90277"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-ocean-600 hover:text-ocean-700 font-garamond"
              >
                Get Directions →
              </a>
            </div>
          </div>

          <div className="flex items-start mb-6">
            <Phone className="h-6 w-6 text-ocean-600 mr-3 mt-1" />
            <div>
              <h3 className="text-2xl font-display font-bold text-gray-900">Phone</h3>
              <p className="text-gray-600 font-garamond mt-2">
                (310) 867-5309
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <Mail className="h-6 w-6 text-ocean-600 mr-3 mt-1" />
            <div>
              <h3 className="text-2xl font-display font-bold text-gray-900">Email</h3>
              <p className="text-gray-600 font-garamond mt-2">
                info@spoonbilllounge.com
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-lg shadow-lg mt-8">
          <div className="flex items-center mb-6">
            <Clock className="h-6 w-6 text-ocean-600 mr-3" />
            <h3 className="text-2xl font-display font-bold text-gray-900">Hours of Operation</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <CalendarDays className="h-5 w-5 text-ocean-600 mr-2" />
                <h4 className="text-xl font-display font-bold text-gray-900">Regular Hours</h4>
              </div>
              <div className="space-y-2 font-garamond">
                <p className="flex justify-between">
                  <span>Monday</span>
                  <span>3:00 PM - 12:00 AM</span>
                </p>
                <p className="flex justify-between text-gray-500">
                  <span>Tuesday</span>
                  <span>Closed</span>
                </p>
                <p className="flex justify-between text-gray-500">
                  <span>Wednesday</span>
                  <span>Closed</span>
                </p>
                <p className="flex justify-between">
                  <span>Thursday</span>
                  <span>3:00 PM - 12:00 AM</span>
                </p>
                <p className="flex justify-between">
                  <span>Friday</span>
                  <span>3:00 PM - 1:00 AM</span>
                </p>
                <p className="flex justify-between">
                  <span>Saturday</span>
                  <span>11:00 AM - 1:00 AM</span>
                </p>
                <p className="flex justify-between">
                  <span>Sunday</span>
                  <span>11:00 AM - 12:00 AM</span>
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <div className="flex items-center mb-4">
                  <UtensilsCrossed className="h-5 w-5 text-ocean-600 mr-2" />
                  <h4 className="text-xl font-display font-bold text-gray-900">Restaurant Hours</h4>
                </div>
                <p className="font-garamond text-gray-600">
                  Open daily from 5:00 PM until one hour before closing time
                </p>
                <p className="font-garamond text-sm text-gray-500 mt-2 italic">
                  Last call for food orders is one hour before closing time
                </p>
              </div>

              <div>
                <div className="flex items-center mb-4">
                  <GlassWater className="h-5 w-5 text-ocean-600 mr-2" />
                  <h4 className="text-xl font-display font-bold text-gray-900">Special Hours & Events</h4>
                </div>
                <div className="space-y-4 font-garamond">
                  <div>
                    <h5 className="font-medium text-gray-900">Happy Hour (Bar Seating Only)</h5>
                    <p className="text-gray-600">Monday, Thursday, Friday: 3:00 PM - 5:00 PM</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">Sunday Brunch</h5>
                    <p className="text-gray-600">11:00 AM - 3:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Visit;