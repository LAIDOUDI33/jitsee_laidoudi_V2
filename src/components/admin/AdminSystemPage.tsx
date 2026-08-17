'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { authFetch } from '@/lib/api'
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

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

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

interface ServiceData {
  name: string
  status: string
  uptime: number
  responseTime: number
  lastIncident: string | null
}

interface MetricData {
  label: string
  value: number
}

interface SystemInfoData {
  nodeVersion: string
  platform: string
  runtime: string
  deployment: string
  lastDeploy: string
  environment: string
}

interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  uptime: string
  responseTime: string
  lastIncident: string
  icon: React.ReactNode
}

// Icon mapping for service names
function getServiceIcon(name: string): React.ReactNode {
  const lower = name.toLowerCase()
  if (lower.includes('database') || lower.includes('db')) return <Database className='h-5 w-5' />
  if (lower.includes('api') || lower.includes('gateway')) return <Globe className='h-5 w-5' />
  if (lower.includes('auth')) return <Server className='h-5 w-5' />
  if (lower.includes('websocket') || lower.includes('ws')) return <Wifi className='h-5 w-5' />
  if (lower.includes('ai') || lower.includes('engine')) return <Zap className='h-5 w-5' />
  if (lower.includes('storage') || lower.includes('file')) return <HardDrive className='h-5 w-5' />
  return <Server className='h-5 w-5' />
}

// Metric config with icon/color/desc
const metricConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string; desc: string }> = {
  'CPU Usage': { icon: <Cpu className='h-4 w-4' />, color: '#10b981', bgColor: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600', desc: 'Normal utilization' },
  'Memory': { icon: <MemoryStick className='h-4 w-4' />, color: '#f59e0b', bgColor: 'from-amber-500/10 to-amber-500/5 text-amber-600', desc: 'Moderate utilization' },
  'Disk Usage': { icon: <HardDrive className='h-4 w-4' />, color: '#10b981', bgColor: 'from-cyan-500/10 to-cyan-500/5 text-cyan-600', desc: 'Normal utilization' },
  'Network I/O': { icon: <Wifi className='h-4 w-4' />, color: '#10b981', bgColor: 'from-violet-500/10 to-violet-500/5 text-violet-600', desc: 'Normal utilization' },
}

const recentIncidents = [
  { title: 'File Storage Latency Spike', status: 'investigating', time: '1 hour ago', severity: 'warning' as const },
  { title: 'AI Engine Timeout (resolved)', status: 'resolved', time: '7 days ago', severity: 'info' as const },
  { title: 'Database Connection Pool Exhaustion', status: 'resolved', time: '14 days ago', severity: 'warning' as const },
  { title: 'Planned Maintenance', status: 'completed', time: '30 days ago', severity: 'info' as const },
]

interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  source: string;
}

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
          transition={{ duration: 1, ease: 'easeOut' as const }}
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
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } } }

function formatLogTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function extractService(message: string): string {
  // Extract the [resource] tag from the message, e.g. "[meeting] meeting.create: ..."
  const match = message.match(/^\[([\w.-]+)\]/)
  return match ? match[1] : 'system'
}

