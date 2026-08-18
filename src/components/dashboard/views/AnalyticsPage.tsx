'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Brain,
  BarChart3,
  RefreshCw,
  AlertCircle,
  Calendar,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { authFetch } from '@/lib/api'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// ── Types ───────────────────────────────────────────────────────────────

interface AnalyticsData {
  meetingActivity: Array<{ day: string; date: string; meetings: number }>
  meetingTypes: Array<{ name: string; value: number; color: string }>
  departmentData: Array<{ department: string; users: number; color: string }>
  topCollaborators: Array<{
    name: string
    role: string
    meetings: number
    initials: string
    color: string
  }>
  aiFeatureAdoption: Array<{ name: string; count: number; color: string }>
  kpiCards: {
    totalMeetings: number
    avgDurationMinutes: number
    totalParticipants: number
    aiSummariesThisMonth: number
  }
}

// ── Animation Variants ───────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
}

// ── Helper: Count-Up Animation ──────────────────────────────────────────

function useCountUp(target: number, duration = 1200, delay = 0) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const startTime = performance.now() + delay
    function step(now: number) {
      if (now < startTime) {
        requestAnimationFrame(step)
        return
      }
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, delay])
  return count
}

// ── Custom Tooltip ──────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border/50 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium tabular-nums">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── KPI Card ────────────────────────────────────────────────────────────

interface KPICardProps {
  label: string
  value: number
  suffix: string
  iconGradient: string
  iconBg: string
  icon: React.ComponentType<{ className?: string }>
  trend?: number | null
}

