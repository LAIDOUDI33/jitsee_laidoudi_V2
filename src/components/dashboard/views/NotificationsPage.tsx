'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { authFetch } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Bell,
  CheckCheck,
  Video,
  MessageSquare,
  Users,
  FileText,
  Shield,
  Bot,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Pin,
  PinOff,
  Trash2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  CalendarClock,
  FolderOpen,
  UserPlus,
  Wrench,
  Megaphone,
  AtSign,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────

type NotificationType =
  | 'meeting-invite'
  | 'mention'
  | 'recording-ready'
  | 'ai-summary'
  | 'file-shared'
  | 'member-joined'
  | 'security-alert'
  | 'maintenance'
  | 'meeting-soon'
  | 'system-update'
  | 'message'
  | 'general'

type NotificationCategory = 'all' | 'unread' | 'mentions' | 'meetings' | 'system'
type TabCategory = 'recent' | 'mentions' | 'meeting-alerts' | 'system-updates'

type TimeGroup = 'Today' | 'Yesterday' | 'Earlier'

interface Notification {
  id: string
  type: NotificationType
  sender: {
    name: string
    initials: string
    color: string
  }
  title: string
  description: string
  detail: string
  timestamp: string
  timeGroup: TimeGroup
  unread: boolean
  pinned: boolean
  actions?: { label: string; variant: 'default' | 'outline' | 'destructive'; onClickLabel: string }[]
}

// ── Mock Data ──────────────────────────────────────────────────────────

const avatarColors = [
  'bg-emerald-500/15 text-emerald-600',
  'bg-violet-500/15 text-violet-600',
  'bg-amber-500/15 text-amber-600',
  'bg-rose-500/15 text-rose-600',
  'bg-cyan-500/15 text-cyan-600',
  'bg-orange-500/15 text-orange-600',
  'bg-teal-500/15 text-teal-600',
  'bg-pink-500/15 text-pink-600',
]

const fallbackNotifications: Notification[] = []

