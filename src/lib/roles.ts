// ─── Single Source of Truth: Role Hierarchy ────────────────────────────────

export const ROLES = {
  SUPERADMIN: 'superadmin',
  ORGADMIN: 'orgadmin',
  TEAMADMIN: 'teamadmin',
  HOST: 'host',
  PARTICIPANT: 'participant',
  GUEST: 'guest',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Numeric authority levels — higher number = more privilege */
export const ROLES_HIERARCHY: Record<string, number> = {
  [ROLES.SUPERADMIN]: 100,
  [ROLES.ORGADMIN]: 80,
  [ROLES.TEAMADMIN]: 60,
  [ROLES.HOST]: 40,
  [ROLES.PARTICIPANT]: 20,
  [ROLES.GUEST]: 10,
};

/** Returns true if `userRole` has at least as much authority as `requiredRole`. */
export function hasMinimumRole(userRole: string, requiredRole: string): boolean {
  return (ROLES_HIERARCHY[userRole] ?? 0) >= (ROLES_HIERARCHY[requiredRole] ?? 0);
}
