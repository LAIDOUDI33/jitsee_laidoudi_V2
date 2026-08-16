// ─── Environment Variable Validation ───────────────────────────────────────
// Validates required env vars at import time. Import this module in any
// server/edge code that needs env vars instead of reading process.env directly.

const isProduction = process.env.NODE_ENV === 'production';

function requireEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value !== undefined && value !== '') return value;
  if (defaultValue !== undefined) return defaultValue;
  throw new Error(`Missing required environment variable: ${key}`);
}

// ─── JWT_SECRET (required in production, 32+ chars) ─────────────────────────

const _jwtSecret = process.env.JWT_SECRET;
const JWT_SECRET = (() => {
  if (isProduction) {
    if (!_jwtSecret || _jwtSecret.length < 32) {
      throw new Error(
        'JWT_SECRET must be set and at least 32 characters in production'
      );
    }
    return _jwtSecret;
  }
  // Development: allow fallback so the project works out of the box
  return _jwtSecret || 'alvision-default-secret-change-in-production';
})();

// ─── Optional vars with defaults ────────────────────────────────────────────

const DATABASE_URL = requireEnv(
  'DATABASE_URL',
  'file:./dev.db'
);

const NEXT_PUBLIC_WS_URL = requireEnv(
  'NEXT_PUBLIC_WS_URL',
  ''
);

const NODE_ENV = requireEnv('NODE_ENV', 'development');

export const env = {
  JWT_SECRET,
  DATABASE_URL,
  NEXT_PUBLIC_WS_URL,
  NODE_ENV,
} as const;
