import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { isBlacklisted } from './token-blacklist';
import { ROLES, ROLES_HIERARCHY, hasMinimumRole } from './roles';
import type { TokenPayload } from './jwt-edge';

/**
 * Get the authenticated user from request headers (set by middleware).
 * Must only be called from within API route handlers (server-side).
 * Also checks the token blacklist to reject revoked tokens.
 */
export async function getCurrentUser() {
  const headersList = await headers();

  // Check token blacklist before returning user identity
  const authHeader = headersList.get('authorization');
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : null;
    if (token && isBlacklisted(token)) {
      return null;
    }
  }

  const userId = headersList.get('x-user-id');
  const userEmail = headersList.get('x-user-email');
  const userRole = headersList.get('x-user-role');
  const userOrgId = headersList.get('x-user-org-id');

  if (!userId || !userEmail || !userRole) {
    return null;
  }

  const payload: TokenPayload = {
    userId,
    email: userEmail,
    role: userRole,
    organizationId: userOrgId,
  };

  return payload;
}

/**
 * Get the full user record from the database.
 * Returns null if not authenticated or user not found.
 */
export async function getAuthenticatedUser() {
  const auth = await getCurrentUser();
  if (!auth) return null;

  const user = await db.user.findUnique({
    where: { id: auth.userId },
    include: { organization: true },
  });

  return user;
}

/**
 * Require authentication — throws error response if not authenticated.
 */
export async function requireAuth() {
  // Check token blacklist first — return distinct error so clients
  // know not to attempt token refresh
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : null;
    if (token && isBlacklisted(token)) {
      throw new AuthError('TOKEN_REVOKED', 'Token revoked', 401);
    }
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    throw new AuthError('UNAUTHORIZED', 'Authentication required', 401);
  }
  return user;
}

/**
 * Require minimum role level.
 */
export async function requireRole(minimumRole: string) {
  const user = await requireAuth();

  if (!hasMinimumRole(user.role, minimumRole)) {
    throw new AuthError('FORBIDDEN', 'Insufficient permissions', 403);
  }

  return user;
}

export class AuthError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'AuthError';
  }
}

/**
 * Build an organization-scoped where clause for Prisma queries.
 * Superadmins bypass org filtering and receive an empty filter (see all data).
 * All other roles with an organizationId are scoped to their org.
 */
export function getOrgFilter(user: { role: string; organizationId: string | null }): Record<string, string> {
  if (user.role === 'superadmin') return {};
  if (user.organizationId) return { organizationId: user.organizationId };
  // User has no org — return empty filter (only their own data will match)
  return {};
}

/**
 * Require orgadmin role or higher.
 * Convenience shorthand for requireRole('orgadmin').
 */
export async function requireOrgAdmin() {
  return requireRole(ROLES.ORGADMIN);
}

/**
 * Check if the current user owns the resource (matches resourceUserId)
 * OR has orgadmin+ privileges. Throws AuthError if neither.
 *
 * @param resourceUserId - The user ID of the resource owner
 * @returns The authenticated user record (with organization)
 */
export async function requireResourceOwner(resourceUserId: string) {
  const user = await requireAuth();

  // Orgadmin and above can access any resource in their org
  if (hasMinimumRole(user.role, ROLES.ORGADMIN)) {
    return user;
  }

  // Otherwise, user must be the resource owner
  if (user.id !== resourceUserId) {
    throw new AuthError('FORBIDDEN', 'You do not have access to this resource', 403);
  }

  return user;
}

/**
 * Check if a user can manage other users.
 * Returns true for:
 *  - orgadmin+ (can manage all users in their org)
 *  - teamadmin managing users within their own teams
 * Returns false otherwise.
 *
 * This is a synchronous boolean check — does NOT throw.
 */
export function canManageUsers(user: {
  id: string;
  role: string;
  organizationId: string | null;
}): boolean {
  // orgadmin and above can manage any user in their org
  if (hasMinimumRole(user.role, ROLES.ORGADMIN)) {
    return true;
  }

  // teamadmin can manage users (but caller must enforce team-scoping separately)
  if (user.role === ROLES.TEAMADMIN) {
    return true;
  }

  return false;
}
