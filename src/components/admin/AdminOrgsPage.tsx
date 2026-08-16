'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Building2,
  Plus,
  Search,
  Users,
  HardDrive,
  MoreVertical,
  Settings2,
  ExternalLink,
  Crown,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Org {
  id: string
  name: string
  plan: 'free' | 'pro' | 'enterprise'
  users: number
  maxUsers: number
  storage: string
  storageUsed: number
  meetings: number
  status: 'active' | 'trial' | 'suspended'
  createdAt: string
  admin: string
}

const planColors: Record<string, string> = {
  free: 'bg-zinc-500/10 text-zinc-500 border-zinc-200',
  pro: 'bg-blue-500/10 text-blue-600 border-blue-200',
  enterprise: 'bg-violet-500/10 text-violet-600 border-violet-200',
}

const mockOrgs: Org[] = [
  { id: 'o1', name: 'ALVISION', plan: 'enterprise', users: 45, maxUsers: -1, storage: '48.2 GB', storageUsed: 72, meetings: 1240, status: 'active', createdAt: 'Jun 2024', admin: 'Sarah Chen' },
  { id: 'o2', name: 'TechStart Inc.', plan: 'pro', users: 28, maxUsers: 50, storage: '12.4 GB', storageUsed: 45, meetings: 567, status: 'active', createdAt: 'Aug 2024', admin: 'Emily Davis' },
  { id: 'o3', name: 'Global Corp', plan: 'enterprise', users: 156, maxUsers: -1, storage: '89.3 GB', storageUsed: 56, meetings: 3420, status: 'active', createdAt: 'Mar 2024', admin: 'Tom Brown' },
  { id: 'o4', name: 'Design Studio', plan: 'free', users: 5, maxUsers: 10, storage: '890 MB', storageUsed: 89, meetings: 45, status: 'trial', createdAt: 'Jan 2025', admin: 'Nina Patel' },
  { id: 'o5', name: 'Acme Industries', plan: 'pro', users: 34, maxUsers: 50, storage: '18.7 GB', storageUsed: 37, meetings: 892, status: 'active', createdAt: 'Oct 2024', admin: 'James Lee' },
  { id: 'o6', name: 'StartupXYZ', plan: 'free', users: 3, maxUsers: 10, storage: '234 MB', storageUsed: 23, meetings: 12, status: 'suspended', createdAt: 'Nov 2024', admin: 'Alex Rivera' },
]

