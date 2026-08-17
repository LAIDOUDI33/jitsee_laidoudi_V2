'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  CalendarHeart,
  Plus,
  Search,
  Clock,
  Users,
  Video,
  Globe,
  ExternalLink,
  Star,
  Radio,
  Presentation,
  Timer,
  Sparkles,
  Zap,
  Wrench,
  Megaphone,
  MapPin,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { authFetch } from '@/lib/api'

interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  duration: string
  type: 'webinar' | 'townhall' | 'livestream' | 'workshop'
  status: 'upcoming' | 'live' | 'ended' | 'draft'
  host: string
  hostRole: string
  registrants: number
  maxRegistrants: number
  isPublic: boolean
  featured: boolean
  tags: string[]
}

const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string; gradient: string }> = {
  webinar: { icon: <Presentation className='h-4 w-4' />, label: 'Webinar', color: 'text-sky-600', bg: 'bg-sky-500/10', gradient: 'bg-gradient-to-r from-sky-500/20 to-sky-500/5 border-sky-200/50' },
  townhall: { icon: <Users className='h-4 w-4' />, label: 'Town Hall', color: 'text-emerald-600', bg: 'bg-emerald-500/10', gradient: 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 border-emerald-200/50' },
  livestream: { icon: <Radio className='h-4 w-4' />, label: 'Live Stream', color: 'text-orange-600', bg: 'bg-orange-500/10', gradient: 'bg-gradient-to-r from-orange-500/20 to-orange-500/5 border-orange-200/50' },
  workshop: { icon: <Wrench className='h-4 w-4' />, label: 'Workshop', color: 'text-emerald-600', bg: 'bg-emerald-500/10', gradient: 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 border-emerald-200/50' },
}

const statusConfig: Record<string, { color: string; label: string; pulse?: boolean }> = {
  live: { color: 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-800', label: 'Live Now', pulse: true },
  upcoming: { color: 'bg-sky-500/10 text-sky-600 border-sky-200 dark:border-sky-800', label: 'Upcoming' },
  ended: { color: 'bg-zinc-500/10 text-zinc-500 border-zinc-200 dark:border-zinc-800', label: 'Ended' },
  draft: { color: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800', label: 'Draft' },
}

const fallbackEvents: Event[] = []

function mapApiEvent(e: { id: string; title: string; description: string; type: string; status: string; startTime: string; endTime: string | null; maxAttendees: number; registrants: number; recordingEnabled: boolean }): Event {
  const start = new Date(e.startTime)
  const end = e.endTime ? new Date(e.endTime) : null
  const dur = end ? Math.round((end.getTime() - start.getTime()) / 60000) : 60
  const h = Math.floor(dur / 60)
  const m = dur % 60
  const duration = h > 0 ? `${h}h ${m}m` : `${m}m`
  const date = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const time = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const evType = ['webinar', 'townhall', 'livestream', 'workshop'].includes(e.type) ? e.type as Event['type'] : 'webinar'
  const evStatus = ['upcoming', 'live', 'ended', 'draft'].includes(e.status) ? e.status as Event['status'] : 'upcoming'
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    date,
    time,
    duration,
    type: evType,
    status: evStatus,
    host: 'Team',
    hostRole: 'Organizer',
    registrants: e.registrants,
    maxRegistrants: e.maxAttendees,
    isPublic: true,
    featured: false,
    tags: [evType, 'event'],
  }
}

function getCountdown(dateStr: string, timeStr: string): string | null {
  const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }
  const parts = dateStr.replace(',', '').split(' ')
  const month = months[parts[0]] ?? 0
  const day = parseInt(parts[1])
  const year = parseInt(parts[2])
  const timeParts = timeStr.replace('EST', '').trim().split(':')
  let hour = parseInt(timeParts[0])
  if (timeParts[1].includes('PM') && hour !== 12) hour += 12
  if (timeParts[1].includes('AM') && hour === 12) hour = 0
  const target = new Date(year, month, day, hour, 0)
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  if (diff <= 0) return null
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `${days}d ${hours}h`
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${mins}m`
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

function useCountUp(target: number, duration = 1200, delay = 0) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const startTime = performance.now() + delay
    function step(now: number) {
      if (now < startTime) { requestAnimationFrame(step); return }
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, delay])
  return count
}

export default function EventsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [events, setEvents] = useState<Event[]>(fallbackEvents)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await authFetch('/api/v1/events')
      const json = await res.json()
      if (json.success) {
        setEvents((json.data.events as ReturnType<typeof mapApiEvent>[]).map(mapApiEvent))
      } else {
        setError(json.error?.message ?? 'Failed to fetch events')
      }
    } catch (err) {
      setError('Network error fetching events')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const stats = useMemo(() => ({
    total: events.length,
    registrants: events.reduce((a, e) => a + e.registrants, 0),
    live: events.filter(e => e.status === 'live').length,
    upcoming: events.filter(e => e.status === 'upcoming').length,
  }), [events])

  const animatedTotal = useCountUp(stats.total)
  const animatedRegistrants = useCountUp(stats.registrants)
  const animatedLive = useCountUp(stats.live)
  const animatedUpcoming = useCountUp(stats.upcoming)

  const filtered = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.tags.some(t => t.includes(search.toLowerCase()))
    const matchesFilter = filter === 'all' || e.type === filter || e.status === filter
    return matchesSearch && matchesFilter
  })

  const featuredEvent = events.find(e => e.featured && (e.status === 'upcoming' || e.status === 'live'))

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Events</h2>
          <p className='text-muted-foreground text-sm mt-1'>Webinars, town halls, workshops, and live streams</p>
          <div className='h-1 w-12 rounded-full bg-gradient-to-r from-primary to-primary/50 mt-2' />
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className='gap-2 bg-gradient-to-r from-primary to-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-transform'><Plus className='h-4 w-4' /> Create Event</Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-lg'>
            <DialogHeader>
              <div className='flex items-center gap-3 mb-2'>
                <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center'>
                  <Sparkles className='h-5 w-5 text-primary-foreground' />
                </div>
                <div>
                  <DialogTitle>Create Event</DialogTitle>
                  <p className='text-sm text-muted-foreground mt-0.5'>Set up your next event</p>
                </div>
              </div>
            </DialogHeader>
            <div className='space-y-4 pt-2'>
              <div className='space-y-2'><Label>Title</Label><Input placeholder='Event title' /></div>
              <div className='space-y-2'><Label>Description</Label><Textarea rows={3} placeholder='Describe your event...' /></div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Type</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder='Select type' /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value='webinar'>Webinar</SelectItem>
                      <SelectItem value='townhall'>Town Hall</SelectItem>
                      <SelectItem value='workshop'>Workshop</SelectItem>
                      <SelectItem value='livestream'>Live Stream</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'><Label>Date & Time</Label><Input type='datetime-local' /></div>
              </div>
              <div className='flex justify-end gap-3 pt-2'>
                <Button variant='outline' onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={() => { setCreateOpen(false); toast.success('Event created!') }} className='bg-gradient-to-r from-primary to-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-transform'>Create Event</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className='border border-border/50 animate-pulse'>
              <CardContent className='p-5 space-y-3'>
                <div className='h-4 bg-muted rounded w-24' />
                <div className='h-5 bg-muted rounded w-3/4' />
                <div className='h-3 bg-muted rounded w-full' />
                <div className='h-3 bg-muted rounded w-1/2' />
                <div className='h-1.5 bg-muted rounded w-full' />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <Card className='border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20'>
          <CardContent className='p-4 flex items-center justify-between'>
            <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
            <Button variant='outline' size='sm' onClick={fetchEvents}>Retry</Button>
          </CardContent>
        </Card>
      )}

      {/* Stats row */}
      {!loading && (
      <motion.div variants={container} initial='hidden' animate='show' className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <motion.div variants={item}>
        <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden before:content-[\"\"] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-primary/50 before:to-primary/0'>
          <CardContent className='p-4 flex items-center gap-3'>
            <div className='p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5'><CalendarHeart className='h-5 w-5 text-primary' /></div>
            <div><p className='text-2xl font-bold tabular-nums'>{animatedTotal}</p><p className='text-xs text-muted-foreground'>Total Events</p></div>
          </CardContent>
        </Card>
        </motion.div>
        <motion.div variants={item}>
        <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300 relative overflow-hidden before:content-[\"\"] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-red-500/50 before:to-red-500/0'>
          <CardContent className='p-4 flex items-center gap-3'>
            <div className='p-2.5 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/5'><Radio className='h-5 w-5 text-red-600' /></div>
            <div><p className='text-2xl font-bold tabular-nums'>{animatedLive}</p><p className='text-xs text-muted-foreground'>Live Now</p></div>
          </CardContent>
        </Card>
        </motion.div>
        <motion.div variants={item}>
        <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-sky-500/5 transition-all duration-300 relative overflow-hidden before:content-[\"\"] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-sky-500/50 before:to-sky-500/0'>
          <CardContent className='p-4 flex items-center gap-3'>
            <div className='p-2.5 rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-500/5'><Zap className='h-5 w-5 text-sky-600' /></div>
            <div><p className='text-2xl font-bold tabular-nums'>{animatedUpcoming}</p><p className='text-xs text-muted-foreground'>Upcoming</p></div>
          </CardContent>
        </Card>
        </motion.div>
        <motion.div variants={item}>
        <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 relative overflow-hidden before:content-[\"\"] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-emerald-500/50 before:to-emerald-500/0'>
          <CardContent className='p-4 flex items-center gap-3'>
            <div className='p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5'><Users className='h-5 w-5 text-emerald-600' /></div>
            <div><p className='text-2xl font-bold tabular-nums'>{animatedRegistrants.toLocaleString()}</p><p className='text-xs text-muted-foreground'>Registrations</p></div>
          </CardContent>
        </Card>
        </motion.div>
      </motion.div>
      )}

      {/* Featured event banner */}
      {featuredEvent && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className='bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border-primary/10 overflow-hidden relative'>
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(99,102,241,0.08),transparent_50%)]' />
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(168,85,247,0.06),transparent_50%)]' />
            <CardContent className='p-6 lg:p-8 relative'>
              <div className='flex flex-col lg:flex-row gap-6 items-start'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-3'>
                    <Badge variant='outline' className='gap-1 border-amber-200 dark:border-amber-800 text-amber-600 bg-amber-500/5'><Star className='h-3 w-3 fill-amber-500' /> Featured</Badge>
                    <Badge variant='outline' className={`gap-1 ${statusConfig[featuredEvent.status]?.color}`}>
                      {statusConfig[featuredEvent.status]?.pulse && <span className='w-1.5 h-1.5 rounded-full bg-red-500 animate-breathe' />}
                      {statusConfig[featuredEvent.status]?.label}
                    </Badge>
                    <Badge variant='outline' className={`gap-1 ${typeConfig[featuredEvent.type]?.gradient} ${typeConfig[featuredEvent.type]?.color}`}>
                      {typeConfig[featuredEvent.type]?.icon} {typeConfig[featuredEvent.type]?.label}
                    </Badge>
                  </div>
                  <h3 className='text-2xl font-bold mb-2'>{featuredEvent.title}</h3>
                  <p className='text-muted-foreground mb-4 max-w-xl text-sm'>{featuredEvent.description}</p>
                  <div className='flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-5'>
                    <span className='flex items-center gap-1.5'><Clock className='h-4 w-4' />{featuredEvent.date} · {featuredEvent.time}</span>
                    <span className='flex items-center gap-1.5'><Users className='h-4 w-4' />{featuredEvent.registrants}/{featuredEvent.maxRegistrants} registered</span>
                    {featuredEvent.isPublic && <span className='flex items-center gap-1.5'><Globe className='h-4 w-4' />Public</span>}
                  </div>
                  {/* Registration progress */}
                  <div className='max-w-sm mb-4 space-y-1'>
                    <div className='flex items-center justify-between text-xs text-muted-foreground'>
                      <span>{Math.round((featuredEvent.registrants / featuredEvent.maxRegistrants) * 100)}% capacity</span>
                      <span>{featuredEvent.maxRegistrants - featuredEvent.registrants} spots left</span>
                    </div>
                    <div className='h-2 rounded-full bg-emerald-500/10 overflow-hidden'>
                      <motion.div
                        className='h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400'
                        initial={{ width: 0 }}
                        animate={{ width: `${(featuredEvent.registrants / featuredEvent.maxRegistrants) * 100}%` }}
                        transition={{ duration: 1, ease: 'easeOut' as const }}
                      />
                    </div>
                  </div>
                  {/* Countdown */}
                  {featuredEvent.status === 'upcoming' && getCountdown(featuredEvent.date, featuredEvent.time) && (
                    <div className='flex items-center gap-1.5 text-xs text-primary font-medium mb-4'>
                      <Timer className='h-3.5 w-3.5' /> Starts in {getCountdown(featuredEvent.date, featuredEvent.time)}
                    </div>
                  )}
                  <div className='flex gap-3'>
                    <Button className={`gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform ${featuredEvent.status === 'live' ? 'bg-gradient-to-r from-red-600 to-red-500' : 'bg-gradient-to-r from-primary to-primary/90'}`}>
                      <Video className='h-4 w-4' /> {featuredEvent.status === 'live' ? 'Join Live' : 'Register Now'}
                    </Button>
                    <Button variant='outline' className='gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform'><ExternalLink className='h-4 w-4' /> Details</Button>
                  </div>
                </div>
                <div className='hidden lg:block w-52 h-36 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/10'>
                  <Radio className='h-14 w-14 text-primary/30' />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Toolbar */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='flex items-center gap-2 flex-1'>
          <div className='relative flex-1 max-w-xs'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input placeholder='Search events...' className='pl-9 h-9' value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className='w-[130px] h-9'><SelectValue placeholder='Filter' /></SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Events</SelectItem>
              <SelectItem value='webinar'>Webinars</SelectItem>
              <SelectItem value='townhall'>Town Halls</SelectItem>
              <SelectItem value='workshop'>Workshops</SelectItem>
              <SelectItem value='livestream'>Live Streams</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Event grid */}
      <motion.div variants={container} initial='hidden' animate='show' className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
        {filtered.map(event => {
          const tc = typeConfig[event.type]
          const sc = statusConfig[event.status]
          const regPct = Math.round((event.registrants / event.maxRegistrants) * 100)
          const countdown = event.status === 'upcoming' ? getCountdown(event.date, event.time) : null
          return (
            <motion.div key={event.id} variants={item}>
              <Card className='group relative border border-border/50 hover:border-primary/30 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden before:content-[\"\"] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-primary/50 before:to-primary/0'>
                <CardContent className='p-5'>
                  <div className='flex items-start justify-between mb-3'>
                    <div className='flex items-center gap-2'>
                      <Badge variant='outline' className={`gap-1 ${sc?.color}`}>
                        {sc?.pulse && <span className='w-1.5 h-1.5 rounded-full bg-red-500 animate-breathe' />}
                        {sc?.label}
                      </Badge>
                      <Badge variant='outline' className={`gap-1 ${tc?.gradient} ${tc?.color}`}>
                        {tc?.icon} {tc?.label}
                      </Badge>
                    </div>
                    {event.featured && <Star className='h-4 w-4 text-amber-500 fill-amber-500' />}
                  </div>
                  <h3 className='font-semibold mb-1.5 group-hover:text-primary transition-colors'>{event.title}</h3>
                  <p className='text-sm text-muted-foreground line-clamp-2 mb-3'>{event.description}</p>
                  <div className='flex flex-col gap-1.5 text-xs text-muted-foreground mb-3'>
                    <span className='flex items-center gap-1.5'><Clock className='h-3.5 w-3.5' />{event.date} · {event.time} · {event.duration}</span>
                    <div className='flex items-center gap-1.5'>
                      <Users className='h-3.5 w-3.5' />
                      <span>{event.registrants}/{event.maxRegistrants} registered</span>
                      <span className='text-muted-foreground/60'>({regPct}%)</span>
                    </div>
                    <span className='flex items-center gap-1.5'><Globe className='h-3.5 w-3.5' />{event.isPublic ? 'Public' : 'Internal'}</span>
                  </div>
                  {/* Registration progress bar */}
                  <div className='space-y-1 mb-3'>
                    <div className='h-1.5 rounded-full bg-emerald-500/10 overflow-hidden'>
                      <motion.div
                        className='h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400'
                        initial={{ width: 0 }}
                        animate={{ width: `${regPct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' as const, delay: 0.2 }}
                      />
                    </div>
                    <div className='flex justify-between text-[10px] text-muted-foreground'>
                      <span>{regPct}% filled</span>
                      <span>{event.maxRegistrants - event.registrants} spots left</span>
                    </div>
                  </div>
                  {/* Countdown */}
                  {countdown && (
                    <div className='flex items-center gap-1.5 text-xs text-primary font-medium mb-3'>
                      <Timer className='h-3.5 w-3.5' /> Starts in {countdown}
                    </div>
                  )}
                  <div className='flex flex-wrap gap-1.5 mb-4'>{event.tags.map(t => <Badge key={t} variant='secondary' className='text-[10px]'>{t}</Badge>)}</div>
                  <div className='flex items-center justify-between pt-3 border-t border-border/50'>
                    <div className='flex items-center gap-2'>
                      <Avatar className='h-7 w-7'><AvatarFallback className='text-[9px] bg-muted'>{event.host.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                      <div><p className='text-xs font-medium'>{event.host}</p><p className='text-[10px] text-muted-foreground'>{event.hostRole}</p></div>
                    </div>
                    <Button size='sm' variant={event.status === 'live' ? 'default' : 'outline'} className={`gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-transform ${event.status === 'live' ? 'bg-gradient-to-r from-red-600 to-red-500' : ''}`}>
                      {event.status === 'live' ? <><Video className='h-3.5 w-3.5' /> Join</> : <><ExternalLink className='h-3.5 w-3.5' /> View</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {filtered.length === 0 && (
        <div className='flex flex-col items-center justify-center py-16'>
          <div className='relative'>
            <CalendarHeart className='h-16 w-16 text-muted-foreground/20' />
            <div className='absolute inset-0 flex items-center justify-center'>
              <CalendarHeart className='h-8 w-8 text-muted-foreground/40' />
            </div>
          </div>
          <p className='font-medium mt-4'>No events found</p>
          <p className='text-sm text-muted-foreground mt-1'>Create an event to get started</p>
          <Button variant='outline' className='mt-4 gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={() => setCreateOpen(true)}>
            <Plus className='h-4 w-4' /> Create Event
          </Button>
        </div>
      )}
    </div>
  )
}
