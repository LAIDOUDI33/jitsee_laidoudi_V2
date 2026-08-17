'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { authFetch } from '@/lib/api'
import { toast } from 'sonner'
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

function MonitorUp(props: React.SVGProps<SVGSVGElement>) { return <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' {...props}><path d='M8 21h8'/><path d='M12 17v4'/><path d='m17 5-5-3-5 3'/><rect width='22' height='14' x='1' y='3' rx='2'/></svg> }

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

const hostColors = ['bg-violet-600', 'bg-emerald-600', 'bg-sky-600', 'bg-rose-600', 'bg-amber-600', 'bg-cyan-600']

interface SessionRecord {
  id: string
  title: string
  type: string
  status: string
  date: string
  duration: number
  participants: number
  host: string
  hostInitials: string
  hostColor: string
  hasRecording: boolean
  hasSummary: boolean
  quality: number
  notes: string
}

const defaultSessions: SessionRecord[] = []

export default function SessionHistoryPage() {
  const [sessions, setSessions] = useState(defaultSessions)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [durationFilter, setDurationFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)
  const [selectedSession, setSelectedSession] = useState<SessionRecord | null>(null)
  const perPage = 10

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true)
      const res = await authFetch('/api/v1/meetings?status=ended')
      if (!res.ok) throw new Error('Failed to fetch sessions')
      const json = await res.json()
      const meetings = json.data?.meetings || []
      const mapped: SessionRecord[] = meetings.map((m: Record<string, unknown>, i: number) => {
        const hostData = m.host as Record<string, unknown> | undefined
        const hostName = hostData?.name ? String(hostData.name) : 'Unknown'
        const initials = hostName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
        const start = m.startTime ? new Date(String(m.startTime)) : null
        const end = m.endTime ? new Date(String(m.endTime)) : null
        const dur = start && end ? Math.round((end.getTime() - start.getTime()) / 60000) : 0
        const hasRec = Array.isArray(m.recordings) && m.recordings.length > 0
        const hasSum = false
        return {
          id: String(m.id ?? ''),
          title: String(m.title ?? ''),
          type: 'Video',
          status: m.status === 'ended' ? 'Completed' : String(m.status ?? ''),
          date: String(m.startTime || m.createdAt || ''),
          duration: dur || 0,
          participants: Array.isArray(m.participants) ? m.participants.length : 0,
          host: hostName,
          hostInitials: initials,
          hostColor: hostColors[i % hostColors.length],
          hasRecording: hasRec,
          hasSummary: hasSum,
          quality: dur > 30 ? 4 : 3,
          notes: '',
        }
      })
      setSessions(mapped)
    } catch {
      toast.error('Failed to load session history')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const filtered = useMemo(() => {
    let result = [...sessions]
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

  const completedSessions = sessions.filter(s => s.duration > 0)
  const totalHours = useCountUp(Math.round(sessions.reduce((a, s) => a + s.duration, 0) / 60 * 10) / 10)
  const totalSessions = useCountUp(sessions.length)
  const avgDuration = useCountUp(completedSessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + s.duration, 0) / completedSessions.length) : 0)
  const uniqueParticipants = useCountUp(sessions.reduce((a, s) => a + s.participants, 0))

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
