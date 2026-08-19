'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import {
  Video,
  CalendarPlus,
  Sparkles,
  Users,
  FileText,
  Film,
  CheckCircle2,
  Search,
  ChevronDown,
  Play,
  ExternalLink,
  Clock,
  UserPlus,
  Share2,
  Brain,
  Activity,
  Inbox,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

// ── Types ──────────────────────────────────────────────────────────────

type ActivityType =
  | 'meeting-joined'
  | 'meeting-created'
  | 'recording-ready'
  | 'ai-summary'
  | 'team-joined'
  | 'file-shared'
  | 'action-completed'

interface ActivityEntry {
  id: string
  type: ActivityType
  title: string
  description: string
  timestamp: string
  userName: string
  userInitials: string
  userColor: string
  // Meeting-specific
  meetingTitle?: string
  meetingDuration?: string
  participantCount?: number
  // Recording-specific
  recordingDuration?: string
  recordingThumbnail?: string
  // AI-specific
  summarySnippet?: string
  // File-specific
  fileName?: string
  fileSize?: string
  fileType?: string
}

type FilterCategory = 'all' | 'meetings' | 'recordings' | 'ai' | 'team' | 'files'

type DateGroup = 'Today' | 'Yesterday' | 'This Week' | 'Earlier'

// ── Color mapping for activity types ────────────────────────────────────

const DOT_COLORS: Record<ActivityType, string> = {
  'meeting-joined': 'bg-emerald-500',
  'meeting-created': 'bg-amber-500',
  'recording-ready': 'bg-rose-500',
  'ai-summary': 'bg-violet-500',
  'team-joined': 'bg-emerald-500',
  'file-shared': 'bg-amber-500',
  'action-completed': 'bg-teal-500',
}

const DOT_RING_COLORS: Record<ActivityType, string> = {
  'meeting-joined': 'ring-emerald-500/30',
  'meeting-created': 'ring-amber-500/30',
  'recording-ready': 'ring-rose-500/30',
  'ai-summary': 'ring-violet-500/30',
  'team-joined': 'ring-emerald-500/30',
  'file-shared': 'ring-amber-500/30',
  'action-completed': 'ring-teal-500/30',
}

const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  'meeting-joined': <Video className='h-3.5 w-3.5' />,
  'meeting-created': <CalendarPlus className='h-3.5 w-3.5' />,
  'recording-ready': <Film className='h-3.5 w-3.5' />,
  'ai-summary': <Brain className='h-3.5 w-3.5' />,
  'team-joined': <UserPlus className='h-3.5 w-3.5' />,
  'file-shared': <Share2 className='h-3.5 w-3.5' />,
  'action-completed': <CheckCircle2 className='h-3.5 w-3.5' />,
}

// ── Helpers ────────────────────────────────────────────────────────────

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600000).toISOString()
}

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 86400000).toISOString()
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getDateGroup(timestamp: string): DateGroup {
  const now = new Date()
  const date = new Date(timestamp)
  const today = now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'

  // This week: within the last 7 days
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
  if (diffDays < 7) return 'This Week'

  return 'Earlier'
}

function getCategoryForType(type: ActivityType): FilterCategory {
  if (type === 'meeting-joined' || type === 'meeting-created') return 'meetings'
  if (type === 'recording-ready') return 'recordings'
  if (type === 'ai-summary') return 'ai'
  if (type === 'team-joined') return 'team'
  if (type === 'file-shared') return 'files'
  if (type === 'action-completed') return 'team'
  return 'all'
}

function getFileIcon(fileType?: string) {
  if (!fileType) return <FileText className='h-5 w-5 text-muted-foreground' />
  if (fileType.startsWith('image/')) return <Film className='h-5 w-5 text-rose-500' />
  if (fileType.includes('pdf')) return <FileText className='h-5 w-5 text-rose-500' />
  if (fileType.includes('sheet') || fileType.includes('csv')) return <FileText className='h-5 w-5 text-emerald-500' />
  return <FileText className='h-5 w-5 text-amber-500' />
}

