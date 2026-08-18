'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { authFetch } from '@/lib/api'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  RefreshCw,
  Users,
  AlertCircle,
  Clock,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────

interface UserActivity {
  id: string
  name: string
  email?: string
  role: string
  avatar?: string | null
  isActive: boolean
  lastLogin: string | null
  organization: { id: string; name: string } | null
  meetingsAttended: number
}

// ── Role badge config ──────────────────────────────────────────────────

const ROLE_STYLES: Record<string, string> = {
  superadmin: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  orgadmin: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  teamadmin: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  host: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800',
  participant: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800',
  guest: 'bg-slate-500/10 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-800',
}

function roleBadge(role: string) {
  return ROLE_STYLES[role] ?? ROLE_STYLES.participant
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function relativeTime(d: string | null) {
  if (!d) return 'Never'
  const now = Date.now()
  const diff = now - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(d)
}

// ── Skeleton ───────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-52" />
          </div>
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-24 hidden sm:block" />
          <Skeleton className="h-4 w-28 hidden md:block" />
        </div>
      ))}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────

export default function ParticipantsPage() {
  const [users, setUsers] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch('/api/v1/users/activity')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      if (json.success) setUsers(json.data.users)
      else throw new Error(json.error?.message || 'Failed to fetch')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase()
      if (q && !u.name.toLowerCase().includes(q) && !(u.email ?? '').toLowerCase().includes(q)) return false
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (statusFilter === 'active' && !u.isActive) return false
      if (statusFilter === 'inactive' && u.isActive) return false
      return true
    })
  }, [users, search, roleFilter, statusFilter])

  const activeCount = users.filter((u) => u.isActive).length
  const inactiveCount = users.length - activeCount
  const totalMeetings = users.reduce((sum, u) => sum + u.meetingsAttended, 0)

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Participants</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {users.length} total members
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={fetchUsers}
          disabled={loading}
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Users className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-xs text-muted-foreground">Total Members</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <div className="size-2.5 rounded-full bg-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {activeCount}
              </p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-slate-500/10 flex items-center justify-center">
              <Clock className="size-5 text-slate-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalMeetings}</p>
              <p className="text-xs text-muted-foreground">Total Meeting Attendances</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="superadmin">Superadmin</SelectItem>
                <SelectItem value="orgadmin">Org Admin</SelectItem>
                <SelectItem value="teamadmin">Team Admin</SelectItem>
                <SelectItem value="host">Host</SelectItem>
                <SelectItem value="participant">Participant</SelectItem>
                <SelectItem value="guest">Guest</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
        {loading ? (
          <CardContent className="p-6">
            <TableSkeleton />
          </CardContent>
        ) : error ? (
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="size-10 text-red-400 mb-3" />
              <p className="text-sm font-medium">Failed to load participants</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={fetchUsers}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        ) : filtered.length === 0 ? (
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="size-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium">No participants found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No users in this organization yet'}
              </p>
            </div>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="pl-4">User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Organization</TableHead>
                  <TableHead className="hidden md:table-cell">Last Login</TableHead>
                  <TableHead className="text-right pr-4">Meetings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u, idx) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.2 }}
                    className="border-border/50 hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="pl-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                            {initials(u.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-[180px]">
                            {u.name}
                          </p>
                          {u.email && (
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {u.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-medium capitalize ${roleBadge(u.role)}`}
                      >
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`size-2 rounded-full ${
                            u.isActive ? 'bg-emerald-500' : 'bg-red-400'
                          }`}
                        />
                        <span
                          className={`text-xs ${
                            u.isActive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-500 dark:text-red-400'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {u.organization?.name ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span
                        className="text-sm text-muted-foreground"
                        title={formatDate(u.lastLogin)}
                      >
                        {relativeTime(u.lastLogin)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <span className="text-sm font-medium tabular-nums">
                        {u.meetingsAttended}
                      </span>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Footer */}
        {!loading && !error && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing {filtered.length} of {users.length} users
              {inactiveCount > 0 && (
                <span className="ml-2">
                  · {inactiveCount} inactive
                </span>
              )}
            </span>
          </div>
        )}
      </Card>
    </div>
  )
}
