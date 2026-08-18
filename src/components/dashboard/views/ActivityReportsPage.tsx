'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart3,
  Search,
  Download,
  RefreshCw,
  AlertCircle,
  Video,
  Clock,
  MessageSquare,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ShieldAlert,
} from 'lucide-react'
import { toast } from 'sonner'
import { authFetch } from '@/lib/api'
import { useAppStore } from '@/store/app-store'

// ── Types ──────────────────────────────────────────────────────────────

interface ActivityUser {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  isActive: boolean
  meetingCount: number
  totalMeetingHours: number
  messageCount: number
  fileCount: number
  lastActive: string
}

interface Totals {
  meetings: number
  totalHours: number
  messages: number
  files: number
}

type SortField = 'name' | 'meetingCount' | 'totalMeetingHours' | 'messageCount' | 'fileCount' | 'lastActive'
type SortDir = 'asc' | 'desc'
type RangeKey = '7d' | '30d' | '90d'

// ── Helpers ────────────────────────────────────────────────────────────

const roleBadgeColors: Record<string, { bg: string; text: string; border: string }> = {
  superadmin: { bg: 'bg-rose-500/10', text: 'text-rose-600', border: 'border-rose-200 dark:border-rose-800' },
  orgadmin: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-200 dark:border-amber-800' },
  teamadmin: { bg: 'bg-teal-500/10', text: 'text-teal-600', border: 'border-teal-200 dark:border-teal-800' },
  host: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-200 dark:border-emerald-800' },
  participant: { bg: 'bg-slate-500/10', text: 'text-slate-600', border: 'border-slate-200 dark:border-slate-800' },
  guest: { bg: 'bg-zinc-500/10', text: 'text-zinc-600', border: 'border-zinc-200 dark:border-zinc-800' },
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatHours(hours: number): string {
  if (hours === 0) return '0h'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// ── Animation ──────────────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

// ── Animated counter ──────────────────────────────────────────────────

function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0)
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    const duration = 1200
    const startTime = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target])
  return <span>{count}</span>
}

// ── Main Component ────────────────────────────────────────────────────

