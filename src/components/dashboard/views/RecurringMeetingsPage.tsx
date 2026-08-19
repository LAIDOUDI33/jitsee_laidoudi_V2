'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Repeat,
  CalendarDays,
  Clock,
  Users,
  Trash2,
  Pencil,
  ChevronRight,
  CalendarCheck,
  CalendarRange,
  ArrowRight,
  Globe,
  TrendingUp,
  CalendarPlus,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface RecurringSeries {
  id: string
  title: string
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  recurrencePattern: string
  nextOccurrence: string
  occurrencesThisWeek: number
  totalOccurrences: number
  remainingOccurrences: number
  duration: string
  participants: number
  timezone: string
  color: string
}

interface Occurrence {
  id: string
  date: string
  time: string
  status: 'upcoming' | 'completed' | 'cancelled'
  attendees: number
}

/* ------------------------------------------------------------------ */
/* Mock Data                                                           */
/* ------------------------------------------------------------------ */

const MOCK_SERIES: RecurringSeries[] = [
  {
    id: 'rs-1',
    title: 'Daily Standup',
    frequency: 'daily',
    recurrencePattern: 'Every weekday at 9:00 AM',
    nextOccurrence: 'Tomorrow, 9:00 AM',
    occurrencesThisWeek: 5,
    totalOccurrences: 260,
    remainingOccurrences: 45,
    duration: '15m',
    participants: 8,
    timezone: 'America/New_York',
    color: 'emerald',
  },
  {
    id: 'rs-2',
    title: 'Sprint Planning',
    frequency: 'biweekly',
    recurrencePattern: 'Every other Monday at 10:00 AM',
    nextOccurrence: 'Mon, Jan 27, 10:00 AM',
    occurrencesThisWeek: 1,
    totalOccurrences: 24,
    remainingOccurrences: 8,
    duration: '1h',
    participants: 12,
    timezone: 'America/New_York',
    color: 'teal',
  },
  {
    id: 'rs-3',
    title: 'Design Review',
    frequency: 'weekly',
    recurrencePattern: 'Every Wednesday at 2:00 PM',
    nextOccurrence: 'Wed, Jan 22, 2:00 PM',
    occurrencesThisWeek: 1,
    totalOccurrences: 52,
    remainingOccurrences: 18,
    duration: '45m',
    participants: 6,
    timezone: 'Europe/London',
    color: 'amber',
  },
  {
    id: 'rs-4',
    title: 'All-Hands Meeting',
    frequency: 'monthly',
    recurrencePattern: 'First Tuesday of each month at 3:00 PM',
    nextOccurrence: 'Tue, Feb 4, 3:00 PM',
    occurrencesThisWeek: 0,
    totalOccurrences: 12,
    remainingOccurrences: 4,
    duration: '1h',
    participants: 45,
    timezone: 'America/Los_Angeles',
    color: 'emerald',
  },
  {
    id: 'rs-5',
    title: '1:1 with Sarah',
    frequency: 'weekly',
    recurrencePattern: 'Every Thursday at 11:00 AM',
    nextOccurrence: 'Thu, Jan 23, 11:00 AM',
    occurrencesThisWeek: 1,
    totalOccurrences: 52,
    remainingOccurrences: 32,
    duration: '30m',
    participants: 2,
    timezone: 'America/New_York',
    color: 'teal',
  },
  {
    id: 'rs-6',
    title: 'Customer Success Sync',
    frequency: 'weekly',
    recurrencePattern: 'Every Monday, Wednesday, Friday at 4:00 PM',
    nextOccurrence: 'Mon, Jan 20, 4:00 PM',
    occurrencesThisWeek: 3,
    totalOccurrences: 156,
    remainingOccurrences: 62,
    duration: '30m',
    participants: 5,
    timezone: 'Asia/Tokyo',
    color: 'amber',
  },
]

