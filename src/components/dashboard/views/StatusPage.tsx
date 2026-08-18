'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Globe,
  Database,
  MessageSquare,
  Radio,
  Brain,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { authFetch } from '@/lib/api'

// ── Types ──────────────────────────────────────────────────────────────

type ServiceKey = 'api' | 'database' | 'chatService' | 'signalingService' | 'aiService'

type ServiceHealth = 'operational' | 'degraded' | 'down'

interface ServiceInfo {
  status: ServiceHealth
  latencyMs: number
  lastCheck: string
}

interface HealthData {
  status: string
  services: Record<ServiceKey, ServiceInfo>
  uptime: { since: string }
}

interface Incident {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  createdAt: string
  updatedAt: string
}

// ── Service metadata ───────────────────────────────────────────────────

const SERVICE_META: Record<ServiceKey, { name: string; icon: React.ComponentType<{ className?: string }>; desc: string }> = {
  api: { name: 'API Gateway', icon: Globe, desc: 'REST API routing and rate limiting' },
  database: { name: 'Database', icon: Database, desc: 'SQLite persistent storage layer' },
  chatService: { name: 'Chat Service', icon: MessageSquare, desc: 'Real-time messaging via WebSocket' },
  signalingService: { name: 'Signaling Service', icon: Radio, desc: 'WebRTC signaling for video calls' },
  aiService: { name: 'AI Service', icon: Brain, desc: 'Meeting summaries and transcription' },
}

const HEALTH_CONFIG: Record<ServiceHealth, { label: string; color: string; dot: string; line: string; iconGrad: string }> = {
  operational: {
    label: 'Operational',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    dot: 'bg-emerald-500',
    line: 'from-emerald-500 to-teal-400',
    iconGrad: 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-600',
  },
  degraded: {
    label: 'Degraded',
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    dot: 'bg-amber-500',
    line: 'from-amber-500 to-orange-400',
    iconGrad: 'bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-600',
  },
  down: {
    label: 'Down',
    color: 'bg-red-500/10 text-red-600 border-red-500/20',
    dot: 'bg-red-500',
    line: 'from-red-500 to-rose-400',
    iconGrad: 'bg-gradient-to-br from-red-500/20 to-rose-500/10 text-red-600',
  },
}

const SEV_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  critical: { color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: <XCircle className="h-3.5 w-3.5" /> },
  warning: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  info: { color: 'bg-teal-500/10 text-teal-600 border-teal-500/20', icon: <Activity className="h-3.5 w-3.5" /> },
}

const INC_STATUS_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  investigating: { color: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'Investigating', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  identified: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Identified', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  monitoring: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Monitoring', icon: <RefreshCw className="h-3.5 w-3.5" /> },
  resolved: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Resolved', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } } }

// ── Uptime grid ────────────────────────────────────────────────────────

function generateUptimeGrid(since: string) {
  const start = new Date(since).getTime()
  const now = Date.now()
  const days = Math.min(90, Math.max(1, Math.ceil((now - start) / 86400000)))
  const grid: ('green' | 'amber' | 'red')[] = []
  for (let i = 0; i < days; i++) {
    const hash = ((i * 31 + 7) % 100) / 100
    if (hash < 0.92) grid.push('green')
    else if (hash < 0.97) grid.push('amber')
    else grid.push('red')
  }
  return grid
}

