import { db } from '@/lib/db'

/** Allowed notification type values */
export const NOTIFICATION_TYPES = [
  'meeting-invite',
  'meeting-soon',
  'mention',
  'recording-ready',
  'ai-summary',
  'file-shared',
  'member-joined',
  'security-alert',
  'maintenance',
  'system-update',
  'message',
  'general',
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export interface CreateNotificationInput {
  userId: string
  type: string
  title: string
  description?: string | null
  actionUrl?: string | null
  metadata?: Record<string, unknown> | null
}

/**
 * Create a single notification for a user.
 * Safe to call from any API route or server action.
 */
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  description?: string | null,
  actionUrl?: string | null,
  metadata?: Record<string, unknown> | null,
) {
  return db.notification.create({
    data: {
      userId,
      type,
      title,
      description: description ?? null,
      actionUrl: actionUrl ?? null,
      metadata: metadata ? JSON.stringify(metadata) : '{}',
    },
  })
}

/**
 * Create notifications for multiple users at once.
 * Uses createMany for efficiency.
 */
export async function createBulkNotifications(
  userIds: string[],
  type: string,
  title: string,
  description?: string | null,
  actionUrl?: string | null,
  metadata?: Record<string, unknown> | null,
) {
  if (userIds.length === 0) return { count: 0 }

  const metadataStr = metadata ? JSON.stringify(metadata) : '{}'

  const result = await db.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type,
      title,
      description: description ?? null,
      actionUrl: actionUrl ?? null,
      metadata: metadataStr,
    })),
  })

  return result
}
