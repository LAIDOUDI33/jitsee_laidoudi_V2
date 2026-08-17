import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError, getOrgFilter } from '@/lib/api-auth';
import { inputSanitizeOptional, validateInt } from '@/lib/security';
import { hashPassword } from '@/lib/server/auth';
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
    const searchFilter = searchParams.get('search') || '';

    // Pagination params
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    // Apply organization isolation
    const orgFilter = getOrgFilter(user);
    Object.assign(where, orgFilter);
    if (statusFilter) {
      where.status = statusFilter;
    }
    if (searchFilter) {
      where.title = { contains: searchFilter };
    }

    const [meetings, total] = await Promise.all([
      db.meeting.findMany({
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
        skip,
        take: limit,
      }),
      db.meeting.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        meetings,
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
    const { title, maxParticipants, password } = body;

    // Generate meetingId using crypto.randomUUID for secure ID generation
    const meetingId = randomUUID();

    // Input validation — sanitize title
    const meetingTitle = inputSanitizeOptional(title, 200)
      ?? `Meeting ${generateMeetingId()}`;

    // Validate maxParticipants
    const maxParts = validateInt(maxParticipants, 2, 500, 100);

    // Force hostId from authenticated user — prevent hostId spoofing
    const hostId = user.id;

    // Hash meeting password if provided (scrypt, never store plaintext)
    const meetingData: Record<string, unknown> = {
      title: meetingTitle,
      meetingId,
      maxParticipants: maxParts,
      status: 'active',
      host: { connect: { id: hostId } },
    };
    if (password && typeof password === 'string' && password.trim().length > 0) {
      meetingData.passwordHash = hashPassword(password.trim());
      meetingData.password = null; // never write to deprecated plaintext field
    }

    // Create Meeting record
    const meeting = await db.meeting.create({
      data: meetingData as Parameters<typeof db.meeting.create>[0]['data'],
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
