'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Video,
  Plus,
  Clock,
  Users,
  CalendarDays,
  Search,
  MoreVertical,
  ExternalLink,
  Copy,
  VideoOff,
  MonitorPlay,
  Repeat,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Meeting {
  id: string
  title: string
  status: 'upcoming' | 'active' | 'ended' | 'scheduled' | 'recurring'
  type: 'instant' | 'scheduled' | 'recurring' | 'personal'
  date: string
  time: string
  duration: string
  participants: number
  maxParticipants: number
  roomId: string
  description?: string
  host: string
}

const mockMeetings: Meeting[] = [
  { id: 'm1', title: 'Q4 Strategy Review', status: 'upcoming', type: 'scheduled', date: '2025-01-15', time: '10:00 AM', duration: '1h', participants: 5, maxParticipants: 10, roomId: 'alv-q4-strategy', host: 'Sarah Chen', description: 'Quarterly strategy alignment meeting' },
  { id: 'm2', title: 'Product Design Sprint', status: 'active', type: 'instant', date: '2025-01-14', time: '2:30 PM', duration: '45m', participants: 3, maxParticipants: 8, roomId: 'alv-design-sprint', host: 'You' },
  { id: 'm3', title: 'Engineering Standup', status: 'scheduled', type: 'recurring', date: '2025-01-15', time: '9:00 AM', duration: '15m', participants: 7, maxParticipants: 15, roomId: 'alv-standup', host: 'Mike Johnson' },
  { id: 'm4', title: 'Client Onboarding - Acme Corp', status: 'upcoming', type: 'scheduled', date: '2025-01-16', time: '11:00 AM', duration: '1h 30m', participants: 2, maxParticipants: 6, roomId: 'alv-acme-onboard', host: 'Emily Davis' },
  { id: 'm5', title: 'Weekly Team Sync', status: 'scheduled', type: 'recurring', date: '2025-01-13', time: '3:00 PM', duration: '30m', participants: 9, maxParticipants: 20, roomId: 'alv-team-sync', host: 'Sarah Chen' },
  { id: 'm6', title: '1:1 with Manager', status: 'upcoming', type: 'scheduled', date: '2025-01-14', time: '4:00 PM', duration: '30m', participants: 1, maxParticipants: 2, roomId: 'alv-1on1', host: 'Alex Turner' },
  { id: 'm7', title: 'Security Review Board', status: 'ended', type: 'scheduled', date: '2025-01-12', time: '10:00 AM', duration: '2h', participants: 6, maxParticipants: 8, roomId: 'alv-sec-review', host: 'James Wilson' },
  { id: 'm8', title: 'Marketing Campaign Planning', status: 'ended', type: 'scheduled', date: '2025-01-11', time: '1:00 PM', duration: '1h', participants: 4, maxParticipants: 10, roomId: 'alv-mktg-plan', host: 'Lisa Park' },
]

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-600 border-green-200 dark:border-green-800',
  upcoming: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800',
  scheduled: 'bg-violet-500/10 text-violet-600 border-violet-200 dark:border-violet-800',
  ended: 'bg-zinc-500/10 text-zinc-500 border-zinc-200 dark:border-zinc-800',
  recurring: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800',
}

const typeIcons: Record<string, React.ReactNode> = {
  instant: <Video className='h-3.5 w-3.5' />,
  scheduled: <CalendarDays className='h-3.5 w-3.5' />,
  recurring: <Repeat className='h-3.5 w-3.5' />,
  personal: <MonitorPlay className='h-3.5 w-3.5' />,
}

