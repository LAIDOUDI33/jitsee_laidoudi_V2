'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Video,
  Headphones,
  Brain,
  MessageSquare,
  HardDrive,
  Calendar,
  ShieldCheck,
  Globe,
  Database,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Wrench,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'
import { motion } from 'framer-motion'

// ── Types ──────────────────────────────────────────────────────────────

type ServiceStatus = 'operational' | 'degraded' | 'outage' | 'maintenance'

interface Service {
  name: string
  icon: React.ReactNode
  status: ServiceStatus
  uptime: string
  responseMs: number[]
  description: string
}

interface Incident {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  time: string
  status: 'resolved' | 'monitoring' | 'investigating'
}

// ── Mock Data ──────────────────────────────────────────────────────────

const services: Service[] = [
  {
    name: 'Video Conferencing',
    icon: <Video className="h-5 w-5" />,
    status: 'operational',
    uptime: '99.99%',
    responseMs: [45, 42, 48, 43, 44],
    description: 'Core video streaming and WebRTC infrastructure',
  },
  {
    name: 'Audio Processing',
    icon: <Headphones className="h-5 w-5" />,
    status: 'operational',
    uptime: '99.97%',
    responseMs: [12, 14, 11, 15, 13],
    description: 'Noise cancellation and audio codec processing',
  },
  {
    name: 'AI Services',
    icon: <Brain className="h-5 w-5" />,
    status: 'operational',
    uptime: '99.95%',
    responseMs: [320, 350, 310, 340, 330],
    description: 'Meeting summaries, transcription, and AI assistant',
  },
  {
    name: 'Chat & Messaging',
    icon: <MessageSquare className="h-5 w-5" />,
    status: 'operational',
    uptime: '99.98%',
    responseMs: [22, 20, 25, 21, 23],
    description: 'Real-time messaging and file sharing',
  },
  {
    name: 'File Storage',
    icon: <HardDrive className="h-5 w-5" />,
    status: 'operational',
    uptime: '99.99%',
    responseMs: [85, 90, 82, 88, 86],
    description: 'Cloud storage for recordings and shared files',
  },
  {
    name: 'Calendar Sync',
    icon: <Calendar className="h-5 w-5" />,
    status: 'maintenance',
    uptime: '99.80%',
    responseMs: [0, 0, 0, 0, 0],
    description: 'Google Calendar and Outlook integration',
  },
  {
    name: 'Authentication',
    icon: <ShieldCheck className="h-5 w-5" />,
    status: 'degraded',
    uptime: '99.20%',
    responseMs: [450, 520, 480, 550, 510],
    description: 'SSO, OAuth, and session management',
  },
  {
    name: 'API Gateway',
    icon: <Globe className="h-5 w-5" />,
    status: 'operational',
    uptime: '99.99%',
    responseMs: [8, 10, 9, 11, 9],
    description: 'REST API routing and rate limiting',
  },
  {
    name: 'Database',
    icon: <Database className="h-5 w-5" />,
    status: 'operational',
    uptime: '99.99%',
    responseMs: [5, 6, 4, 7, 5],
    description: 'PostgreSQL cluster and read replicas',
  },
]

const incidents: Incident[] = [
  {
    id: 'inc-1',
    severity: 'warning',
    title: 'Authentication latency spike',
    description:
      'Users experienced elevated login times averaging 450ms due to increased token validation load. Scaling additional auth instances resolved the issue.',
    time: '2 hours ago',
    status: 'resolved',
  },
  {
    id: 'inc-2',
    severity: 'info',
    title: 'Calendar sync maintenance window',
    description:
      'Scheduled maintenance to upgrade Calendar Sync service to v3.2. Expected downtime: 2 hours. Manual sync still available.',
    time: 'In progress',
    status: 'monitoring',
  },
  {
    id: 'inc-3',
    severity: 'warning',
    title: 'AI service timeout',
    description:
      'Intermittent 504 errors on AI summary generation. Root cause: upstream GPU utilization spike. Mitigated with request queuing.',
    time: 'Yesterday',
    status: 'resolved',
  },
]

