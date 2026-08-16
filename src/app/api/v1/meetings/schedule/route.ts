import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/api-auth';
import { inputSanitize, inputSanitizeOptional, validateInt, validateDate } from '@/lib/security';
import { randomUUID } from 'crypto';

function generateMeetingId(): string {
  const group = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 3; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  return `${group()}-${group()}-${group()}`;
}

/**
 * POST /api/v1/meetings/schedule
 * Create a scheduled or recurring meeting with full options.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const {
      type = 'scheduled',
      scheduledAt,
      duration,
      waitingRoom = false,
      recordingEnabled = false,
      transcriptionEnabled = false,
      aiAssistantEnabled = true,
      muteOnEntry = false,
      description,
      participants = [],
      recurrence,
    } = body;

    // Validate required fields
    const title = inputSanitize(body.title, 200, 'Meeting title');

    // Validate meeting type
    const validTypes = ['instant', 'scheduled', 'recurring', 'personal'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: `Invalid meeting type: ${type}` } },
        { status: 400 }
      );
    }

    // Validate recurring fields
    if (type === 'recurring' && recurrence) {
      const validFrequencies = ['daily', 'weekly', 'biweekly', 'monthly'];
      if (!validFrequencies.includes(recurrence.frequency)) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: `Invalid recurrence frequency: ${recurrence.frequency}` } },
          { status: 400 }
        );
      }
      if (recurrence.endType === 'occurrences') {
        const n = validateInt(recurrence.occurrences, 1, 100, 0);
        if (n < 1) {
          return NextResponse.json(
            { success: false, error: { code: 'VALIDATION_ERROR', message: 'Recurrence occurrences must be between 1 and 100' } },
            { status: 400 }
          );
        }
      }
    }

    // Generate meeting ID using crypto.randomUUID for security
    const meetingId = randomUUID();

    // Build meeting data — force hostId from auth
    const meetingData: Record<string, unknown> = {
      title: title.trim(),
      meetingId,
      type,
      status: type === 'instant' ? 'active' : 'scheduled',
      waitingRoom,
      recordingEnabled,
      transcriptionEnabled,
      aiAssistantEnabled,
      host: { connect: { id: user.id } },
    };

    // Set scheduled start time if provided
    if (scheduledAt) {
      const startDate = validateDate(scheduledAt);
      if (startDate) {
        meetingData.startTime = startDate;
      }
    }

    // Store extras as JSON in a settings string
    const settings: Record<string, unknown> = {};
    const safeDuration = validateInt(duration, 5, 480, 0);
    if (safeDuration > 0) settings.duration = safeDuration;
    if (muteOnEntry) settings.muteOnEntry = true;
    const safeDescription = inputSanitizeOptional(description, 2000);
    if (safeDescription) settings.description = safeDescription;
    if (Array.isArray(participants) && participants.length > 0) {
      settings.participants = participants.slice(0, 50); // limit participants
    }
    if (recurrence) settings.recurrence = recurrence;
    meetingData.password = JSON.stringify(settings);

    // Create meeting
    const meeting = await db.meeting.create({
      data: meetingData as Parameters<typeof db.meeting.create>[0]['data'],
    });

    // Create host participant record
    await db.meetingParticipant.create({
      data: {
        meetingId: meeting.id,
        userId: user.id,
        role: 'host',
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'MEETING_SCHEDULED',
        resource: 'Meeting',
        resourceId: meeting.id,
        userId: user.id,
        details: JSON.stringify({
          meetingId: meeting.meetingId,
          title: meeting.title,
          type: meeting.type,
          scheduledAt: meeting.startTime,
          recurrence: recurrence || null,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        meeting: {
          id: meeting.id,
          title: meeting.title,
          meetingId: meeting.meetingId,
          type: meeting.type,
          status: meeting.status,
          scheduledAt: meeting.startTime,
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
    console.error('Schedule meeting error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to schedule meeting' } },
      { status: 500 }
    );
  }
}
