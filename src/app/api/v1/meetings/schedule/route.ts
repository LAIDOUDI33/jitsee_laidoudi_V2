import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function generateMeetingId(): string {
  const group = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz'
    let result = ''
    for (let i = 0; i < 3; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }
  return `${group()}-${group()}-${group()}`
}

/**
 * POST /api/v1/meetings/schedule
 * Create a scheduled or recurring meeting with full options.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
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
    } = body

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Meeting title is required' } },
        { status: 400 }
      )
    }

    // Validate meeting type
    const validTypes = ['instant', 'scheduled', 'recurring', 'personal']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: `Invalid meeting type: ${type}` } },
        { status: 400 }
      )
    }

    // Validate recurring fields
    if (type === 'recurring' && recurrence) {
      const validFrequencies = ['daily', 'weekly', 'biweekly', 'monthly']
      if (!validFrequencies.includes(recurrence.frequency)) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: `Invalid recurrence frequency: ${recurrence.frequency}` } },
          { status: 400 }
        )
      }
      if (recurrence.endType === 'occurrences') {
        const n = parseInt(recurrence.occurrences, 10)
        if (isNaN(n) || n < 1 || n > 100) {
          return NextResponse.json(
            { success: false, error: { code: 'VALIDATION_ERROR', message: 'Recurrence occurrences must be between 1 and 100' } },
            { status: 400 }
          )
        }
      }
    }

    // Generate meeting ID
    const meetingId = generateMeetingId()

    // Build meeting data
    const meetingData: Record<string, unknown> = {
      title: title.trim(),
      meetingId,
      type,
      status: type === 'instant' ? 'active' : 'scheduled',
      waitingRoom,
      recordingEnabled,
      transcriptionEnabled,
      aiAssistantEnabled,
    }

    // Set scheduled start time if provided
    if (scheduledAt) {
      try {
        meetingData.startTime = new Date(scheduledAt)
      } catch {
        // ignore invalid date
      }
    }

    // Store duration and muteOnEntry as JSON in a settings string
    // (schema has limited fields, so we encode extras)
    const settings: Record<string, unknown> = {}
    if (duration) settings.duration = duration
    if (muteOnEntry) settings.muteOnEntry = true
    if (description) settings.description = description
    if (participants.length > 0) settings.participants = participants
    if (recurrence) settings.recurrence = recurrence
    meetingData.password = JSON.stringify(settings)

    // Create meeting
    const meeting = await db.meeting.create({
      data: meetingData as Parameters<typeof db.meeting.create>[0]['data'],
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'MEETING_SCHEDULED',
        resource: 'Meeting',
        resourceId: meeting.id,
        details: JSON.stringify({
          meetingId: meeting.meetingId,
          title: meeting.title,
          type: meeting.type,
          scheduledAt: meeting.startTime,
          recurrence: recurrence || null,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      meeting: {
        id: meeting.id,
        title: meeting.title,
        meetingId: meeting.meetingId,
        type: meeting.type,
        status: meeting.status,
        scheduledAt: meeting.startTime,
        createdAt: meeting.createdAt,
      },
    })
  } catch (error) {
    console.error('Schedule meeting error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to schedule meeting' } },
      { status: 500 }
    )
  }
}
