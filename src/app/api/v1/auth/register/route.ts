import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, organizationName } = body;

    // Validate inputs
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

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 8 characters' } },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { code: 'EMAIL_EXISTS', message: 'Email already registered' } },
        { status: 400 }
      );
    }

    // Create organization if name provided
    let organizationId: string | null = null;
    let role: 'orgadmin' | 'participant' = 'participant';

    if (organizationName && typeof organizationName === 'string' && organizationName.trim().length > 0) {
      const org = await db.organization.create({
        data: { name: organizationName.trim() },
      });
      organizationId = org.id;
      role = 'orgadmin';
    }

    // Hash password
    const passwordHash = await Bun.password.hash(password);

    // Create user
    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role,
        organizationId,
      },
    });

    // Create AuditLog entry
    await db.auditLog.create({
      data: {
        action: 'USER_REGISTERED',
        entityType: 'User',
        entityId: user.id,
        details: { name: user.name, email: user.email, role },
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An internal error occurred' } },
      { status: 500 }
    );
  }
}