export default function MeetingsPage() {
  const { setCurrentMeetingId, setMeetingTitle, setCurrentView } = useAppStore()
  const [search, setSearch] = useState('')
  const [meetings, setMeetings] = useState<Meeting[]>(mockMeetings)
  const [createOpen, setCreateOpen] = useState(false)
  const [newMeeting, setNewMeeting] = useState({ title: '', date: '', time: '', duration: '30m', type: 'scheduled', description: '' })

  const filtered = meetings.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.host.toLowerCase().includes(search.toLowerCase())
  )

  const upcoming = filtered.filter(m => ['upcoming', 'active', 'scheduled', 'recurring'].includes(m.status))
  const past = filtered.filter(m => m.status === 'ended')

  const handleJoin = (m: Meeting) => {
    setCurrentMeetingId(m.id)
    setMeetingTitle(m.title)
    setCurrentView('meeting-room')
  }

  const handleCreate = async () => {
    const roomId = `alv-${newMeeting.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`
    try {
      const res = await fetch('/api/v1/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newMeeting.title, type: newMeeting.type, scheduledAt: newMeeting.date ? `${newMeeting.date}T${newMeeting.time || '09:00'}:00Z` : null }),
      })
      const data = await res.json()
      const created: Meeting = {
        id: data.meeting?.id || `m-${Date.now()}`,
        title: newMeeting.title,
        status: 'upcoming',
        type: newMeeting.type as Meeting['type'],
        date: newMeeting.date || new Date().toISOString().split('T')[0],
        time: newMeeting.time || '9:00 AM',
        duration: newMeeting.duration,
        participants: 0, maxParticipants: 10,
        roomId: data.meeting?.roomId || roomId,
        host: useAppStore.getState().user?.name || 'You',
        description: newMeeting.description || undefined,
      }
      setMeetings([created, ...meetings])
      setCreateOpen(false)
      setNewMeeting({ title: '', date: '', time: '', duration: '30m', type: 'scheduled', description: '' })
    } catch {
      const created: Meeting = {
        id: `m-${Date.now()}`,
        title: newMeeting.title,
        status: 'upcoming',
        type: newMeeting.type as Meeting['type'],
        date: newMeeting.date || new Date().toISOString().split('T')[0],
        time: newMeeting.time || '9:00 AM',
        duration: newMeeting.duration,
        participants: 0, maxParticipants: 10,
        roomId,
        host: useAppStore.getState().user?.name || 'You',
        description: newMeeting.description || undefined,
      }
      setMeetings([created, ...meetings])
      setCreateOpen(false)
      setNewMeeting({ title: '', date: '', time: '', duration: '30m', type: 'scheduled', description: '' })
    }
  }

  const MeetingCard = ({ m }: { m: Meeting }) => (
    <Card className='group hover:shadow-md transition-shadow'>
      <CardContent className='p-4'>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 mb-1.5'>
              <span className='text-muted-foreground'>{typeIcons[m.type]}</span>
              <h3 className='font-semibold text-sm truncate'>{m.title}</h3>
            </div>
            <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
              <span className='flex items-center gap-1'><CalendarDays className='h-3 w-3' />{m.date}</span>
              <span className='flex items-center gap-1'><Clock className='h-3 w-3' />{m.time}</span>
              <span className='flex items-center gap-1'><Users className='h-3 w-3' />{m.participants}/{m.maxParticipants}</span>
            </div>
            {m.description && <p className='text-xs text-muted-foreground mt-1.5 line-clamp-1'>{m.description}</p>}
            <p className='text-xs text-muted-foreground mt-1'>Hosted by {m.host}</p>
          </div>
          <div className='flex items-center gap-2 shrink-0'>
            <Badge variant='outline' className={statusColors[m.status]}>{m.status}</Badge>
            {m.status === 'active' ? (
              <Button size='sm' className='gap-1.5' onClick={() => handleJoin(m)}>
                <Video className='h-3.5 w-3.5' /> Join
              </Button>
            ) : m.status !== 'ended' ? (
              <Button size='sm' variant='outline' className='gap-1.5' onClick={() => handleJoin(m)}>
                <ExternalLink className='h-3.5 w-3.5' /> Open
              </Button>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon' className='h-8 w-8'>
                  <MoreVertical className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem className='gap-2'><Copy className='h-4 w-4' /> Copy Room Link</DropdownMenuItem>
                <DropdownMenuItem className='gap-2' onClick={() => handleJoin(m)}><Video className='h-4 w-4' /> {m.status === 'active' ? 'Join Now' : 'Start Early'}</DropdownMenuItem>
                {m.status !== 'ended' && <DropdownMenuSeparator />}
                {m.status !== 'ended' && <DropdownMenuItem className='gap-2 text-red-600'><VideoOff className='h-4 w-4' /> Cancel Meeting</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className='space-y-6'>
      {/* Header actions */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='relative flex-1 max-w-md'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input placeholder='Search meetings...' className='pl-9' value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className='gap-2'><Plus className='h-4 w-4' /> New Meeting</Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle>Schedule a Meeting</DialogTitle>
            </DialogHeader>
            <div className='space-y-4 pt-2'>
              <div className='space-y-2'>
                <Label>Meeting Title</Label>
                <Input placeholder='Enter meeting title' value={newMeeting.title} onChange={e => setNewMeeting(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Date</Label>
                  <Input type='date' value={newMeeting.date} onChange={e => setNewMeeting(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div className='space-y-2'>
                  <Label>Time</Label>
                  <Input type='time' value={newMeeting.time} onChange={e => setNewMeeting(p => ({ ...p, time: e.target.value }))} />
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Duration</Label>
                  <Select value={newMeeting.duration} onValueChange={v => setNewMeeting(p => ({ ...p, duration: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value='15m'>15 minutes</SelectItem>
                      <SelectItem value='30m'>30 minutes</SelectItem>
                      <SelectItem value='45m'>45 minutes</SelectItem>
                      <SelectItem value='1h'>1 hour</SelectItem>
                      <SelectItem value='1h30m'>1.5 hours</SelectItem>
                      <SelectItem value='2h'>2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label>Type</Label>
                  <Select value={newMeeting.type} onValueChange={v => setNewMeeting(p => ({ ...p, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value='scheduled'>Scheduled</SelectItem>
                      <SelectItem value='recurring'>Recurring</SelectItem>
                      <SelectItem value='instant'>Instant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className='space-y-2'>
                <Label>Description (optional)</Label>
                <Textarea placeholder='Meeting agenda or notes...' rows={3} value={newMeeting.description} onChange={e => setNewMeeting(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className='flex justify-end gap-3 pt-2'>
                <Button variant='outline' onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!newMeeting.title}>Create Meeting</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats row */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card><CardContent className='p-4 flex items-center gap-3'><div className='p-2 rounded-lg bg-green-500/10'><Video className='h-5 w-5 text-green-600' /></div><div><p className='text-2xl font-bold'>1</p><p className='text-xs text-muted-foreground'>Active Now</p></div></CardContent></Card>
        <Card><CardContent className='p-4 flex items-center gap-3'><div className='p-2 rounded-lg bg-blue-500/10'><CalendarDays className='h-5 w-5 text-blue-600' /></div><div><p className='text-2xl font-bold'>3</p><p className='text-xs text-muted-foreground'>Upcoming</p></div></CardContent></Card>
        <Card><CardContent className='p-4 flex items-center gap-3'><div className='p-2 rounded-lg bg-violet-500/10'><Repeat className='h-5 w-5 text-violet-600' /></div><div><p className='text-2xl font-bold'>2</p><p className='text-xs text-muted-foreground'>Recurring</p></div></CardContent></Card>
        <Card><CardContent className='p-4 flex items-center gap-3'><div className='p-2 rounded-lg bg-zinc-500/10'><VideoOff className='h-5 w-5 text-zinc-500' /></div><div><p className='text-2xl font-bold'>2</p><p className='text-xs text-muted-foreground'>Ended</p></div></CardContent></Card>
      </div>

      {/* Meeting lists */}
      <Tabs defaultValue='upcoming'>
        <TabsList>
          <TabsTrigger value='upcoming'>Upcoming & Active ({upcoming.length})</TabsTrigger>
          <TabsTrigger value='past'>Past ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value='upcoming' className='mt-4'>
          <div className='space-y-3 max-h-[calc(100vh-380px)] overflow-y-auto pr-1'>
            {upcoming.map(m => <MeetingCard key={m.id} m={m} />)}
            {upcoming.length === 0 && (
              <div className='text-center py-12 text-muted-foreground'>
                <Video className='h-10 w-10 mx-auto mb-3 opacity-40' />
                <p className='font-medium'>No upcoming meetings</p>
                <p className='text-sm'>Schedule a new meeting to get started</p>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value='past' className='mt-4'>
          <div className='space-y-3 max-h-[calc(100vh-380px)] overflow-y-auto pr-1'>
            {past.map(m => <MeetingCard key={m.id} m={m} />)}
            {past.length === 0 && (
              <div className='text-center py-12 text-muted-foreground'>
                <VideoOff className='h-10 w-10 mx-auto mb-3 opacity-40' />
                <p className='font-medium'>No past meetings</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
