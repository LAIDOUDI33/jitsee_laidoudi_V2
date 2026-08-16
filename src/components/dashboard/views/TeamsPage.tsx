'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users,
  Plus,
  Crown,
  Shield,
  UserPlus,
  MessageSquare,
  Video,
  MoreVertical,
  Search,
  Settings2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'member' | 'viewer'
  avatar?: string
  status: 'online' | 'offline' | 'away'
}

interface Team {
  id: string
  name: string
  description: string
  members: TeamMember[]
  channels: number
  meetings: number
  color: string
  isOwner: boolean
}

const roleIcons: Record<string, React.ReactNode> = {
  admin: <Crown className='h-3 w-3 text-amber-500' />,
  member: <Shield className='h-3 w-3 text-blue-500' />,
  viewer: <Users className='h-3 w-3 text-muted-foreground' />,
}

const statusColors: Record<string, string> = {
  online: 'bg-green-500',
  away: 'bg-amber-500',
  offline: 'bg-zinc-400',
}

const mockTeams: Team[] = [
  {
    id: 't1', name: 'Engineering', description: 'Core platform engineering team', color: 'bg-blue-500',
    isOwner: true,
    members: [
      { id: 'u1', name: 'Sarah Chen', email: 'sarah@alvision.ai', role: 'admin', status: 'online' },
      { id: 'u2', name: 'Mike Johnson', email: 'mike@alvision.ai', role: 'member', status: 'online' },
      { id: 'u3', name: 'Emily Davis', email: 'emily@alvision.ai', role: 'member', status: 'away' },
      { id: 'u4', name: 'James Wilson', email: 'james@alvision.ai', role: 'viewer', status: 'offline' },
      { id: 'u5', name: 'Lisa Park', email: 'lisa@alvision.ai', role: 'member', status: 'online' },
    ],
    channels: 8, meetings: 24,
  },
  {
    id: 't2', name: 'Product', description: 'Product design and strategy', color: 'bg-violet-500',
    isOwner: false,
    members: [
      { id: 'u6', name: 'Alex Turner', email: 'alex@alvision.ai', role: 'admin', status: 'online' },
      { id: 'u7', name: 'Maria Garcia', email: 'maria@alvision.ai', role: 'member', status: 'offline' },
      { id: 'u8', name: 'David Kim', email: 'david@alvision.ai', role: 'member', status: 'online' },
    ],
    channels: 5, meetings: 18,
  },
  {
    id: 't3', name: 'Sales', description: 'Sales and customer success', color: 'bg-emerald-500',
    isOwner: false,
    members: [
      { id: 'u9', name: 'Tom Brown', email: 'tom@alvision.ai', role: 'admin', status: 'away' },
      { id: 'u10', name: 'Nina Patel', email: 'nina@alvision.ai', role: 'member', status: 'online' },
    ],
    channels: 3, meetings: 12,
  },
]

export default function TeamsPage() {
  const [search, setSearch] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const filtered = mockTeams.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='relative flex-1 max-w-md'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input placeholder='Search teams...' className='pl-9' value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className='gap-2'><Plus className='h-4 w-4' /> Create Team</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Team</DialogTitle></DialogHeader>
            <div className='space-y-4 pt-2'>
              <div className='space-y-2'>
                <Label>Team Name</Label>
                <Input placeholder='e.g. Marketing, DevOps' />
              </div>
              <div className='space-y-2'>
                <Label>Description</Label>
                <Textarea placeholder='What is this team about?' rows={3} />
              </div>
              <div className='flex justify-end gap-3 pt-2'>
                <Button variant='outline' onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={() => setCreateOpen(false)}>Create Team</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
        {filtered.map(team => (
          <Card
            key={team.id}
            className={`cursor-pointer hover:shadow-md transition-all ${selectedTeam?.id === team.id ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setSelectedTeam(team)}
          >
            <CardHeader className='pb-3'>
              <div className='flex items-start justify-between'>
                <div className='flex items-center gap-3'>
                  <div className={`w-10 h-10 rounded-lg ${team.color} flex items-center justify-center text-white font-bold text-sm`}>
                    {team.name[0]}
                  </div>
                  <div>
                    <CardTitle className='text-base'>{team.name}</CardTitle>
                    <CardDescription className='text-xs mt-0.5'>{team.description}</CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                    <Button variant='ghost' size='icon' className='h-8 w-8'><MoreVertical className='h-4 w-4' /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem className='gap-2'><Settings2 className='h-4 w-4' /> Settings</DropdownMenuItem>
                    <DropdownMenuItem className='gap-2'><UserPlus className='h-4 w-4' /> Invite Members</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className='pt-0'>
              <div className='flex items-center justify-between text-sm text-muted-foreground mb-3'>
                <span className='flex items-center gap-1.5'><MessageSquare className='h-3.5 w-3.5' />{team.channels} channels</span>
                <span className='flex items-center gap-1.5'><Video className='h-3.5 w-3.5' />{team.meetings} meetings</span>
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex -space-x-2'>
                  {team.members.slice(0, 4).map(m => (
                    <Avatar key={m.id} className='h-7 w-7 border-2 border-card'>
                      <AvatarFallback className='text-[10px] bg-muted'>{m.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                  ))}
                  {team.members.length > 4 && (
                    <div className='h-7 w-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-medium'>
                      +{team.members.length - 4}
                    </div>
                  )}
                </div>
                <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                  <div className='w-2 h-2 rounded-full bg-green-500' />
                  {team.members.filter(m => m.status === 'online').length} online
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Team detail panel */}
      {selectedTeam && (
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className={`w-10 h-10 rounded-lg ${selectedTeam.color} flex items-center justify-center text-white font-bold`}>{selectedTeam.name[0]}</div>
                <div>
                  <CardTitle>{selectedTeam.name}</CardTitle>
                  <CardDescription>{selectedTeam.members.length} members · {selectedTeam.channels} channels</CardDescription>
                </div>
              </div>
              <div className='flex gap-2'>
                <Button variant='outline' size='sm' className='gap-1.5'><MessageSquare className='h-3.5 w-3.5' /> Channels</Button>
                <Button size='sm' className='gap-1.5'><UserPlus className='h-3.5 w-3.5' /> Invite</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue='members'>
              <TabsList>
                <TabsTrigger value='members'>Members ({selectedTeam.members.length})</TabsTrigger>
                <TabsTrigger value='activity'>Activity</TabsTrigger>
              </TabsList>
              <TabsContent value='members' className='mt-4'>
                <div className='space-y-2 max-h-64 overflow-y-auto'>
                  {selectedTeam.members.map(m => (
                    <div key={m.id} className='flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors'>
                      <div className='relative'>
                        <Avatar className='h-9 w-9'>
                          <AvatarFallback className='text-xs bg-muted'>{m.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${statusColors[m.status]}`} />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium truncate'>{m.name}</p>
                        <p className='text-xs text-muted-foreground truncate'>{m.email}</p>
                      </div>
                      <div className='flex items-center gap-1.5'>
                        {roleIcons[m.role]}
                        <Badge variant='outline' className='text-[10px] capitalize'>{m.role}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value='activity' className='mt-4'>
                <div className='text-center py-8 text-muted-foreground'>
                  <p className='text-sm'>Team activity will appear here</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
