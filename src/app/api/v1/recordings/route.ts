import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError, getOrgFilter } from '@/lib/api-auth';

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return m > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${h}h`;
  return `${m}m`;
}

function formatSizeBytes(bytes: number): string {
  if (bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${Math.round(mb)} MB`;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Pagination params
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const skip = (page - 1) * limit;

    const orgFilter = getOrgFilter(user);

    // Single recording lookup by id
    if (id) {
      const recording = await db.recording.findUnique({
        where: { id },
        include: {
          meeting: {
            include: {
              host: { select: { id: true, name: true, email: true } },
              participants: {
                include: {
                  user: { select: { id: true, name: true, email: true } },
                },
              },
            },
          },
        },
      });

      if (!recording) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Recording not found' } },
          { status: 404 }
        );
      }

      // Check org access
      if (orgFilter.organizationId && recording.meeting.organizationId !== orgFilter.organizationId) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
          { status: 403 }
        );
      }

      const meeting = recording.meeting;
      const durationSec = recording.duration || (
        meeting.startTime && meeting.endTime
          ? Math.round((new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime()) / 1000)
          : 0
      );

      return NextResponse.json({
        success: true,
        data: {
          recording: {
            id: recording.id,
            title: meeting.title,
            meetingId: meeting.meetingId,
            date: recording.createdAt ? new Date(recording.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown',
            duration: formatDuration(durationSec),
            durationSec,
            size: formatSizeBytes(recording.size),
            host: meeting.host?.name || 'Unknown',
            participants: meeting.participants?.length || 0,
            quality: recording.size > 100 * 1024 * 1024 ? 'HD' : 'SD',
          },
        },
      });
    }

    // List recordings
    const where: Record<string, unknown> = {
      meeting: orgFilter,
    };

    const [recordings, total] = await Promise.all([
      db.recording.findMany({
        where,
        include: {
          meeting: {
            include: {
              host: { select: { id: true, name: true, email: true } },
              participants: {
                include: {
                  user: { select: { id: true, name: true, email: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.recording.count({ where }),
    ]);

    const mapped = recordings.map(r => {
      const meeting = r.meeting;
      const durationSec = r.duration || (
        meeting.startTime && meeting.endTime
          ? Math.round((new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime()) / 1000)
          : 0
      );

      return {
        id: r.id,
        title: meeting.title,
        meetingId: meeting.meetingId,
        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown',
        duration: formatDuration(durationSec),
        durationSec,
        size: formatSizeBytes(r.size),
        host: meeting.host?.name || 'Unknown',
        participants: meeting.participants?.length || 0,
        quality: r.size > 100 * 1024 * 1024 ? 'HD' : 'SD',
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        recordings: mapped,
        total,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
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
    console.error('List recordings error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch recordings' } },
      { status: 500 }
    );
  }
}
