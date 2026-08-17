'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { Video, MessageSquare, Users, FileText, Shield, CheckCheck, Bell, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore, type NotificationItem } from '@/store/app-store'
import { authFetch, getAccessToken } from '@/lib/api'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

// ── Types ──────────────────────────────────────────────────────────────

interface ApiNotification {
  id: string
  type: string
  title: string
  description: string
  time: string
  timeGroup: string
  read: boolean
  sender: {
    name: string
    initials: string
    color: string
  }
}

// ── Icon mapping for notification types ────────────────────────────────

const typeToIcon: Record<string, NotificationItem['icon']> = {
  'meeting-invite': 'video',
  'meeting-soon': 'video',
  'message': 'message',
  'mention': 'message',
  'member-joined': 'users',
  'recording-ready': 'file',
  'ai-summary': 'file',
  'file-shared': 'file',
  'security-alert': 'shield',
  'system-update': 'shield',
  'maintenance': 'shield',
}

const iconMap: Record<NotificationItem['icon'], React.ReactNode> = {
  video: <Video className='h-4 w-4 text-cyan-500' />,
  message: <MessageSquare className='h-4 w-4 text-emerald-500' />,
  users: <Users className='h-4 w-4 text-violet-500' />,
  file: <FileText className='h-4 w-4 text-amber-500' />,
  shield: <Shield className='h-4 w-4 text-rose-500' />,
}

const iconBgMap: Record<NotificationItem['icon'], string> = {
  video: 'bg-cyan-100 dark:bg-cyan-950/50',
  message: 'bg-emerald-100 dark:bg-emerald-950/50',
  users: 'bg-violet-100 dark:bg-violet-950/50',
  file: 'bg-amber-100 dark:bg-amber-950/50',
  shield: 'bg-rose-100 dark:bg-rose-950/50',
}

// ── Helper: Map API notification to store-compatible item ─────────────

function mapApiToNotificationItem(n: ApiNotification): NotificationItem {
  return {
    id: n.id,
    icon: typeToIcon[n.type] || 'shield',
    title: n.title,
    description: n.description,
    time: n.time,
    unread: !n.read,
  }
}

// ── Component ──────────────────────────────────────────────────────────

