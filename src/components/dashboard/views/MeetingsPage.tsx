'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import {
  Video,
  Plus,
  Clock,
  Users,
  CalendarDays,
  Search,
  MoreVertical,
  ExternalLink,
  Copy,
  VideoOff,
  MonitorPlay,
  Repeat,
  Zap,
  TrendingUp,
  Timer,
  Sparkles,
  Check,
  Link2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { motion, AnimatePresence } from 'framer-motion'
import MeetingScheduler from '@/components/shared/MeetingScheduler'
import { authFetch } from '@/lib/api'

interface Meeting {
  id: string
  title: string
  status: 'upcoming' | 'active' | 'ended' | 'scheduled' | 'recurring'
  type: 'instant' | 'scheduled' | 'recurring' | 'personal'
  date: string
  time: string
  duration: string
  participants: number
  maxParticipants: number
  roomId: string
  description?: string
  host: string
}

interface ApiMeeting {
  id: string
  title: string
  meetingId: string
  type: string
  status: string
  startTime: string | null
  endTime: string | null
  maxParticipants: number
  recordingEnabled: boolean
  hostId: string | null
  settings: string | null
  host?: { id: string; name: string; email: string } | null
  participants?: { user: { id: string; name: string; email: string } }[]
}

function mapApiMeeting(m: ApiMeeting): Meeting {
  const startDate = m.startTime ? new Date(m.startTime) : null
  const settings = m.settings ? (() => { try { return JSON.parse(m.settings) } catch { return {} } })() : {}
  const dur = settings.duration || 60
  const durStr = dur >= 60 ? `${Math.floor(dur / 60)}h${dur % 60 > 0 ? ` ${dur % 60}m` : ''}` : `${dur}m`

  let status: Meeting['status'] = m.status as Meeting['status']
  if (m.status === 'scheduled' && startDate && startDate > new Date()) status = 'upcoming'
  if (m.type === 'recurring') status = 'recurring'

  return {
    id: m.id,
    title: m.title,
    status,
    type: m.type as Meeting['type'],
    date: startDate ? startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    time: startDate ? startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '',
    duration: durStr,
    participants: m.participants?.length || 0,
    maxParticipants: m.maxParticipants,
    roomId: m.meetingId,
    description: settings.description || undefined,
    host: m.host?.name || 'Unknown',
  }
}

function SkeletonCard() {
  return (
    <div className='border border-border/50 bg-card rounded-xl p-4 space-y-3 animate-pulse'>
      <div className='flex items-center gap-2'>
        <div className='h-4 w-4 rounded bg-muted' />
        <div className='h-4 w-40 rounded bg-muted' />
        <div className='h-5 w-16 rounded-full bg-muted ml-auto' />
      </div>
      <div className='flex items-center gap-3'>
        <div className='h-3 w-20 rounded bg-muted' />
        <div className='h-3 w-16 rounded bg-muted' />
        <div className='h-3 w-10 rounded bg-muted' />
      </div>
      <div className='flex items-center gap-3'>
        <div className='h-6 w-6 rounded-full bg-muted' />
        <div className='h-6 w-6 rounded-full bg-muted' />
        <div className='h-1 flex-1 rounded-full bg-muted' />
      </div>
    </div>
  )
}

