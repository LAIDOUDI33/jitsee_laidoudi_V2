import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, createAccessToken, createRefreshToken, rateLimit, getClientIp } from '@/lib/server/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // ─── Rate Limiting ───────────────────────────────────────────────
    const clientIp = getClientIp(request);
    const allowed = rateLimit(`login:${clientIp}`, 5, 300000); // 5 attempts per 5 min
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Please try again later.' } },
        { status: 429 }
      );
    }

    // ─── Input Validation ────────────────────────────────────────────
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ─── Lookup User ─────────────────────────────────────────────────
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      include: { organization: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: { code: 'ACCOUNT_DISABLED', message: 'Account is disabled. Contact your administrator.' } },
        { status: 403 }
      );
    }

    // ─── Verify Password (scrypt with timing-safe comparison) ────────
    const isValid = verifyPassword(password, user.passwordHash!);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    // ─── Update lastLogin ────────────────────────────────────────────
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // ─── Create AuditLog ─────────────────────────────────────────────
    await db.auditLog.create({
      data: {
        action: 'USER_LOGIN',
        resource: 'User',
        resourceId: user.id,
        userId: user.id,
        details: JSON.stringify({ email: user.email }),
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    // ─── Generate JWT Tokens ─────────────────────────────────────────
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      createAccessToken(tokenPayload),
      createRefreshToken(tokenPayload),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          organizationId: user.organizationId,
          organizationName: user.organization?.name ?? null,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An internal error occurred' } },
      { status: 500 }
    );
  }
}
