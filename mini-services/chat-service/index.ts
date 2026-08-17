/**
 * ALVISION Chat Service — Real-time WebSocket chat mini-service
 * Port: 3010
 * Protocol: JSON over WebSocket (Bun native WebSocket)
 *
 * Authentication: JWT token required via query parameter `?token=xxx`
 *   - Tokens are verified using jose (HS256, issuer: 'alvision')
 *   - JWT_SECRET read from environment (same as main project)
 *   - Authenticated user identity (userId, email, role, orgId) is stored on
 *     the socket and used for all message handling — client-sent senderId
 *     and senderName are IGNORED to prevent impersonation.
 *
 * Message types (client → server):
 *   { type: "join",      channel: string, payload: { userName? } }
 *   { type: "leave",     channel: string }
 *   { type: "message",   channel: string, payload: { id?, content, avatar? } }
 *   { type: "typing",    channel: string, payload: { isTyping } }
 *   { type: "presence"  }   // request full presence list
 *   { type: "reaction",  channel: string, payload: { emoji } }
 *   { type: "hand_raise", channel: string }
 *   { type: "hand_lower", channel: string }
 *   { type: "poll_create", channel: string, payload: { question, options: string[] } }
 *   { type: "poll_vote",  channel: string, payload: { pollId, optionLabel } }
 *   { type: "caption",    channel: string, payload: { speaker, text } }
 *   { type: "participant_update", channel: string, payload: { micOn, videoOn } }
 *
 * Message types (server → client):
 *   { type: "joined",    channel, payload: { userId, members, history, handRaised, polls } }
 *   { type: "left",      channel, payload: { userId } }
 *   { type: "message",   channel, payload: <ChatMessage> }
 *   { type: "typing",    channel, payload: { userId, userName, isTyping } }
 *   { type: "presence",  payload: { users: PresenceUser[] } }
 *   { type: "error",     payload: { message } }
 *   { type: "user_joined_channel", channel, payload: { userId, userName } }
 *   { type: "user_left_channel",  channel, payload: { userId, userName } }
 *   { type: "reaction",  channel, payload: { userId, userName, emoji } }
 *   { type: "hand_raised", channel, payload: { userId, userName } }
 *   { type: "hand_lowered", channel, payload: { userId, userName } }
 *   { type: "poll_created", channel, payload: <PollData> }
 *   { type: "poll_voted",  channel, payload: <PollData> }
 *   { type: "caption",    channel, payload: { userId, userName, speaker, text } }
 *   { type: "participant_updated", channel, payload: { userId, userName, micOn, videoOn } }
 */

import { jwtVerify } from 'jose';

// ── JWT Configuration ───────────────────────────────────────────────────

const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  // Development: use the same fallback as the main project's env.ts
  return secret || 'alvision-default-secret-change-in-production';
})();

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  organizationId?: string | null;
}

interface AuthenticatedUser extends TokenPayload {
  userName: string;
}

async function verifyJwtToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'alvision',
    });
    return payload as unknown as TokenPayload;
  } catch {
    return null;
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
  label: string;
  votes: number;
  percentage: number;
  voters: string[]; // userIds who voted for this option
}

interface PollData {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  createdBy: string;
  createdByName: string;
}

interface IncomingMessage {
  type: string
  channel?: string
  payload?: Record<string, unknown>
}

// ── In-memory stores ────────────────────────────────────────────────────

const clients = new Map<string, ClientInfo>()        // userId → ClientInfo
const channelMembers = new Map<string, Set<string>>() // channelId → Set<userId>
const messageHistory: ChatMessage[] = []
const MAX_HISTORY = 500

// Track typing per channel
const typingUsers = new Map<string, Map<string, { userName: string; timer: ReturnType<typeof setTimeout> }>>()

// Meeting room state: hand-raised users per channel
const handRaisedUsers = new Map<string, Set<string>>() // channelId → Set<userId>

// Meeting room state: polls per channel
const channelPolls = new Map<string, PollData[]>() // channelId → PollData[]

// Meeting room state: participant media state per channel
const participantMediaState = new Map<string, Map<string, { micOn: boolean; videoOn: boolean }>>() // channelId → Map<userId, mediaState>

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

