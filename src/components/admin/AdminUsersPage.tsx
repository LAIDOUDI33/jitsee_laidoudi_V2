'use client'

import { useState } from 'react'
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
  Filter,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface UserRecord {
  id: string
  name: string
  email: string
  role: string
  org: string
  status: 'active' | 'inactive' | 'suspended'
  lastLogin: string
  meetings: number
  storage: string
}

const mockUsers: UserRecord[] = [
  { id: 'u1', name: 'Sarah Chen', email: 'sarah@alvision.ai', role: 'superadmin', org: 'ALVISION', status: 'active', lastLogin: '2 min ago', meetings: 142, storage: '2.3 GB' },
  { id: 'u2', name: 'Mike Johnson', email: 'mike@alvision.ai', role: 'teamadmin', org: 'ALVISION', status: 'active', lastLogin: '1 hour ago', meetings: 98, storage: '1.8 GB' },
  { id: 'u3', name: 'Emily Davis', email: 'emily@techstart.com', role: 'orgadmin', org: 'TechStart Inc.', status: 'active', lastLogin: '3 hours ago', meetings: 67, storage: '3.1 GB' },
  { id: 'u4', name: 'James Wilson', email: 'james@alvision.ai', role: 'host', org: 'ALVISION', status: 'active', lastLogin: '5 hours ago', meetings: 45, storage: '890 MB' },
  { id: 'u5', name: 'Lisa Park', email: 'lisa@alvision.ai', role: 'participant', org: 'ALVISION', status: 'active', lastLogin: '1 day ago', meetings: 32, storage: '456 MB' },
  { id: 'u6', name: 'Alex Turner', email: 'alex@alvision.ai', role: 'teamadmin', org: 'ALVISION', status: 'active', lastLogin: '30 min ago', meetings: 87, storage: '1.2 GB' },
  { id: 'u7', name: 'Maria Garcia', email: 'maria@techstart.com', role: 'participant', org: 'TechStart Inc.', status: 'inactive', lastLogin: '2 weeks ago', meetings: 12, storage: '234 MB' },
  { id: 'u8', name: 'David Kim', email: 'david@corp.com', role: 'host', org: 'Global Corp', status: 'suspended', lastLogin: '1 month ago', meetings: 5, storage: '78 MB' },
]

