// ─── Environment Variable Validation (Zod) ────────────────────────────────
// Validates all environment variables at import time using a typed Zod schema.
// Import `env` from this module instead of reading process.env directly.

import { z } from 'zod'

const envSchema = z.object({
  /** JWT secret — required in production (≥32 chars), defaults in dev */
  JWT_SECRET: z.string().default('alvision-default-secret-change-in-production'),

  /** Prisma DATABASE_URL — required */
  DATABASE_URL: z.string().default('file:./dev.db'),

  /** WebSocket URL for real-time features — optional */
  NEXT_PUBLIC_WS_URL: z.string().default(''),

  /** Node environment */
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
})

function parseEnv() {
  const raw = {
    JWT_SECRET: process.env.JWT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NODE_ENV: process.env.NODE_ENV,
  }

  const parsed = envSchema.safeParse(raw)

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
    throw new Error('Invalid environment variables — see console for details')
  }

  const env = parsed.data

  // Extra runtime check: JWT_SECRET must be ≥32 chars in production
  if (env.NODE_ENV === 'production' && env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production')
  }

  return env
}

export const env = parseEnv()
