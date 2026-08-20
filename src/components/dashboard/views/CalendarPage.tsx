'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/store/app-store'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { authFetch } from '@/lib/api'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Video,
  CalendarDays,
  LayoutGrid,
  List,
  CalendarCheck,
  AlertCircle,
  Bell,
  Zap,
  Calendar,
  ArrowDown,
} from 'lucide-react'

// ─── Constants ───────────────────────────────────────────────

const HOUR_HEIGHT = 64
const START_HOUR = 6
const END_HOUR = 22
const TOTAL_HOURS = END_HOUR - START_HOUR
const TOTAL_GRID_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT

const DAY_NAMES_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_NAMES_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const TYPE_STYLE: Record<string, { bg: string; hex: string; light: string; text: string }> = {
  meeting:  { bg: 'bg-emerald-500',  hex: '#10b981', light: 'bg-emerald-500/10',  text: 'text-emerald-600' },
  event:    { bg: 'bg-violet-500',   hex: '#8b5cf6', light: 'bg-violet-500/10',   text: 'text-violet-600' },
  deadline: { bg: 'bg-rose-500',    hex: '#f43f5e', light: 'bg-rose-500/10',    text: 'text-rose-600' },
  reminder: { bg: 'bg-teal-500',    hex: '#14b8a6', light: 'bg-teal-500/10',    text: 'text-teal-600' },
}

const typeIcons: Record<string, React.ReactNode> = {
  meeting: <Video className='h-3 w-3' />,
  event: <CalendarDays className='h-3 w-3' />,
  deadline: <AlertCircle className='h-3 w-3' />,
  reminder: <Bell className='h-3 w-3' />,
}

// ─── Interfaces ───────────────────────────────────────────────

type ViewMode = 'day' | 'week' | 'month' | 'list'

interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  duration: string
  type: 'meeting' | 'event' | 'deadline' | 'reminder'
  participants?: number
  host?: string
  color: string
}

// ─── Mock Data ────────────────────────────────────────────────

