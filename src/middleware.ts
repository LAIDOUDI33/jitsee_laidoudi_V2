import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractBearerToken, rateLimit } from './lib/jwt-edge';
import { ROLES_HIERARCHY } from './lib/roles';

// ─── Edge-Compatible Middleware for API Auth & Security Headers ───────────────

// ─── Route Configuration ─────────────────────────────────────────────────────

const PUBLIC_API_ROUTES = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/health',
  '/api/newsletter',
  '/api/contact',
];

const ROLE_REQUIRED: Record<string, string> = {
  '/api/v1/admin': 'superadmin',
  '/api/v1/users': 'orgadmin',
};

// ─── Security Headers ────────────────────────────────────────────────────────

const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(self), microphone=(self), display-capture=(self)',
  'Content-Security-Policy': [
    "default-src 'self'",
    // 'unsafe-inline' required for Next.js Turbopack hydration/HMR; tighten with nonces in production build
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' data:",
    // Allow WebSocket (wss/ws), API fetches, and Jitsi iframe connections
    "connect-src 'self' wss: ws: https://meet.jit.si",
    "frame-src https://meet.jit.si",
  ].join('; '),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRequiredRole(pathname: string): string | null {
  for (const [prefix, role] of Object.entries(ROLE_REQUIRED)) {
    if (pathname.startsWith(prefix)) return role;
  }
  return null;
}

function addSecurityHeaders(response: NextResponse, requestId: string): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  response.headers.set('x-request-id', requestId);
  return response;
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = crypto.randomUUID();

  // ── Non-API routes: add security headers and pass through ─────────────────
  if (!pathname.startsWith('/api/')) {
    return addSecurityHeaders(NextResponse.next(), requestId);
  }

  // ── Check if this is a public API route ───────────────────────────────────
  const isPublic = PUBLIC_API_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isPublic) {
    // Rate-limit auth endpoints
    if (pathname.includes('/auth/')) {
      const clientIp = getClientIp(request);
      const { allowed } = rateLimit(`auth:${clientIp}`, 10, 60000);
      if (!allowed) {
        return addSecurityHeaders(NextResponse.json(
          {
            success: false,
            error: {
              code: 'RATE_LIMITED',
              message: 'Too many requests. Please try again later.',
            },
          },
          { status: 429 }
        ), requestId);
      }
    }
    return addSecurityHeaders(NextResponse.next(), requestId);
  }

  // ── Protected API routes: require Bearer token ─────────────────────────────
  const token = extractBearerToken(request);
  if (!token) {
    return addSecurityHeaders(NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      },
      { status: 401 }
    ), requestId);
  }

  // ── Verify JWT ────────────────────────────────────────────────────────────
  const payload = await verifyAccessToken(token);
  if (!payload) {
    return addSecurityHeaders(NextResponse.json(
      {
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token is invalid or expired',
        },
      },
      { status: 401 }
    ), requestId);
  }

  // ── Rate limit authenticated API requests ─────────────────────────────────
  const clientIp = getClientIp(request);
  const { allowed } = rateLimit(`api:${clientIp}:${payload.userId}`, 120, 60000);
  if (!allowed) {
    return addSecurityHeaders(NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
        },
      },
      { status: 429 }
    ), requestId);
  }

  // ── RBAC check ────────────────────────────────────────────────────────────
  const requiredRole = getRequiredRole(pathname);
  if (requiredRole) {
    const userLevel = ROLES_HIERARCHY[payload.role] ?? 0;
    const requiredLevel = ROLES_HIERARCHY[requiredRole] ?? 0;
    if (userLevel < requiredLevel) {
      return addSecurityHeaders(NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
          },
        },
        { status: 403 }
      ), requestId);
    }
  }

  // ── Forward user identity as headers to downstream API handlers ───────────
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-role', payload.role);
  if (payload.organizationId) {
    requestHeaders.set('x-user-org-id', payload.organizationId);
  }

  return addSecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }), requestId);
}

// ─── Matcher: run on all routes except Next.js internals ──────────────────────

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
