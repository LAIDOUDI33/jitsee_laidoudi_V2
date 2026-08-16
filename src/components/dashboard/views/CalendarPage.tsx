'use client'

import { useState } from 'react'
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
  Repeat,
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
  { id: 'ce1', title: 'Q4 Strategy Review', date: '2025-01-15', time: '10:00 AM', duration: '1h', type: 'meeting', participants: 5, color: 'bg-blue-500' },
  { id: 'ce2', title: 'Engineering Standup', date: '2025-01-15', time: '9:00 AM', duration: '15m', type: 'meeting', participants: 7, color: 'bg-violet-500' },
  { id: 'ce3', title: 'Product Launch Deadline', date: '2025-01-17', time: '5:00 PM', duration: '', type: 'deadline', color: 'bg-red-500' },
  { id: 'ce4', title: 'Team Offsite Planning', date: '2025-01-18', time: '2:00 PM', duration: '1h 30m', type: 'meeting', participants: 12, color: 'bg-emerald-500' },
  { id: 'ce5', title: 'Client Demo - Acme Corp', date: '2025-01-20', time: '11:00 AM', duration: '45m', type: 'meeting', participants: 4, color: 'bg-amber-500' },
  { id: 'ce6', title: 'Sprint 15 Planning', date: '2025-01-21', time: '10:00 AM', duration: '2h', type: 'meeting', participants: 8, color: 'bg-pink-500' },
  { id: 'ce7', title: 'Weekly Report Due', date: '2025-01-22', time: '9:00 AM', duration: '', type: 'reminder', color: 'bg-zinc-500' },
  { id: 'ce8', title: 'Board Meeting', date: '2025-01-24', time: '3:00 PM', duration: '2h', type: 'meeting', participants: 15, color: 'bg-blue-600' },
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

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

  return (
    <div className='flex flex-col lg:flex-row gap-6'>
      {/* Calendar grid */}
      <div className='flex-1'>
        <Card>
          <CardHeader className='pb-2'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-lg'>{MONTHS[currentMonth]} {currentYear}</CardTitle>
              <div className='flex items-center gap-2'>
                <Button variant='outline' size='sm' onClick={goToday}>Today</Button>
                <Button variant='outline' size='icon' className='h-8 w-8' onClick={prevMonth}><ChevronLeft className='h-4 w-4' /></Button>
                <Button variant='outline' size='icon' className='h-8 w-8' onClick={nextMonth}><ChevronRight className='h-4 w-4' /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className='grid grid-cols-7 mb-2'>
              {DAYS.map(d => (
                <div key={d} className='text-center text-xs font-semibold text-muted-foreground py-2'>{d}</div>
              ))}
            </div>
            {/* Calendar cells */}
            <div className='grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden'>
              {calendarCells.map((cell, i) => {
                const events = getEventsForDate(cell.dateStr)
                const isToday = cell.dateStr === todayStr
                const isSelected = cell.dateStr === selectedDate
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(cell.dateStr)}
                    className={`bg-card p-1.5 min-h-[72px] lg:min-h-[90px] text-left transition-colors hover:bg-muted/50 ${
                      cell.month !== 'current' ? 'opacity-40' : ''
                    } ${isSelected ? 'bg-primary/5' : ''}`}
                  >
                    <span className={`text-sm font-medium inline-flex h-7 w-7 items-center justify-center rounded-full ${
                      isToday ? 'bg-primary text-primary-foreground' : ''
                    }`}>
                      {cell.day}
                    </span>
                    <div className='mt-0.5 space-y-0.5'>
                      {events.slice(0, 2).map(e => (
                        <div key={e.id} className={`text-[10px] leading-tight px-1 py-0.5 rounded ${e.color} text-white truncate cursor-pointer`}>
                          {e.title}
                        </div>
                      ))}
                      {events.length > 2 && (
                        <div className='text-[10px] text-muted-foreground pl-1'>+{events.length - 2} more</div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected date panel */}
      <div className='w-full lg:w-80 space-y-4'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm'>{selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a date'}</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedEvents.length > 0 ? (
              <div className='space-y-3'>
                {selectedEvents.map(e => (
                  <button
                    key={e.id}
                    onClick={() => handleEventClick(e)}
                    className='w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors group'
                  >
                    <div className='flex items-start gap-2.5'>
                      <div className={`w-1 h-full min-h-[40px] rounded-full ${e.color} shrink-0`} />
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium text-sm group-hover:text-primary transition-colors'>{e.title}</p>
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
                  </button>
                ))}
              </div>
            ) : (
              <div className='text-center py-8 text-muted-foreground'>
                <CalendarDays className='h-8 w-8 mx-auto mb-2 opacity-40' />
                <p className='text-sm'>{selectedDate ? 'No events on this day' : 'Click a date to view events'}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming events list */}
        <Card>
          <CardHeader className='pb-3'><CardTitle className='text-sm'>Upcoming This Week</CardTitle></CardHeader>
          <CardContent className='space-y-2'>
            {mockEvents.slice(0, 4).map(e => (
              <div key={e.id} className='flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors'>
                <div className={`w-2 h-2 rounded-full ${e.color}`} />
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium truncate'>{e.title}</p>
                  <p className='text-xs text-muted-foreground'>{e.date} · {e.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}