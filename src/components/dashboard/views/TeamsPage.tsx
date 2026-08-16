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
import { toast } from 'sonner'
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
  TrendingUp,
  Activity,
  Sparkles,
  Hash,
  Zap,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { motion, AnimatePresence } from 'framer-motion'

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
  member: <Shield className='h-3 w-3 text-sky-500' />,
  viewer: <Users className='h-3 w-3 text-muted-foreground' />,
}

const statusColors: Record<string, string> = {
  online: 'bg-emerald-500',
  away: 'bg-amber-500',
  offline: 'bg-zinc-400',
}

const statusLabels: Record<string, string> = {
  online: 'Online',
  away: 'Away',
  offline: 'Offline',
}

const gradientMap: Record<string, string> = {
  'bg-blue-500': 'from-blue-500/20 to-blue-600/5',
  'bg-violet-500': 'from-violet-500/20 to-violet-600/5',
  'bg-emerald-500': 'from-emerald-500/20 to-emerald-600/5',
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

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function TeamsPage() {
  const [search, setSearch] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [newTeam, setNewTeam] = useState({ name: '', description: '' })

  const filtered = mockTeams.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreateTeam = () => {
    if (!newTeam.name.trim()) return
    toast.success(`Team "${newTeam.name}" created successfully!`)
    setCreateOpen(false)
    setNewTeam({ name: '', description: '' })
  }

  const totalMembers = mockTeams.reduce((a, t) => a + t.members.length, 0)
  const totalOnline = mockTeams.reduce((a, t) => a + t.members.filter(m => m.status === 'online').length, 0)

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='relative'>
        <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4'>
          <div>
            <h2 className='text-3xl font-bold tracking-tight'>Teams</h2>
            <p className='text-muted-foreground text-sm mt-1'>Manage your organization teams, members, and collaborations</p>
            <div className='h-1 w-12 rounded-full bg-gradient-to-r from-primary to-primary/50 mt-2' />
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className='gap-2 bg-gradient-to-r from-primary to-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-transform'><Plus className='h-4 w-4' /> Create Team</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <div className='flex items-center gap-3 mb-2'>
                  <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center'>
                    <Sparkles className='h-5 w-5 text-primary-foreground' />
                  </div>
                  <div>
                    <DialogTitle>Create New Team</DialogTitle>
                    <p className='text-sm text-muted-foreground mt-0.5'>Set up a new team for your organization</p>
                  </div>
                </div>
              </DialogHeader>
              <div className='space-y-4 pt-2'>
                <div className='space-y-2'>
                  <Label>Team Name</Label>
                  <Input placeholder='e.g. Marketing, DevOps' value={newTeam.name} onChange={e => setNewTeam(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className='space-y-2'>
                  <Label>Description</Label>
                  <Textarea placeholder='What is this team about?' rows={3} value={newTeam.description} onChange={e => setNewTeam(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div className='flex justify-end gap-3 pt-2'>
                  <Button variant='outline' onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateTeam} disabled={!newTeam.name.trim()} className='bg-gradient-to-r from-primary to-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-transform'>Create Team</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-3 gap-4'>
        <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80'>
          <CardContent className='p-4 flex items-center gap-3'>
            <div className='p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5'><Users className='h-5 w-5 text-primary' /></div>
            <div>
              <p className='text-2xl font-bold'>{mockTeams.length}</p>
              <p className='text-xs text-muted-foreground'>Total Teams</p>
            </div>
          </CardContent>
        </Card>
        <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80'>
          <CardContent className='p-4 flex items-center gap-3'>
            <div className='p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5'><Activity className='h-5 w-5 text-emerald-600' /></div>
            <div>
              <div className='flex items-center gap-2'>
                <p className='text-2xl font-bold'>{totalOnline}</p>
                <span className='text-[10px] font-medium text-emerald-600 flex items-center gap-0.5'><TrendingUp className='h-2.5 w-2.5' />Online</span>
              </div>
              <p className='text-xs text-muted-foreground'>{totalMembers} total members</p>
            </div>
          </CardContent>
        </Card>
        <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80'>
          <CardContent className='p-4 flex items-center gap-3'>
            <div className='p-2.5 rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-500/5'><Video className='h-5 w-5 text-violet-600' /></div>
            <div>
              <p className='text-2xl font-bold'>{mockTeams.reduce((a, t) => a + t.meetings, 0)}</p>
              <p className='text-xs text-muted-foreground'>Team Meetings</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className='relative max-w-md'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
        <Input placeholder='Search teams...' className='pl-9' value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Team grid */}
      <motion.div variants={container} initial='hidden' animate='show' className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
        {filtered.map(team => {
          const onlineCount = team.members.filter(m => m.status === 'online').length
          const activeMeetings = Math.floor(Math.random() * 4)
          return (
            <motion.div key={team.id} variants={item}>
              <Card
                className={`cursor-pointer border border-border/50 hover:border-primary/30 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 overflow-hidden ${selectedTeam?.id === team.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedTeam(team)}
              >
                {/* Gradient header banner */}
                <div className={`h-12 bg-gradient-to-r ${team.color.replace('bg-', 'from-').replace('-500', '-500/15')} to-transparent`} />
                <CardHeader className='pb-3'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-center gap-3'>
                      <div className={`w-11 h-11 rounded-xl ${team.color} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
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
                    <span className='flex items-center gap-1.5 text-xs'><MessageSquare className='h-3.5 w-3.5' />{team.channels} channels</span>
                    <span className='flex items-center gap-1.5 text-xs'><Video className='h-3.5 w-3.5' />{team.meetings} meetings</span>
                    {activeMeetings > 0 && (
                      <Badge variant='outline' className='text-[10px] gap-1 text-emerald-600 border-emerald-200 dark:border-emerald-800 bg-emerald-500/5'>
                        <span className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse' />
                        {activeMeetings} active
                      </Badge>
                    )}
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='flex -space-x-2'>
                      {team.members.slice(0, 4).map(m => (
                        <div key={m.id} className='relative'>
                          <Avatar className='h-7 w-7 border-2 border-card'>
                            <AvatarFallback className='text-[10px] bg-muted'>{m.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${statusColors[m.status]}`} />
                        </div>
                      ))}
                      {team.members.length > 4 && (
                        <div className='h-7 w-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-medium'>
                          +{team.members.length - 4}
                        </div>
                      )}
                    </div>
                    <div className='flex items-center gap-3 text-xs text-muted-foreground'>
                      <Badge variant='secondary' className='text-[10px] gap-1'><Users className='h-3 w-3' />{team.members.length}</Badge>
                      <div className='flex items-center gap-1'>
                        <div className='w-2 h-2 rounded-full bg-emerald-500' />
                        {onlineCount} online
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {filtered.length === 0 && (
        <div className='flex flex-col items-center justify-center py-16'>
          <div className='relative'>
            <Users className='h-16 w-16 text-muted-foreground/20' />
            <div className='absolute inset-0 flex items-center justify-center'>
              <Users className='h-8 w-8 text-muted-foreground/40' />
            </div>
          </div>
          <p className='font-medium mt-4'>No teams found</p>
          <p className='text-sm text-muted-foreground mt-1'>Create a team to start collaborating</p>
          <Button variant='outline' className='mt-4 gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={() => setCreateOpen(true)}>
            <Plus className='h-4 w-4' /> Create Team
          </Button>
        </div>
      )}

      {/* Team detail panel */}
      <AnimatePresence>
        {selectedTeam && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.3 }}>
            <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className={`w-10 h-10 rounded-xl ${selectedTeam.color} flex items-center justify-center text-white font-bold`}>{selectedTeam.name[0]}</div>
                    <div>
                      <CardTitle>{selectedTeam.name}</CardTitle>
                      <CardDescription>{selectedTeam.members.length} members · {selectedTeam.channels} channels</CardDescription>
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    <Button variant='outline' size='sm' className='gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-transform'><Hash className='h-3.5 w-3.5' /> Channels</Button>
                    <Button size='sm' className='gap-1.5 bg-gradient-to-r from-primary to-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-transform'><UserPlus className='h-3.5 w-3.5' /> Invite</Button>
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
                    <div className='space-y-1 max-h-64 overflow-y-auto divide-y divide-border/50'>
                      {selectedTeam.members.map(m => (
                        <div key={m.id} className='flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors even:bg-muted/30'>
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
                          <div className='flex items-center gap-2'>
                            <Badge variant='outline' className={`text-[10px] gap-1 ${m.status === 'online' ? 'border-emerald-200 dark:border-emerald-800 text-emerald-600 bg-emerald-500/5' : m.status === 'away' ? 'border-amber-200 dark:border-amber-800 text-amber-600 bg-amber-500/5' : ''}`}>
                              {m.status === 'online' && <span className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse' />}
                              {statusLabels[m.status]}
                            </Badge>
                            <div className='flex items-center gap-1.5'>
                              {roleIcons[m.role]}
                              <Badge variant='outline' className='text-[10px] capitalize'>{m.role}</Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value='activity' className='mt-4'>
                    <div className='flex flex-col items-center justify-center py-12'>
                      <div className='relative'>
                        <Zap className='h-16 w-16 text-muted-foreground/20' />
                        <div className='absolute inset-0 flex items-center justify-center'>
                          <Zap className='h-8 w-8 text-muted-foreground/40' />
                        </div>
                      </div>
                      <p className='font-medium mt-4'>Team activity will appear here</p>
                      <p className='text-sm text-muted-foreground mt-1'>Messages, file shares, and meeting activity</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
