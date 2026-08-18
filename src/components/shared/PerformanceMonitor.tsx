'use client'

import { useState, useEffect, useCallback } from 'react'
import { Activity, ChevronUp, ChevronDown, Clock, Cpu, MemoryStick } from 'lucide-react'

interface PerfMetrics {
  pageLoad: number
  domReady: number
  memoryUsed: number | null
  memoryTotal: number | null
  longTasks: number
  longTasksDuration: number
}

function getMetrics(): PerfMetrics {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined

  let pageLoad = 0
  let domReady = 0

  if (nav) {
    pageLoad = Math.round(nav.loadEventEnd - nav.startTime)
    domReady = Math.round(nav.domContentLoadedEventEnd - nav.startTime)
  }

  let memoryUsed: number | null = null
  let memoryTotal: number | null = null
  const perf = performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }
  if (perf.memory) {
    memoryUsed = Math.round(perf.memory.usedJSHeapSize / 1024 / 1024)
    memoryTotal = Math.round(perf.memory.totalJSHeapSize / 1024 / 1024)
  }

  const longTasks = performance.getEntriesByType('longtask') as PerformanceEntry[]
  const longTasksDuration = Math.round(longTasks.reduce((sum, t) => sum + t.duration, 0))

  return {
    pageLoad,
    domReady,
    memoryUsed,
    memoryTotal,
    longTasks: longTasks.length,
    longTasksDuration,
  }
}

function useShowDebug(): boolean {
  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined') return false
    return process.env.NODE_ENV === 'development' || new URLSearchParams(window.location.search).has('debug')
  })

  useEffect(() => {
    const handler = () => {
      const isDevelopment = process.env.NODE_ENV === 'development'
      const hasDebugParam = new URLSearchParams(window.location.search).has('debug')
      setShow(isDevelopment || hasDebugParam)
    }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  return show
}

export default function PerformanceMonitor() {
  const showDebug = useShowDebug()
  const isDev = process.env.NODE_ENV === 'development'
  const [expanded, setExpanded] = useState(false)
  const [metrics, setMetrics] = useState<PerfMetrics | null>(null)

  const refresh = useCallback(() => {
    setMetrics(getMetrics())
  }, [])

  useEffect(() => {
    if (!showDebug) return

    const handler = () => refresh()
    window.addEventListener('load', handler)

    // Initial measurement after a short delay
    const timer = setTimeout(refresh, 100)

    // Refresh periodically
    const interval = setInterval(refresh, 5000)

    return () => {
      window.removeEventListener('load', handler)
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [showDebug, refresh])

  if (!showDebug || !metrics) return null

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <div className="bg-popover border border-border rounded-lg shadow-xl text-popover-foreground text-xs font-mono min-w-[200px] overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-semibold">Perf Monitor</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-sans">
              {isDev ? 'DEV' : 'DEBUG'}
            </span>
          </div>
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Metrics panel */}
        {expanded && (
          <div className="px-3 pb-3 space-y-2">
            <div className="border-t border-border" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Page Load</span>
              </div>
              <span className={metrics.pageLoad > 3000 ? 'text-rose-500' : 'text-emerald-500'}>
                {metrics.pageLoad}ms
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>DOM Ready</span>
              </div>
              <span className={metrics.domReady > 2000 ? 'text-rose-500' : 'text-emerald-500'}>
                {metrics.domReady}ms
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Cpu className="w-3 h-3" />
                <span>Long Tasks</span>
              </div>
              <span className={metrics.longTasks > 0 ? 'text-amber-500' : 'text-emerald-500'}>
                {metrics.longTasks} ({metrics.longTasksDuration}ms)
              </span>
            </div>

            {metrics.memoryUsed !== null && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MemoryStick className="w-3 h-3" />
                  <span>Memory</span>
                </div>
                <span className="text-emerald-500">
                  {metrics.memoryUsed}MB / {metrics.memoryTotal}MB
                </span>
              </div>
            )}

            <button
              onClick={refresh}
              className="w-full mt-1 py-1 rounded bg-muted/50 hover:bg-muted text-muted-foreground text-[10px] font-sans font-medium transition-colors"
            >
              Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
