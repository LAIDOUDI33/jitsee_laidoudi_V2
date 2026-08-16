'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Mail,
  Shield,
  Ban,
  Edit,
  UserPlus,
  Download,
  Trash2,
  UserCog,
  UsersRound,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface UserRecord {
  id: string
  name: string
  email: string
  role: string
  org: string
  status: 'active' | 'inactive' | 'suspended'
  lastActive: string
  meetings: number
  storage: string
}

const mockUsers: UserRecord[] = [
  { id: 'u1', name: 'Sarah Chen', email: 'sarah@alvision.ai', role: 'superadmin', org: 'ALVISION', status: 'active', lastActive: '2 min ago', meetings: 142, storage: '2.3 GB' },
  { id: 'u2', name: 'Mike Johnson', email: 'mike@alvision.ai', role: 'teamadmin', org: 'ALVISION', status: 'active', lastActive: '1 hour ago', meetings: 98, storage: '1.8 GB' },
  { id: 'u3', name: 'Emily Davis', email: 'emily@techstart.com', role: 'orgadmin', org: 'TechStart Inc.', status: 'active', lastActive: '3 hours ago', meetings: 67, storage: '3.1 GB' },
  { id: 'u4', name: 'James Wilson', email: 'james@alvision.ai', role: 'host', org: 'ALVISION', status: 'active', lastActive: '5 hours ago', meetings: 45, storage: '890 MB' },
  { id: 'u5', name: 'Lisa Park', email: 'lisa@alvision.ai', role: 'participant', org: 'ALVISION', status: 'active', lastActive: '1 day ago', meetings: 32, storage: '456 MB' },
  { id: 'u6', name: 'Alex Turner', email: 'alex@alvision.ai', role: 'teamadmin', org: 'ALVISION', status: 'active', lastActive: '30 min ago', meetings: 87, storage: '1.2 GB' },
  { id: 'u7', name: 'Maria Garcia', email: 'maria@techstart.com', role: 'participant', org: 'TechStart Inc.', status: 'inactive', lastActive: '2 weeks ago', meetings: 12, storage: '234 MB' },
  { id: 'u8', name: 'David Kim', email: 'david@corp.com', role: 'host', org: 'Global Corp', status: 'suspended', lastActive: '1 month ago', meetings: 5, storage: '78 MB' },
]

const roleColors: Record<string, string> = {
  superadmin: 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-800/50',
  orgadmin: 'bg-violet-500/10 text-violet-600 border-violet-200 dark:border-violet-800/50',
  teamadmin: 'bg-cyan-500/10 text-cyan-600 border-cyan-200 dark:border-cyan-800/50',
  host: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800/50',
  participant: 'bg-zinc-500/10 text-zinc-500 border-zinc-200 dark:border-zinc-700/50',
  guest: 'bg-zinc-500/10 text-zinc-400 border-zinc-200 dark:border-zinc-700/50',
}

const roleAvatarRing: Record<string, string> = {
  superadmin: 'ring-2 ring-violet-500',
  orgadmin: 'ring-2 ring-blue-500',
  teamadmin: 'ring-2 ring-emerald-500',
  host: 'ring-2 ring-amber-500',
  participant: 'ring-2 ring-gray-400',
  guest: 'ring-2 ring-gray-300',
}

const roleIcons: Record<string, React.ReactNode> = {
  superadmin: <Shield className='h-3 w-3' />,
  orgadmin: <Shield className='h-3 w-3' />,
  teamadmin: <UserCog className='h-3 w-3' />,
  host: <CheckCircle2 className='h-3 w-3' />,
  participant: <UsersRound className='h-3 w-3' />,
  guest: <UsersRound className='h-3 w-3' />,
}

const statusConfig: Record<string, { color: string; dot: string; icon: React.ReactNode }> = {
  active: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800/50', dot: 'bg-emerald-500', icon: <CheckCircle2 className='h-3 w-3' /> },
  inactive: { color: 'bg-zinc-500/10 text-zinc-500 border-zinc-200 dark:border-zinc-700/50', dot: 'bg-zinc-400', icon: <Clock className='h-3 w-3' /> },
  suspended: { color: 'bg-red-500/10 text-red-500 border-red-200 dark:border-red-800/50', dot: 'bg-red-500', icon: <XCircle className='h-3 w-3' /> },
}

