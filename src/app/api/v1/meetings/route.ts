import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/api-auth';
import { inputSanitizeOptional, validateInt } from '@/lib/security';
import { randomUUID } from 'crypto';

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

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (statusFilter) {
      where.status = statusFilter;
    }

    const meetings = await db.meeting.findMany({
      where,
      include: {
        host: { select: { id: true, name: true, email: true } },
        participants: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        recordings: { select: { id: true, duration: true, size: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: { meetings },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('List meetings error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch meetings' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { title, maxParticipants } = body;

    // Generate meetingId using crypto.randomUUID for secure ID generation
    const meetingId = randomUUID();

    // Input validation — sanitize title
    const meetingTitle = inputSanitizeOptional(title, 200)
      ?? `Meeting ${generateMeetingId()}`;

    // Validate maxParticipants
    const maxParts = validateInt(maxParticipants, 2, 500, 100);

    // Force hostId from authenticated user — prevent hostId spoofing
    const hostId = user.id;

    // Create Meeting record
    const meeting = await db.meeting.create({
      data: {
        title: meetingTitle,
        meetingId,
        maxParticipants: maxParts,
        status: 'active',
        host: { connect: { id: hostId } },
      },
    });

    // Create MeetingParticipant for the host
    await db.meetingParticipant.create({
      data: {
        meetingId: meeting.id,
        userId: hostId,
        role: 'host',
      },
    });

    // Create AuditLog entry
    await db.auditLog.create({
      data: {
        action: 'MEETING_CREATED',
        resource: 'Meeting',
        resourceId: meeting.id,
        userId: hostId,
        details: JSON.stringify({ meetingId: meeting.meetingId, title: meeting.title }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        meeting: {
          id: meeting.id,
          title: meeting.title,
          meetingId: meeting.meetingId,
          status: meeting.status,
          createdAt: meeting.createdAt,
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
    console.error('Create meeting error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create meeting' } },
      { status: 500 }
    );
  }
}