const MOCK_OCCURRENCES: Record<string, Occurrence[]> = {
  'rs-1': [
    { id: 'o1', date: 'Mon, Jan 20', time: '9:00 AM', status: 'completed', attendees: 7 },
    { id: 'o2', date: 'Tue, Jan 21', time: '9:00 AM', status: 'completed', attendees: 8 },
    { id: 'o3', date: 'Wed, Jan 22', time: '9:00 AM', status: 'upcoming', attendees: 0 },
    { id: 'o4', date: 'Thu, Jan 23', time: '9:00 AM', status: 'upcoming', attendees: 0 },
    { id: 'o5', date: 'Fri, Jan 24', time: '9:00 AM', status: 'upcoming', attendees: 0 },
  ],
  'rs-2': [
    { id: 'o6', date: 'Mon, Jan 13', time: '10:00 AM', status: 'completed', attendees: 11 },
    { id: 'o7', date: 'Mon, Jan 27', time: '10:00 AM', status: 'upcoming', attendees: 0 },
    { id: 'o8', date: 'Mon, Feb 10', time: '10:00 AM', status: 'upcoming', attendees: 0 },
  ],
  'rs-3': [
    { id: 'o9', date: 'Wed, Jan 15', time: '2:00 PM', status: 'completed', attendees: 5 },
    { id: 'o10', date: 'Wed, Jan 22', time: '2:00 PM', status: 'upcoming', attendees: 0 },
    { id: 'o11', date: 'Wed, Jan 29', time: '2:00 PM', status: 'upcoming', attendees: 0 },
  ],
  'rs-4': [
    { id: 'o12', date: 'Tue, Jan 7', time: '3:00 PM', status: 'completed', attendees: 42 },
    { id: 'o13', date: 'Tue, Feb 4', time: '3:00 PM', status: 'upcoming', attendees: 0 },
  ],
  'rs-5': [
    { id: 'o14', date: 'Thu, Jan 16', time: '11:00 AM', status: 'completed', attendees: 2 },
    { id: 'o15', date: 'Thu, Jan 23', time: '11:00 AM', status: 'upcoming', attendees: 0 },
    { id: 'o16', date: 'Thu, Jan 30', time: '11:00 AM', status: 'upcoming', attendees: 0 },
  ],
  'rs-6': [
    { id: 'o17', date: 'Fri, Jan 17', time: '4:00 PM', status: 'completed', attendees: 4 },
    { id: 'o18', date: 'Mon, Jan 20', time: '4:00 PM', status: 'upcoming', attendees: 0 },
    { id: 'o19', date: 'Wed, Jan 22', time: '4:00 PM', status: 'upcoming', attendees: 0 },
    { id: 'o20', date: 'Fri, Jan 24', time: '4:00 PM', status: 'upcoming', attendees: 0 },
  ],
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function getColorClasses(color: string) {
  const map: Record<string, { border: string; bg: string; text: string; badge: string; icon: string }> = {
    emerald: {
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
      icon: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    },
    teal: {
      border: 'border-teal-500/30',
      bg: 'bg-teal-500/10',
      text: 'text-teal-600 dark:text-teal-400',
      badge: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/20',
      icon: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
    },
    amber: {
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10',
      text: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20',
      icon: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    },
  }
  return map[color] || map.emerald
}

function getFrequencyLabel(freq: string) {
  const labels: Record<string, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
  }
  return labels[freq] || freq
}

function getFrequencyIcon(freq: string) {
  if (freq === 'daily') return '🌙'
  if (freq === 'weekly') return '📅'
  if (freq === 'biweekly') return '🔄'
  if (freq === 'monthly') return '📆'
  return '🔁'
}

