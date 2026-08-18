import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, AuthError, getOrgFilter } from '@/lib/api-auth';

export async function GET() {
  try {
    const user = await requireRole('orgadmin');
    const orgFilter = getOrgFilter(user);

    const users = await db.user.findMany({
      where: orgFilter,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        organization: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const userIds = users.map((u) => u.id);

    // Count meeting participations for all users in one query
    const participationCounts = await db.meetingParticipant.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _count: { id: true },
    });

    const countMap = new Map(
      participationCounts.map((p) => [p.userId, p._count.id])
    );

    const result = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar,
      isActive: u.isActive,
      lastLogin: u.lastLogin,
      organization: u.organization,
      meetingsAttended: countMap.get(u.id) ?? 0,
    }));

    return NextResponse.json({ success: true, data: { users: result } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('User activity error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch user activity' } },
      { status: 500 }
    );
  }
}
