'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  List,
  Rows3,
  Calendar,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'

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

const severityConfig: Record<string, { color: string; dot: string; bg: string; text: string; icon: React.ReactNode }> = {
  info: { color: 'bg-cyan-500/10 text-cyan-600 border-cyan-200 dark:border-cyan-800/50', dot: 'bg-cyan-500', bg: 'bg-cyan-500/10', text: 'text-cyan-600', icon: <FileText className='h-3 w-3' /> },
  warning: { color: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800/50', dot: 'bg-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-600', icon: <AlertTriangle className='h-3 w-3' /> },
  critical: { color: 'bg-red-500/10 text-red-500 border-red-200 dark:border-red-800/50', dot: 'bg-red-500', bg: 'bg-red-500/10', text: 'text-red-500', icon: <AlertTriangle className='h-3 w-3 animate-pulse' /> },
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

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } }

export default function AdminAuditPage() {
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const actions = [...new Set(mockEntries.map(e => e.action))]

  const filtered = mockEntries.filter(e => {
    const matchSearch = e.actor.toLowerCase().includes(search.toLowerCase()) || e.details.toLowerCase().includes(search.toLowerCase())
    const matchSeverity = severityFilter === 'all' || e.severity === severityFilter
    const matchAction = actionFilter === 'all' || e.action === actionFilter
    return matchSearch && matchSeverity && matchAction
  })

  const handleExport = (format: string) => {
    toast.success(`Exported ${filtered.length} entries as ${format.toUpperCase()}`)
  }

  return (
    <motion.div className='space-y-6' variants={container} initial='hidden' animate='show'>
      {/* Stats with trend indicators */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {[
          { label: 'Total Entries', value: '1,247', change: '+8%', trend: 'up' as const, icon: <FileText className='h-5 w-5' />, color: 'from-cyan-500/10 to-cyan-500/5 text-cyan-600' },
          { label: 'Warnings', value: '23', change: '-5%', trend: 'down' as const, icon: <AlertTriangle className='h-5 w-5' />, color: 'from-amber-500/10 to-amber-500/5 text-amber-600' },
          { label: 'Critical', value: '3', icon: <Shield className='h-5 w-5' />, color: 'from-red-500/10 to-red-500/5 text-red-600' },
          { label: 'Monitoring', value: '24/7', icon: <Clock className='h-5 w-5' />, color: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600' },
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
                        <TrendingUp className={`h-3 w-3 ${s.trend === 'down' ? 'rotate-180' : ''}`} />{s.change}
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

      {/* Toolbar */}
      <motion.div variants={item} className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='flex items-center gap-2 flex-1 flex-wrap'>
          <div className='relative flex-1 min-w-[200px] max-w-xs'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input placeholder='Search audit log...' className='pl-9 h-9 focus:ring-2 focus:ring-primary/20' value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className='w-[120px] h-9'><SelectValue placeholder='Severity' /></SelectTrigger>
            <SelectContent><SelectItem value='all'>All</SelectItem><SelectItem value='info'>Info</SelectItem><SelectItem value='warning'>Warning</SelectItem><SelectItem value='critical'>Critical</SelectItem></SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className='w-[150px] h-9'><SelectValue placeholder='Action' /></SelectTrigger>
            <SelectContent><SelectItem value='all'>All Actions</SelectItem>{actions.map(a => <SelectItem key={a} value={a}>{a.replace('.', ' > ')}</SelectItem>)}</SelectContent>
          </Select>
          <div className='flex items-center gap-1.5'>
            <Calendar className='h-3.5 w-3.5 text-muted-foreground' />
            <Input type='date' className='h-9 w-[130px] text-xs' value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <span className='text-xs text-muted-foreground'>to</span>
            <Input type='date' className='h-9 w-[130px] text-xs' value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>
        <div className='flex gap-2 flex-wrap'>
          <div className='flex rounded-lg border border-border overflow-hidden'>
            <button onClick={() => setViewMode('table')} className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><Rows3 className='h-3.5 w-3.5' /></button>
            <button onClick={() => setViewMode('timeline')} className={`p-2 transition-colors ${viewMode === 'timeline' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><List className='h-3.5 w-3.5' /></button>
          </div>
          <Button variant='outline' size='sm' className='gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={() => toast.info('Refreshed')}><RefreshCw className='h-3.5 w-3.5' /> Refresh</Button>
          <Button variant='outline' size='sm' className='gap-1 text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={() => handleExport('csv')}><Download className='h-3.5 w-3.5' /> CSV</Button>
          <Button variant='outline' size='sm' className='gap-1 text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={() => handleExport('json')}><Download className='h-3.5 w-3.5' /> JSON</Button>
        </div>
      </motion.div>

      {/* Table View */}
      {viewMode === 'table' && (
        <motion.div variants={item}>
          <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
            <Table>
              <TableHeader>
                <TableRow className='divide-y divide-border/50'>
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
                {filtered.map(e => {
                  const sev = severityConfig[e.severity]
                  return (
                    <TableRow key={e.id} className='even:bg-muted/30 hover:bg-muted/50 divide-y divide-border/50 transition-colors'>
                      <TableCell><div className={`p-1.5 rounded-md ${sev.bg} ${sev.text}`}>{actionIcons[e.action] || <FileText className='h-3.5 w-3.5' />}</div></TableCell>
                      <TableCell className='font-mono text-xs text-muted-foreground whitespace-nowrap'>{e.timestamp}</TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Avatar className='h-6 w-6 border border-border/50'><AvatarFallback className='text-[9px] bg-muted font-medium'>{e.actor.split('@')[0].slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                          <span className='text-sm font-medium'>{e.actor}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant='outline' className='text-[10px] gap-1'>{actionIcons[e.action]}<span className='hidden sm:inline'>{e.action.replace('.', ' > ')}</span></Badge></TableCell>
                      <TableCell className='hidden lg:table-cell text-sm text-muted-foreground max-w-[300px] truncate'>{e.details}</TableCell>
                      <TableCell className='hidden md:table-cell font-mono text-xs text-muted-foreground'>{e.ip}</TableCell>
                      <TableCell><Badge variant='outline' className={`text-[10px] gap-1 ${sev.color}`}>{sev.icon}{e.severity}</Badge></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {filtered.length === 0 && (
              <div className='text-center py-16'>
                <FileText className='h-16 w-16 mx-auto mb-4 opacity-20 text-muted-foreground' />
                <p className='font-medium text-muted-foreground'>No audit entries found</p>
                <p className='text-sm text-muted-foreground/60 mt-1'>Try adjusting your search or filters</p>
                <Button variant='outline' size='sm' className='mt-4 gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={() => { setSearch(''); setSeverityFilter('all'); setActionFilter('all') }}>Clear Filters</Button>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <motion.div variants={item}>
          <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
            <CardHeader className='pb-3'><CardTitle className='text-sm flex items-center gap-2'><Clock className='h-4 w-4' /> Audit Timeline</CardTitle></CardHeader>
            <CardContent>
              {filtered.length > 0 ? (
                <div className='relative'>
                  <div className='absolute left-[15px] top-2 bottom-2 w-px bg-border' />
                  <div className='space-y-4'>
                    {filtered.map((e, i) => {
                      const sev = severityConfig[e.severity]
                      return (
                        <motion.div
                          key={e.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05, duration: 0.25 }}
                          className='flex items-start gap-3 relative'
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 border-background ${sev.bg} ${sev.text}`}>
                            {sev.icon}
                          </div>
                          <div className='flex-1 min-w-0 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors'>
                            <div className='flex items-center justify-between gap-2 mb-1'>
                              <div className='flex items-center gap-2 min-w-0'>
                                <Avatar className='h-5 w-5 border border-border/50'><AvatarFallback className='text-[8px] bg-muted font-medium'>{e.actor.split('@')[0].slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                                <span className='text-sm font-medium truncate'>{e.actor}</span>
                                <Badge variant='outline' className='text-[10px] gap-1 shrink-0'>{actionIcons[e.action]}{e.action.replace('.', ' > ')}</Badge>
                              </div>
                              <Badge variant='outline' className={`text-[10px] shrink-0 gap-1 ${sev.color}`}>{e.severity}</Badge>
                            </div>
                            <p className='text-xs text-muted-foreground'>{e.details}</p>
                            <div className='flex items-center gap-3 mt-1.5'>
                              <span className='text-[10px] text-muted-foreground font-mono'>{e.timestamp}</span>
                              <span className='text-[10px] text-muted-foreground font-mono'>IP: {e.ip}</span>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className='text-center py-16'>
                  <FileText className='h-16 w-16 mx-auto mb-4 opacity-20 text-muted-foreground' />
                  <p className='font-medium text-muted-foreground'>No audit entries found</p>
                  <p className='text-sm text-muted-foreground/60 mt-1'>Try adjusting your search or filters</p>
                  <Button variant='outline' size='sm' className='mt-4 gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={() => { setSearch(''); setSeverityFilter('all'); setActionFilter('all') }}>Clear Filters</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}