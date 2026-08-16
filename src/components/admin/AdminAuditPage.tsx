'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  FileText,
  Search,
  Download,
  RefreshCw,
  Shield,
  UserPlus,
  Settings2,
  Video,
  Trash2,
  Lock,
  AlertTriangle,
  Clock,
} from 'lucide-react'

interface AuditEntry {
  id: string
  timestamp: string
  actor: string
  action: string
  resource: string
  details: string
  severity: 'info' | 'warning' | 'critical'
  ip: string
}

const actionIcons: Record<string, React.ReactNode> = {
  'user.login': <Lock className='h-3.5 w-3.5' />,
  'user.create': <UserPlus className='h-3.5 w-3.5' />,
  'user.update': <Settings2 className='h-3.5 w-3.5' />,
  'user.delete': <Trash2 className='h-3.5 w-3.5' />,
  'meeting.create': <Video className='h-3.5 w-3.5' />,
  'meeting.end': <Video className='h-3.5 w-3.5' />,
  'org.settings': <Settings2 className='h-3.5 w-3.5' />,
  'security.policy': <Shield className='h-3.5 w-3.5' />,
}

const severityColors: Record<string, string> = {
  info: 'bg-blue-500/10 text-blue-600',
  warning: 'bg-amber-500/10 text-amber-600',
  critical: 'bg-red-500/10 text-red-500',
}

const mockEntries: AuditEntry[] = [
  { id: 'a1', timestamp: '2025-01-14 14:32:05', actor: 'sarah@alvision.ai', action: 'user.login', resource: 'User', details: 'Successful login from 192.168.1.10', severity: 'info', ip: '192.168.1.10' },
  { id: 'a2', timestamp: '2025-01-14 14:28:17', actor: 'system', action: 'security.policy', resource: 'Policy', details: 'IP 203.0.113.42 blocked after 3 failed login attempts', severity: 'warning', ip: '203.0.113.42' },
  { id: 'a3', timestamp: '2025-01-14 14:15:42', actor: 'sarah@alvision.ai', action: 'user.create', resource: 'User', details: 'Created user account john@techstart.com', severity: 'info', ip: '192.168.1.10' },
  { id: 'a4', timestamp: '2025-01-14 13:55:09', actor: 'emily@techstart.com', action: 'org.settings', resource: 'Organization', details: 'Updated organization settings for TechStart Inc.', severity: 'info', ip: '10.0.0.45' },
  { id: 'a5', timestamp: '2025-01-14 13:42:33', actor: 'mike@alvision.ai', action: 'meeting.create', resource: 'Meeting', details: 'Created meeting: Engineering Standup', severity: 'info', ip: '192.168.1.22' },
  { id: 'a6', timestamp: '2025-01-14 13:30:18', actor: 'unknown@external.com', action: 'user.login', resource: 'User', details: 'Failed login attempt for admin@alvision.ai', severity: 'warning', ip: '203.0.113.42' },
  { id: 'a7', timestamp: '2025-01-14 12:15:44', actor: 'james@alvision.ai', action: 'meeting.end', resource: 'Meeting', details: 'Meeting ended: Security Review Board (2h 05m)', severity: 'info', ip: '192.168.1.33' },
  { id: 'a8', timestamp: '2025-01-14 11:08:22', actor: 'alex@alvision.ai', action: 'user.update', resource: 'User', details: 'Changed role for lisa@alvision.ai from participant to host', severity: 'info', ip: '192.168.1.15' },
  { id: 'a9', timestamp: '2025-01-14 10:45:11', actor: 'system', action: 'security.policy', resource: 'Policy', details: 'Detected brute force attempt from 198.51.100.0/24', severity: 'critical', ip: '198.51.100.12' },
  { id: 'a10', timestamp: '2025-01-14 10:30:00', actor: 'sarah@alvision.ai', action: 'org.settings', resource: 'Organization', details: 'Enabled 2FA requirement for all users', severity: 'info', ip: '192.168.1.10' },
]