function getChannelHistory(channel: string, limit = 50): ChatMessage[] {
  return messageHistory
    .filter(m => m.channelId === channel)
    .slice(-limit)
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
  // Remove from all channels
  for (const ch of client.channels) {
    channelMembers.get(ch)?.delete(userId)
    // Clean up hand-raised state
    handRaisedUsers.get(ch)?.delete(userId)
    // Clean up participant media state
    participantMediaState.get(ch)?.delete(userId)
    broadcastToChannel(ch, {
      type: 'user_left_channel',
      channel: ch,
      payload: { userId, userName: client.userName },
    })
  }
  clients.delete(userId)
  // Broadcast updated presence
  broadcastPresence()
}

function broadcastPresence() {
  const presence = getPresenceList()
  for (const client of clients.values()) {
    send(client.ws, { type: 'presence', payload: { users: presence } })
  }
}

// ── Seed some demo history ──────────────────────────────────────────────

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

for (const dm of demoMessages) {
  messageHistory.push({
    ...dm,
    timestamp: new Date(Date.now() - Math.random() * 3600_000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
  })
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
    // ── Join a channel ──────────────────────────────────────────────────
    case 'join': {
      if (!channel) {
        send(ws, { type: 'error', payload: { message: 'Missing channel' } })
        return
      }
      client.channels.add(channel)
      if (!channelMembers.has(channel)) channelMembers.set(channel, new Set())
      channelMembers.get(channel)!.add(client.userId)

      // Ensure meeting-room state structures exist for this channel
      if (!handRaisedUsers.has(channel)) handRaisedUsers.set(channel, new Set())
      if (!channelPolls.has(channel)) channelPolls.set(channel, [])
      if (!participantMediaState.has(channel)) participantMediaState.set(channel, new Map())

      // Send join confirmation with history + meeting room state
      send(ws, {
        type: 'joined',
        channel,
        payload: {
          userId: client.userId,
          members: Array.from(channelMembers.get(channel) || []),
          history: getChannelHistory(channel),
          // Meeting room state
          handRaised: Array.from(handRaisedUsers.get(channel) || []),
          polls: channelPolls.get(channel) || [],
        },
      })

      // Notify others in channel
      broadcastToChannel(channel, {
        type: 'user_joined_channel',
        channel,
        payload: { userId: client.userId, userName: client.userName },
      }, ws)
      break
    }

    // ── Leave a channel ─────────────────────────────────────────────────
    case 'leave': {
      if (!channel) return
      client.channels.delete(channel)
      channelMembers.get(channel)?.delete(client.userId)
      // Clean up hand-raised state
      handRaisedUsers.get(channel)?.delete(client.userId)
      participantMediaState.get(channel)?.delete(client.userId)
      send(ws, { type: 'left', channel, payload: { userId: client.userId } })
      broadcastToChannel(channel, {
        type: 'user_left_channel',
        channel,
        payload: { userId: client.userId, userName: client.userName },
      })
      break
    }

    // ── Send a message ──────────────────────────────────────────────────
    case 'message': {
      if (!channel) {
        send(ws, { type: 'error', payload: { message: 'Missing channel' } })
        return
      }
      if (!client.channels.has(channel)) {
        send(ws, { type: 'error', payload: { message: 'Not in channel' } })
        return
      }
      // SECURITY: Force senderId and senderName from authenticated user,
      // ignoring any client-sent values to prevent impersonation
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

      // Store in history
      messageHistory.push(chatMsg)
      if (messageHistory.length > MAX_HISTORY) {
        messageHistory.splice(0, messageHistory.length - MAX_HISTORY)
      }

      // Broadcast to channel (including sender so they get the server timestamp)
      broadcastToChannel(channel, {
        type: 'message',
        channel,
        payload: chatMsg,
      })
      break
    }

    // ── Typing indicator ────────────────────────────────────────────────
    case 'typing': {
      if (!channel) return
      const isTyping = payload.isTyping as boolean

      if (!typingUsers.has(channel)) typingUsers.set(channel, new Map())
      const channelTyping = typingUsers.get(channel)!

      // Clear existing timer
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

    // ── Request full presence ───────────────────────────────────────────
    case 'presence': {
      send(ws, { type: 'presence', payload: { users: getPresenceList() } })
      break
    }

    // ── Emoji reaction (meeting room floating reaction) ────────────────
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
        payload: {
          userId: client.userId,
          userName: client.userName,
          emoji,
        },
      })
      break
    }

    // ── Hand raise ─────────────────────────────────────────────────────
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

    // ── Hand lower ─────────────────────────────────────────────────────
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

    // ── Poll creation ──────────────────────────────────────────────────
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
        options: options.map(label => ({
          label,
          votes: 0,
          percentage: 0,
          voters: [],
        })),
        totalVotes: 0,
        createdBy: client.userId,
        createdByName: client.userName,
      }

      if (!channelPolls.has(channel)) channelPolls.set(channel, [])
      channelPolls.get(channel)!.push(poll)

      broadcastToChannel(channel, {
        type: 'poll_created',
        channel,
        payload: poll,
      })
      break
    }

    // ── Poll voting ────────────────────────────────────────────────────
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

      // Check if user already voted in this poll — remove previous vote
      for (const opt of poll.options) {
        const idx = opt.voters.indexOf(client.userId)
        if (idx !== -1) {
          opt.voters.splice(idx, 1)
          opt.votes--
        }
      }

      // Add new vote
      const targetOption = poll.options.find(o => o.label === optionLabel)
      if (targetOption) {
        targetOption.voters.push(client.userId)
        targetOption.votes++
      }

      // Recalculate totals and percentages
      poll.totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0)
      for (const opt of poll.options) {
        opt.percentage = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0
      }

      broadcastToChannel(channel, {
        type: 'poll_voted',
        channel,
        payload: poll,
      })
      break
    }

    // ── Live caption broadcast ─────────────────────────────────────────
    case 'caption': {
      if (!channel) return
      if (!client.channels.has(channel)) return

      const speaker = (payload.speaker as string) || client.userName
      const text = (payload.text as string) || ''

      broadcastToChannel(channel, {
        type: 'caption',
        channel,
        payload: {
          userId: client.userId,
          userName: client.userName,
          speaker,
          text,
        },
      })
      break
    }

    // ── Participant media state update (mic/video toggle) ──────────────
    case 'participant_update': {
      if (!channel) return
      if (!client.channels.has(channel)) return

      const micOn = payload.micOn as boolean | undefined
      const videoOn = payload.videoOn as boolean | undefined

      // Only accept boolean values (not undefined)
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
        payload: {
          userId: client.userId,
          userName: client.userName,
          micOn: existing.micOn,
          videoOn: existing.videoOn,
        },
      })
      break
    }

    default:
      send(ws, { type: 'error', payload: { message: `Unknown type: ${type}` } })
  }
}

