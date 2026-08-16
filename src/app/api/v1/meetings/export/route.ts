import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const meetingId = searchParams.get('meetingId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Validate format
    if (!['csv', 'json', 'pdf-summary'].includes(format)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_FORMAT', message: 'Format must be csv, json, or pdf-summary' } },
        { status: 400 }
      );
    }

    // Build where clause
    const where: Prisma.MeetingWhereInput = {};

    if (meetingId) {
      where.id = meetingId;
    }

    if (dateFrom || dateTo) {
      where.startTime = {};
      if (dateFrom) {
        where.startTime.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.startTime.lte = new Date(dateTo);
      }
    }

    // Fetch meetings with participants and summaries
    const meetings = await db.meeting.findMany({
      where,
      include: {
        host: { select: { id: true, name: true, email: true } },
        participants: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        summaries: { take: 1, orderBy: { createdAt: 'desc' } },
        recordings: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (meetings.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No meetings found matching the criteria' } },
        { status: 404 }
      );
    }

    // ── CSV Export ──
    if (format === 'csv') {
      const header = 'Title,Type,Status,Start Time,End Time,Duration (min),Participants,Recording,AI Summary';
      const rows = meetings.map(m => {
        const participants = m.participants.map(p => p.user?.name || 'Unknown').join('; ');
        const duration = m.startTime && m.endTime
          ? Math.round((m.endTime.getTime() - m.startTime.getTime()) / 60000)
          : 'N/A';
        const recording = m.recordings.length > 0 ? 'Yes' : 'No';
        const summary = m.summaries[0]?.summary || 'N/A';
        const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
        return [
          esc(m.title), m.type, m.status,
          m.startTime?.toISOString() || 'N/A',
          m.endTime?.toISOString() || 'N/A',
          duration, esc(participants), recording, esc(summary),
        ].join(',');
      });
      const csv = [header, ...rows].join('\n');

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="meetings-export-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    // ── JSON Export ──
    if (format === 'json') {
      return new NextResponse(JSON.stringify({ success: true, meetings, exportedAt: new Date().toISOString() }, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="meetings-export-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      });
    }

    // ── PDF Summary (plain text) Export ──
    if (format === 'pdf-summary') {
      const lines: string[] = [];
      lines.push('═'.repeat(60));
      lines.push('ALVISION — Meeting Export Summary');
      lines.push(`Generated: ${new Date().toLocaleString()}`);
      lines.push('═'.repeat(60));
      lines.push('');

      meetings.forEach((m, idx) => {
        const duration = m.startTime && m.endTime
          ? Math.round((m.endTime.getTime() - m.startTime.getTime()) / 60000)
          : null;
        lines.push(`── Meeting ${idx + 1} ──`);
        lines.push(`Title:     ${m.title}`);
        lines.push(`Type:      ${m.type}`);
        lines.push(`Status:    ${m.status}`);
        lines.push(`Host:      ${m.host?.name || 'N/A'}`);
        lines.push(`Start:     ${m.startTime?.toLocaleString() || 'N/A'}`);
        lines.push(`End:       ${m.endTime?.toLocaleString() || 'N/A'}`);
        if (duration !== null) lines.push(`Duration:  ${duration} minutes`);
        lines.push(`Participants (${m.participants.length}):`);
        m.participants.forEach(p => {
          lines.push(`  - ${p.user?.name || 'Unknown'} (${p.role})`);
        });
        if (m.summaries[0]) {
          lines.push(`AI Summary:`);
          lines.push(`  ${m.summaries[0].summary}`);
        }
        lines.push('');
      });

      lines.push('═'.repeat(60));
      lines.push(`Total meetings exported: ${meetings.length}`);
      lines.push('═'.repeat(60));

      const text = lines.join('\n');

      return new NextResponse(text, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="meetings-summary-${new Date().toISOString().slice(0, 10)}.txt"`,
        },
      });
    }

    // Fallback (should not reach here due to validation above)
    return NextResponse.json(
      { success: false, error: { code: 'UNKNOWN_FORMAT', message: 'Unsupported export format' } },
      { status: 400 }
    );
  } catch (error) {
    console.error('Export meetings error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to export meetings' } },
      { status: 500 }
    );
  }
}
