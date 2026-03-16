import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck2, CalendarRange, GraduationCap, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  derivePortalCapabilities,
  getRoleIdsForUser,
  getTeamMemberForUser,
  type BohPortal,
  type PortalCapabilities,
} from '../../lib/bohRoles';

interface PortalDashboardProps {
  portal: Exclude<BohPortal, 'admin'>;
}

interface DashboardCard {
  key: string;
  to: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const emptyCapabilities: PortalCapabilities = {
  canViewReservations: false,
  canViewEventsParties: false,
  canViewClasses: false,
};

const PortalDashboard: React.FC<PortalDashboardProps> = ({ portal }) => {
  const [loading, setLoading] = useState(true);
  const [capabilities, setCapabilities] = useState<PortalCapabilities>(emptyCapabilities);

  useEffect(() => {
    let active = true;

    const fetchAccess = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user?.id) {
          if (active) {
            setCapabilities(emptyCapabilities);
          }
          return;
        }

        const roleIds = await getRoleIdsForUser(session.user.id);
        const teamMember = await getTeamMemberForUser(session.user.id);
        const nextCapabilities = derivePortalCapabilities(roleIds, teamMember);

        if (active) {
          setCapabilities(nextCapabilities);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchAccess();

    return () => {
      active = false;
    };
  }, []);

  const basePath = portal === 'host' ? '/host' : '/staff';
  const cards = useMemo(() => {
    const next: DashboardCard[] = [];

    if (capabilities.canViewReservations) {
      next.push({
        key: 'reservations',
        to: `${basePath}/reservations`,
        title: 'Reservations',
        description: 'Confirm dining reservations, adjust status, and manage table capacity.',
        icon: CalendarCheck2,
      });
    }

    if (capabilities.canViewEventsParties) {
      next.push({
        key: 'events',
        to: `${basePath}/events-parties`,
        title: 'Event / Parties',
        description: 'Review private event requests and manage headcount limits by time slot.',
        icon: CalendarRange,
      });
    }

    if (capabilities.canViewClasses) {
      next.push({
        key: 'classes',
        to: `${basePath}/classes`,
        title: 'Classes',
        description: 'Manage class sessions, attendance, and reservation limits for future dates.',
        icon: GraduationCap,
      });
    }

    return next;
  }, [basePath, capabilities]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
          {portal === 'host' ? 'Host Dashboard' : 'Team Dashboard'}
        </h1>
        <p className="text-gray-600 font-garamond mb-8">
          {portal === 'host'
            ? 'Manage live reservations, private events, and classes from one BOH workspace.'
            : 'Use this workspace to manage the BOH tools assigned to your role.'}
        </p>

        {cards.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.key}
                  to={card.to}
                  className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-ocean-100 rounded-lg text-ocean-600 group-hover:bg-ocean-600 group-hover:text-white transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="text-lg font-display font-bold text-gray-900">{card.title}</h2>
                  </div>
                  <p className="text-gray-600 font-garamond">{card.description}</p>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100 flex items-start gap-4">
            <div className="p-3 rounded-lg bg-gray-100 text-gray-500">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-gray-900 mb-1">No BOH tools assigned yet</h2>
                <p className="text-gray-600 font-garamond">
                  Ask an admin to configure your Team Member access in Admin Portal {'>'} Team Members.
                </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortalDashboard;
