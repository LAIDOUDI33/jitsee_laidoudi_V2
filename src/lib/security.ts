import { headers } from 'next/headers';

/**
 * Security utility module for input sanitization, validation, and prompt safety.
 */

// ─── Input Sanitization ──────────────────────────────────────────────────────────

/**
 * Sanitize a string input: trim whitespace, strip HTML tags, limit length.
 * Returns the sanitized string or throws if invalid.
 */
export function inputSanitize(
  input: unknown,
  maxLength: number = 1000,
  fieldName: string = 'input'
): string {
  if (input === null || input === undefined) {
    throw new SecurityError('VALIDATION_ERROR', `${fieldName} is required`);
  }

  if (typeof input !== 'string') {
    throw new SecurityError('VALIDATION_ERROR', `${fieldName} must be a string`);
  }

  // Strip HTML tags to prevent XSS
  let sanitized = input.replace(/<[^>]*>/g, '').trim();

  // Collapse multiple whitespace
  sanitized = sanitized.replace(/\s+/g, ' ');

  if (sanitized.length === 0) {
    throw new SecurityError('VALIDATION_ERROR', `${fieldName} cannot be empty`);
  }

  if (sanitized.length > maxLength) {
    throw new SecurityError(
      'VALIDATION_ERROR',
      `${fieldName} exceeds maximum length of ${maxLength} characters`
    );
  }

  return sanitized;
}

/**
 * Sanitize a string input but return null/undefined instead of throwing if missing.
 * Useful for optional fields.
 */
export function inputSanitizeOptional(
  input: unknown,
  maxLength: number = 1000
): string | null {
  if (input === null || input === undefined) return null;
  if (typeof input !== 'string') return null;

  let sanitized = input.replace(/<[^>]*>/g, '').trim();
  sanitized = sanitized.replace(/\s+/g, ' ');

  if (sanitized.length === 0) return null;
  if (sanitized.length > maxLength) return null;

  return sanitized;
}

// ─── UUID Validation ────────────────────────────────────────────────────────────

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate that a string is a proper UUID v4 format.
 * Returns the UUID string or throws if invalid.
 */
export function validateUuid(uuid: unknown, fieldName: string = 'id'): string {
  if (!uuid || typeof uuid !== 'string') {
    throw new SecurityError('VALIDATION_ERROR', `${fieldName} is required`);
  }

  if (!UUID_REGEX.test(uuid)) {
    throw new SecurityError('VALIDATION_ERROR', `Invalid ${fieldName} format`);
  }

  return uuid;
}

/**
 * Validate UUID optionally — returns null instead of throwing if missing.
 */
export function validateUuidOptional(uuid: unknown): string | null {
  if (!uuid || typeof uuid !== 'string') return null;
  if (!UUID_REGEX.test(uuid)) return null;
  return uuid;
}

// ─── Prompt Sanitization (AI endpoints) ─────────────────────────────────────────

/**
 * Patterns that indicate obviously malicious or abusive prompts.
 */
const MALICIOUS_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+(instructions?|commands?|prompts?)/i,
  /you\s+are\s+now\s+(a|an|not|no\s+longer)\b/i,
  /system\s*:\s*"/i,
  /\{\{[\s\S]*\}\}/,  // template injection
  /<\|im_start\|>/,    // chatml injection
  /<\|im_end\|>/,
  /\[INST\]/i,         // LLaMA instruction injection
  /<\/?s>/,            // XML tag injection
  /\\\n.*system/i,     // newline + system injection
  /act\s+as\s+(if\s+you\s+(are|were)|a|an)\s+(malicious|evil|hacker|criminal)/i,
  /forget\s+(everything|all)\s+(you|that)\s+(know|were)/i,
];

/**
 * Sanitize an AI prompt: truncate to max length, reject malicious patterns.
 * Returns sanitized prompt or throws SecurityError.
 */
export function sanitizePrompt(input: unknown, maxChars: number = 10000): string {
  if (!input || typeof input !== 'string') {
    throw new SecurityError('VALIDATION_ERROR', 'Prompt content is required');
  }

  let sanitized = input.trim();

  // Check for malicious patterns before truncation
  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      throw new SecurityError(
        'INVALID_INPUT',
        'The provided input contains content that cannot be processed'
      );
    }
  }

  // Truncate to max characters
  if (sanitized.length > maxChars) {
    sanitized = sanitized.slice(0, maxChars) + '\n\n[Content truncated due to length limit]';
  }

  return sanitized;
}

// ─── Numeric Validation ──────────────────────────────────────────────────────────

/**
 * Validate and clamp a numeric value within bounds.
 */
export function validateInt(
  input: unknown,
  min: number,
  max: number,
  defaultValue: number,
  fieldName: string = 'value'
): number {
  if (input === null || input === undefined) return defaultValue;

  const num = parseInt(String(input), 10);
  if (isNaN(num)) return defaultValue;

  return Math.max(min, Math.min(max, num));
}

// ─── Date Validation ────────────────────────────────────────────────────────────

/**
 * Validate a date string. Returns a Date object or null if invalid.
 */
export function validateDate(dateStr: unknown): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;

  return date;
}

// ─── Get Auth Headers Helper ────────────────────────────────────────────────────

/**
 * Get user info from headers set by middleware (server-side only).
 */
export async function getAuthHeaders() {
  const headersList = await headers();
  return {
    userId: headersList.get('x-user-id'),
    userEmail: headersList.get('x-user-email'),
    userRole: headersList.get('x-user-role'),
    userOrgId: headersList.get('x-user-org-id'),
  };
}

// ─── Error Class ────────────────────────────────────────────────────────────────

export class SecurityError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'SecurityError';
  }
}
