'use server'

import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { requireAuth, requireRole } from '@/lib/api-auth'

// ── Types ──────────────────────────────────────────────────────────────

interface Incident {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  createdAt: string
  updatedAt: string
}

const DB_PATH = path.join(process.cwd(), 'db', 'incidents.json')

const VALID_STATUSES = ['investigating', 'identified', 'monitoring', 'resolved'] as const
const VALID_SEVERITIES = ['critical', 'warning', 'info'] as const

// ── Seed data ──────────────────────────────────────────────────────────

const SEED_INCIDENTS: Incident[] = [
  {
    id: 'inc-seed-1',
    severity: 'warning',
    title: 'Authentication latency spike',
    description: 'Users experienced elevated login times averaging 450ms due to increased token validation load. Scaling additional auth instances resolved the issue.',
    status: 'resolved',
    createdAt: '2025-07-15T10:30:00Z',
    updatedAt: '2025-07-15T12:00:00Z',
  },
  {
    id: 'inc-seed-2',
    severity: 'info',
    title: 'Chat service maintenance',
    description: 'Scheduled maintenance to upgrade chat service to support larger channels. Intermittent connection timeouts possible during rollout.',
    status: 'monitoring',
    createdAt: '2025-07-16T08:00:00Z',
    updatedAt: '2025-07-16T14:00:00Z',
  },
  {
    id: 'inc-seed-3',
    severity: 'critical',
    title: 'AI service timeout',
    description: 'Intermittent 504 errors on AI summary generation. Root cause: upstream GPU utilization spike. Mitigated with request queuing.',
    status: 'identified',
    createdAt: '2025-07-17T16:45:00Z',
    updatedAt: '2025-07-17T17:30:00Z',
  },
]

// ── Helpers ─────────────────────────────────────────────────────────────

async function readDb(): Promise<Incident[]> {
  try {
    const raw = await fs.readFile(DB_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    // Seed on first read
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true })
    await fs.writeFile(DB_PATH, JSON.stringify(SEED_INCIDENTS, null, 2), 'utf-8')
    return SEED_INCIDENTS
  }
}

async function writeDb(incidents: Incident[]) {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true })
  await fs.writeFile(DB_PATH, JSON.stringify(incidents, null, 2), 'utf-8')
}

// ── GET ─────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    await requireAuth()
    const incidents = await readDb()
    return NextResponse.json({ success: true, data: { incidents } })
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string }
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch incidents' },
      { status: err.statusCode || 500 }
    )
  }
}

// ── POST (superadmin only) ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    await requireRole('superadmin')
    const body = await req.json()
    const { title, description, severity } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }
    if (!VALID_SEVERITIES.includes(severity)) {
      return NextResponse.json({ success: false, error: 'Invalid severity' }, { status: 400 })
    }

    const incidents = await readDb()
    const incident: Incident = {
      id: `inc-${Date.now()}`,
      severity,
      title: title.trim(),
      description: description?.trim() || '',
      status: 'investigating',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    incidents.unshift(incident)
    await writeDb(incidents)

    return NextResponse.json({ success: true, data: incident }, { status: 201 })
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string }
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create incident' },
      { status: err.statusCode || 500 }
    )
  }
}

// ── PUT ─────────────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    await requireAuth()
    const body = await req.json()
    const { id, status } = body

    if (!id || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: 'Valid id and status required' }, { status: 400 })
    }

    const incidents = await readDb()
    const idx = incidents.findIndex((i) => i.id === id)
    if (idx === -1) {
      return NextResponse.json({ success: false, error: 'Incident not found' }, { status: 404 })
    }

    incidents[idx].status = status
    incidents[idx].updatedAt = new Date().toISOString()
    await writeDb(incidents)

    return NextResponse.json({ success: true, data: incidents[idx] })
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string }
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update incident' },
      { status: err.statusCode || 500 }
    )
  }
}
