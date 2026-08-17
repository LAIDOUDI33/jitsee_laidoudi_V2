import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, AuthError } from '@/lib/api-auth';

export async function GET() {
  try {
    await requireRole('superadmin');

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalOrganizations,
      totalMeetings,
      activeMeetings,
      totalRecordings,
      totalAuditLogs,
      recentActivity,
      recentUsers,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { isActive: true } }),
      db.user.count({ where: { isActive: false } }),
      db.organization.count(),
      db.meeting.count(),
      db.meeting.count({ where: { status: 'active' } }),
      db.recording.count(),
      db.auditLog.count(),
      db.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      db.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
    ]);

    const stats = {
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalOrganizations,
      totalMeetings,
      activeMeetings,
      totalRecordings,
      totalAuditLogs,
      recentActivity,
      recentUsers,
    };

    return NextResponse.json({ success: true, data: { stats } });
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
