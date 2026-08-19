import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, AuthError } from '@/lib/api-auth'
import { hasMinimumRole, ROLES } from '@/lib/roles'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const body = await request.json()
    const { emails, message } = body as {
      emails?: string[]
      message?: string
    }

    // Validate emails
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'At least one email is required' } },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = emails.filter((e) => !emailRegex.test(e))
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: `Invalid email(s): ${invalidEmails.join(', ')}` } },
        { status: 400 }
      )
    }

    if (emails.length > 50) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Maximum 50 emails per invite' } },
        { status: 400 }
      )
    }

    // Look up meeting
    const meeting = await db.meeting.findUnique({
      where: { id },
      include: { host: { select: { id: true, name: true, email: true } } },
    })

    if (!meeting) {
      return NextResponse.json(
        { success: false, error: { code: 'MEETING_NOT_FOUND', message: 'Meeting not found' } },
        { status: 404 }
      )
    }

    // Authorization: user must be host, participant, or orgadmin+
    const isAdmin = hasMinimumRole(user.role, ROLES.ORGADMIN)
    const isHost = meeting.hostId === user.id

    if (!isHost && !isAdmin) {
      const participant = await db.meetingParticipant.findUnique({
        where: { meetingId_userId: { meetingId: id, userId: user.id } },
      })
      if (!participant) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to this meeting' } },
          { status: 403 }
        )
      }
    }

    // Audit log the invite action
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'MEETING_INVITE_SENT',
        resource: 'Meeting',
        resourceId: id,
        details: JSON.stringify({
          recipientCount: emails.length,
          recipients: emails,
          hasCustomMessage: !!message,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    // In a real implementation, you would send emails here via an email service.
    // For now, we just validate and return success.

    return NextResponse.json({
      success: true,
      data: { sent: emails.length },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      )
    }
    console.error('Send meeting invite error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to send invite' } },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const meeting = await db.meeting.findUnique({
      where: { id },
      include: { host: { select: { id: true, name: true, email: true } } },
    })

    if (!meeting) {
      return NextResponse.json(
        { success: false, error: { code: 'MEETING_NOT_FOUND', message: 'Meeting not found' } },
        { status: 404 }
      )
    }

    // Authorization: user must be host, participant, or orgadmin+
    const isAdmin = hasMinimumRole(user.role, ROLES.ORGADMIN)
    const isHost = meeting.hostId === user.id

    if (!isHost && !isAdmin) {
      const participant = await db.meetingParticipant.findUnique({
        where: { meetingId_userId: { meetingId: id, userId: user.id } },
      })
      if (!participant) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to this meeting' } },
          { status: 403 }
        )
      }
    }

    const joinUrl = `https://alvision.ai/join/${meeting.meetingId}`

    // Parse settings to extract password if present (backward compat)
    let meetingPassword: string | undefined
    if (meeting.password) {
      meetingPassword = meeting.password
    }

    return NextResponse.json({
      success: true,
      data: {
        meetingId: meeting.meetingId,
        title: meeting.title,
        joinUrl,
        hostName: meeting.host?.name || 'Unknown',
        startTime: meeting.startTime?.toISOString() || undefined,
        password: meetingPassword,
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      )
    }
    console.error('Get meeting invite info error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get invite info' } },
      { status: 500 }
    )
  }
}