function generateMockEvents(): CalendarEvent[] {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const today = now.getDate()
  const maxDay = new Date(y, m + 1, 0).getDate()
  const clamp = (d: number) => Math.max(1, Math.min(maxDay, d))
  const ds = (day: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(clamp(day)).padStart(2, '0')}`

  return [
    { id: 'm1', title: 'Daily Standup', date: ds(today), time: '9:00 AM', duration: '15m', type: 'meeting', participants: 6, host: 'Sarah Kim', color: TYPE_STYLE.meeting.bg },
    { id: 'm2', title: 'Product Roadmap Review', date: ds(today), time: '10:30 AM', duration: '1h', type: 'meeting', participants: 12, host: 'Alex Chen', color: TYPE_STYLE.meeting.bg },
    { id: 'm3', title: 'Design System Workshop', date: ds(today), time: '2:00 PM', duration: '2h', type: 'event', color: TYPE_STYLE.event.bg },
    { id: 'm4', title: 'Q4 Deadline Submission', date: ds(today), time: '5:00 PM', duration: '30m', type: 'deadline', color: TYPE_STYLE.deadline.bg },
    { id: 'm5', title: 'Team Lunch Reminder', date: ds(today), time: '12:00 PM', duration: '1h', type: 'reminder', color: TYPE_STYLE.reminder.bg },
    { id: 'm6', title: 'Sprint Retro', date: ds(today - 1), time: '3:00 PM', duration: '1h', type: 'meeting', participants: 8, host: 'Mike Johnson', color: TYPE_STYLE.meeting.bg },
    { id: 'm7', title: 'Code Review Session', date: ds(today - 1), time: '11:00 AM', duration: '1h 30m', type: 'event', color: TYPE_STYLE.event.bg },
    { id: 'm8', title: 'Client Onboarding Call', date: ds(today + 1), time: '8:00 AM', duration: '45m', type: 'meeting', participants: 4, host: 'Emily Davis', color: TYPE_STYLE.meeting.bg },
    { id: 'm9', title: 'Architecture Discussion', date: ds(today + 1), time: '1:00 PM', duration: '2h', type: 'meeting', participants: 5, host: 'Alex Chen', color: TYPE_STYLE.meeting.bg },
    { id: 'm10', title: 'Submit Expense Reports', date: ds(today + 1), time: '5:00 PM', duration: '30m', type: 'deadline', color: TYPE_STYLE.deadline.bg },
    { id: 'm11', title: 'One-on-One with Manager', date: ds(today + 2), time: '10:00 AM', duration: '30m', type: 'meeting', participants: 2, host: 'Sarah Kim', color: TYPE_STYLE.meeting.bg },
    { id: 'm12', title: 'Marketing Sync', date: ds(today + 2), time: '3:00 PM', duration: '45m', type: 'meeting', participants: 7, host: 'Lisa Park', color: TYPE_STYLE.meeting.bg },
    { id: 'm13', title: 'Company All Hands', date: ds(today + 3), time: '10:00 AM', duration: '1h', type: 'event', color: TYPE_STYLE.event.bg },
    { id: 'm14', title: 'Budget Review Deadline', date: ds(today + 3), time: '4:00 PM', duration: '30m', type: 'deadline', color: TYPE_STYLE.deadline.bg },
    { id: 'm15', title: 'Hydration Reminder', date: ds(today + 3), time: '2:00 PM', duration: '15m', type: 'reminder', color: TYPE_STYLE.reminder.bg },
    { id: 'm16', title: 'Quarterly Planning', date: ds(today + 7), time: '9:00 AM', duration: '3h', type: 'meeting', participants: 15, host: 'Alex Chen', color: TYPE_STYLE.meeting.bg },
    { id: 'm17', title: 'Design Sprint Kickoff', date: ds(today + 8), time: '10:00 AM', duration: '2h', type: 'event', color: TYPE_STYLE.event.bg },
    { id: 'm18', title: 'Performance Review', date: ds(today + 9), time: '2:00 PM', duration: '1h', type: 'meeting', participants: 2, host: 'Sarah Kim', color: TYPE_STYLE.meeting.bg },
    { id: 'm19', title: 'All Hands Meeting', date: ds(today - 5), time: '10:00 AM', duration: '1h', type: 'meeting', participants: 50, host: 'CEO', color: TYPE_STYLE.meeting.bg },
    { id: 'm20', title: 'Release v2.1 Deadline', date: ds(today - 3), time: '6:00 PM', duration: '30m', type: 'deadline', color: TYPE_STYLE.deadline.bg },
    { id: 'm21', title: 'Birthday Celebration', date: ds(today - 2), time: '4:00 PM', duration: '1h', type: 'event', color: TYPE_STYLE.event.bg },
    { id: 'm22', title: 'Standup Reminder', date: ds(today - 4), time: '8:45 AM', duration: '15m', type: 'reminder', color: TYPE_STYLE.reminder.bg },
    { id: 'm23', title: 'Board Presentation', date: ds(today + 12), time: '11:00 AM', duration: '1h 30m', type: 'meeting', participants: 8, host: 'Alex Chen', color: TYPE_STYLE.meeting.bg },
    { id: 'm24', title: 'Internal Hackathon', date: ds(today + 14), time: '9:00 AM', duration: '8h', type: 'event', color: TYPE_STYLE.event.bg },
    { id: 'm25', title: 'Tax Filing Reminder', date: ds(today + 10), time: '9:00 AM', duration: '30m', type: 'reminder', color: TYPE_STYLE.reminder.bg },
    { id: 'm26', title: 'API Integration Review', date: ds(today + 4), time: '11:00 AM', duration: '1h', type: 'meeting', participants: 4, host: 'Mike Johnson', color: TYPE_STYLE.meeting.bg },
    { id: 'm27', title: 'Security Audit Deadline', date: ds(today + 5), time: '5:00 PM', duration: '30m', type: 'deadline', color: TYPE_STYLE.deadline.bg },
  ]
}

// ─── Helpers ──────────────────────────────────────────────────

function parseTimeToDecimal(time: string): number {
  if (!time) return 9
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return 9
  let hours = parseInt(match[1])
  const minutes = parseInt(match[2])
  const period = match[3].toUpperCase()
  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0
  return hours + minutes / 60
}

function parseDurationToMinutes(dur: string): number {
  if (!dur) return 60
  let minutes = 0
  const hMatch = dur.match(/(\d+)h/)
  const mMatch = dur.match(/(\d+)m/)
  if (hMatch) minutes += parseInt(hMatch[1]) * 60
  if (mMatch) minutes += parseInt(mMatch[1])
  return minutes || 60
}

function formatHour(h: number): string {
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

function formatEndTime(startTime: string, duration: string): string {
  const start = parseTimeToDecimal(startTime)
  const durMin = parseDurationToMinutes(duration)
  const end = start + durMin / 60
  const h = Math.floor(end)
  const m = Math.round((end - h) * 60)
  const period = h >= 12 ? 'PM' : 'AM'
  const dh = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${dh}:${String(m).padStart(2, '0')} ${period}`
}

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function isSameDay(a: string, b: string) {
  return a === b
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

// ─── Animation Variants ───────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
}
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

