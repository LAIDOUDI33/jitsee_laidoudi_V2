import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, AuthError } from '@/lib/api-auth';

export async function GET() {
  try {
    // Require orgadmin or higher to list users
    const user = await requireRole('orgadmin');

    const ROLE_LEVELS: Record<string, number> = {
      superadmin: 100,
      orgadmin: 80,
      teamadmin: 60,
      host: 40,
      participant: 20,
      guest: 10,
    };

    const userLevel = ROLE_LEVELS[user.role] ?? 0;
    const isOrgAdmin = userLevel >= 80;

    // Fetch users scoped to the requesting user's organization
    const users = await db.user.findMany({
      where: { organizationId: user.organizationId },
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organization: {
          select: { id: true, name: true },
        },
        lastLogin: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Strip PII (email) for non-superadmin viewers
    const sanitizedUsers = isOrgAdmin && user.role !== 'superadmin'
      ? users.map(u => ({
          ...u,
          email: undefined, // strip email for orgadmin
          lastLogin: undefined,
        }))
      : users;

    return NextResponse.json({
      success: true,
      data: { users: sanitizedUsers },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('List users error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch users' } },
      { status: 500 }
    );
  }
}