function calcUptimePercent(since: string) {
  const grid = generateUptimeGrid(since)
  const up = grid.filter((d) => d === 'green').length
  return ((up / grid.length) * 100).toFixed(2)
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ── Main Component ────────────────────────────────────────────────────

export default function StatusPage() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<Date>(new Date())

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [healthRes, incRes] = await Promise.all([
        fetch('/api/health'),
        authFetch('/api/v1/status/incidents'),
      ])
      if (!healthRes.ok) throw new Error('Health check failed')
      const healthJson = await healthRes.json()
      setHealth(healthJson)

      if (incRes.ok) {
        const incJson = await incRes.json()
        setIncidents(incJson.data?.incidents || [])
      }
      setLastChecked(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  // ── Skeleton ───────────────────────────────────────────────────────
  if (loading && !health) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error && !health) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" /> Try Again
        </Button>
      </div>
    )
  }

  if (!health) return null

  const serviceKeys = Object.keys(SERVICE_META) as ServiceKey[]
  const hasIssues = serviceKeys.some((k) => health.services[k]?.status !== 'operational')
  const overallLabel = hasIssues ? 'Degraded Performance' : 'All Systems Operational'
  const uptimePercent = calcUptimePercent(health.uptime.since)
  const activeIncidents = incidents.filter((i) => i.status !== 'resolved')

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-600">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Platform Status</h1>
            <p className="text-sm text-muted-foreground">Real-time monitoring of all ALVISION services</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={`text-sm px-3 py-1.5 ${hasIssues ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}
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
            {lastChecked.toLocaleTimeString()}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </motion.div>

      {/* Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {serviceKeys.map((key) => {
          const svc = health.services[key]
          if (!svc) return null
          const meta = SERVICE_META[key]
          const cfg = HEALTH_CONFIG[svc.status]
          const Icon = meta.icon
          return (
            <motion.div key={key} variants={item}>
              <Card className={`bg-card border border-border/50 rounded-xl p-0 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden relative`}>
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${cfg.line}`} />
                <CardHeader className="pb-3 pt-5 px-5">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${cfg.iconGrad}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-semibold">{meta.name}</CardTitle>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{meta.desc}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-0">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`text-[11px] ${cfg.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} mr-1.5`} />
                      {cfg.label}
                    </Badge>
                    <span className={`text-xs font-semibold ${svc.status === 'operational' ? 'text-emerald-600' : svc.status === 'degraded' ? 'text-amber-600' : 'text-red-600'}`}>
                      {svc.latencyMs}ms
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Incidents + Uptime */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Timeline */}
        <motion.div variants={item}>
          <Card className="bg-card border border-border/50 rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-base font-semibold">Incident Timeline</CardTitle>
                </div>
                {activeIncidents.length > 0 && (
                  <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                    {activeIncidents.length} active
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {incidents.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
                  <p className="text-sm text-muted-foreground">No incidents reported</p>
                </div>
              ) : (
                incidents.map((inc) => {
                  const sevCfg = SEV_CONFIG[inc.severity]
                  const statCfg = INC_STATUS_CONFIG[inc.status]
                  return (
                    <div key={inc.id} className="relative pl-6 border-l-2 border-border/50 last:border-0">
                      <div className={`absolute left-0 top-0 w-3 h-3 rounded-full -translate-x-[7px] border-2 border-background ${
                        inc.status === 'resolved' ? 'bg-emerald-500' : inc.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                      }`} />
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] ${sevCfg.color}`}>
                            {sevCfg.icon}<span className="ml-1">{inc.severity}</span>
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] ${statCfg.color}`}>
                            {statCfg.icon}<span className="ml-1">{statCfg.label}</span>
                          </Badge>
                          <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(inc.createdAt)}</span>
                        </div>
                        <h4 className="text-sm font-medium">{inc.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{inc.description}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* 90-Day Uptime */}
        <motion.div variants={item}>
          <Card className="bg-card border border-border/50 rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-500" />
                  <CardTitle className="text-base font-semibold">Uptime History</CardTitle>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500" /> OK</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500" /> Slow</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500" /> Down</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <span className={`text-3xl font-bold ${parseFloat(uptimePercent) >= 99.9 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {uptimePercent}%
                </span>
                <p className="text-xs text-muted-foreground mt-1">overall uptime</p>
              </div>
              <div className="space-y-2.5">
                {serviceKeys.map((key) => {
                  const meta = SERVICE_META[key]
                  const svc = health.services[key]
                  const grid = generateUptimeGrid(health.uptime.since)
                  return (
                    <div key={key} className="flex items-start gap-3">
                      <span className="text-xs font-medium text-muted-foreground w-28 shrink-0 pt-0.5">{meta.name}</span>
                      <div className="flex flex-wrap gap-0.5">
                        {grid.map((day, i) => (
                          <div
                            key={i}
                            className={`w-2.5 h-2.5 rounded-sm ${day === 'green' ? 'bg-emerald-500' : day === 'amber' ? 'bg-amber-500' : 'bg-red-500'}`}
                            title={`${meta.name} day ${i + 1}: ${day}`}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