// ── Bun WebSocket server ────────────────────────────────────────────────

const PORT = 3010

const server = Bun.serve({
  port: PORT,
  fetch(req, server) {
    const url = new URL(req.url)

    // Health check (no auth required)
    if (url.pathname === '/health') {
      return Response.json({
        status: 'ok',
        service: 'alvision-chat',
        connections: clients.size,
        channels: channelMembers.size,
        messages: messageHistory.length,
        uptime: process.uptime(),
      })
    }

    // WebSocket upgrade — JWT authentication required
    if (url.pathname === '/' || url.pathname === '/ws') {
      const token = url.searchParams.get('token')

      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Authentication required', message: 'Missing JWT token. Provide ?token=<jwt> in the WebSocket URL.' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Verify JWT asynchronously
      // We need to handle this in fetch since jwtVerify is async
      return (async () => {
        const payload = await verifyJwtToken(token)

        if (!payload) {
          return new Response(
            JSON.stringify({ error: 'Authentication failed', message: 'Invalid or expired JWT token.' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          )
        }

        // Build authenticated user info — userName derived from email
        const authUser: AuthenticatedUser = {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
          organizationId: payload.organizationId,
          // Derive display name from email if not available elsewhere
          userName: payload.email.split('@')[0] || 'User',
        }

        // Upgrade with authenticated user data attached to the websocket
        if (server.upgrade(req, { data: authUser })) {
          return undefined // upgrade successful
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

      // Register authenticated client
      clients.set(userId, {
        ws,
        userId,
        userName,
        email,
        role,
        organizationId,
        channels: new Set(),
        lastSeen: Date.now(),
      })

      console.log(`[chat] Connected: ${userName} (${userId}, role: ${role}) — ${clients.size} total`)

      // Send welcome message
      send(ws, {
        type: 'presence',
        payload: { users: getPresenceList() },
      })
    },
    message(ws, message) {
      // Bun sends message as string for text frames
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
console.log(`   Auth: JWT required via ?token=<jwt> query parameter\n`)
