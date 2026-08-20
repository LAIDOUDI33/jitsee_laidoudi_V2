'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { authFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Video, Building2, UsersRound, TrendingUp } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────

type TimePeriod = 'week' | 'month' | 'all'

interface AnalyticsData {
  userStats: {
    totalUsers: number
    activeUsers: number
    newUsersThisMonth: number
    newUsersThisWeek: number
    usersByRole: { role: string; count: number }[]
  }
  meetingStats: {
    totalMeetings: number
    meetingsThisWeek: number
    meetingsThisMonth: number
    averageDuration: number
    meetingsByStatus: { status: string; count: number }[]
  }
  organizationStats: {
    totalOrganizations: number
    totalTeams: number
    averageTeamSize: number
  }
  recentActivity: {
    id: string
    name: string
    email: string
    lastLogin: string | null
    role: string
  }[]
  dailyGrowth: { date: string; count: number; day: string }[]
}

// ─── Helpers ────────────────────────────────────────────────────────

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const ROLE_COLORS: Record<string, string> = {
  superadmin: 'bg-rose-500',
  orgadmin: 'bg-violet-500',
  teamadmin: 'bg-amber-500',
  host: 'bg-teal-500',
  participant: 'bg-emerald-500',
  guest: 'bg-slate-400',
}

const ROLE_BAR_COLORS: Record<string, string> = {
  superadmin: 'bg-gradient-to-r from-rose-500 to-rose-400',
  orgadmin: 'bg-gradient-to-r from-violet-500 to-violet-400',
  teamadmin: 'bg-gradient-to-r from-amber-500 to-amber-400',
  host: 'bg-gradient-to-r from-teal-500 to-teal-400',
  participant: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
  guest: 'bg-gradient-to-r from-slate-500 to-slate-400',
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#10b981',
  active: '#8b5cf6',
  ended: '#14b8a6',
  completed: '#14b8a6',
  expired: '#f43f5e',
  cancelled: '#f43f5e',
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  active: 'Active',
  ended: 'Completed',
  completed: 'Completed',
  expired: 'Expired',
  cancelled: 'Cancelled',
}

// ─── Animated Counter Hook ──────────────────────────────────────────

function useAnimatedCounter(target: number, duration: number = 1200) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const startTime = performance.now()
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [target, duration])
  return count
}

// ─── Card Variants ──────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

// ─── Stat Card Component ────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  change,
  accent,
  accentBg,
  borderColor,
  index,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  change?: string
  accent: string
  accentBg: string
  borderColor: string
  index: number
}) {
  const animated = useAnimatedCounter(value)

  return (
    <motion.div custom={index} variants={cardVariants} initial="hidden" animate="visible">
      <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${borderColor}`} />
        <CardContent className="p-5 pl-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">{label}</p>
              <p className="text-3xl font-bold tracking-tight tabular-nums">{animated.toLocaleString()}</p>
              {change && (
                <div className="flex items-center gap-1">
                  <TrendingUp className={`h-3.5 w-3.5 ${accent}`} />
                  <span className={`text-xs font-medium ${accent}`}>{change}</span>
                </div>
              )}
            </div>
            <div className={`rounded-xl p-2.5 ${accentBg}`}>
              <Icon className={`h-5 w-5 ${accent}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Skeleton Loader ────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><Skeleton className="h-5 w-40" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-5 w-40" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><Skeleton className="h-5 w-36" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-5 w-36" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
      </div>
    </div>
  )
}

// ─── User Growth Bar Chart ──────────────────────────────────────────

