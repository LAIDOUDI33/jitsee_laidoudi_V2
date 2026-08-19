// ─── Server-Side Observability Utilities ─────────────────────────────────────
// In-memory implementation — no external dependencies

// ─── Structured Performance Logging ──────────────────────────────────────────

export function logPerformance(label: string, durationMs: number): void {
  const timestamp = new Date().toISOString()
  const level = durationMs > 3000 ? 'WARN' : durationMs > 1000 ? 'INFO' : 'DEBUG'
  console.log(
    JSON.stringify({
      ts: timestamp,
      level,
      type: 'performance',
      label,
      durationMs: Math.round(durationMs),
    })
  )
}

// ─── Structured Event Logging ────────────────────────────────────────────────

export function logEvent(event: string, data: Record<string, unknown>): void {
  const timestamp = new Date().toISOString()
  console.log(
    JSON.stringify({
      ts: timestamp,
      level: 'INFO',
      type: 'event',
      event,
      ...data,
    })
  )
}

// ─── Async Function Measurement ─────────────────────────────────────────────

export async function measureAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now()
  try {
    const result = await fn()
    const duration = performance.now() - start
    logPerformance(label, duration)
    return result
  } catch (error) {
    const duration = performance.now() - start
    logEvent(`${label}:error`, {
      durationMs: Math.round(duration),
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

// ─── API Metrics Collector ───────────────────────────────────────────────────

interface ApiMetricEntry {
  count: number
  errors: number
  totalDurationMs: number
  minDurationMs: number
  maxDurationMs: number
}

type ApiMetricsMap = Record<string, ApiMetricEntry>

export function createApiMetrics() {
  const metrics: ApiMetricsMap = {}

  function getOrCreate(endpoint: string): ApiMetricEntry {
    if (!metrics[endpoint]) {
      metrics[endpoint] = {
        count: 0,
        errors: 0,
        totalDurationMs: 0,
        minDurationMs: Infinity,
        maxDurationMs: 0,
      }
    }
    return metrics[endpoint]
  }

  function recordRequest(endpoint: string, durationMs: number, isError: boolean): void {
    const entry = getOrCreate(endpoint)
    entry.count++
    entry.totalDurationMs += durationMs
    entry.minDurationMs = Math.min(entry.minDurationMs, durationMs)
    entry.maxDurationMs = Math.max(entry.maxDurationMs, durationMs)
    if (isError) entry.errors++
  }

  function getMetrics(): Record<string, {
    count: number
    errorRate: number
    avgResponseMs: number
    minResponseMs: number
    maxResponseMs: number
  }> {
    const result: Record<string, {
      count: number
      errorRate: number
      avgResponseMs: number
      minResponseMs: number
      maxResponseMs: number
    }> = {}

    for (const [endpoint, entry] of Object.entries(metrics)) {
      result[endpoint] = {
        count: entry.count,
        errorRate: entry.count > 0 ? entry.errors / entry.count : 0,
        avgResponseMs: entry.count > 0 ? Math.round(entry.totalDurationMs / entry.count) : 0,
        minResponseMs: entry.minDurationMs === Infinity ? 0 : Math.round(entry.minDurationMs),
        maxResponseMs: Math.round(entry.maxDurationMs),
      }
    }

    return result
  }

  function reset(): void {
    for (const key of Object.keys(metrics)) {
      delete metrics[key]
    }
  }

  return { recordRequest, getMetrics, reset }
}
