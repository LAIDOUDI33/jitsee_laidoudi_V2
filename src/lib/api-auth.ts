import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { isBlacklisted } from './token-blacklist';
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

  const ROLE_LEVELS: Record<string, number> = {
    superadmin: 100,
    orgadmin: 80,
    teamadmin: 60,
    host: 40,
    participant: 20,
    guest: 10,
  };

  const userLevel = ROLE_LEVELS[user.role] ?? 0;
  const requiredLevel = ROLE_LEVELS[minimumRole] ?? 0;

  if (userLevel < requiredLevel) {
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