export default function AdminAuditPage() {
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')

  const actions = [...new Set(mockEntries.map(e => e.action))]

  const filtered = mockEntries.filter(e => {
    const matchSearch = e.actor.toLowerCase().includes(search.toLowerCase()) || e.details.toLowerCase().includes(search.toLowerCase())
    const matchSeverity = severityFilter === 'all' || e.severity === severityFilter
    const matchAction = actionFilter === 'all' || e.action === actionFilter
    return matchSearch && matchSeverity && matchAction
  })

  return (
    <div className='space-y-6'>
      {/* Stats */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card><CardContent className='p-4 flex items-center gap-3'><div className='p-2 rounded-lg bg-blue-500/10'><FileText className='h-5 w-5 text-blue-600' /></div><div><p className='text-2xl font-bold'>1,247</p><p className='text-xs text-muted-foreground'>Total Entries</p></div></CardContent></Card>
        <Card><CardContent className='p-4 flex items-center gap-3'><div className='p-2 rounded-lg bg-amber-500/10'><AlertTriangle className='h-5 w-5 text-amber-600' /></div><div><p className='text-2xl font-bold'>23</p><p className='text-xs text-muted-foreground'>Warnings</p></div></CardContent></Card>
        <Card><CardContent className='p-4 flex items-center gap-3'><div className='p-2 rounded-lg bg-red-500/10'><Shield className='h-5 w-5 text-red-600' /></div><div><p className='text-2xl font-bold'>3</p><p className='text-xs text-muted-foreground'>Critical</p></div></CardContent></Card>
        <Card><CardContent className='p-4 flex items-center gap-3'><div className='p-2 rounded-lg bg-emerald-500/10'><Clock className='h-5 w-5 text-emerald-600' /></div><div><p className='text-2xl font-bold'>24/7</p><p className='text-xs text-muted-foreground'>Monitoring</p></div></CardContent></Card>
      </div>

      {/* Toolbar */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='flex items-center gap-2 flex-1 flex-wrap'>
          <div className='relative flex-1 min-w-[200px] max-w-xs'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input placeholder='Search audit log...' className='pl-9 h-9' value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className='w-[120px] h-9'><SelectValue placeholder='Severity' /></SelectTrigger>
            <SelectContent><SelectItem value='all'>All</SelectItem><SelectItem value='info'>Info</SelectItem><SelectItem value='warning'>Warning</SelectItem><SelectItem value='critical'>Critical</SelectItem></SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className='w-[150px] h-9'><SelectValue placeholder='Action' /></SelectTrigger>
            <SelectContent><SelectItem value='all'>All Actions</SelectItem>{actions.map(a => <SelectItem key={a} value={a}>{a.replace('.', ' > ')}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' className='gap-1.5'><RefreshCw className='h-3.5 w-3.5' /> Refresh</Button>
          <Button variant='outline' size='sm' className='gap-1.5'><Download className='h-3.5 w-3.5' /> Export</Button>
        </div>
      </div>

      {/* Audit table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-10' />
              <TableHead>Timestamp</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead className='hidden lg:table-cell'>Details</TableHead>
              <TableHead className='hidden md:table-cell'>IP</TableHead>
              <TableHead>Severity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(e => (
              <TableRow key={e.id}>
                <TableCell><div className='text-muted-foreground'>{actionIcons[e.action] || <FileText className='h-3.5 w-3.5' />}</div></TableCell>
                <TableCell className='font-mono text-xs text-muted-foreground whitespace-nowrap'>{e.timestamp}</TableCell>
                <TableCell className='text-sm font-medium'>{e.actor}</TableCell>
                <TableCell><Badge variant='outline' className='text-[10px]'>{e.action.replace('.', ' > ')}</Badge></TableCell>
                <TableCell className='hidden lg:table-cell text-sm text-muted-foreground max-w-[300px] truncate'>{e.details}</TableCell>
                <TableCell className='hidden md:table-cell font-mono text-xs text-muted-foreground'>{e.ip}</TableCell>
                <TableCell><Badge className={`text-[10px] ${severityColors[e.severity]}`}>{e.severity}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && <div className='text-center py-12 text-muted-foreground'><FileText className='h-10 w-10 mx-auto mb-3 opacity-40' /><p className='font-medium'>No audit entries found</p></div>}
      </Card>
    </div>
  )
}