// Generate 90-day uptime grid (mostly green, occasional amber/red)
function generateUptimeGrid(seed: number): ('green' | 'amber' | 'red' | 'gray')[] {
  const days: ('green' | 'amber' | 'red' | 'gray')[] = []
  for (let i = 0; i < 90; i++) {
    const hash = ((seed * 31 + i * 17 + 7) % 100) / 100
    if (hash < 0.92) days.push('green')
    else if (hash < 0.97) days.push('amber')
    else if (hash < 0.99) days.push('red')
    else days.push('gray')
  }
  return days
}

// ── Helpers ─────────────────────────────────────────────────────────────

const statusConfig: Record<ServiceStatus, { label: string; color: string; dotClass: string; hoverShadow: string; iconGrad: string; accentLine: string }> = {
  operational: { label: 'Operational', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', dotClass: 'bg-emerald-500', hoverShadow: 'hover:shadow-emerald-500/10', iconGrad: 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-600', accentLine: 'from-emerald-500 to-teal-400' },
  degraded: { label: 'Degraded', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', dotClass: 'bg-amber-500', hoverShadow: 'hover:shadow-amber-500/10', iconGrad: 'bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-600', accentLine: 'from-amber-500 to-orange-400' },
  outage: { label: 'Outage', color: 'bg-red-500/10 text-red-600 border-red-500/20', dotClass: 'bg-red-500', hoverShadow: 'hover:shadow-red-500/10', iconGrad: 'bg-gradient-to-br from-red-500/20 to-rose-500/10 text-red-600', accentLine: 'from-red-500 to-rose-400' },
  maintenance: { label: 'Maintenance', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', dotClass: 'bg-blue-500', hoverShadow: 'hover:shadow-blue-500/10', iconGrad: 'bg-gradient-to-br from-blue-500/20 to-sky-500/10 text-blue-600', accentLine: 'from-blue-500 to-sky-400' },
}

const incidentSeverityConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  critical: { label: 'Critical', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: <XCircle className="h-3.5 w-3.5" /> },
  warning: { label: 'Warning', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  info: { label: 'Info', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: <Activity className="h-3.5 w-3.5" /> },
}

const incidentStatusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  resolved: { label: 'Resolved', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  monitoring: { label: 'Monitoring', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: <RefreshCw className="h-3.5 w-3.5" /> },
  investigating: { label: 'Investigating', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
}

const uptimeColorMap: Record<string, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  gray: 'bg-muted',
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// ── Sparkline Component ─────────────────────────────────────────────────

function Sparkline({ values }: { values: number[] }) {
  if (values.every((v) => v === 0)) {
    return (
      <div className="flex items-center gap-1 h-6">
        <span className="text-[10px] text-muted-foreground">Maintenance</span>
      </div>
    )
  }

  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1

  return (
    <svg viewBox="0 0 80 24" className="w-20 h-6" fill="none">
      {values.map((v, i) => {
        const x = (i / (values.length - 1)) * 80
        const y = 22 - ((v - min) / range) * 18
        return (
          <g key={i}>
            {i > 0 && (
              <line
                x1={((i - 1) / (values.length - 1)) * 80}
                y1={22 - ((values[i - 1] - min) / range) * 18}
                x2={x}
                y2={y}
                stroke="currentColor"
                strokeWidth={1.5}
                className="text-emerald-500"
              />
            )}
            <circle cx={x} cy={y} r={2} className="fill-emerald-500" />
          </g>
        )
      })}
    </svg>
  )
}

// ── Uptime Grid Component ──────────────────────────────────────────────

function UptimeGrid({ seed, label }: { seed: number; label: string }) {
  const grid = useMemo(() => generateUptimeGrid(seed), [seed])

  return (
    <div className="flex items-start gap-3">
      <span className="text-xs font-medium text-muted-foreground w-24 shrink-0 pt-0.5">{label}</span>
      <div className="flex flex-wrap gap-0.5">
        {grid.map((day, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-sm ${uptimeColorMap[day]} ${day === 'gray' ? 'opacity-30' : ''}`}
            title={`Day ${i + 1}: ${day}`}
          />
        ))}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────

export default function StatusPage() {
  const [lastChecked, setLastChecked] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setLastChecked(new Date())
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const hasIssues = services.some((s) => s.status !== 'operational' && s.status !== 'maintenance')
  const overallLabel = hasIssues ? 'Degraded Performance' : 'All Systems Operational'

  return (
    <motion.div
      className="space-y-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* ── Header ── */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Platform Status</h1>
            <p className="text-sm text-muted-foreground">Real-time monitoring of all ALVISION services</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={`text-sm px-3 py-1.5 ${
              hasIssues
                ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
            }`}
          >
            <span className="relative flex h-2 w-2 mr-2">
              {hasIssues ? (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              ) : (
                <>
                  <span className="animate-breathe absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </>
              )}
            </span>
            {overallLabel}
          </Badge>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Last checked: {lastChecked.toLocaleTimeString()}
          </div>
        </div>
      </motion.div>

      {/* ── Service Status Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {services.map((service, idx) => {
          const cfg = statusConfig[service.status]
          const avgMs =
            service.responseMs.reduce((a, b) => a + b, 0) / service.responseMs.length

          return (
            <motion.div key={service.name} variants={item}>
              <Card className={`bg-card border border-border/50 rounded-xl p-0 hover:shadow-lg ${cfg.hoverShadow} hover:-translate-y-0.5 transition-all duration-300 overflow-hidden relative`}
              >
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${cfg.accentLine}`} />
                <CardHeader className="pb-3 pt-5 px-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${cfg.iconGrad}`}>
                        {service.icon}
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">{service.name}</CardTitle>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{service.description}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-0">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className={`text-[11px] ${cfg.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotClass} mr-1.5 animate-breathe`} />
                      {cfg.label}
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">{service.uptime} uptime</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">Avg response</span>
                      {service.status === 'maintenance' ? (
                        <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                          <Wrench className="h-3 w-3" />
                          Scheduled
                        </span>
                      ) : (
                        <span className={`text-xs font-semibold ${service.status === 'degraded' ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {Math.round(avgMs)}ms
                        </span>
                      )}
                    </div>
                    <Sparkline values={service.responseMs} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* ── Incident Timeline + Uptime Bars ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Timeline */}
        <motion.div variants={item}>
          <Card className="bg-card border border-border/50 rounded-xl hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-base font-semibold">Incident Timeline</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs bg-muted/50">
                  {incidents.filter((i) => i.status !== 'resolved').length} active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {incidents.map((incident) => {
                const sevCfg = incidentSeverityConfig[incident.severity]
                const statCfg = incidentStatusConfig[incident.status]

                return (
                  <motion.div
                    key={incident.id}
                    variants={item}
                    className="relative pl-6 border-l-2 border-border/50 last:border-0"
                  >
                    <div className="absolute left-0 top-0 w-3 h-3 rounded-full -translate-x-[7px] border-2 border-background bg-amber-500" />
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] ${sevCfg.color}`}>
                          {sevCfg.icon}
                          <span className="ml-1">{sevCfg.label}</span>
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] ${statCfg.color}`}>
                          {statCfg.icon}
                          <span className="ml-1">{statCfg.label}</span>
                        </Badge>
                        <span className="text-[10px] text-muted-foreground ml-auto">{incident.time}</span>
                      </div>
                      <h4 className="text-sm font-medium">{incident.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{incident.description}</p>
                    </div>
                  </motion.div>
                )
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* 90-Day Uptime */}
        <motion.div variants={item}>
          <Card className="bg-card border border-border/50 rounded-xl hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-500" />
                  <CardTitle className="text-base font-semibold">90-Day Uptime</CardTitle>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500" /> Operational</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500" /> Degraded</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500" /> Outage</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {services.map((service, idx) => (
                  <UptimeGrid
                    key={service.name}
                    seed={idx * 37 + 13}
                    label={service.name}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Subscribe to Updates ── */}
      <motion.div variants={item}>
        <Card className="bg-card border border-border/50 rounded-xl hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-violet-500" />
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-5 px-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-violet-500/10 text-primary">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Subscribe to Status Updates</h3>
                <p className="text-xs text-muted-foreground">Get notified about service disruptions and maintenance</p>
              </div>
            </div>
            <Button variant="outline" className="shrink-0">
              Subscribe
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
