import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      activeMeetings,
      totalUsers,
      totalOrganizations,
      totalRecordings,
      meetingsThisWeek,
      messagesThisWeek,
    ] = await Promise.all([
      db.meeting.count({ where: { status: 'active' } }),
      db.user.count(),
      db.organization.count(),
      db.recording.count(),
      db.meeting.count({ where: { createdAt: { gte: weekAgo } } }),
      db.message.count({ where: { createdAt: { gte: weekAgo } } }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        activeMeetings,
        totalUsers,
        totalOrganizations,
        totalRecordings,
        meetingsThisWeek,
        messagesThisWeek,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch stats' } },
      { status: 500 }
    );
  }
}
