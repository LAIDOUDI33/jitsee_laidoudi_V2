'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  XCircle,
  Wifi,
  Zap,
  Clock,
  RotateCcw,
  Terminal,
  ChevronDown,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'

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
  { name: 'Auth Service', status: 'healthy', uptime: '99.99%', responseTime: '15ms', lastIncident: '21 days ago', icon: <Server className='h-5 w-5' /> },
]

const metrics = [
  { label: 'CPU Usage', value: 34, icon: <Cpu className='h-4 w-4' />, color: '#10b981', bgColor: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600', desc: 'Normal utilization' },
  { label: 'Memory', value: 62, icon: <MemoryStick className='h-4 w-4' />, color: '#f59e0b', bgColor: 'from-amber-500/10 to-amber-500/5 text-amber-600', desc: 'Moderate utilization' },
  { label: 'Disk Usage', value: 48, icon: <HardDrive className='h-4 w-4' />, color: '#10b981', bgColor: 'from-cyan-500/10 to-cyan-500/5 text-cyan-600', desc: 'Normal utilization' },
  { label: 'Network I/O', value: 25, icon: <Wifi className='h-4 w-4' />, color: '#10b981', bgColor: 'from-violet-500/10 to-violet-500/5 text-violet-600', desc: 'Normal utilization' },
]

const recentIncidents = [
  { title: 'File Storage Latency Spike', status: 'investigating', time: '1 hour ago', severity: 'warning' as const },
  { title: 'AI Engine Timeout (resolved)', status: 'resolved', time: '7 days ago', severity: 'info' as const },
  { title: 'Database Connection Pool Exhaustion', status: 'resolved', time: '14 days ago', severity: 'warning' as const },
  { title: 'Planned Maintenance', status: 'completed', time: '30 days ago', severity: 'info' as const },
]

const mockLogs = [
  { time: '14:32:05', level: 'INFO', service: 'api', message: 'GET /api/v1/meetings 200 12ms' },
  { time: '14:32:03', level: 'INFO', service: 'ws', message: 'Client connected: user_4521' },
  { time: '14:31:58', level: 'WARN', service: 'storage', message: 'Upload latency elevated: 120ms (threshold: 100ms)' },
  { time: '14:31:55', level: 'INFO', service: 'api', message: 'POST /api/v1/auth/login 200 15ms' },
  { time: '14:31:50', level: 'INFO', service: 'ai', message: 'Summary generated for meeting_892 (2.1s)' },
  { time: '14:31:45', level: 'ERROR', service: 'storage', message: 'Failed to write chunk: ECONNREFUSED' },
  { time: '14:31:40', level: 'INFO', service: 'auth', message: 'Token refreshed for sarah@alvision.ai' },
  { time: '14:31:38', level: 'INFO', service: 'api', message: 'GET /api/v1/stats 200 3ms' },
]

function CircularGauge({ value, color, size = 96, strokeWidth = 6 }: { value: number; color: string; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className='relative' style={{ width: size, height: size }}>
      <svg width={size} height={size} className='-rotate-90'>
        <circle cx={size / 2} cy={size / 2} r={radius} fill='none' stroke='currentColor' strokeWidth={strokeWidth} className='text-muted/30' />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill='none' stroke={color} strokeWidth={strokeWidth} strokeLinecap='round'
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className='absolute inset-0 flex items-center justify-center'>
        <span className='text-lg font-bold' style={{ color }}>{value}%</span>
      </div>
    </div>
  )
}

const logLevelColors: Record<string, string> = {
  INFO: 'text-cyan-600',
  WARN: 'text-amber-600',
  ERROR: 'text-red-500',
}

const logLevelBg: Record<string, string> = {
  INFO: 'bg-cyan-500/10',
  WARN: 'bg-amber-500/10',
  ERROR: 'bg-red-500/10',
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } }

