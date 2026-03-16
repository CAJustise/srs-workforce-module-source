import { supabase } from './supabase';

export const ROLE_OWNER_ID = 'role_owner';
export const ROLE_MANAGER_ID = 'role_manager';
export const ROLE_HOST_ID = 'role_host';
export const ROLE_STAFF_ID = 'role_staff';

export type BohPortal = 'admin' | 'host' | 'staff';
export type BohCapability = 'schedule_write' | 'reservations' | 'events_parties' | 'classes';
export type BohSection =
  | 'menu_management'
  | 'operations'
  | 'workforce'
  | 'content_management'
  | 'career_management'
  | 'investment'
  | 'settings';

const ADMIN_ROLE_IDS = new Set<string>([ROLE_OWNER_ID, ROLE_MANAGER_ID]);
const HOST_ROLE_IDS = new Set<string>([ROLE_HOST_ID]);
const STAFF_ROLE_IDS = new Set<string>([ROLE_STAFF_ID]);

export interface TeamMemberAccess {
  id: string;
  user_id: string;
  email: string;
  name: string;
  title: string;
  portal: BohPortal;
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
  can_manage_schedule: boolean;
  operations_classes_read_only: boolean;
  active: boolean;
}

export interface RoleResolution {
  roleIds: string[];
  isAdmin: boolean;
  isHost: boolean;
  isStaff: boolean;
  primaryPortal: BohPortal | null;
}

export interface PortalCapabilities {
  canViewReservations: boolean;
  canViewEventsParties: boolean;
  canViewClasses: boolean;
  operationsClassesReadOnly: boolean;
  canAccessMenuManagement: boolean;
  canAccessOperations: boolean;
  canAccessWorkforce: boolean;
  canAccessContentManagement: boolean;
  canAccessCareerManagement: boolean;
  canAccessInvestment: boolean;
  canAccessSettings: boolean;
  canManageSchedule: boolean;
}

const EMPTY_CAPABILITIES: PortalCapabilities = {
  canViewReservations: false,
  canViewEventsParties: false,
  canViewClasses: false,
  operationsClassesReadOnly: false,
  canAccessMenuManagement: false,
  canAccessOperations: false,
  canAccessWorkforce: false,
  canAccessContentManagement: false,
  canAccessCareerManagement: false,
  canAccessInvestment: false,
  canAccessSettings: false,
  canManageSchedule: false,
};

const FULL_CAPABILITIES: PortalCapabilities = {
  canViewReservations: true,
  canViewEventsParties: true,
  canViewClasses: true,
  operationsClassesReadOnly: false,
  canAccessMenuManagement: true,
  canAccessOperations: true,
  canAccessWorkforce: true,
  canAccessContentManagement: true,
  canAccessCareerManagement: true,
  canAccessInvestment: true,
  canAccessSettings: true,
  canManageSchedule: true,
};

const normalizePortal = (value: unknown): BohPortal => {
  const candidate = String(value ?? '')
    .trim()
    .toLowerCase();

  if (candidate === 'admin' || candidate === 'host' || candidate === 'staff') {
    return candidate;
  }

  return 'staff';
};

const toUniqueRoleIds = (roleIds: string[]) => Array.from(new Set(roleIds.filter(Boolean)));

const normalizeTeamMember = (row: unknown): TeamMemberAccess | null => {
  if (!row || typeof row !== 'object') {
    return null;
  }

  const candidate = row as Record<string, unknown>;
  const userId = String(candidate.user_id ?? '').trim();
  if (!userId) {
    return null;
  }

  const portal = normalizePortal(candidate.portal);
  const canAccessOperations = Boolean(candidate.can_access_operations ?? true);
  const canManageSchedule = Boolean(
    candidate.can_manage_schedule ?? candidate.can_access_workforce ?? false,
  );
  const canAccessWorkforce = Boolean(candidate.can_access_workforce) && canManageSchedule;

  return {
    id: String(candidate.id ?? ''),
    user_id: userId,
    email: String(candidate.email ?? ''),
    name: String(candidate.name ?? ''),
    title: String(candidate.title ?? ''),
    portal,
    can_view_reservations: canAccessOperations && Boolean(candidate.can_view_reservations),
    can_view_events_parties: canAccessOperations && Boolean(candidate.can_view_events_parties),
    can_view_classes: canAccessOperations && Boolean(candidate.can_view_classes),
    can_access_menu_management: Boolean(candidate.can_access_menu_management),
    can_access_operations: canAccessOperations,
    can_access_workforce: canAccessWorkforce,
    can_access_content_management: Boolean(candidate.can_access_content_management),
    can_access_career_management: Boolean(candidate.can_access_career_management),
    can_access_investment: Boolean(candidate.can_access_investment),
    can_access_settings: Boolean(candidate.can_access_settings),
    can_manage_schedule: canManageSchedule,
    operations_classes_read_only: Boolean(candidate.operations_classes_read_only),
    active: Boolean(candidate.active ?? true),
  };
};

export const deriveRoleResolution = (roleIds: string[]): RoleResolution => {
  const uniqueRoleIds = toUniqueRoleIds(roleIds);
  const isAdmin = uniqueRoleIds.some((roleId) => ADMIN_ROLE_IDS.has(roleId));
  const isHost = uniqueRoleIds.some((roleId) => HOST_ROLE_IDS.has(roleId));
  const isStaff = uniqueRoleIds.some((roleId) => STAFF_ROLE_IDS.has(roleId));

  return {
    roleIds: uniqueRoleIds,
    isAdmin,
    isHost,
    isStaff,
    primaryPortal: isAdmin ? 'admin' : isHost ? 'host' : isStaff ? 'staff' : null,
  };
};

