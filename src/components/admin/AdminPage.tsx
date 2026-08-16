'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app-store'
import {
  Shield,
  Users,
  Building2,
  Server,
  Activity,
  AlertTriangle,
  TrendingUp,
  Cpu,
  HardDrive,
  Video,
  FileText,
  ArrowUpRight,
  Clock,
  CheckCircle2,
} from 'lucide-react'

const systemMetrics = [
  { label: 'Active Users', value: '1,247', change: '+12%', icon: <Users className='h-5 w-5' />, color: 'bg-blue-500/10 text-blue-600' },
  { label: 'Active Meetings', value: '34', change: '+8%', icon: <Video className='h-5 w-5' />, color: 'bg-green-500/10 text-green-600' },
  { label: 'Organizations', value: '23', change: '+3', icon: <Building2 className='h-5 w-5' />, color: 'bg-violet-500/10 text-violet-600' },
  { label: 'Storage Used', value: '48.2 GB', change: '12%', icon: <HardDrive className='h-5 w-5' />, color: 'bg-amber-500/10 text-amber-600' },
]

const systemHealth = [
  { service: 'API Server', status: 'healthy', uptime: '99.98%', latency: '12ms' },
  { service: 'AI Service', status: 'healthy', uptime: '99.95%', latency: '245ms' },
  { service: 'Database', status: 'healthy', uptime: '99.99%', latency: '3ms' },
  { service: 'WebSocket Server', status: 'healthy', uptime: '99.97%', latency: '8ms' },
  { service: 'File Storage', status: 'healthy', uptime: '99.99%', latency: '45ms' },
]

const recentActivity = [
  { action: 'New organization registered', detail: 'TechStart Inc.', time: '2 min ago', type: 'info' },
  { action: 'User account created', detail: 'john@techstart.com', time: '5 min ago', type: 'info' },
  { action: 'Failed login attempt', detail: 'admin@corp.com (3rd attempt)', time: '12 min ago', type: 'warning' },
  { action: 'Meeting recording processed', detail: 'AI summary generated', time: '18 min ago', type: 'success' },
  { action: 'Storage threshold alert', detail: 'Org #12 at 90% capacity', time: '25 min ago', type: 'warning' },
  { action: 'API rate limit triggered', detail: 'IP 192.168.1.45', time: '30 min ago', type: 'warning' },
]

const quickActions = [
  { label: 'Manage Users', view: 'admin-users' as const, icon: <Users className='h-4 w-4' />, count: '1,247 users' },
  { label: 'Organizations', view: 'admin-orgs' as const, icon: <Building2 className='h-4 w-4' />, count: '23 orgs' },
  { label: 'Security', view: 'admin-security' as const, icon: <Shield className='h-4 w-4' />, count: '2 alerts' },
  { label: 'Audit Log', view: 'admin-audit' as const, icon: <FileText className='h-4 w-4' />, count: '1.2k entries' },
  { label: 'System Health', view: 'admin-system' as const, icon: <Server className='h-4 w-4' />, count: '5 services' },
]

export default function AdminPage() {
  const { setCurrentView } = useAppStore()

  return (
    <div className='space-y-6'>
      {/* Admin banner */}
      <Card className='bg-gradient-to-r from-violet-500/5 via-blue-500/5 to-cyan-500/5 border-violet-200/50 dark:border-violet-800/30'>
        <CardContent className='p-5 flex items-center gap-4'>
          <div className='w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shrink-0'>
            <Shield className='h-6 w-6 text-white' />
          </div>
          <div className='flex-1'>
            <h2 className='font-semibold flex items-center gap-2'>Administration Console</h2>
            <p className='text-sm text-muted-foreground'>Manage users, organizations, security policies, and system configuration.</p>
          </div>
          <Badge variant='outline' className='gap-1 shrink-0'><Cpu className='h-3 w-3' /> Super Admin</Badge>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {systemMetrics.map(m => (
          <Card key={m.label}>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between mb-3'>
                <div className={`p-2 rounded-lg ${m.color}`}>{m.icon}</div>
                <span className='text-xs text-emerald-600 font-medium flex items-center gap-0.5'><ArrowUpRight className='h-3 w-3' />{m.change}</span>
              </div>
              <p className='text-2xl font-bold'>{m.value}</p>
              <p className='text-xs text-muted-foreground'>{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Quick actions */}
        <Card>
          <CardHeader className='pb-3'><CardTitle className='text-sm'>Quick Actions</CardTitle></CardHeader>
          <CardContent className='space-y-2'>
            {quickActions.map(a => (
              <button
                key={a.label}
                onClick={() => setCurrentView(a.view)}
                className='w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors text-left group'
              >
                <div className='p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors'>{a.icon}</div>
                <div className='flex-1'><p className='text-sm font-medium'>{a.label}</p><p className='text-xs text-muted-foreground'>{a.count}</p></div>
                <ArrowUpRight className='h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity' />
              </button>
            ))}
          </CardContent>
        </Card>

        {/* System health */}
        <Card>
          <CardHeader className='pb-3'><CardTitle className='text-sm flex items-center gap-2'><Activity className='h-4 w-4' /> System Health</CardTitle></CardHeader>
          <CardContent className='space-y-3'>
            {systemHealth.map(s => (
              <div key={s.service} className='flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors'>
                <CheckCircle2 className='h-5 w-5 text-emerald-500 shrink-0' />
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium'>{s.service}</p>
                  <p className='text-xs text-muted-foreground'>Uptime: {s.uptime}</p>
                </div>
                <div className='text-right'><p className='text-sm font-mono'>{s.latency}</p><p className='text-[10px] text-muted-foreground'>latency</p></div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className='lg:col-span-2'>
          <CardHeader className='pb-3'><CardTitle className='text-sm flex items-center gap-2'><Clock className='h-4 w-4' /> Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {recentActivity.map((a, i) => (
                <div key={i} className='flex items-center gap-3'>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${a.type === 'warning' ? 'bg-amber-500' : a.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                  <div className='flex-1 min-w-0'><p className='text-sm'>{a.action}</p><p className='text-xs text-muted-foreground'>{a.detail}</p></div>
                  <span className='text-xs text-muted-foreground shrink-0'>{a.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