const DATE_GROUP_ORDER: DateGroup[] = ['Today', 'Yesterday', 'This Week', 'Earlier']

// ── Mock Data ──────────────────────────────────────────────────────────

const MOCK_ACTIVITIES: ActivityEntry[] = [
  // Today
  {
    id: 'a1', type: 'meeting-joined',
    title: 'Joined Sprint Planning — Q4 Kickoff',
    description: 'Participated in the weekly sprint planning meeting with the engineering team.',
    timestamp: hoursAgo(0.5), userName: 'Sarah Mitchell', userInitials: 'SM', userColor: 'bg-emerald-500',
    meetingTitle: 'Sprint Planning — Q4 Kickoff', meetingDuration: '1h 12m', participantCount: 8,
  },
  {
    id: 'a2', type: 'ai-summary',
    title: 'AI Summary Generated',
    description: 'Automatic meeting summary with key decisions and action items.',
    timestamp: hoursAgo(1), userName: 'AI Assistant', userInitials: 'AI', userColor: 'bg-violet-500',
    meetingTitle: 'Product Roadmap Review', summarySnippet: 'The team discussed Q4 priorities including the new dashboard redesign, mobile app v2.0 launch, and infrastructure migration timeline. Key decision: prioritize mobile app over dashboard redesign...',
  },
  {
    id: 'a3', type: 'recording-ready',
    title: 'Recording Ready — Client Onboarding',
    description: 'Meeting recording has been processed and is ready for playback.',
    timestamp: hoursAgo(1.5), userName: 'System', userInitials: 'SY', userColor: 'bg-rose-500',
    recordingDuration: '45:12',
  },
  {
    id: 'a4', type: 'file-shared',
    title: 'Q4-Roadmap.pdf shared',
    description: 'Alex Johnson shared a file in the Design Review meeting.',
    timestamp: hoursAgo(2), userName: 'Alex Johnson', userInitials: 'AJ', userColor: 'bg-amber-500',
    fileName: 'Q4-Roadmap.pdf', fileSize: '2.4 MB', fileType: 'application/pdf',
  },
  {
    id: 'a5', type: 'meeting-created',
    title: 'Meeting Scheduled — Design Review',
    description: 'Alex Johnson scheduled a new meeting for the design team review.',
    timestamp: hoursAgo(3), userName: 'Alex Johnson', userInitials: 'AJ', userColor: 'bg-amber-500',
    meetingTitle: 'Design Review — New Dashboard', participantCount: 4,
  },
  {
    id: 'a6', type: 'action-completed',
    title: 'Action Item Completed',
    description: 'Finalized the API documentation for the video recording feature.',
    timestamp: hoursAgo(4), userName: 'Sarah Mitchell', userInitials: 'SM', userColor: 'bg-emerald-500',
  },
  // Yesterday
  {
    id: 'a7', type: 'meeting-joined',
    title: 'Joined Team Retrospective',
    description: 'Participated in the bi-weekly team retrospective session.',
    timestamp: hoursAgo(20), userName: 'Sarah Mitchell', userInitials: 'SM', userColor: 'bg-emerald-500',
    meetingTitle: 'Team Retrospective', meetingDuration: '38m', participantCount: 12,
  },
  {
    id: 'a8', type: 'ai-summary',
    title: 'AI Summary Generated',
    description: 'Transcription and summary completed for the engineering standup.',
    timestamp: hoursAgo(22), userName: 'AI Assistant', userInitials: 'AI', userColor: 'bg-violet-500',
    meetingTitle: 'Engineering Standup', summarySnippet: 'Team reported on current sprint progress. Backend API is 85% complete. Frontend components for the new dashboard are in code review. Blocker: third-party video SDK update needed...',
  },
  {
    id: 'a9', type: 'recording-ready',
    title: 'Recording Ready — Team Retrospective',
    description: 'Recording has been processed and AI transcription is available.',
    timestamp: hoursAgo(23), userName: 'System', userInitials: 'SY', userColor: 'bg-rose-500',
    recordingDuration: '38:50',
  },
  {
    id: 'a10', type: 'team-joined',
    title: 'Maya Rodriguez joined Engineering',
    description: 'New team member added to the Engineering workspace.',
    timestamp: hoursAgo(26), userName: 'Admin', userInitials: 'AD', userColor: 'bg-teal-500',
  },
  {
    id: 'a11', type: 'file-shared',
    title: 'design-mockups-v3.fig shared',
    description: 'Lisa Park shared design mockups in the product channel.',
    timestamp: hoursAgo(28), userName: 'Lisa Park', userInitials: 'LP', userColor: 'bg-fuchsia-500',
    fileName: 'design-mockups-v3.fig', fileSize: '18.7 MB', fileType: 'application/octet-stream',
  },
  // This week
  {
    id: 'a12', type: 'meeting-created',
    title: 'Meeting Scheduled — 1:1 with Engineering Lead',
    description: 'You scheduled a 1:1 meeting with the engineering lead.',
    timestamp: daysAgo(2) + 'T10:00:00', userName: 'Sarah Mitchell', userInitials: 'SM', userColor: 'bg-emerald-500',
    meetingTitle: '1:1 with Engineering Lead', participantCount: 2,
  },
  {
    id: 'a13', type: 'meeting-joined',
    title: 'Joined Client Demo — Acme Corp',
    description: 'Participated in the product demo for the enterprise client.',
    timestamp: daysAgo(2) + 'T14:30:00', userName: 'Sarah Mitchell', userInitials: 'SM', userColor: 'bg-emerald-500',
    meetingTitle: 'Client Demo — Acme Corp', meetingDuration: '52m', participantCount: 6,
  },
  {
    id: 'a14', type: 'ai-summary',
    title: 'AI Summary Generated',
    description: 'Meeting notes and action items extracted from the client demo.',
    timestamp: daysAgo(2) + 'T15:30:00', userName: 'AI Assistant', userInitials: 'AI', userColor: 'bg-violet-500',
    meetingTitle: 'Client Demo — Acme Corp', summarySnippet: 'Presented the new whiteboard collaboration features. Client was impressed with real-time sync capabilities. Follow-up: send pricing proposal by Friday. Action item: prepare custom onboarding plan...',
  },
  {
    id: 'a15', type: 'recording-ready',
    title: 'Recording Ready — Product Roadmap Review',
    description: 'Recording processed with full transcript and speaker diarization.',
    timestamp: daysAgo(3) + 'T16:00:00', userName: 'System', userInitials: 'SY', userColor: 'bg-rose-500',
    recordingDuration: '1:02:34',
  },
  {
    id: 'a16', type: 'action-completed',
    title: 'Action Item Completed',
    description: 'Deployed the new recording storage infrastructure to staging.',
    timestamp: daysAgo(3) + 'T11:00:00', userName: 'Jordan Wu', userInitials: 'JW', userColor: 'bg-teal-500',
  },
  {
    id: 'a17', type: 'team-joined',
    title: 'David Kim joined Product',
    description: 'New team member added to the Product workspace.',
    timestamp: daysAgo(4) + 'T09:00:00', userName: 'Admin', userInitials: 'AD', userColor: 'bg-teal-500',
  },
  {
    id: 'a18', type: 'file-shared',
    title: 'meeting-notes-sept.pdf shared',
    description: 'Sarah Mitchell shared meeting notes from the all-hands meeting.',
    timestamp: daysAgo(5) + 'T17:00:00', userName: 'Sarah Mitchell', userInitials: 'SM', userColor: 'bg-emerald-500',
    fileName: 'meeting-notes-sept.pdf', fileSize: '1.1 MB', fileType: 'application/pdf',
  },
  // Earlier
  {
    id: 'a19', type: 'meeting-joined',
    title: 'Joined All-Hands Meeting',
    description: 'Participated in the monthly company all-hands meeting.',
    timestamp: daysAgo(10) + 'T15:00:00', userName: 'Sarah Mitchell', userInitials: 'SM', userColor: 'bg-emerald-500',
    meetingTitle: 'Monthly All-Hands', meetingDuration: '1h 30m', participantCount: 45,
  },
  {
    id: 'a20', type: 'ai-summary',
    title: 'AI Summary Generated',
    description: 'Comprehensive summary with key highlights from the all-hands meeting.',
    timestamp: daysAgo(10) + 'T16:45:00', userName: 'AI Assistant', userInitials: 'AI', userColor: 'bg-violet-500',
    meetingTitle: 'Monthly All-Hands', summarySnippet: 'Company announced 25% revenue growth in Q3. New office opening in Austin. Product team shared the 2025 roadmap including AI-powered meeting features. HR announced updated remote work policy...',
  },
  {
    id: 'a21', type: 'meeting-created',
    title: 'Meeting Scheduled — Weekly Standup',
    description: 'Recurring weekly standup meeting was created by the engineering team.',
    timestamp: daysAgo(14) + 'T09:00:00', userName: 'Jordan Wu', userInitials: 'JW', userColor: 'bg-teal-500',
    meetingTitle: 'Weekly Engineering Standup', participantCount: 10,
  },
  {
    id: 'a22', type: 'recording-ready',
    title: 'Recording Ready — Security Review',
    description: 'Recording of the security compliance review is now available.',
    timestamp: daysAgo(12) + 'T12:00:00', userName: 'System', userInitials: 'SY', userColor: 'bg-rose-500',
    recordingDuration: '55:18',
  },
]

