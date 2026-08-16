'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  CalendarHeart,
  Plus,
  Search,
  Clock,
  Users,
  Video,
  Globe,
  ExternalLink,
  Star,
  Radio,
  Presentation,
} from 'lucide-react'

interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  duration: string
  type: 'webinar' | 'townhall' | 'livestream' | 'workshop'
  status: 'upcoming' | 'live' | 'ended' | 'draft'
  host: string
  hostRole: string
  registrants: number
  maxRegistrants: number
  isPublic: boolean
  featured: boolean
  tags: string[]
}

const typeIcons: Record<string, React.ReactNode> = {
  webinar: <Presentation className='h-4 w-4' />,
  townhall: <Users className='h-4 w-4' />,
  livestream: <Radio className='h-4 w-4' />,
  workshop: <Video className='h-4 w-4' />,
}

const statusColors: Record<string, string> = {
  live: 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-800',
  upcoming: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800',
  ended: 'bg-zinc-500/10 text-zinc-500 border-zinc-200 dark:border-zinc-800',
  draft: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800',
}

const mockEvents: Event[] = [
  { id: 'e1', title: 'ALVISION Platform 2.0 Launch', description: 'Join us for the official launch of ALVISION 2.0 with AI-powered meeting summaries, real-time transcription, and more.', date: 'Jan 20, 2025', time: '2:00 PM EST', duration: '1h 30m', type: 'webinar', status: 'upcoming', host: 'Sarah Chen', hostRole: 'CEO', registrants: 342, maxRegistrants: 500, isPublic: true, featured: true, tags: ['product', 'launch', 'ai'] },
  { id: 'e2', title: 'Monthly Town Hall', description: 'Company-wide update with Q&A session covering roadmap, metrics, and team highlights.', date: 'Jan 25, 2025', time: '11:00 AM EST', duration: '1h', type: 'townhall', status: 'upcoming', host: 'Alex Turner', hostRole: 'VP of Product', registrants: 189, maxRegistrants: 300, isPublic: false, featured: false, tags: ['company', 'updates'] },
  { id: 'e3', title: 'AI in Enterprise Communication', description: 'Expert panel discussion on the future of AI in workplace communication and collaboration.', date: 'Jan 18, 2025', time: '3:00 PM EST', duration: '2h', type: 'webinar', status: 'live', host: 'Mike Johnson', hostRole: 'CTO', registrants: 567, maxRegistrants: 1000, isPublic: true, featured: true, tags: ['ai', 'enterprise', 'panel'] },
  { id: 'e4', title: 'Video Meeting Best Practices Workshop', description: 'Hands-on workshop for running effective and engaging video meetings.', date: 'Jan 30, 2025', time: '10:00 AM EST', duration: '3h', type: 'workshop', status: 'upcoming', host: 'Emily Davis', hostRole: 'Head of CX', registrants: 78, maxRegistrants: 50, isPublic: true, featured: false, tags: ['workshop', 'best-practices'] },
  { id: 'e5', title: 'Year in Review 2024', description: 'Recap of 2024 achievements, milestones, and a look ahead at 2025 plans.', date: 'Dec 28, 2024', time: '2:00 PM EST', duration: '1h', type: 'townhall', status: 'ended', host: 'Sarah Chen', hostRole: 'CEO', registrants: 412, maxRegistrants: 500, isPublic: true, featured: false, tags: ['review', '2024'] },
]

