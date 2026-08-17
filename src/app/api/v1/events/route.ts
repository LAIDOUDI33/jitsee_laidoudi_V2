import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/api-auth';

export async function GET() {
  try {
    await requireAuth();

    const events = await db.event.findMany({
      include: {
        _count: { select: { registrations: true } },
      },
      orderBy: { startTime: 'desc' },
      take: 50,
    });

    const mapped = events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description ?? '',
      type: e.type,
      status: e.status,
      startTime: e.startTime.toISOString(),
      endTime: e.endTime?.toISOString() ?? null,
      maxAttendees: e.maxAttendees,
      registrants: e._count.registrations,
      recordingEnabled: e.recordingEnabled,
      createdAt: e.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data: { events: mapped } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('List events error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch events' } },
      { status: 500 }
    );
  }
}