function mapApiNotification(n: { id: string; type: string; title: string; description: string; time: string; timeGroup: string; read: boolean; sender: { name: string; initials: string; color: string } }): Notification {
  return {
    id: n.id,
    type: n.type as NotificationType,
    sender: { name: n.sender.name, initials: n.sender.initials, color: n.sender.color },
    title: n.title,
    description: n.description,
    detail: n.description,
    timestamp: n.time,
    timeGroup: n.timeGroup as TimeGroup,
    unread: !n.read,
    pinned: false,
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────

const iconConfig: Record<NotificationType, { icon: React.ReactNode; bgColor: string }> = {
  'meeting-invite': { icon: <Video className='h-4 w-4' />, bgColor: 'bg-gradient-to-br from-blue-500/20 to-blue-500/5 text-blue-600' },
  'mention': { icon: <AtSign className='h-4 w-4' />, bgColor: 'bg-gradient-to-br from-violet-500/20 to-violet-500/5 text-violet-600' },
  'recording-ready': { icon: <FileText className='h-4 w-4' />, bgColor: 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-600' },
  'ai-summary': { icon: <Sparkles className='h-4 w-4' />, bgColor: 'bg-gradient-to-br from-violet-500/20 to-violet-500/5 text-violet-600' },
  'file-shared': { icon: <FolderOpen className='h-4 w-4' />, bgColor: 'bg-gradient-to-br from-amber-500/20 to-amber-500/5 text-amber-600' },
  'member-joined': { icon: <UserPlus className='h-4 w-4' />, bgColor: 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-600' },
  'security-alert': { icon: <Shield className='h-4 w-4' />, bgColor: 'bg-gradient-to-br from-rose-500/20 to-rose-500/5 text-rose-600' },
  'maintenance': { icon: <Wrench className='h-4 w-4' />, bgColor: 'bg-gradient-to-br from-amber-500/20 to-amber-500/5 text-amber-600' },
  'meeting-soon': { icon: <CalendarClock className='h-4 w-4' />, bgColor: 'bg-gradient-to-br from-blue-500/20 to-blue-500/5 text-blue-600' },
  'system-update': { icon: <Megaphone className='h-4 w-4' />, bgColor: 'bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 text-cyan-600' },
  'message': { icon: <MessageSquare className='h-4 w-4' />, bgColor: 'bg-gradient-to-br from-teal-500/20 to-teal-500/5 text-teal-600' },
  'general': { icon: <Bell className='h-4 w-4' />, bgColor: 'bg-gradient-to-br from-zinc-500/20 to-zinc-500/5 text-zinc-600' },
}

const filterPills: { label: string; value: NotificationCategory }[] = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Mentions', value: 'mentions' },
  { label: 'Meetings', value: 'meetings' },
  { label: 'System', value: 'system' },
]

const tabCategories: { label: string; value: TabCategory; icon: React.ReactNode }[] = [
  { label: 'Recent', value: 'recent', icon: <Clock className='h-3.5 w-3.5' /> },
  { label: '@Mentions', value: 'mentions', icon: <AtSign className='h-3.5 w-3.5' /> },
  { label: 'Meeting Alerts', value: 'meeting-alerts', icon: <Video className='h-3.5 w-3.5' /> },
  { label: 'System Updates', value: 'system-updates', icon: <Megaphone className='h-3.5 w-3.5' /> },
]

// ── Animation Variants ──────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

// ── Notification Item Component ──────────────────────────────────────

function NotificationRow({
  notification,
  onMarkRead,
  onDelete,
  onTogglePin,
  onAction,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string) => void
  onAction: (id: string, actionLabel: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const cfg = iconConfig[notification.type]

  const handleClick = () => {
    if (notification.unread) onMarkRead(notification.id)
    setExpanded(!expanded)
  }

  return (
    <motion.div variants={item} layout>
      <Card
        className={`relative overflow-hidden bg-gradient-to-br from-card to-card/80 backdrop-blur border border-border/50 rounded-xl hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-emerald-500/40 before:to-emerald-500/0 ${notification.unread ? 'border-l-2 border-l-blue-500' : ''}`}
        onClick={handleClick}
      >
        <CardContent className='p-4'>
          <div className='flex items-start gap-3'>
            {/* Unread dot + Icon container */}
            <div className='relative shrink-0 mt-0.5'>
              {notification.unread && (
                <span className='absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-card z-10 animate-breathe' />
              )}
              <div className={`p-2 rounded-lg ${cfg.bgColor}`}>
                {cfg.icon}
              </div>
            </div>

            {/* Content */}
            <div className='flex-1 min-w-0'>
              <div className='flex items-start justify-between gap-2'>
                <div className='flex items-center gap-2 min-w-0'>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${notification.sender.color}`}>
                    {notification.sender.initials}
                  </div>
                  <span className='text-xs text-muted-foreground truncate'>{notification.sender.name}</span>
                </div>
                <div className='flex items-center gap-1 shrink-0'>
                  {notification.pinned && (
                    <Pin className='h-3 w-3 text-amber-500' />
                  )}
                  <span className='text-[11px] text-muted-foreground whitespace-nowrap'>{notification.timestamp}</span>
                </div>
              </div>
              <p
                className='text-sm font-medium mt-1 leading-snug'
                dangerouslySetInnerHTML={{ __html: notification.title }}
              />
              <p
                className='text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2'
                dangerouslySetInnerHTML={{ __html: notification.description }}
              />

              {/* Expanded detail */}
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' as const }}
                    className='overflow-hidden'
                  >
                    <div className='mt-3 pt-3 border-t border-border/50'>
                      <p className='text-xs text-muted-foreground leading-relaxed'>{notification.detail}</p>
                      {notification.actions && (
                        <div className='flex items-center gap-2 mt-3' onClick={e => e.stopPropagation()}>
                          {notification.actions.map((action) => (
                            <Button
                              key={action.label}
                              size='sm'
                              variant={action.variant}
                              className='h-7 text-xs'
                              onClick={() => onAction(notification.id, action.onClickLabel)}
                            >
                              {action.variant === 'default' && <CheckCircle2 className='h-3 w-3 mr-1' />}
                              {action.variant === 'outline' && <XCircle className='h-3 w-3 mr-1' />}
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action buttons */}
            <div className='flex flex-col items-center gap-1 shrink-0 ml-1' onClick={e => e.stopPropagation()}>
              <button
                onClick={() => onTogglePin(notification.id)}
                className='p-1 rounded-md hover:bg-muted transition-colors duration-150 text-muted-foreground hover:text-foreground'
                title={notification.pinned ? 'Unpin' : 'Pin'}
              >
                {notification.pinned ? <PinOff className='h-3.5 w-3.5' /> : <Pin className='h-3.5 w-3.5' />}
              </button>
              <button
                onClick={() => onDelete(notification.id)}
                className='p-1 rounded-md hover:bg-red-500/10 transition-colors duration-150 text-muted-foreground hover:text-red-500'
                title='Delete'
              >
                <Trash2 className='h-3.5 w-3.5' />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Empty State Component ──────────────────────────────────────────

function EmptyState({ filter }: { filter: string }) {
  return (
    <motion.div
      variants={item}
      className='flex flex-col items-center justify-center py-16'
    >
      <div className='w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4'>
        <Bell className='h-8 w-8 text-muted-foreground/40' />
      </div>
      <h3 className='text-base font-medium text-foreground mb-1'>No notifications found</h3>
      <p className='text-sm text-muted-foreground text-center max-w-xs'>
        {filter === 'all'
          ? 'You\'re all caught up! No notifications to display right now.'
          : `No ${filter} notifications to show. Try changing your filter.`}
      </p>
    </motion.div>
  )
}

// ── Main Component ────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(fallbackNotifications)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await authFetch('/api/v1/notifications')
      const json = await res.json()
      if (json.success) {
        setNotifications((json.data.notifications as ReturnType<typeof mapApiNotification>[]).map(mapApiNotification))
      } else {
        setError(json.error?.message ?? 'Failed to fetch notifications')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])
  const [activeFilter, setActiveFilter] = useState<NotificationCategory>('all')
  const [activeTab, setActiveTab] = useState<TabCategory>('recent')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  // Count unread
  const unreadCount = useMemo(
    () => notifications.filter(n => n.unread).length,
    [notifications]
  )

  // Filter by category (filter pills)
  const categoryFiltered = useMemo(() => {
    switch (activeFilter) {
      case 'unread':
        return notifications.filter(n => n.unread)
      case 'mentions':
        return notifications.filter(n => n.type === 'mention')
      case 'meetings':
        return notifications.filter(n => ['meeting-invite', 'meeting-soon', 'recording-ready'].includes(n.type))
      case 'system':
        return notifications.filter(n => ['security-alert', 'maintenance', 'system-update'].includes(n.type))
      default:
        return notifications
    }
  }, [notifications, activeFilter])

  // Filter by tab
  const tabFiltered = useMemo(() => {
    switch (activeTab) {
      case 'mentions':
        return categoryFiltered.filter(n => n.type === 'mention')
      case 'meeting-alerts':
        return categoryFiltered.filter(n => ['meeting-invite', 'meeting-soon', 'recording-ready', 'ai-summary'].includes(n.type))
      case 'system-updates':
        return categoryFiltered.filter(n => ['security-alert', 'maintenance', 'system-update', 'member-joined'].includes(n.type))
      default:
        return categoryFiltered
    }
  }, [categoryFiltered, activeTab])

  // Sort: pinned first, then by time group, then by original order
  const sorted = useMemo(() => {
    const groupOrder: Record<TimeGroup, number> = { 'Today': 0, 'Yesterday': 1, 'Earlier': 2 }
    return [...tabFiltered].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      if (groupOrder[a.timeGroup] !== groupOrder[b.timeGroup]) {
        return groupOrder[a.timeGroup] - groupOrder[b.timeGroup]
      }
      return 0
    })
  }, [tabFiltered])

  // Group by time for 'recent' tab
  const grouped = useMemo(() => {
    if (activeTab !== 'recent') return { 'All': sorted }
    const groups: Record<TimeGroup, Notification[]> = { 'Today': [], 'Yesterday': [], 'Earlier': [] }
    sorted.forEach(n => groups[n.timeGroup].push(n))
    return groups
  }, [sorted, activeTab])

  // Handlers
  const handleMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n))
  }

  const handleMarkAllRead = () => {
    const unreadCount = notifications.filter(n => n.unread).length
    if (unreadCount === 0) {
      toast.info('All notifications are already read')
      return
    }
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
    toast.success(`Marked ${unreadCount} notification${unreadCount > 1 ? 's' : ''} as read`)
  }

  const handleDelete = (id: string) => {
    setPendingDeleteId(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (!pendingDeleteId) return
    setNotifications(prev => prev.filter(n => n.id !== pendingDeleteId))
    setDeleteDialogOpen(false)
    setPendingDeleteId(null)
    toast.success('Notification deleted')
  }

  const handleTogglePin = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n))
    const n = notifications.find(n => n.id === id)
    if (n) toast.success(n.pinned ? 'Notification unpinned' : 'Notification pinned')
  }

  const handleAction = (id: string, actionLabel: string) => {
    toast.success(actionLabel)
  }

  const activeFilterLabel = filterPills.find(p => p.value === activeFilter)?.label ?? ''

  return (
    <>
      <motion.div
        className='space-y-6'
        variants={container}
        initial='hidden'
        animate='show'
      >
        {/* ── Header ── */}
        <motion.div variants={item} className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white'>
              <Bell className='h-6 w-6' />
            </div>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>Notifications</h1>
              <p className='text-sm text-muted-foreground'>Stay updated with your team activity and system alerts</p>
              <div className='h-1 w-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500/50 mt-2' />
            </div>
          </div>
          <Button
            variant='outline'
            className='shrink-0 gap-2'
            onClick={handleMarkAllRead}
          >
            <CheckCheck className='h-4 w-4' />
            Mark All Read
          </Button>
        </motion.div>

        {/* ── Filter Pills ── */}
        <motion.div variants={item} className='flex flex-wrap items-center gap-2'>
          {filterPills.map(pill => {
            const isActive = activeFilter === pill.value
            return (
              <button
                key={pill.value}
                onClick={() => setActiveFilter(pill.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-sm'
                    : 'bg-card/80 backdrop-blur text-muted-foreground border-border/50 hover:text-foreground hover:border-border'
                }`}
              >
                {pill.label}
                {pill.value === 'unread' && unreadCount > 0 && (
                  <span className={`ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white/20' : 'bg-blue-500/10 text-blue-600'
                  }`}>
                    {unreadCount}
                  </span>
                )}
              </button>
            )
          })}
        </motion.div>

        {/* ── Tab Categories ── */}
        <motion.div variants={item}>
          <Card className='bg-card/80 backdrop-blur border border-border/50 rounded-xl overflow-hidden'>
            <div className='flex border-b border-border/50'>
              {tabCategories.map(tab => {
                const isActive = activeTab === tab.value
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-all duration-200 relative border-b-2 -mb-px ${
                      isActive
                        ? 'border-emerald-500 text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                    {isActive && (
                      <motion.div
                        layoutId='notif-tab-indicator'
                        className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500'
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Gradient accent line */}
            <div className='h-0.5 bg-gradient-to-r from-emerald-500/50 via-teal-500/30 to-transparent' />

            {/* Notification List */}
            <div className='p-4 space-y-3 max-h-[640px] overflow-y-auto custom-scrollbar'>
              {loading ? (
                <div className='space-y-3'>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i} className='animate-pulse'>
                      <CardContent className='p-4 flex items-start gap-3'>
                        <div className='w-8 h-8 rounded-lg bg-muted shrink-0' />
                        <div className='flex-1 space-y-2'>
                          <div className='h-4 bg-muted rounded w-2/3' />
                          <div className='h-3 bg-muted rounded w-full' />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : error ? (
                <div className='py-8 text-center'>
                  <p className='text-sm text-red-500'>{error}</p>
                  <Button variant='outline' size='sm' className='mt-2' onClick={fetchNotifications}>Retry</Button>
                </div>
              ) : sorted.length === 0 ? (
                <EmptyState filter={activeFilterLabel} />
              ) : (
                Object.entries(grouped).map(([group, items]) => {
                  if (items.length === 0) return null
                  return (
                    <div key={group}>
                      {activeTab === 'recent' && group !== 'All' && (
                        <div className='flex items-center gap-2 mb-3'>
                          <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>{group}</h3>
                          <div className='flex-1 h-px bg-border/50' />
                          <Badge variant='outline' className='text-[10px] bg-muted/50'>{items.length}</Badge>
                        </div>
                      )}
                      <motion.div
                        className='space-y-2'
                        variants={container}
                        initial='hidden'
                        animate='show'
                      >
                        {items.map(notification => (
                          <NotificationRow
                            key={notification.id}
                            notification={notification}
                            onMarkRead={handleMarkRead}
                            onDelete={handleDelete}
                            onTogglePin={handleTogglePin}
                            onAction={handleAction}
                          />
                        ))}
                      </motion.div>
                    </div>
                  )
                })
              )}
            </div>
          </Card>
        </motion.div>

        {/* ── Summary Bar ── */}
        <motion.div variants={item}>
          <Card className='bg-card/80 backdrop-blur border border-border/50 rounded-xl'>
            <CardContent className='flex flex-col sm:flex-row items-center justify-between gap-3 py-4 px-5'>
              <div className='flex items-center gap-3'>
                <div className='p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-600'>
                  <CheckCheck className='h-4 w-4' />
                </div>
                <div>
                  <p className='text-sm font-medium'>
                    {unreadCount > 0
                      ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''} remaining`
                      : 'All caught up!'}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {notifications.length} total notification{notifications.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                <span className='flex items-center gap-1.5'>
                  <span className='w-2 h-2 rounded-full bg-blue-500' />
                  {unreadCount} Unread
                </span>
                <span className='flex items-center gap-1.5'>
                  <Pin className='h-3 w-3' />
                  {notifications.filter(n => n.pinned).length} Pinned
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Delete Notification</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2 sm:gap-0'>
            <Button variant='outline' onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={confirmDelete}>
              <Trash2 className='h-4 w-4 mr-2' />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
