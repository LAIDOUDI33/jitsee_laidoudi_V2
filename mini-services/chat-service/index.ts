/**
 * ALVISION Chat Service — Real-time WebSocket chat mini-service
 * Port: 3010
 * Protocol: JSON over WebSocket (Bun native WebSocket)
 *
 * Persistence: All channels, messages, and channel memberships are stored in
 * SQLite via Prisma (shared database with the main Next.js project).
 * In-memory maps are kept only for ephemeral real-time state (connected
 * clients, typing indicators, hand-raises, polls, media state).
 *
 * Authentication: JWT token required via query parameter `?token=xxx`
 */

import { jwtVerify } from 'jose'
import { db } from './src/db'

// ── JWT Configuration ───────────────────────────────────────────────────

const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production')
  }
  return secret || 'alvision-default-secret-change-in-production'
})()

interface TokenPayload {
  userId: string
  email: string
  role: string
  organizationId?: string | null
}

interface AuthenticatedUser extends TokenPayload {
  userName: string
}

async function verifyJwtToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret, { issuer: 'alvision' })
    return payload as unknown as TokenPayload
  } catch {
    return null
  }
}

// ── Types ───────────────────────────────────────────────────────────────

interface ClientInfo {
  ws: WebSocket
  userId: string
  userName: string
  email: string
  role: string
  organizationId?: string | null
  channels: Set<string>
  lastSeen: number
}

interface ChatMessage {
  id: string
  channelId: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
  avatar?: string
  status: 'sent' | 'delivered' | 'read'
  isBot?: boolean
  reactions?: Record<string, number>
}

interface PresenceUser {
  userId: string
  userName: string
  email: string
  role: string
  status: 'active' | 'idle'
  channels: string[]
}

interface PollOption {
  label: string
  votes: number
  percentage: number
  voters: string[]
}

interface PollData {
  id: string
  question: string
  options: PollOption[]
  totalVotes: number
  createdBy: string
  createdByName: string
}

interface IncomingMessage {
  type: string
  channel?: string
  payload?: Record<string, unknown>
}

// ── In-memory stores (ephemeral / real-time only) ───────────────────────

const clients = new Map<string, ClientInfo>()          // userId → ClientInfo
const channelMembers = new Map<string, Set<string>>()  // channelId → Set<userId> (online members)
const typingUsers = new Map<string, Map<string, { userName: string; timer: ReturnType<typeof setTimeout> }>>()
const handRaisedUsers = new Map<string, Set<string>>() // channelId → Set<userId>
const channelPolls = new Map<string, PollData[]>()     // channelId → PollData[]
const participantMediaState = new Map<string, Map<string, { micOn: boolean; videoOn: boolean }>>()

// In-memory cache of known channels (id → name) — synced from DB at startup
const channelNames = new Map<string, string>()

// ── DB helpers ──────────────────────────────────────────────────────────

/** Load the 50 most recent messages for a channel from the database */
async function getChannelHistory(channelId: string, limit = 50): Promise<ChatMessage[]> {
  const rows = await db.chatMessage.findMany({
    where: { channelId },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })
  return rows.map(r => ({
    id: r.id,
    channelId: r.channelId,
    senderId: r.senderId,
    senderName: r.senderName,
    content: r.content,
    timestamp: r.timestamp,
    avatar: r.avatar || undefined,
    status: r.status as ChatMessage['status'],
    reactions: (typeof r.reactions === 'string' ? JSON.parse(r.reactions) : r.reactions) as Record<string, number>,
  }))
}

/** Ensure a channel row exists in the DB, create if missing, return id */
async function ensureChannel(channelId: string, name?: string): Promise<void> {
  if (channelNames.has(channelId)) return
  const existing = await db.chatChannel.findUnique({ where: { id: channelId } })
  if (existing) {
    channelNames.set(channelId, existing.name)
    return
  }
  const created = await db.chatChannel.create({
    data: { id: channelId, name: name || channelId },
  })
  channelNames.set(channelId, created.name)
}

/** Persist a message to the database */
async function persistMessage(msg: ChatMessage): Promise<void> {
  await ensureChannel(msg.channelId)
  await db.chatMessage.create({
    data: {
      id: msg.id,
      channelId: msg.channelId,
      senderId: msg.senderId,
      senderName: msg.senderName,
      content: msg.content,
      timestamp: msg.timestamp,
      avatar: msg.avatar || null,
      status: msg.status,
      reactions: JSON.stringify(msg.reactions || {}),
    },
  })
}

