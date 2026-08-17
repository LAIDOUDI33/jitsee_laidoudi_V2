'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import MeetingNotesEditor from '@/components/shared/MeetingNotesEditor'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  TrendingUp,
  Eye,
  Users,
  FileText,
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

interface Recording {
  id: string
  title: string
  meetingId: string
  date: string
  duration: string
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

const sparkline = (bars: number[], color: string) => (
  <div className='flex items-end gap-[2px] h-5'>
    {bars.map((v, i) => (
      <div key={i} className={`w-1 rounded-full ${color} transition-all`} style={{ height: `${v}%` }} />
    ))}
  </div>
)

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

export default function RecordingsPage() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [playing, setPlaying] = useState<string | null>(null)
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [notesOpen, setNotesOpen] = useState(false)
  const [notesTitle, setNotesTitle] = useState('')
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const totalSize = recordings.reduce((acc, r) => {
    const match = r.size.match(/([\d.]+)\s*(MB|GB)/)
    if (!match) return acc
    return acc + parseFloat(match[1]) * (match[2] === 'GB' ? 1024 : 1)
  }, 0)

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

  const filtered = [...recordings]
    .filter(r => r.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'date') return 0
      if (sortBy === 'duration') return a.duration.localeCompare(b.duration)
      if (sortBy === 'views') return b.views - a.views
      return 0
    })

  const handleShare = (title: string) => toast.success(`Share link copied for "${title}"`)
  const handleDownload = (title: string) => toast.success(`Downloading "${title}"...`)
  const handleDelete = (title: string) => toast.success(`"${title}" moved to trash`)

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
          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300 relative overflow-hidden before:content-[\"\"] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-red-500/50 before:to-red-500/0'>
            <CardContent className='p-4 flex items-center gap-3'>
              <div className='p-2.5 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/5'><FileVideo className='h-5 w-5 text-red-600' /></div>
              <div className='flex-1'>
                <div className='flex items-center justify-between'>
                  <p className='text-2xl font-bold tabular-nums'>{animatedRecordings}</p>
                  <span className='text-[10px] font-medium text-emerald-600 flex items-center gap-0.5'><TrendingUp className='h-2.5 w-2.5' />+2</span>
                </div>
                <p className='text-xs text-muted-foreground'>Recordings</p>
                {sparkline([20, 30, 25, 40, 45, 50, 60], 'bg-red-500/40')}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-sky-500/5 transition-all duration-300 relative overflow-hidden before:content-[\"\"] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-sky-500/50 before:to-sky-500/0'>
            <CardContent className='p-4 flex items-center gap-3'>
              <div className='p-2.5 rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-500/5'><Clock className='h-5 w-5 text-sky-600' /></div>
              <div className='flex-1'>
                <p className='text-2xl font-bold'>7h 48m</p>
                <p className='text-xs text-muted-foreground'>Total Duration</p>
                {sparkline([30, 40, 35, 50, 55, 60, 70], 'bg-sky-500/40')}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300 relative overflow-hidden before:content-[\"\"] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-violet-500/50 before:to-violet-500/0'>
            <CardContent className='p-4 flex items-center gap-3'>
              <div className='p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5'><HardDrive className='h-5 w-5 text-violet-600' /></div>
              <div className='flex-1'>
                <p className='text-2xl font-bold tabular-nums'>{animatedStorage} MB</p>
                <p className='text-xs text-muted-foreground'>Storage Used</p>
                {sparkline([50, 55, 52, 58, 60, 63, 67], 'bg-violet-500/40')}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 relative overflow-hidden before:content-[\"\"] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-emerald-500/50 before:to-emerald-500/0'>
            <CardContent className='p-4 flex items-center gap-3'>
              <div className='p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5'><Brain className='h-5 w-5 text-emerald-600' /></div>
              <div className='flex-1'>
                <div className='flex items-center justify-between'>
                  <p className='text-2xl font-bold tabular-nums'>{animatedAiSummarized}</p>
                  <span className='text-[10px] font-medium text-emerald-600 flex items-center gap-0.5'><TrendingUp className='h-2.5 w-2.5' />AI</span>
                </div>
                <p className='text-xs text-muted-foreground'>AI Summarized</p>
                {sparkline([10, 20, 30, 40, 50, 60, 67], 'bg-emerald-500/40')}
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
            <Card className='group relative border border-border/50 hover:border-primary/30 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden before:content-[""] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-primary/50 before:to-primary/0'>
              {/* Video preview area */}
              <div className='relative bg-gradient-to-br from-zinc-800 to-zinc-900 aspect-video flex items-center justify-center overflow-hidden'>
                <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none' />
                <Film className='h-12 w-12 text-zinc-600' />
                <Button
                  size='icon'
                  className='absolute inset-0 m-auto h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95'
                  onClick={() => setPlaying(playing === rec.id ? null : rec.id)}
                >
                  {playing === rec.id ? <Pause className='h-6 w-6 text-white' /> : <Play className='h-6 w-6 text-white ml-0.5' />}
                </Button>
                {/* Duration badge */}
                <Badge variant='secondary' className='absolute bottom-2 right-2 text-xs bg-black/60 text-white border-0 backdrop-blur-sm'>
                  <Clock className='h-3 w-3 mr-1' />{rec.duration}
                </Badge>
                {/* Quality badge */}
                <Badge variant='secondary' className={`absolute bottom-2 left-2 text-[10px] font-semibold border-0 ${rec.quality === 'HD' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-sm shadow-emerald-500/30' : 'bg-gradient-to-r from-zinc-500 to-zinc-400 text-white'}`}>
                  {rec.quality}
                </Badge>
                {/* Playback progress */}
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
                      <DropdownMenuItem className='gap-2' onClick={() => setPlaying(rec.id)}><Play className='h-4 w-4' /> Play</DropdownMenuItem>
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
                  <span>{rec.size}</span>
                  <span className='flex items-center gap-1'><Eye className='h-3 w-3' />{rec.views} views</span>
                </div>
                <div className='flex items-center gap-2 flex-wrap'>
                  {rec.hasTranscript && <Badge variant='outline' className='text-[10px] gap-1 border-sky-200 dark:border-sky-800 text-sky-600 bg-sky-500/5'><Captions className='h-3 w-3' /> Transcript</Badge>}
                  {rec.hasAiSummary && (
                    <Badge variant='outline' className='text-[10px] gap-1 border-emerald-200 dark:border-emerald-800 text-emerald-600 bg-emerald-500/5'>
                      <Sparkles className='h-3 w-3' /> AI Summary
                    </Badge>
                  )}
                  {rec.shared && <Badge variant='outline' className='text-[10px] border-primary/20 text-primary bg-primary/5'>Shared</Badge>}
                </div>
                {/* Playback indicator */}
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

      {filtered.length === 0 && (
        <div className='flex flex-col items-center justify-center py-16'>
          <div className='relative'>
            <Film className='h-16 w-16 text-muted-foreground/20' />
            <div className='absolute inset-0 flex items-center justify-center'>
              <Film className='h-8 w-8 text-muted-foreground/40' />
            </div>
          </div>
          <p className='font-medium mt-4'>No recordings yet</p>
          <p className='text-sm text-muted-foreground mt-1'>Recordings from your ended meetings will appear here</p>
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
    </div>
  )
}
