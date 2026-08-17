import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/api-auth';
import { validateUuid } from '@/lib/security';
import { verifyPassword } from '@/lib/server/auth';
import { hasMinimumRole, ROLES } from '@/lib/roles';

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
    const isAdmin = hasMinimumRole(user.role, ROLES.ORGADMIN);

    const isHost = meeting.hostId === user.id;
    const isParticipant = meeting.participants.some(p => p.userId === user.id);

    // Password-protected meeting: verify password if provided via query param
    if (meeting.passwordHash && !isHost && !isParticipant && !isAdmin) {
      const { searchParams } = new URL(request.url);
      const suppliedPassword = searchParams.get('password');
      if (!suppliedPassword || !verifyPassword(suppliedPassword, meeting.passwordHash)) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Incorrect or missing meeting password' } },
          { status: 403 }
        );
      }
    }

    if (!isHost && !isParticipant && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to this meeting' } },
        { status: 403 }
      );
    }

    // Never expose passwordHash to the client
    const { passwordHash: _ph, password: _pw, ...safeMeeting } = meeting;

    return NextResponse.json({
      success: true,
      data: { meeting: safeMeeting },
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
