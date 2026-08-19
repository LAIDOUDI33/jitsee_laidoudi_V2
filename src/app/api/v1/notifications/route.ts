import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, requireRole, AuthError } from '@/lib/api-auth'
import { ROLES } from '@/lib/roles'
import { NOTIFICATION_TYPES } from '@/lib/notifications'

// ── Helpers ──────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  return `${weeks}w ago`
}

function getTimeGroup(date: Date): string {
  const now = new Date()
  // Reset time parts to compare dates only
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (targetDate.getTime() >= today.getTime()) return 'Today'
  if (targetDate.getTime() >= yesterday.getTime()) return 'Yesterday'
  return 'Earlier'
}

// ── GET: List notifications ──────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20))
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const type = searchParams.get('type')

    const where: Record<string, unknown> = { userId: user.id }

    if (unreadOnly) {
      where.read = false
    }

    if (type && (NOTIFICATION_TYPES as readonly string[]).includes(type)) {
      where.type = type
    }

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.notification.count({ where }),
      db.notification.count({ where: { userId: user.id, read: false } }),
    ])

    const mapped = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      description: n.description,
      read: n.read,
      pinned: n.pinned,
      actionUrl: n.actionUrl,
      metadata: n.metadata,
      createdAt: n.createdAt.toISOString(),
      timeAgo: timeAgo(n.createdAt),
      timeGroup: getTimeGroup(n.createdAt),
    }))

    return NextResponse.json({
      success: true,
      data: {
        notifications: mapped,
        pagination: {
          page,
          limit,
          total,
          unreadCount,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      )
    }
    console.error('List notifications error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch notifications' } },
      { status: 500 },
    )
  }
}

// ── POST: Create notification (superadmin / orgadmin only) ───────────

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(ROLES.ORGADMIN)

    const body = await request.json()
    const { userId, type, title, description, actionUrl, metadata } = body

    if (!userId || !type || !title) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'userId, type, and title are required' } },
        { status: 400 },
      )
    }

    if (!(NOTIFICATION_TYPES as readonly string[]).includes(type)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: `Invalid notification type. Must be one of: ${NOTIFICATION_TYPES.join(', ')}` } },
        { status: 400 },
      )
    }

    const notification = await db.notification.create({
      data: {
        userId,
        type,
        title,
        description: description ?? null,
        actionUrl: actionUrl ?? null,
        metadata: metadata ? JSON.stringify(metadata) : '{}',
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        notification: {
          id: notification.id,
          userId: notification.userId,
          type: notification.type,
          title: notification.title,
          description: notification.description,
          read: notification.read,
          pinned: notification.pinned,
          actionUrl: notification.actionUrl,
          metadata: notification.metadata,
          createdAt: notification.createdAt.toISOString(),
        },
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      )
    }
    console.error('Create notification error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create notification' } },
      { status: 500 },
    )
  }
}

// ── PUT: Mark notifications as read ──────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()

    const body = await request.json()
    const { ids, markAllRead } = body as { ids?: string[]; markAllRead?: boolean }

    if (markAllRead) {
      await db.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true },
      })

      const unreadCount = await db.notification.count({ where: { userId: user.id, read: false } })
      return NextResponse.json({
        success: true,
        data: { unreadCount },
      })
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ids array or markAllRead is required' } },
        { status: 400 },
      )
    }

    await db.notification.updateMany({
      where: { id: { in: ids }, userId: user.id },
      data: { read: true },
    })

    const unreadCount = await db.notification.count({ where: { userId: user.id, read: false } })
    return NextResponse.json({
      success: true,
      data: { unreadCount },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      )
    }
    console.error('Mark notifications read error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update notifications' } },
      { status: 500 },
    )
  }
}

// ── DELETE: Delete notifications ─────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth()

    const body = await request.json()
    const { ids, deleteAll } = body as { ids?: string[]; deleteAll?: boolean }

    if (deleteAll) {
      const result = await db.notification.deleteMany({
        where: { userId: user.id },
      })
      return NextResponse.json({
        success: true,
        data: { deletedCount: result.count },
      })
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ids array or deleteAll is required' } },
        { status: 400 },
      )
    }

    const result = await db.notification.deleteMany({
      where: { id: { in: ids }, userId: user.id },
    })

    return NextResponse.json({
      success: true,
      data: { deletedCount: result.count },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      )
    }
    console.error('Delete notifications error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete notifications' } },
      { status: 500 },
    )
  }
}
