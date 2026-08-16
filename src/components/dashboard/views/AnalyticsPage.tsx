'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Brain,
  BarChart3,
  Download,
  Calendar,
} from 'lucide-react'
import { motion } from 'framer-motion'
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

// ── Mock Data ──────────────────────────────────────────────────────────────

const meetingActivityData = [
  { day: 'Mon 6', video: 8, audio: 3 },
  { day: 'Tue 7', video: 12, audio: 5 },
  { day: 'Wed 8', video: 10, audio: 4 },
  { day: 'Thu 9', video: 15, audio: 6 },
  { day: 'Fri 10', video: 9, audio: 7 },
  { day: 'Sat 11', video: 3, audio: 1 },
  { day: 'Sun 12', video: 2, audio: 1 },
  { day: 'Mon 13', video: 11, audio: 4 },
  { day: 'Tue 14', video: 14, audio: 5 },
  { day: 'Wed 15', video: 13, audio: 6 },
  { day: 'Thu 16', video: 16, audio: 7 },
  { day: 'Fri 17', video: 10, audio: 5 },
  { day: 'Sat 18', video: 4, audio: 2 },
  { day: 'Sun 19', video: 3, audio: 1 },
]

const departmentData = [
  { department: 'Engineering', meetings: 142, color: '#10b981' },
  { department: 'Product', meetings: 98, color: '#6366f1' },
  { department: 'Design', meetings: 76, color: '#f59e0b' },
  { department: 'Marketing', meetings: 64, color: '#ef4444' },
  { department: 'Sales', meetings: 87, color: '#8b5cf6' },
  { department: 'HR', meetings: 45, color: '#06b6d4' },
]

const meetingTypeData = [
  { name: 'Standup', value: 320, color: '#10b981' },
  { name: 'Sprint Planning', value: 128, color: '#6366f1' },
  { name: '1-on-1', value: 156, color: '#f59e0b' },
  { name: 'All-Hands', value: 48, color: '#ef4444' },
  { name: 'Client Call', value: 94, color: '#8b5cf6' },
  { name: 'Brainstorm', value: 72, color: '#06b6d4' },
]

const topCollaborators = [
  { name: 'Sarah Chen', role: 'Engineering Lead', meetings: 48, hours: 36.5, sparkline: [3, 5, 4, 7, 6, 8, 5, 7, 9, 6], initials: 'SC', color: 'bg-emerald-500' },
  { name: 'Mike Johnson', role: 'Product Manager', meetings: 42, hours: 31.2, sparkline: [4, 3, 5, 4, 6, 5, 7, 4, 6, 8], initials: 'MJ', color: 'bg-violet-500' },
  { name: 'Emily Davis', role: 'UX Designer', meetings: 38, hours: 28.8, sparkline: [2, 4, 3, 5, 4, 3, 6, 5, 4, 7], initials: 'ED', color: 'bg-amber-500' },
  { name: 'Alex Turner', role: 'Full-Stack Dev', meetings: 35, hours: 26.1, sparkline: [5, 4, 6, 3, 5, 7, 4, 6, 3, 5], initials: 'AT', color: 'bg-sky-500' },
  { name: 'Lisa Park', role: 'Marketing Lead', meetings: 31, hours: 22.4, sparkline: [3, 2, 4, 3, 5, 4, 3, 5, 6, 4], initials: 'LP', color: 'bg-rose-500' },
]

const aiFeatureAdoption = [
  { name: 'Live Transcription', percentage: 78, gradient: 'from-emerald-500 to-teal-400' },
  { name: 'AI Summaries', percentage: 65, gradient: 'from-violet-500 to-purple-400' },
  { name: 'Translation', percentage: 42, gradient: 'from-amber-500 to-orange-400' },
  { name: 'Action Items', percentage: 58, gradient: 'from-sky-500 to-blue-400' },
]

