'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  ArrowLeft,
  Plus,
  Shuffle,
  UserPlus,
  X,
  Timer,
  TimerReset,
  Pause,
  Play,
  Send,
  Pencil,
  XCircle,
  Check,
  Megaphone,
  VolumeX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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

interface ManagedParticipant {
  id: string
  name: string
  initials: string
  color: string
}

interface BreakoutRoomState {
  id: string
  name: string
  participants: ManagedParticipant[]
  timerTotalSec: number
  timerRemainingSec: number
  isPaused: boolean
  isOpen: boolean
  isRenaming: boolean
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const statusConfig: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  active:    { label: 'Active',    dot: 'bg-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  scheduled: { label: 'Scheduled', dot: 'bg-amber-500',    bg: 'bg-amber-500/10',    text: 'text-amber-600' },
}

const PARTICIPANT_COLORS = [
  'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500',
  'bg-violet-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500',
  'bg-red-500', 'bg-lime-500', 'bg-fuchsia-500', 'bg-yellow-500',
]

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatTimer(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2)
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

  // Management state
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingItem | null>(null)
  const [rooms, setRooms] = useState<BreakoutRoomState[]>([])
  const [allParticipants, setAllParticipants] = useState<ManagedParticipant[]>([])
  const [roomCount, setRoomCount] = useState(3)
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [addingParticipantToRoom, setAddingParticipantToRoom] = useState<string | null>(null)

