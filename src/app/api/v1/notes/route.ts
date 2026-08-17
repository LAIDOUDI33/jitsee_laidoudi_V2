import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/api-auth';

export async function GET() {
  try {
    await requireAuth();

    const summaries = await db.meetingSummary.findMany({
      include: {
        meeting: {
          select: { title: true, meetingId: true, startTime: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const notes = summaries.map((s) => {
      let topics: string[] = [];
      let decisions: string[] = [];
      try { topics = JSON.parse(s.keyTopics); } catch { /* ignore */ }
      try { decisions = JSON.parse(s.decisions); } catch { /* ignore */ }

      return {
        id: s.id,
        meetingId: s.meetingId,
        title: s.meeting?.title ?? 'Untitled Meeting',
        meetingCode: s.meeting?.meetingId ?? '',
        startTime: s.meeting?.startTime?.toISOString() ?? null,
        content: s.summary,
        keyTopics: topics,
        decisions,
        duration: s.duration,
        participantCount: s.participantCount,
        createdAt: s.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ success: true, data: { notes } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('List notes error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch notes' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { meetingId, content } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Content is required' } },
        { status: 400 }
      );
    }

    // Find or create a meeting to link the note to
    let targetMeetingId = meetingId;
    if (!targetMeetingId) {
      const meeting = await db.meeting.create({
        data: {
          title: 'Note: ' + content.slice(0, 50),
          meetingId: crypto.randomUUID(),
          status: 'ended',
          hostId: user.id,
          organizationId: user.organizationId,
        },
      });
      targetMeetingId = meeting.id;
    }

    const summary = await db.meetingSummary.create({
      data: {
        meetingId: targetMeetingId,
        summary: content,
        keyTopics: '[]',
        decisions: '[]',
        risks: '[]',
      },
    });

    return NextResponse.json({
      success: true,
      data: { note: { id: summary.id, content: summary.summary, createdAt: summary.createdAt.toISOString() } },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Create note error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create note' } },
      { status: 500 }
    );
  }
}