/* ------------------------------------------------------------------ */
/* Sub-Components                                                      */
/* ------------------------------------------------------------------ */

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  color: 'emerald' | 'teal' | 'amber'
}) {
  const colors = getColorClasses(color)
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border/40 hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${colors.icon}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function RecurrencePattern({ pattern, frequency }: { pattern: string; frequency: string }) {
  return (
    <div className="flex items-start gap-2 mt-2">
      <span className="text-base leading-tight mt-0.5">{getFrequencyIcon(frequency)}</span>
      <p className="text-sm text-muted-foreground leading-relaxed">{pattern}</p>
    </div>
  )
}

function OccurrenceRow({ occurrence }: { occurrence: Occurrence }) {
  const isUpcoming = occurrence.status === 'upcoming'
  const isCompleted = occurrence.status === 'completed'
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className={`w-2 h-2 rounded-full shrink-0 ${
        isUpcoming ? 'bg-emerald-500' : isCompleted ? 'bg-muted-foreground/30' : 'bg-red-400'
      }`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isUpcoming ? '' : 'text-muted-foreground'}`}>
          {occurrence.date}
        </p>
      </div>
      <span className="text-sm text-muted-foreground shrink-0">{occurrence.time}</span>
      {isCompleted && (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
          {occurrence.attendees} joined
        </Badge>
      )}
      {isUpcoming && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shrink-0">
          Upcoming
        </Badge>
      )}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Main Page                                                           */
/* ------------------------------------------------------------------ */

export default function RecurringMeetingsPage() {
  const [series, setSeries] = useState<RecurringSeries[]>(MOCK_SERIES)
  const [occurrences, setOccurrences] = useState<Record<string, Occurrence[]>>(MOCK_OCCURRENCES)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RecurringSeries | null>(null)

  const stats = useMemo(() => {
    const totalSeries = series.length
    const totalUpcomingThisWeek = series.reduce((sum, s) => sum + s.occurrencesThisWeek, 0)
    const totalParticipants = series.reduce((sum, s) => sum + s.participants, 0)
    const dailyCount = series.filter(s => s.frequency === 'daily').length
    return { totalSeries, totalUpcomingThisWeek, totalParticipants, dailyCount }
  }, [series])

  const handleDeleteSeries = () => {
    if (!deleteTarget) return
    setSeries(prev => prev.filter(s => s.id !== deleteTarget.id))
    setOccurrences(prev => {
      const next = { ...prev }
      delete next[deleteTarget.id]
      return next
    })
    toast.success(`Deleted recurring series "${deleteTarget.title}"`)
    setDeleteTarget(null)
  }

  const handleEditSeries = (s: RecurringSeries) => {
    toast.info(`Opening editor for "${s.title}"...`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <CalendarRange className="h-5 w-5 text-white" />
            </div>
            Recurring Meetings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your recurring meeting series and view upcoming occurrences
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Repeat} label="Recurring Series" value={stats.totalSeries} color="emerald" />
        <StatCard icon={CalendarCheck} label="This Week" value={stats.totalUpcomingThisWeek} color="teal" />
        <StatCard icon={Users} label="Total Participants" value={stats.totalParticipants} color="amber" />
        <StatCard icon={TrendingUp} label="Daily Standups" value={stats.dailyCount} color="emerald" />
      </div>

      <Separator />

      {/* Recurring Series List */}
      {series.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
            <CalendarPlus className="h-10 w-10 text-emerald-500/60" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Recurring Meetings</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            You haven&apos;t set up any recurring meetings yet. Schedule a recurring meeting to see it here.
          </p>
          <Button className="mt-6 gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500">
            <CalendarPlus className="h-4 w-4" />
            Schedule Recurring Meeting
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {series.map((s, idx) => {
              const colors = getColorClasses(s.color)
              const isExpanded = expandedId === s.id
              const seriesOccurrences = occurrences[s.id] || []

              return (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.25, delay: idx * 0.04 }}
                >
                  <Card className={`border-border/40 hover:shadow-md transition-all duration-200 overflow-hidden ${isExpanded ? colors.border : ''}`}>
                    {/* Main row */}
                    <div
                      className="flex items-start gap-3 sm:gap-4 p-4 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    >
                      {/* Color indicator & icon */}
                      <div className={`w-10 h-10 rounded-xl ${colors.icon} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Repeat className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm sm:text-base truncate">{s.title}</h3>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${colors.badge} border`}>
                            {getFrequencyLabel(s.frequency)}
                          </Badge>
                        </div>

                        <RecurrencePattern pattern={s.recurrencePattern} frequency={s.frequency} />

                        {/* Meta row */}
                        <div className="flex items-center gap-3 sm:gap-4 mt-3 flex-wrap text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {s.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> {s.participants}
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" /> {s.timezone.split('/').pop()?.replace('_', ' ')}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" /> {s.remainingOccurrences} left
                          </span>
                        </div>
                      </div>

                      {/* Right: next + chevron */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Next</p>
                          <p className={`text-sm font-medium ${colors.text}`}>{s.nextOccurrence}</p>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </motion.div>
                      </div>
                    </div>

                    {/* Expanded: Occurrences + Actions */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <Separator />
                          <div className="p-4 space-y-4">
                            {/* Actions bar */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                className={`gap-1.5 text-xs ${colors.border} ${colors.text} hover:${colors.bg}`}
                                onClick={(e) => { e.stopPropagation(); handleEditSeries(s) }}
                              >
                                <Pencil className="h-3 w-3" /> Edit Series
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 text-xs text-red-500 border-red-500/30 hover:bg-red-500/10 hover:text-red-500"
                                onClick={(e) => { e.stopPropagation(); setDeleteTarget(s) }}
                              >
                                <Trash2 className="h-3 w-3" /> Delete Series
                              </Button>
                            </div>

                            {/* Occurrences header */}
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 text-muted-foreground" />
                              <h4 className="text-sm font-medium">Occurrences</h4>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {seriesOccurrences.filter(o => o.status === 'upcoming').length} upcoming
                              </Badge>
                            </div>

                            {/* Occurrences list */}
                            <ScrollArea className="max-h-64">
                              <div className="space-y-1">
                                {seriesOccurrences.map(occ => (
                                  <OccurrenceRow key={occ.id} occurrence={occ} />
                                ))}
                              </div>
                            </ScrollArea>

                            {/* View all link */}
                            <button
                              type="button"
                              className={`flex items-center gap-1 text-xs ${colors.text} hover:underline w-fit`}
                              onClick={(e) => { e.stopPropagation(); toast.info('Viewing all occurrences...') }}
                            >
                              View all {s.totalOccurrences} occurrences
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Series</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the recurring series &quot;{deleteTarget?.title}&quot;?
              This will remove all upcoming occurrences. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSeries}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Series
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