const roleCounts = { all: mockUsers.length, superadmin: mockUsers.filter(u => u.role === 'superadmin').length, orgadmin: mockUsers.filter(u => u.role === 'orgadmin').length, teamadmin: mockUsers.filter(u => u.role === 'teamadmin').length, host: mockUsers.filter(u => u.role === 'host').length, participant: mockUsers.filter(u => u.role === 'participant').length }
const statusCounts = { all: mockUsers.length, active: mockUsers.filter(u => u.status === 'active').length, inactive: mockUsers.filter(u => u.status === 'inactive').length, suspended: mockUsers.filter(u => u.status === 'suspended').length }

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } } }

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [userStatuses, setUserStatuses] = useState<Record<string, 'active' | 'suspended'>>(Object.fromEntries(mockUsers.map(u => [u.id, u.status === 'suspended' ? 'suspended' : 'active'])))

  const filtered = mockUsers.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    const matchStatus = statusFilter === 'all' || u.status === statusFilter
    return matchSearch && matchRole && matchStatus
  })

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(u => u.id)))
  }

  const toggleUserStatus = (id: string) => {
    setUserStatuses(prev => ({
      ...prev,
      [id]: prev[id] === 'active' ? 'suspended' : 'active',
    }))
    toast.success(`User ${userStatuses[id] === 'active' ? 'suspended' : 'reactivated'}`)
  }

  const handleBulkAction = (action: string) => {
    toast.info(`${action}: ${selected.size} users selected`)
    setSelected(new Set())
  }

  return (
    <motion.div className='space-y-6' variants={container} initial='hidden' animate='show'>
      {/* Gradient header section */}
      <motion.div variants={item} className='relative rounded-xl overflow-hidden bg-gradient-to-r from-primary/5 via-violet-500/5 to-primary/5 p-5 border border-primary/10'>
        <div className='absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-violet-500 to-primary' />
        <div className='flex items-center gap-3'>
          <div className='p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground'><Users className='h-5 w-5' /></div>
          <div>
            <h2 className='text-lg font-bold'>User Management</h2>
            <p className='text-sm text-muted-foreground'>Manage user accounts, roles, and permissions across your organization.</p>
          </div>
        </div>
      </motion.div>

      {/* Stats with trend indicators */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {[
          { label: 'Total Users', value: '1,247', change: '+12%', trend: 'up' as const, icon: <Users className='h-5 w-5' />, color: 'from-cyan-500/10 to-cyan-500/5 text-cyan-600' },
          { label: 'Active', value: '1,198', icon: <CheckCircle2 className='h-5 w-5' />, color: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600', change: '+5%', trend: 'up' as const },
          { label: 'Suspended', value: '12', icon: <Ban className='h-5 w-5' />, color: 'from-amber-500/10 to-amber-500/5 text-amber-600', change: '-3%', trend: 'down' as const },
          { label: 'Organizations', value: '23', icon: <Shield className='h-5 w-5' />, color: 'from-violet-500/10 to-violet-500/5 text-violet-600', change: '+3', trend: 'up' as const },
        ].map(s => (
          <motion.div key={s.label} variants={item}>
            <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5 border border-border/50 hover:border-primary/30 bg-gradient-to-br from-card to-card/80'>
              <CardContent className='p-4 flex items-center gap-3'>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${s.color}`}>{s.icon}</div>
                <div className='flex-1'>
                  <div className='flex items-baseline gap-2'>
                    <p className='text-2xl font-bold tracking-tight'>{s.value}</p>
                    {s.change && (
                      <span className={`text-xs font-semibold flex items-center gap-0.5 ${s.trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {s.trend === 'up' ? <TrendingUp className='h-3 w-3' /> : <TrendingDown className='h-3 w-3' />}{s.change}
                      </span>
                    )}
                  </div>
                  <p className='text-xs text-muted-foreground'>{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Bulk actions toolbar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -10, height: 0 }} className='overflow-hidden'>
            <Card className='border-primary/30 bg-primary/5'>
              <CardContent className='p-3 flex items-center gap-3 flex-wrap'>
                <span className='text-sm font-medium'>{selected.size} selected</span>
                <div className='flex gap-2'>
                  <Button variant='outline' size='sm' className='gap-1.5 text-xs hover:scale-[1.02] active:scale-[0.98] transition-all hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-amber-500/5 hover:border-amber-300 hover:text-amber-700' onClick={() => handleBulkAction('Suspend')}><Ban className='h-3 w-3' /> Suspend</Button>
                  <Button variant='outline' size='sm' className='gap-1.5 text-xs hover:scale-[1.02] active:scale-[0.98] transition-all hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-emerald-500/5 hover:border-emerald-300 hover:text-emerald-700' onClick={() => handleBulkAction('Reactivate')}><CheckCircle2 className='h-3 w-3' /> Reactivate</Button>
                  <Button variant='outline' size='sm' className='gap-1.5 text-xs hover:scale-[1.02] active:scale-[0.98] transition-all hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-cyan-500/5 hover:border-cyan-300 hover:text-cyan-700' onClick={() => handleBulkAction('Export')}><Download className='h-3 w-3' /> Export</Button>
                  <Button variant='outline' size='sm' className='gap-1.5 text-xs text-red-600 hover:text-red-700 hover:scale-[1.02] active:scale-[0.98] transition-all hover:bg-gradient-to-r hover:from-red-500/10 hover:to-red-500/5 hover:border-red-300' onClick={() => handleBulkAction('Delete')}><Trash2 className='h-3 w-3' /> Delete</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <motion.div variants={item} className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='flex items-center gap-2 flex-1 flex-wrap'>
          <div className='relative flex-1 min-w-[200px] max-w-xs'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input placeholder='Search users...' className='pl-9 h-9 focus:ring-2 focus:ring-primary/20' value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' className='gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-transform'><Download className='h-3.5 w-3.5' /> Export</Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button size='sm' className='gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-transform'><UserPlus className='h-3.5 w-3.5' /> Add User</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Create User</DialogTitle></DialogHeader><div className='space-y-4 pt-2'><div className='space-y-2'><Label>Name</Label><Input placeholder='Full name' /></div><div className='space-y-2'><Label>Email</Label><Input placeholder='user@company.com' type='email' /></div><div className='space-y-2'><Label>Role</Label><Select><SelectTrigger><SelectValue placeholder='Select role' /></SelectTrigger><SelectContent><SelectItem value='orgadmin'>Org Admin</SelectItem><SelectItem value='teamadmin'>Team Admin</SelectItem><SelectItem value='host'>Host</SelectItem><SelectItem value='participant'>Participant</SelectItem></SelectContent></Select></div><div className='space-y-2'><Label>Organization</Label><Input placeholder='Organization name' /></div><div className='flex justify-end gap-3 pt-2'><Button variant='outline' onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={() => { setCreateOpen(false); toast.success('User created') }}>Create</Button></div></div></DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Filter chips with counts and role icons */}
      <motion.div variants={item} className='flex flex-wrap gap-2'>
        <p className='text-xs text-muted-foreground self-center mr-1'>Role:</p>
        {Object.entries(roleCounts).map(([key, count]) => (
          <button key={key} onClick={() => setRoleFilter(key)} className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-200 hover:scale-[1.02] gap-1 inline-flex items-center ${roleFilter === key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/30 text-muted-foreground'}`}>
            {key !== 'all' && roleIcons[key]}{key === 'all' ? 'All' : key.charAt(0).toUpperCase() + key.slice(1)} ({count})
          </button>
        ))}
        <span className='text-border mx-1'>|</span>
        <p className='text-xs text-muted-foreground self-center mr-1'>Status:</p>
        {Object.entries(statusCounts).map(([key, count]) => (
          <button key={key} onClick={() => setStatusFilter(key)} className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-200 hover:scale-[1.02] inline-flex items-center gap-1 ${statusFilter === key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/30 text-muted-foreground'}`}>
            {key !== 'all' && <span className={`w-1.5 h-1.5 rounded-full ${key === 'active' ? 'bg-emerald-500' : key === 'inactive' ? 'bg-zinc-400' : 'bg-red-500'}`} />}{key === 'all' ? 'All' : key.charAt(0).toUpperCase() + key.slice(1)} ({count})
          </button>
        ))}
      </motion.div>

      {/* Users table */}
      <motion.div variants={item}>
        <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
          <Table>
            <TableHeader>
              <TableRow className='divide-y divide-border/50'>
                <TableHead className='w-10'><Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleSelectAll} /></TableHead>
                <TableHead>User</TableHead>
                <TableHead className='hidden md:table-cell'>Role</TableHead>
                <TableHead className='hidden lg:table-cell'>Organization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='hidden lg:table-cell'>Last Active</TableHead>
                <TableHead className='hidden xl:table-cell'>Meetings</TableHead>
                <TableHead className='w-10' />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(u => {
                const sc = statusConfig[userStatuses[u.id] || 'active']
                return (
                  <TableRow key={u.id} className='group even:bg-muted/30 hover:bg-muted/50 divide-y divide-border/50 transition-colors'>
                    <TableCell><Checkbox checked={selected.has(u.id)} onCheckedChange={() => toggleSelect(u.id)} /></TableCell>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <Avatar className={`h-9 w-9 ${roleAvatarRing[u.role] || ''}`}>
                          <AvatarFallback className='text-xs bg-gradient-to-br from-primary/10 to-primary/5 font-medium'>{u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className='min-w-0'>
                          <p className='font-medium text-sm truncate'>{u.name}</p>
                          <p className='text-xs text-muted-foreground truncate'>{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className='hidden md:table-cell'>
                      <Badge variant='outline' className={`text-[10px] capitalize gap-1 ${roleColors[u.role]}`}>{roleIcons[u.role]}{u.role}</Badge>
                    </TableCell>
                    <TableCell className='hidden lg:table-cell text-sm text-muted-foreground'>{u.org}</TableCell>
                    <TableCell>
                      <button onClick={() => toggleUserStatus(u.id)} className='group/badge'>
                        <Badge variant='outline' className={`text-[10px] capitalize gap-1 cursor-pointer hover:bg-muted/80 transition-colors ${sc.color}`}>{sc.icon}<span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${userStatuses[u.id] === 'active' ? 'animate-pulse' : ''}`} />{userStatuses[u.id]}</Badge>
                      </button>
                    </TableCell>
                    <TableCell className='hidden lg:table-cell text-xs text-muted-foreground flex items-center gap-1.5'><Clock className='h-3 w-3' />{u.lastActive}</TableCell>
                    <TableCell className='hidden xl:table-cell text-sm'>{u.meetings}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant='ghost' size='icon' className='h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-[1.1]'><MoreVertical className='h-4 w-4' /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem className='gap-2'><Edit className='h-4 w-4' /> Edit User</DropdownMenuItem>
                          <DropdownMenuItem className='gap-2'><Mail className='h-4 w-4' /> Send Email</DropdownMenuItem>
                          <DropdownMenuItem className='gap-2'><Shield className='h-4 w-4' /> Change Role</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className='gap-2 text-red-600'><Ban className='h-4 w-4' /> Suspend</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className='text-center py-16'>
              <Users className='h-16 w-16 mx-auto mb-4 opacity-20 text-muted-foreground' />
              <p className='font-medium text-muted-foreground'>No users found</p>
              <p className='text-sm text-muted-foreground/60 mt-1'>Try adjusting your search or filters</p>
              <Button variant='outline' size='sm' className='mt-4 gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={() => { setSearch(''); setRoleFilter('all'); setStatusFilter('all') }}>Clear Filters</Button>
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  )
}