const kpiCards = [
  { label: 'Total Meeting Hours', value: 1284, suffix: 'h', trend: 12, icon: Clock, iconGradient: 'from-emerald-500 to-teal-400', iconBg: 'bg-emerald-500/10' },
  { label: 'Avg Meeting Duration', value: 34, suffix: 'min', trend: -3, icon: BarChart3, iconGradient: 'from-violet-500 to-purple-400', iconBg: 'bg-violet-500/10' },
  { label: 'Active Users', value: 246, suffix: '', trend: 8, icon: Users, iconGradient: 'from-sky-500 to-blue-400', iconBg: 'bg-sky-500/10' },
  { label: 'AI Actions Extracted', value: 1893, suffix: '', trend: 45, icon: Brain, iconGradient: 'from-amber-500 to-orange-400', iconBg: 'bg-amber-500/10' },
]

// ── Animations ─────────────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// ── Helper: Count-Up Animation ─────────────────────────────────────────────

function useCountUp(target: number, duration = 1200, delay = 0) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
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

// ── KPI Card ───────────────────────────────────────────────────────────────

function KPICard({ label, value, suffix, trend, icon: Icon, iconGradient, iconBg }: (typeof kpiCards)[number]) {
  const animatedValue = useCountUp(value, 1400, 200)
  return (
    <motion.div variants={itemVariants}>
      <Card className="bg-card border border-border/50 rounded-xl p-6 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300">
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
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Sparkline Mini Bar ─────────────────────────────────────────────────────

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  return (
    <div className="flex items-end gap-[2px] h-6">
      {data.map((v, i) => (
        <div
          key={i}
          className="rounded-sm w-[4px] transition-all duration-300"
          style={{
            height: `${(v / max) * 100}%`,
            backgroundColor: color,
            opacity: 0.5 + (i / data.length) * 0.5,
          }}
        />
      ))}
    </div>
  )
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────

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

// ── Main Component ─────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30')

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics & Insights</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your organization&apos;s meeting patterns and AI adoption</p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={dateRange} onValueChange={setDateRange}>
            <TabsList className="h-9">
              <TabsTrigger value="7" className="text-xs px-3">7 days</TabsTrigger>
              <TabsTrigger value="30" className="text-xs px-3">30 days</TabsTrigger>
              <TabsTrigger value="90" className="text-xs px-3">90 days</TabsTrigger>
              <TabsTrigger value="custom" className="text-xs px-3">Custom</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="size-4" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <KPICard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* ── Charts Row: Activity + Donut ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meeting Activity Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="bg-card border border-border/50 rounded-xl hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                Meeting Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={meetingActivityData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="videoGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="audioGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="video" name="Video Meetings" stroke="#10b981" strokeWidth={2} fill="url(#videoGradient)" />
                    <Area type="monotone" dataKey="audio" name="Audio Only" stroke="#6366f1" strokeWidth={2} fill="url(#audioGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Meeting Type Distribution */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card border border-border/50 rounded-xl h-full hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Meeting Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={meetingTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {meetingTypeData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                {meetingTypeData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2 text-xs">
                    <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-muted-foreground truncate">{entry.name}</span>
                    <span className="font-medium tabular-nums ml-auto">{entry.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Department Bar Chart ──────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-card border border-border/50 rounded-xl hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="size-4 text-muted-foreground" />
              Usage by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis type="category" dataKey="department" axisLine={false} tickLine={false} width={90} tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="meetings" name="Meetings" radius={[0, 6, 6, 0]} barSize={24}>
                    {departmentData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Bottom Row: Top Collaborators + AI Adoption ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Collaborators */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card border border-border/50 rounded-xl hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                Top Collaborators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topCollaborators.map((user) => (
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
                      <p className="text-xs text-muted-foreground truncate">{user.role}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Meetings</p>
                        <p className="text-sm font-semibold tabular-nums">{user.meetings}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Hours</p>
                        <p className="text-sm font-semibold tabular-nums">{user.hours}h</p>
                      </div>
                      <MiniSparkline data={user.sparkline} color="#10b981" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Feature Adoption */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card border border-border/50 rounded-xl hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Brain className="size-4 text-muted-foreground" />
                AI Feature Adoption
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {aiFeatureAdoption.map((feature) => (
                  <div key={feature.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{feature.name}</span>
                      <span className="text-sm font-semibold tabular-nums">{feature.percentage}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${feature.gradient}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${feature.percentage}%` }}
                        transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