// ── Animation ──────────────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

// ── Filter chips config ────────────────────────────────────────────────

const FILTER_CHIPS: { label: string; value: FilterCategory }[] = [
  { label: 'All', value: 'all' },
  { label: 'Meetings', value: 'meetings' },
  { label: 'Recordings', value: 'recordings' },
  { label: 'AI', value: 'ai' },
  { label: 'Team', value: 'team' },
  { label: 'Files', value: 'files' },
]

// ── Component ──────────────────────────────────────────────────────────

export default function ActivityFeedPage() {
  const { setCurrentView } = useAppStore()
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(10)

  // Filter activities
  const filteredActivities = useMemo(() => {
    let result = MOCK_ACTIVITIES

    if (activeFilter !== 'all') {
      result = result.filter((a) => getCategoryForType(a.type) === activeFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.userName.toLowerCase().includes(q) ||
          (a.meetingTitle && a.meetingTitle.toLowerCase().includes(q)) ||
          (a.fileName && a.fileName.toLowerCase().includes(q))
      )
    }

    return result
  }, [activeFilter, searchQuery])

  // Group by date
  const groupedActivities = useMemo(() => {
    const groups: Record<DateGroup, ActivityEntry[]> = {
      Today: [],
      Yesterday: [],
      'This Week': [],
      Earlier: [],
    }

    filteredActivities.forEach((a) => {
      const group = getDateGroup(a.timestamp)
      groups[group].push(a)
    })

    return groups
  }, [filteredActivities])

  const visibleActivities = filteredActivities.slice(0, visibleCount)
  const hasMore = visibleCount < filteredActivities.length

  // ── Rich entry card renderers ──────────────────────────────────────

  function renderMeetingDetails(entry: ActivityEntry) {
    return (
      <div className='mt-2 rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2'>
        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
          <Video className='h-3.5 w-3.5 text-emerald-500' />
          <span className='font-medium text-foreground truncate'>{entry.meetingTitle}</span>
        </div>
        <div className='flex items-center gap-4 text-xs text-muted-foreground'>
          {entry.meetingDuration && (
            <span className='flex items-center gap-1'>
              <Clock className='h-3 w-3' />
              {entry.meetingDuration}
            </span>
          )}
          {entry.participantCount && (
            <span className='flex items-center gap-1'>
              <Users className='h-3 w-3' />
              {entry.participantCount} participants
            </span>
          )}
        </div>
      </div>
    )
  }

  function renderRecordingDetails(entry: ActivityEntry) {
    return (
      <div className='mt-2 rounded-lg border border-border/50 bg-muted/30 overflow-hidden'>
        <div className='relative h-28 bg-gradient-to-br from-rose-500/10 via-violet-500/10 to-fuchsia-500/10 flex items-center justify-center'>
          <Film className='h-8 w-8 text-muted-foreground/30' />
          <div className='absolute inset-0 bg-black/0 hover:bg-black/30 transition-all duration-300 flex items-center justify-center cursor-pointer group/rec'>
            <div className='w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover/rec:opacity-100 transition-opacity duration-300 shadow-lg'>
              <Play className='h-4 w-4 text-foreground ml-0.5' />
            </div>
          </div>
          {entry.recordingDuration && (
            <span className='absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-medium backdrop-blur-sm'>
              {entry.recordingDuration}
            </span>
          )}
        </div>
      </div>
    )
  }

  function renderAIDetails(entry: ActivityEntry) {
    return (
      <div className='mt-2 rounded-lg border border-violet-500/20 bg-violet-500/5 p-3'>
        <div className='flex items-center gap-2 mb-2'>
          <Sparkles className='h-3.5 w-3.5 text-violet-500' />
          <span className='text-xs font-medium text-violet-600 dark:text-violet-400'>AI-Generated Summary</span>
        </div>
        {entry.summarySnippet && (
          <p className='text-xs text-muted-foreground leading-relaxed line-clamp-2'>
            {entry.summarySnippet}
          </p>
        )}
        <button
          className='mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors'
          onClick={() => setCurrentView('ai-assistant')}
        >
          View Full Summary
          <ExternalLink className='h-3 w-3' />
        </button>
      </div>
    )
  }

  function renderFileDetails(entry: ActivityEntry) {
    return (
      <div className='mt-2 rounded-lg border border-border/50 bg-muted/30 p-3'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0'>
            {getFileIcon(entry.fileType)}
          </div>
          <div className='min-w-0 flex-1'>
            <p className='text-xs font-medium truncate'>{entry.fileName}</p>
            {entry.fileSize && (
              <p className='text-[11px] text-muted-foreground'>{entry.fileSize}</p>
            )}
          </div>
          <Button variant='ghost' size='icon' className='h-7 w-7 shrink-0'>
            <Share2 className='h-3.5 w-3.5' />
          </Button>
        </div>
      </div>
    )
  }

  function renderEntryDetails(entry: ActivityEntry) {
    switch (entry.type) {
      case 'meeting-joined':
      case 'meeting-created':
        return renderMeetingDetails(entry)
      case 'recording-ready':
        return renderRecordingDetails(entry)
      case 'ai-summary':
        return renderAIDetails(entry)
      case 'file-shared':
        return renderFileDetails(entry)
      default:
        return null
    }
  }

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <motion.div
      className='max-w-4xl mx-auto space-y-6'
      variants={container}
      initial='hidden'
      animate='show'
    >
      {/* Page Header */}
      <motion.div variants={item}>
        <h1 className='text-2xl font-bold tracking-tight'>Activity Feed</h1>
        <p className='text-sm text-muted-foreground mt-1'>
          Track all your team activities, meetings, and AI-generated insights.
        </p>
      </motion.div>

      {/* Filter Bar */}
      <motion.div variants={item} className='flex flex-col sm:flex-row gap-3'>
        {/* Filter chips */}
        <div className='flex flex-wrap gap-2'>
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.value}
              onClick={() => { setActiveFilter(chip.value); setVisibleCount(10) }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                activeFilter === chip.value
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className='relative sm:ml-auto sm:w-64'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search activities...'
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(10) }}
            className='pl-9 h-9 text-xs'
          />
        </div>
      </motion.div>

      {/* Activity Timeline */}
      {filteredActivities.length === 0 ? (
        <motion.div
          variants={item}
          className='flex flex-col items-center justify-center py-20 text-center'
        >
          <div className='w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4'>
            <Inbox className='h-9 w-9 text-muted-foreground' />
          </div>
          <h3 className='text-lg font-semibold mb-1'>No activities found</h3>
          <p className='text-sm text-muted-foreground max-w-sm'>
            {searchQuery
              ? `No results for "${searchQuery}". Try a different search term.`
              : 'No activities match the selected filter. Try selecting a different category.'}
          </p>
          {(searchQuery || activeFilter !== 'all') && (
            <Button
              variant='outline'
              size='sm'
              className='mt-4'
              onClick={() => { setSearchQuery(''); setActiveFilter('all'); setVisibleCount(10) }}
            >
              Clear filters
            </Button>
          )}
        </motion.div>
      ) : (
        <div className='space-y-8'>
          {DATE_GROUP_ORDER.map((groupLabel) => {
            const activities = visibleActivities.filter(
              (a) => getDateGroup(a.timestamp) === groupLabel
            )
            if (activities.length === 0) return null

            // Get total count for this group (not just visible)
            const totalInGroup = groupedActivities[groupLabel].length

            return (
              <motion.div key={groupLabel} variants={item}>
                {/* Group header */}
                <div className='flex items-center gap-3 mb-4'>
                  <h2 className='text-sm font-semibold text-foreground'>{groupLabel}</h2>
                  <Badge
                    variant='secondary'
                    className='h-5 px-2 text-[10px] font-medium bg-muted text-muted-foreground'
                    style={{ borderRadius: 9999 }}
                  >
                    {totalInGroup}
                  </Badge>
                  <div className='flex-1 h-px bg-border/50' />
                </div>

                {/* Timeline entries */}
                <div className='relative'>
                  {/* Vertical line */}
                  <div className='absolute left-[15px] top-2 bottom-2 w-px bg-border/50' aria-hidden='true' />

                  <div className='space-y-4'>
                    {activities.map((entry, idx) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: idx * 0.04 }}
                        className='relative pl-10'
                      >
                        {/* Colored dot on timeline */}
                        <div
                          className={`absolute left-0 top-2 w-[31px] h-[31px] rounded-full ${DOT_COLORS[entry.type]} ${DOT_RING_COLORS[entry.type]} ring-4 bg-card flex items-center justify-center text-white z-10`}
                        >
                          {ACTIVITY_ICONS[entry.type]}
                        </div>

                        {/* Entry card */}
                        <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-md hover:shadow-primary/5 transition-all duration-200'>
                          <CardContent className='p-4'>
                            <div className='flex items-start gap-3'>
                              {/* Avatar */}
                              <Avatar className='h-8 w-8 shrink-0 mt-0.5'>
                                <AvatarFallback
                                  className={`${entry.userColor} text-white text-[10px] font-bold`}
                                >
                                  {entry.userInitials}
                                </AvatarFallback>
                              </Avatar>

                              {/* Content */}
                              <div className='min-w-0 flex-1'>
                                <div className='flex items-start justify-between gap-2'>
                                  <div className='min-w-0'>
                                    <p className='text-sm font-medium leading-snug'>{entry.title}</p>
                                    <p className='text-xs text-muted-foreground mt-0.5 line-clamp-2'>
                                      {entry.description}
                                    </p>
                                  </div>
                                  <span className='text-[11px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5'>
                                    {formatTimeAgo(entry.timestamp)}
                                  </span>
                                </div>

                                {/* Rich details */}
                                {renderEntryDetails(entry)}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <motion.div variants={item} className='flex justify-center pt-2'>
          <Button
            variant='outline'
            onClick={() => setVisibleCount((prev) => prev + 10)}
            className='gap-2'
          >
            <ChevronDown className='h-4 w-4' />
            Load More Activities
            <Badge variant='secondary' className='ml-1 h-5 px-1.5 text-[10px]'>
              {filteredActivities.length - visibleCount}
            </Badge>
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}