/** Record a user joining a channel in the DB */
async function persistJoin(channelId: string, userId: string): Promise<void> {
  await ensureChannel(channelId)
  await db.chatChannelMember.upsert({
    where: { channelId_userId: { channelId, userId } },
    create: { channelId, userId },
    update: {},
  })
}

/** Remove a user's channel membership from the DB */
async function persistLeave(channelId: string, userId: string): Promise<void> {
  await db.chatChannelMember.deleteMany({ where: { channelId, userId } }).catch(() => {})
}

/** Count total persisted messages (for health check) */
async function getMessageCount(): Promise<number> {
  return db.chatMessage.count()
}

/** Count total persisted channels (for health check) */
async function getChannelCount(): Promise<number> {
  return db.chatChannel.count()
}

// ── Seed demo data (runs once when DB has no channels) ─────────────────

const DEMO_SEED_KEY = 'c1' // if this channel doesn't exist, seed everything

const demoChannels = [
  { id: 'c1', name: 'General' },
  { id: 'c2', name: 'Engineering' },
  { id: 'c3', name: 'Random' },
  { id: 'c5', name: 'Announcements' },
]

const demoMessages: Omit<ChatMessage, 'timestamp'>[] = [
  { id: 'msg1', channelId: 'c1', senderId: 'u6', senderName: 'Alex Turner', content: 'Good morning team! Quick update on the roadmap.', status: 'read', reactions: { '👍': 2 } },
  { id: 'msg2', channelId: 'c1', senderId: 'u1', senderName: 'Sarah Chen', content: 'Morning! The new build is deployed to staging. Can everyone test?', status: 'read', reactions: { '🚀': 3 } },
  { id: 'msg3', channelId: 'c1', senderId: 'u2', senderName: 'Mike Johnson', content: 'Testing now. The video quality improvements are noticeable!', status: 'read' },
  { id: 'msg4', channelId: 'c1', senderId: 'u5', senderName: 'Lisa Park', content: 'Confirmed! The AI summaries are much better too. Great work on the prompt engineering.', status: 'read', reactions: { '❤️': 1, '🔥': 2 } },
  { id: 'msg5', channelId: 'c1', senderId: 'u3', senderName: 'Emily Davis', content: 'The new UI is clean. One small thing - the participant grid could use better spacing on mobile.', status: 'delivered' },
  { id: 'msg6', channelId: 'c2', senderId: 'u2', senderName: 'Mike Johnson', content: 'PR ready for review: refactor/auth-service', status: 'read' },
  { id: 'msg7', channelId: 'c2', senderId: 'u1', senderName: 'Sarah Chen', content: 'Looking at it now. The JWT handling looks clean.', status: 'read' },
  { id: 'msg8', channelId: 'c5', senderId: 'u6', senderName: 'Alex Turner', content: 'Team offsite next Friday — please RSVP by Wednesday.', status: 'read', reactions: { '👍': 4 } },
  { id: 'msg9', channelId: 'c3', senderId: 'u5', senderName: 'Lisa Park', content: 'Check out this article on WebRTC optimisation.', status: 'read' },
]

async function seedDemoData(): Promise<void> {
  const existing = await db.chatChannel.findUnique({ where: { id: DEMO_SEED_KEY } })
  if (existing) {
    // DB already has data — just load channel names
    const channels = await db.chatChannel.findMany()
    for (const ch of channels) channelNames.set(ch.id, ch.name)
    console.log(`[chat] DB already seeded — loaded ${channels.length} channels`)
    return
  }

  console.log('[chat] Seeding demo data into DB…')
  for (const ch of demoChannels) {
    await db.chatChannel.create({ data: ch })
    channelNames.set(ch.id, ch.name)
  }
  for (const dm of demoMessages) {
    await db.chatMessage.create({
      data: {
        ...dm,
        timestamp: new Date(Date.now() - Math.random() * 3600_000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        reactions: JSON.stringify(dm.reactions || {}),
        avatar: null,
      },
    })
  }
  console.log(`[chat] Seeded ${demoChannels.length} channels and ${demoMessages.length} messages`)
}

// ── Helpers ─────────────────────────────────────────────────────────────

function send(ws: WebSocket, data: Record<string, unknown>) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data))
  }
}

function broadcastToChannel(channel: string, data: Record<string, unknown>, excludeWs?: WebSocket) {
  const members = channelMembers.get(channel)
  if (!members) return
  for (const clientId of members) {
    const client = clients.get(clientId)
    if (client && client.ws !== excludeWs && client.ws.readyState === WebSocket.OPEN) {
      send(client.ws, data)
    }
  }
}

