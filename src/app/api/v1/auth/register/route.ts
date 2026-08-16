import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, validatePasswordStrength, createAccessToken, createRefreshToken, sanitizeString, getClientIp } from '@/lib/server/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, organizationName } = body;

    // ─── Input Validation ────────────────────────────────────────────
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Name must be at least 2 characters' } },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'A valid email is required' } },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 10) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 10 characters with uppercase, lowercase, number, and special character' } },
        { status: 400 }
      );
    }

    // ─── Password Strength Check ─────────────────────────────────────
    const strengthCheck = validatePasswordStrength(password);
    if (!strengthCheck.valid) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: strengthCheck.errors.join('. ') } },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const sanitizedName = sanitizeString(name, 100);

    // ─── Check if user already exists ────────────────────────────────
    const existingUser = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { code: 'EMAIL_EXISTS', message: 'Email already registered' } },
        { status: 409 }
      );
    }

    // ─── Create organization if name provided ────────────────────────
    let organizationId: string | null = null;
    let role: 'orgadmin' | 'participant' = 'participant';

    if (organizationName && typeof organizationName === 'string' && organizationName.trim().length > 0) {
      const sanitizedOrgName = sanitizeString(organizationName, 200);
      // Check if org already exists
      const existingOrg = await db.organization.findUnique({ where: { name: sanitizedOrgName } });
      if (existingOrg) {
        // Join existing org instead of creating duplicate
        organizationId = existingOrg.id;
        role = 'participant';
      } else {
        const org = await db.organization.create({
          data: { name: sanitizedOrgName },
        });
        organizationId = org.id;
        role = 'orgadmin';
      }
    }

    // ─── Hash Password (scrypt) ──────────────────────────────────────
    const passwordHash = hashPassword(password);

    // ─── Create User ─────────────────────────────────────────────────
    const user = await db.user.create({
      data: {
        name: sanitizedName,
        email: normalizedEmail,
        passwordHash,
        role,
        organizationId,
      },
    });

    // ─── AuditLog ────────────────────────────────────────────────────
    const clientIp = getClientIp(request);
    await db.auditLog.create({
      data: {
        action: 'USER_REGISTERED',
        resource: 'User',
        resourceId: user.id,
        userId: user.id,
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

    return NextResponse.json(
      { success: true, data: { user: { id: user.id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId }, accessToken, refreshToken } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An internal error occurred' } },
      { status: 500 }
    );
  }
}
