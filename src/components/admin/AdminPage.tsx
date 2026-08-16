'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app-store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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

const systemMetrics = [
  { label: 'Active Users', value: '1,247', change: '+12%', trend: 'up' as const, icon: <Users className='h-5 w-5' />, color: 'emerald', sparkline: [40, 55, 45, 60, 52, 68, 72, 65, 78, 82] },
  { label: 'Active Meetings', value: '34', change: '+8%', trend: 'up' as const, icon: <Video className='h-5 w-5' />, color: 'violet', sparkline: [20, 25, 18, 30, 28, 32, 35, 30, 34, 38] },
  { label: 'Organizations', value: '23', change: '+3', trend: 'up' as const, icon: <Building2 className='h-5 w-5' />, color: 'amber', sparkline: [15, 16, 17, 18, 18, 19, 20, 21, 22, 23] },
  { label: 'Storage Used', value: '48.2 GB', change: '-3%', trend: 'down' as const, icon: <HardDrive className='h-5 w-5' />, color: 'rose', sparkline: [52, 51, 50, 49, 50, 49, 48, 49, 48, 48] },
]

const colorMap: Record<string, { iconBg: string; iconText: string; trendUp: string; trendDown: string; sparkColor: string }> = {
  emerald: { iconBg: 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5', iconText: 'text-emerald-600', trendUp: 'text-emerald-600', trendDown: 'text-red-500', sparkColor: 'bg-emerald-500' },
  violet: { iconBg: 'bg-gradient-to-br from-violet-500/10 to-violet-500/5', iconText: 'text-violet-600', trendUp: 'text-violet-600', trendDown: 'text-red-500', sparkColor: 'bg-violet-500' },
  amber: { iconBg: 'bg-gradient-to-br from-amber-500/10 to-amber-500/5', iconText: 'text-amber-600', trendUp: 'text-amber-600', trendDown: 'text-red-500', sparkColor: 'bg-amber-500' },
  rose: { iconBg: 'bg-gradient-to-br from-rose-500/10 to-rose-500/5', iconText: 'text-rose-600', trendUp: 'text-emerald-600', trendDown: 'text-rose-600', sparkColor: 'bg-rose-500' },
}

const systemHealth = [
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

const overallStatus = systemHealth.every(s => s.status === 'healthy') ? 'green' : systemHealth.some(s => s.status === 'down') ? 'red' : 'yellow'

const statusBannerConfig = {
  green: { gradient: 'from-emerald-500/5 via-cyan-500/5 to-teal-500/5', border: 'border-emerald-200/50 dark:border-emerald-800/30', badgeBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', text: 'All Systems Operational', dotColor: 'bg-emerald-500' },
  yellow: { gradient: 'from-amber-500/5 via-orange-500/5 to-yellow-500/5', border: 'border-amber-200/50 dark:border-amber-800/30', badgeBg: 'bg-amber-500/10 text-amber-600 border-amber-200', text: 'Partial Degradation', dotColor: 'bg-amber-500' },
  red: { gradient: 'from-red-500/5 via-rose-500/5 to-pink-500/5', border: 'border-red-200/50 dark:border-red-800/30', badgeBg: 'bg-red-500/10 text-red-500 border-red-200', text: 'Service Outage Detected', dotColor: 'bg-red-500' },
}

const recentActivity = [
  { action: 'New organization registered', detail: 'TechStart Inc.', time: '2 min ago', type: 'info' as const, user: 'System' },
  { action: 'User account created', detail: 'john@techstart.com', time: '5 min ago', type: 'info' as const, user: 'Sarah Chen' },
  { action: 'Failed login attempt', detail: 'admin@corp.com (3rd attempt)', time: '12 min ago', type: 'warning' as const, user: 'System' },
  { action: 'Meeting recording processed', detail: 'AI summary generated', time: '18 min ago', type: 'success' as const, user: 'AI Engine' },
  { action: 'Storage threshold alert', detail: 'Org #12 at 90% capacity', time: '25 min ago', type: 'warning' as const, user: 'System' },
  { action: 'API rate limit triggered', detail: 'IP 192.168.1.45', time: '30 min ago', type: 'warning' as const, user: 'System' },
]

const quickActions = [
  { label: 'Manage Users', view: 'admin-users' as const, icon: <Users className='h-4 w-4' />, count: '1,247 users', color: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600' },
  { label: 'Organizations', view: 'admin-orgs' as const, icon: <Building2 className='h-4 w-4' />, count: '23 orgs', color: 'from-violet-500/10 to-violet-500/5 text-violet-600' },
  { label: 'Security', view: 'admin-security' as const, icon: <Shield className='h-4 w-4' />, count: '2 alerts', color: 'from-rose-500/10 to-rose-500/5 text-rose-600' },
  { label: 'Audit Log', view: 'admin-audit' as const, icon: <FileText className='h-4 w-4' />, count: '1.2k entries', color: 'from-amber-500/10 to-amber-500/5 text-amber-600' },
  { label: 'System Health', view: 'admin-system' as const, icon: <Server className='h-4 w-4' />, count: '5 services', color: 'from-cyan-500/10 to-cyan-500/5 text-cyan-600' },
  { label: 'View Reports', view: 'dashboard' as const, icon: <BarChart3 className='h-4 w-4' />, count: 'Analytics', color: 'from-fuchsia-500/10 to-fuchsia-500/5 text-fuchsia-600' },
]

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
          transition={{ duration: 0.4, delay: i * 0.03, ease: 'easeOut' }}
          className={`w-[5px] rounded-sm ${color} opacity-70 hover:opacity-100 transition-opacity`}
        />
      ))}
    </div>
  )
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } }

export default function AdminPage() {
  const { setCurrentView } = useAppStore()
  const banner = statusBannerConfig[overallStatus]

  return (
    <motion.div className='space-y-6' variants={container} initial='hidden' animate='show'>
      {/* Dynamic system health banner - green/yellow/red */}
      <motion.div variants={item}>
        <Card className={`bg-gradient-to-r ${banner.gradient} ${banner.border} hover:shadow-lg hover:shadow-primary/5 transition-all duration-300`}>
          <CardContent className='p-5 flex items-center gap-4'>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${overallStatus === 'green' ? 'from-emerald-500 to-cyan-600' : overallStatus === 'yellow' ? 'from-amber-500 to-orange-600' : 'from-red-500 to-rose-600'} flex items-center justify-center shrink-0 shadow-lg ${overallStatus === 'green' ? 'shadow-emerald-500/20' : overallStatus === 'yellow' ? 'shadow-amber-500/20' : 'shadow-red-500/20'}`}>
              {overallStatus === 'green' ? <Shield className='h-6 w-6 text-white' /> : overallStatus === 'yellow' ? <AlertTriangle className='h-6 w-6 text-white' /> : <XCircle className='h-6 w-6 text-white' />}
            </div>
            <div className='flex-1 min-w-0'>
              <h2 className='font-semibold flex items-center gap-2'>Administration Console</h2>
              <p className='text-sm text-muted-foreground'>Manage users, organizations, security policies, and system configuration.</p>
            </div>
            <div className='hidden sm:flex items-center gap-2 shrink-0'>
              <div className={`w-2.5 h-2.5 rounded-full ${banner.dotColor} animate-pulse`} />
              <span className={`text-xs font-medium ${overallStatus === 'green' ? 'text-emerald-600' : overallStatus === 'yellow' ? 'text-amber-600' : 'text-red-500'}`}>{banner.text}</span>
            </div>
            <Badge variant='outline' className='gap-1.5 shrink-0'><Cpu className='h-3 w-3' /> Super Admin</Badge>
          </CardContent>
        </Card>
      </motion.div>

      {/* Metrics with bar sparklines and trend arrows */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {systemMetrics.map((m) => {
          const cm = colorMap[m.color]
          return (
            <motion.div key={m.label} variants={item}>
              <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5 border border-border/50 hover:border-primary/30 bg-gradient-to-br from-card to-card/80'>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between mb-3'>
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${cm.iconBg} ${cm.iconText}`}>{m.icon}</div>
                    <span className={`text-xs font-semibold flex items-center gap-0.5 ${m.trend === 'up' ? cm.trendUp : cm.trendDown}`}>
                      {m.trend === 'up' ? <TrendingUp className='h-3 w-3' /> : <TrendingDown className='h-3 w-3' />}
                      {m.change}
                    </span>
                  </div>
                  <p className='text-2xl font-bold tracking-tight'>{m.value}</p>
                  <div className='flex items-center justify-between mt-2'>
                    <p className='text-xs text-muted-foreground'>{m.label}</p>
                    <MiniBarChart data={m.sparkline} color={cm.sparkColor} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Quick Actions Grid */}
        <motion.div variants={item}>
          <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm flex items-center gap-2'><Zap className='h-4 w-4 text-amber-500' /> Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 gap-2'>
                {quickActions.map(a => (
                  <motion.button
                    key={a.label}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setCurrentView(a.view)}
                    className='flex flex-col items-center gap-2 p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-all duration-200 text-center group'
                  >
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${a.color} transition-transform group-hover:scale-110`}>{a.icon}</div>
                    <div>
                      <p className='text-xs font-medium'>{a.label}</p>
                      <p className='text-[10px] text-muted-foreground'>{a.count}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* System Health with dynamic status */}
        <motion.div variants={item}>
          <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm flex items-center gap-2'><Activity className='h-4 w-4 text-emerald-500' /> System Health</CardTitle>
                <Badge variant='outline' className={`gap-1.5 text-[10px] ${banner.badgeBg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${banner.dotColor} ${overallStatus !== 'green' ? 'animate-pulse' : ''}`} />{systemHealth.filter(s => s.status === 'healthy').length}/{systemHealth.length} Healthy
                </Badge>
              </div>
            </CardHeader>
            <CardContent className='space-y-2'>
              {systemHealth.map(s => (
                <div key={s.service} className={`flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors ${s.status === 'degraded' ? 'bg-amber-500/5 border border-amber-200/50 dark:border-amber-800/30' : s.status === 'down' ? 'bg-red-500/5 border border-red-200/50' : ''}`}>
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusDotColor[s.status]} ${s.status !== 'healthy' ? 'animate-pulse' : ''}`} />
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium'>{s.service}</p>
                    <p className='text-xs text-muted-foreground'>Uptime: {s.uptime}</p>
                  </div>
                  <div className='text-right'>
                    <p className={`text-sm font-mono ${s.status === 'degraded' ? 'text-amber-600' : s.status === 'down' ? 'text-red-500' : ''}`}>{s.latency}</p>
                    <p className='text-[10px] text-muted-foreground'>latency</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity Timeline with avatars */}
        <motion.div variants={item} className='lg:col-span-2'>
          <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
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