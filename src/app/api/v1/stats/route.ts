import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, AuthError } from '@/lib/api-auth';

export async function GET() {
  try {
    // Require orgadmin or higher for stats access
    const user = await requireRole('orgadmin');

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Scope stats to user's organization where possible
    const [
      activeMeetings,
      totalUsers,
      totalOrganizations,
      totalRecordings,
      meetingsThisWeek,
      messagesThisWeek,
    ] = await Promise.all([
      db.meeting.count({
        where: {
          status: 'active',
          host: { organizationId: user.organizationId },
        },
      }),
      db.user.count({
        where: { organizationId: user.organizationId },
      }),
      db.organization.count(),
      db.recording.count(),
      db.meeting.count({
        where: {
          createdAt: { gte: weekAgo },
          host: { organizationId: user.organizationId },
        },
      }),
      db.message.count({
        where: { createdAt: { gte: weekAgo } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          activeMeetings,
          totalUsers,
          totalOrganizations,
          totalRecordings,
          meetingsThisWeek,
          messagesThisWeek,
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
    console.error('Stats error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch stats' } },
      { status: 500 }
    );
  }
}
