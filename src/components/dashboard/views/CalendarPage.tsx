'use client'

import { useState, useMemo } from 'react'
import { useAppStore } from '@/store/app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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

const mockEvents: CalendarEvent[] = [
  { id: 'ce1', title: 'Q4 Strategy Review', date: '2025-01-15', time: '10:00 AM', duration: '1h', type: 'meeting', participants: 5, color: 'bg-sky-500' },
  { id: 'ce2', title: 'Engineering Standup', date: '2025-01-15', time: '9:00 AM', duration: '15m', type: 'meeting', participants: 7, color: 'bg-violet-500' },
  { id: 'ce3', title: 'Product Launch Deadline', date: '2025-01-17', time: '5:00 PM', duration: '', type: 'deadline', color: 'bg-red-500' },
  { id: 'ce4', title: 'Team Offsite Planning', date: '2025-01-18', time: '2:00 PM', duration: '1h 30m', type: 'meeting', participants: 12, color: 'bg-emerald-500' },
  { id: 'ce5', title: 'Client Demo - Acme Corp', date: '2025-01-20', time: '11:00 AM', duration: '45m', type: 'meeting', participants: 4, color: 'bg-amber-500' },
  { id: 'ce6', title: 'Sprint 15 Planning', date: '2025-01-21', time: '10:00 AM', duration: '2h', type: 'meeting', participants: 8, color: 'bg-pink-500' },
  { id: 'ce7', title: 'Weekly Report Due', date: '2025-01-22', time: '9:00 AM', duration: '', type: 'reminder', color: 'bg-zinc-500' },
  { id: 'ce8', title: 'Board Meeting', date: '2025-01-24', time: '3:00 PM', duration: '2h', type: 'meeting', participants: 15, color: 'bg-sky-600' },
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const typeIcons: Record<string, React.ReactNode> = {
  meeting: <Video className='h-3 w-3' />,
  event: <CalendarDays className='h-3 w-3' />,
  deadline: <AlertCircle className='h-3 w-3' />,
  reminder: <Bell className='h-3 w-3' />,
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

  const getEventsForDate = (ds: string) => mockEvents.filter(e => e.date === ds)
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

  const thisWeekEvents = mockEvents.filter(e => {
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
        const dayClass = `text-sm font-medium inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors ${isToday ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted'}`

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
          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 overflow-hidden'>
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
              {viewMode === 'month' ? renderCalendarGrid() : (
                <div className='text-center py-8 text-muted-foreground'>
                  <p className='text-sm'>Week view coming soon</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className='w-full lg:w-80 space-y-4'>
          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80'>
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
                      {hasEvents && !d.isCurrent && <span className='absolute bottom-0 w-1 h-1 rounded-full bg-primary' />}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm'>{selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a date'}</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEvents.length > 0 ? (
                <div className='space-y-2 divide-y divide-border/50'>
                  {selectedEvents.map(e => (
                    <div key={e.id} onClick={() => handleEventClick(e)} className='w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer'>
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
                    </div>
                  ))}
                </div>
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

          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm flex items-center gap-2'><Zap className='h-4 w-4 text-primary' /> Upcoming This Week</CardTitle>
            </CardHeader>
            <CardContent className='space-y-1 divide-y divide-border/50'>
              {thisWeekEvents.length > 0 ? thisWeekEvents.map(e => (
                <button key={e.id} onClick={() => { setSelectedDate(e.date); handleEventClick(e) }} className='w-full text-left flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors'>
                  <div className={`w-2 h-2 rounded-full ${e.color} shrink-0`} />
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium truncate'>{e.title}</p>
                    <p className='text-xs text-muted-foreground'>{e.date} · {e.time}</p>
                  </div>
                  {e.type === 'meeting' && <Video className='h-3.5 w-3.5 text-muted-foreground shrink-0' />}
                </button>
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
