'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app-store'
import { authFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Film,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  ArrowLeft,
  Clock,
  Calendar,
  User,
  Users,
  Download,
  Share2,
  Trash2,
  ChevronDown,
  Copy,
  Sparkles,
  BookOpen,
  ListVideo,
  CheckCircle2,
  CircleDot,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────

interface TranscriptEntry {
  id: string
  speaker: string
  speakerColor: string
  time: number
  timeLabel: string
  text: string
}

interface Chapter {
  id: string
  title: string
  time: number
  timeLabel: string
  description: string
  preview: string
}

interface RecordingInfo {
  id: string
  title: string
  date: string
  duration: string
  durationSec: number
  host: string
  participants: number
  size: string
  quality: string
}

// ─── Mock Data ─────────────────────────────────────────────────────

const MOCK_CHAPTERS: Chapter[] = [
  {
    id: 'ch1',
    title: 'Opening & Agenda',
    time: 0,
    timeLabel: '0:00',
    description: 'Meeting kick-off and agenda review',
    preview: 'Team gathers to review sprint objectives and set the agenda for the session.',
  },
  {
    id: 'ch2',
    title: 'Sprint Progress Review',
    time: 330,
    timeLabel: '5:30',
    description: 'Review of current sprint progress and metrics',
    preview: 'Discussion of completed stories, in-progress tasks, and sprint burndown chart analysis.',
  },
  {
    id: 'ch3',
    title: 'Blockers Discussion',
    time: 1125,
    timeLabel: '18:45',
    description: 'Addressing key blockers and dependencies',
    preview: 'Deep dive into API integration delays, resource allocation issues, and proposed solutions.',
  },
  {
    id: 'ch4',
    title: 'Action Items & Next Steps',
    time: 1930,
    timeLabel: '32:10',
    description: 'Wrap-up with decisions and action items',
    preview: 'Summary of decisions made, owners assigned, and deadlines set for next deliverables.',
  },
]

const MOCK_TRANSCRIPT: TranscriptEntry[] = [
  { id: 't1', speaker: 'Sarah Chen', speakerColor: 'text-rose-400', time: 5, timeLabel: '0:05', text: 'Good morning everyone. Let\'s get started. Today we have the sprint review and we need to cover the blockers that came up this week.' },
  { id: 't2', speaker: 'Marcus Webb', speakerColor: 'text-teal-400', time: 22, timeLabel: '0:22', text: 'Sounds good. I have the sprint metrics ready to share. We completed 14 out of 18 story points this sprint.' },
  { id: 't3', speaker: 'Aisha Patel', speakerColor: 'text-amber-400', time: 48, timeLabel: '0:48', text: 'Before we dive into metrics, I want to flag the authentication service issue. It\'s been causing intermittent failures in production.' },
  { id: 't4', speaker: 'Sarah Chen', speakerColor: 'text-rose-400', time: 95, timeLabel: '1:35', text: 'Thanks Aisha. Let\'s put that in the blockers section. Marcus, go ahead with the sprint metrics.' },
  { id: 't5', speaker: 'Marcus Webb', speakerColor: 'text-teal-400', time: 120, timeLabel: '2:00', text: 'So the burndown chart shows we were on track until Wednesday when the API dependency issue surfaced. The team recovered well though — we\'re at 78% completion.' },
  { id: 't6', speaker: 'David Kim', speakerColor: 'text-violet-400', time: 195, timeLabel: '3:15', text: 'I can speak to the recovery. We reallocated two developers from the research spike to help with the critical path items.' },
  { id: 't7', speaker: 'Sarah Chen', speakerColor: 'text-rose-400', time: 240, timeLabel: '4:00', text: 'Great pivot decision. Now let\'s move to the sprint progress review. Marcus, can you walk us through the completed stories?' },
  { id: 't8', speaker: 'Marcus Webb', speakerColor: 'text-teal-400', time: 330, timeLabel: '5:30', text: 'Sure. We completed the user dashboard redesign, the notification system integration, and the mobile responsive overhaul for the settings page.' },
  { id: 't9', speaker: 'Aisha Patel', speakerColor: 'text-amber-400', time: 405, timeLabel: '6:45', text: 'The notification system is working well in staging. I ran the load tests yesterday and we\'re handling 10k events per second without issues.' },
  { id: 't10', speaker: 'David Kim', speakerColor: 'text-violet-400', time: 460, timeLabel: '7:40', text: 'For the mobile redesign, we did find a few edge cases on older devices. I\'ve documented those in JIRA tickets PROJ-412 through PROJ-415.' },
  { id: 't11', speaker: 'Sarah Chen', speakerColor: 'text-rose-400', time: 540, timeLabel: '9:00', text: 'Good documentation practice. Let\'s move to the blockers. Aisha, tell us more about the auth service issue.' },
  { id: 't12', speaker: 'Aisha Patel', speakerColor: 'text-amber-400', time: 1125, timeLabel: '18:45', text: 'The auth service has been throwing 503 errors during peak hours. Our monitoring shows it\'s related to connection pool exhaustion when the token refresh rate spikes.' },
  { id: 't13', speaker: 'David Kim', speakerColor: 'text-violet-400', time: 1195, timeLabel: '19:55', text: 'I looked into this yesterday. The connection pool is set to 50 but we\'re seeing spikes of up to 200 concurrent refresh requests. We need to implement connection pooling at the load balancer level.' },
  { id: 't14', speaker: 'Marcus Webb', speakerColor: 'text-teal-400', time: 1280, timeLabel: '21:20', text: 'I can take that on. I estimate it\'ll take about 2 days to implement and test. Should we schedule it for next sprint or treat it as a hotfix?' },
  { id: 't15', speaker: 'Sarah Chen', speakerColor: 'text-rose-400', time: 1340, timeLabel: '22:20', text: 'Given that it\'s affecting production users, let\'s treat it as a P1 hotfix. Marcus, can you start on it tomorrow?' },
  { id: 't16', speaker: 'Marcus Webb', speakerColor: 'text-teal-400', time: 1370, timeLabel: '22:50', text: 'Absolutely. I\'ll have a fix deployed to staging by end of day tomorrow.' },
  { id: 't17', speaker: 'Aisha Patel', speakerColor: 'text-amber-400', time: 1410, timeLabel: '23:30', text: 'I\'ll pair with you on the testing side. We should also add alerting for when the connection pool hits 80% capacity.' },
  { id: 't18', speaker: 'David Kim', speakerColor: 'text-violet-400', time: 1930, timeLabel: '32:10', text: 'Before we wrap up, I want to summarize the key decisions and action items from today.' },
  { id: 't19', speaker: 'Sarah Chen', speakerColor: 'text-rose-400', time: 1960, timeLabel: '32:40', text: 'Go ahead David. I\'ll add these to the meeting notes.' },
  { id: 't20', speaker: 'David Kim', speakerColor: 'text-violet-400', time: 1985, timeLabel: '33:05', text: 'Three action items: Marcus to fix auth connection pooling by Thursday, Aisha to add connection pool alerting by Friday, and I\'ll create tickets for the mobile edge cases by end of today.' },
]

const MOCK_SUMMARY = {
  topics: [
    'Sprint progress review — 78% completion rate (14/18 story points)',
    'Authentication service 503 errors during peak traffic',
    'Connection pool exhaustion in token refresh service',
    'Mobile responsive redesign edge cases on older devices',
  ],
  decisions: [
    'Auth connection pool fix promoted to P1 hotfix priority',
    'Two developers reallocated from research spike to critical path',
  ],
  actionItems: [
    { owner: 'Marcus Webb', task: 'Implement connection pooling at load balancer level', deadline: 'Thursday' },
    { owner: 'Aisha Patel', task: 'Add alerting for connection pool at 80% capacity', deadline: 'Friday' },
    { owner: 'David Kim', task: 'Create JIRA tickets for mobile edge cases (PROJ-412 to 415)', deadline: 'Today' },
  ],
}

const SPEED_OPTIONS = [0.5, 1, 1.25, 1.5, 2]

// ─── Helpers ───────────────────────────────────────────────────────

function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function getSpeakerInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function getSpeakerBgColor(name: string): string {
  const colors = [
    'bg-rose-500/20', 'bg-teal-500/20', 'bg-amber-500/20', 'bg-violet-500/20',
    'bg-emerald-500/20', 'bg-cyan-500/20', 'bg-orange-500/20', 'bg-pink-500/20',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

// ─── Component ─────────────────────────────────────────────────────

export default function RecordingPlaybackPage() {
  const { currentRecordingId, setCurrentRecordingId, setCurrentView } = useAppStore()

  // Player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(80)
  const [muted, setMuted] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)

  // UI state
  const [summaryOpen, setSummaryOpen] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [activeTranscriptId, setActiveTranscriptId] = useState<string | null>(null)
  const [recordingInfo, setRecordingInfo] = useState<RecordingInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const playerRef = useRef<HTMLDivElement>(null)
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const chaptersScrollRef = useRef<HTMLDivElement>(null)

  const durationSec = recordingInfo?.durationSec || 2400 // Default 40 min

  // ─── Fetch recording info ──────────────────────────────────────
  useEffect(() => {
    if (!currentRecordingId) {
      // Use mock data if no specific ID
      setRecordingInfo({
        id: 'mock-rec-1',
        title: 'Sprint 24 Planning & Review',
        date: 'Jan 15, 2026',
        duration: '40:15',
        durationSec: 2415,
        host: 'Sarah Chen',
        participants: 8,
        size: '1.2 GB',
        quality: 'HD',
      })
      setLoading(false)
      return
    }

    async function fetchRecording() {
      try {
        const res = await authFetch(`/api/v1/recordings?id=${currentRecordingId}`)
        if (res.ok) {
          const json = await res.json()
          const rec = json.data?.recording
          if (rec) {
            setRecordingInfo(rec)
          } else {
            setRecordingInfo({
              id: currentRecordingId,
              title: 'Sprint 24 Planning & Review',
              date: 'Jan 15, 2026',
              duration: '40:15',
              durationSec: 2415,
              host: 'Sarah Chen',
              participants: 8,
              size: '1.2 GB',
              quality: 'HD',
            })
          }
        } else {
          setRecordingInfo({
            id: currentRecordingId,
            title: 'Sprint 24 Planning & Review',
            date: 'Jan 15, 2026',
            duration: '40:15',
            durationSec: 2415,
            host: 'Sarah Chen',
            participants: 8,
            size: '1.2 GB',
            quality: 'HD',
          })
        }
      } catch {
        setRecordingInfo({
          id: currentRecordingId || 'mock-rec-1',
          title: 'Sprint 24 Planning & Review',
          date: 'Jan 15, 2026',
          duration: '40:15',
          durationSec: 2415,
          host: 'Sarah Chen',
          participants: 8,
          size: '1.2 GB',
          quality: 'HD',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchRecording()
  }, [currentRecordingId])

  // ─── Playback timer ────────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!isPlaying) return
    timerRef.current = setInterval(() => {
      setCurrentTime(prev => {
        const next = prev + speed
        if (next >= durationSec) {
          setIsPlaying(false)
          return durationSec
        }
        return next
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, speed, durationSec])

  // ─── Auto-highlight active transcript entry ────────────────────
  useEffect(() => {
    const active = MOCK_TRANSCRIPT.find((t, i) => {
      const next = MOCK_TRANSCRIPT[i + 1]
      return next ? currentTime >= t.time && currentTime < next.time : currentTime >= t.time
    })
    if (active) setActiveTranscriptId(active.id)
  }, [currentTime])

  // ─── Controls auto-hide ────────────────────────────────────────
  const resetControlsTimer = useCallback(() => {
    setShowControls(true)
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    controlsTimerRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3000)
  }, [isPlaying])

  useEffect(() => {
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    }
  }, [])

  // ─── Handlers ──────────────────────────────────────────────────
  const handleSeek = (value: number[]) => {
    setCurrentTime(value[0])
    resetControlsTimer()
  }

  const handleTranscriptClick = (entry: TranscriptEntry) => {
    setCurrentTime(entry.time)
    setIsPlaying(true)
    resetControlsTimer()
    toast.info(`Seeking to ${entry.timeLabel}`)
  }

  const handleChapterClick = (chapter: Chapter) => {
    setCurrentTime(chapter.time)
    setIsPlaying(true)
    toast.info(`Seeking to chapter: ${chapter.title}`)
  }

  const handleBack = () => {
    setIsPlaying(false)
    setCurrentRecordingId(null)
    setCurrentView('recordings')
  }

  const handleCopySummary = () => {
    const text = [
      '## Meeting Summary',
      '',
      '### Key Topics',
      ...MOCK_SUMMARY.topics.map(t => `- ${t}`),
      '',
      '### Decisions',
      ...MOCK_SUMMARY.decisions.map(d => `- ${d}`),
      '',
      '### Action Items',
      ...MOCK_SUMMARY.actionItems.map(a => `- [ ] ${a.task} (${a.owner}) — ${a.deadline}`),
    ].join('\n')
    navigator.clipboard?.writeText(text)
    toast.success('Summary copied to clipboard')
  }

  const handleDownload = () => {
    toast.success(`Downloading "${recordingInfo?.title || 'recording'}"...`)
  }

  const handleShare = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/recordings/${currentRecordingId}`)
    toast.success('Share link copied to clipboard')
  }

  const handleDelete = () => {
    setDeleteOpen(false)
    toast.success(`"${recordingInfo?.title || 'Recording'}" has been deleted`)
    setTimeout(handleBack, 800)
  }

  const handleFullscreen = () => {
    if (!playerRef.current) return
    if (!isFullscreen) {
      playerRef.current.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // ─── Compute active chapter ────────────────────────────────────
  const activeChapterId = useMemo(() => {
    let active: string | null = null
    for (const ch of MOCK_CHAPTERS) {
      if (currentTime >= ch.time) active = ch.id
    }
    return active
  }, [currentTime])

  const progressPercent = durationSec > 0 ? (currentTime / durationSec) * 100 : 0

  // ─── Loading state ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-video animate-pulse rounded-xl bg-slate-950" />
            <div className="h-24 animate-pulse rounded-xl bg-muted" />
          </div>
          <div className="lg:col-span-3 space-y-4">
            <div className="h-40 animate-pulse rounded-xl bg-muted" />
            <div className="h-64 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold tracking-tight truncate">
            {recordingInfo?.title || 'Recording Playback'}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {recordingInfo?.date} · {recordingInfo?.duration}
          </p>
        </div>
      </motion.div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* ─── Left Side: Video Player + Chapters (70%) ─── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-7 space-y-5"
        >
          {/* Video Player */}
          <div
            ref={playerRef}
            className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video group"
            onMouseMove={resetControlsTimer}
            onMouseLeave={() => isPlaying && setShowControls(false)}
          >
            {/* Gradient background placeholder */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
              {/* Subtle grid pattern */}
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }} />
            </div>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <motion.div
                animate={isPlaying ? { scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] } : { scale: 1, opacity: 0.4 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="mb-4"
              >
                <Film className="h-20 w-20 text-slate-500" />
              </motion.div>
              {!isPlaying && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-slate-400 text-sm font-medium tracking-wider uppercase"
                >
                  Recording
                </motion.p>
              )}
            </div>

            {/* Controls overlay */}
            <AnimatePresence>
              {showControls && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 z-20 flex flex-col justify-end"
                >
                  {/* Bottom controls */}
                  <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-24 pb-3 px-4">
                    {/* Seek bar */}
                    <div className="mb-3 group/seek">
                      <Slider
                        value={[currentTime]}
                        min={0}
                        max={durationSec}
                        step={1}
                        onValueChange={handleSeek}
                        className="w-full cursor-pointer [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-0 [&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:shadow-lg [&_[role=slider]]:shadow-emerald-500/30 [&>span:first-child]:h-1 [&>span:first-child]:bg-white/20 hover:[&>span:first-child]:bg-white/30 [&>span:first-child>span]:bg-emerald-500"
                      />
                    </div>

                    {/* Controls row */}
                    <div className="flex items-center justify-between gap-3">
                      {/* Left controls */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-white hover:bg-white/10"
                          onClick={() => { setIsPlaying(!isPlaying); resetControlsTimer() }}
                        >
                          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                        </Button>

                        {/* Volume */}
                        <div className="flex items-center gap-1.5 group/vol">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white hover:bg-white/10"
                            onClick={() => { setMuted(!muted); resetControlsTimer() }}
                          >
                            {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                          </Button>
                          <div className="w-20 hidden group-hover/vol:block">
                            <Slider
                              value={[muted ? 0 : volume]}
                              min={0}
                              max={100}
                              step={1}
                              onValueChange={(v) => { setVolume(v[0]); setMuted(v[0] === 0) }}
                              className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-0 [&_[role=slider]]:bg-white [&_[role=slider]]:shadow-md [&>span:first-child]:h-1 [&>span:first-child]:bg-white/20 [&>span:first-child>span]:bg-white"
                            />
                          </div>
                        </div>

                        {/* Time display */}
                        <span className="text-xs text-white/80 tabular-nums ml-1">
                          {formatTime(currentTime)} / {formatTime(durationSec)}
                        </span>
                      </div>

                      {/* Right controls */}
                      <div className="flex items-center gap-2">
                        {/* Speed selector */}
                        <Select value={String(speed)} onValueChange={(v) => { setSpeed(Number(v)); resetControlsTimer() }}>
                          <SelectTrigger className="h-8 w-16 border-0 bg-white/10 text-white text-xs hover:bg-white/20 focus:ring-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SPEED_OPTIONS.map(s => (
                              <SelectItem key={s} value={String(s)} className="text-xs">{s}x</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white hover:bg-white/10"
                          onClick={handleFullscreen}
                        >
                          <Maximize className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress bar (thin, always visible) */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-30">
              <motion.div
                className="h-full bg-emerald-500"
                style={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* ─── AI Chapters ─── */}
          <Card className="border-border/50">
            <CardHeader className="pb-3 px-5 pt-5">
              <div className="flex items-center gap-2">
                <ListVideo className="h-4 w-4 text-emerald-500" />
                <CardTitle className="text-sm font-semibold">AI-Generated Chapters</CardTitle>
                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500 bg-emerald-500/5 ml-auto">AI</Badge>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div
                ref={chaptersScrollRef}
                className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--muted)) transparent' }}
              >
                {MOCK_CHAPTERS.map((chapter, idx) => (
                  <motion.button
                    key={chapter.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    onClick={() => handleChapterClick(chapter)}
                    className={`shrink-0 w-52 p-4 rounded-xl border text-left transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${
                      activeChapterId === chapter.id
                        ? 'border-emerald-500/50 bg-emerald-500/5 shadow-sm shadow-emerald-500/10'
                        : 'border-border/60 bg-card hover:border-emerald-500/30 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono font-medium text-emerald-500">{chapter.timeLabel}</span>
                      {activeChapterId === chapter.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                        />
                      )}
                    </div>
                    <h4 className="text-sm font-semibold mb-1 line-clamp-1">{chapter.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{chapter.description}</p>
                    <p className="text-[11px] text-muted-foreground/70 line-clamp-2 leading-relaxed">{chapter.preview}</p>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── Right Side: Details Sidebar (30%) ─── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-3 space-y-4"
        >
          {/* Meeting Info */}
          <Card className="border-border/50">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-500" />
                Meeting Info
              </h3>
              <Separator className="bg-border/50" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Title</span>
                  <span className="text-xs font-medium text-right max-w-[60%] truncate">{recordingInfo?.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" /> Date
                  </span>
                  <span className="text-xs font-medium">{recordingInfo?.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> Duration
                  </span>
                  <span className="text-xs font-medium">{recordingInfo?.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3 w-3" /> Host
                  </span>
                  <span className="text-xs font-medium">{recordingInfo?.host}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Users className="h-3 w-3" /> Participants
                  </span>
                  <span className="text-xs font-medium">{recordingInfo?.participants}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Transcript */}
          <Card className="border-border/50">
            <CardHeader className="pb-3 px-5 pt-5">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-500" />
                <CardTitle className="text-sm font-semibold">AI Transcript</CardTitle>
                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500 bg-emerald-500/5 ml-auto">AI</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[340px] px-5 pb-4">
                <div className="space-y-1">
                  {MOCK_TRANSCRIPT.map(entry => {
                    const isActive = activeTranscriptId === entry.id
                    return (
                      <motion.button
                        key={entry.id}
                        onClick={() => handleTranscriptClick(entry)}
                        className={`w-full text-left p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                          isActive
                            ? 'bg-emerald-500/10 border border-emerald-500/20'
                            : 'border border-transparent hover:bg-muted/50'
                        }`}
                        whileTap={{ scale: 0.995 }}
                      >
                        <div className="flex items-start gap-3">
                          {/* Speaker avatar */}
                          <div className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isActive ? 'bg-emerald-500 text-white' : `${getSpeakerBgColor(entry.speaker)} ${entry.speakerColor}`
                          }`}>
                            {getSpeakerInitials(entry.speaker)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-semibold ${isActive ? 'text-emerald-600' : ''}`}>{entry.speaker}</span>
                              <span className={`text-[10px] tabular-nums ${isActive ? 'text-emerald-500' : 'text-muted-foreground'}`}>{entry.timeLabel}</span>
                              {isActive && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="ml-auto"
                                >
                                  <CircleDot className="h-3 w-3 text-emerald-500" />
                                </motion.div>
                              )}
                            </div>
                            <p className={`text-xs leading-relaxed ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {entry.text}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* AI Summary (collapsible) */}
          <Card className="border-border/50">
            <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen}>
              <CardHeader className="pb-0 px-5 pt-5">
                <CollapsibleTrigger className="flex items-center gap-2 w-full cursor-pointer group">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  <CardTitle className="text-sm font-semibold flex-1 text-left">AI Summary</CardTitle>
                  <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500 bg-emerald-500/5">AI</Badge>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${summaryOpen ? 'rotate-0' : '-rotate-90'}`} />
                </CollapsibleTrigger>
              </CardHeader>
              <AnimatePresence>
                {summaryOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CollapsibleContent>
                      <CardContent className="px-5 pb-5 space-y-4">
                        {/* Key Topics */}
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Topics</h4>
                          <ul className="space-y-1.5">
                            {MOCK_SUMMARY.topics.map((topic, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                <span className="text-muted-foreground leading-relaxed">{topic}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <Separator className="bg-border/50" />

                        {/* Decisions */}
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Decisions</h4>
                          <ul className="space-y-1.5">
                            {MOCK_SUMMARY.decisions.map((d, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs">
                                <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                                <span className="text-muted-foreground leading-relaxed">{d}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <Separator className="bg-border/50" />

                        {/* Action Items */}
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Action Items</h4>
                          <ul className="space-y-2">
                            {MOCK_SUMMARY.actionItems.map((a, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs">
                                <div className="h-3.5 w-3.5 rounded border border-muted-foreground/40 shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-muted-foreground leading-relaxed">{a.task}</p>
                                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                                    <span className="font-medium">{a.owner}</span> · {a.deadline}
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Copy Summary */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs gap-2 border-border/60 hover:bg-emerald-500/5 hover:border-emerald-500/30 hover:text-emerald-600"
                          onClick={handleCopySummary}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy Summary
                        </Button>
                      </CardContent>
                    </CollapsibleContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Collapsible>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 text-sm border-border/60 hover:bg-emerald-500/5 hover:border-emerald-500/30 hover:text-emerald-600"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
              Download Recording
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 text-sm border-border/60 hover:bg-emerald-500/5 hover:border-emerald-500/30 hover:text-emerald-600"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              Share Recording
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 text-sm border-red-200 text-red-600 hover:bg-red-500/5 hover:border-red-300 hover:text-red-700"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete Recording
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recording</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{recordingInfo?.title}&quot;? This action cannot be undone. The recording file, transcript, and AI summary will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