const statusConfig: Record<string, { color: string; label: string; pulse?: boolean; dotColor: string }> = {
  active: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800', label: 'Active', pulse: true, dotColor: 'bg-emerald-500' },
  upcoming: { color: 'bg-sky-500/10 text-sky-600 border-sky-200 dark:border-sky-800', label: 'Upcoming', dotColor: 'bg-sky-500' },
  scheduled: { color: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800', label: 'Scheduled', dotColor: 'bg-amber-500' },
  ended: { color: 'bg-zinc-500/10 text-zinc-500 border-zinc-200 dark:border-zinc-800', label: 'Ended', dotColor: 'bg-zinc-400' },
  recurring: { color: 'bg-violet-500/10 text-violet-600 border-violet-200 dark:border-violet-800', label: 'Recurring', dotColor: 'bg-violet-500' },
}

const typeBorderColors: Record<string, string> = {
  instant: 'border-l-emerald-500',
  scheduled: 'border-l-sky-500',
  recurring: 'border-l-amber-500',
  personal: 'border-l-violet-500',
}

const typeIcons: Record<string, React.ReactNode> = {
  instant: <Video className='h-3.5 w-3.5' />,
  scheduled: <CalendarDays className='h-3.5 w-3.5' />,
  recurring: <Repeat className='h-3.5 w-3.5' />,
  personal: <MonitorPlay className='h-3.5 w-3.5' />,
}

const avatarColors = ['bg-emerald-500', 'bg-sky-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-teal-500']

function getCountdown(date: string, time: string): string | null {
  if (!date) return null
  const target = new Date(`${date}T${time === '9:00 AM' ? '09:00' : time}`)
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  if (diff <= 0) return null
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 24) return `Starts in ${Math.floor(hours / 24)}d ${hours % 24}h`
  if (hours > 0) return `Starts in ${hours}h ${mins}m`
  return `Starts in ${mins}m`
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function MeetingsPage() {
  const { setCurrentMeetingId, setMeetingTitle, setCurrentView } = useAppStore()
  const [search, setSearch] = useState('')
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [newMeeting, setNewMeeting] = useState({ title: '', date: '', time: '', duration: '30m', type: 'scheduled', description: '' })
  const [activeTab, setActiveTab] = useState('upcoming')
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set())

  const fetchMeetings = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch('/api/v1/meetings')
      if (!res.ok) throw new Error('Failed to fetch meetings')
      const json = await res.json()
      const mapped = (json.data?.meetings || []).map(mapApiMeeting)
      setMeetings(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meetings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMeetings() }, [])

  const filtered = meetings.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.host.toLowerCase().includes(search.toLowerCase())
  )

  const upcoming = filtered.filter(m => ['upcoming', 'active', 'scheduled', 'recurring'].includes(m.status))
  const past = filtered.filter(m => m.status === 'ended')

  const handleJoin = (m: Meeting) => {
    setCurrentMeetingId(m.id)
    setMeetingTitle(m.title)
    setCurrentView('meeting-room')
  }

  const handleQuickStart = () => {
    const roomId = `alv-instant-${Date.now().toString(36)}`
    const quickMeeting: Meeting = {
      id: `m-${Date.now()}`,
      title: 'Instant Meeting',
      status: 'active',
      type: 'instant',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      duration: '0m',
      participants: 1, maxParticipants: 10,
      roomId,
      host: useAppStore.getState().user?.name || 'You',
    }
    setMeetings([quickMeeting, ...meetings])
    setCurrentMeetingId(quickMeeting.id)
    setMeetingTitle(quickMeeting.title)
    setCurrentView('meeting-room')
    toast.success('Instant meeting started!')
  }

  const handleCreate = async () => {
    const roomId = `alv-${newMeeting.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`
    try {
      const res = await authFetch('/api/v1/meetings', {
        method: 'POST',
        body: JSON.stringify({ title: newMeeting.title, type: newMeeting.type, scheduledAt: newMeeting.date ? `${newMeeting.date}T${newMeeting.time || '09:00'}:00Z` : null }),
      })
      const result = await res.json()
      const meetingData = result.data?.meeting || result
      const created: Meeting = {
        id: meetingData?.id || `m-${Date.now()}`,
        title: newMeeting.title,
        status: 'upcoming',
        type: newMeeting.type as Meeting['type'],
        date: newMeeting.date || new Date().toISOString().split('T')[0],
        time: newMeeting.time || '9:00 AM',
        duration: newMeeting.duration,
        participants: 0, maxParticipants: 10,
        roomId: meetingData?.meetingId || meetingData?.roomId || roomId,
        host: useAppStore.getState().user?.name || 'You',
        description: newMeeting.description || undefined,
      }
      setMeetings([created, ...meetings])
      setCreateOpen(false)
      setNewMeeting({ title: '', date: '', time: '', duration: '30m', type: 'scheduled', description: '' })
      toast.success(`Meeting "${newMeeting.title}" created!`)
      fetchMeetings()
    } catch {
      toast.error('Failed to create meeting')
    }
  }

  const handleCopyLink = (roomId: string, id: string) => {
    navigator.clipboard.writeText(`https://alvision.ai/room/${roomId}`)
    setCopiedIds(prev => new Set(prev).add(id))
    toast.success('Room link copied to clipboard!')
    setTimeout(() => {
      setCopiedIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 2000)
  }

  function parseDurationMinutes(dur: string): number {
    const m = dur.match(/(\d+)h\s*(?:(\d+)m)?/)
    if (m) return parseInt(m[1]) * 60 + (parseInt(m[2]) || 0)
    const m2 = dur.match(/(\d+)m/)
    return m2 ? parseInt(m2[1]) : 30
  }

  const MeetingCard = ({ m }: { m: Meeting }) => {
    const countdown = getCountdown(m.date, m.time)
    const isCopied = copiedIds.has(m.id)
    const participantAvatars = Array.from({ length: Math.min(m.participants, 3) }).map((_, i) => (
      <Avatar key={i} className='h-6 w-6 border-2 border-card -ml-2 first:ml-0'>
        <AvatarFallback className={`text-[8px] text-white ${avatarColors[i % avatarColors.length]}`}>{String.fromCharCode(65 + i)}</AvatarFallback>
      </Avatar>
    ))
    const fillPct = m.maxParticipants > 0 ? Math.round((m.participants / m.maxParticipants) * 100) : 0
    // Simulated duration progress for active meetings
    const totalMinutes = parseDurationMinutes(m.duration)
    const elapsedPct = m.status === 'active' ? Math.min(65, Math.max(10, Math.round((Date.now() % 30000) / 30000 * 70 + 15))) : 0

    return (
      <motion.div variants={item} layout>
        <Card className={`group relative border border-border/50 hover:border-primary/30 bg-gradient-to-br from-card to-card/80 hover:shadow-xl hover:shadow-primary/8 transition-all duration-300 hover:-translate-y-1 rounded-xl border-l-4 before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-primary/50 before:to-primary/0 ${typeBorderColors[m.type]}`}>
          <CardContent className='p-4'>
            <div className='flex items-start justify-between gap-3'>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 mb-1.5'>
                  <span className='text-muted-foreground'>{typeIcons[m.type]}</span>
                  <h3 className='font-semibold text-sm truncate'>{m.title}</h3>
                  <Badge variant='outline' className={`text-[10px] gap-1.5 shrink-0 ${statusConfig[m.status]?.color || ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusConfig[m.status]?.dotColor || 'bg-zinc-400'} ${statusConfig[m.status]?.pulse ? 'animate-breathe' : ''}`} />
                    {statusConfig[m.status]?.label || m.status}
                  </Badge>
                </div>
                <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
                  <span className='flex items-center gap-1'><CalendarDays className='h-3 w-3' />{m.date}</span>
                  <span className='flex items-center gap-1'><Clock className='h-3 w-3' />{m.time}</span>
                  <span className='flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-muted/80 text-muted-foreground font-medium'>
                    <Clock className='h-2.5 w-2.5' />{m.duration}
                  </span>
                </div>
                {m.description && <p className='text-xs text-muted-foreground mt-1.5 line-clamp-1'>{m.description}</p>}
                {/* Duration progress bar for active meetings */}
                {m.status === 'active' && totalMinutes > 0 && (
                  <div className='mt-2'>
                    <div className='flex items-center justify-between text-[10px] text-muted-foreground mb-1'>
                      <span className='flex items-center gap-1'><Timer className='h-3 w-3 text-emerald-500' /> In progress</span>
                      <span>{Math.round(totalMinutes * elapsedPct / 100)}m / {totalMinutes}m</span>
                    </div>
                    <div className='h-1.5 rounded-full bg-emerald-500/10 overflow-hidden'>
                      <motion.div
                        className='h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400'
                        initial={{ width: 0 }}
                        animate={{ width: `${elapsedPct}%` }}
                        transition={{ duration: 1, ease: 'easeOut' as const }}
                      />
                    </div>
                  </div>
                )}
                <div className='flex items-center gap-3 mt-2.5'>
                  <div className='flex items-center gap-2'>
                    <div className='flex'>{participantAvatars}</div>
                    <span className='text-xs text-muted-foreground'>{m.participants}/{m.maxParticipants}</span>
                  </div>
                  <div className='flex-1 max-w-[80px]'>
                    <div className='h-1 rounded-full bg-muted overflow-hidden'>
                      <div className='h-full rounded-full bg-primary/50 transition-all' style={{ width: `${fillPct}%` }} />
                    </div>
                  </div>
                  <span className='text-[10px] text-muted-foreground'>Hosted by {m.host}</span>
                </div>
                {countdown && (
                  <div className='flex items-center gap-1.5 mt-2 text-xs text-primary font-medium'>
                    <Timer className='h-3 w-3' /> {countdown}
                  </div>
                )}
              </div>
              <div className='flex items-center gap-2 shrink-0'>
                {/* Copy Link button with animated checkmark */}
                <Button
                  size='sm'
                  variant='ghost'
                  className='h-8 w-8 p-0 hover:scale-110 active:scale-95 transition-transform'
                  onClick={() => handleCopyLink(m.roomId, m.id)}
                >
                  <AnimatePresence mode='wait'>
                    {isCopied ? (
                      <motion.span
                        key='check'
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 90 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className='flex items-center justify-center text-emerald-500'
                      >
                        <Check className='h-4 w-4' />
                      </motion.span>
                    ) : (
                      <motion.span
                        key='link'
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className='flex items-center justify-center'
                      >
                        <Link2 className='h-4 w-4' />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
                {m.status === 'active' ? (
                  <Button size='sm' className='gap-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={() => handleJoin(m)}>
                    <Video className='h-3.5 w-3.5' /> Join
                  </Button>
                ) : m.status !== 'ended' ? (
                  <Button size='sm' variant='outline' className='gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={() => handleJoin(m)}>
                    <ExternalLink className='h-3.5 w-3.5' /> Open
                  </Button>
                ) : null}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon' className='h-8 w-8'>
                      <MoreVertical className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem className='gap-2' onClick={() => handleCopyLink(m.roomId, m.id)}><Copy className='h-4 w-4' /> Copy Room Link</DropdownMenuItem>
                    <DropdownMenuItem className='gap-2' onClick={() => handleJoin(m)}><Video className='h-4 w-4' /> {m.status === 'active' ? 'Join Now' : 'Start Early'}</DropdownMenuItem>
                    {m.status !== 'ended' && <DropdownMenuSeparator />}
                    {m.status !== 'ended' && <DropdownMenuItem className='gap-2 text-red-600'><VideoOff className='h-4 w-4' /> Cancel Meeting</DropdownMenuItem>}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const sparkline = (bars: number[], color: string) => (
    <div className='flex items-end gap-[2px] h-5'>
      {bars.map((v, i) => (
        <div key={i} className={`w-1 rounded-full ${color} transition-all`} style={{ height: `${v}%` }} />
      ))}
    </div>
  )

  return (
    <div className='space-y-6'>
      {/* Header with subtitle and decorative accent */}
      <div className='relative'>
        <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4'>
          <div>
            <h2 className='text-3xl font-bold tracking-tight'>Meetings</h2>
            <p className='text-muted-foreground text-sm mt-1'>Schedule, manage, and join your video conferences</p>
            <div className='h-1 w-12 rounded-full bg-gradient-to-r from-primary to-primary/50 mt-2' />
          </div>
          <div className='flex items-center gap-2'>
            <Button className='gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={handleQuickStart}>
              <Zap className='h-4 w-4' /> Quick Start
            </Button>
            <MeetingScheduler
              onMeetingCreated={(m) => {
                const created: Meeting = {
                  id: m.id,
                  title: m.title,
                  status: 'upcoming',
                  type: m.type as Meeting['type'],
                  date: m.date,
                  time: m.time,
                  duration: m.duration,
                  participants: 0, maxParticipants: 10,
                  roomId: m.roomId,
                  host: useAppStore.getState().user?.name || 'You',
                  description: m.description,
                }
                setMeetings(prev => [created, ...prev])
                fetchMeetings()
              }}
            />
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button variant='outline' className='gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform'><Plus className='h-4 w-4' /> Quick Create</Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-lg'>
                <DialogHeader>
                  <div className='flex items-center gap-3 mb-2'>
                    <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center'>
                      <Sparkles className='h-5 w-5 text-primary-foreground' />
                    </div>
                    <div>
                      <DialogTitle>Schedule a Meeting</DialogTitle>
                      <p className='text-sm text-muted-foreground mt-0.5'>Set up your next video conference</p>
                    </div>
                  </div>
                </DialogHeader>
                <div className='space-y-4 pt-2'>
                  <div className='space-y-2'>
                    <Label>Meeting Title</Label>
                    <Input placeholder='Enter meeting title' value={newMeeting.title} onChange={e => setNewMeeting(p => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'><Label>Date</Label><Input type='date' value={newMeeting.date} onChange={e => setNewMeeting(p => ({ ...p, date: e.target.value }))} /></div>
                    <div className='space-y-2'><Label>Time</Label><Input type='time' value={newMeeting.time} onChange={e => setNewMeeting(p => ({ ...p, time: e.target.value }))} /></div>
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label>Duration</Label>
                      <Select value={newMeeting.duration} onValueChange={v => setNewMeeting(p => ({ ...p, duration: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value='15m'>15 minutes</SelectItem>
                          <SelectItem value='30m'>30 minutes</SelectItem>
                          <SelectItem value='45m'>45 minutes</SelectItem>
                          <SelectItem value='1h'>1 hour</SelectItem>
                          <SelectItem value='1h30m'>1.5 hours</SelectItem>
                          <SelectItem value='2h'>2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='space-y-2'>
                      <Label>Type</Label>
                      <Select value={newMeeting.type} onValueChange={v => setNewMeeting(p => ({ ...p, type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value='scheduled'>Scheduled</SelectItem>
                          <SelectItem value='recurring'>Recurring</SelectItem>
                          <SelectItem value='instant'>Instant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <Label>Description (optional)</Label>
                    <Textarea placeholder='Meeting agenda or notes...' rows={3} value={newMeeting.description} onChange={e => setNewMeeting(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div className='flex justify-end gap-3 pt-2'>
                    <Button variant='outline' onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={!newMeeting.title} className='bg-gradient-to-r from-primary to-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-transform'>Create Meeting</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className='relative max-w-md'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
        <Input placeholder='Search meetings...' className='pl-9' value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Stats row with trends and sparklines */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <motion.div variants={item} initial='hidden' animate='show'>
          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300'>
            <CardContent className='p-4 flex items-center gap-3'>
              <div className='p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5'><Video className='h-5 w-5 text-emerald-600' /></div>
              <div className='flex-1'>
                <div className='flex items-center justify-between'>
                  <p className='text-2xl font-bold'>{meetings.filter(m => m.status === 'active').length}</p>
                  <span className='text-[10px] font-medium text-emerald-600 flex items-center gap-0.5'><TrendingUp className='h-2.5 w-2.5' />Live</span>
                </div>
                <p className='text-xs text-muted-foreground'>Active Now</p>
                {sparkline([30, 50, 40, 60, 80, 70, 90], 'bg-emerald-500/40')}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item} initial='hidden' animate='show'>
          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300'>
            <CardContent className='p-4 flex items-center gap-3'>
              <div className='p-2.5 rounded-xl bg-gradient-to-br from-sky-500/10 to-sky-500/5'><CalendarDays className='h-5 w-5 text-sky-600' /></div>
              <div className='flex-1'>
                <div className='flex items-center justify-between'>
                  <p className='text-2xl font-bold'>{upcoming.length}</p>
                  <span className='text-[10px] font-medium text-emerald-600 flex items-center gap-0.5'><TrendingUp className='h-2.5 w-2.5' />+12%</span>
                </div>
                <p className='text-xs text-muted-foreground'>Upcoming</p>
                {sparkline([20, 35, 45, 30, 55, 50, 65], 'bg-sky-500/40')}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item} initial='hidden' animate='show'>
          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300'>
            <CardContent className='p-4 flex items-center gap-3'>
              <div className='p-2.5 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5'><Repeat className='h-5 w-5 text-amber-600' /></div>
              <div className='flex-1'>
                <div className='flex items-center justify-between'>
                  <p className='text-2xl font-bold'>{meetings.filter(m => m.type === 'recurring').length}</p>
                  <span className='text-[10px] font-medium text-muted-foreground flex items-center gap-0.5'>Stable</span>
                </div>
                <p className='text-xs text-muted-foreground'>Recurring</p>
                {sparkline([40, 40, 45, 42, 40, 44, 43], 'bg-amber-500/40')}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item} initial='hidden' animate='show'>
          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300'>
            <CardContent className='p-4 flex items-center gap-3'>
              <div className='p-2.5 rounded-xl bg-gradient-to-br from-zinc-500/10 to-zinc-500/5'><VideoOff className='h-5 w-5 text-zinc-500' /></div>
              <div className='flex-1'>
                <div className='flex items-center justify-between'>
                  <p className='text-2xl font-bold'>{past.length}</p>
                  <span className='text-[10px] font-medium text-red-500 flex items-center gap-0.5'>↓ 3%</span>
                </div>
                <p className='text-xs text-muted-foreground'>Ended</p>
                {sparkline([60, 55, 50, 45, 48, 40, 35], 'bg-zinc-400/40')}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Meeting lists with animated tab underline */}
      <div>
        <div className='relative flex gap-1 border-b border-border/50 mb-4'>
          {[
            { value: 'upcoming', label: `Upcoming & Active (${upcoming.length})` },
            { value: 'past', label: `Past (${past.length})` },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.value ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {activeTab === tab.value && (
                <motion.div
                  layoutId='meeting-tab-underline'
                  className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-primary/60 rounded-full'
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
        {error && (
          <div className='flex items-center justify-center py-8'>
            <p className='text-sm text-red-500'>{error}</p>
            <Button variant='outline' className='ml-3 text-xs' onClick={fetchMeetings}>Retry</Button>
          </div>
        )}
        {loading && !error && (
          <div className='space-y-3 max-h-[calc(100vh-420px)] overflow-y-auto pr-1'>
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}
        {!loading && !error && (
        <AnimatePresence mode='wait'>
          {activeTab === 'upcoming' ? (
            <motion.div
              key='upcoming'
              variants={container} initial='hidden' animate='show'
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className='space-y-3 max-h-[calc(100vh-420px)] overflow-y-auto pr-1'
            >
              <AnimatePresence>
                {upcoming.map(m => <MeetingCard key={m.id} m={m} />)}
              </AnimatePresence>
              {upcoming.length === 0 && (
                <div className='flex flex-col items-center justify-center py-16'>
                  <div className='relative'>
                    <Video className='h-16 w-16 text-muted-foreground/20' />
                    <div className='absolute inset-0 flex items-center justify-center'>
                      <Video className='h-8 w-8 text-muted-foreground/40' />
                    </div>
                  </div>
                  <p className='font-medium mt-4'>No upcoming meetings</p>
                  <p className='text-sm text-muted-foreground mt-1'>Schedule a new meeting to get started</p>
                  <Button variant='outline' className='mt-4 gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={() => setCreateOpen(true)}>
                    <Plus className='h-4 w-4' /> Create Meeting
                  </Button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key='past'
              variants={container} initial='hidden' animate='show'
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className='space-y-3 max-h-[calc(100vh-420px)] overflow-y-auto pr-1'
            >
              <AnimatePresence>
                {past.map(m => <MeetingCard key={m.id} m={m} />)}
              </AnimatePresence>
              {past.length === 0 && (
                <div className='flex flex-col items-center justify-center py-16'>
                  <div className='relative'>
                    <VideoOff className='h-16 w-16 text-muted-foreground/20' />
                    <div className='absolute inset-0 flex items-center justify-center'>
                      <VideoOff className='h-8 w-8 text-muted-foreground/40' />
                    </div>
                  </div>
                  <p className='font-medium mt-4'>No past meetings</p>
                  <p className='text-sm text-muted-foreground mt-1'>Your completed meetings will appear here</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        )}
      </div>
    </div>
  )
}
