'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app-store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { authFetch } from '@/lib/api'
import { toast } from 'sonner'
import {
  Shield,
  Users,
  Building2,
  Server,
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Cpu,
  HardDrive,
  Video,
  FileText,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  UserPlus,
  BarChart3,
  Zap,
  XCircle,
} from 'lucide-react'

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

function generateSparkline(value: number, count = 10): number[] {
  const base = Math.max(1, value)
  return Array.from({ length: count }, () => Math.max(1, Math.round(base + (Math.random() - 0.5) * base * 0.4)))
}

interface StatsData {
  totalUsers: number
  activeUsers: number
  suspendedUsers: number
  totalOrganizations: number
  totalMeetings: number
  activeMeetings: number
  totalRecordings: number
  totalAuditLogs: number
  recentActivity: Array<{
    id: string
    action: string
    details: string | null
    createdAt: string
    user: { id: string; name: string; email: string } | null
  }>
  recentUsers: Array<{ id: string; name: string; email: string; role: string; createdAt: string }>
}

const colorMap: Record<string, { iconBg: string; iconText: string; trendUp: string; trendDown: string; sparkColor: string; gaugeColor: string; gaugeTrack: string }> = {
  emerald: { iconBg: 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5', iconText: 'text-emerald-600', trendUp: 'text-emerald-600', trendDown: 'text-red-500', sparkColor: 'bg-emerald-500', gaugeColor: '#10b981', gaugeTrack: 'stroke-emerald-500/15' },
  violet: { iconBg: 'bg-gradient-to-br from-violet-500/10 to-violet-500/5', iconText: 'text-violet-600', trendUp: 'text-violet-600', trendDown: 'text-red-500', sparkColor: 'bg-violet-500', gaugeColor: '#8b5cf6', gaugeTrack: 'stroke-violet-500/15' },
  amber: { iconBg: 'bg-gradient-to-br from-amber-500/10 to-amber-500/5', iconText: 'text-amber-600', trendUp: 'text-amber-600', trendDown: 'text-red-500', sparkColor: 'bg-amber-500', gaugeColor: '#f59e0b', gaugeTrack: 'stroke-amber-500/15' },
  rose: { iconBg: 'bg-gradient-to-br from-rose-500/10 to-rose-500/5', iconText: 'text-rose-600', trendUp: 'text-emerald-600', trendDown: 'text-rose-600', sparkColor: 'bg-rose-500', gaugeColor: '#f43f5e', gaugeTrack: 'stroke-rose-500/15' },
}

const systemHealth: { service: string; status: 'healthy' | 'degraded' | 'down'; uptime: string; latency: string }[] = [
  { service: 'API Server', status: 'healthy' as const, uptime: '99.98%', latency: '12ms' },
  { service: 'AI Service', status: 'healthy' as const, uptime: '99.95%', latency: '245ms' },
  { service: 'Database', status: 'healthy' as const, uptime: '99.99%', latency: '3ms' },
  { service: 'WebSocket Server', status: 'healthy' as const, uptime: '99.97%', latency: '8ms' },
  { service: 'File Storage', status: 'degraded' as const, uptime: '99.90%', latency: '120ms' },
]

const statusDotColor = {
  healthy: 'bg-emerald-500',
  degraded: 'bg-amber-500',
  down: 'bg-red-500',
}

const statusBannerConfig = {
  green: { gradient: 'from-emerald-500/5 via-cyan-500/5 to-teal-500/5', border: 'border-emerald-200/50 dark:border-emerald-800/30', badgeBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', text: 'All Systems Operational', dotColor: 'bg-emerald-500' },
  yellow: { gradient: 'from-amber-500/5 via-orange-500/5 to-yellow-500/5', border: 'border-amber-200/50 dark:border-amber-800/30', badgeBg: 'bg-amber-500/10 text-amber-600 border-amber-200', text: 'Partial Degradation', dotColor: 'bg-amber-500' },
  red: { gradient: 'from-red-500/5 via-rose-500/5 to-pink-500/5', border: 'border-red-200/50 dark:border-red-800/30', badgeBg: 'bg-red-500/10 text-red-500 border-red-200', text: 'Service Outage Detected', dotColor: 'bg-red-500' },
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } } }

function AnimatedCounter({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
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

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
}

function CircularGauge({ value, color, track }: { value: number; color: string; track: string }) {
  const radius = 28
  const stroke = 4
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  return (
    <div className='relative w-16 h-16'>
      <svg width='64' height='64' viewBox='0 0 64 64' className='-rotate-90'>
        <circle cx='32' cy='32' r={radius} fill='none' strokeWidth={stroke} className={track} />
        <motion.circle cx='32' cy='32' r={radius} fill='none' stroke={color} strokeWidth={stroke} strokeLinecap='round'
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' as const, delay: 0.3 }}
        />
      </svg>
      <div className='absolute inset-0 flex items-center justify-center'>
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className='text-xs font-bold' style={{ color }}>
          {value}%
        </motion.span>
      </div>
    </div>
  )
}

function MiniBarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const range = max || 1
  return (
    <div className='flex items-end gap-[2px] h-6'>
      {data.map((v, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(v / range) * 100}%` }}
          transition={{ duration: 0.4, delay: i * 0.03, ease: 'easeOut' as const }}
          className={`w-[5px] rounded-sm ${color} opacity-70 hover:opacity-100 transition-opacity`}
        />
      ))}
    </div>
  )
}

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: y * -6, y: x * 6 })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 })
  }, [])

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform: `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transition: 'transform 0.15s ease-out' }}
      className={className}
    >
      {children}
    </div>
  )
}

