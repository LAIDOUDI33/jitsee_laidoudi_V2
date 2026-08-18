/**
 * Organization Member Management API
 * GET    — List all members in the user's org (orgadmin+)
 * POST   — Invite new member (orgadmin+)
 * PUT    — Update member role / isActive (orgadmin+)
 * DELETE — Remove member from org (orgadmin+)
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireOrgAdmin, AuthError } from '@/lib/api-auth';
import { inputSanitizeOptional, validateInt, validateUuid, SecurityError } from '@/lib/security';
import { hashPassword } from '@/lib/server/auth';
import { ROLES, ROLES_HIERARCHY } from '@/lib/roles';
import { headers } from 'next/headers';
import { randomUUID } from 'crypto';

const VALID_ROLES = [ROLES.ORGADMIN, ROLES.TEAMADMIN, ROLES.HOST, ROLES.PARTICIPANT, ROLES.GUEST] as const;

export async function GET(request: NextRequest) {
  try {
    const user = await requireOrgAdmin();

    if (!user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_ORG', message: 'User does not belong to an organization' } },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = inputSanitizeOptional(searchParams.get('search'), 200);
    const roleFilter = inputSanitizeOptional(searchParams.get('role'), 50);
    const statusFilter = searchParams.get('status'); // 'active' or 'inactive'

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { organizationId: user.organizationId };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (roleFilter) {
      where.role = roleFilter;
    }
    if (statusFilter === 'active') {
      where.isActive = true;
    } else if (statusFilter === 'inactive') {
      where.isActive = false;
    }

    const [members, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        members,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('List org members error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list members' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireOrgAdmin();

    if (!user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_ORG', message: 'User does not belong to an organization' } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const email = inputSanitizeOptional(body.email, 254);
    const name = inputSanitizeOptional(body.name, 200);
    const role = inputSanitizeOptional(body.role, 50);

    if (!email) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Email is required' } },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Name is required' } },
        { status: 400 }
      );
    }

    const resolvedRole = (role && VALID_ROLES.includes(role as typeof VALID_ROLES[number]))
      ? role
      : ROLES.PARTICIPANT;

    // Check user limit
    const org = await db.organization.findUnique({
      where: { id: user.organizationId },
    });
    if (!org) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Organization not found' } },
        { status: 404 }
      );
    }

    const currentCount = await db.user.count({
      where: { organizationId: user.organizationId },
    });
    if (currentCount >= org.maxUsers) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_LIMIT_REACHED', message: `Organization has reached its maximum of ${org.maxUsers} users` } },
        { status: 400 }
      );
    }

    // Check for duplicate email within the same org
    const existingUser = await db.user.findUnique({
      where: { email },
    });
    if (existingUser && existingUser.organizationId === user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_EXISTS', message: 'A user with this email already exists in the organization' } },
        { status: 409 }
      );
    }

    // Generate a temporary password for the invite
    const tempPassword = randomUUID();
    const newUserId = randomUUID();

    const newMember = await db.user.create({
      data: {
        id: newUserId,
        email,
        name,
        role: resolvedRole,
        organizationId: user.organizationId,
        passwordHash: hashPassword(tempPassword),
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Audit log
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null;
    const ua = headersList.get('user-agent') || null;
    await db.auditLog.create({
      data: {
        action: 'MEMBER_INVITED',
        resource: 'User',
        resourceId: newMember.id,
        userId: user.id,
        details: JSON.stringify({ email: newMember.email, role: newMember.role, name: newMember.name }),
        ipAddress: ip,
        userAgent: ua,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        member: newMember,
        inviteEmailSent: true, // placeholder — email integration would go here
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    if (error instanceof SecurityError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Invite member error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to invite member' } },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireOrgAdmin();

    if (!user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_ORG', message: 'User does not belong to an organization' } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const targetUserId = validateUuid(body.userId, 'userId');
    const newRole = inputSanitizeOptional(body.role, 50);
    const isActive = body.isActive;

    // Fetch target user
    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, email: true, role: true, isActive: true, organizationId: true },
    });

    if (!targetUser || targetUser.organizationId !== user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Member not found in this organization' } },
        { status: 404 }
      );
    }

    // orgadmin cannot change a superadmin's role
    if (targetUser.role === ROLES.SUPERADMIN) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Cannot modify a superadmin user' } },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const changes: string[] = [];

    if (newRole) {
      if (!VALID_ROLES.includes(newRole as typeof VALID_ROLES[number])) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_ROLE', message: `Role must be one of: ${VALID_ROLES.join(', ')}` } },
          { status: 400 }
        );
      }

      // orgadmin cannot assign roles above their own level (cannot assign orgadmin to someone if they aren't superadmin)
      if (user.role !== ROLES.SUPERADMIN && newRole === ROLES.ORGADMIN) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Only superadmins can assign orgadmin role' } },
          { status: 403 }
        );
      }

      updateData.role = newRole;
      changes.push(`role -> ${newRole}`);
    }

    if (isActive !== undefined && isActive !== null) {
      const active = Boolean(isActive);
      updateData.isActive = active;
      changes.push(`isActive -> ${active}`);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_CHANGES', message: 'No valid fields to update' } },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id: targetUserId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Audit log
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null;
    const ua = headersList.get('user-agent') || null;
    await db.auditLog.create({
      data: {
        action: 'MEMBER_UPDATED',
        resource: 'User',
        resourceId: targetUserId,
        userId: user.id,
        details: JSON.stringify({ email: targetUser.email, changes }),
        ipAddress: ip,
        userAgent: ua,
      },
    });

    return NextResponse.json({
      success: true,
      data: { member: updatedUser },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    if (error instanceof SecurityError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Update member error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update member' } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireOrgAdmin();

    if (!user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_ORG', message: 'User does not belong to an organization' } },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = validateUuid(searchParams.get('userId'), 'userId');

    // Cannot remove yourself
    if (targetUserId === user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Cannot remove yourself from the organization' } },
        { status: 403 }
      );
    }

    // Fetch target user
    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, email: true, role: true, organizationId: true },
    });

    if (!targetUser || targetUser.organizationId !== user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Member not found in this organization' } },
        { status: 404 }
      );
    }

    // Cannot remove superadmins
    if (targetUser.role === ROLES.SUPERADMIN) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Cannot remove a superadmin user' } },
        { status: 403 }
      );
    }

    // Remove from org by setting organizationId to null
    await db.user.update({
      where: { id: targetUserId },
      data: { organizationId: null },
    });

    // Audit log
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null;
    const ua = headersList.get('user-agent') || null;
    await db.auditLog.create({
      data: {
        action: 'MEMBER_REMOVED',
        resource: 'User',
        resourceId: targetUserId,
        userId: user.id,
        details: JSON.stringify({ email: targetUser.email, name: targetUser.name }),
        ipAddress: ip,
        userAgent: ua,
      },
    });

    return NextResponse.json({
      success: true,
      data: { removed: true, userId: targetUserId },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    if (error instanceof SecurityError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Remove member error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to remove member' } },
      { status: 500 }
    );
  }
}