export default function AdminSystemPage() {
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [logsExpanded, setLogsExpanded] = useState(false)

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      // mock refresh
    }, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  const restartService = (name: string) => {
    toast.success(`Restarting ${name}...`)
  }

  const healthyCount = services.filter(s => s.status === 'healthy').length

  return (
    <motion.div className='space-y-6' variants={container} initial='hidden' animate='show'>
      {/* System overview banner with dynamic status */}
      <motion.div variants={item}>
        <Card className={`hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 ${healthyCount === services.length ? 'bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 border-emerald-200/50 dark:border-emerald-800/30' : healthyCount >= 4 ? 'bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-200/50 dark:border-amber-800/30' : 'bg-gradient-to-br from-red-500/5 to-rose-500/5 border-red-200/50 dark:border-red-800/30'}`}>
          <CardContent className='p-5 flex flex-col sm:flex-row items-center gap-4'>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${healthyCount === services.length ? 'bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-emerald-500/20' : healthyCount >= 4 ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20' : 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/20'}`}>
              {healthyCount === services.length ? <CheckCircle2 className='h-6 w-6 text-white' /> : <AlertTriangle className='h-6 w-6 text-white' />}
            </div>
            <div className='flex-1 text-center sm:text-left'>
              <h2 className='font-semibold flex items-center justify-center sm:justify-start gap-2'>
                System Status: <span className={healthyCount === services.length ? 'text-emerald-600' : healthyCount >= 4 ? 'text-amber-600' : 'text-red-500'}>{healthyCount === services.length ? 'All Healthy' : 'Partial Degradation'}</span>
              </h2>
              <p className='text-sm text-muted-foreground'>{healthyCount === services.length ? 'All services are running normally.' : 'File storage experiencing elevated latency. Team is investigating.'}</p>
            </div>
            <Badge variant='outline' className={`shrink-0 gap-1 ${healthyCount === services.length ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-amber-500/10 text-amber-600 border-amber-200'}`}>
              {healthyCount === services.length ? <CheckCircle2 className='h-3 w-3' /> : <AlertTriangle className='h-3 w-3 animate-pulse' />}{healthyCount}/{services.length} Healthy
            </Badge>
          </CardContent>
        </Card>
      </motion.div>

      {/* Circular gauges for CPU, Memory, Disk */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {metrics.map(m => (
          <motion.div key={m.label} variants={item}>
            <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5 border border-border/50 hover:border-primary/30 bg-gradient-to-br from-card to-card/80'>
              <CardContent className='p-4 flex flex-col items-center'>
                <div className='flex items-center gap-2 mb-3 self-start'>
                  <div className={`p-1.5 rounded-md bg-gradient-to-br ${m.bgColor}`}>{m.icon}</div>
                  <span className='text-sm font-medium'>{m.label}</span>
                </div>
                <CircularGauge value={m.value} color={m.color} />
                <p className='text-[10px] text-muted-foreground mt-2'>{m.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Service status with restart buttons - FIXED: added 'group' class */}
        <motion.div variants={item}>
          <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm flex items-center gap-2'><Activity className='h-4 w-4 text-emerald-500' /> Service Status</CardTitle>
                <div className='flex items-center gap-2'>
                  <div className='flex items-center gap-1.5'>
                    <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} className='scale-75' />
                    <Label className='text-[10px] text-muted-foreground'>Auto</Label>
                  </div>
                  <Button variant='ghost' size='sm' className='gap-1.5 text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={() => toast.info('Services refreshed')}><RefreshCw className='h-3 w-3' /> Refresh</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className='space-y-2'>
              {services.map((s, i) => (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                  className={`group flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-all duration-200 ${s.status === 'degraded' ? 'bg-amber-500/5 border-amber-200/50 dark:border-amber-800/30' : s.status === 'down' ? 'bg-red-500/5 border-red-200/50' : ''}`}
                >
                  <div className={`${s.status === 'healthy' ? 'text-emerald-500' : s.status === 'degraded' ? 'text-amber-500' : 'text-red-500'}`}>{s.icon}</div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <p className='text-sm font-medium'>{s.name}</p>
                      <Badge variant='outline' className={`text-[10px] gap-1 ${s.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : s.status === 'degraded' ? 'bg-amber-500/10 text-amber-600 border-amber-200' : 'bg-red-500/10 text-red-500 border-red-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'healthy' ? 'bg-emerald-500' : s.status === 'degraded' ? 'bg-amber-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
                        {s.status}
                      </Badge>
                    </div>
                    <p className='text-xs text-muted-foreground'>Last incident: {s.lastIncident}</p>
                  </div>
                  <div className='text-right shrink-0'>
                    <p className={`text-sm font-mono ${s.status === 'degraded' ? 'text-amber-600' : s.status === 'down' ? 'text-red-500' : ''}`}>{s.responseTime}</p>
                    <p className='text-[10px] text-muted-foreground'>{s.uptime}</p>
                  </div>
                  <Button variant='ghost' size='icon' className='h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 hover:scale-[1.1] transition-all' onClick={() => restartService(s.name)} title={`Restart ${s.name}`}>
                    <RotateCcw className='h-3.5 w-3.5' />
                  </Button>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Incidents timeline */}
        <motion.div variants={item}>
          <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
            <CardHeader className='pb-3'><CardTitle className='text-sm flex items-center gap-2'><AlertTriangle className='h-4 w-4 text-amber-500' /> Incident Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className='relative'>
                <div className='absolute left-[15px] top-2 bottom-2 w-px bg-border' />
                <div className='space-y-4'>
                  {recentIncidents.map((inc, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.3 }}
                      className='flex items-start gap-3 relative'
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 border-background ${inc.severity === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-cyan-500/10 text-cyan-500'}`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${inc.severity === 'warning' ? 'bg-amber-500' : 'bg-cyan-500'}`} />
                      </div>
                      <div className='flex-1 min-w-0 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors'>
                        <p className='text-sm font-medium'>{inc.title}</p>
                        <div className='flex items-center gap-2 mt-1.5'>
                          <Badge variant='outline' className={`text-[10px] capitalize ${inc.status === 'investigating' ? 'bg-amber-500/10 text-amber-600 border-amber-200' : inc.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-zinc-500/10 text-zinc-500 border-zinc-200'}`}>
                            {inc.status === 'investigating' && <AlertTriangle className='h-3 w-3 animate-pulse' />}{inc.status}
                          </Badge>
                          <span className='text-[10px] text-muted-foreground flex items-center gap-1'><Clock className='h-2.5 w-2.5' />{inc.time}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Real-time log viewer (mock) */}
      <motion.div variants={item}>
        <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm flex items-center gap-2'><Terminal className='h-4 w-4 text-amber-500' /> System Logs</CardTitle>
              <div className='flex items-center gap-2'>
                <Badge variant='outline' className='text-[10px] gap-1 text-emerald-600 border-emerald-200'><span className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse' />Live</Badge>
                <Button variant='ghost' size='sm' className='gap-1 text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={() => setLogsExpanded(!logsExpanded)}>
                  {logsExpanded ? 'Collapse' : 'Expand'} <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${logsExpanded ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`bg-zinc-950 dark:bg-zinc-900 rounded-lg p-4 font-mono text-xs overflow-hidden ${logsExpanded ? 'max-h-[400px]' : 'max-h-[200px]'} overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:bg-zinc-600 [&::-webkit-scrollbar-thumb]:rounded-full`}>
              {mockLogs.map((log, i) => (
                <div key={i} className={`flex items-start gap-3 py-0.5 px-1 rounded ${log.level === 'ERROR' ? 'bg-red-500/5' : ''}`}>
                  <span className='text-zinc-500 shrink-0'>{log.time}</span>
                  <span className={`shrink-0 w-12 font-semibold px-1 rounded text-center ${logLevelColors[log.level]}`}>[{log.level}]</span>
                  <span className='text-zinc-400 shrink-0'>{log.service}:</span>
                  <span className='text-zinc-300'>{log.message}</span>
                </div>
              ))}
              <div className='flex items-center gap-1 text-zinc-500 mt-1'>
                <span className='w-2 h-4 bg-emerald-500 animate-pulse' /> Waiting for new logs...
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* System info */}
      <motion.div variants={item}>
        <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
          <CardHeader className='pb-3'><CardTitle className='text-sm flex items-center gap-2'><Server className='h-4 w-4 text-muted-foreground' /> System Information</CardTitle></CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
              {[
                { label: 'Platform Version', value: 'v2.0.0-beta.4' },
                { label: 'Node.js', value: 'v22.x (Bun)' },
                { label: 'Database', value: 'SQLite 3.x' },
                { label: 'Runtime', value: 'Next.js 16' },
                { label: 'AI Provider', value: 'z-ai-web-dev-sdk' },
                { label: 'Deployment', value: 'Production' },
                { label: 'Last Deploy', value: 'Jan 14, 2025' },
                { label: 'Environment', value: 'Cloud Sandbox' },
              ].map(info => (
                <div key={info.label} className='p-2 rounded-lg hover:bg-muted/30 transition-colors'><p className='text-muted-foreground text-xs'>{info.label}</p><p className='font-medium'>{info.value}</p></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}