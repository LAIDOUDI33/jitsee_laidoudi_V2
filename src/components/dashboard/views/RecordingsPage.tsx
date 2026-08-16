'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Film,
  Search,
  Play,
  Download,
  Share2,
  Trash2,
  Clock,
  HardDrive,
  FileVideo,
  Filter,
  MoreVertical,
  Mic,
  Captions,
  Sparkles,
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
import { Progress } from '@/components/ui/progress'

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
  views: number
  shared: boolean
}

const mockRecordings: Recording[] = [
  { id: 'r1', title: 'Q4 Strategy Review', meetingId: 'm1', date: 'Jan 12, 2025', duration: '1h 02m', size: '234 MB', participants: 5, host: 'Sarah Chen', hasTranscript: true, hasAiSummary: true, views: 12, shared: true },
  { id: 'r2', title: 'Client Onboarding - Acme Corp', meetingId: 'm4', date: 'Jan 10, 2025', duration: '1h 28m', size: '312 MB', participants: 4, host: 'Emily Davis', hasTranscript: true, hasAiSummary: true, views: 8, shared: false },
  { id: 'r3', title: 'Product Design Review', meetingId: 'm2', date: 'Jan 9, 2025', duration: '47m', size: '156 MB', participants: 3, host: 'You', hasTranscript: true, hasAiSummary: false, views: 5, shared: false },
  { id: 'r4', title: 'Security Review Board', meetingId: 'm7', date: 'Jan 8, 2025', duration: '2h 05m', size: '445 MB', participants: 6, host: 'James Wilson', hasTranscript: false, hasAiSummary: true, views: 3, shared: true },
  { id: 'r5', title: 'Sprint 14 Planning', meetingId: 'm3', date: 'Jan 7, 2025', duration: '58m', size: '189 MB', participants: 8, host: 'Mike Johnson', hasTranscript: true, hasAiSummary: true, views: 15, shared: true },
  { id: 'r6', title: '1:1 with Manager', meetingId: 'm6', date: 'Jan 6, 2025', duration: '28m', size: '89 MB', participants: 2, host: 'Alex Turner', hasTranscript: false, hasAiSummary: false, views: 1, shared: false },
]

export default function RecordingsPage() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [playing, setPlaying] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const filtered = [...mockRecordings]
    .filter(r => r.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'date') return 0
      if (sortBy === 'duration') return a.duration.localeCompare(b.duration)
      if (sortBy === 'views') return b.views - a.views
      return 0
    })

  const totalSize = mockRecordings.reduce((acc, r) => {
    const match = r.size.match(/([\d.]+)\s*(MB|GB)/)
    if (!match) return acc
    return acc + parseFloat(match[1]) * (match[2] === 'GB' ? 1024 : 1)
  }, 0)

  return (
    <div className='space-y-6'>
      {/* Stats */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card><CardContent className='p-4 flex items-center gap-3'><div className='p-2 rounded-lg bg-red-500/10'><FileVideo className='h-5 w-5 text-red-600' /></div><div><p className='text-2xl font-bold'>{mockRecordings.length}</p><p className='text-xs text-muted-foreground'>Recordings</p></div></CardContent></Card>
        <Card><CardContent className='p-4 flex items-center gap-3'><div className='p-2 rounded-lg bg-blue-500/10'><Clock className='h-5 w-5 text-blue-600' /></div><div><p className='text-2xl font-bold'>7h 48m</p><p className='text-xs text-muted-foreground'>Total Duration</p></div></CardContent></Card>
        <Card><CardContent className='p-4 flex items-center gap-3'><div className='p-2 rounded-lg bg-violet-500/10'><HardDrive className='h-5 w-5 text-violet-600' /></div><div><p className='text-2xl font-bold'>{totalSize.toFixed(0)} MB</p><p className='text-xs text-muted-foreground'>Storage Used</p></div></CardContent></Card>
        <Card><CardContent className='p-4 flex items-center gap-3'><div className='p-2 rounded-lg bg-emerald-500/10'><Sparkles className='h-5 w-5 text-emerald-600' /></div><div><p className='text-2xl font-bold'>{mockRecordings.filter(r => r.hasAiSummary).length}</p><p className='text-xs text-muted-foreground'>AI Summarized</p></div></CardContent></Card>
      </div>

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

      {/* Recording cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
        {filtered.map(rec => (
          <Card key={rec.id} className='group hover:shadow-md transition-shadow overflow-hidden'>
            {/* Video preview area */}
            <div className='relative bg-gradient-to-br from-zinc-800 to-zinc-900 aspect-video flex items-center justify-center'>
              <Film className='h-12 w-12 text-zinc-600' />
              <Button
                size='icon'
                className='absolute inset-0 m-auto h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all opacity-0 group-hover:opacity-100'
                onClick={() => setPlaying(playing === rec.id ? null : rec.id)}
              >
                <Play className='h-6 w-6 text-white ml-0.5' />
              </Button>
              <Badge variant='secondary' className='absolute bottom-2 right-2 text-xs bg-black/50 text-white border-0'>
                {rec.duration}
              </Badge>
            </div>
            <CardContent className='p-4'>
              <div className='flex items-start justify-between gap-2 mb-2'>
                <div className='min-w-0'>
                  <h3 className='font-semibold text-sm truncate'>{rec.title}</h3>
                  <p className='text-xs text-muted-foreground mt-0.5'>{rec.date} · {rec.participants} participants</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon' className='h-8 w-8 shrink-0'><MoreVertical className='h-4 w-4' /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem className='gap-2'><Play className='h-4 w-4' /> Play</DropdownMenuItem>
                    <DropdownMenuItem className='gap-2'><Download className='h-4 w-4' /> Download</DropdownMenuItem>
                    <DropdownMenuItem className='gap-2'><Share2 className='h-4 w-4' /> Share</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className='gap-2 text-red-600'><Trash2 className='h-4 w-4' /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className='flex items-center gap-2 text-xs text-muted-foreground mb-3'>
                <span>Host: {rec.host}</span>
                <span>·</span>
                <span>{rec.size}</span>
                <span>·</span>
                <span>{rec.views} views</span>
              </div>
              <div className='flex items-center gap-2 flex-wrap'>
                {rec.hasTranscript && <Badge variant='outline' className='text-[10px] gap-1'><Captions className='h-3 w-3' /> Transcript</Badge>}
                {rec.hasAiSummary && <Badge variant='outline' className='text-[10px] gap-1'><Sparkles className='h-3 w-3' /> AI Summary</Badge>}
                {rec.shared && <Badge variant='outline' className='text-[10px]'>Shared</Badge>}
              </div>
              {playing === rec.id && (
                <div className='mt-3 space-y-1'>
                  <Progress value={progress} className='h-1.5' />
                  <p className='text-[11px] text-muted-foreground'>Playing... {rec.duration}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className='text-center py-16 text-muted-foreground'>
          <Film className='h-12 w-12 mx-auto mb-4 opacity-40' />
          <p className='font-medium'>No recordings found</p>
          <p className='text-sm'>Recordings from your meetings will appear here</p>
        </div>
      )}
    </div>
  )
}
