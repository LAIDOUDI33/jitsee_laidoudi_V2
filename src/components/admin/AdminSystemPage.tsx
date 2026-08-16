'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Server,
  Cpu,
  HardDrive,
  MemoryStick,
  Activity,
  Database,
  Globe,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  Zap,
  Clock,
  ArrowUpRight,
  Settings2,
} from 'lucide-react'

interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  uptime: string
  responseTime: string
  lastIncident: string
  icon: React.ReactNode
}

const services: ServiceStatus[] = [
  { name: 'API Gateway', status: 'healthy', uptime: '99.98%', responseTime: '12ms', lastIncident: '14 days ago', icon: <Globe className='h-5 w-5' /> },
  { name: 'AI Engine', status: 'healthy', uptime: '99.95%', responseTime: '245ms', lastIncident: '7 days ago', icon: <Zap className='h-5 w-5' /> },
  { name: 'Database (SQLite)', status: 'healthy', uptime: '99.99%', responseTime: '3ms', lastIncident: '30 days ago', icon: <Database className='h-5 w-5' /> },
  { name: 'WebSocket Server', status: 'healthy', uptime: '99.97%', responseTime: '8ms', lastIncident: '5 days ago', icon: <Wifi className='h-5 w-5' /> },
  { name: 'File Storage', status: 'degraded', uptime: '99.90%', responseTime: '120ms', lastIncident: '1 hour ago', icon: <HardDrive className='h-5 w-5' /> },
  { name: 'Auth Service', status: 'healthy', uptime: '99.99%', responseTime: '15ms', lastIncident: '21 days ago', icon: <Settings2 className='h-5 w-5' /> },
]

const metrics = [
  { label: 'CPU Usage', value: 34, icon: <Cpu className='h-4 w-4' />, color: 'text-blue-600', bgColor: 'bg-blue-500/10' },
  { label: 'Memory', value: 62, icon: <MemoryStick className='h-4 w-4' />, color: 'text-violet-600', bgColor: 'bg-violet-500/10' },
  { label: 'Disk Usage', value: 48, icon: <HardDrive className='h-4 w-4' />, color: 'text-emerald-600', bgColor: 'bg-emerald-500/10' },
  { label: 'Network I/O', value: 25, icon: <Wifi className='h-4 w-4' />, color: 'text-amber-600', bgColor: 'bg-amber-500/10' },
]

const recentIncidents = [
  { title: 'File Storage Latency Spike', status: 'investigating', time: '1 hour ago', severity: 'warning' },
  { title: 'AI Engine Timeout (resolved)', status: 'resolved', time: '7 days ago', severity: 'info' },
  { title: 'Database Connection Pool Exhaustion', status: 'resolved', time: '14 days ago', severity: 'warning' },
  { title: 'Planned Maintenance', status: 'completed', time: '30 days ago', severity: 'info' },
]

export default function AdminSystemPage() {
  return (
    <div className='space-y-6'>
      {/* System overview banner */}
      <Card className='bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border-cyan-200/50 dark:border-cyan-800/30'>
        <CardContent className='p-5 flex items-center gap-4'>
          <div className='w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0'>
            <Server className='h-6 w-6 text-white' />
          </div>
          <div className='flex-1'>
            <h2 className='font-semibold'>System Status: <span className='text-amber-600'>Partial Degradation</span></h2>
            <p className='text-sm text-muted-foreground'>File storage experiencing elevated latency. Team is investigating.</p>
          </div>
          <Badge variant='outline' className='bg-amber-500/10 text-amber-600 border-amber-200 shrink-0'>
            <AlertTriangle className='h-3 w-3 mr-1' /> Degraded
          </Badge>
        </CardContent>
      </Card>

      {/* Resource metrics */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {metrics.map(m => (
          <Card key={m.label}>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between mb-3'>
                <div className='flex items-center gap-2'><div className={`p-1.5 rounded-md ${m.bgColor} ${m.color}`}>{m.icon}</div><span className='text-sm font-medium'>{m.label}</span></div>
                <span className='text-lg font-bold'>{m.value}%</span>
              </div>
              <Progress value={m.value} className='h-2' />
              <p className='text-[10px] text-muted-foreground mt-1.5'>{m.value < 60 ? 'Normal' : m.value < 80 ? 'Moderate' : 'High'} utilization</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Service status */}
        <Card>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm flex items-center gap-2'><Activity className='h-4 w-4' /> Service Status</CardTitle>
              <Button variant='ghost' size='sm' className='gap-1.5 text-xs'><RefreshCw className='h-3 w-3' /> Refresh</Button>
            </div>
          </CardHeader>
          <CardContent className='space-y-3'>
            {services.map(s => (
              <div key={s.name} className='flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors'>
                <div className={`${s.status === 'healthy' ? 'text-emerald-500' : s.status === 'degraded' ? 'text-amber-500' : 'text-red-500'}`}>{s.icon}</div>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2'><p className='text-sm font-medium'>{s.name}</p><Badge variant='outline' className={`text-[10px] ${s.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-600' : s.status === 'degraded' ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-500'}`}>{s.status}</Badge></div>
                  <p className='text-xs text-muted-foreground'>Last incident: {s.lastIncident}</p>
                </div>
                <div className='text-right shrink-0'><p className='text-sm font-mono'>{s.responseTime}</p><p className='text-[10px] text-muted-foreground'>{s.uptime}</p></div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Incidents & maintenance */}
        <Card>
          <CardHeader className='pb-3'><CardTitle className='text-sm flex items-center gap-2'><AlertTriangle className='h-4 w-4' /> Recent Incidents</CardTitle></CardHeader>
          <CardContent className='space-y-3'>
            {recentIncidents.map((inc, i) => (
              <div key={i} className='flex items-start gap-3 p-3 rounded-lg border'>
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${inc.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium'>{inc.title}</p>
                  <div className='flex items-center gap-2 mt-1'>
                    <Badge variant='outline' className={`text-[10px] capitalize ${inc.status === 'investigating' ? 'bg-amber-500/10 text-amber-600' : inc.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-zinc-500/10 text-zinc-500'}`}>{inc.status}</Badge>
                    <span className='text-[10px] text-muted-foreground flex items-center gap-1'><Clock className='h-2.5 w-2.5' />{inc.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* System info */}
      <Card>
        <CardHeader className='pb-3'><CardTitle className='text-sm'>System Information</CardTitle></CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
            <div><p className='text-muted-foreground text-xs'>Platform Version</p><p className='font-medium'>v2.0.0-beta.4</p></div>
            <div><p className='text-muted-foreground text-xs'>Node.js</p><p className='font-medium'>v22.x (Bun)</p></div>
            <div><p className='text-muted-foreground text-xs'>Database</p><p className='font-medium'>SQLite 3.x</p></div>
            <div><p className='text-muted-foreground text-xs'>Runtime</p><p className='font-medium'>Next.js 16</p></div>
            <div><p className='text-muted-foreground text-xs'>AI Provider</p><p className='font-medium'>z-ai-web-dev-sdk</p></div>
            <div><p className='text-muted-foreground text-xs'>Deployment</p><p className='font-medium'>Production</p></div>
            <div><p className='text-muted-foreground text-xs'>Last Deploy</p><p className='font-medium'>Jan 14, 2025</p></div>
            <div><p className='text-muted-foreground text-xs'>Environment</p><p className='font-medium'>Cloud Sandbox</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
