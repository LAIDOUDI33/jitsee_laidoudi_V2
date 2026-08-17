import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, AuthError } from '@/lib/api-auth';
import { hashPassword } from '@/lib/server/auth';

export async function GET(request: Request) {
  try {
    await requireRole('superadmin');

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (role) {
      where.role = role;
    }
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'suspended') {
      where.isActive = false;
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mfaEnabled: true,
        lastLogin: true,
        createdAt: true,
        organization: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const roleCounts = await db.user.groupBy({
      by: ['role'],
      _count: { id: true },
    });

    const activeCount = await db.user.count({ where: { isActive: true } });
    const suspendedCount = await db.user.count({ where: { isActive: false } });
    const statusCounts = {
      active: activeCount,
      suspended: suspendedCount,
    };

    return NextResponse.json({ success: true, data: { users, roleCounts, statusCounts } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Admin API error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Operation failed' } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await requireRole('superadmin');

    const body = await request.json();
    const { userId, action, role } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'userId and action are required' } },
        { status: 400 }
      );
    }

    const validActions = ['suspend', 'reactivate', 'updateRole'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: `Invalid action. Must be one of: ${validActions.join(', ')}` } },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (action === 'suspend') {
      updateData.isActive = false;
    } else if (action === 'reactivate') {
      updateData.isActive = true;
    } else if (action === 'updateRole') {
      if (!role) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'role is required for updateRole action' } },
          { status: 400 }
        );
      }
      const validRoles = ['superadmin', 'orgadmin', 'teamadmin', 'host', 'participant', 'guest'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: `Invalid role. Must be one of: ${validRoles.join(', ')}` } },
          { status: 400 }
        );
      }
      updateData.role = role;
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        organization: { select: { id: true, name: true } },
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: { user: updatedUser } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Admin API error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Operation failed' } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireRole('superadmin');

    const body = await request.json();
    const { name, email, password, role, organizationName } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'name, email, and password are required' } },
        { status: 400 }
      );
    }

    const validRoles = ['superadmin', 'orgadmin', 'teamadmin', 'host', 'participant', 'guest'];
    const userRole = role && validRoles.includes(role) ? role : 'participant';

    let organizationId: string | undefined;
    if (organizationName) {
      let org = await db.organization.findUnique({ where: { name: organizationName } });
      if (!org) {
        org = await db.organization.create({
          data: { name: organizationName },
        });
      }
      organizationId = org.id;
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'User with this email already exists' } },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);

    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: userRole,
        organizationId: organizationId || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        organization: { select: { id: true, name: true } },
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: { user } }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Admin API error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Operation failed' } },
      { status: 500 }
    );
  }
}
