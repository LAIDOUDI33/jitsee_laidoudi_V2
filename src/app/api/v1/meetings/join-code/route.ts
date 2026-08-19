import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body as { code?: string }

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Meeting code is required' } },
        { status: 400 }
      )
    }

    // Find meeting by meetingId (the public ID like "abc-def-ghi")
    const meeting = await db.meeting.findUnique({
      where: { meetingId: code.trim() },
      include: { host: { select: { id: true, name: true, email: true } } },
    })

    if (!meeting) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Meeting not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        meetingId: meeting.meetingId,
        title: meeting.title,
        hostName: meeting.host?.name || 'Unknown',
        requiresPassword: !!meeting.passwordHash || !!meeting.password,
        status: meeting.status,
      },
    })
  } catch (error) {
    console.error('Validate join code error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to validate join code' } },
      { status: 500 }
    )
  }
}
