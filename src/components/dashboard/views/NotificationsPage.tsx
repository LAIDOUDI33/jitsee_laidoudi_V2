'use client'

import { useState, useMemo } from 'react'
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

const initialNotifications: Notification[] = [
  {
    id: 'n-01',
    type: 'meeting-invite',
    sender: { name: 'Sarah Chen', initials: 'SC', color: avatarColors[0] },
    title: 'Meeting invitation: Q4 Product Review',
    description: 'You are invited to join the Q4 Product Review meeting tomorrow at 2:00 PM.',
    detail: 'Sarah Chen has invited you to the Q4 Product Review meeting. This is a recurring weekly meeting to discuss product roadmap progress, feature prioritization, and cross-team alignment. The meeting will cover sprint outcomes, upcoming milestones, and resource allocation. Please confirm your attendance so the team can plan accordingly. Meeting link will be available 15 minutes before start time.',
    timestamp: '2m ago',
    timeGroup: 'Today',
    unread: true,
    pinned: false,
    actions: [
      { label: 'Accept', variant: 'default', onClickLabel: 'Accepted' },
      { label: 'Decline', variant: 'outline', onClickLabel: 'Declined' },
    ],
  },
  {
    id: 'n-02',
    type: 'mention',
    sender: { name: 'James Wilson', initials: 'JW', color: avatarColors[1] },
    title: '<b>@you</b> in #engineering channel',
    description: 'James Wilson mentioned you: "Hey <b>@you</b> can you review the PR for the new API endpoint?"',
    detail: 'James Wilson mentioned you in the #engineering channel: "Hey @you can you review the PR for the new API endpoint? It includes the authentication middleware changes we discussed yesterday. The branch is feature/api-auth-v2 and I\'ve added detailed comments on the tricky parts. Would be great to get your eyes on it before EOD."',
    timestamp: '8m ago',
    timeGroup: 'Today',
    unread: true,
    pinned: true,
  },
  {
    id: 'n-03',
    type: 'meeting-soon',
    sender: { name: 'System', initials: 'AL', color: 'bg-emerald-500/15 text-emerald-600' },
    title: 'Sprint Planning starts in 15 minutes',
    description: 'Your "Sprint Planning with Engineering" meeting is starting soon.',
    detail: 'Your Sprint Planning meeting with the Engineering team is scheduled to start in 15 minutes. This meeting will cover the upcoming sprint backlog, story point estimation, and task assignment. Make sure to have your updated task list ready. The meeting room is already open and participants are joining.',
    timestamp: '15m ago',
    timeGroup: 'Today',
    unread: true,
    pinned: false,
  },
  {
    id: 'n-04',
    type: 'recording-ready',
    sender: { name: 'System', initials: 'AL', color: 'bg-violet-500/15 text-violet-600' },
    title: 'Recording ready: Design Review',
    description: 'The recording for "Design Review - Mobile App v3" is now available.',
    detail: 'The recording for your "Design Review - Mobile App v3" meeting is now available for viewing. Duration: 47 minutes. The recording has been automatically transcribed and an AI summary has been generated. You can find both in the Recordings section.',
    timestamp: '32m ago',
    timeGroup: 'Today',
    unread: true,
    pinned: false,
  },
  {
    id: 'n-05',
    type: 'ai-summary',
    sender: { name: 'AI Assistant', initials: 'AI', color: 'bg-violet-500/15 text-violet-600' },
    title: 'AI Summary ready: Board Meeting',
    description: 'Key decisions and action items from the Board Meeting have been extracted.',
    detail: 'AI Summary for "Board Meeting - December 2024" is ready. Key highlights: 1) Q4 revenue target approved at $4.2M, 2) New enterprise tier pricing approved, 3) Hiring plan for 12 additional engineers in Q1, 4) Security audit scheduled for January. 5 action items assigned to team leads.',
    timestamp: '1h ago',
    timeGroup: 'Today',
    unread: true,
    pinned: true,
  },
  {
    id: 'n-06',
    type: 'file-shared',
    sender: { name: 'Emily Park', initials: 'EP', color: avatarColors[2] },
    title: 'File shared: Q4 Roadmap.pdf',
    description: 'Emily Park shared "Q4_Roadmap_Final.pdf" in the #product channel.',
    detail: 'Emily Park shared the file "Q4_Roadmap_Final.pdf" (2.4 MB) in the #product channel. This is the finalized Q4 product roadmap including feature timelines, resource allocation, and milestone dates. The document has been reviewed by the leadership team and is ready for team distribution.',
    timestamp: '1h ago',
    timeGroup: 'Today',
    unread: false,
    pinned: false,
  },
  {
    id: 'n-07',
    type: 'mention',
    sender: { name: 'Alex Rivera', initials: 'AR', color: avatarColors[3] },
    title: '<b>@you</b> in #design-feedback',
    description: 'Alex Rivera mentioned you: "<b>@you</b> the new dashboard mockups look amazing!"',
    detail: 'Alex Rivera mentioned you in the #design-feedback channel: "@you the new dashboard mockups look amazing! Love the glassmorphism approach. One thought - maybe we could add a subtle animation on the stat cards? Also, the color palette feels cohesive with the brand. Great work!"',
    timestamp: '2h ago',
    timeGroup: 'Today',
    unread: false,
    pinned: false,
  },
  {
    id: 'n-08',
    type: 'member-joined',
    sender: { name: 'System', initials: 'AL', color: 'bg-emerald-500/15 text-emerald-600' },
    title: 'New team member joined',
    description: 'Marcus Thompson has joined the Engineering team.',
    detail: 'Marcus Thompson (marcus.t@company.com) has joined the Engineering team. They have been assigned the role of Senior Frontend Engineer. Welcome them to the team! Their onboarding buddy is Sarah Chen.',
    timestamp: '2h ago',
    timeGroup: 'Today',
    unread: false,
    pinned: false,
  },
  {
    id: 'n-09',
    type: 'security-alert',
    sender: { name: 'Security', initials: 'SE', color: 'bg-rose-500/15 text-rose-600' },
    title: 'Login from new device detected',
    description: 'A new sign-in was detected from MacBook Pro in San Francisco, CA.',
    detail: 'We detected a sign-in to your account from a new device: MacBook Pro (macOS Sonoma 14.2) located in San Francisco, CA, United States. If this was you, no action is needed. If you don\'t recognize this activity, please secure your account immediately by changing your password and enabling two-factor authentication.',
    timestamp: '3h ago',
    timeGroup: 'Today',
    unread: false,
    pinned: false,
  },
  {
    id: 'n-10',
    type: 'message',
    sender: { name: 'Lisa Wang', initials: 'LW', color: avatarColors[4] },
    title: 'New message in #general',
    description: 'Lisa Wang: "Reminder: Team lunch tomorrow at noon in the main cafe! 🍕"',
    detail: 'Lisa Wang posted in #general: "Reminder: Team lunch tomorrow at noon in the main cafe! 🍕 We\'ll be celebrating the Q3 milestone completion. Dietary preferences have been collected - if you haven\'t submitted yours yet, please do so by EOD today. See you there!"',
    timestamp: '4h ago',
    timeGroup: 'Today',
    unread: false,
    pinned: false,
  },
  {
    id: 'n-11',
    type: 'meeting-invite',
    sender: { name: 'David Kim', initials: 'DK', color: avatarColors[5] },
    title: 'Meeting invitation: 1:1 with David Kim',
    description: 'Weekly 1:1 sync scheduled for Thursday at 10:00 AM.',
    detail: 'David Kim has scheduled your weekly 1:1 sync for Thursday at 10:00 AM. Agenda items: project status update, career development discussion, and feedback exchange. Please add any topics you\'d like to discuss to the shared agenda doc.',
    timestamp: '5h ago',
    timeGroup: 'Today',
    unread: false,
    pinned: false,
    actions: [
      { label: 'Accept', variant: 'default', onClickLabel: 'Accepted' },
      { label: 'Decline', variant: 'outline', onClickLabel: 'Declined' },
    ],
  },
  {
    id: 'n-12',
    type: 'system-update',
    sender: { name: 'System', initials: 'AL', color: 'bg-cyan-500/15 text-cyan-600' },
    title: 'Platform update v3.8.2 deployed',
    description: 'New features include improved noise cancellation and faster file uploads.',
    detail: 'ALVISION Platform v3.8.2 has been successfully deployed. New features and improvements: 1) Enhanced AI noise cancellation with 40% better background removal, 2) File upload speed improved by 60%, 3) New virtual background options, 4) Fixed calendar sync issue with Outlook, 5) Improved mobile video quality on low-bandwidth connections.',
    timestamp: '6h ago',
    timeGroup: 'Today',
    unread: false,
    pinned: false,
  },
  {
    id: 'n-13',
    type: 'recording-ready',
    sender: { name: 'System', initials: 'AL', color: 'bg-violet-500/15 text-violet-600' },
    title: 'Recording ready: Client Demo',
    description: 'The recording for "Enterprise Client Demo - Acme Corp" is now available.',
    detail: 'The recording for "Enterprise Client Demo - Acme Corp" is now available. Duration: 1 hour 12 minutes. The client showed strong interest in the enterprise tier. AI summary and key action items have been extracted automatically.',
    timestamp: '8h ago',
    timeGroup: 'Today',
    unread: false,
    pinned: false,
  },
  {
    id: 'n-14',
    type: 'maintenance',
    sender: { name: 'System', initials: 'AL', color: 'bg-amber-500/15 text-amber-600' },
    title: 'Scheduled maintenance tonight',
    description: 'Platform maintenance window: 11:00 PM - 2:00 AM EST.',
    detail: 'ALVISION will undergo scheduled maintenance tonight from 11:00 PM to 2:00 AM EST. During this window, video conferencing and file sharing services will be temporarily unavailable. Chat and notifications will remain operational. All meetings scheduled during this period have been automatically rescheduled.',
    timestamp: '1d ago',
    timeGroup: 'Yesterday',
    unread: false,
    pinned: false,
  },
  {
    id: 'n-15',
    type: 'mention',
    sender: { name: 'Priya Sharma', initials: 'PS', color: avatarColors[6] },
    title: '<b>@you</b> in #incidents',
    description: 'Priya Sharma mentioned you: "<b>@you</b> can you check the API latency issue?"',
    detail: 'Priya Sharma mentioned you in the #incidents channel: "@you can you check the API latency issue reported by the monitoring dashboard? Response times spiked to 800ms around 3 PM. Might be related to the new query we deployed yesterday."',
    timestamp: '1d ago',
    timeGroup: 'Yesterday',
    unread: false,
    pinned: false,
  },
  {
    id: 'n-16',
    type: 'file-shared',
    sender: { name: 'Tom Bradley', initials: 'TB', color: avatarColors[7] },
    title: 'File shared: API Documentation v2.md',
    description: 'Tom Bradley shared "API_Documentation_v2.md" in the #engineering channel.',
    detail: 'Tom Bradley shared "API_Documentation_v2.md" (156 KB) in the #engineering channel. This updated documentation covers the new REST API v2 endpoints including authentication flows, rate limiting, and webhook integrations.',
    timestamp: '1d ago',
    timeGroup: 'Yesterday',
    unread: false,
    pinned: false,
  },
  {
    id: 'n-17',
    type: 'meeting-soon',
    sender: { name: 'System', initials: 'AL', color: 'bg-emerald-500/15 text-emerald-600' },
    title: 'Team standup completed',
    description: 'Your daily standup meeting has ended. AI summary is available.',
    detail: 'Your daily Engineering Standup meeting has concluded. Duration: 18 minutes. AI Summary: 3 blockers were discussed, 2 have been resolved. Sprint velocity is on track. Key decision: API migration will start next sprint.',
    timestamp: '1d ago',
    timeGroup: 'Yesterday',
    unread: false,
    pinned: false,
  },
  {
    id: 'n-18',
    type: 'member-joined',
    sender: { name: 'System', initials: 'AL', color: 'bg-emerald-500/15 text-emerald-600' },
    title: 'New team member joined',
    description: 'Nina Patel has joined the Design team.',
    detail: 'Nina Patel (nina.p@company.com) has joined the Design team as a UI/UX Designer. Her onboarding has been initiated and her manager is Alex Rivera.',
    timestamp: '2d ago',
    timeGroup: 'Earlier',
    unread: false,
    pinned: false,
  },
  {
    id: 'n-19',
    type: 'security-alert',
    sender: { name: 'Security', initials: 'SE', color: 'bg-rose-500/15 text-rose-600' },
    title: 'Password changed successfully',
    description: 'Your account password was updated. If this wasn\'t you, contact support.',
    detail: 'Your ALVISION account password was successfully changed on Dec 12, 2024 at 4:32 PM EST. The change was made from IP address 192.168.1.105. If you did not make this change, please contact support immediately.',
    timestamp: '2d ago',
    timeGroup: 'Earlier',
    unread: false,
    pinned: false,
  },
  {
    id: 'n-20',
    type: 'system-update',
    sender: { name: 'System', initials: 'AL', color: 'bg-cyan-500/15 text-cyan-600' },
    title: 'New feature: AI Meeting Coach',
    description: 'AI Meeting Coach is now available for Pro and Enterprise plans.',
    detail: 'We\'re excited to announce AI Meeting Coach, a new feature for Pro and Enterprise subscribers. AI Meeting Coach provides real-time suggestions during meetings, helps manage speaking time, and offers post-meeting improvement tips. Enable it in Settings > AI Features.',
    timestamp: '3d ago',
    timeGroup: 'Earlier',
    unread: false,
    pinned: false,
  },
  {
    id: 'n-21',
    type: 'meeting-invite',
    sender: { name: 'Rachel Green', initials: 'RG', color: avatarColors[0] },
    title: 'Meeting invitation: All-Hands Town Hall',
    description: 'Monthly all-hands meeting scheduled for Friday at 3:00 PM.',
    detail: 'Rachel Green has invited you to the Monthly All-Hands Town Hall on Friday at 3:00 PM. Agenda: company update, product demos, Q&A with leadership, and team spotlights. This is a mandatory meeting for all employees.',
    timestamp: '3d ago',
    timeGroup: 'Earlier',
    unread: false,
    pinned: false,
    actions: [
      { label: 'Accept', variant: 'default', onClickLabel: 'Accepted' },
      { label: 'Decline', variant: 'outline', onClickLabel: 'Declined' },
    ],
  },
  {
    id: 'n-22',
    type: 'ai-summary',
    sender: { name: 'AI Assistant', initials: 'AI', color: 'bg-violet-500/15 text-violet-600' },
    title: 'AI Summary ready: Architecture Review',
    description: 'Technical decisions and architecture changes from the Architecture Review.',
    detail: 'AI Summary for "Architecture Review - Microservices Migration" is ready. Key decisions: 1) Adopt event-driven architecture using Apache Kafka, 2) Migrate authentication service first, 3) Use circuit breaker pattern for inter-service communication, 4) Target completion: end of Q1 2025. 8 action items assigned.',
    timestamp: '4d ago',
    timeGroup: 'Earlier',
    unread: false,
    pinned: false,
  },
  {
    id: 'n-23',
    type: 'message',
    sender: { name: 'Chris Lee', initials: 'CL', color: avatarColors[3] },
    title: 'New message in #random',
    description: 'Chris Lee: "Has anyone tried the new coffee machine in the 3rd floor kitchen?"',
    detail: 'Chris Lee posted in #random: "Has anyone tried the new coffee machine in the 3rd floor kitchen? It makes an amazing flat white. Also, they stocked some great pastries today!"',
    timestamp: '5d ago',
    timeGroup: 'Earlier',
    unread: false,
    pinned: false,
  },
]

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
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
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
              {sorted.length === 0 ? (
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