const roleFallbackCapabilities = (roleResolution: RoleResolution): PortalCapabilities => {
  if (roleResolution.isAdmin) {
    return FULL_CAPABILITIES;
  }

  if (roleResolution.isHost || roleResolution.isStaff) {
    return {
      ...EMPTY_CAPABILITIES,
      canAccessOperations: true,
    };
  }

  return EMPTY_CAPABILITIES;
};

export const derivePortalCapabilities = (
  roleIds: string[],
  teamMember: TeamMemberAccess | null,
): PortalCapabilities => {
  const roleResolution = deriveRoleResolution(roleIds);

  if (roleResolution.isAdmin) {
    return FULL_CAPABILITIES;
  }

  if (teamMember) {
    if (!teamMember.active) {
      return EMPTY_CAPABILITIES;
    }

    return {
      canViewReservations: teamMember.can_view_reservations,
      canViewEventsParties: teamMember.can_view_events_parties,
      canViewClasses: teamMember.can_view_classes,
      operationsClassesReadOnly: teamMember.operations_classes_read_only,
      canAccessMenuManagement: teamMember.can_access_menu_management,
      canAccessOperations: teamMember.can_access_operations,
      canAccessWorkforce: teamMember.can_access_workforce,
      canAccessContentManagement: teamMember.can_access_content_management,
      canAccessCareerManagement: teamMember.can_access_career_management,
      canAccessInvestment: teamMember.can_access_investment,
      canAccessSettings: teamMember.can_access_settings,
      canManageSchedule: teamMember.can_manage_schedule,
    };
  }

  return roleFallbackCapabilities(roleResolution);
};

export const canAccessCapability = (capabilities: PortalCapabilities, capability: BohCapability) => {
  if (capability === 'schedule_write') return capabilities.canManageSchedule;
  if (capability === 'reservations') return capabilities.canViewReservations;
  if (capability === 'events_parties') return capabilities.canViewEventsParties;
  return capabilities.canViewClasses;
};

export const canAccessSection = (capabilities: PortalCapabilities, section: BohSection) => {
  if (section === 'menu_management') return capabilities.canAccessMenuManagement;
  if (section === 'operations') return capabilities.canAccessOperations;
  if (section === 'workforce') return capabilities.canAccessWorkforce;
  if (section === 'content_management') return capabilities.canAccessContentManagement;
  if (section === 'career_management') return capabilities.canAccessCareerManagement;
  if (section === 'investment') return capabilities.canAccessInvestment;
  return capabilities.canAccessSettings;
};

export const hasAnySectionAccess = (capabilities: PortalCapabilities) =>
  canAccessSection(capabilities, 'operations') ||
  canAccessSection(capabilities, 'workforce') ||
  canAccessSection(capabilities, 'settings');

export const canAccessPortal = (
  roleIds: string[],
  portal: BohPortal,
  teamMember: TeamMemberAccess | null = null,
) => {
  const capabilities = derivePortalCapabilities(roleIds, teamMember);
  if (portal === 'admin') {
    return hasAnySectionAccess(capabilities);
  }

  const roleResolution = deriveRoleResolution(roleIds);
  if (roleResolution.isAdmin) return true;
  if (teamMember && !teamMember.active) return false;
  if (teamMember) return teamMember.portal === portal;
  if (portal === 'host') return roleResolution.isHost;
  return roleResolution.isStaff;
};

export const resolveDefaultPortal = (
  roleIds: string[],
  teamMember: TeamMemberAccess | null = null,
): BohPortal | null => {
  const capabilities = derivePortalCapabilities(roleIds, teamMember);
  if (hasAnySectionAccess(capabilities)) return 'admin';

  const roleResolution = deriveRoleResolution(roleIds);
  if (teamMember?.portal) return teamMember.portal;
  if (roleResolution.isHost) return 'host';
  if (roleResolution.isStaff) return 'staff';
  return null;
};

export const getRoleIdsForUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('admin_user_roles')
    .select('role_id')
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message || 'Unable to load user roles');
  }

  if (!Array.isArray(data)) return [];

  return data
    .map((row) => String((row as { role_id?: unknown }).role_id ?? '').trim())
    .filter(Boolean);
};

export const getTeamMemberForUser = async (userId: string): Promise<TeamMemberAccess | null> => {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    const message = String(error.message || '').toLowerCase();
    if (message.includes('no rows') || message.includes('0 rows')) {
      return null;
    }
    throw new Error(error.message || 'Unable to load team member permissions');
  }

  return normalizeTeamMember(data);
};

export const getCurrentRoleResolution = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return {
      session: null,
      teamMember: null,
      capabilities: EMPTY_CAPABILITIES,
      ...deriveRoleResolution([]),
    };
  }

  const roleIds = await getRoleIdsForUser(session.user.id);
  const teamMember = await getTeamMemberForUser(session.user.id);

  return {
    session,
    teamMember,
    capabilities: derivePortalCapabilities(roleIds, teamMember),
    ...deriveRoleResolution(roleIds),
  };
};
