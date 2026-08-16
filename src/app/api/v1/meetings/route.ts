import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function generateMeetingId(): string {
  const group = (): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 3; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  return `${group()}-${group()}-${group()}`;
}

export async function GET() {
  try {
    const meetings = await db.meeting.findMany({
      include: {
        host: { select: { id: true, name: true, email: true } },
        participants: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      meetings,
    });
  } catch (error) {
    console.error('List meetings error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch meetings' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, password, maxParticipants, meetingId: providedMeetingId, hostId } = body;

    // Generate meetingId if not provided
    const meetingId = providedMeetingId || generateMeetingId();

    // Default title
    const meetingTitle = title && typeof title === 'string' && title.trim().length > 0
      ? title.trim()
      : `Meeting ${meetingId}`;

    // Create Meeting record
    const meeting = await db.meeting.create({
      data: {
        title: meetingTitle,
        meetingId,
        password: password || null,
        maxParticipants: maxParticipants || null,
        status: 'active',
        hostId: hostId || null,
      },
    });

    // Create MeetingParticipant for the host
    if (hostId) {
      await db.meetingParticipant.create({
        data: {
          meetingId: meeting.id,
          userId: hostId,
          role: 'host',
        },
      });
    }

    // Create AuditLog entry
    await db.auditLog.create({
      data: {
        action: 'MEETING_CREATED',
        entityType: 'Meeting',
        entityId: meeting.id,
        details: { meetingId: meeting.meetingId, title: meeting.title },
      },
    });

    return NextResponse.json({
      success: true,
      meeting: {
        id: meeting.id,
        title: meeting.title,
        meetingId: meeting.meetingId,
        status: meeting.status,
        createdAt: meeting.createdAt,
      },
    });
  } catch (error) {
    console.error('Create meeting error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create meeting' } },
      { status: 500 }
    );
  }
}
