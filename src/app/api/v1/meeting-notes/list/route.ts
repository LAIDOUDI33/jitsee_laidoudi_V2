import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, AuthError, getOrgFilter } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const sort = searchParams.get('sort') || 'newest'

    const orgFilter = getOrgFilter(user)

    // Find meetings that have actual notes content (not the default "{}")
    // A meeting has notes if notes != '{}' and the parsed JSON has non-empty content
    const meetings = await db.meeting.findMany({
      where: {
        ...orgFilter,
        notes: { not: '{}' },
      },
      include: {
        host: { select: { id: true, name: true } },
        actionItems: { select: { id: true } },
      },
      orderBy: { createdAt: sort === 'oldest' ? 'asc' : 'desc' },
      take: 50,
    })

    // Filter to only meetings that have actual notes content
    // and include meetings that have summaries or action items even without custom notes
    const meetingsWithSummaries = await db.meetingSummary.findMany({
      where: {
        meeting: { ...orgFilter },
      },
      select: { meetingId: true },
      distinct: ['meetingId'],
    })

    const summaryMeetingIds = new Set(meetingsWithSummaries.map((m) => m.meetingId))

    // Get all meeting IDs we already have
    const existingIds = new Set(meetings.map((m) => m.id))

    // Fetch additional meetings that have summaries but weren't caught by notes filter
    const missingIds = [...summaryMeetingIds].filter((id) => !existingIds.has(id))
    let extraMeetings: typeof meetings = []
    if (missingIds.length > 0) {
      extraMeetings = await db.meeting.findMany({
        where: { id: { in: missingIds } },
        include: {
          host: { select: { id: true, name: true } },
          actionItems: { select: { id: true } },
        },
        orderBy: { createdAt: sort === 'oldest' ? 'asc' : 'desc' },
      })
    }

    const allMeetings = [...meetings, ...extraMeetings]

    // Parse notes and build response
    const result = allMeetings.map((m) => {
      let title = m.title
      let content = ''
      try {
        const parsed = JSON.parse(m.notes)
        if (parsed?.title) title = parsed.title
        if (parsed?.content) content = parsed.content
      } catch {
        // notes is not valid JSON
      }

      // Strip HTML for preview
      const plainText = content
        ? content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
        : ''

      return {
        id: m.id,
        title,
        content,
        preview: plainText.slice(0, 150) + (plainText.length > 150 ? '...' : ''),
        date: m.createdAt,
        startTime: m.startTime,
        hostName: m.host?.name ?? 'Unknown',
        actionItemsCount: m.actionItems.length,
        status: m.status,
      }
    })

    // Sort combined results
    result.sort((a, b) => {
      const dateA = new Date(a.startTime ?? a.date).getTime()
      const dateB = new Date(b.startTime ?? b.date).getTime()
      return sort === 'oldest' ? dateA - dateB : dateB - dateA
    })

    return NextResponse.json({ success: true, data: { notes: result } })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      )
    }
    console.error('List meeting notes error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch meeting notes' } },
      { status: 500 }
    )
  }
}
