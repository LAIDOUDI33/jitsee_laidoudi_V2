'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import MeetingNotesEditor from '@/components/shared/MeetingNotesEditor'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Film,
  Search,
  Play,
  Pause,
  Download,
  Share2,
  Trash2,
  Clock,
  HardDrive,
  FileVideo,
  MoreVertical,
  Captions,
  Sparkles,
  Brain,
  Eye,
  Users,
  FileText,
  FolderOpen,
  RefreshCw,
  AlertCircle,
  Volume2,
  VolumeX,
  ChevronDown,
  Loader2,
  Calendar,
  User,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { motion, AnimatePresence } from 'framer-motion'
import { authFetch } from '@/lib/api'
import { useAppStore } from '@/store/app-store'

interface Recording {
  id: string
  title: string
  meetingId: string
  date: string
  duration: string
  durationSec: number
  size: string
  participants: number
  host: string
  hasTranscript: boolean
  hasAiSummary: boolean
  quality: 'HD' | 'SD'
  views: number
  shared: boolean
}

interface ApiEndedMeeting {
  id: string
  title: string
  meetingId: string
  startTime: string | null
  endTime: string | null
  type: string
  status: string
  maxParticipants: number
  recordingEnabled: boolean
  host?: { id: string; name: string; email: string } | null
  participants?: { user: { id: string; name: string; email: string } }[]
  recordings?: { id: string; duration: number; size: number; createdAt: string }[]
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${h}h`
  return `${m}m`
}

function formatTimeDisplay(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatSizeBytes(bytes: number): string {
  if (bytes <= 0) return '0 MB'
  const mb = bytes / (1024 * 1024)
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${Math.round(mb)} MB`
}

