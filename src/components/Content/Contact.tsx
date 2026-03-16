import React from 'react';
import { MapPin, Phone, Star } from 'lucide-react';

interface ContactProps {
  onOpenReservations?: () => void;
  onOpenEvents?: () => void;
}

const Contact: React.FC<ContactProps> = ({ onOpenReservations, onOpenEvents }) => {
  return (
    <div className="space-y-12">
      <div className="prose prose-lg max-w-none">
        <p className="text-xl text-gray-600 font-garamond leading-relaxed">
          Your experience at The Spoonbill Lounge matters to us. We'd love to hear about your recent visit and how we can make your next one even better. For{' '}
          <button 
            onClick={onOpenReservations}
            className="text-ocean-600 hover:text-ocean-700 font-medium hover:underline"
          >
            reservations
          </button>
          , please use our reservations system, and for{' '}
          <button
            onClick={onOpenEvents}
            className="text-ocean-600 hover:text-ocean-700 font-medium hover:underline"
          >
            event inquiries
          </button>
          , visit our Events page.
        </p>

        {/* Contact Information */}
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-lg shadow-lg mt-8">
          <h3 className="text-2xl font-display font-bold text-gray-900 mb-6">Contact Information</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start">
              <MapPin className="h-6 w-6 text-ocean-600 mr-3 mt-1" />
              <div>
                <h4 className="font-garamond font-medium text-gray-900">Location</h4>
                <p className="text-gray-600 font-garamond">
                  230 Portofino Way<br />
                  Redondo Beach, CA 90277
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <Phone className="h-6 w-6 text-ocean-600 mr-3 mt-1" />
              <div>
                <h4 className="font-garamond font-medium text-gray-900">Phone</h4>
                <p className="text-gray-600 font-garamond">
                  (310) 867-5309
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Form */}
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-lg shadow-lg mt-8">
          <h3 className="text-2xl font-display font-bold text-gray-900 mb-6">Share Your Experience</h3>
          <form className="space-y-6 max-w-2xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="visit-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Visit
                </label>
                <input
                  type="date"
                  id="visit-date"
                  name="visit-date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
                />
              </div>

              <div>
                <label htmlFor="visit-time" className="block text-sm font-medium text-gray-700 mb-1">
                  Time of Visit
                </label>
                <select
                  id="visit-time"
                  name="visit-time"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
                >
                  <option value="">Select a time</option>
                  <option value="happy-hour">Happy Hour (3-5 PM)</option>
                  <option value="early-dinner">Early Dinner (5-7 PM)</option>
                  <option value="dinner">Dinner (7-9 PM)</option>
                  <option value="late-night">Late Night (9 PM+)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Overall Experience
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <label key={rating} className="cursor-pointer">
                    <input
                      type="radio"
                      name="rating"
                      value={rating}
                      className="sr-only"
                    />
                    <Star className="h-8 w-8 text-gray-300 hover:text-ocean-500 peer-checked:text-ocean-500" />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="feedback-type" className="block text-sm font-medium text-gray-700 mb-1">
                What would you like to share feedback about?
              </label>
              <select
                id="feedback-type"
                name="feedback-type"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
              >
                <option value="">Select an option</option>
                <option value="food">Food</option>
                <option value="drinks">Drinks</option>
                <option value="service">Service</option>
                <option value="ambiance">Ambiance</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Your Feedback
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                placeholder="Tell us about your experience..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
              />
            </div>

            <div>
              <label htmlFor="improvements" className="block text-sm font-medium text-gray-700 mb-1">
                How can we improve?
              </label>
              <textarea
                id="improvements"
                name="improvements"
                rows={4}
                placeholder="Any suggestions for making your next visit even better?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-ocean-600 text-white py-3 px-4 rounded-lg hover:bg-ocean-700 transition-colors font-medium"
            >
              Submit Feedback
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;