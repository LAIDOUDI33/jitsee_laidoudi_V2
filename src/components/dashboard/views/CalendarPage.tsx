'use client'

import { useState, useMemo, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { authFetch } from '@/lib/api'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Video,
  CalendarDays,
  LayoutGrid,
  LayoutList,
  CalendarCheck,
  AlertCircle,
  Bell,
  Zap,
} from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  duration: string
  type: 'meeting' | 'event' | 'deadline' | 'reminder'
  participants?: number
  color: string
}

interface ApiScheduledMeeting {
  id: string
  title: string
  meetingId: string
  type: string
  status: string
  startTime: string | null
  endTime: string | null
  maxParticipants: number
  settings: string | null
  participants?: { user: { id: string; name: string } }[]
}

const meetingColors = ['bg-sky-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-teal-500', 'bg-rose-500', 'bg-sky-600']

function mapApiToCalendarEvent(m: ApiScheduledMeeting, index: number): CalendarEvent {
  const start = m.startTime ? new Date(m.startTime) : null
  const settings = m.settings ? (() => { try { return JSON.parse(m.settings) } catch { return {} } })() : {}
  const dur = settings.duration || 60
  const durStr = dur >= 60 ? `${Math.floor(dur / 60)}h${dur % 60 > 0 ? ` ${dur % 60}m` : ''}` : `${dur}m`
  return {
    id: m.id,
    title: m.title,
    date: start ? start.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    time: start ? start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '',
    duration: durStr,
    type: 'meeting',
    participants: m.participants?.length || 0,
    color: meetingColors[index % meetingColors.length],
  }
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const typeIcons: Record<string, React.ReactNode> = {
  meeting: <Video className='h-3 w-3' />,
  event: <CalendarDays className='h-3 w-3' />,
  deadline: <AlertCircle className='h-3 w-3' />,
  reminder: <Bell className='h-3 w-3' />,
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function CalendarPage() {
  const { setCurrentMeetingId, setMeetingTitle, setCurrentView } = useAppStore()
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1)

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }
  const goToday = () => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); setSelectedDate(today.toISOString().split('T')[0]) }

  const dateStr = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const todayStr = today.toISOString().split('T')[0]

  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch('/api/v1/meetings/schedule')
      if (!res.ok) throw new Error('Failed to fetch schedule')
      const json = await res.json()
      const meetings = json.data?.meetings || []
      const mapped = meetings.map((m: ApiScheduledMeeting, i: number) => mapApiToCalendarEvent(m, i))
      setEvents(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEvents() }, [])

  const getEventsForDate = (ds: string) => events.filter(e => e.date === ds)
  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : []

  const handleEventClick = (event: CalendarEvent) => {
    if (event.type === 'meeting') {
      setCurrentMeetingId(event.id)
      setMeetingTitle(event.title)
      setCurrentView('meeting-room')
    }
  }

  const calendarCells: { day: number; month: 'prev' | 'current' | 'next'; dateStr: string }[] = []
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarCells.push({ day: prevMonthDays - i, month: 'prev', dateStr: dateStr(currentYear, currentMonth - 1, prevMonthDays - i) })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({ day: d, month: 'current', dateStr: dateStr(currentYear, currentMonth, d) })
  }
  const remaining = 42 - calendarCells.length
  for (let d = 1; d <= remaining; d++) {
    calendarCells.push({ day: d, month: 'next', dateStr: dateStr(currentYear, currentMonth + 1, d) })
  }

  const miniMonthDays = useMemo(() => {
    const cells: { day: number; isCurrent: boolean; dateStr: string }[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = dateStr(currentYear, currentMonth, d)
      cells.push({ day: d, isCurrent: ds === todayStr, dateStr: ds })
    }
    return cells
  }, [currentYear, currentMonth, daysInMonth, todayStr])

  const thisWeekEvents = events.filter(e => {
    const eventDate = new Date(e.date + 'T12:00:00')
    const now = new Date()
    const weekEnd = new Date(now)
    weekEnd.setDate(weekEnd.getDate() + 7)
    return eventDate >= now && eventDate <= weekEnd
  }).sort((a, b) => a.date.localeCompare(b.date))

  const renderCalendarGrid = () => (
    <div className="grid grid-cols-7 gap-px bg-border/50 rounded-lg overflow-hidden">
      {calendarCells.map((cell, i) => {
        const cellEvents = getEventsForDate(cell.dateStr)
        const isToday = cell.dateStr === todayStr
        const isSelected = cell.dateStr === selectedDate
        const isOtherMonth = cell.month !== 'current'
        const cellClass = `bg-card p-1.5 min-h-[72px] lg:min-h-[90px] text-left transition-all hover:bg-muted/50 ${isOtherMonth ? 'opacity-40' : ''} ${isSelected ? 'bg-primary/5 ring-1 ring-primary/20 ring-inset' : ''}`
        const dayClass = `text-sm font-medium inline-flex h-7 w-7 items-center justify-center rounded-full transition-all ${isToday ? 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30 ring-offset-1 ring-offset-card' : isSelected ? 'bg-muted text-foreground' : 'hover:bg-muted'}`

        return (
          <button key={i} onClick={() => setSelectedDate(cell.dateStr)} className={cellClass}>
            <span className={dayClass}>{cell.day}</span>
            {cellEvents.length > 0 && (
              <div className="mt-0.5 space-y-0.5">
                {cellEvents.slice(0, 2).map(e => (
                  <div key={e.id} className={`text-[10px] leading-tight px-1 py-0.5 rounded-sm ${e.color} text-white truncate cursor-pointer hover:opacity-80 transition-opacity`}>
                    {e.title}
                  </div>
                ))}
                {cellEvents.length > 2 && (
                  <div className="text-[10px] text-muted-foreground pl-1 font-medium">+{cellEvents.length - 2} more</div>
                )}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )

  const renderWeekView = () => {
    const todayDate = new Date()
    const startOfWeek = new Date(todayDate)
    startOfWeek.setDate(todayDate.getDate() - todayDate.getDay())
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      return d
    })
    return (
      <div className='space-y-2'>
        <div className='grid grid-cols-7 gap-2'>
          {weekDays.map((d, i) => {
            const ds = dateStr(d.getFullYear(), d.getMonth(), d.getDate())
            const events = getEventsForDate(ds)
            const isToday = ds === todayStr
            return (
              <div key={i} className={`rounded-lg border border-border/50 p-2 min-h-[120px] transition-all ${isToday ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' : 'hover:bg-muted/30'}`}>
                <div className={`text-center text-xs font-semibold mb-2 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>{DAYS[i]} {d.getDate()}</div>
                <div className='space-y-1'>
                  {events.slice(0, 3).map(e => (
                    <div key={e.id} className={`text-[10px] leading-tight px-1.5 py-1 rounded-sm ${e.color} text-white truncate cursor-pointer hover:opacity-80 transition-opacity`}>{e.time} {e.title}</div>
                  ))}
                  {events.length === 0 && <div className='text-[10px] text-muted-foreground/40 text-center mt-4'>No events</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Calendar</h2>
          <p className='text-muted-foreground text-sm mt-1'>Manage your schedule, meetings, and deadlines</p>
          <div className='h-1 w-12 rounded-full bg-gradient-to-r from-primary to-primary/50 mt-2' />
        </div>
        <div className='flex items-center gap-2'>
          <div className='flex border rounded-lg overflow-hidden border-border/50'>
            <Button variant={viewMode === 'month' ? 'secondary' : 'ghost'} size='icon' className='h-8 w-8 rounded-none' onClick={() => setViewMode('month')}><LayoutGrid className='h-4 w-4' /></Button>
            <Button variant={viewMode === 'week' ? 'secondary' : 'ghost'} size='icon' className='h-8 w-8 rounded-none' onClick={() => setViewMode('week')}><LayoutList className='h-4 w-4' /></Button>
          </div>
          <Button className='gap-2 bg-gradient-to-r from-primary to-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-transform'><Plus className='h-4 w-4' /> New Event</Button>
        </div>
      </div>

      <div className='flex flex-col lg:flex-row gap-6'>
        <div className='flex-1'>
          {loading && (
            <div className='flex items-center justify-center py-16 animate-pulse'>
              <div className='space-y-3 w-full max-w-md'>
                <div className='h-8 w-48 rounded bg-muted mx-auto' />
                <div className='grid grid-cols-7 gap-1'>
                  {Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} className='h-16 rounded bg-muted' />
                  ))}
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className='flex items-center justify-center py-16'>
              <p className='text-sm text-red-500'>{error}</p>
              <Button variant='outline' className='ml-3 text-xs' onClick={fetchEvents}>Retry</Button>
            </div>
          )}
          {!loading && !error && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}>
          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300'>
            <CardHeader className='pb-2'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-lg'>{MONTHS[currentMonth]} {currentYear}</CardTitle>
                <div className='flex items-center gap-2'>
                  <Button variant='outline' size='sm' className='gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={goToday}><CalendarCheck className='h-3.5 w-3.5' /> Today</Button>
                  <div className='flex border rounded-lg overflow-hidden border-border/50'>
                    <Button variant='outline' size='icon' className='h-8 w-8 rounded-none' onClick={prevMonth}><ChevronLeft className='h-4 w-4' /></Button>
                    <Button variant='outline' size='icon' className='h-8 w-8 rounded-none' onClick={nextMonth}><ChevronRight className='h-4 w-4' /></Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-7 mb-2'>
                {DAYS.map(d => (
                  <div key={d} className='text-center text-xs font-semibold text-muted-foreground py-2'>{d}</div>
                ))}
              </div>
              {viewMode === 'month' ? renderCalendarGrid() : renderWeekView()}
            </CardContent>
          </Card>
          </motion.div>
          )}
        </div>

        <div className='w-full lg:w-80 space-y-4'>
          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 relative overflow-hidden before:content-[\"\"] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-emerald-500/50 before:to-emerald-500/0'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm'>{MONTHS[currentMonth]} {currentYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-7 gap-0.5 text-center'>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className='text-[10px] font-semibold text-muted-foreground py-1'>{d}</div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`sp-${i}`} />
                ))}
                {miniMonthDays.map(d => {
                  const hasEvents = getEventsForDate(d.dateStr).length > 0
                  return (
                    <button
                      key={d.dateStr}
                      onClick={() => setSelectedDate(d.dateStr)}
                      className={`text-xs relative w-6 h-6 flex items-center justify-center rounded-full mx-auto transition-colors ${d.isCurrent ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-muted'}`}
                    >
                      {d.day}
                      {hasEvents && !d.isCurrent && <span className='absolute bottom-0 w-1 h-1 rounded-full bg-primary animate-breathe' />}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-sky-500/5 transition-all duration-300 relative overflow-hidden before:content-[\"\"] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-sky-500/50 before:to-sky-500/0'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm'>{selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a date'}</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEvents.length > 0 ? (
                <motion.div variants={container} initial='hidden' animate='show' className='space-y-2 divide-y divide-border/50'>
                  {selectedEvents.map(e => (
                    <motion.div key={e.id} variants={item} onClick={() => handleEventClick(e)} className='w-full text-left p-3 rounded-lg hover:bg-muted/50 hover:shadow-sm hover:shadow-primary/5 transition-all duration-200 group cursor-pointer'>
                      <div className='flex items-start gap-2.5'>
                        <div className={`w-1 h-full min-h-[40px] rounded-full ${e.color} shrink-0`} />
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2'>
                            <p className='font-medium text-sm group-hover:text-primary transition-colors'>{e.title}</p>
                            <Badge variant='outline' className='text-[9px] gap-1 capitalize'>{typeIcons[e.type]}{e.type}</Badge>
                          </div>
                          <div className='flex items-center gap-2 mt-1 text-xs text-muted-foreground'>
                            <span className='flex items-center gap-1'><Clock className='h-3 w-3' />{e.time}</span>
                            {e.duration && <span>· {e.duration}</span>}
                          </div>
                          {e.participants && (
                            <div className='flex items-center gap-1 mt-1.5'>
                              <div className='flex -space-x-1'>
                                {Array.from({ length: Math.min(e.participants, 3) }).map((_, i) => (
                                  <Avatar key={i} className='h-4 w-4 border border-card'><AvatarFallback className='text-[6px] bg-muted'>{String.fromCharCode(65 + i)}</AvatarFallback></Avatar>
                                ))}
                              </div>
                              <span className='text-[10px] text-muted-foreground'>{e.participants} participants</span>
                            </div>
                          )}
                        </div>
                        {e.type === 'meeting' && <Video className='h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0' />}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className='flex flex-col items-center justify-center py-10'>
                  <div className='relative'>
                    <CalendarDays className='h-12 w-12 text-muted-foreground/20' />
                    <div className='absolute inset-0 flex items-center justify-center'>
                      <CalendarDays className='h-6 w-6 text-muted-foreground/40' />
                    </div>
                  </div>
                  <p className='text-sm text-muted-foreground mt-3'>{selectedDate ? 'No events on this day' : 'Click a date to view events'}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden before:content-[\"\"] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-primary/50 before:to-primary/0'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm flex items-center gap-2'><Zap className='h-4 w-4 text-primary' /> Upcoming This Week</CardTitle>
            </CardHeader>
            <CardContent className='space-y-1 divide-y divide-border/50'>
              {thisWeekEvents.length > 0 ? thisWeekEvents.map(e => (
                <motion.button key={e.id} variants={item} initial='hidden' animate='show' whileHover={{ x: 2 }} transition={{ duration: 0.15 }} onClick={() => { setSelectedDate(e.date); handleEventClick(e) }} className='w-full text-left flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors'>
                  <div className={`w-2 h-2 rounded-full ${e.color} shrink-0 ${e.type === 'meeting' ? 'animate-breathe' : ''}`} />
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium truncate'>{e.title}</p>
                    <p className='text-xs text-muted-foreground'>{e.date} · {e.time}</p>
                  </div>
                  {e.type === 'meeting' && <Video className='h-3.5 w-3.5 text-muted-foreground shrink-0' />}
                </motion.button>
              )) : (
                <p className='text-sm text-muted-foreground text-center py-4'>No upcoming events this week</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