function AdminPageSkeleton() {
  return (
    <div className='space-y-6'>
      <Card className='border border-border/50 rounded-xl'>
        <CardContent className='p-5 flex items-center gap-4'>
          <Skeleton className='h-12 w-12 rounded-xl' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-5 w-48' />
            <Skeleton className='h-4 w-72' />
          </div>
        </CardContent>
      </Card>
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className='border border-border/50 rounded-xl'>
            <CardContent className='p-4 space-y-3'>
              <div className='flex justify-between'><Skeleton className='h-9 w-9 rounded-lg' /><Skeleton className='h-4 w-12' /></div>
              <Skeleton className='h-7 w-24' />
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-6 w-full' />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { setCurrentView } = useAppStore()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      try {
        const res = await authFetch('/api/v1/admin/stats')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (!cancelled && json.data?.stats) {
          setStats(json.data.stats)
        }
      } catch (err) {
        if (!cancelled) toast.error('Failed to load admin stats')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [])

  const overallStatus = systemHealth.every(s => s.status === 'healthy') ? 'green' as const : systemHealth.some(s => s.status === 'down') ? 'red' as const : 'yellow' as const
  const banner = statusBannerConfig[overallStatus]

  // Compute systemMetrics from API data
  const systemMetrics = stats ? [
    {
      label: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      change: `of ${stats.totalUsers.toLocaleString()}`,
      trend: 'up' as const,
      icon: <Users className='h-5 w-5' />,
      color: 'emerald',
      sparkline: generateSparkline(stats.activeUsers),
      gauge: Math.min(95, Math.round(stats.activeUsers / Math.max(1, stats.totalUsers) * 100)),
    },
    {
      label: 'Active Meetings',
      value: stats.activeMeetings.toLocaleString(),
      change: `of ${stats.totalMeetings.toLocaleString()}`,
      trend: 'up' as const,
      icon: <Video className='h-5 w-5' />,
      color: 'violet',
      sparkline: generateSparkline(stats.activeMeetings),
      gauge: Math.min(95, Math.round(stats.activeMeetings / Math.max(1, stats.totalMeetings) * 100)),
    },
    {
      label: 'Organizations',
      value: stats.totalOrganizations.toLocaleString(),
      change: `${stats.totalOrganizations} total`,
      trend: 'up' as const,
      icon: <Building2 className='h-5 w-5' />,
      color: 'amber',
      sparkline: generateSparkline(stats.totalOrganizations),
      gauge: Math.min(95, Math.round(stats.totalOrganizations / Math.max(1, 50) * 100)),
    },
    {
      label: 'Recordings',
      value: stats.totalRecordings.toLocaleString(),
      change: `${stats.totalRecordings} total`,
      trend: 'up' as const,
      icon: <HardDrive className='h-5 w-5' />,
      color: 'rose',
      sparkline: generateSparkline(stats.totalRecordings),
      gauge: Math.min(95, Math.round(stats.totalRecordings / Math.max(1, 100) * 100)),
    },
  ] : []

  // Map recentActivity from API
  const recentActivity = stats ? stats.recentActivity.map(entry => ({
    action: entry.action.replace('.', ': '),
    detail: entry.details || '',
    time: timeAgo(entry.createdAt),
    type: (entry.action.includes('failed') || entry.action.includes('block') || entry.action.includes('critical') || entry.action.includes('warn') ? 'warning' : 'info') as 'info' | 'warning' | 'success',
    user: entry.user?.name || 'System',
  })) : []

  // Quick actions with real counts
  const quickActions = [
    { label: 'Manage Users', view: 'admin-users' as const, icon: <Users className='h-4 w-4' />, count: stats ? `${stats.totalUsers} users` : '…', color: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600' },
    { label: 'Organizations', view: 'admin-orgs' as const, icon: <Building2 className='h-4 w-4' />, count: stats ? `${stats.totalOrganizations} orgs` : '…', color: 'from-violet-500/10 to-violet-500/5 text-violet-600' },
    { label: 'Security', view: 'admin-security' as const, icon: <Shield className='h-4 w-4' />, count: 'View', color: 'from-rose-500/10 to-rose-500/5 text-rose-600' },
    { label: 'Audit Log', view: 'admin-audit' as const, icon: <FileText className='h-4 w-4' />, count: stats ? `${stats.totalAuditLogs} entries` : '…', color: 'from-amber-500/10 to-amber-500/5 text-amber-600' },
    { label: 'System Health', view: 'admin-system' as const, icon: <Server className='h-4 w-4' />, count: 'View', color: 'from-cyan-500/10 to-cyan-500/5 text-cyan-600' },
    { label: 'View Reports', view: 'dashboard' as const, icon: <BarChart3 className='h-4 w-4' />, count: 'Analytics', color: 'from-fuchsia-500/10 to-fuchsia-500/5 text-fuchsia-600' },
  ]

  if (loading) return <AdminPageSkeleton />

  return (
    <motion.div className='space-y-6' variants={container} initial='hidden' animate='show'>
      {/* Dynamic system health banner - green/yellow/red */}
      <motion.div variants={item}>
        <Card className={`bg-gradient-to-r ${banner.gradient} ${banner.border} hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden rounded-xl`}>
          <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${overallStatus === 'green' ? 'from-emerald-500 via-cyan-500 to-teal-500' : overallStatus === 'yellow' ? 'from-amber-500 via-orange-500 to-yellow-500' : 'from-red-500 via-rose-500 to-pink-500'}`} />
          <CardContent className='p-5 flex items-center gap-4'>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${overallStatus === 'green' ? 'from-emerald-500 to-cyan-600' : overallStatus === 'yellow' ? 'from-amber-500 to-orange-600' : 'from-red-500 to-rose-600'} flex items-center justify-center shrink-0 shadow-lg ${overallStatus === 'green' ? 'shadow-emerald-500/20' : overallStatus === 'yellow' ? 'shadow-amber-500/20' : 'shadow-red-500/20'}`}>
              {overallStatus === 'green' ? <Shield className='h-6 w-6 text-white' /> : overallStatus === 'yellow' ? <AlertTriangle className='h-6 w-6 text-white' /> : <XCircle className='h-6 w-6 text-white' />}
            </div>
            <div className='flex-1 min-w-0'>
              <h2 className='font-semibold flex items-center gap-2'>Administration Console</h2>
              <p className='text-sm text-muted-foreground'>Manage users, organizations, security policies, and system configuration.</p>
            </div>
            <div className='hidden sm:flex items-center gap-2 shrink-0'>
              <div className={`w-2.5 h-2.5 rounded-full ${banner.dotColor} animate-breathe`} />
              <span className={`text-xs font-medium ${overallStatus === 'green' ? 'text-emerald-600' : overallStatus === 'yellow' ? 'text-amber-600' : 'text-red-500'}`}>{banner.text}</span>
            </div>
            <Badge variant='outline' className='gap-1.5 shrink-0'><Cpu className='h-3 w-3' /> Super Admin</Badge>
          </CardContent>
        </Card>
      </motion.div>

      {/* Metrics with circular gauges and bar sparklines */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {systemMetrics.map((m, idx) => {
          const cm = colorMap[m.color]
          return (
            <motion.div key={m.label} variants={item} custom={idx}>
              <Card className='hover:shadow-xl hover:shadow-primary/8 hover:-translate-y-0.5 transition-all duration-300 border border-border/50 hover:border-primary/30 bg-gradient-to-br from-card to-card/80 rounded-xl relative overflow-hidden'>
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${m.color === 'emerald' ? 'from-emerald-500 to-teal-400' : m.color === 'violet' ? 'from-violet-500 to-fuchsia-400' : m.color === 'amber' ? 'from-amber-500 to-orange-400' : 'from-rose-500 to-pink-400'}`} />
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between mb-3'>
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${cm.iconBg} ${cm.iconText}`}>{m.icon}</div>
                    <span className={`text-xs font-semibold flex items-center gap-0.5 ${cm.trendUp}`}>
                      <TrendingUp className='h-3 w-3' />
                      {m.change}
                    </span>
                  </div>
                  <div className='flex items-center justify-between gap-2'>
                    <div>
                      <p className='text-2xl font-bold tracking-tight'>
                        <AnimatedCounter target={parseInt(m.value.replace(/[^0-9]/g, ''))} />
                      </p>
                      <p className='text-xs text-muted-foreground mt-0.5'>{m.label}</p>
                    </div>
                    <CircularGauge value={m.gauge} color={cm.gaugeColor} track={cm.gaugeTrack} />
                  </div>
                  <div className='mt-3'>
                    <MiniBarChart data={m.sparkline} color={cm.sparkColor} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Section divider */}
      <div className='flex items-center gap-3 pt-2'>
        <div className='h-px flex-1 bg-gradient-to-r from-border via-border to-transparent' />
        <span className='text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest'>Insights &amp; Activity</span>
        <div className='h-px flex-1 bg-gradient-to-l from-border via-border to-transparent' />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Quick Actions Grid */}
        <motion.div variants={item}>
          <Card className='hover:shadow-xl hover:shadow-primary/8 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80 overflow-hidden relative rounded-xl'>
            <div className='absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500' />
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm flex items-center gap-2'><Zap className='h-4 w-4 text-amber-500' /> Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 gap-2'>
                {quickActions.map(a => (
                  <TiltCard key={a.label} className='rounded-lg'>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setCurrentView(a.view)}
                      className='w-full flex flex-col items-center gap-2 p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-all duration-200 text-center group'
                    >
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${a.color} transition-transform group-hover:scale-110`}>{a.icon}</div>
                      <div>
                        <p className='text-xs font-medium'>{a.label}</p>
                        <p className='text-[10px] text-muted-foreground'>{a.count}</p>
                      </div>
                    </motion.button>
                  </TiltCard>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* System Health with dynamic status */}
        <motion.div variants={item}>
          <Card className='hover:shadow-xl hover:shadow-primary/8 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80 overflow-hidden relative rounded-xl'>
            <div className='absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400' />
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm flex items-center gap-2'><Activity className='h-4 w-4 text-emerald-500' /> System Health</CardTitle>
                <Badge variant='outline' className={`gap-1.5 text-[10px] ${banner.badgeBg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${banner.dotColor} animate-breathe`} />{' '}{systemHealth.filter((sv) => sv.status === 'healthy').length}{'/'}{systemHealth.length} Healthy
                </Badge>
              </div>
            </CardHeader>
            <CardContent className='space-y-2'>
              {systemHealth.map(s => {
                const uptimeVal = parseFloat(s.uptime)
                return (
                  <div key={s.service} className={`flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors ${s.status === 'degraded' ? 'bg-amber-500/5 border border-amber-200/50 dark:border-amber-800/30' : s.status === 'down' ? 'bg-red-500/5 border border-red-200/50' : ''}`}>
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusDotColor[s.status]} ${s.status !== 'healthy' ? 'animate-breathe' : ''}`} />
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium'>{s.service}</p>
                      <div className='flex items-center gap-2 mt-1'>
                        <div className='flex-1 h-1.5 rounded-full bg-muted overflow-hidden'>
                          <motion.div
                            className={`h-full rounded-full ${s.status === 'healthy' ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : s.status === 'degraded' ? 'bg-gradient-to-r from-amber-500 to-orange-400' : 'bg-gradient-to-r from-red-500 to-rose-400'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${uptimeVal}%` }}
                            transition={{ duration: 1, ease: 'easeOut' as const, delay: 0.3 }}
                          />
                        </div>
                        <span className='text-[10px] text-muted-foreground shrink-0'>{s.uptime}</span>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className={`text-sm font-mono ${s.status === 'degraded' ? 'text-amber-600' : s.status === 'down' ? 'text-red-500' : ''}`}>{s.latency}</p>
                      <p className='text-[10px] text-muted-foreground'>latency</p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity Timeline with avatars */}
        <motion.div variants={item} className='lg:col-span-2'>
          <Card className='hover:shadow-xl hover:shadow-primary/8 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80 overflow-hidden relative rounded-xl'>
            <div className='absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500/80 to-orange-400/80' />
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm flex items-center gap-2'><Clock className='h-4 w-4 text-amber-500' /> Recent Activity</CardTitle>
                <Button variant='ghost' size='sm' className='gap-1.5 text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={() => setCurrentView('admin-audit')}>
                  View All <ArrowUpRight className='h-3 w-3' />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className='relative'>
                <div className='absolute left-[15px] top-2 bottom-2 w-px bg-border' />
                <div className='space-y-4'>
                  {recentActivity.map((a, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.06, duration: 0.3 }}
                      className='flex items-start gap-3 relative'
                    >
                      <Avatar className='h-8 w-8 z-10 border-2 border-background'>
                        <AvatarFallback className={`text-[10px] font-medium ${a.type === 'warning' ? 'bg-amber-500/10 text-amber-600' : a.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-violet-500/10 text-violet-600'}`}>
                          {a.user.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className='flex-1 min-w-0 pt-0.5'>
                        <p className='text-sm font-medium'>{a.action}</p>
                        <p className='text-xs text-muted-foreground'>{a.detail}</p>
                      </div>
                      <span className='text-xs text-muted-foreground shrink-0 pt-0.5'>{a.time}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}