import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/api-auth';

export async function GET() {
  try {
    await requireAuth();

    const summaries = await db.meetingSummary.findMany({
      include: {
        meeting: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const items = summaries.map((s) => {
      let topics: string[] = [];
      try { topics = JSON.parse(s.keyTopics); } catch { /* ignore */ }

      return {
        id: s.id,
        title: s.meeting?.title ? `${s.meeting.title} Summary` : 'Meeting Summary',
        content: s.summary,
        keyTopics: topics,
        type: 'meeting_summary' as const,
        createdAt: s.createdAt.toISOString(),
        duration: s.duration,
        participantCount: s.participantCount,
      };
    });

    return NextResponse.json({ success: true, data: { items } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('List knowledge error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch knowledge items' } },
      { status: 500 }
    );
  }
}
