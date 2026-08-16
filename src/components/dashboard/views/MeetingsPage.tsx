'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
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

const mockMeetings: Meeting[] = [
  { id: 'm1', title: 'Q4 Strategy Review', status: 'upcoming', type: 'scheduled', date: '2025-01-15', time: '10:00 AM', duration: '1h', participants: 5, maxParticipants: 10, roomId: 'alv-q4-strategy', host: 'Sarah Chen', description: 'Quarterly strategy alignment meeting' },
  { id: 'm2', title: 'Product Design Sprint', status: 'active', type: 'instant', date: '2025-01-14', time: '2:30 PM', duration: '45m', participants: 3, maxParticipants: 8, roomId: 'alv-design-sprint', host: 'You' },
  { id: 'm3', title: 'Engineering Standup', status: 'scheduled', type: 'recurring', date: '2025-01-15', time: '9:00 AM', duration: '15m', participants: 7, maxParticipants: 15, roomId: 'alv-standup', host: 'Mike Johnson' },
  { id: 'm4', title: 'Client Onboarding - Acme Corp', status: 'upcoming', type: 'scheduled', date: '2025-01-16', time: '11:00 AM', duration: '1h 30m', participants: 2, maxParticipants: 6, roomId: 'alv-acme-onboard', host: 'Emily Davis' },
  { id: 'm5', title: 'Weekly Team Sync', status: 'scheduled', type: 'recurring', date: '2025-01-13', time: '3:00 PM', duration: '30m', participants: 9, maxParticipants: 20, roomId: 'alv-team-sync', host: 'Sarah Chen' },
  { id: 'm6', title: '1:1 with Manager', status: 'upcoming', type: 'scheduled', date: '2025-01-14', time: '4:00 PM', duration: '30m', participants: 1, maxParticipants: 2, roomId: 'alv-1on1', host: 'Alex Turner' },
  { id: 'm7', title: 'Security Review Board', status: 'ended', type: 'scheduled', date: '2025-01-12', time: '10:00 AM', duration: '2h', participants: 6, maxParticipants: 8, roomId: 'alv-sec-review', host: 'James Wilson' },
  { id: 'm8', title: 'Marketing Campaign Planning', status: 'ended', type: 'scheduled', date: '2025-01-11', time: '1:00 PM', duration: '1h', participants: 4, maxParticipants: 10, roomId: 'alv-mktg-plan', host: 'Lisa Park' },
]

