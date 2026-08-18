'use server'

import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'
import { requireAuth } from '@/lib/api-auth'

// ── Types ──────────────────────────────────────────────────────────────

interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  secret: string
  isActive: boolean
  createdAt: string
  lastTriggeredAt: string | null
  successCount: number
  failureCount: number
}

interface OrgWebhooks {
  orgId: string
  webhooks: Webhook[]
}

const WEBHOOK_EVENTS = [
  'meeting.created',
  'meeting.started',
  'meeting.ended',
  'meeting.summary',
  'transcript.completed',
  'recording.ready',
  'member.joined',
  'member.left',
] as const

// ── Helpers ─────────────────────────────────────────────────────────────

const DB_PATH = path.join(process.cwd(), 'db', 'webhooks.json')

async function readDb(): Promise<OrgWebhooks[]> {
  try {
    const raw = await fs.readFile(DB_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

async function writeDb(data: OrgWebhooks[]) {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true })
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

function getOrgWebhooks(orgId: string, data: OrgWebhooks[]): OrgWebhooks {
  let org = data.find((d) => d.orgId === orgId)
  if (!org) {
    org = { orgId, webhooks: [] }
    data.push(org)
  }
  return org
}

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function generateSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString('hex')}`
}

// ── GET ─────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const user = await requireAuth()
    const orgId = user.organizationId || user.id
    const data = await readDb()
    const org = data.find((d) => d.orgId === orgId)

    return NextResponse.json({
      success: true,
      data: {
        webhooks: org?.webhooks || [],
        availableEvents: WEBHOOK_EVENTS,
      },
    })
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string }
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch webhooks' },
      { status: err.statusCode || 500 }
    )
  }
}

// ── POST ────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await req.json()
    const { name, url, events } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      )
    }

    if (!url || !isValidUrl(url)) {
      return NextResponse.json(
        { success: false, error: 'A valid HTTP/HTTPS URL is required' },
        { status: 400 }
      )
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one event must be selected' },
        { status: 400 }
      )
    }

    const validEvents = events.filter((e: string) => (WEBHOOK_EVENTS as readonly string[]).includes(e))
    if (validEvents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid events selected' },
        { status: 400 }
      )
    }

    const orgId = user.organizationId || user.id
    const data = await readDb()
    const org = getOrgWebhooks(orgId, data)

    const webhook: Webhook = {
      id: crypto.randomUUID(),
      name: name.trim(),
      url,
      events: validEvents,
      secret: generateSecret(),
      isActive: true,
      createdAt: new Date().toISOString(),
      lastTriggeredAt: null,
      successCount: 0,
      failureCount: 0,
    }

    org.webhooks.push(webhook)
    await writeDb(data)

    return NextResponse.json({ success: true, data: webhook }, { status: 201 })
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string }
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create webhook' },
      { status: err.statusCode || 500 }
    )
  }
}

// ── PUT ─────────────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await req.json()
    const { id, name, url, events, isActive } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Webhook ID is required' },
        { status: 400 }
      )
    }

    const orgId = user.organizationId || user.id
    const data = await readDb()
    const org = data.find((d) => d.orgId === orgId)

    if (!org) {
      return NextResponse.json(
        { success: false, error: 'Webhook not found' },
        { status: 404 }
      )
    }

    const idx = org.webhooks.findIndex((w) => w.id === id)
    if (idx === -1) {
      return NextResponse.json(
        { success: false, error: 'Webhook not found' },
        { status: 404 }
      )
    }

    const webhook = org.webhooks[idx]

    if (name !== undefined) webhook.name = String(name).trim()
    if (url !== undefined) {
      if (!isValidUrl(url)) {
        return NextResponse.json(
          { success: false, error: 'Invalid URL' },
          { status: 400 }
        )
      }
      webhook.url = url
    }
    if (events !== undefined && Array.isArray(events)) {
      const validEvents = events.filter((e: string) => (WEBHOOK_EVENTS as readonly string[]).includes(e))
      if (validEvents.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No valid events selected' },
          { status: 400 }
        )
      }
      webhook.events = validEvents
    }
    if (isActive !== undefined) webhook.isActive = Boolean(isActive)

    await writeDb(data)

    return NextResponse.json({ success: true, data: webhook })
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string }
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update webhook' },
      { status: err.statusCode || 500 }
    )
  }
}

// ── DELETE ──────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Webhook ID is required' },
        { status: 400 }
      )
    }

    const orgId = user.organizationId || user.id
    const data = await readDb()
    const org = data.find((d) => d.orgId === orgId)

    if (!org) {
      return NextResponse.json(
        { success: false, error: 'Webhook not found' },
        { status: 404 }
      )
    }

    const idx = org.webhooks.findIndex((w) => w.id === id)
    if (idx === -1) {
      return NextResponse.json(
        { success: false, error: 'Webhook not found' },
        { status: 404 }
      )
    }

    const deleted = org.webhooks.splice(idx, 1)[0]
    await writeDb(data)

    return NextResponse.json({ success: true, data: deleted })
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string }
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete webhook' },
      { status: err.statusCode || 500 }
    )
  }
}
