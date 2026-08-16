import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: Record<string, unknown> = {}

    if (type && type !== 'all') {
      where.type = type.toLowerCase()
    }
    if (status && status !== 'all') {
      where.status = status.toLowerCase()
    }
    if (dateFrom || dateTo) {
      where.startTime = {} as Record<string, unknown>
      if (dateFrom) (where.startTime as Record<string, unknown>).gte = new Date(dateFrom)
      if (dateTo) (where.startTime as Record<string, unknown>).lte = new Date(dateTo)
    }

    const [sessions, total] = await Promise.all([
      db.meeting.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          participants: {
            include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
          },
          recordings: { select: { id: true, duration: true, url: true, createdAt: true } },
          summaries: { select: { id: true, summary: true, topics: true, createdAt: true } },
        },
      }),
      db.meeting.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      sessions,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Sessions API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch session history' },
      { status: 500 }
    )
  }
}