  // Timer ref
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
    setSelectedMeeting(meeting)
    setCurrentMeetingId(meeting.id)
    setMeetingTitle(meeting.title)
    const pts: ManagedParticipant[] = meeting.participants.map((p, i) => ({
      id: p.id || `p-${i}`,
      name: p.user?.name || `Participant ${i + 1}`,
      initials: getInitials(p.user?.name || `P${i + 1}`),
      color: PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length],
    }))
    setAllParticipants(pts)
    setRooms([])
    setBroadcastMsg('')
  }

  // ── Timer effect ──
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    const hasRunning = rooms.some(r => r.isOpen && !r.isPaused && r.timerRemainingSec > 0)
    if (!hasRunning) return
    timerRef.current = setInterval(() => {
      setRooms(prev => prev.map(r => {
        if (!r.isOpen || r.isPaused || r.timerRemainingSec <= 0) return r
        const newSec = r.timerRemainingSec - 1
        if (newSec <= 0) {
          toast.info(`Timer ended for "${r.name}"`)
          return { ...r, timerRemainingSec: 0, isPaused: true }
        }
        return { ...r, timerRemainingSec: newSec }
      }))
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [rooms.some(r => r.isOpen && !r.isPaused)])

  // ── Room CRUD ──
  const createRooms = useCallback((count: number) => {
    const n = Math.max(2, Math.min(8, count))
    const shuffled = [...allParticipants].sort(() => Math.random() - 0.5)
    const newRooms: BreakoutRoomState[] = Array.from({ length: n }, (_, i) => ({
      id: `room-${Date.now()}-${i}`,
      name: `Room ${i + 1}`,
      participants: [],
      timerTotalSec: 600,
      timerRemainingSec: 600,
      isPaused: false,
      isOpen: true,
      isRenaming: false,
    }))
    shuffled.forEach((p, i) => {
      newRooms[i % n].participants.push(p)
    })
    setRooms(newRooms)
    toast.success(`Created ${n} breakout rooms with random assignment`)
  }, [allParticipants])

  const renameRoom = useCallback((roomId: string, newName: string) => {
    if (!newName.trim()) return
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, name: newName.trim(), isRenaming: false } : r))
  }, [])

  const closeRoom = useCallback((roomId: string) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, isOpen: false, isPaused: true } : r))
    toast.success('Room closed')
  }, [])

  const removeParticipantFromRoom = useCallback((roomId: string, participantId: string) => {
    setRooms(prev => prev.map(r => {
      if (r.id !== roomId) return r
      return { ...r, participants: r.participants.filter(p => p.id !== participantId) }
    }))
  }, [])

  const addParticipantToRoom = useCallback((roomId: string, participantId: string) => {
    const participant = allParticipants.find(p => p.id === participantId)
    if (!participant) return
    setRooms(prev => prev.map(r => {
      if (r.id !== roomId) return r
      if (r.participants.some(p => p.id === participantId)) return r
      return { ...r, participants: [...r.participants, participant] }
    }))
    setAddingParticipantToRoom(null)
  }, [allParticipants])

  const getAvailableParticipants = useCallback((roomId: string) => {
    const assignedIds = new Set(rooms.flatMap(r => r.participants.map(p => p.id)))
    return allParticipants.filter(p => !assignedIds.has(p.id) || rooms.find(r => r.id === roomId)?.participants.some(rp => rp.id === p.id))
  }, [rooms, allParticipants])

  const setTimerForAll = useCallback((minutes: number) => {
    const sec = Math.max(1, minutes) * 60
    setRooms(prev => prev.map(r => r.isOpen ? { ...r, timerTotalSec: sec, timerRemainingSec: sec, isPaused: false } : r))
    toast.success(`Timer set to ${minutes} minutes for all rooms`)
  }, [])

  const togglePauseAll = useCallback(() => {
    const anyRunning = rooms.some(r => r.isOpen && !r.isPaused)
    setRooms(prev => prev.map(r => r.isOpen ? { ...r, isPaused: !anyRunning } : r))
  }, [rooms])

  const closeAllRooms = useCallback(() => {
    setRooms(prev => prev.map(r => ({ ...r, isOpen: false, isPaused: true })))
    toast.success('All breakout rooms closed')
  }, [])

  const handleBroadcast = useCallback(() => {
    if (!broadcastMsg.trim()) return
    toast.success(`Broadcast sent to ${rooms.filter(r => r.isOpen).length} rooms`)
    setBroadcastMsg('')
  }, [broadcastMsg, rooms])

  const goBack = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setSelectedMeeting(null)
    setRooms([])
  }, [])

  // ── Get unassigned participants ──
  const unassignedParticipants = useMemo(() => {
    const assignedIds = new Set(rooms.flatMap(r => r.participants.map(p => p.id)))
    return allParticipants.filter(p => !assignedIds.has(p.id))
  }, [rooms, allParticipants])

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

  /* ── Management View ── */
  if (selectedMeeting) {
    const activeRoomCount = rooms.filter(r => r.isOpen).length
    const allPaused = rooms.every(r => !r.isOpen || r.isPaused)

    return (
      <motion.div className='space-y-6' initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <div className='h-1 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500' />

        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <Button variant='ghost' size='icon' onClick={goBack} className='h-9 w-9'>
              <ArrowLeft className='h-4 w-4' />
            </Button>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>{selectedMeeting.title}</h1>
              <p className='text-sm text-muted-foreground'>Manage breakout rooms · {allParticipants.length} participants</p>
            </div>
          </div>
          {rooms.length > 0 && (
            <Badge variant='outline' className='bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs'>
              <Circle className='h-1.5 w-1.5 fill-current mr-1 bg-emerald-500' />
              {activeRoomCount} Active Room{activeRoomCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Create Rooms Section */}
        {rooms.length === 0 && (
          <Card className='border-dashed border-2 border-emerald-500/20 bg-emerald-500/[0.02]'>
            <CardContent className='p-8 flex flex-col items-center text-center gap-4'>
              <div className='p-4 rounded-2xl bg-emerald-500/10'>
                <LayoutGrid className='h-8 w-8 text-emerald-600' />
              </div>
              <div>
                <h3 className='font-semibold text-lg'>Create Breakout Rooms</h3>
                <p className='text-sm text-muted-foreground mt-1'>Split participants into smaller groups for focused discussions</p>
              </div>
              <div className='flex items-center gap-3'>
                <span className='text-sm text-muted-foreground'>Rooms:</span>
                <div className='flex items-center gap-1'>
                  {[2, 3, 4, 5, 6, 7, 8].map(n => (
                    <button
                      key={n}
                      onClick={() => setRoomCount(n)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                        roomCount === n
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className='flex gap-3'>
                <Button onClick={() => createRooms(roomCount)} className='bg-emerald-600 hover:bg-emerald-700 text-white'>
                  <Shuffle className='h-4 w-4 mr-2' />
                  Auto-assign & Create
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Broadcast Message */}
        {rooms.length > 0 && (
          <Card className='border-border/50'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2 mb-3'>
                <Megaphone className='h-4 w-4 text-amber-500' />
                <span className='text-sm font-medium'>Broadcast Message</span>
                <span className='text-xs text-muted-foreground'>— send to all active rooms</span>
              </div>
              <div className='flex gap-2'>
                <Input
                  placeholder='Type a message to broadcast to all rooms...'
                  value={broadcastMsg}
                  onChange={e => setBroadcastMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleBroadcast()}
                  className='flex-1 h-9 text-sm'
                />
                <Button onClick={handleBroadcast} disabled={!broadcastMsg.trim()} className='bg-amber-600 hover:bg-amber-700 text-white h-9'>
                  <Send className='h-4 w-4' />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timer Controls Bar */}
        {rooms.length > 0 && (
          <Card className='border-border/50'>
            <CardContent className='p-4'>
              <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
                <div className='flex items-center gap-2'>
                  <Timer className='h-4 w-4 text-amber-500' />
                  <span className='text-sm font-medium'>Timer Controls</span>
                </div>
                <div className='flex items-center gap-2 flex-1 flex-wrap'>
                  <span className='text-xs text-muted-foreground'>Set all:</span>
                  {[5, 10, 15, 20, 30].map(min => (
                    <Button
                      key={min}
                      variant='outline'
                      size='sm'
                      className='text-xs h-7 px-2.5 border-amber-500/30 text-amber-600 hover:bg-amber-500/10'
                      onClick={() => setTimerForAll(min)}
                    >
                      {min}m
                    </Button>
                  ))}
                  <Separator orientation='vertical' className='h-6 mx-1' />
                  <Button
                    variant='outline'
                    size='sm'
                    className='text-xs h-7'
                    onClick={togglePauseAll}
                  >
                    {allPaused ? <Play className='h-3.5 w-3.5 mr-1' /> : <Pause className='h-3.5 w-3.5 mr-1' />}
                    {allPaused ? 'Resume All' : 'Pause All'}
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='text-xs h-7'
                    onClick={() => setTimerForAll(Math.max(...rooms.map(r => Math.ceil(r.timerTotalSec / 60))))}
                  >
                    <TimerReset className='h-3.5 w-3.5 mr-1' />
                    Reset All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Room Cards Grid */}
        {rooms.length > 0 && (
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            <AnimatePresence mode='popLayout'>
              {rooms.map((room, idx) => (
                <motion.div
                  key={room.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                >
                  <Card className={`border h-full ${room.isOpen ? 'border-emerald-500/30 bg-emerald-500/[0.02]' : 'border-border/50 opacity-60'}`}>
                    <CardHeader className='p-4 pb-2'>
                      <div className='flex items-center justify-between gap-2'>
                        <div className='flex items-center gap-2 flex-1 min-w-0'>
                          {room.isOpen && <Circle className='h-2 w-2 fill-emerald-500 text-emerald-500 shrink-0' />}
                          {room.isRenaming ? (
                            <div className='flex items-center gap-1.5 flex-1'>
                              <Input
                                autoFocus
                                className='h-7 text-sm'
                                defaultValue={room.name}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') renameRoom(room.id, (e.target as HTMLInputElement).value)
                                  if (e.key === 'Escape') setRooms(prev => prev.map(r => r.id === room.id ? { ...r, isRenaming: false } : r))
                                }}
                              />
                              <Button size='icon' variant='ghost' className='h-7 w-7 shrink-0' onClick={() => renameRoom(room.id, (document.querySelector(`input[data-room-id="${room.id}"]`) as HTMLInputElement)?.value || room.name)}>
                                <Check className='h-3.5 w-3.5' />
                              </Button>
                            </div>
                          ) : (
                            <CardTitle className='text-sm font-semibold truncate'>{room.name}</CardTitle>
                          )}
                        </div>
                        {room.isOpen && (
                          <div className='flex items-center gap-0.5'>
                            <Button size='icon' variant='ghost' className='h-7 w-7' onClick={() => setRooms(prev => prev.map(r => r.id === room.id ? { ...r, isRenaming: true } : r))}>
                              <Pencil className='h-3 w-3' />
                            </Button>
                            <Button size='icon' variant='ghost' className='h-7 w-7' onClick={() => setAddingParticipantToRoom(room.id)}>
                              <UserPlus className='h-3 w-3' />
                            </Button>
                            <Button size='icon' variant='ghost' className='h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10' onClick={() => closeRoom(room.id)}>
                              <XCircle className='h-3.5 w-3.5' />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className='p-4 pt-0 space-y-3'>
                      {/* Timer */}
                      <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                        room.timerRemainingSec <= 60 && room.timerRemainingSec > 0 && room.isOpen
                          ? 'bg-rose-500/10 border border-rose-500/20'
                          : 'bg-amber-500/10 border border-amber-500/20'
                      }`}>
                        <div className='flex items-center gap-1.5'>
                          <Timer className={`h-3.5 w-3.5 ${
                            room.timerRemainingSec <= 60 && room.timerRemainingSec > 0 && room.isOpen ? 'text-rose-500' : 'text-amber-500'
                          }`} />
                          <span className={`text-lg font-mono font-bold tabular-nums ${
                            room.timerRemainingSec <= 60 && room.timerRemainingSec > 0 && room.isOpen ? 'text-rose-600' : 'text-amber-600'
                          }`}>
                            {formatTimer(room.timerRemainingSec)}
                          </span>
                        </div>
                        {room.isOpen && (
                          <Button
                            size='icon'
                            variant='ghost'
                            className='h-7 w-7'
                            onClick={() => setRooms(prev => prev.map(r => r.id === room.id ? { ...r, isPaused: !r.isPaused } : r))}
                          >
                            {room.isPaused ? <Play className='h-3.5 w-3.5 text-emerald-500' /> : <Pause className='h-3.5 w-3.5' />}
                          </Button>
                        )}
                        {room.isPaused && room.isOpen && (
                          <span className='text-[10px] text-muted-foreground'>PAUSED</span>
                        )}
                        {!room.isOpen && (
                          <Badge variant='outline' className='text-[10px] text-rose-500 border-rose-500/30'>CLOSED</Badge>
                        )}
                      </div>

                      {/* Participants */}
                      <div>
                        <p className='text-xs text-muted-foreground mb-2'>
                          {room.participants.length} participant{room.participants.length !== 1 ? 's' : ''}
                        </p>
                        <div className='space-y-1.5 max-h-40 overflow-y-auto'>
                          {room.participants.map(p => (
                            <div key={p.id} className='flex items-center gap-2 group/participant'>
                              <Avatar className='h-6 w-6'>
                                <AvatarFallback className={`${p.color} text-white text-[9px] font-bold`}>{p.initials}</AvatarFallback>
                              </Avatar>
                              <span className='text-xs flex-1 truncate'>{p.name}</span>
                              {room.isOpen && (
                                <Button
                                  size='icon'
                                  variant='ghost'
                                  className='h-5 w-5 opacity-0 group-hover/participant:opacity-100 transition-opacity'
                                  onClick={() => removeParticipantFromRoom(room.id, p.id)}
                                >
                                  <X className='h-3 w-3 text-rose-400' />
                                </Button>
                              )}
                            </div>
                          ))}
                          {room.participants.length === 0 && (
                            <p className='text-xs text-muted-foreground/50 italic py-2 text-center'>No participants assigned</p>
                          )}
                        </div>
                      </div>

                      {/* Add Participant Inline */}
                      <AnimatePresence>
                        {addingParticipantToRoom === room.id && room.isOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className='overflow-hidden'
                          >
                            <div className='border-t border-border/50 pt-3 space-y-2'>
                              <p className='text-xs text-muted-foreground'>Add participant:</p>
                              <div className='flex flex-wrap gap-1.5 max-h-24 overflow-y-auto'>
                                {unassignedParticipants.length === 0 && (
                                  <p className='text-[11px] text-muted-foreground/50 italic'>All participants assigned</p>
                                )}
                                {unassignedParticipants.map(p => (
                                  <button
                                    key={p.id}
                                    onClick={() => addParticipantToRoom(room.id, p.id)}
                                    className='flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/30 transition-colors text-left cursor-pointer'
                                  >
                                    <Avatar className='h-5 w-5'>
                                      <AvatarFallback className={`${p.color} text-white text-[8px] font-bold`}>{p.initials}</AvatarFallback>
                                    </Avatar>
                                    <span className='text-[11px]'>{p.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Unassigned participants card */}
            {unassignedParticipants.length > 0 && rooms.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className='border-dashed border-border/50 h-full'>
                  <CardHeader className='p-4 pb-2'>
                    <CardTitle className='text-sm font-medium text-muted-foreground'>
                      Unassigned ({unassignedParticipants.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='p-4 pt-0'>
                    <div className='space-y-1.5'>
                      {unassignedParticipants.map(p => (
                        <div key={p.id} className='flex items-center gap-2'>
                          <Avatar className='h-6 w-6'>
                            <AvatarFallback className={`${p.color} text-white text-[9px] font-bold`}>{p.initials}</AvatarFallback>
                          </Avatar>
                          <span className='text-xs truncate'>{p.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        )}

        {/* Close All / Recreate */}
        {rooms.length > 0 && (
          <div className='flex flex-col sm:flex-row gap-3 pt-2'>
            <Button variant='outline' onClick={() => { setRooms([]) }}>
              <Shuffle className='h-4 w-4 mr-2' />
              Reconfigure Rooms
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant='outline' className='text-rose-600 border-rose-500/30 hover:bg-rose-500/10'>
                  <VolumeX className='h-4 w-4 mr-2' />
                  Close All Rooms
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Close All Breakout Rooms?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will close all {rooms.filter(r => r.isOpen).length} active breakout rooms and return all participants to the main session. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={closeAllRooms} className='bg-rose-600 hover:bg-rose-700'>Close All Rooms</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </motion.div>
    )
  }

  /* ── Meeting Picker View ── */
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
                    <div className='flex items-start justify-between gap-2'>
                      <h3 className='text-sm font-semibold leading-snug line-clamp-2'>{meeting.title}</h3>
                      {cfg && (
                        <Badge variant='outline' className={`shrink-0 text-[10px] px-2 py-0.5 border-0 ${cfg.bg} ${cfg.text}`}>
                          <Circle className={`h-1.5 w-1.5 fill-current mr-1 ${cfg.dot}`} />
                          {cfg.label}
                        </Badge>
                      )}
                    </div>

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