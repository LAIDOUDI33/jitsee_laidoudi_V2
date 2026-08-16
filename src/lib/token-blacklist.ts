/**
 * In-memory token blacklist for JWT revocation.
 * Suitable for single-instance deployment (matches SQLite single-writer constraint).
 *
 * IMPORTANT: This module uses `setInterval` and `Buffer` — NOT Edge-compatible.
 * Only import from Node.js runtime code (API route handlers, api-auth.ts).
 * Do NOT import in middleware.ts (Edge Runtime).
 */

// Map of token string → expiry timestamp (ms since epoch)
const blacklistedTokens = new Map<string, number>();

// Track whether cleanup interval has been started
let cleanupStarted = false;

/**
 * Decode a JWT payload without verification to extract the `exp` claim.
 */
function getTokenExpiry(token: string): number {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return 0;
    // JWT uses base64url encoding; replace URL-safe chars for standard base64
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
    // `exp` is in seconds; convert to milliseconds for comparison with Date.now()
    return payload.exp ? (payload.exp as number) * 1000 : 0;
  } catch {
    return 0;
  }
}

/**
 * Remove expired entries from the blacklist.
 */
function cleanup(): void {
  const now = Date.now();
  for (const [token, expiresAt] of blacklistedTokens) {
    // Remove if past expiry (with 1s buffer)
    if (expiresAt > 0 && now > expiresAt + 1000) {
      blacklistedTokens.delete(token);
    }
  }
}

/**
 * Ensure the periodic cleanup interval is running.
 * Starts a 10-minute interval on first call.
 */
function ensureCleanup(): void {
  if (!cleanupStarted) {
    cleanupStarted = true;
    // Run cleanup every 10 minutes
    setInterval(cleanup, 10 * 60 * 1000);
  }
}

/**
 * Add a token to the blacklist.
 * The entry will be automatically cleaned up after the token's natural expiry.
 */
export function blacklistToken(token: string): void {
  const expiresAt = getTokenExpiry(token);
  // If we can't parse expiry, default to 8 hours from now (access token lifetime)
  const effectiveExpiry = expiresAt > 0 ? expiresAt : Date.now() + 8 * 60 * 60 * 1000;
  blacklistedTokens.set(token, effectiveExpiry);
  ensureCleanup();
}

/**
 * Check if a token has been blacklisted.
 * Also cleans up the specific entry if it has expired.
 */
export function isBlacklisted(token: string): boolean {
  const entry = blacklistedTokens.get(token);
  if (!entry) return false;

  // If the token's natural expiry has passed, remove it and allow
  if (Date.now() > entry + 1000) {
    blacklistedTokens.delete(token);
    return false;
  }

  return true;
}

/**
 * Get the current size of the blacklist (useful for monitoring/debugging).
 */
export function getBlacklistSize(): number {
  return blacklistedTokens.size;
}