const statusConfig: Record<string, { color: string; label: string; pulse?: boolean }> = {
  active: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800', label: 'Active', pulse: true },
  upcoming: { color: 'bg-sky-500/10 text-sky-600 border-sky-200 dark:border-sky-800', label: 'Upcoming' },
  scheduled: { color: 'bg-violet-500/10 text-violet-600 border-violet-200 dark:border-violet-800', label: 'Scheduled' },
  ended: { color: 'bg-zinc-500/10 text-zinc-500 border-zinc-200 dark:border-zinc-800', label: 'Ended' },
  recurring: { color: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800', label: 'Recurring' },
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
  const [meetings, setMeetings] = useState<Meeting[]>(mockMeetings)
  const [createOpen, setCreateOpen] = useState(false)
  const [newMeeting, setNewMeeting] = useState({ title: '', date: '', time: '', duration: '30m', type: 'scheduled', description: '' })

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
      const res = await fetch('/api/v1/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newMeeting.title, type: newMeeting.type, scheduledAt: newMeeting.date ? `${newMeeting.date}T${newMeeting.time || '09:00'}:00Z` : null }),
      })
      const data = await res.json()
      const created: Meeting = {
        id: data.meeting?.id || `m-${Date.now()}`,
        title: newMeeting.title,
        status: 'upcoming',
        type: newMeeting.type as Meeting['type'],
        date: newMeeting.date || new Date().toISOString().split('T')[0],
        time: newMeeting.time || '9:00 AM',
        duration: newMeeting.duration,
        participants: 0, maxParticipants: 10,
        roomId: data.meeting?.roomId || roomId,
        host: useAppStore.getState().user?.name || 'You',
        description: newMeeting.description || undefined,
      }
      setMeetings([created, ...meetings])
      setCreateOpen(false)
      setNewMeeting({ title: '', date: '', time: '', duration: '30m', type: 'scheduled', description: '' })
      toast.success(`Meeting "${newMeeting.title}" created!`)
    } catch {
      const created: Meeting = {
        id: `m-${Date.now()}`,
        title: newMeeting.title,
        status: 'upcoming',
        type: newMeeting.type as Meeting['type'],
        date: newMeeting.date || new Date().toISOString().split('T')[0],
        time: newMeeting.time || '9:00 AM',
        duration: newMeeting.duration,
        participants: 0, maxParticipants: 10,
        roomId,
        host: useAppStore.getState().user?.name || 'You',
        description: newMeeting.description || undefined,
      }
      setMeetings([created, ...meetings])
      setCreateOpen(false)
      setNewMeeting({ title: '', date: '', time: '', duration: '30m', type: 'scheduled', description: '' })
      toast.success(`Meeting "${newMeeting.title}" created!`)
    }
  }

  const handleCopyLink = (roomId: string) => {
    navigator.clipboard.writeText(`https://alvision.ai/room/${roomId}`)
    toast.success('Room link copied to clipboard!')
  }

  const MeetingCard = ({ m }: { m: Meeting }) => {
    const countdown = getCountdown(m.date, m.time)
    const participantAvatars = Array.from({ length: Math.min(m.participants, 3) }).map((_, i) => (
      <Avatar key={i} className='h-6 w-6 border-2 border-card -ml-2 first:ml-0'>
        <AvatarFallback className={`text-[8px] text-white ${avatarColors[i % avatarColors.length]}`}>{String.fromCharCode(65 + i)}</AvatarFallback>
      </Avatar>
    ))
    const fillPct = m.maxParticipants > 0 ? Math.round((m.participants / m.maxParticipants) * 100) : 0

    return (
      <motion.div variants={item}>
        <Card className={`group relative border border-border/50 hover:border-primary/30 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5 border-l-4 before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-primary/50 before:to-primary/0 ${typeBorderColors[m.type]}`}>
          <CardContent className='p-4'>
            <div className='flex items-start justify-between gap-3'>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 mb-1.5'>
                  <span className='text-muted-foreground'>{typeIcons[m.type]}</span>
                  <h3 className='font-semibold text-sm truncate'>{m.title}</h3>
                  <Badge variant='outline' className={`text-[10px] gap-1 shrink-0 ${statusConfig[m.status]?.color || ''}`}>
                    {statusConfig[m.status]?.pulse && <span className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse' />}
                    {statusConfig[m.status]?.label || m.status}
                  </Badge>
                </div>
                <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
                  <span className='flex items-center gap-1'><CalendarDays className='h-3 w-3' />{m.date}</span>
                  <span className='flex items-center gap-1'><Clock className='h-3 w-3' />{m.time}</span>
                  <span className='flex items-center gap-1'>{m.duration}</span>
                </div>
                {m.description && <p className='text-xs text-muted-foreground mt-1.5 line-clamp-1'>{m.description}</p>}
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
                    <DropdownMenuItem className='gap-2' onClick={() => handleCopyLink(m.roomId)}><Copy className='h-4 w-4' /> Copy Room Link</DropdownMenuItem>
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
                  <p className='text-2xl font-bold'>1</p>
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
                  <p className='text-2xl font-bold'>3</p>
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
                  <p className='text-2xl font-bold'>2</p>
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
                  <p className='text-2xl font-bold'>2</p>
                  <span className='text-[10px] font-medium text-red-500 flex items-center gap-0.5'>↓ 3%</span>
                </div>
                <p className='text-xs text-muted-foreground'>Ended</p>
                {sparkline([60, 55, 50, 45, 48, 40, 35], 'bg-zinc-400/40')}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Meeting lists */}
      <Tabs defaultValue='upcoming'>
        <TabsList>
          <TabsTrigger value='upcoming'>Upcoming & Active ({upcoming.length})</TabsTrigger>
          <TabsTrigger value='past'>Past ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value='upcoming' className='mt-4'>
          <motion.div variants={container} initial='hidden' animate='show' className='space-y-3 max-h-[calc(100vh-420px)] overflow-y-auto pr-1'>
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
        </TabsContent>
        <TabsContent value='past' className='mt-4'>
          <motion.div variants={container} initial='hidden' animate='show' className='space-y-3 max-h-[calc(100vh-420px)] overflow-y-auto pr-1'>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