const roleColors: Record<string, string> = {
  superadmin: 'bg-red-500/10 text-red-600 border-red-200',
  orgadmin: 'bg-violet-500/10 text-violet-600 border-violet-200',
  teamadmin: 'bg-blue-500/10 text-blue-600 border-blue-200',
  host: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  participant: 'bg-zinc-500/10 text-zinc-500 border-zinc-200',
  guest: 'bg-zinc-500/10 text-zinc-400 border-zinc-200',
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-600',
  inactive: 'bg-zinc-500/10 text-zinc-500',
  suspended: 'bg-red-500/10 text-red-500',
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)

  const filtered = mockUsers.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    const matchStatus = statusFilter === 'all' || u.status === statusFilter
    return matchSearch && matchRole && matchStatus
  })

  return (
    <div className='space-y-6'>
      {/* Stats */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card><CardContent className='p-4 flex items-center gap-3'><div className='p-2 rounded-lg bg-blue-500/10'><Users className='h-5 w-5 text-blue-600' /></div><div><p className='text-2xl font-bold'>1,247</p><p className='text-xs text-muted-foreground'>Total Users</p></div></CardContent></Card>
        <Card><CardContent className='p-4 flex items-center gap-3'><div className='p-2 rounded-lg bg-emerald-500/10'><Shield className='h-5 w-5 text-emerald-600' /></div><div><p className='text-2xl font-bold'>1,198</p><p className='text-xs text-muted-foreground'>Active</p></div></CardContent></Card>
        <Card><CardContent className='p-4 flex items-center gap-3'><div className='p-2 rounded-lg bg-amber-500/10'><Ban className='h-5 w-5 text-amber-600' /></div><div><p className='text-2xl font-bold'>12</p><p className='text-xs text-muted-foreground'>Suspended</p></div></CardContent></Card>
        <Card><CardContent className='p-4 flex items-center gap-3'><div className='p-2 rounded-lg bg-violet-500/10'><Shield className='h-5 w-5 text-violet-600' /></div><div><p className='text-2xl font-bold'>23</p><p className='text-xs text-muted-foreground'>Organizations</p></div></CardContent></Card>
      </div>

      {/* Toolbar */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='flex items-center gap-2 flex-1 flex-wrap'>
          <div className='relative flex-1 min-w-[200px] max-w-xs'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input placeholder='Search users...' className='pl-9 h-9' value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className='w-[130px] h-9'><SelectValue placeholder='Role' /></SelectTrigger>
            <SelectContent><SelectItem value='all'>All Roles</SelectItem><SelectItem value='superadmin'>Superadmin</SelectItem><SelectItem value='orgadmin'>Org Admin</SelectItem><SelectItem value='teamadmin'>Team Admin</SelectItem><SelectItem value='host'>Host</SelectItem><SelectItem value='participant'>Participant</SelectItem></SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-[120px] h-9'><SelectValue placeholder='Status' /></SelectTrigger>
            <SelectContent><SelectItem value='all'>All Status</SelectItem><SelectItem value='active'>Active</SelectItem><SelectItem value='inactive'>Inactive</SelectItem><SelectItem value='suspended'>Suspended</SelectItem></SelectContent>
          </Select>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' className='gap-1.5'><Download className='h-3.5 w-3.5' /> Export</Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button size='sm' className='gap-1.5'><UserPlus className='h-3.5 w-3.5' /> Add User</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Create User</DialogTitle></DialogHeader><div className='space-y-4 pt-2'><div className='space-y-2'><Label>Name</Label><Input placeholder='Full name' /></div><div className='space-y-2'><Label>Email</Label><Input placeholder='user@company.com' type='email' /></div><div className='space-y-2'><Label>Role</Label><Select><SelectTrigger><SelectValue placeholder='Select role' /></SelectTrigger><SelectContent><SelectItem value='orgadmin'>Org Admin</SelectItem><SelectItem value='teamadmin'>Team Admin</SelectItem><SelectItem value='host'>Host</SelectItem><SelectItem value='participant'>Participant</SelectItem></SelectContent></Select></div><div className='space-y-2'><Label>Organization</Label><Input placeholder='Organization name' /></div><div className='flex justify-end gap-3 pt-2'><Button variant='outline' onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={() => setCreateOpen(false)}>Create</Button></div></div></DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Users table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead className='hidden md:table-cell'>Role</TableHead>
              <TableHead className='hidden lg:table-cell'>Organization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='hidden lg:table-cell'>Last Login</TableHead>
              <TableHead className='hidden xl:table-cell'>Meetings</TableHead>
              <TableHead className='w-10' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(u => (
              <TableRow key={u.id} className='group'>
                <TableCell>
                  <div className='flex items-center gap-3'>
                    <Avatar className='h-8 w-8'><AvatarFallback className='text-xs bg-muted'>{u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</AvatarFallback></Avatar>
                    <div className='min-w-0'><p className='font-medium text-sm truncate'>{u.name}</p><p className='text-xs text-muted-foreground truncate'>{u.email}</p></div>
                  </div>
                </TableCell>
                <TableCell className='hidden md:table-cell'><Badge variant='outline' className={`text-[10px] capitalize ${roleColors[u.role]}`}>{u.role}</Badge></TableCell>
                <TableCell className='hidden lg:table-cell text-sm text-muted-foreground'>{u.org}</TableCell>
                <TableCell><Badge variant='outline' className={`text-[10px] capitalize ${statusColors[u.status]}`}>{u.status}</Badge></TableCell>
                <TableCell className='hidden lg:table-cell text-sm text-muted-foreground'>{u.lastLogin}</TableCell>
                <TableCell className='hidden xl:table-cell text-sm'>{u.meetings}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant='ghost' size='icon' className='h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity'><MoreVertical className='h-4 w-4' /></Button></DropdownMenuTrigger>
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
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && <div className='text-center py-12 text-muted-foreground'><Users className='h-10 w-10 mx-auto mb-3 opacity-40' /><p className='font-medium'>No users found</p></div>}
      </Card>
    </div>
  )
}