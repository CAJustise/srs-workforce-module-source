import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck2, CalendarRange, GraduationCap } from 'lucide-react';

const HostDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Host Dashboard</h1>
        <p className="text-gray-600 font-garamond mb-8">
          Manage live reservations, private events, and class bookings from one BOH workspace.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <Link
            to="/host/reservations"
            className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-ocean-100 rounded-lg text-ocean-600 group-hover:bg-ocean-600 group-hover:text-white transition-colors">
                <CalendarCheck2 className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-display font-bold text-gray-900">Reservations</h2>
            </div>
            <p className="text-gray-600 font-garamond">
              Confirm dining reservations, adjust status, and control reservation slot capacities.
            </p>
          </Link>

          <Link
            to="/host/events-parties"
            className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-ocean-100 rounded-lg text-ocean-600 group-hover:bg-ocean-600 group-hover:text-white transition-colors">
                <CalendarRange className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-display font-bold text-gray-900">Event / Parties</h2>
            </div>
            <p className="text-gray-600 font-garamond">
              Review private event requests, update status, and manage event slot participant limits.
            </p>
          </Link>

          <Link
            to="/host/classes"
            className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-ocean-100 rounded-lg text-ocean-600 group-hover:bg-ocean-600 group-hover:text-white transition-colors">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-display font-bold text-gray-900">Classes</h2>
            </div>
            <p className="text-gray-600 font-garamond">
              Schedule classes, set capacities, and track signups in real time.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HostDashboard;
