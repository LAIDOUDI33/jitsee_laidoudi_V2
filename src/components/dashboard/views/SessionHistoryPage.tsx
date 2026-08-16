'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  History, Search, Download, Filter, Clock, Users, Video, Mic, Radio,
  Star, ChevronRight, ChevronLeft, Calendar, ArrowUpDown, Play, FileText,
  Brain, Eye, X, ExternalLink, BarChart3, MessageSquare, UserCheck
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

const typeConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  Video: { color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-900/30', icon: <Video className='h-3.5 w-3.5' /> },
  Audio: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', icon: <Mic className='h-3.5 w-3.5' /> },
  Webinar: { color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-900/30', icon: <Radio className='h-3.5 w-3.5' /> },
  'Screen Share': { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: <MonitorUp className='h-3.5 w-3.5' /> },
}

const statusConfig: Record<string, { color: string; bg: string }> = {
  Completed: { color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  Cancelled: { color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  Expired: { color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  'In Progress': { color: 'text-sky-700 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-900/30' },
}

function MonitorUp(props: any) { return <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' {...props}><path d='M8 21h8'/><path d='M12 17v4'/><path d='m17 5-5-3-5 3'/><rect width='22' height='14' x='1' y='3' rx='2'/></svg> }

function useCountUp(target: number, duration: number = 1200) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0; const startTime = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(target * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return count
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className='flex items-center gap-0.5'>
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`h-3 w-3 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  )
}

const mockSessions = [
  { id: 's1', title: 'Q4 Strategy Review', type: 'Video', status: 'Completed', date: '2025-01-15T14:00:00', duration: 87, participants: 12, host: 'Alex Chen', hostInitials: 'AC', hostColor: 'bg-violet-600', hasRecording: true, hasSummary: true, quality: 5, notes: 'Discussed Q4 roadmap, approved 3 major initiatives' },
  { id: 's2', title: 'Design Sprint Kickoff', type: 'Video', status: 'Completed', date: '2025-01-15T10:00:00', duration: 45, participants: 6, host: 'Sarah Kim', hostInitials: 'SK', hostColor: 'bg-emerald-600', hasRecording: true, hasSummary: false, quality: 4, notes: 'Defined sprint goals and assigned design challenges' },
  { id: 's3', title: 'Weekly Team Standup', type: 'Audio', status: 'Completed', date: '2025-01-14T09:00:00', duration: 12, participants: 8, host: 'Marcus Rivera', hostInitials: 'MR', hostColor: 'bg-sky-600', hasRecording: false, hasSummary: false, quality: 3, notes: 'Quick status updates, no blockers' },
  { id: 's4', title: 'Product Demo - Enterprise Client', type: 'Webinar', status: 'Completed', date: '2025-01-14T15:00:00', duration: 62, participants: 45, host: 'Priya Patel', hostInitials: 'PP', hostColor: 'bg-rose-600', hasRecording: true, hasSummary: true, quality: 5, notes: 'Demoed new analytics features, received positive feedback' },
  { id: 's5', title: 'Engineering All-Hands', type: 'Video', status: 'Completed', date: '2025-01-13T11:00:00', duration: 55, participants: 32, host: 'Jordan Lee', hostInitials: 'JL', hostColor: 'bg-amber-600', hasRecording: true, hasSummary: true, quality: 4, notes: 'Architecture decisions, new tech stack announcement' },
  { id: 's6', title: '1-on-1 with Manager', type: 'Video', status: 'Completed', date: '2025-01-13T14:30:00', duration: 30, participants: 2, host: 'Alex Chen', hostInitials: 'AC', hostColor: 'bg-violet-600', hasRecording: false, hasSummary: false, quality: 5, notes: 'Career development discussion' },
  { id: 's7', title: 'Bug Triage Meeting', type: 'Screen Share', status: 'Completed', date: '2025-01-12T10:00:00', duration: 38, participants: 5, host: 'Sarah Kim', hostInitials: 'SK', hostColor: 'bg-emerald-600', hasRecording: true, hasSummary: false, quality: 4, notes: 'Triaged 23 bugs, prioritized 8 for sprint' },
  { id: 's8', title: 'Client Onboarding Call', type: 'Video', status: 'Completed', date: '2025-01-12T14:00:00', duration: 42, participants: 7, host: 'Marcus Rivera', hostInitials: 'MR', hostColor: 'bg-sky-600', hasRecording: true, hasSummary: true, quality: 4, notes: 'New client Acme Corp onboarding completed' },
  { id: 's9', title: 'Retrospective - Sprint 14', type: 'Video', status: 'Completed', date: '2025-01-11T16:00:00', duration: 50, participants: 9, host: 'Jordan Lee', hostInitials: 'JL', hostColor: 'bg-amber-600', hasRecording: true, hasSummary: true, quality: 5, notes: 'What went well, what to improve, action items defined' },
  { id: 's10', title: 'Marketing Sync', type: 'Audio', status: 'Completed', date: '2025-01-11T10:00:00', duration: 25, participants: 4, host: 'Priya Patel', hostInitials: 'PP', hostColor: 'bg-rose-600', hasRecording: false, hasSummary: false, quality: 3, notes: 'Reviewed campaign performance metrics' },
  { id: 's11', title: 'Security Review Board', type: 'Video', status: 'Completed', date: '2025-01-10T13:00:00', duration: 72, participants: 6, host: 'Alex Chen', hostInitials: 'AC', hostColor: 'bg-violet-600', hasRecording: true, hasSummary: true, quality: 5, notes: 'Reviewed 3 security incidents, approved new policies' },
  { id: 's12', title: 'Investor Update Call', type: 'Webinar', status: 'Completed', date: '2025-01-10T09:00:00', duration: 35, participants: 15, host: 'Marcus Rivera', hostInitials: 'MR', hostColor: 'bg-sky-600', hasRecording: true, hasSummary: true, quality: 5, notes: 'Quarterly metrics presentation, strong growth reported' },
  { id: 's13', title: 'UX Research Debrief', type: 'Video', status: 'Completed', date: '2025-01-09T15:00:00', duration: 48, participants: 7, host: 'Sarah Kim', hostInitials: 'SK', hostColor: 'bg-emerald-600', hasRecording: true, hasSummary: false, quality: 4, notes: 'User testing results for new dashboard layout' },
  { id: 's14', title: 'Quick Sync - Design Team', type: 'Audio', status: 'Completed', date: '2025-01-09T11:00:00', duration: 8, participants: 3, host: 'Jordan Lee', hostInitials: 'JL', hostColor: 'bg-amber-600', hasRecording: false, hasSummary: false, quality: 3, notes: 'Alignment on icon style and spacing system' },
  { id: 's15', title: 'Partner Integration Workshop', type: 'Screen Share', status: 'Completed', date: '2025-01-08T10:00:00', duration: 95, participants: 11, host: 'Priya Patel', hostInitials: 'PP', hostColor: 'bg-rose-600', hasRecording: true, hasSummary: true, quality: 4, notes: 'Technical deep-dive on API integration with Slack and Teams' },
  { id: 's16', title: 'Hiring Committee - Senior Dev', type: 'Video', status: 'Cancelled', date: '2025-01-08T14:00:00', duration: 0, participants: 4, host: 'Alex Chen', hostInitials: 'AC', hostColor: 'bg-violet-600', hasRecording: false, hasSummary: false, quality: 0, notes: 'Candidate withdrew' },
  { id: 's17', title: 'Sprint 15 Planning', type: 'Video', status: 'Completed', date: '2025-01-07T10:00:00', duration: 90, participants: 10, host: 'Jordan Lee', hostInitials: 'JL', hostColor: 'bg-amber-600', hasRecording: true, hasSummary: true, quality: 5, notes: 'Planned 42 story points, allocated resources' },
  { id: 's18', title: 'Emergency Security Patch Review', type: 'Video', status: 'Completed', date: '2025-01-07T16:30:00', duration: 18, participants: 5, host: 'Alex Chen', hostInitials: 'AC', hostColor: 'bg-violet-600', hasRecording: true, hasSummary: true, quality: 4, notes: 'Reviewed and approved critical security patch' },
  { id: 's19', title: 'Company Town Hall', type: 'Webinar', status: 'Completed', date: '2025-01-06T14:00:00', duration: 65, participants: 156, host: 'Marcus Rivera', hostInitials: 'MR', hostColor: 'bg-sky-600', hasRecording: true, hasSummary: true, quality: 5, notes: 'CEO address, Q&A, new product announcement' },
  { id: 's20', title: 'Training: New Features Workshop', type: 'Screen Share', status: 'Expired', date: '2025-01-05T10:00:00', duration: 0, participants: 0, host: 'Sarah Kim', hostInitials: 'SK', hostColor: 'bg-emerald-600', hasRecording: false, hasSummary: false, quality: 0, notes: 'No attendees' },
]

export default function SessionHistoryPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [durationFilter, setDurationFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)
  const [selectedSession, setSelectedSession] = useState<typeof mockSessions[0] | null>(null)
  const perPage = 10

  const filtered = useMemo(() => {
    let result = [...mockSessions]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(s => s.title.toLowerCase().includes(q) || s.host.toLowerCase().includes(q))
    }
    if (typeFilter !== 'all') result = result.filter(s => s.type === typeFilter)
    if (statusFilter !== 'all') result = result.filter(s => s.status === statusFilter)
    if (durationFilter !== 'all') {
      result = result.filter(s => {
        if (durationFilter === 'short') return s.duration > 0 && s.duration < 15
        if (durationFilter === 'medium-short') return s.duration >= 15 && s.duration < 30
        if (durationFilter === 'medium-long') return s.duration >= 30 && s.duration < 60
        if (durationFilter === 'long') return s.duration >= 60
        return true
      })
    }
    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return new Date(a.date).getTime() - new Date(b.date).getTime()
        case 'longest': return b.duration - a.duration
        case 'shortest': return a.duration - b.duration
        default: return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
    })
    return result
  }, [search, typeFilter, statusFilter, durationFilter, sortBy])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const totalHours = useCountUp(Math.round(mockSessions.reduce((a, s) => a + s.duration, 0) / 60 * 10) / 10)
  const totalSessions = useCountUp(mockSessions.length)
  const avgDuration = useCountUp(Math.round(mockSessions.reduce((a, s) => a + s.duration, 0) / mockSessions.filter(s => s.duration > 0).length))
  const uniqueParticipants = useCountUp(new Set(mockSessions.flatMap(s => Array(s.participants).fill(0).map((_, i) => `${s.host}-${i}`))).size)

  function formatDuration(mins: number) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20'>
            <History className='h-5 w-5 text-white' />
          </div>
          <div>
            <h1 className='text-xl font-bold tracking-tight flex items-center gap-2'>
              Session History
              <Badge className='bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold px-2'>
                {filtered.length} sessions
              </Badge>
            </h1>
            <p className='text-sm text-muted-foreground'>Review your past meetings and sessions</p>
          </div>
        </div>
        <Button
          variant='outline'
          size='sm'
          className='gap-2 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400 transition-colors'
          onClick={() => toast.success('Export started', { description: 'Your session history will be downloaded as CSV' })}
        >
          <Download className='h-4 w-4' /> Export
        </Button>
      </motion.div>

      {/* Gradient accent line */}
      <div className='h-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500' />

      {/* Stats Row */}
      <motion.div variants={stagger} initial='hidden' animate='show' className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {[
          { label: 'Total Sessions', value: totalSessions, suffix: '', icon: <Video className='h-4 w-4' />, gradient: 'from-emerald-500 to-teal-500', shadowColor: 'shadow-emerald-500/20' },
          { label: 'Total Hours', value: totalHours, suffix: 'h', icon: <Clock className='h-4 w-4' />, gradient: 'from-sky-500 to-blue-500', shadowColor: 'shadow-sky-500/20' },
          { label: 'Avg Duration', value: avgDuration, suffix: 'm', icon: <BarChart3 className='h-4 w-4' />, gradient: 'from-violet-500 to-purple-500', shadowColor: 'shadow-violet-500/20' },
          { label: 'Unique Participants', value: uniqueParticipants, suffix: '', icon: <Users className='h-4 w-4' />, gradient: 'from-amber-500 to-orange-500', shadowColor: 'shadow-amber-500/20' },
        ].map((stat) => (
          <motion.div key={stat.label} variants={fadeUp}>
            <Card className='border-border/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden'>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between mb-2'>
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.shadowColor} text-white`}>
                    {stat.icon}
                  </div>
                </div>
                <p className='text-2xl font-bold tracking-tight tabular-nums'>{stat.value}{stat.suffix}</p>
                <p className='text-xs text-muted-foreground mt-1'>{stat.label}</p>
              </CardContent>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className='border-border/50'>
          <CardContent className='p-4'>
            <div className='flex flex-col lg:flex-row gap-3'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search sessions...'
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  className='pl-9 h-9'
                />
              </div>
              <div className='flex flex-wrap gap-2'>
                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
                  <SelectTrigger className='w-36 h-9 text-xs'><SelectValue placeholder='Type' /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Types</SelectItem>
                    <SelectItem value='Video'>Video</SelectItem>
                    <SelectItem value='Audio'>Audio</SelectItem>
                    <SelectItem value='Webinar'>Webinar</SelectItem>
                    <SelectItem value='Screen Share'>Screen Share</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                  <SelectTrigger className='w-36 h-9 text-xs'><SelectValue placeholder='Status' /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Status</SelectItem>
                    <SelectItem value='Completed'>Completed</SelectItem>
                    <SelectItem value='Cancelled'>Cancelled</SelectItem>
                    <SelectItem value='Expired'>Expired</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={durationFilter} onValueChange={(v) => { setDurationFilter(v); setPage(1) }}>
                  <SelectTrigger className='w-36 h-9 text-xs'><SelectValue placeholder='Duration' /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Durations</SelectItem>
                    <SelectItem value='short'>{'< 15 min'}</SelectItem>
                    <SelectItem value='medium-short'>15-30 min</SelectItem>
                    <SelectItem value='medium-long'>30-60 min</SelectItem>
                    <SelectItem value='long'>{'> 1 hour'}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className='w-36 h-9 text-xs'><SelectValue placeholder='Sort' /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='newest'>Newest First</SelectItem>
                    <SelectItem value='oldest'>Oldest First</SelectItem>
                    <SelectItem value='longest'>Longest First</SelectItem>
                    <SelectItem value='shortest'>Shortest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Session List */}
      <motion.div variants={stagger} initial='hidden' animate='show'>
        <Card className='border-border/50'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-base font-semibold flex items-center gap-2'>
                <Filter className='h-4 w-4 text-muted-foreground' />
                Sessions
                <span className='text-sm font-normal text-muted-foreground'>({(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length})</span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className='p-0'>
            {paginated.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-16 text-muted-foreground'>
                <History className='h-12 w-12 mb-4 opacity-30' />
                <p className='text-sm font-medium'>No sessions found</p>
                <p className='text-xs mt-1'>Try adjusting your filters or search query</p>
              </div>
            ) : (
              <div className='max-h-[600px] overflow-y-auto' style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(155,155,155,0.3) transparent' }}>
                <style>{`.session-scroll::-webkit-scrollbar{width:5px}.session-scroll::-webkit-scrollbar-track{background:transparent}.session-scroll::-webkit-scrollbar-thumb{background:rgba(155,155,155,0.3);border-radius:10px}`}</style>
                <div className='session-scroll'>
                  {paginated.map((session, i) => {
                    const tc = typeConfig[session.type] || typeConfig.Video
                    const sc = statusConfig[session.status] || statusConfig.Completed
                    return (
                      <motion.div
                        key={session.id}
                        variants={fadeUp}
                        className='flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition-colors border-b last:border-0 cursor-pointer group'
                        onClick={() => setSelectedSession(session)}
                      >
                        {/* Type icon */}
                        <div className={`w-10 h-10 rounded-xl ${tc.bg} ${tc.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                          {tc.icon}
                        </div>
                        {/* Main info */}
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2 mb-1'>
                            <p className='text-sm font-semibold truncate'>{session.title}</p>
                            <Badge variant='secondary' className={`${tc.bg} ${tc.color} text-[10px] font-semibold px-1.5 py-0 shrink-0`}>
                              {tc.icon} {session.type}
                            </Badge>
                            <Badge variant='secondary' className={`${sc.bg} ${sc.color} text-[10px] font-semibold px-1.5 py-0 shrink-0`}>
                              {session.status}
                            </Badge>
                          </div>
                          <div className='flex items-center gap-3 text-xs text-muted-foreground'>
                            <span className='flex items-center gap-1'><Calendar className='h-3 w-3' />{formatDate(session.date)}</span>
                            <span className='flex items-center gap-1'><Clock className='h-3 w-3' />{formatTime(session.date)}</span>
                            <span className='flex items-center gap-1'><UserCheck className='h-3 w-3' />{session.host}</span>
                          </div>
                        </div>
                        {/* Meta badges */}
                        <div className='hidden md:flex items-center gap-2 shrink-0'>
                          {session.hasRecording && (
                            <TooltipProvider><Tooltip><TooltipTrigger><Badge variant='secondary' className='bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] gap-1'><Play className='h-3 w-3' />Rec</Badge></TooltipTrigger><TooltipContent>Recording available</TooltipContent></Tooltip></TooltipProvider>
                          )}
                          {session.hasSummary && (
                            <TooltipProvider><Tooltip><TooltipTrigger><Badge variant='secondary' className='bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-[10px] gap-1'><Brain className='h-3 w-3' />AI</Badge></TooltipTrigger><TooltipContent>AI summary available</TooltipContent></Tooltip></TooltipProvider>
                          )}
                        </div>
                        {/* Duration + participants */}
                        <div className='text-right shrink-0 hidden sm:block'>
                          <p className='text-sm font-semibold tabular-nums'>{session.duration > 0 ? formatDuration(session.duration) : '—'}</p>
                          <div className='flex items-center justify-end gap-1 text-xs text-muted-foreground'>
                            <Users className='h-3 w-3' />{session.participants}
                          </div>
                          {session.quality > 0 && <StarRating rating={session.quality} />}
                        </div>
                        <ChevronRight className='h-4 w-4 text-muted-foreground/50 group-hover:text-foreground transition-colors shrink-0' />
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex items-center justify-between px-6 py-3 border-t'>
              <p className='text-xs text-muted-foreground'>Page {page} of {totalPages}</p>
              <div className='flex items-center gap-2'>
                <Button variant='outline' size='sm' className='h-8 w-8 p-0' disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className='h-4 w-4' />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <Button key={p} variant={p === page ? 'default' : 'outline'} size='sm' className='h-8 w-8 p-0 text-xs' onClick={() => setPage(p)}>{p}</Button>
                ))}
                <Button variant='outline' size='sm' className='h-8 w-8 p-0' disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Session Detail Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className='max-w-lg'>
          {selectedSession && (
            <>
              <DialogHeader>
                <DialogTitle className='flex items-center gap-2 text-lg'>
                  <div className={`w-8 h-8 rounded-lg ${typeConfig[selectedSession.type]?.bg} ${typeConfig[selectedSession.type]?.color} flex items-center justify-center`}>
                    {typeConfig[selectedSession.type]?.icon}
                  </div>
                  {selectedSession.title}
                </DialogTitle>
              </DialogHeader>
              <div className='space-y-4 mt-2'>
                <div className='grid grid-cols-2 gap-3'>
                  {[
                    { label: 'Type', value: selectedSession.type, icon: <Video className='h-3.5 w-3.5' /> },
                    { label: 'Status', value: selectedSession.status, icon: <Eye className='h-3.5 w-3.5' /> },
                    { label: 'Date', value: `${formatDate(selectedSession.date)} at ${formatTime(selectedSession.date)}`, icon: <Calendar className='h-3.5 w-3.5' /> },
                    { label: 'Duration', value: selectedSession.duration > 0 ? formatDuration(selectedSession.duration) : 'N/A', icon: <Clock className='h-3.5 w-3.5' /> },
                    { label: 'Participants', value: String(selectedSession.participants), icon: <Users className='h-3.5 w-3.5' /> },
                    { label: 'Host', value: selectedSession.host, icon: <UserCheck className='h-3.5 w-3.5' /> },
                  ].map(item => (
                    <div key={item.label} className='flex items-start gap-2 p-2.5 rounded-lg bg-muted/50'>
                      <span className='text-muted-foreground mt-0.5'>{item.icon}</span>
                      <div>
                        <p className='text-[10px] text-muted-foreground uppercase tracking-wider'>{item.label}</p>
                        <p className='text-sm font-medium'>{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedSession.quality > 0 && (
                  <div className='flex items-center gap-2 p-2.5 rounded-lg bg-muted/50'>
                    <Star className='h-3.5 w-3.5 text-muted-foreground' />
                    <span className='text-[10px] text-muted-foreground uppercase tracking-wider'>Quality</span>
                    <StarRating rating={selectedSession.quality} />
                  </div>
                )}
                <Separator />
                <div>
                  <p className='text-xs font-semibold mb-2 flex items-center gap-1.5'><FileText className='h-3.5 w-3.5' /> Notes</p>
                  <p className='text-sm text-muted-foreground leading-relaxed'>{selectedSession.notes}</p>
                </div>
                <div className='flex gap-2'>
                  {selectedSession.hasRecording && (
                    <Button variant='outline' size='sm' className='gap-2 flex-1' onClick={() => toast.success('Opening recording...')}>
                      <Play className='h-3.5 w-3.5' /> Play Recording
                    </Button>
                  )}
                  {selectedSession.hasSummary && (
                    <Button variant='outline' size='sm' className='gap-2 flex-1' onClick={() => toast.success('Opening AI summary...')}>
                      <Brain className='h-3.5 w-3.5' /> AI Summary
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