function getPresenceList(): PresenceUser[] {
  const now = Date.now()
  return Array.from(clients.values()).map(c => ({
    userId: c.userId,
    userName: c.userName,
    email: c.email,
    role: c.role,
    status: (now - c.lastSeen) < 120_000 ? 'active' as const : 'idle' as const,
    channels: Array.from(c.channels),
  }))
}

function removeClient(userId: string) {
  const client = clients.get(userId)
  if (!client) return
  for (const ch of client.channels) {
    channelMembers.get(ch)?.delete(userId)
    handRaisedUsers.get(ch)?.delete(userId)
    participantMediaState.get(ch)?.delete(userId)
    // Persist leave to DB (fire-and-forget)
    persistLeave(ch, userId)
    broadcastToChannel(ch, {
      type: 'user_left_channel',
      channel: ch,
      payload: { userId, userName: client.userName },
    })
  }
  clients.delete(userId)
  broadcastPresence()
}

function broadcastPresence() {
  const presence = getPresenceList()
  for (const client of clients.values()) {
    send(client.ws, { type: 'presence', payload: { users: presence } })
  }
}

// ── Message handler ─────────────────────────────────────────────────────

function handleMessage(ws: WebSocket, raw: string) {
  let msg: IncomingMessage
  try {
    msg = JSON.parse(raw)
  } catch {
    send(ws, { type: 'error', payload: { message: 'Invalid JSON' } })
    return
  }

  const client = clients.get((ws as WebSocket & { data: AuthenticatedUser }).data.userId)
  if (!client) {
    send(ws, { type: 'error', payload: { message: 'Not authenticated' } })
    return
  }

  const { type, channel, payload = {} } = msg

  switch (type) {
    // ── Join a channel ────────────────────────────────────────────────
    case 'join': {
      if (!channel) {
        send(ws, { type: 'error', payload: { message: 'Missing channel' } })
        return
      }
      client.channels.add(channel)
      if (!channelMembers.has(channel)) channelMembers.set(channel, new Set())
      channelMembers.get(channel)!.add(client.userId)

      // Ensure meeting-room state structures exist
      if (!handRaisedUsers.has(channel)) handRaisedUsers.set(channel, new Set())
      if (!channelPolls.has(channel)) channelPolls.set(channel, [])
      if (!participantMediaState.has(channel)) participantMediaState.set(channel, new Map())

      // Persist membership to DB (fire-and-forget)
      persistJoin(channel, client.userId)

      // Fetch history from DB and send join confirmation
      getChannelHistory(channel).then(history => {
        send(ws, {
          type: 'joined',
          channel,
          payload: {
            userId: client.userId,
            members: Array.from(channelMembers.get(channel) || []),
            history,
            handRaised: Array.from(handRaisedUsers.get(channel) || []),
            polls: channelPolls.get(channel) || [],
          },
        })
      })

      // Notify others in channel
      broadcastToChannel(channel, {
        type: 'user_joined_channel',
        channel,
        payload: { userId: client.userId, userName: client.userName },
      }, ws)
      break
    }

    // ── Leave a channel ───────────────────────────────────────────────
    case 'leave': {
      if (!channel) return
      client.channels.delete(channel)
      channelMembers.get(channel)?.delete(client.userId)
      handRaisedUsers.get(channel)?.delete(client.userId)
      participantMediaState.get(channel)?.delete(client.userId)
      // Persist leave to DB (fire-and-forget)
      persistLeave(channel, client.userId)
      send(ws, { type: 'left', channel, payload: { userId: client.userId } })
      broadcastToChannel(channel, {
        type: 'user_left_channel',
        channel,
        payload: { userId: client.userId, userName: client.userName },
      })
      break
    }

    // ── Send a message ────────────────────────────────────────────────
    case 'message': {
      if (!channel) {
        send(ws, { type: 'error', payload: { message: 'Missing channel' } })
        return
      }
      if (!client.channels.has(channel)) {
        send(ws, { type: 'error', payload: { message: 'Not in channel' } })
        return
      }
      const chatMsg: ChatMessage = {
        id: (payload.id as string) || `srv-${Date.now()}`,
        channelId: channel,
        senderId: client.userId,
        senderName: client.userName,
        content: (payload.content as string) || '',
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        avatar: (payload.avatar as string) || undefined,
        status: 'sent',
        reactions: {},
      }

      // Persist to DB (fire-and-forget, don't block broadcast)
      persistMessage(chatMsg)

      // Broadcast to channel (including sender)
      broadcastToChannel(channel, {
        type: 'message',
        channel,
        payload: chatMsg,
      })
      break
    }

    // ── Typing indicator ──────────────────────────────────────────────
    case 'typing': {
      if (!channel) return
      const isTyping = payload.isTyping as boolean

      if (!typingUsers.has(channel)) typingUsers.set(channel, new Map())
      const channelTyping = typingUsers.get(channel)!

      const existing = channelTyping.get(client.userId)
      if (existing?.timer) clearTimeout(existing.timer)

      if (isTyping) {
        channelTyping.set(client.userId, {
          userName: client.userName,
          timer: setTimeout(() => {
            channelTyping.delete(client.userId)
            broadcastToChannel(channel, {
              type: 'typing',
              channel,
              payload: { userId: client.userId, userName: client.userName, isTyping: false },
            })
          }, 3000),
        })
      } else {
        channelTyping.delete(client.userId)
      }

      broadcastToChannel(channel, {
        type: 'typing',
        channel,
        payload: { userId: client.userId, userName: client.userName, isTyping },
      })
      break
    }

    // ── Request full presence ─────────────────────────────────────────
    case 'presence': {
      send(ws, { type: 'presence', payload: { users: getPresenceList() } })
      break
    }

    // ── Emoji reaction ────────────────────────────────────────────────
    case 'reaction': {
      if (!channel) {
        send(ws, { type: 'error', payload: { message: 'Missing channel' } })
        return
      }
      if (!client.channels.has(channel)) {
        send(ws, { type: 'error', payload: { message: 'Not in channel' } })
        return
      }
      const emoji = (payload.emoji as string) || '👍'
      broadcastToChannel(channel, {
        type: 'reaction',
        channel,
        payload: { userId: client.userId, userName: client.userName, emoji },
      })
      break
    }

    // ── Hand raise ────────────────────────────────────────────────────
    case 'hand_raise': {
      if (!channel) return
      if (!client.channels.has(channel)) return
      if (!handRaisedUsers.has(channel)) handRaisedUsers.set(channel, new Set())
      handRaisedUsers.get(channel)!.add(client.userId)
      broadcastToChannel(channel, {
        type: 'hand_raised',
        channel,
        payload: { userId: client.userId, userName: client.userName },
      })
      break
    }

    // ── Hand lower ────────────────────────────────────────────────────
    case 'hand_lower': {
      if (!channel) return
      if (!client.channels.has(channel)) return
      handRaisedUsers.get(channel)?.delete(client.userId)
      broadcastToChannel(channel, {
        type: 'hand_lowered',
        channel,
        payload: { userId: client.userId, userName: client.userName },
      })
      break
    }

    // ── Poll creation ─────────────────────────────────────────────────
    case 'poll_create': {
      if (!channel) {
        send(ws, { type: 'error', payload: { message: 'Missing channel' } })
        return
      }
      if (!client.channels.has(channel)) {
        send(ws, { type: 'error', payload: { message: 'Not in channel' } })
        return
      }
      const question = (payload.question as string) || ''
      const options = (payload.options as string[]) || []
      if (!question || options.length < 2) {
        send(ws, { type: 'error', payload: { message: 'Poll must have a question and at least 2 options' } })
        return
      }

      const poll: PollData = {
        id: `poll-${Date.now()}`,
        question,
        options: options.map(label => ({ label, votes: 0, percentage: 0, voters: [] })),
        totalVotes: 0,
        createdBy: client.userId,
        createdByName: client.userName,
      }

      if (!channelPolls.has(channel)) channelPolls.set(channel, [])
      channelPolls.get(channel)!.push(poll)

      broadcastToChannel(channel, { type: 'poll_created', channel, payload: poll })
      break
    }

    // ── Poll voting ───────────────────────────────────────────────────
    case 'poll_vote': {
      if (!channel) {
        send(ws, { type: 'error', payload: { message: 'Missing channel' } })
        return
      }
      if (!client.channels.has(channel)) return

      const pollId = (payload.pollId as string) || ''
      const optionLabel = (payload.optionLabel as string) || ''
      const polls = channelPolls.get(channel)
      if (!polls) return

      const poll = polls.find(p => p.id === pollId)
      if (!poll) {
        send(ws, { type: 'error', payload: { message: 'Poll not found' } })
        return
      }

      // Remove previous vote
      for (const opt of poll.options) {
        const idx = opt.voters.indexOf(client.userId)
        if (idx !== -1) { opt.voters.splice(idx, 1); opt.votes-- }
      }

      // Add new vote
      const targetOption = poll.options.find(o => o.label === optionLabel)
      if (targetOption) { targetOption.voters.push(client.userId); targetOption.votes++ }

      // Recalculate totals
      poll.totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0)
      for (const opt of poll.options) {
        opt.percentage = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0
      }

      broadcastToChannel(channel, { type: 'poll_voted', channel, payload: poll })
      break
    }

    // ── Live caption ──────────────────────────────────────────────────
    case 'caption': {
      if (!channel) return
      if (!client.channels.has(channel)) return
      const speaker = (payload.speaker as string) || client.userName
      const text = (payload.text as string) || ''
      broadcastToChannel(channel, {
        type: 'caption',
        channel,
        payload: { userId: client.userId, userName: client.userName, speaker, text },
      })
      break
    }

    // ── Participant media state ───────────────────────────────────────
    case 'participant_update': {
      if (!channel) return
      if (!client.channels.has(channel)) return
      const micOn = payload.micOn as boolean | undefined
      const videoOn = payload.videoOn as boolean | undefined
      if (micOn === undefined && videoOn === undefined) return

      if (!participantMediaState.has(channel)) participantMediaState.set(channel, new Map())
      const mediaMap = participantMediaState.get(channel)!
      const existing = mediaMap.get(client.userId) || { micOn: true, videoOn: true }
      if (micOn !== undefined) existing.micOn = micOn
      if (videoOn !== undefined) existing.videoOn = videoOn
      mediaMap.set(client.userId, existing)

      broadcastToChannel(channel, {
        type: 'participant_updated',
        channel,
        payload: { userId: client.userId, userName: client.userName, micOn: existing.micOn, videoOn: existing.videoOn },
      })
      break
    }

    default:
      send(ws, { type: 'error', payload: { message: `Unknown type: ${type}` } })
  }
}