export default function NotificationDropdown() {
  const {
    notificationCount: storeCount,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    setCurrentView,
  } = useAppStore()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const mountedRef = useRef(true)

  // Fetch notifications from the API
  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await authFetch('/api/v1/notifications')
      if (!res.ok) return
      const json = await res.json()
      if (json.success && json.data?.notifications) {
        const apiItems: NotificationItem[] = json.data.notifications.map(mapApiToNotificationItem)
        const unreadCount = apiItems.filter(n => n.unread).length

        // Replace all store notifications with API data
        // We clear and re-add to update the store properly
        const store = useAppStore.getState()
        // Reset notifications by re-setting the store
        useAppStore.setState({
          notifications: apiItems,
          notificationCount: unreadCount,
        })
      }
    } catch {
      // Silent — use existing store data as fallback
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // WebSocket connection for real-time notification updates
  useEffect(() => {
    mountedRef.current = true

    const connectWs = () => {
      const token = getAccessToken()
      if (!token) return

      // Connect to chat service via Caddy gateway
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/?XTransformPort=3010&token=${encodeURIComponent(token)}`

      let ws: WebSocket
      try {
        ws = new WebSocket(wsUrl)
      } catch {
        return
      }
      wsRef.current = ws

      ws.onopen = () => {
        if (!mountedRef.current) { ws.close(); return }
        setWsConnected(true)
        // Join the notifications channel
        ws.send(JSON.stringify({ type: 'join', channel: 'notifications' }))
      }

      ws.onmessage = (event) => {
        if (!mountedRef.current) return
        try {
          const data = JSON.parse(event.data as string)
          const { type, channel } = data as { type: string; channel?: string }

          // When a message arrives on the notifications channel, re-fetch
          if (channel === 'notifications' && (type === 'message' || type === 'user_joined_channel')) {
            fetchNotifications(true)
          }
        } catch {
          // ignore malformed
        }
      }

      ws.onclose = () => {
        if (!mountedRef.current) return
        setWsConnected(false)
        wsRef.current = null
        // Reconnect after 5s
        setTimeout(() => {
          if (mountedRef.current) connectWs()
        }, 5000)
      }

      ws.onerror = () => {
        // onclose fires after onerror
      }
    }

    // Delay connection slightly to avoid instant reconnect on HMR
    const timer = setTimeout(connectWs, 1000)

    return () => {
      mountedRef.current = false
      clearTimeout(timer)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [fetchNotifications])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchNotifications()
    setRefreshing(false)
  }

  const handleMarkAllRead = () => {
    markAllNotificationsRead()
    // Also mark as read in the API
    authFetch('/api/v1/notifications', { method: 'PUT', body: JSON.stringify({ markAllRead: true }) }).catch(() => {})
  }

  const handleMarkRead = (id: string) => {
    markNotificationRead(id)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='icon' className='relative h-9 w-9 rounded-lg transition-all duration-200 hover:bg-muted'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='18'
            height='18'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='text-muted-foreground'
          >
            <path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' />
            <path d='M10.3 21a1.94 1.94 0 0 0 3.4 0' />
          </svg>
          {storeCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className='absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white'
            >
              {storeCount > 9 ? '9+' : storeCount}
              <motion.span
                className='absolute inset-0 rounded-full bg-red-500'
                animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' as const }}
              />
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-[380px] p-0 rounded-xl shadow-lg border border-border/50 bg-card'>
        {/* Header */}
        <div className='flex items-center justify-between px-4 py-3 border-b border-border/50'>
          <div className='flex items-center gap-2'>
            <h3 className='text-sm font-semibold text-foreground'>Notifications</h3>
            <span className={cn(
              'inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full',
              wsConnected ? 'bg-emerald-500/10 text-emerald-600' : 'bg-zinc-500/10 text-zinc-500'
            )}>
              {wsConnected ? <Wifi className='h-2.5 w-2.5' /> : <WifiOff className='h-2.5 w-2.5' />}
              {wsConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          <div className='flex items-center gap-1'>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleRefresh}
              disabled={refreshing}
              className='h-7 px-2 text-xs text-muted-foreground hover:text-foreground transition-colors'
            >
              <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
            </Button>
            {storeCount > 0 && (
              <Button
                variant='ghost'
                size='sm'
                onClick={handleMarkAllRead}
                className='h-7 px-2 text-xs text-muted-foreground hover:text-foreground transition-colors'
              >
                <CheckCheck className='h-3.5 w-3.5 mr-1' />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Notification list */}
        <ScrollArea className='max-h-[360px]'>
          <div className='p-2'>
            {loading ? (
              <div className='space-y-3 p-2'>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className='flex items-start gap-3'>
                    <Skeleton className='h-8 w-8 rounded-lg shrink-0' />
                    <div className='flex-1 space-y-1.5'>
                      <Skeleton className='h-3.5 w-3/4' />
                      <Skeleton className='h-3 w-1/2' />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-8 text-muted-foreground'>
                <Bell className='h-8 w-8 mb-2 opacity-40' />
                <p className='text-sm'>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <motion.button
                  key={notification.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.2 }}
                  onClick={() => handleMarkRead(notification.id)}
                  className={cn(
                    'w-full flex items-start gap-3 rounded-lg p-3 text-left transition-all duration-200 group',
                    'hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent hover:shadow-sm',
                    notification.unread && 'bg-primary/5 dark:bg-primary/10'
                  )}
                >
                  {/* Icon */}
                  <div className={cn('shrink-0 h-8 w-8 rounded-lg flex items-center justify-center mt-0.5', iconBgMap[notification.icon])}>
                    {iconMap[notification.icon]}
                  </div>

                  {/* Content */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <p className={cn('text-sm truncate', notification.unread ? 'font-semibold text-foreground' : 'font-medium text-foreground')}>{notification.title}</p>
                      {notification.unread && (
                        <span className='shrink-0 h-2 w-2 rounded-full bg-red-500' />
                      )}
                    </div>
                    <p className='text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed'>{notification.description}</p>
                    <p className='text-[11px] text-muted-foreground/60 mt-1'>{notification.time}</p>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className='border-t border-border/50 px-4 py-2.5'>
          <Button
            variant='ghost'
            className='w-full h-8 text-xs text-muted-foreground hover:text-foreground transition-colors'
            onClick={() => useAppStore.getState().setCurrentView('notifications')}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