// ─── Current Time Hook ────────────────────────────────────────

function useCurrentTime() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  return now
}

// ─── Main Component ───────────────────────────────────────────

export default function CalendarPage() {
  const { setCurrentMeetingId, setMeetingTitle, setCurrentView } = useAppStore()
  const today = useCurrentTime()
  const todayStr = formatDateStr(today)

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState<string>(todayStr)
  const [weekStart, setWeekStart] = useState<Date>(getStartOfWeek(today))

  // Events state
  const [events, setEvents] = useState<CalendarEvent[]>(() => generateMockEvents())
  const [loading, setLoading] = useState(true)

  // Scroll ref for time grids
  const timeGridRef = useRef<HTMLDivElement>(null)

  // Fetch events from API (merge with mock as fallback)
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await authFetch('/api/v1/meetings/schedule')
        if (res.ok) {
          const json = await res.json()
          const meetings = json.data?.meetings || []
          if (meetings.length > 0) {
            const mapped = meetings.map((m: { id: string; title: string; startTime: string | null; settings: string | null; participants?: { user: { name: string } }[]; host?: { name: string } | null }, i: number) => {
              const start = m.startTime ? new Date(m.startTime) : null
              const settings = m.settings ? (() => { try { return JSON.parse(m.settings) } catch { return {} } })() : {}
              const dur = settings.duration || 60
              const durStr = dur >= 60 ? `${Math.floor(dur / 60)}h${dur % 60 > 0 ? ` ${dur % 60}m` : ''}` : `${dur}m`
              const types: CalendarEvent['type'][] = ['meeting', 'event', 'deadline', 'reminder']
              const t = types[i % 4]
              return {
                id: m.id,
                title: m.title,
                date: start ? formatDateStr(start) : todayStr,
                time: start ? start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '9:00 AM',
                duration: durStr,
                type: t,
                participants: m.participants?.length || 0,
                host: m.host?.name,
                color: TYPE_STYLE[t].bg,
              } as CalendarEvent
            })
            setEvents(mapped)
          }
        }
      } catch {
        // keep mock data
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  // ─── Navigation helpers ───────────────────────────────────

  const goToday = useCallback(() => {
    setCurrentMonth(today.getMonth())
    setCurrentYear(today.getFullYear())
    setSelectedDate(todayStr)
    setWeekStart(getStartOfWeek(today))
  }, [today, todayStr])

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }

  const prevWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d)
  }
  const nextWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d)
  }

  const prevDay = () => {
    const d = new Date(selectedDate + 'T12:00:00')
    d.setDate(d.getDate() - 1)
    const ds = formatDateStr(d)
    setSelectedDate(ds)
    if (viewMode === 'day') setWeekStart(getStartOfWeek(d))
  }
  const nextDay = () => {
    const d = new Date(selectedDate + 'T12:00:00')
    d.setDate(d.getDate() + 1)
    const ds = formatDateStr(d)
    setSelectedDate(ds)
    if (viewMode === 'day') setWeekStart(getStartOfWeek(d))
  }

  const scrollToNow = useCallback(() => {
    const el = timeGridRef.current
    if (!el) return
    const minutesSinceStart = (today.getHours() - START_HOUR) * 60 + today.getMinutes()
    const top = (minutesSinceStart / 60) * HOUR_HEIGHT
    el.scrollTo({ top: Math.max(0, top - 120), behavior: 'smooth' })
  }, [today])

  // ─── Event helpers ─────────────────────────────────────────

  const getEventsForDate = useCallback((ds: string) => events.filter(e => e.date === ds), [events])
  const selectedEvents = useMemo(() => getEventsForDate(selectedDate), [selectedDate, getEventsForDate])

  const handleEventClick = (event: CalendarEvent) => {
    if (event.type === 'meeting') {
      setCurrentMeetingId(event.id)
      setMeetingTitle(event.title)
      setCurrentView('meeting-room')
    }
  }

  // ─── Computed values ───────────────────────────────────────

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1)

  const calendarCells = useMemo(() => {
    const cells: { day: number; month: 'prev' | 'current' | 'next'; dateStr: string }[] = []
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ day: prevMonthDays - i, month: 'prev', dateStr: `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(prevMonthDays - i).padStart(2, '0')}` })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, month: 'current', dateStr: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` })
    }
    const remaining = 42 - cells.length
    for (let d = 1; d <= remaining; d++) {
      const nextM = currentMonth === 11 ? 1 : currentMonth + 2
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear
      cells.push({ day: d, month: 'next', dateStr: `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}` })
    }
    return cells
  }, [currentYear, currentMonth, firstDay, daysInMonth, prevMonthDays])

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart])

  const currentTimeTop = useMemo(() => {
    const h = today.getHours() + today.getMinutes() / 60
    return (h - START_HOUR) * HOUR_HEIGHT
  }, [today])

  const isCurrentHourInView = today.getHours() >= START_HOUR && today.getHours() < END_HOUR

  // List view grouped events
  const listGroups = useMemo(() => {
    const sorted = [...events].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.time.localeCompare(b.time)
    })
    const groups: { date: string; label: string; events: CalendarEvent[] }[] = []
    let current: typeof groups[0] | null = null
    for (const ev of sorted) {
      if (!current || current.date !== ev.date) {
        current = { date: ev.date, label: formatDateLabel(ev.date), events: [] }
        groups.push(current)
      }
      current.events.push(ev)
    }
    return groups
  }, [events])

  const thisWeekEvents = useMemo(() => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)
    return events
      .filter(e => {
        const ed = new Date(e.date + 'T12:00:00')
        return ed >= weekStart && ed < weekEnd
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
  }, [events, weekStart])

  const showSidebar = viewMode === 'month' || viewMode === 'list'

  // ─── Sub-renders ───────────────────────────────────────────

  const renderNavigationLabel = () => {
    if (viewMode === 'day') {
      const d = new Date(selectedDate + 'T12:00:00')
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    }
    if (viewMode === 'week') {
      const end = new Date(weekStart)
      end.setDate(end.getDate() + 6)
      const s = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const e = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      return `${s} – ${e}`
    }
    return `${MONTHS[currentMonth]} ${currentYear}`
  }

  const renderNavButtons = () => {
    if (viewMode === 'day') {
      return (
        <div className='flex items-center gap-1'>
          <Button variant='outline' size='icon' className='h-8 w-8' onClick={prevDay}><ChevronLeft className='h-4 w-4' /></Button>
          <Button variant='outline' size='icon' className='h-8 w-8' onClick={nextDay}><ChevronRight className='h-4 w-4' /></Button>
        </div>
      )
    }
    if (viewMode === 'week') {
      return (
        <div className='flex items-center gap-1'>
          <Button variant='outline' size='icon' className='h-8 w-8' onClick={prevWeek}><ChevronLeft className='h-4 w-4' /></Button>
          <Button variant='outline' size='icon' className='h-8 w-8' onClick={nextWeek}><ChevronRight className='h-4 w-4' /></Button>
        </div>
      )
    }
    return (
      <div className='flex items-center gap-1'>
        <Button variant='outline' size='icon' className='h-8 w-8' onClick={prevMonth}><ChevronLeft className='h-4 w-4' /></Button>
        <Button variant='outline' size='icon' className='h-8 w-8' onClick={nextMonth}><ChevronRight className='h-4 w-4' /></Button>
      </div>
    )
  }

  // ─── Time Grid (shared for Day & Week) ─────────────────────

  const hours = useMemo(() => Array.from({ length: TOTAL_HOURS }, (_, i) => i + START_HOUR), [])

  const renderEventBlock = (event: CalendarEvent) => {
    const startDecimal = parseTimeToDecimal(event.time)
    const durMin = parseDurationToMinutes(event.duration)
    const top = (startDecimal - START_HOUR) * HOUR_HEIGHT
    const height = Math.max((durMin / 60) * HOUR_HEIGHT - 2, 20)
    const style = TYPE_STYLE[event.type]
    return (
      <Tooltip key={event.id}>
        <TooltipTrigger asChild>
          <button
            onClick={() => handleEventClick(event)}
            className='absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 text-left overflow-hidden hover:brightness-110 transition-all z-[2] cursor-pointer group/block'
            style={{
              top,
              height,
              borderLeft: `3px solid ${style.hex}`,
              backgroundColor: style.hex + '18',
            }}
          >
            <div className='text-[11px] font-medium truncate' style={{ color: style.hex }}>{event.title}</div>
            {height > 30 && (
              <div className='text-[10px] mt-0.5 opacity-70' style={{ color: style.hex }}>{event.time} – {formatEndTime(event.time, event.duration)}</div>
            )}
            {event.type === 'meeting' && height > 44 && (
              <div className='text-[9px] mt-0.5 opacity-50 flex items-center gap-0.5' style={{ color: style.hex }}><Video className='h-2.5 w-2.5' />{event.participants || 0} participants</div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side='top' className='text-xs max-w-64'>
          <div className='font-medium'>{event.title}</div>
          <div className='text-muted-foreground'>{event.time} – {formatEndTime(event.time, event.duration)}</div>
          {event.host && <div className='text-muted-foreground'>Host: {event.host}</div>}
        </TooltipContent>
      </Tooltip>
    )
  }

  const renderTimeLabels = () => (
    <div className='w-14 shrink-0'>
      {hours.map(h => (
        <div key={h} className='relative' style={{ height: HOUR_HEIGHT }}>
          <span className='absolute -top-2.5 right-2 text-[10px] text-muted-foreground font-medium tabular-nums'>
            {formatHour(h)}
          </span>
        </div>
      ))}
    </div>
  )

  const renderCurrentTimeLine = (offsetLeft?: string) => {
    if (!isCurrentHourInView) return null
    return (
      <div
        className='absolute z-[5] pointer-events-none'
        style={{ top: currentTimeTop, left: offsetLeft || 0, right: 0 }}
      >
        <div className='absolute -left-[5px] -top-[5px] w-[10px] h-[10px] rounded-full bg-rose-500' />
        <div className='h-[2px] bg-rose-500 w-full' />
      </div>
    )
  }

  // ─── Day View ──────────────────────────────────────────────

  const renderDayView = () => {
    const dayEvents = getEventsForDate(selectedDate)
    return (
      <div className='rounded-lg border border-border/50 overflow-hidden bg-card'>
        <div ref={timeGridRef} className='overflow-y-auto' style={{ maxHeight: '70vh', minHeight: 400 }}>
          <div className='flex relative' style={{ height: TOTAL_GRID_HEIGHT }}>
            {renderTimeLabels()}
            <div className='flex-1 relative border-l border-border/30'>
              {hours.map(h => (
                <div key={h} className='absolute w-full border-t border-border/30' style={{ top: (h - START_HOUR) * HOUR_HEIGHT }} />
              ))}
              {hours.map(h => (
                <div key={`h-${h}`} className='absolute w-full border-t border-border/10' style={{ top: (h - START_HOUR + 0.5) * HOUR_HEIGHT }} />
              ))}
              {dayEvents.map(renderEventBlock)}
              {isSameDay(selectedDate, todayStr) && renderCurrentTimeLine('0px')}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Week View ─────────────────────────────────────────────

  const renderWeekView = () => (
    <div className='rounded-lg border border-border/50 overflow-hidden bg-card'>
      {/* Header */}
      <div className='grid grid-cols-[56px_repeat(7,1fr)] border-b bg-muted/30'>
        <div className='p-2' />
        {weekDays.map((d, i) => {
          const ds = formatDateStr(d)
          const isT = ds === todayStr
          return (
            <div key={i} className='p-2 text-center border-l border-border/30'>
              <div className={`text-xs font-medium ${isT ? 'text-emerald-600' : 'text-muted-foreground'}`}>{DAY_NAMES_FULL[i]}</div>
              <div className={`mt-0.5 inline-flex items-center justify-center h-7 w-7 rounded-full text-sm font-semibold ${isT ? 'bg-emerald-500 text-white' : 'text-foreground'}`}>
                {d.getDate()}
              </div>
            </div>
          )
        })}
      </div>
      {/* Scrollable time grid */}
      <div ref={timeGridRef} className='overflow-y-auto' style={{ maxHeight: '70vh', minHeight: 400 }}>
        <div className='grid grid-cols-[56px_repeat(7,1fr)] relative' style={{ height: TOTAL_GRID_HEIGHT }}>
          {renderTimeLabels()}
          {weekDays.map((d, i) => {
            const ds = formatDateStr(d)
            const dayEvents = getEventsForDate(ds)
            const isT = ds === todayStr
            return (
              <div key={i} className='relative border-l border-border/30'>
                {hours.map(h => (
                  <div key={h} className='absolute w-full border-t border-border/20' style={{ top: (h - START_HOUR) * HOUR_HEIGHT }} />
                ))}
                {hours.map(h => (
                  <div key={`h-${h}`} className='absolute w-full border-t border-border/5' style={{ top: (h - START_HOUR + 0.5) * HOUR_HEIGHT }} />
                ))}
                {dayEvents.map(renderEventBlock)}
                {isT && renderCurrentTimeLine('0px')}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  // ─── Month View ────────────────────────────────────────────

  const renderMonthView = () => (
    <div className='rounded-lg border border-border/50 overflow-hidden bg-card'>
      {/* Day-of-week header */}
      <div className='grid grid-cols-7 border-b bg-muted/30'>
        {DAY_NAMES_FULL.map(d => (
          <div key={d} className='text-center text-xs font-semibold text-muted-foreground py-2.5'>{d}</div>
        ))}
      </div>
      {/* 6×7 grid */}
      <div className='grid grid-cols-7'>
        {calendarCells.map((cell, i) => {
          const cellEvents = getEventsForDate(cell.dateStr)
          const isToday = cell.dateStr === todayStr
          const isSelected = cell.dateStr === selectedDate
          const isOtherMonth = cell.month !== 'current'
          return (
            <button
              key={i}
              onClick={() => setSelectedDate(cell.dateStr)}
              className={`bg-card p-1.5 min-h-[80px] lg:min-h-[100px] text-left transition-all hover:bg-muted/40 border-b border-r border-border/20 ${isOtherMonth ? 'opacity-35' : ''} ${isSelected ? 'bg-emerald-500/5' : ''}`}
            >
              <span
                className={`text-sm font-medium inline-flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                  isToday
                    ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-500/30 ring-offset-1 ring-offset-card'
                    : isSelected
                      ? 'bg-emerald-500/10 text-emerald-700 font-semibold'
                      : 'hover:bg-muted'
                }`}
              >
                {cell.day}
              </span>
              {cellEvents.length > 0 && (
                <div className='mt-0.5 space-y-0.5'>
                  {cellEvents.slice(0, 3).map(e => (
                    <div
                      key={e.id}
                      onClick={(ev) => { ev.stopPropagation(); handleEventClick(e) }}
                      className='text-[10px] leading-tight px-1.5 py-0.5 rounded-sm truncate cursor-pointer hover:opacity-80 transition-opacity text-white'
                      style={{ backgroundColor: TYPE_STYLE[e.type].hex }}
                    >
                      {e.title}
                    </div>
                  ))}
                  {cellEvents.length > 3 && (
                    <div className='text-[10px] text-muted-foreground pl-1 font-medium'>+{cellEvents.length - 3} more</div>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )

  // ─── List View ─────────────────────────────────────────────

  const renderListView = () => (
    <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80'>
      <CardContent className='p-4'>
        <ScrollArea className='max-h-[70vh]'>
          <div className='space-y-6'>
            {listGroups.map(group => {
              const isGroupToday = group.date === todayStr
              return (
                <div key={group.date}>
                  <div className={`text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2 ${isGroupToday ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                    {isGroupToday && <span className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse' />}
                    {isGroupToday ? 'Today' : group.label}
                  </div>
                  <motion.div variants={container} initial='hidden' animate='show' className='space-y-1.5'>
                    {group.events.map(ev => {
                      const style = TYPE_STYLE[ev.type]
                      return (
                        <motion.button
                          key={ev.id}
                          variants={item}
                          onClick={() => handleEventClick(ev)}
                          className='w-full text-left flex items-center gap-3 p-3 rounded-lg border border-border/30 hover:bg-muted/40 hover:shadow-sm transition-all duration-200 group cursor-pointer'
                        >
                          <div className='w-1 h-10 rounded-full shrink-0' style={{ backgroundColor: style.hex }} />
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center gap-2'>
                              <p className='font-medium text-sm group-hover:text-foreground transition-colors truncate'>{ev.title}</p>
                              <Badge variant='outline' className='text-[9px] gap-1 capitalize shrink-0' style={{ borderColor: style.hex + '40', color: style.hex }}>{typeIcons[ev.type]}{ev.type}</Badge>
                            </div>
                            <div className='flex items-center gap-2 mt-0.5 text-xs text-muted-foreground'>
                              <span className='flex items-center gap-1'><Clock className='h-3 w-3' />{ev.time} – {formatEndTime(ev.time, ev.duration)}</span>
                              {ev.participants != null && ev.participants > 0 && <span>· {ev.participants} participants</span>}
                              {ev.host && <span>· {ev.host}</span>}
                            </div>
                          </div>
                          {ev.type === 'meeting' && <Video className='h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0' />}
                        </motion.button>
                      )
                    })}
                  </motion.div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )

  // ─── Sidebar ───────────────────────────────────────────────

  const miniMonthDays = useMemo(() => {
    const cells: { day: number; isCurrent: boolean; dateStr: string }[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({ day: d, isCurrent: ds === todayStr, dateStr: ds })
    }
    return cells
  }, [currentYear, currentMonth, daysInMonth, todayStr])

  const renderSidebar = () => (
    <div className='w-full lg:w-80 space-y-4'>
      {/* Mini Calendar */}
      <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 relative overflow-hidden before:content-[""] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-emerald-500/50 before:to-emerald-500/0'>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm'>{MONTHS[currentMonth]} {currentYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-7 gap-0.5 text-center'>
            {DAY_NAMES_SHORT.map((d, i) => (
              <div key={i} className='text-[10px] font-semibold text-muted-foreground py-1'>{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`sp-${i}`} />
            ))}
            {miniMonthDays.map(d => {
              const hasEvents = getEventsForDate(d.dateStr).length > 0
              const isSelected = d.dateStr === selectedDate
              return (
                <button
                  key={d.dateStr}
                  onClick={() => setSelectedDate(d.dateStr)}
                  className={`text-xs relative w-6 h-6 flex items-center justify-center rounded-full mx-auto transition-colors ${d.isCurrent ? 'bg-emerald-500 text-white font-bold' : isSelected ? 'bg-emerald-500/10 text-emerald-700 font-semibold' : 'hover:bg-muted'}`}
                >
                  {d.day}
                  {hasEvents && !d.isCurrent && <span className='absolute bottom-0 w-1 h-1 rounded-full bg-emerald-500' />}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Events */}
      <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 relative overflow-hidden before:content-[""] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-violet-500/50 before:to-violet-500/0'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm'>
            {selectedDate ? formatDateLabel(selectedDate) : 'Select a date'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedEvents.length > 0 ? (
            <ScrollArea className='max-h-64'>
              <motion.div variants={container} initial='hidden' animate='show' className='space-y-2 divide-y divide-border/50'>
                {selectedEvents.map(e => {
                  const style = TYPE_STYLE[e.type]
                  return (
                    <motion.div
                      key={e.id}
                      variants={item}
                      onClick={() => handleEventClick(e)}
                      className='w-full text-left p-3 rounded-lg hover:bg-muted/50 hover:shadow-sm transition-all duration-200 group cursor-pointer'
                    >
                      <div className='flex items-start gap-2.5'>
                        <div className='w-1 h-full min-h-[40px] rounded-full shrink-0' style={{ backgroundColor: style.hex }} />
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2'>
                            <p className='font-medium text-sm group-hover:text-foreground transition-colors truncate'>{e.title}</p>
                            <Badge variant='outline' className='text-[9px] gap-1 capitalize shrink-0' style={{ borderColor: style.hex + '40', color: style.hex }}>{typeIcons[e.type]}{e.type}</Badge>
                          </div>
                          <div className='flex items-center gap-2 mt-1 text-xs text-muted-foreground'>
                            <span className='flex items-center gap-1'><Clock className='h-3 w-3' />{e.time}</span>
                            {e.duration && <span>· {e.duration}</span>}
                            {e.host && <span>· {e.host}</span>}
                          </div>
                          {e.participants != null && e.participants > 0 && (
                            <div className='flex items-center gap-1 mt-1.5'>
                              <div className='flex -space-x-1'>
                                {Array.from({ length: Math.min(e.participants, 3) }).map((_, idx) => (
                                  <Avatar key={idx} className='h-4 w-4 border border-card'><AvatarFallback className='text-[6px] bg-muted'>{String.fromCharCode(65 + idx)}</AvatarFallback></Avatar>
                                ))}
                              </div>
                              <span className='text-[10px] text-muted-foreground'>{e.participants} participants</span>
                            </div>
                          )}
                        </div>
                        {e.type === 'meeting' && <Video className='h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0' />}
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            </ScrollArea>
          ) : (
            <div className='flex flex-col items-center justify-center py-10'>
              <CalendarDays className='h-12 w-12 text-muted-foreground/20' />
              <p className='text-sm text-muted-foreground mt-3'>{selectedDate ? 'No events on this day' : 'Click a date to view events'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming This Week */}
      <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 relative overflow-hidden before:content-[""] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-amber-500/50 before:to-amber-500/0'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm flex items-center gap-2'><Zap className='h-4 w-4 text-amber-500' /> Upcoming This Week</CardTitle>
        </CardHeader>
        <CardContent className='space-y-1 divide-y divide-border/50'>
          {thisWeekEvents.length > 0 ? thisWeekEvents.slice(0, 6).map(e => {
            const style = TYPE_STYLE[e.type]
            return (
              <motion.button
                key={e.id}
                variants={item}
                initial='hidden'
                animate='show'
                whileHover={{ x: 2 }}
                transition={{ duration: 0.15 }}
                onClick={() => { setSelectedDate(e.date); handleEventClick(e) }}
                className='w-full text-left flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors'
              >
                <div className='w-2 h-2 rounded-full shrink-0' style={{ backgroundColor: style.hex }} />
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium truncate'>{e.title}</p>
                  <p className='text-xs text-muted-foreground'>{e.time} · {e.duration}</p>
                </div>
                {e.type === 'meeting' && <Video className='h-3.5 w-3.5 text-muted-foreground shrink-0' />}
              </motion.button>
            )
          }) : (
            <p className='text-sm text-muted-foreground text-center py-4'>No upcoming events this week</p>
          )}
        </CardContent>
      </Card>
    </div>
  )

  // ─── Loading / Error ───────────────────────────────────────

  const renderLoading = () => (
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
  )

  // ─── Main Render ───────────────────────────────────────────

  return (
    <TooltipProvider delayDuration={200}>
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Calendar</h2>
          <p className='text-muted-foreground text-sm mt-1'>Manage your schedule, meetings, and deadlines</p>
          <div className='h-1 w-12 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-500/50 mt-2' />
        </div>
        <div className='flex items-center gap-2'>
          <ToggleGroup type='single' value={viewMode} onValueChange={(v) => { if (v) setViewMode(v as ViewMode) }}>
            <ToggleGroupItem value='day' size='sm' className='text-xs gap-1 px-3'>
              <CalendarDays className='h-3.5 w-3.5' />
              <span className='hidden sm:inline'>Day</span>
            </ToggleGroupItem>
            <ToggleGroupItem value='week' size='sm' className='text-xs gap-1 px-3'>
              <Calendar className='h-3.5 w-3.5' />
              <span className='hidden sm:inline'>Week</span>
            </ToggleGroupItem>
            <ToggleGroupItem value='month' size='sm' className='text-xs gap-1 px-3'>
              <LayoutGrid className='h-3.5 w-3.5' />
              <span className='hidden sm:inline'>Month</span>
            </ToggleGroupItem>
            <ToggleGroupItem value='list' size='sm' className='text-xs gap-1 px-3'>
              <List className='h-3.5 w-3.5' />
              <span className='hidden sm:inline'>List</span>
            </ToggleGroupItem>
          </ToggleGroup>
          <Button className='gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 hover:scale-[1.02] active:scale-[0.98] transition-all'>
            <Plus className='h-4 w-4' /> <span className='hidden sm:inline'>New Event</span>
          </Button>
        </div>
      </div>

      {/* Navigation bar */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          {renderNavButtons()}
          <Button variant='outline' size='sm' className='gap-1.5' onClick={goToday}>
            <CalendarCheck className='h-3.5 w-3.5' /> Today
          </Button>
          <h3 className='text-lg font-semibold'>{renderNavigationLabel()}</h3>
        </div>
        {(viewMode === 'day' || viewMode === 'week') && isCurrentHourInView && (
          <Button variant='outline' size='sm' className='gap-1.5 text-rose-500 border-rose-200 hover:bg-rose-50 hover:text-rose-600' onClick={scrollToNow}>
            <ArrowDown className='h-3.5 w-3.5' /> Now
          </Button>
        )}
      </div>

      {/* Content */}
      <div className={`flex flex-col ${showSidebar ? 'lg:flex-row' : ''} gap-6`}>
        <div className='flex-1 min-w-0'>
          {loading ? (
            renderLoading()
          ) : (
            <AnimatePresence mode='wait'>
              <motion.div
                key={viewMode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {viewMode === 'day' && renderDayView()}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'month' && renderMonthView()}
                {viewMode === 'list' && renderListView()}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
        {showSidebar && renderSidebar()}
      </div>
    </div>
    </TooltipProvider>
  )
}