function UserGrowthChart({ data }: { data: { date: string; count: number; day: string }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)
  const totalCount = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          User Growth (Last 14 Days)
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-end gap-1.5 h-44">
          <div className="flex flex-col justify-between h-full pr-2 text-[10px] text-muted-foreground tabular-nums w-8 shrink-0">
            <span>{maxCount}</span>
            <span>{Math.round(maxCount / 2)}</span>
            <span>0</span>
          </div>
          <div className="flex-1 flex items-end gap-1.5 h-full border-b border-l border-muted/30 pb-1 pl-1">
            {data.map((d, i) => {
              const height = maxCount > 0 ? (d.count / maxCount) * 100 : 0
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    className="w-full rounded-t-sm bg-gradient-to-t from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 cursor-pointer transition-colors min-h-[2px]"
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(height, 2)}%` }}
                    transition={{ delay: i * 0.04, duration: 0.5, ease: 'easeOut' }}
                    title={`${d.day} ${d.date}: ${d.count} users`}
                  />
                  <span className="text-[9px] text-muted-foreground mt-1">{d.day}</span>
                </div>
              )
            })}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Total new users in this period:{' '}
          <span className="font-semibold text-foreground">{totalCount}</span>
        </p>
      </CardContent>
    </Card>
  )
}

// ─── Meeting Distribution Donut ─────────────────────────────────────

function MeetingDonutChart({ data }: { data: { status: string; count: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  const donutData = useMemo(() => {
    if (total === 0) return { segments: [] as { status: string; count: number; pct: number }[], conicBg: '' }
    return data.reduce(
      (acc, d) => {
        const pct = (d.count / total) * 100
        const start = acc.angle
        const angle = acc.angle + pct
        const color = STATUS_COLORS[d.status] || '#94a3b8'
        return {
          parts: [...acc.parts, `${color} ${start}% ${angle}%`],
          segments: [...acc.segments, { ...d, pct }],
          angle,
        }
      },
      { parts: [] as string[], segments: [] as { status: string; count: number; pct: number }[], angle: 0 }
    )
  }, [data, total])

  if (total === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-violet-500" />
            Meeting Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-sm text-muted-foreground">No meetings yet</p>
        </CardContent>
      </Card>
    )
  }

  const conicGradient = `conic-gradient(${donutData.parts.join(', ')})`

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-violet-500" />
          Meeting Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-8">
          <div className="relative w-40 h-40 shrink-0">
            <motion.div
              className="w-full h-full rounded-full"
              style={{ background: conicGradient }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-card flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tabular-nums">{total}</span>
                <span className="text-[10px] text-muted-foreground">meetings</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 flex-1 min-w-0">
            {donutData.segments.map((s) => (
              <div key={s.status} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[s.status] || '#94a3b8' }}
                  />
                  <span className="text-sm truncate">{STATUS_LABELS[s.status] || s.status}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold tabular-nums">{s.count}</span>
                  <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                    {s.pct.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Users by Role Chart ────────────────────────────────────────────

function UsersByRoleChart({ data }: { data: { role: string; count: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)
  const sorted = useMemo(() => [...data].sort((a, b) => b.count - a.count), [data])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-amber-500" />
          Users by Role
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sorted.map((r, i) => {
            const pct = (r.count / maxCount) * 100
            const barColor = ROLE_BAR_COLORS[r.role] || 'bg-slate-400'
            return (
              <div key={r.role} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{r.role}</span>
                  <span className="text-sm font-semibold tabular-nums">{r.count}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted/60 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${barColor}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: i * 0.07, duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Recent Activity Table ──────────────────────────────────────────

function RecentActivityTable({ data }: { data: AnalyticsData['recentActivity'] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-teal-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-sm text-muted-foreground">No recent activity</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-teal-500" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="border-b">
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Email</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="text-right py-2.5 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Login</th>
              </tr>
            </thead>
            <tbody>
              {data.map((user, i) => {
                const avatarColor = ROLE_COLORS[user.role] || 'bg-slate-400'
                const rowBg = i % 2 === 0 ? 'bg-muted/15' : ''
                return (
                  <motion.tr
                    key={user.id}
                    className={`border-b last:border-0 hover:bg-muted/40 transition-colors ${rowBg}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                  >
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className={`text-[10px] font-semibold text-white ${avatarColor}`}>
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium truncate max-w-[140px]">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground truncate max-w-[180px] hidden sm:table-cell">
                      {user.email}
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-medium capitalize">
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-right text-muted-foreground tabular-nums whitespace-nowrap">
                      {relativeTime(user.lastLogin)}
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<TimePeriod>('all')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch(`/api/v1/admin/analytics?period=${period}`)
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      } else {
        setError(json.error?.message || 'Failed to load analytics')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const periodButtons: { label: string; value: TimePeriod }[] = [
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'All Time', value: 'all' },
  ]

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Admin Analytics</h2>
          <p className="text-sm text-muted-foreground">Real-time platform insights and metrics</p>
        </div>
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          {periodButtons.map((btn) => {
            const isActive = period === btn.value
            return (
              <button
                key={btn.value}
                onClick={() => setPeriod(btn.value)}
                className={
                  isActive
                    ? 'px-3.5 py-1.5 text-sm font-medium rounded-md transition-all duration-200 bg-card text-foreground shadow-sm'
                    : 'px-3.5 py-1.5 text-sm font-medium rounded-md transition-all duration-200 text-muted-foreground hover:text-foreground'
                }
              >
                {btn.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Loading State */}
      {loading && <LoadingSkeleton />}

      {/* Error State */}
      {error && !loading && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-rose-200 dark:border-rose-900/40">
            <CardContent className="p-6 text-center">
              <p className="text-rose-600 dark:text-rose-400 font-medium">{error}</p>
              <button
                onClick={fetchAnalytics}
                className="mt-2 text-sm text-rose-500 hover:text-rose-600 underline underline-offset-2"
              >
                Retry
              </button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Data Display */}
      {data && !loading && (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Overview Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              icon={Users}
              label="Total Users"
              value={data.userStats.totalUsers}
              change={`+${data.userStats.newUsersThisMonth} this month`}
              accent="text-emerald-600"
              accentBg="bg-emerald-600/10"
              borderColor="bg-emerald-500"
              index={0}
            />
            <StatCard
              icon={Video}
              label="Total Meetings"
              value={data.meetingStats.totalMeetings}
              change={`+${data.meetingStats.meetingsThisMonth} this month`}
              accent="text-violet-600"
              accentBg="bg-violet-600/10"
              borderColor="bg-violet-500"
              index={1}
            />
            <StatCard
              icon={Building2}
              label="Organizations"
              value={data.organizationStats.totalOrganizations}
              accent="text-amber-600"
              accentBg="bg-amber-600/10"
              borderColor="bg-amber-500"
              index={2}
            />
            <StatCard
              icon={UsersRound}
              label="Total Teams"
              value={data.organizationStats.totalTeams}
              change={`Avg ${data.organizationStats.averageTeamSize} members`}
              accent="text-teal-600"
              accentBg="bg-teal-600/10"
              borderColor="bg-teal-500"
              index={3}
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <UserGrowthChart data={data.dailyGrowth} />
            <MeetingDonutChart data={data.meetingStats.meetingsByStatus} />
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <UsersByRoleChart data={data.userStats.usersByRole} />
            <RecentActivityTable data={data.recentActivity} />
          </div>
        </motion.div>
      )}
    </div>
  )
}