export default function ActivityReportsPage() {
  const { user } = useAppStore()
  const role = user?.role || ''
  const isAdmin = ['orgadmin', 'superadmin'].includes(role)

  const [range, setRange] = useState<RangeKey>('30d')
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<ActivityUser[]>([])
  const [totals, setTotals] = useState<Totals>({ meetings: 0, totalHours: 0, messages: 0, files: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('meetingCount')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch(`/api/v1/organization/reports/activity?range=${range}`)
      if (res.status === 403) {
        setError('You need admin permissions to view activity reports')
        return
      }
      if (!res.ok) throw new Error('Failed to fetch activity report')
      const json = await res.json()
      setUsers(json.data?.users ?? [])
      setTotals(json.data?.totals ?? { meetings: 0, totalHours: 0, messages: 0, files: 0 })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity report')
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => {
    if (isAdmin) fetchData()
  }, [fetchData, isAdmin])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className='h-3 w-3 opacity-40' />
    return sortDir === 'asc' ? <ArrowUp className='h-3 w-3' /> : <ArrowDown className='h-3 w-3' />
  }

  const filteredAndSorted = useMemo(() => {
    let result = users.filter((u) => {
      if (!search) return true
      const q = search.toLowerCase()
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    })
    result.sort((a, b) => {
      let cmp = 0
      if (sortField === 'name') {
        cmp = a.name.localeCompare(b.name)
      } else if (sortField === 'lastActive') {
        cmp = new Date(a.lastActive).getTime() - new Date(b.lastActive).getTime()
      } else {
        cmp = (a[sortField] as number) - (b[sortField] as number)
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return result
  }, [users, search, sortField, sortDir])

  const handleExport = async () => {
    try {
      const blob = new Blob([JSON.stringify({ range, totals, users: filteredAndSorted }, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `activity-report-${range}-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Report exported successfully')
    } catch {
      toast.error('Failed to export report')
    }
  }

  // ── Access denied ──
  if (!isAdmin) {
    return (
      <div className='flex flex-col items-center justify-center py-24'>
        <div className='relative mb-6'>
          <ShieldAlert className='h-16 w-16 text-amber-500/20' />
          <div className='absolute inset-0 flex items-center justify-center'>
            <ShieldAlert className='h-8 w-8 text-amber-500/40' />
          </div>
        </div>
        <h2 className='text-xl font-bold'>Access Denied</h2>
        <p className='text-sm text-muted-foreground mt-1'>Activity Reports are available to organization administrators only.</p>
      </div>
    )
  }

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <Skeleton className='h-6 w-6 rounded' />
            <div className='space-y-2'>
              <Skeleton className='h-7 w-40' />
              <Skeleton className='h-4 w-64' />
            </div>
          </div>
          <div className='flex gap-2'>
            <Skeleton className='h-9 w-20 rounded-lg' />
            <Skeleton className='h-9 w-20 rounded-lg' />
            <Skeleton className='h-9 w-20 rounded-lg' />
            <Skeleton className='h-9 w-28' />
          </div>
        </div>
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-24 rounded-xl' />
          ))}
        </div>
        <Skeleton className='h-10 w-full max-w-xs rounded-lg' />
        <div className='rounded-xl border'>
          <div className='p-4 space-y-3'>
            <Skeleton className='h-4 w-full' />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className='h-12 w-full rounded-lg' />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Error state ──
  if (error) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center gap-3'>
          <BarChart3 className='h-6 w-6 text-primary' />
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Activity Reports</h1>
            <p className='text-sm text-muted-foreground'>User activity & engagement metrics</p>
          </div>
        </div>
        <div className='flex flex-col items-center justify-center py-16'>
          <div className='relative'>
            <AlertCircle className='h-16 w-16 text-red-500/20' />
            <div className='absolute inset-0 flex items-center justify-center'>
              <AlertCircle className='h-8 w-8 text-red-500/40' />
            </div>
          </div>
          <p className='font-medium mt-4'>{error}</p>
          <Button variant='outline' className='mt-4 gap-2' onClick={fetchData}>
            <RefreshCw className='h-4 w-4' /> Try Again
          </Button>
        </div>
      </div>
    )
  }

  // ── Summary cards config ──
  const summaryCards = [
    {
      label: 'Total Meetings',
      value: totals.meetings,
      icon: <Video className='h-5 w-5' />,
      color: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600',
      border: 'border-emerald-200/60 dark:border-emerald-800/40',
    },
    {
      label: 'Total Hours',
      value: Math.round(totals.totalHours),
      icon: <Clock className='h-5 w-5' />,
      color: 'from-teal-500/10 to-teal-500/5 text-teal-600',
      border: 'border-teal-200/60 dark:border-teal-800/40',
    },
    {
      label: 'Total Messages',
      value: totals.messages,
      icon: <MessageSquare className='h-5 w-5' />,
      color: 'from-amber-500/10 to-amber-500/5 text-amber-600',
      border: 'border-amber-200/60 dark:border-amber-800/40',
    },
    {
      label: 'Total Files',
      value: totals.files,
      icon: <FileText className='h-5 w-5' />,
      color: 'from-rose-500/10 to-rose-500/5 text-rose-600',
      border: 'border-rose-200/60 dark:border-rose-800/40',
    },
  ]

  // ── Sortable header ──
  const SortableHead = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead
      className='cursor-pointer select-none hover:bg-muted/50 transition-colors'
      onClick={() => handleSort(field)}
    >
      <div className='flex items-center gap-1'>
        {children}
        <SortIcon field={field} />
      </div>
    </TableHead>
  )

  return (
    <motion.div className='space-y-6' variants={container} initial='hidden' animate='show'>
      {/* ── Header ── */}
      <motion.div variants={item} className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <BarChart3 className='h-6 w-6 text-primary' />
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Activity Reports</h1>
            <p className='text-sm text-muted-foreground'>User activity &amp; engagement metrics</p>
          </div>
        </div>
        <div className='flex items-center gap-2 flex-wrap'>
          {/* Range tabs */}
          <div className='flex rounded-lg border border-border overflow-hidden'>
            {(['7d', '30d', '90d'] as RangeKey[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  range === r
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <Button variant='outline' size='sm' className='gap-1.5' onClick={fetchData}>
            <RefreshCw className='h-3.5 w-3.5' />
            <span className='hidden sm:inline'>Refresh</span>
          </Button>
          <Button variant='outline' size='sm' className='gap-1.5' onClick={handleExport}>
            <Download className='h-3.5 w-3.5' />
            <span className='hidden sm:inline'>Export</span>
          </Button>
        </div>
      </motion.div>

      {/* ── Summary cards ── */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {summaryCards.map((s) => (
          <motion.div key={s.label} variants={item}>
            <Card
              className={`hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5 border border-border/50 hover:border-primary/30 bg-gradient-to-br from-card to-card/80 ${s.border}`}
            >
              <CardContent className='p-4 flex items-center gap-3'>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${s.color}`}>{s.icon}</div>
                <div className='flex-1'>
                  <div className='flex items-baseline gap-2'>
                    <p className='text-2xl font-bold tracking-tight'>
                      <AnimatedCounter target={s.value} />
                    </p>
                  </div>
                  <p className='text-xs text-muted-foreground'>{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Search ── */}
      <motion.div variants={item}>
        <div className='relative max-w-xs'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search by name or email...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-9 h-9'
          />
        </div>
      </motion.div>

      {/* ── User activity table ── */}
      <motion.div variants={item}>
        <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
          <div className='max-h-[500px] overflow-y-auto'>
            <Table>
              <TableHeader>
                <TableRow className='divide-y divide-border/50'>
                  <SortableHead field='name'>Name</SortableHead>
                  <TableHead className='hidden md:table-cell'>Email</TableHead>
                  <TableHead className='hidden sm:table-cell'>Role</TableHead>
                  <SortableHead field='meetingCount'>
                    <span className='hidden sm:inline'>Meetings</span>
                    <span className='sm:hidden'>Mtgs</span>
                  </SortableHead>
                  <SortableHead field='totalMeetingHours'>
                    <span className='hidden sm:inline'>Hours</span>
                    <span className='sm:hidden'>Hrs</span>
                  </SortableHead>
                  <SortableHead field='messageCount'>
                    <span className='hidden sm:inline'>Messages</span>
                    <span className='sm:hidden'>Msgs</span>
                  </SortableHead>
                  <SortableHead field='fileCount'>Files</SortableHead>
                  <SortableHead field='lastActive'>
                    <span className='hidden lg:inline'>Last Active</span>
                    <span className='lg:hidden'>Last</span>
                  </SortableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSorted.length > 0 ? (
                  filteredAndSorted.map((u) => {
                    const badge = roleBadgeColors[u.role] || roleBadgeColors.participant
                    return (
                      <TableRow
                        key={u.id}
                        className={`even:bg-muted/30 hover:bg-muted/50 divide-y divide-border/50 transition-colors ${
                          !u.isActive ? 'opacity-50' : ''
                        }`}
                      >
                        <TableCell>
                          <div className='flex items-center gap-2.5'>
                            <Avatar className='h-7 w-7 border border-border/50'>
                              <AvatarFallback className='text-[10px] bg-muted font-medium'>
                                {getInitials(u.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className='min-w-0'>
                              <p className='text-sm font-medium truncate max-w-[140px] sm:max-w-[200px]'>{u.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className='hidden md:table-cell text-sm text-muted-foreground truncate max-w-[200px]'>
                          {u.email}
                        </TableCell>
                        <TableCell className='hidden sm:table-cell'>
                          <Badge
                            variant='outline'
                            className={`text-[10px] font-medium ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className='font-medium tabular-nums'>{u.meetingCount}</TableCell>
                        <TableCell className='tabular-nums text-muted-foreground'>{formatHours(u.totalMeetingHours)}</TableCell>
                        <TableCell className='tabular-nums text-muted-foreground'>{u.messageCount}</TableCell>
                        <TableCell className='tabular-nums text-muted-foreground'>{u.fileCount}</TableCell>
                        <TableCell className='text-sm text-muted-foreground whitespace-nowrap'>
                          {formatRelativeTime(u.lastActive)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className='h-32 text-center'>
                      <div className='flex flex-col items-center'>
                        <BarChart3 className='h-10 w-10 text-muted-foreground/20 mb-2' />
                        <p className='text-sm text-muted-foreground'>No activity data found</p>
                        {search && (
                          <p className='text-xs text-muted-foreground/60 mt-1'>Try adjusting your search</p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </motion.div>

      {/* ── Footer stats ── */}
      <motion.div variants={item} className='text-center text-xs text-muted-foreground'>
        Showing {filteredAndSorted.length} of {users.length} users · Data for {range === '7d' ? 'last 7 days' : range === '30d' ? 'last 30 days' : 'last 90 days'}
      </motion.div>
    </motion.div>
  )
}
