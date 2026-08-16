import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/api-auth';
import { validateUuid } from '@/lib/security';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Validate UUID format
    const meetingDbId = validateUuid(id, 'Meeting ID');

    const meeting = await db.meeting.findUnique({
      where: { id: meetingDbId },
      include: {
        host: { select: { id: true, name: true, email: true } },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { success: false, error: { code: 'MEETING_NOT_FOUND', message: 'Meeting not found' } },
        { status: 404 }
      );
    }

    // Authorization: user must be participant, host, or orgadmin+
    const ROLE_LEVELS: Record<string, number> = {
      superadmin: 100,
      orgadmin: 80,
      teamadmin: 60,
      host: 40,
      participant: 20,
      guest: 10,
    };

    const userLevel = ROLE_LEVELS[user.role] ?? 0;
    const isAdmin = userLevel >= 80; // orgadmin or superadmin

    const isHost = meeting.hostId === user.id;
    const isParticipant = meeting.participants.some(p => p.userId === user.id);

    if (!isHost && !isParticipant && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to this meeting' } },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { meeting },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Get meeting error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch meeting' } },
      { status: 500 }
    );
  }
}