export default function AdminOrgsPage() {
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)

  const filtered = mockOrgs.filter(o => {
    const matchSearch = o.name.toLowerCase().includes(search.toLowerCase()) || o.admin.toLowerCase().includes(search.toLowerCase())
    const matchPlan = planFilter === 'all' || o.plan === planFilter
    return matchSearch && matchPlan
  })

  return (
    <div className='space-y-6'>
      {/* Stats */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card><CardContent className='p-4 flex items-center gap-3'><div className='p-2 rounded-lg bg-blue-500/10'><Building2 className='h-5 w-5 text-blue-600' /></div><div><p className='text-2xl font-bold'>23</p><p className='text-xs text-muted-foreground'>Organizations</p></div></CardContent></Card>
        <Card><CardContent className='p-4 flex items-center gap-3'><div className='p-2 rounded-lg bg-emerald-500/10'><Users className='h-5 w-5 text-emerald-600' /></div><div><p className='text-2xl font-bold'>271</p><p className='text-xs text-muted-foreground'>Total Users</p></div></CardContent></Card>
        <Card><CardContent className='p-4 flex items-center gap-3'><div className='p-2 rounded-lg bg-violet-500/10'><Crown className='h-5 w-5 text-violet-600' /></div><div><p className='text-2xl font-bold'>4</p><p className='text-xs text-muted-foreground'>Enterprise</p></div></CardContent></Card>
        <Card><CardContent className='p-4 flex items-center gap-3'><div className='p-2 rounded-lg bg-amber-500/10'><HardDrive className='h-5 w-5 text-amber-600' /></div><div><p className='text-2xl font-bold'>169 GB</p><p className='text-xs text-muted-foreground'>Total Storage</p></div></CardContent></Card>
      </div>

      {/* Toolbar */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='flex items-center gap-2 flex-1'>
          <div className='relative flex-1 max-w-xs'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input placeholder='Search organizations...' className='pl-9 h-9' value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className='w-[120px] h-9'><SelectValue placeholder='Plan' /></SelectTrigger>
            <SelectContent><SelectItem value='all'>All Plans</SelectItem><SelectItem value='free'>Free</SelectItem><SelectItem value='pro'>Pro</SelectItem><SelectItem value='enterprise'>Enterprise</SelectItem></SelectContent>
          </Select>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button size='sm' className='gap-1.5'><Plus className='h-3.5 w-3.5' /> New Org</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Create Organization</DialogTitle></DialogHeader><div className='space-y-4 pt-2'><div className='space-y-2'><Label>Organization Name</Label><Input placeholder='e.g. Acme Corp' /></div><div className='space-y-2'><Label>Plan</Label><Select><SelectTrigger><SelectValue placeholder='Select plan' /></SelectTrigger><SelectContent><SelectItem value='free'>Free</SelectItem><SelectItem value='pro'>Pro</SelectItem><SelectItem value='enterprise'>Enterprise</SelectItem></SelectContent></Select></div><div className='space-y-2'><Label>Admin Email</Label><Input placeholder='admin@company.com' /></div><div className='flex justify-end gap-3 pt-2'><Button variant='outline' onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={() => setCreateOpen(false)}>Create</Button></div></div></DialogContent>
        </Dialog>
      </div>

      {/* Org table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead className='hidden md:table-cell'>Users</TableHead>
              <TableHead className='hidden lg:table-cell'>Storage</TableHead>
              <TableHead className='hidden xl:table-cell'>Meetings</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='w-10' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(o => (
              <TableRow key={o.id} className='group'>
                <TableCell>
                  <div className='flex items-center gap-3'>
                    <div className='w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center'><Building2 className='h-4 w-4 text-primary' /></div>
                    <div className='min-w-0'><p className='font-medium text-sm'>{o.name}</p><p className='text-xs text-muted-foreground'>Admin: {o.admin} · Since {o.createdAt}</p></div>
                  </div>
                </TableCell>
                <TableCell><Badge variant='outline' className={`text-[10px] capitalize ${planColors[o.plan]}`}>{o.plan}</Badge></TableCell>
                <TableCell className='hidden md:table-cell'><div className='flex items-center gap-2'><Users className='h-3.5 w-3.5 text-muted-foreground' /><span className='text-sm'>{o.users}{o.maxUsers > 0 ? `/${o.maxUsers}` : ''}</span></div></TableCell>
                <TableCell className='hidden lg:table-cell'><div className='space-y-1'><p className='text-sm'>{o.storage}</p><Progress value={o.storageUsed} className='h-1.5 w-20' /></div></TableCell>
                <TableCell className='hidden xl:table-cell text-sm'>{o.meetings.toLocaleString()}</TableCell>
                <TableCell><Badge variant='outline' className={`text-[10px] capitalize ${o.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : o.status === 'trial' ? 'bg-blue-500/10 text-blue-600' : 'bg-red-500/10 text-red-500'}`}>{o.status}</Badge></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant='ghost' size='icon' className='h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity'><MoreVertical className='h-4 w-4' /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem className='gap-2'><Settings2 className='h-4 w-4' /> Settings</DropdownMenuItem>
                      <DropdownMenuItem className='gap-2'><Users className='h-4 w-4' /> Manage Users</DropdownMenuItem>
                      <DropdownMenuItem className='gap-2'><ExternalLink className='h-4 w-4' /> View Details</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && <div className='text-center py-12 text-muted-foreground'><Building2 className='h-10 w-10 mx-auto mb-3 opacity-40' /><p className='font-medium'>No organizations found</p></div>}
      </Card>
    </div>
  )
}