function mapApiToRecording(m: ApiEndedMeeting): Recording | null {
  const rec = m.recordings?.[0]
  const durationSec = rec?.duration || (m.startTime && m.endTime ? Math.round((new Date(m.endTime).getTime() - new Date(m.startTime).getTime()) / 1000) : 0)
  const sizeBytes = rec?.size || 0
  if (durationSec <= 0 && sizeBytes <= 0) return null
  return {
    id: rec?.id || m.id,
    title: m.title,
    meetingId: m.meetingId,
    date: m.endTime ? new Date(m.endTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown',
    duration: formatDuration(durationSec),
    durationSec,
    size: formatSizeBytes(sizeBytes),
    participants: m.participants?.length || 0,
    host: m.host?.name || 'Unknown',
    hasTranscript: false,
    hasAiSummary: false,
    quality: sizeBytes > 100 * 1024 * 1024 ? 'HD' : 'SD',
    views: 0,
    shared: false,
  }
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

/* ─── Recording Player Dialog ────────────────────────────────── */
interface PlayerState {
  isPlaying: boolean
  currentTime: number
  volume: number
  muted: boolean
  speed: number
}

const SPEED_OPTIONS = [1, 1.25, 1.5, 2]

function RecordingPlayerDialog({
  recording,
  open,
  onOpenChange,
}: {
  recording: Recording | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [player, setPlayer] = useState<PlayerState>({ isPlaying: false, currentTime: 0, volume: 80, muted: false, speed: 1 })
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const duration = recording?.durationSec || 0

  // Timer effect
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!player.isPlaying || !recording) return
    timerRef.current = setInterval(() => {
      setPlayer(prev => {
        const next = prev.currentTime + prev.speed
        if (next >= duration) {
          return { ...prev, isPlaying: false, currentTime: duration }
        }
        return { ...prev, currentTime: next }
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [player.isPlaying, player.speed, duration, recording])

  // Reset on open
  useEffect(() => {
    if (open) {
      setPlayer({ isPlaying: false, currentTime: 0, volume: 80, muted: false, speed: 1 })
      setAiSummary(null)
      setSummaryOpen(false)
    }
  }, [open, recording?.id])

  const handleSeek = useCallback((val: number[]) => {
    setPlayer(prev => ({ ...prev, currentTime: val[0] }))
  }, [])

  const handleVolumeChange = useCallback((val: number[]) => {
    setPlayer(prev => ({ ...prev, volume: val[0], muted: val[0] === 0 }))
  }, [])

  const handleSpeedChange = useCallback((speed: string) => {
    setPlayer(prev => ({ ...prev, speed: parseFloat(speed) }))
  }, [])

  const handleAiSummary = useCallback(async () => {
    if (!recording || aiSummary) return
    setAiLoading(true)
    try {
      const res = await authFetch(`/api/v1/ai/summarize`, {
        method: 'POST',
        body: JSON.stringify({ meetingId: recording.meetingId }),
      })
      if (res.ok) {
        const json = await res.json()
        setAiSummary(json.data?.summary || json.summary || 'Summary generation is processing. Please check back shortly.')
        setSummaryOpen(true)
      } else {
        setAiSummary('Unable to generate summary at this time. The AI service may be unavailable.')
        setSummaryOpen(true)
      }
    } catch {
      setAiSummary('Network error. Could not reach the AI summary service.')
      setSummaryOpen(true)
    } finally {
      setAiLoading(false)
    }
  }, [recording, aiSummary])

  if (!recording) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-5xl w-full p-0 gap-0 overflow-hidden bg-slate-950 border-white/10 [&>button]:text-white/60 [&>button]:hover:text-white'>
        {/* Video placeholder area */}
        <div className='relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 aspect-video w-full flex items-center justify-center overflow-hidden'>
          {/* Grid pattern background */}
          <div className='absolute inset-0 opacity-5' style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          {/* Center content */}
          <div className='relative z-10 flex flex-col items-center gap-3'>
            <div className='p-6 rounded-full bg-white/5 border border-white/10'>
              <Film className='h-16 w-16 text-white/30' />
            </div>
            <p className='text-lg font-semibold text-white/70'>{recording.title}</p>
            <p className='text-sm text-white/30'>{recording.date}</p>
          </div>
          {/* Play overlay button */}
          <button
            onClick={() => setPlayer(p => ({ ...p, isPlaying: !p.isPlaying }))}
            className='absolute inset-0 m-auto z-20 h-20 w-20 rounded-full bg-emerald-500/90 hover:bg-emerald-500 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-2xl shadow-emerald-500/30 cursor-pointer'
          >
            {player.isPlaying ? <Pause className='h-8 w-8 text-white' /> : <Play className='h-8 w-8 text-white ml-1' />}
          </button>
          {/* Quality badge */}
          <Badge className={`absolute top-4 right-4 text-[10px] font-bold border-0 ${recording.quality === 'HD' ? 'bg-emerald-500/80 text-white' : 'bg-white/20 text-white/80'}`}>
            {recording.quality}
          </Badge>
        </div>

        {/* Controls bar */}
        <div className='bg-slate-900 border-t border-white/5 px-4 py-3'>
          {/* Seek bar */}
          <div className='flex items-center gap-3 mb-2'>
            <span className='text-xs text-slate-400 font-mono tabular-nums min-w-[48px]'>{formatTimeDisplay(player.currentTime)}</span>
            <Slider
              value={[player.currentTime]}
              min={0}
              max={duration || 1}
              step={1}
              onValueChange={handleSeek}
              className='flex-1 [&_[data-slot=slider-track]]:bg-white/10 [&_[data-slot=slider-range]]:bg-emerald-500 [&_[data-slot=slider-thumb]]:bg-emerald-400 [&_[data-slot=slider-thumb]]:border-emerald-300 [&_[data-slot=slider-thumb]]:w-3.5 [&_[data-slot=slider-thumb]]:h-3.5'
            />
            <span className='text-xs text-slate-400 font-mono tabular-nums min-w-[48px] text-right'>{formatTimeDisplay(duration)}</span>
          </div>

          {/* Bottom controls row */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 text-slate-300 hover:text-white hover:bg-white/10'
                onClick={() => setPlayer(p => ({ ...p, isPlaying: !p.isPlaying }))}
              >
                {player.isPlaying ? <Pause className='h-4 w-4' /> : <Play className='h-4 w-4' />}
              </Button>

              {/* Volume */}
              <div className='flex items-center gap-1.5 group/vol'>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-slate-300 hover:text-white hover:bg-white/10'
                  onClick={() => setPlayer(p => ({ ...p, muted: !p.muted }))}
                >
                  {player.muted || player.volume === 0 ? <VolumeX className='h-4 w-4' /> : <Volume2 className='h-4 w-4' />}
                </Button>
                <div className='w-0 group-hover/vol:w-20 transition-all overflow-hidden'>
                  <Slider
                    value={[player.muted ? 0 : player.volume]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={handleVolumeChange}
                    className='w-20 [&_[data-slot=slider-track]]:bg-white/10 [&_[data-slot=slider-range]]:bg-slate-300 [&_[data-slot=slider-thumb]]:bg-slate-200 [&_[data-slot=slider-thumb]]:border-slate-100 [&_[data-slot=slider-thumb]]:w-3 [&_[data-slot=slider-thumb]]:h-3'
                  />
                </div>
              </div>

              {/* Speed selector */}
              <Select value={String(player.speed)} onValueChange={handleSpeedChange}>
                <SelectTrigger className='h-7 w-[60px] text-xs border-white/10 bg-white/5 text-slate-300 hover:text-white'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='bg-slate-900 border-white/10'>
                  {SPEED_OPTIONS.map(s => (
                    <SelectItem key={s} value={String(s)} className='text-slate-300 focus:text-white focus:bg-white/10'>{s}x</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Right actions */}
            <div className='flex items-center gap-1'>
              <Button
                variant='ghost'
                size='sm'
                className='h-7 text-xs text-slate-300 hover:text-white hover:bg-white/10 gap-1'
                onClick={() => toast.success(`Downloading "${recording.title}"...`)}
              >
                <Download className='h-3.5 w-3.5' />
                <span className='hidden sm:inline'>Download</span>
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='h-7 text-xs text-slate-300 hover:text-white hover:bg-white/10 gap-1'
                onClick={() => {
                  navigator.clipboard?.writeText(`${window.location.origin}/recordings/${recording.id}`)
                  toast.success('Share link copied to clipboard')
                }}
              >
                <Share2 className='h-3.5 w-3.5' />
                <span className='hidden sm:inline'>Share</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Info + AI Summary section */}
        <div className='bg-slate-950 px-4 py-4 space-y-4'>
          {/* Meeting info bar */}
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
            <div className='flex flex-col gap-2 flex-1 min-w-0'>
              <h3 className='text-base font-semibold text-white truncate'>{recording.title}</h3>
              <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400'>
                <span className='flex items-center gap-1'><Calendar className='h-3 w-3' />{recording.date}</span>
                <span className='flex items-center gap-1'><User className='h-3 w-3' />{recording.host}</span>
                <span className='flex items-center gap-1'><Clock className='h-3 w-3' />{recording.duration}</span>
                <span className='flex items-center gap-1'><Users className='h-3 w-3' />{recording.participants} participants</span>
                <span className='flex items-center gap-1'><HardDrive className='h-3 w-3' />{recording.size}</span>
              </div>
            </div>
            <Button
              size='sm'
              className='h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shrink-0'
              onClick={handleAiSummary}
              disabled={aiLoading}
            >
              {aiLoading ? <Loader2 className='h-3.5 w-3.5 mr-1.5 animate-spin' /> : <Sparkles className='h-3.5 w-3.5 mr-1.5' />}
              {aiSummary ? 'AI Summary Ready' : 'Get AI Summary'}
            </Button>
          </div>

          <Separator className='bg-white/5' />

          {/* AI Summary collapsible */}
          {aiSummary && (
            <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen}>
              <CollapsibleTrigger className='flex items-center gap-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors w-full cursor-pointer'>
                <ChevronDown className={`h-4 w-4 transition-transform ${summaryOpen ? 'rotate-0' : '-rotate-90'}`} />
                <Sparkles className='h-4 w-4' />
                AI-Generated Summary
                <Badge variant='outline' className='text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10 ml-auto'>AI</Badge>
              </CollapsibleTrigger>
              <AnimatePresence>
                {summaryOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className='overflow-hidden'
                  >
                    <CollapsibleContent>
                      <div className='mt-3 p-4 rounded-xl bg-slate-900/80 border border-emerald-500/10'>
                        <p className='text-sm text-slate-300 leading-relaxed whitespace-pre-wrap'>{aiSummary}</p>
                      </div>
                    </CollapsibleContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Collapsible>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Main Recordings Page ───────────────────────────────────── */

export default function RecordingsPage() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [playing, setPlaying] = useState<string | null>(null)
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [notesOpen, setNotesOpen] = useState(false)
  const [notesTitle, setNotesTitle] = useState('')
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Player dialog
  const [playerOpen, setPlayerOpen] = useState(false)
  const [playerRecording, setPlayerRecording] = useState<Recording | null>(null)

  const fetchRecordings = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch('/api/v1/meetings?status=ended')
      if (!res.ok) throw new Error('Failed to fetch recordings')
      const json = await res.json()
      const endedMeetings = json.data?.meetings || []
      const mapped = endedMeetings.map(mapApiToRecording).filter((r): r is Recording => r !== null)
      setRecordings(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recordings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRecordings() }, [])

  const totalDurationSec = useMemo(() => recordings.reduce((acc, r) => acc + r.durationSec, 0), [recordings])
  const totalSize = useMemo(() => {
    return recordings.reduce((acc, r) => {
      const match = r.size.match(/([\d.]+)\s*(MB|GB)/)
      if (!match) return acc
      return acc + parseFloat(match[1]) * (match[2] === 'GB' ? 1024 : 1)
    }, 0)
  }, [recordings])

  const animatedRecordings = useCountUp(recordings.length)
  const animatedAiSummarized = useCountUp(recordings.filter(r => r.hasAiSummary).length)
  const animatedStorage = useCountUp(Math.round(totalSize))

  useEffect(() => {
    if (!playing) return
    const timer = setInterval(() => {
      setProgress(prev => {
        const curr = prev[playing] || 0
        if (curr >= 100) {
          setPlaying(null)
          return { ...prev, [playing]: 0 }
        }
        return { ...prev, [playing]: Math.min(curr + 2, 100) }
      })
    }, 300)
    return () => clearInterval(timer)
  }, [playing])

  const filtered = useMemo(() => {
    let result = [...recordings]

    if (dateFilter !== 'all') {
      const now = new Date()
      const cutoff = new Date()
      if (dateFilter === 'today') {
        cutoff.setHours(0, 0, 0, 0)
      } else if (dateFilter === 'week') {
        cutoff.setDate(cutoff.getDate() - 7)
      } else if (dateFilter === 'month') {
        cutoff.setMonth(cutoff.getMonth() - 1)
      }
      result = result.filter(r => {
        if (dateFilter === 'today') {
          return r.date === now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }
        return true
      })
    }

    result = result.filter(r => r.title.toLowerCase().includes(search.toLowerCase()))

    result.sort((a, b) => {
      if (sortBy === 'duration') {
        return b.durationSec - a.durationSec
      }
      return 0
    })

    return result
  }, [recordings, search, sortBy, dateFilter])

  const handleShare = (title: string) => toast.success(`Share link copied for "${title}"`)
  const handleDownload = (title: string) => toast.success(`Downloading "${title}"...`)
  const handleDelete = (title: string) => toast.success(`"${title}" moved to trash`)

  const openPlayer = (rec: Recording) => {
    setPlayerRecording(rec)
    setPlayerOpen(true)
  }

  const { setCurrentRecordingId, setCurrentView } = useAppStore()

  const openPlayback = (rec: Recording) => {
    setCurrentRecordingId(rec.id)
    setCurrentView('recording-playback')
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='relative'>
        <h2 className='text-3xl font-bold tracking-tight'>Recordings</h2>
        <p className='text-muted-foreground text-sm mt-1'>Review meeting recordings, transcripts, and AI-generated summaries</p>
        <div className='h-1 w-12 rounded-full bg-gradient-to-r from-primary to-primary/50 mt-2' />
      </div>

      {/* Stats */}
      <motion.div variants={container} initial='hidden' animate='show' className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <motion.div variants={item}>
          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300 relative overflow-hidden before:content-["\"] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-red-500/50 before:to-red-500/0'>
            <CardContent className='p-4 flex items-center gap-3'>
              <div className='p-2.5 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/5'><FileVideo className='h-5 w-5 text-red-600' /></div>
              <div className='flex-1'>
                <p className='text-2xl font-bold tabular-nums'>{animatedRecordings}</p>
                <p className='text-xs text-muted-foreground'>Recordings</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300 relative overflow-hidden before:content-["\"] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-teal-500/50 before:to-teal-500/0'>
            <CardContent className='p-4 flex items-center gap-3'>
              <div className='p-2.5 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-500/5'><Clock className='h-5 w-5 text-teal-600' /></div>
              <div className='flex-1'>
                <p className='text-2xl font-bold'>{formatDuration(totalDurationSec)}</p>
                <p className='text-xs text-muted-foreground'>Total Duration</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300 relative overflow-hidden before:content-["\"] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-violet-500/50 before:to-violet-500/0'>
            <CardContent className='p-4 flex items-center gap-3'>
              <div className='p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5'><HardDrive className='h-5 w-5 text-violet-600' /></div>
              <div className='flex-1'>
                <p className='text-2xl font-bold tabular-nums'>{animatedStorage} MB</p>
                <p className='text-xs text-muted-foreground'>Storage Used</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 relative overflow-hidden before:content-["\"] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-emerald-500/50 before:to-emerald-500/0'>
            <CardContent className='p-4 flex items-center gap-3'>
              <div className='p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5'><Brain className='h-5 w-5 text-emerald-600' /></div>
              <div className='flex-1'>
                <p className='text-2xl font-bold tabular-nums'>{animatedAiSummarized}</p>
                <p className='text-xs text-muted-foreground'>AI Summarized</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Toolbar */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='flex items-center gap-2 flex-1'>
          <div className='relative flex-1 max-w-xs'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input placeholder='Search recordings...' className='pl-9 h-9' value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className='w-[130px] h-9'><SelectValue placeholder='Date' /></SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Time</SelectItem>
              <SelectItem value='today'>Today</SelectItem>
              <SelectItem value='week'>This Week</SelectItem>
              <SelectItem value='month'>This Month</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className='w-[140px] h-9'><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value='date'>Newest First</SelectItem>
              <SelectItem value='duration'>Duration</SelectItem>
              <SelectItem value='views'>Most Views</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className='flex items-center justify-center py-8'>
          <p className='text-sm text-red-500'>{error}</p>
          <Button variant='outline' className='ml-3 text-xs' onClick={fetchRecordings}>Retry</Button>
        </div>
      )}
      {loading && !error && (
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='border border-border/50 bg-card rounded-lg overflow-hidden animate-pulse'>
              <div className='bg-zinc-800 aspect-video' />
              <div className='p-4 space-y-3'>
                <div className='h-4 w-3/4 rounded bg-muted' />
                <div className='h-3 w-1/2 rounded bg-muted' />
                <div className='flex gap-2'><div className='h-5 w-16 rounded-full bg-muted' /><div className='h-5 w-20 rounded-full bg-muted' /></div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && !error && (
      <>
      <motion.div variants={container} initial='hidden' animate='show' className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
        {filtered.map(rec => (
          <motion.div key={rec.id} variants={item}>
            <Card className='group relative border border-border/50 hover:border-primary/30 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden before:content-["\"] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-primary/50 before:to-primary/0'>
              {/* Video preview area */}
              <div className='relative bg-gradient-to-br from-zinc-800 to-zinc-900 aspect-video flex items-center justify-center overflow-hidden cursor-pointer' onClick={() => openPlayback(rec)}>
                <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none' />
                <Film className='h-12 w-12 text-zinc-600' />
                <Button
                  size='icon'
                  className='absolute inset-0 m-auto h-14 w-14 rounded-full bg-emerald-500/80 backdrop-blur-sm hover:bg-emerald-500/90 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95'
                  onClick={(e) => { e.stopPropagation(); openPlayback(rec) }}
                >
                  <Play className='h-6 w-6 text-white ml-0.5' />
                </Button>
                {/* Duration badge */}
                <Badge variant='secondary' className='absolute bottom-2 right-2 text-xs bg-black/60 text-white border-0 backdrop-blur-sm'>
                  <Clock className='h-3 w-3 mr-1' />{rec.duration}
                </Badge>
                {/* Quality badge */}
                <Badge variant='secondary' className={`absolute bottom-2 left-2 text-[10px] font-semibold border-0 ${rec.quality === 'HD' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-sm shadow-emerald-500/30' : 'bg-gradient-to-r from-zinc-500 to-zinc-400 text-white'}`}>
                  {rec.quality}
                </Badge>
                {/* File size badge */}
                <Badge variant='secondary' className='absolute top-2 right-2 text-[10px] bg-black/60 text-white border-0 backdrop-blur-sm'>
                  {rec.size}
                </Badge>
                {/* Playback progress (card level) */}
                {(playing === rec.id || progress[rec.id]) && (
                  <div className='absolute bottom-0 left-0 right-0'>
                    <div className='h-1 bg-white/10 overflow-hidden'>
                      <motion.div
                        className='h-full bg-gradient-to-r from-emerald-500 to-teal-400'
                        style={{ width: `${progress[rec.id] || 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <CardContent className='p-4'>
                <div className='flex items-start justify-between gap-2 mb-2'>
                  <div className='min-w-0'>
                    <h3 className='font-semibold text-sm truncate group-hover:text-primary transition-colors'>{rec.title}</h3>
                    <p className='text-xs text-muted-foreground mt-0.5'>{rec.date} · {rec.participants} participants</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='icon' className='h-8 w-8 shrink-0'><MoreVertical className='h-4 w-4' /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem className='gap-2' onClick={() => openPlayback(rec)}><Play className='h-4 w-4' /> Play</DropdownMenuItem>
                      <DropdownMenuItem className='gap-2' onClick={() => handleDownload(rec.title)}><Download className='h-4 w-4' /> Download</DropdownMenuItem>
                      <DropdownMenuItem className='gap-2' onClick={() => handleShare(rec.title)}><Share2 className='h-4 w-4' /> Share</DropdownMenuItem>
                      <DropdownMenuSeparator />
                        <DropdownMenuItem className='gap-2' onClick={() => { setNotesTitle(rec.title); setNotesOpen(true) }}><FileText className='h-4 w-4' /> View Notes</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className='gap-2 text-red-600' onClick={() => handleDelete(rec.title)}><Trash2 className='h-4 w-4' /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className='flex items-center gap-3 text-xs text-muted-foreground mb-3'>
                  <span className='flex items-center gap-1'><Users className='h-3 w-3' />{rec.host}</span>
                  <span className='flex items-center gap-1'><HardDrive className='h-3 w-3' />{rec.size}</span>
                </div>
                <div className='flex items-center gap-2 flex-wrap'>
                  {rec.hasTranscript && <Badge variant='outline' className='text-[10px] gap-1 border-teal-200 dark:border-teal-800 text-teal-600 bg-teal-500/5'><Captions className='h-3 w-3' /> Transcript</Badge>}
                  {rec.hasAiSummary && (
                    <Badge variant='outline' className='text-[10px] gap-1 border-emerald-200 dark:border-emerald-800 text-emerald-600 bg-emerald-500/5'>
                      <Sparkles className='h-3 w-3' /> AI Summary
                    </Badge>
                  )}
                </div>
                {/* Playback indicator (card level) */}
                {playing === rec.id && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className='mt-3 flex items-center gap-2'>
                    <div className='w-2 h-2 rounded-full bg-emerald-500 animate-breathe' />
                    <span className='text-[11px] text-emerald-600 font-medium'>Playing — {rec.duration}</span>
                    <div className='h-1.5 rounded-full bg-emerald-500/10 overflow-hidden flex-1'>
                      <motion.div
                        className='h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400'
                        style={{ width: `${progress[rec.id] || 0}%` }}
                      />
                    </div>
                    <span className='text-[10px] text-muted-foreground'>{Math.round(progress[rec.id] || 0)}%</span>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && !error && (
        <div className='flex flex-col items-center justify-center py-16'>
          <div className='relative'>
            <FolderOpen className='h-16 w-16 text-muted-foreground/20' />
            <div className='absolute inset-0 flex items-center justify-center'>
              <FolderOpen className='h-8 w-8 text-muted-foreground/40' />
            </div>
          </div>
          <p className='font-medium mt-4'>No recordings yet</p>
          <p className='text-sm text-muted-foreground mt-1'>Your meeting recordings will appear here</p>
        </div>
      )}
      </>
      )}

      {/* Meeting Notes Dialog */}
      <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
        <DialogContent className='max-w-3xl max-h-[85vh] overflow-hidden p-0'>
          <DialogHeader className='p-6 pb-0'>
            <DialogTitle>Meeting Notes — {notesTitle}</DialogTitle>
          </DialogHeader>
          <div className='px-6 pb-6'>
            <MeetingNotesEditor />
          </div>
        </DialogContent>
      </Dialog>

      {/* Recording Player Dialog */}
      <RecordingPlayerDialog
        recording={playerRecording}
        open={playerOpen}
        onOpenChange={setPlayerOpen}
      />
    </div>
  )
}