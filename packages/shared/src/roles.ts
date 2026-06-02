export const ROLES = ['employee', 'team_lead', 'manager', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Manager',
  team_lead: 'Team Lead',
  employee: 'Employee',
};

export function getRoleLevel(role: Role): number {
  return ROLES.indexOf(role);
}

export function canManage(actor: Role, target: Role): boolean {
  return getRoleLevel(actor) > getRoleLevel(target);
}

export function getManageableRoles(role: Role): Role[] {
  return ROLES.slice(0, getRoleLevel(role)) as unknown as Role[];
}
