import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/api-auth';

/**
 * Format a Date to iCal UTC format: YYYYMMDDTHHmmssZ
 */
function toICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.[0-9]{3}/, '');
}

/**
 * Escape special iCal characters in text values
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get('meetingId');

    if (!meetingId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'meetingId query parameter is required' } },
        { status: 400 }
      );
    }

    // Find the meeting (by id or meetingId)
    const meeting = await db.meeting.findFirst({
      where: {
        OR: [
          { id: meetingId },
          { meetingId: meetingId },
        ],
      },
      include: {
        host: { select: { name: true } },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Meeting not found' } },
        { status: 404 }
      );
    }

    // Compute start/end times
    const startTime = meeting.startTime || meeting.createdAt;
    const settings = meeting.settings ? (() => { try { return JSON.parse(meeting.settings); } catch { return {}; } })() : {};
    const durationMinutes = settings.duration || 60;
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    const hostName = meeting.host?.name || 'ALVISION Host';
    const joinUrl = `https://alvision.ai/room/${meeting.meetingId}`;

    // Build iCal content
    const nowStamp = toICalDate(new Date());
    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ALVISION//Enterprise Video Conferencing//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `DTSTART:${toICalDate(startTime)}`,
      `DTEND:${toICalDate(endTime)}`,
      `DTSTAMP:${nowStamp}`,
      `UID:${meeting.meetingId}@alvision.ai`,
      `SUMMARY:${escapeICalText(meeting.title)}`,
      `DESCRIPTION:${escapeICalText(`Join via ALVISION\nHosted by ${hostName}\n${joinUrl}`)}`,
      `LOCATION:${escapeICalText(joinUrl)}`,
      'STATUS:CONFIRMED',
      `ORGANIZER;CN=${escapeICalText(hostName)}:mailto:organizer@alvision.ai`,
      'END:VEVENT',
      'END:VCALENDAR',
    ];

    const icsContent = icsLines.join('\r\n');

    // Return as downloadable .ics file
    const filename = `${meeting.title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_').slice(0, 50)}.ics`;

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('iCal export error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to export iCal' } },
      { status: 500 }
    );
  }
}
