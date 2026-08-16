// ─── Auth utilities (Node.js runtime only) ────────────────────────────────────

// Re-export edge-compatible JWT functions
export { createAccessToken, createRefreshToken, verifyAccessToken, verifyRefreshToken, extractBearerToken, rateLimit, type TokenPayload } from '../jwt-edge';

import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';

const SCRYPT_KEYLEN = 64;
const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELISM = 1;

// ─── Password Hashing (scrypt — NIST recommended) ────────────────────────────

export function hashPassword(password: string): string {
  const salt = randomBytes(32);
  const derivedKey = scryptSync(password, salt, SCRYPT_KEYLEN, { N: SCRYPT_COST, r: SCRYPT_BLOCK_SIZE, p: SCRYPT_PARALLELISM });
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [saltHex, hashHex] = storedHash.split(':');
    if (!saltHex || !hashHex) return false;
    const saltBuffer = Buffer.from(saltHex, 'hex');
    const storedBuffer = Buffer.from(hashHex, 'hex');
    const derivedKey = scryptSync(password, saltBuffer, SCRYPT_KEYLEN, { N: SCRYPT_COST, r: SCRYPT_BLOCK_SIZE, p: SCRYPT_PARALLELISM });
    return timingSafeEqual(derivedKey, storedBuffer);
  } catch {
    return false;
  }
}

// ─── Password Strength Validation ────────────────────────────────────────────

export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 10) errors.push('Password must be at least 10 characters');
  if (!/[A-Z]/.test(password)) errors.push('Must contain uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Must contain lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Must contain a number');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Must contain a special character');
  return { valid: errors.length === 0, errors };
}

// ─── Role Hierarchy ──────────────────────────────────────────────────────────

const ROLE_HIERARCHY: Record<string, number> = {
  superadmin: 100, orgadmin: 80, teamadmin: 60, host: 40, participant: 20, guest: 10,
};

export function hasMinimumRole(userRole: string, requiredRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0);
}

export const ROLES = { SUPERADMIN: 'superadmin', ORGADMIN: 'orgadmin', TEAMADMIN: 'teamadmin', HOST: 'host', PARTICIPANT: 'participant', GUEST: 'guest' } as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

export function sanitizeString(input: string, maxLength: number = 1000): string {
  return input.slice(0, maxLength).trim();
}