export default function AdminSystemPage() {
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [logsExpanded, setLogsExpanded] = useState(false)
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [metrics, setMetrics] = useState<Array<{ label: string; value: number; icon: React.ReactNode; color: string; bgColor: string; desc: string }>>([])
  const [systemInfo, setSystemInfo] = useState<SystemInfoData | null>(null)
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(true)
  const [logsLoading, setLogsLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    try {
      const res = await authFetch('/api/v1/admin/system-logs')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setLogs(json.data?.logs || [])
    } catch {
      toast.error('Failed to load system logs')
    } finally {
      setLogsLoading(false)
    }
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const res = await authFetch('/api/v1/admin/system')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const data = json.data || {}

      // Map services
      const mappedServices: ServiceStatus[] = (data.services || []).map((s: ServiceData) => ({
        name: s.name,
        status: s.status === 'healthy' ? 'healthy' : s.status === 'degraded' ? 'degraded' : 'down',
        uptime: '99.9%',
        responseTime: `${s.responseTime}ms`,
        lastIncident: s.lastIncident || 'None',
        icon: getServiceIcon(s.name),
      }))
      setServices(mappedServices)

      // Map metrics — merge API value with existing icon/color/desc configs
      const mappedMetrics = (data.metrics || []).map((m: MetricData) => {
        const config = metricConfig[m.label] || { icon: <Cpu className='h-4 w-4' />, color: '#10b981', bgColor: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600', desc: 'Normal' }
        // Update desc based on value
        let desc = config.desc
        if (m.value >= 80) desc = 'High utilization'
        else if (m.value >= 60) desc = 'Moderate utilization'
        else desc = 'Normal utilization'
        // Update color based on value
        let color = config.color
        if (m.value >= 80) color = '#ef4444'
        else if (m.value >= 60) color = '#f59e0b'
        return { ...m, ...config, desc, color }
      })
      setMetrics(mappedMetrics)

      // System info
      if (data.systemInfo) {
        setSystemInfo(data.systemInfo)
      }
    } catch {
      toast.error('Failed to load system data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    fetchLogs()
  }, [fetchData, fetchLogs])

  // Auto-refresh when autoRefresh is true
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      fetchData()
      fetchLogs()
    }, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchData, fetchLogs])

  const restartService = (name: string) => {
    toast.success(`Restarting ${name}...`)
  }

  const healthyCount = services.filter(s => s.status === 'healthy').length
  const totalCount = services.length || 1

  // Build system info grid from API data
  const infoGrid = systemInfo ? [
    { label: 'Platform Version', value: 'v2.0.0-beta.4' },
    { label: 'Node.js', value: systemInfo.nodeVersion },
    { label: 'Runtime', value: systemInfo.runtime },
    { label: 'Deployment', value: systemInfo.deployment },
    { label: 'Platform', value: systemInfo.platform },
    { label: 'Environment', value: systemInfo.environment },
    { label: 'Last Deploy', value: systemInfo.lastDeploy },
    { label: 'AI Provider', value: 'z-ai-web-dev-sdk' },
  ] : [
    { label: 'Platform Version', value: 'v2.0.0-beta.4' },
    { label: 'Node.js', value: '—' },
    { label: 'Database', value: 'SQLite 3.x' },
    { label: 'Runtime', value: 'Next.js 16' },
    { label: 'AI Provider', value: 'z-ai-web-dev-sdk' },
    { label: 'Deployment', value: '—' },
    { label: 'Last Deploy', value: '—' },
    { label: 'Environment', value: '—' },
  ]

  if (loading) {
    return (
      <div className='space-y-6'>
        <Card className='border border-border/50'><CardContent className='p-5 flex items-center gap-4'><Skeleton className='h-12 w-12 rounded-xl' /><div className='flex-1 space-y-2'><Skeleton className='h-5 w-48' /><Skeleton className='h-4 w-72' /></div></CardContent></Card>
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className='border border-border/50'><CardContent className='p-4 flex flex-col items-center space-y-3'><Skeleton className='h-5 w-24' /><Skeleton className='h-24 w-24 rounded-full' /><Skeleton className='h-3 w-32' /></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div className='space-y-6' variants={container} initial='hidden' animate='show'>
      {/* System overview banner with dynamic status */}
      <motion.div variants={item}>
        <Card className={`hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 ${healthyCount === totalCount ? 'bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 border-emerald-200/50 dark:border-emerald-800/30' : healthyCount >= Math.ceil(totalCount * 0.7) ? 'bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-200/50 dark:border-amber-800/30' : 'bg-gradient-to-br from-red-500/5 to-rose-500/5 border-red-200/50 dark:border-red-800/30'}`}>
          <CardContent className='p-5 flex flex-col sm:flex-row items-center gap-4'>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${healthyCount === totalCount ? 'bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-emerald-500/20' : healthyCount >= Math.ceil(totalCount * 0.7) ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20' : 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/20'}`}>
              {healthyCount === totalCount ? <CheckCircle2 className='h-6 w-6 text-white' /> : <AlertTriangle className='h-6 w-6 text-white' />}
            </div>
            <div className='flex-1 text-center sm:text-left'>
              <h2 className='font-semibold flex items-center justify-center sm:justify-start gap-2'>
                System Status: <span className={healthyCount === totalCount ? 'text-emerald-600' : healthyCount >= Math.ceil(totalCount * 0.7) ? 'text-amber-600' : 'text-red-500'}>{healthyCount === totalCount ? 'All Healthy' : 'Partial Degradation'}</span>
              </h2>
              <p className='text-sm text-muted-foreground'>{healthyCount === totalCount ? 'All services are running normally.' : 'Some services experiencing issues. Team is investigating.'}</p>
            </div>
            <Badge variant='outline' className={`shrink-0 gap-1 ${healthyCount === totalCount ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-amber-500/10 text-amber-600 border-amber-200'}`}>
              {healthyCount === totalCount ? <CheckCircle2 className='h-3 w-3' /> : <AlertTriangle className='h-3 w-3 animate-pulse' />}{healthyCount}/{totalCount} Healthy
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
                  <Button variant='ghost' size='sm' className='gap-1.5 text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={() => { fetchData(); toast.info('Services refreshed') }}><RefreshCw className='h-3 w-3' /> Refresh</Button>
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

      {/* Real-time log viewer */}
      <motion.div variants={item}>
        <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm flex items-center gap-2'><Terminal className='h-4 w-4 text-amber-500' /> System Logs</CardTitle>
              <div className='flex items-center gap-2'>
                <Badge variant='outline' className='text-[10px] gap-1 text-emerald-600 border-emerald-200'><span className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse' />Live</Badge>
                <Button variant='ghost' size='sm' className='gap-1 text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={() => { fetchLogs(); toast.info('Logs refreshed') }} disabled={logsLoading}>
                  <RefreshCw className={`h-3 w-3 ${logsLoading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
                <Button variant='ghost' size='sm' className='gap-1 text-xs hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={() => setLogsExpanded(!logsExpanded)}>
                  {logsExpanded ? 'Collapse' : 'Expand'} <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${logsExpanded ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className={`bg-zinc-950 dark:bg-zinc-900 rounded-lg p-4 ${logsExpanded ? 'max-h-[400px]' : 'max-h-[200px]'} overflow-hidden space-y-2`}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className='flex items-center gap-3 animate-pulse'>
                    <Skeleton className='h-3.5 w-16 bg-zinc-700' />
                    <Skeleton className='h-3.5 w-12 bg-zinc-700' />
                    <Skeleton className='h-3.5 w-14 bg-zinc-700' />
                    <Skeleton className='h-3.5 flex-1 bg-zinc-700' />
                  </div>
                ))}
              </div>
            ) : (
              <div className={`bg-zinc-950 dark:bg-zinc-900 rounded-lg p-4 font-mono text-xs overflow-hidden ${logsExpanded ? 'max-h-[400px]' : 'max-h-[200px]'} overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:bg-zinc-600 [&::-webkit-scrollbar-thumb]:rounded-full`}>
                {logs.length === 0 ? (
                  <div className='text-zinc-500 text-center py-4'>No system logs available.</div>
                ) : (
                  logs.map((log) => {
                    const level = log.level.toUpperCase() as 'INFO' | 'WARN' | 'ERROR'
                    const service = extractService(log.message)
                    return (
                      <div key={log.id} className={`flex items-start gap-3 py-0.5 px-1 rounded ${level === 'ERROR' ? 'bg-red-500/5' : ''}`}>
                        <span className='text-zinc-500 shrink-0'>{formatLogTime(log.timestamp)}</span>
                        <span className={`shrink-0 w-12 font-semibold px-1 rounded text-center ${logLevelColors[level]}`}>[{level}]</span>
                        <span className='text-zinc-400 shrink-0'>{service}:</span>
                        <span className='text-zinc-300'>{log.message}</span>
                      </div>
                    )
                  })
                )}
                <div className='flex items-center gap-1 text-zinc-500 mt-1'>
                  <span className='w-2 h-4 bg-emerald-500 animate-pulse' /> Waiting for new logs...
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* System info */}
      <motion.div variants={item}>
        <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
          <CardHeader className='pb-3'><CardTitle className='text-sm flex items-center gap-2'><Server className='h-4 w-4 text-muted-foreground' /> System Information</CardTitle></CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
              {infoGrid.map(info => (
                <div key={info.label} className='p-2 rounded-lg hover:bg-muted/30 transition-colors'><p className='text-muted-foreground text-xs'>{info.label}</p><p className='font-medium'>{info.value}</p></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}