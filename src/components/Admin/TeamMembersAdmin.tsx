import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, UserCog, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  name: string;
  title: string;
  can_view_reservations: boolean;
  can_view_events_parties: boolean;
  can_view_classes: boolean;
  can_access_menu_management: boolean;
  can_access_operations: boolean;
  can_access_workforce: boolean;
  can_access_content_management: boolean;
  can_access_career_management: boolean;
  can_access_investment: boolean;
  can_access_settings: boolean;
  operations_classes_read_only: boolean;
  active: boolean;
}

const DUMMY_LOGIN_PASSWORDS: Record<string, string> = {
  'hostlead@srs.local': 'srs-hostlead',
  'linecook@srs.local': 'srs-linecook',
  'bartender@srs.local': 'srs-bartender',
  'server@srs.local': 'srs-server',
};

const TeamMembersAdmin: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(error.message || 'Failed to load team members');
    }

    setMembers(
      (Array.isArray(data) ? data : []).map((member) => ({
        id: String((member as { id?: unknown }).id || ''),
        user_id: String((member as { user_id?: unknown }).user_id || ''),
        email: String((member as { email?: unknown }).email || ''),
        name: String((member as { name?: unknown }).name || ''),
        title: String((member as { title?: unknown }).title || ''),
        can_view_reservations: Boolean((member as { can_view_reservations?: unknown }).can_view_reservations),
        can_view_events_parties: Boolean((member as { can_view_events_parties?: unknown }).can_view_events_parties),
        can_view_classes: Boolean((member as { can_view_classes?: unknown }).can_view_classes),
        can_access_menu_management: Boolean((member as { can_access_menu_management?: unknown }).can_access_menu_management),
        can_access_operations: Boolean((member as { can_access_operations?: unknown }).can_access_operations),
        can_access_workforce: (member as { can_access_workforce?: unknown }).can_access_workforce !== false,
        can_access_content_management: Boolean((member as { can_access_content_management?: unknown }).can_access_content_management),
        can_access_career_management: Boolean((member as { can_access_career_management?: unknown }).can_access_career_management),
        can_access_investment: Boolean((member as { can_access_investment?: unknown }).can_access_investment),
        can_access_settings: Boolean((member as { can_access_settings?: unknown }).can_access_settings),
        operations_classes_read_only: Boolean((member as { operations_classes_read_only?: unknown }).operations_classes_read_only),
        active: (member as { active?: unknown }).active !== false,
      })),
    );
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        await fetchMembers();
      } catch (error) {
        alert((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  const dummyMembers = useMemo(
    () => members.filter((member) => DUMMY_LOGIN_PASSWORDS[member.email]),
    [members],
  );

  const handleSaveMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingMember) return;

    const formData = new FormData(event.currentTarget);
    const canAccessOperations = Boolean(formData.get('can_access_operations'));
    const canViewClasses = canAccessOperations && Boolean(formData.get('can_view_classes'));

    const payload: TeamMember = {
      ...editingMember,
      name: String(formData.get('name') || '').trim(),
      title: String(formData.get('title') || '').trim(),
      can_access_menu_management: Boolean(formData.get('can_access_menu_management')),
      can_access_operations: canAccessOperations,
      can_access_workforce: Boolean(formData.get('can_access_workforce')),
      can_access_content_management: Boolean(formData.get('can_access_content_management')),
      can_access_career_management: Boolean(formData.get('can_access_career_management')),
      can_access_investment: Boolean(formData.get('can_access_investment')),
      can_access_settings: Boolean(formData.get('can_access_settings')),
      can_view_reservations: canAccessOperations && Boolean(formData.get('can_view_reservations')),
      can_view_events_parties: canAccessOperations && Boolean(formData.get('can_view_events_parties')),
      can_view_classes: canViewClasses,
      operations_classes_read_only:
        canViewClasses && Boolean(formData.get('operations_classes_read_only')),
      active: Boolean(formData.get('active')),
    };

    if (!payload.name) {
      alert('Name is required.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          name: payload.name,
          title: payload.title,
          can_access_menu_management: payload.can_access_menu_management,
          can_access_operations: payload.can_access_operations,
          can_access_workforce: payload.can_access_workforce,
          can_access_content_management: payload.can_access_content_management,
          can_access_career_management: payload.can_access_career_management,
          can_access_investment: payload.can_access_investment,
          can_access_settings: payload.can_access_settings,
          can_view_reservations: payload.can_view_reservations,
          can_view_events_parties: payload.can_view_events_parties,
          can_view_classes: payload.can_view_classes,
          operations_classes_read_only: payload.operations_classes_read_only,
          active: payload.active,
        })
        .eq('id', payload.id);

      if (error) throw error;

      await fetchMembers();
      setEditingMember(null);
    } catch (saveError) {
      alert(`Failed to save team member: ${(saveError as Error).message}`);
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
          <h1 className="text-3xl font-display font-bold text-gray-900">Team Access</h1>
          <p className="text-gray-600 font-garamond">
            One login portal. Choose exactly which admin sections each team member can see.
          </p>
        </div>

        <section className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-ocean-100 text-ocean-600">
              <UserCog className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-display font-bold text-gray-900">Access Matrix</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Team Member</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Menu</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Operations</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Workforce</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Content</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Career</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Investment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Settings</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.map((member) => (
                  <tr key={member.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{member.name}</div>
                      <div className="text-sm text-gray-500">{member.title || 'Team Member'}</div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{member.can_access_menu_management ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      {member.can_access_operations ? (
                        <div className="space-y-1">
                          <div>Res: {member.can_view_reservations ? 'Y' : 'N'}</div>
                          <div>Events: {member.can_view_events_parties ? 'Y' : 'N'}</div>
                          <div>Classes: {member.can_view_classes ? 'Y' : 'N'}</div>
                          <div>Class RO: {member.operations_classes_read_only ? 'Y' : 'N'}</div>
                        </div>
                      ) : (
                        'No'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{member.can_access_workforce ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{member.can_access_content_management ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{member.can_access_career_management ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{member.can_access_investment ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{member.can_access_settings ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">
                      <span className={member.active ? 'text-green-600' : 'text-gray-500'}>
                        {member.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingMember(member)}
                        className="inline-flex items-center justify-center p-2 text-ocean-600 hover:text-ocean-700"
                        title="Edit team member"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {!members.length && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                      No team members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-display font-bold text-gray-900 mb-3">Dummy Team Logins</h2>
          <p className="text-sm text-gray-600 mb-4">
            These 4 employees are pre-seeded so you can test section visibility and operations permissions.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {dummyMembers.map((member) => (
              <div key={member.id} className="rounded-lg border border-gray-200 p-3">
                <div className="font-medium text-gray-900">{member.name}</div>
                <div className="text-sm text-gray-600">{member.email}</div>
                <div className="text-sm text-gray-600">Password: {DUMMY_LOGIN_PASSWORDS[member.email]}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {editingMember && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-xl font-display font-bold text-gray-900">Edit Team Member</h3>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="p-2 text-gray-500 hover:text-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(event) => void handleSaveMember(event)} className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    name="name"
                    defaultValue={editingMember.name}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    name="title"
                    defaultValue={editingMember.title}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={editingMember.active}
                      className="rounded border-gray-300"
                    />
                    Active
                  </label>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-800 mb-3">Section Visibility</p>
                <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-700">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name="can_access_menu_management" defaultChecked={editingMember.can_access_menu_management} className="rounded border-gray-300" />
                    Menu Management
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name="can_access_operations" defaultChecked={editingMember.can_access_operations} className="rounded border-gray-300" />
                    Operations
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name="can_access_workforce" defaultChecked={editingMember.can_access_workforce} className="rounded border-gray-300" />
                    Workforce
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name="can_access_content_management" defaultChecked={editingMember.can_access_content_management} className="rounded border-gray-300" />
                    Content Management
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name="can_access_career_management" defaultChecked={editingMember.can_access_career_management} className="rounded border-gray-300" />
                    Career Management
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name="can_access_investment" defaultChecked={editingMember.can_access_investment} className="rounded border-gray-300" />
                    Investment
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name="can_access_settings" defaultChecked={editingMember.can_access_settings} className="rounded border-gray-300" />
                    Settings
                  </label>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-800 mb-3">Operations Access</p>
                <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-700">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name="can_view_reservations" defaultChecked={editingMember.can_view_reservations} className="rounded border-gray-300" />
                    Reservations
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name="can_view_events_parties" defaultChecked={editingMember.can_view_events_parties} className="rounded border-gray-300" />
                    Event / Parties
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name="can_view_classes" defaultChecked={editingMember.can_view_classes} className="rounded border-gray-300" />
                    Classes
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name="operations_classes_read_only" defaultChecked={editingMember.operations_classes_read_only} className="rounded border-gray-300" />
                    Classes Read-Only
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-ocean-600 text-white hover:bg-ocean-700 disabled:opacity-60"
                >
                  Save Team Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMembersAdmin;