function KPICard({ label, value, suffix, iconGradient, iconBg, icon: Icon, trend }: KPICardProps) {
  const animatedValue = useCountUp(value, 1400, 200)
  return (
    <motion.div variants={itemVariants}>
      <Card className="bg-card border border-border/50 rounded-xl p-6 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden">
        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${iconGradient}`} />
        <CardContent className="p-0">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <p className="text-3xl font-bold tabular-nums">
                {animatedValue.toLocaleString()}{suffix && <span className="text-lg ml-1 text-muted-foreground font-normal">{suffix}</span>}
              </p>
            </div>
            <div className={`rounded-xl p-3 ${iconBg}`}>
              <div className={`bg-gradient-to-br ${iconGradient} bg-clip-text`}>
                <Icon className="size-6 text-current" style={{ color: 'inherit' }} />
              </div>
            </div>
          </div>
          {trend !== null && trend !== undefined && (
            <div className="mt-3 flex items-center gap-1.5">
              {trend >= 0 ? (
                <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-xs font-medium px-2 py-0.5">
                  <TrendingUp className="size-3" />
                  +{trend}%
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 bg-red-500/10 text-red-600 dark:text-red-400 border-0 text-xs font-medium px-2 py-0.5">
                  <TrendingDown className="size-3" />
                  {trend}%
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">vs last period</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Loading Skeleton ────────────────────────────────────────────────────

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-5 w-32" />
            </div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <Skeleton className="h-5 w-36 mb-4" />
          <Skeleton className="h-72 w-full" />
        </Card>
        <Card className="p-6">
          <Skeleton className="h-5 w-28 mb-4" />
          <Skeleton className="h-52 w-full" />
          <div className="grid grid-cols-2 gap-3 mt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
        </Card>
      </div>
      <Card className="p-6">
        <Skeleton className="h-5 w-36 mb-4" />
        <Skeleton className="h-72 w-full" />
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <Skeleton className="h-5 w-36 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <Skeleton className="h-5 w-36 mb-4" />
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ── Error State ─────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="rounded-full bg-red-500/10 p-4">
        <AlertCircle className="size-8 text-red-500" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold">Failed to load analytics</h3>
        <p className="text-sm text-muted-foreground mt-1">
          There was an error fetching analytics data. Please try again.
        </p>
      </div>
      <Button variant="outline" className="gap-2" onClick={onRetry}>
        <RefreshCw className="size-4" />
        Try Again
      </Button>
    </div>
  )
}

// ── Empty State ─────────────────────────────────────────────────────────

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2">
      <BarChart3 className="size-10 text-muted-foreground/40" />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground/70">{description}</p>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await authFetch('/api/v1/analytics')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      } else {
        throw new Error('Invalid response')
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  if (loading) return <AnalyticsSkeleton />
  if (error) return <ErrorState onRetry={fetchAnalytics} />
  if (!data) return <ErrorState onRetry={fetchAnalytics} />

  const hasMeetingActivity = data.meetingActivity.some((d) => d.meetings > 0)
  const hasMeetingTypes = data.meetingTypes.length > 0
  const hasDepartments = data.departmentData.length > 0
  const hasCollaborators = data.topCollaborators.length > 0
  const hasAiFeatures = data.aiFeatureAdoption.some((f) => f.count > 0)

  // AI adoption max for bar chart
  const aiMaxCount = Math.max(...data.aiFeatureAdoption.map((f) => f.count), 1)

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Header ────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics & Insights</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your organization&apos;s meeting patterns and AI adoption</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => fetchAnalytics()}
        >
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </motion.div>

      {/* ── KPI Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Meetings"
          value={data.kpiCards.totalMeetings}
          suffix=""
          icon={Calendar}
          iconGradient="from-emerald-500 to-teal-400"
          iconBg="bg-emerald-500/10"
        />
        <KPICard
          label="Avg Duration"
          value={data.kpiCards.avgDurationMinutes}
          suffix="min"
          icon={Clock}
          iconGradient="from-amber-500 to-orange-400"
          iconBg="bg-amber-500/10"
        />
        <KPICard
          label="Total Participants"
          value={data.kpiCards.totalParticipants}
          suffix=""
          icon={Users}
          iconGradient="from-teal-500 to-cyan-400"
          iconBg="bg-teal-500/10"
        />
        <KPICard
          label="AI Summaries (Month)"
          value={data.kpiCards.aiSummariesThisMonth}
          suffix=""
          icon={Brain}
          iconGradient="from-rose-500 to-pink-400"
          iconBg="bg-rose-500/10"
        />
      </div>

      {/* ── Charts Row: Activity + Donut ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meeting Activity Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="bg-card border border-border/50 rounded-xl hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500/60 to-teal-400/60" />
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                Meeting Activity (30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasMeetingActivity ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.meetingActivity} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="meetingGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        interval="preserveStartEnd"
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="meetings" name="Meetings" stroke="#10b981" strokeWidth={2} fill="url(#meetingGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState title="No meeting activity" description="Meetings in the last 30 days will appear here" />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Meeting Type Distribution */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card border border-border/50 rounded-xl h-full hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500/60 to-orange-400/60" />
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Meeting Types</CardTitle>
            </CardHeader>
            <CardContent>
              {hasMeetingTypes ? (
                <>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.meetingTypes}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {data.meetingTypes.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                    {data.meetingTypes.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-2 text-xs">
                        <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="text-muted-foreground truncate">{entry.name}</span>
                        <span className="font-medium tabular-nums ml-auto">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState title="No meeting types yet" description="Type distribution will appear here" />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Department Bar Chart ──────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-card border border-border/50 rounded-xl hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500/60 to-cyan-400/60" />
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="size-4 text-muted-foreground" />
              Users by Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasDepartments ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.departmentData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                    <YAxis type="category" dataKey="department" axisLine={false} tickLine={false} width={100} tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="users" name="Users" radius={[0, 6, 6, 0]} barSize={24}>
                      {data.departmentData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title="No organizations" description="Organization data will appear here" />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Bottom Row: Top Collaborators + AI Adoption ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Collaborators */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card border border-border/50 rounded-xl hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500/60 to-cyan-400/60" />
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                Top Collaborators
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasCollaborators ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {data.topCollaborators.map((user) => (
                    <div
                      key={user.name}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="size-9 shrink-0">
                        <AvatarFallback className={`${user.color} text-white text-xs font-semibold`}>
                          {user.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground capitalize truncate">{user.role}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-muted-foreground">Meetings</p>
                        <p className="text-sm font-semibold tabular-nums">{user.meetings}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No collaborator data" description="User participation data will appear here" />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Feature Adoption */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card border border-border/50 rounded-xl hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500/60 to-orange-400/60" />
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Brain className="size-4 text-muted-foreground" />
                AI Feature Adoption
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasAiFeatures ? (
                <div className="space-y-6">
                  {data.aiFeatureAdoption.map((feature) => {
                    const pct = Math.round((feature.count / aiMaxCount) * 100)
                    return (
                      <div key={feature.name}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{feature.name}</span>
                          <span className="text-sm font-semibold tabular-nums">{feature.count}</span>
                        </div>
                        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: feature.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' as const }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState title="No AI usage yet" description="AI feature adoption data will appear here" />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
