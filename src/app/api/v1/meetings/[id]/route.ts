import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Meeting ID is required' } },
        { status: 400 }
      );
    }

    const meeting = await db.meeting.findUnique({
      where: { id },
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

    return NextResponse.json({
      success: true,
      meeting,
    });
  } catch (error) {
    console.error('Get meeting error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch meeting' } },
      { status: 500 }
    );
  }
}