// ── Startup: seed DB and load channels before serving ──────────────────

const PORT = 3010

async function start() {
  // Seed demo data if DB is empty, otherwise load existing channels
  await seedDemoData()

  const server = Bun.serve({
    port: PORT,
    fetch(req, server) {
      const url = new URL(req.url)

      // Health check (no auth required)
      if (url.pathname === '/health') {
        return (async () => {
          const [msgCount, chCount] = await Promise.all([getMessageCount(), getChannelCount()])
          return Response.json({
            status: 'ok',
            service: 'alvision-chat',
            connections: clients.size,
            channels: chCount,
            messages: msgCount,
            uptime: process.uptime(),
          })
        })()
      }

      // WebSocket upgrade — JWT authentication required
      if (url.pathname === '/' || url.pathname === '/ws') {
        const token = url.searchParams.get('token')
        if (!token) {
          return new Response(
            JSON.stringify({ error: 'Authentication required', message: 'Missing JWT token. Provide ?token=<jwt> in the WebSocket URL.' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } },
          )
        }

        return (async () => {
          const payload = await verifyJwtToken(token)
          if (!payload) {
            return new Response(
              JSON.stringify({ error: 'Authentication failed', message: 'Invalid or expired JWT token.' }),
              { status: 401, headers: { 'Content-Type': 'application/json' } },
            )
          }

          const authUser: AuthenticatedUser = {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
            organizationId: payload.organizationId,
            userName: payload.email.split('@')[0] || 'User',
          }

          if (server.upgrade(req, { data: authUser })) {
            return undefined
          }
          return new Response('WebSocket upgrade failed', { status: 500 })
        })()
      }

      return new Response('Not Found', { status: 404 })
    },
    websocket: {
      open(ws) {
        const authUser = (ws as WebSocket & { data: AuthenticatedUser }).data
        const { userId, userName, email, role, organizationId } = authUser

        clients.set(userId, {
          ws, userId, userName, email, role, organizationId,
          channels: new Set(),
          lastSeen: Date.now(),
        })

        console.log(`[chat] Connected: ${userName} (${userId}, role: ${role}) — ${clients.size} total`)
        send(ws, { type: 'presence', payload: { users: getPresenceList() } })
      },
      message(ws, message) {
        if (typeof message === 'string') {
          handleMessage(ws, message)
        }
      },
      close(ws, code, reason) {
        const authUser = (ws as WebSocket & { data: AuthenticatedUser }).data
        if (authUser) {
          console.log(`[chat] Disconnected: ${authUser.userName} (${authUser.userId}, code: ${code})`)
          removeClient(authUser.userId)
        }
      },
      drain(ws) {
        // backpressure handled
      },
    },
  })

  console.log(`\n🚀 ALVISION Chat Service running on ws://localhost:${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/health`)
  console.log(`   Auth: JWT required via ?token=<jwt> query parameter`)
  console.log(`   DB: SQLite (persisted — messages survive restarts)\n`)
}

start().catch(err => {
  console.error('[chat] Fatal startup error:', err)
  process.exit(1)
})