export default function EventsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)

  const filtered = mockEvents.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.tags.some(t => t.includes(search.toLowerCase()))
    const matchesFilter = filter === 'all' || e.type === filter || e.status === filter
    return matchesSearch && matchesFilter
  })

  const featuredEvent = mockEvents.find(e => e.featured && (e.status === 'upcoming' || e.status === 'live'))

  return (
    <div className='space-y-6'>
      {/* Featured event */}
      {featuredEvent && (
        <Card className='bg-gradient-to-br from-blue-500/5 via-violet-500/5 to-pink-500/5 border-blue-200/50 dark:border-blue-800/30 overflow-hidden'>
          <CardContent className='p-6 lg:p-8'>
            <div className='flex flex-col lg:flex-row gap-6 items-start'>
              <div className='flex-1'>
                <div className='flex items-center gap-2 mb-3'>
                  <Badge variant='outline' className='gap-1'><Star className='h-3 w-3 text-amber-500' /> Featured</Badge>
                  <Badge className={statusColors[featuredEvent.status]}>Live Now</Badge>
                </div>
                <h2 className='text-2xl font-bold mb-2'>{featuredEvent.title}</h2>
                <p className='text-muted-foreground mb-4 max-w-xl'>{featuredEvent.description}</p>
                <div className='flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-5'>
                  <span className='flex items-center gap-1.5'><Clock className='h-4 w-4' />{featuredEvent.date} · {featuredEvent.time}</span>
                  <span className='flex items-center gap-1.5'><Users className='h-4 w-4' />{featuredEvent.registrants} registered</span>
                  <span className='flex items-center gap-1.5'><Globe className='h-4 w-4' />Public</span>
                </div>
                <div className='flex gap-3'>
                  <Button className='gap-2'><Video className='h-4 w-4' /> Join Live</Button>
                  <Button variant='outline' className='gap-2'><ExternalLink className='h-4 w-4' /> Details</Button>
                </div>
              </div>
              <div className='hidden lg:block w-48 h-32 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center'>
                <Radio className='h-12 w-12 text-primary/40' />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Toolbar */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='flex items-center gap-2 flex-1'>
          <div className='relative flex-1 max-w-xs'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input placeholder='Search events...' className='pl-9 h-9' value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className='w-[130px] h-9'><SelectValue placeholder='Filter' /></SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Events</SelectItem>
              <SelectItem value='webinar'>Webinars</SelectItem>
              <SelectItem value='townhall'>Town Halls</SelectItem>
              <SelectItem value='workshop'>Workshops</SelectItem>
              <SelectItem value='livestream'>Live Streams</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className='gap-2'><Plus className='h-4 w-4' /> Create Event</Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-lg'>
            <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
            <div className='space-y-4 pt-2'>
              <div className='space-y-2'><Label>Title</Label><Input placeholder='Event title' /></div>
              <div className='space-y-2'><Label>Description</Label><Textarea rows={3} placeholder='Describe your event...' /></div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Type</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder='Select type' /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value='webinar'>Webinar</SelectItem>
                      <SelectItem value='townhall'>Town Hall</SelectItem>
                      <SelectItem value='workshop'>Workshop</SelectItem>
                      <SelectItem value='livestream'>Live Stream</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'><Label>Date & Time</Label><Input type='datetime-local' /></div>
              </div>
              <div className='flex justify-end gap-3 pt-2'>
                <Button variant='outline' onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={() => setCreateOpen(false)}>Create Event</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Event grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
        {filtered.map(event => (
          <Card key={event.id} className='group hover:shadow-md transition-shadow'>
            <CardContent className='p-5'>
              <div className='flex items-start justify-between mb-3'>
                <Badge variant='outline' className={statusColors[event.status]}>{event.status}</Badge>
                <div className='flex items-center gap-1 text-xs text-muted-foreground'>{typeIcons[event.type]}<span className='capitalize'>{event.type}</span></div>
              </div>
              <h3 className='font-semibold mb-1.5 group-hover:text-primary transition-colors'>{event.title}</h3>
              <p className='text-sm text-muted-foreground line-clamp-2 mb-3'>{event.description}</p>
              <div className='flex flex-col gap-1.5 text-xs text-muted-foreground mb-3'>
                <span className='flex items-center gap-1.5'><Clock className='h-3.5 w-3.5' />{event.date} · {event.time} · {event.duration}</span>
                <span className='flex items-center gap-1.5'><Users className='h-3.5 w-3.5' />{event.registrants}/{event.maxRegistrants} registered</span>
                <span className='flex items-center gap-1.5'><Globe className='h-3.5 w-3.5' />{event.isPublic ? 'Public' : 'Internal'}</span>
              </div>
              <div className='flex flex-wrap gap-1.5 mb-4'>{event.tags.map(t => <Badge key={t} variant='secondary' className='text-[10px]'>{t}</Badge>)}</div>
              <div className='flex items-center justify-between pt-3 border-t'>
                <div className='flex items-center gap-2'>
                  <Avatar className='h-6 w-6'><AvatarFallback className='text-[9px] bg-muted'>{event.host.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                  <div><p className='text-xs font-medium'>{event.host}</p><p className='text-[10px] text-muted-foreground'>{event.hostRole}</p></div>
                </div>
                <Button size='sm' variant={event.status === 'live' ? 'default' : 'outline'} className='gap-1.5'>
                  {event.status === 'live' ? <><Video className='h-3.5 w-3.5' /> Join</> : <><ExternalLink className='h-3.5 w-3.5' /> View</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className='text-center py-16 text-muted-foreground'><CalendarHeart className='h-12 w-12 mx-auto mb-4 opacity-40' /><p className='font-medium'>No events found</p></div>
      )}
    </div>
  )
}
