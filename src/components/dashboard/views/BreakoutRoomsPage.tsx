'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Search,
  LayoutGrid,
  Users,
  CalendarDays,
  Circle,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { authFetch } from '@/lib/api'
import { useAppStore } from '@/store/app-store'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MeetingItem {
  id: string
  meetingId: string
  title: string
  status: string
  startTime: string | null
  createdAt: string
  host: { id: string; name: string; email: string } | null
  participants: { id: string; role: string; user: { id: string; name: string } | null }[]
}

type StatusFilter = 'all' | 'active' | 'scheduled'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const statusConfig: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  active:    { label: 'Active',    dot: 'bg-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  scheduled: { label: 'Scheduled', dot: 'bg-amber-500',    bg: 'bg-amber-500/10',    text: 'text-amber-600' },
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function BreakoutRoomsPage() {
  const [meetings, setMeetings] = useState<MeetingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const setCurrentMeetingId = useAppStore(s => s.setCurrentMeetingId)
  const setMeetingTitle = useAppStore(s => s.setMeetingTitle)
  const setCurrentView = useAppStore(s => s.setCurrentView)
  const setMeetingSidebarTab = useAppStore(s => s.setMeetingSidebarTab)

  useEffect(() => {
    let cancelled = false
    async function fetchMeetings() {
      try {
        const params = new URLSearchParams({ status: 'scheduled,active', limit: '50' })
        const res = await authFetch(`/api/v1/meetings?${params}`)
        if (!res.ok) throw new Error('Failed to fetch meetings')
        const json = await res.json()
        if (!cancelled) {
          setMeetings(json.data?.meetings ?? [])
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchMeetings()
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    let list = meetings
    if (statusFilter !== 'all') list = list.filter(m => m.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(m => m.title.toLowerCase().includes(q))
    }
    return list
  }, [meetings, statusFilter, search])

  function handleManageBreakouts(meeting: MeetingItem) {
    setCurrentMeetingId(meeting.id)
    setMeetingTitle(meeting.title)
    setMeetingSidebarTab('breakout')
    setCurrentView('meeting-room')
    toast.info(`Opening breakout rooms for "${meeting.title}"`)
  }

  /* ── Loading Skeleton ── */
  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='h-1 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500' />
        <div className='flex flex-col sm:flex-row sm:items-center gap-3'>
          <Skeleton className='h-7 w-52' />
          <Skeleton className='h-9 w-64' />
        </div>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className='h-40 rounded-xl' />
          ))}
        </div>
      </div>
    )
  }

  /* ── Error State ── */
  if (error) {
    return (
      <div className='space-y-6'>
        <div className='h-1 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500' />
        <Card className='border-red-500/30 bg-red-500/5'>
          <CardContent className='flex items-center gap-3 p-6'>
            <AlertCircle className='h-5 w-5 text-red-500 shrink-0' />
            <div className='flex-1'>
              <p className='text-sm font-medium text-red-600'>Failed to load meetings</p>
              <p className='text-xs text-red-500/80 mt-0.5'>{error}</p>
            </div>
            <Button variant='outline' size='sm' onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  /* ── Main View ── */
  const filterTabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: `All (${meetings.length})` },
    { key: 'active', label: `Active (${meetings.filter(m => m.status === 'active').length})` },
    { key: 'scheduled', label: `Scheduled (${meetings.filter(m => m.status === 'scheduled').length})` },
  ]

  return (
    <motion.div className='space-y-6' initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      {/* Top accent line */}
      <div className='h-1 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500' />

      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <LayoutGrid className='h-6 w-6 text-primary' />
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Breakout Rooms</h1>
            <p className='text-sm text-muted-foreground'>Select a meeting to manage its breakout rooms</p>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className='flex flex-col sm:flex-row gap-3'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60' />
          <Input
            placeholder='Search meetings...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            className='pl-10 h-9 text-sm'
          />
        </div>
        <div className='flex items-center gap-1.5'>
          {filterTabs.map(tab => (
            <Button
              key={tab.key}
              variant={statusFilter === tab.key ? 'default' : 'outline'}
              size='sm'
              className={`text-xs h-8 ${statusFilter === tab.key ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Meeting Cards */}
      {filtered.length === 0 ? (
        <Card className='border-dashed'>
          <CardContent className='flex flex-col items-center justify-center py-16 text-center'>
            <LayoutGrid className='h-10 w-10 text-muted-foreground/30 mb-3' />
            <p className='text-sm font-medium text-muted-foreground'>No meetings found</p>
            <p className='text-xs text-muted-foreground/60 mt-1'>
              {search ? 'Try a different search term' : 'Schedule a meeting to use breakout rooms'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {filtered.map(meeting => {
            const cfg = statusConfig[meeting.status]
            return (
              <motion.div
                key={meeting.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className='bg-card/80 backdrop-blur border border-border/50 rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 h-full'>
                  <CardContent className='p-5 flex flex-col h-full gap-3'>
                    {/* Status badge + title */}
                    <div className='flex items-start justify-between gap-2'>
                      <h3 className='text-sm font-semibold leading-snug line-clamp-2'>{meeting.title}</h3>
                      {cfg && (
                        <Badge variant='outline' className={`shrink-0 text-[10px] px-2 py-0.5 border-0 ${cfg.bg} ${cfg.text}`}>
                          <Circle className={`h-1.5 w-1.5 fill-current mr-1 ${cfg.dot}`} />
                          {cfg.label}
                        </Badge>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className='space-y-1.5 text-xs text-muted-foreground flex-1'>
                      <div className='flex items-center gap-1.5'>
                        <CalendarDays className='h-3.5 w-3.5 shrink-0' />
                        <span>{meeting.startTime ? formatDate(meeting.startTime) : formatDate(meeting.createdAt)}</span>
                      </div>
                      <div className='flex items-center gap-1.5'>
                        <Users className='h-3.5 w-3.5 shrink-0' />
                        <span>{meeting.host?.name ?? 'Unknown host'}</span>
                      </div>
                      <div className='flex items-center gap-1.5'>
                        <Users className='h-3.5 w-3.5 shrink-0' />
                        <span>{meeting.participants.length} participant{meeting.participants.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Action button */}
                    <Button
                      size='sm'
                      className='w-full text-xs mt-auto bg-emerald-600 hover:bg-emerald-700 text-white'
                      onClick={() => handleManageBreakouts(meeting)}
                    >
                      Manage Breakout Rooms
                      <ArrowRight className='ml-1.5 h-3.5 w-3.5' />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
