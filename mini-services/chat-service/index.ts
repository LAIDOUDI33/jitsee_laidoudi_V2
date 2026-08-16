/**
 * ALVISION Chat Service — Real-time WebSocket chat mini-service
 * Port: 3010
 * Protocol: JSON over WebSocket
 *
 * Message types (client → server):
 *   { type: "join",      channel: string, payload: { userId, userName } }
 *   { type: "leave",     channel: string, payload: { userId } }
 *   { type: "message",   channel: string, payload: { id, senderId, senderName, content, avatar? } }
 *   { type: "typing",    channel: string, payload: { userId, userName, isTyping } }
 *   { type: "presence"  }   // request full presence list
 *
 * Message types (server → client):
 *   { type: "joined",    channel, payload: { userId, members, history } }
 *   { type: "left",      channel, payload: { userId } }
 *   { type: "message",   channel, payload: <ChatMessage> }
 *   { type: "typing",    channel, payload: { userId, userName, isTyping } }
 *   { type: "presence",  payload: { users: PresenceUser[] } }
 *   { type: "error",     payload: { message } }
 *   { type: "user_joined_channel", channel, payload: { userId, userName } }
 *   { type: "user_left_channel",  channel, payload: { userId, userName } }
 */

// ── Types ───────────────────────────────────────────────────────────────

interface ClientInfo {
  ws: WebSocket
  userId: string
  userName: string
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
  status: 'active' | 'idle'
  channels: string[]
}

interface IncomingMessage {
  type: string
  channel?: string
  payload?: Record<string, unknown>
}

// ── In-memory stores ────────────────────────────────────────────────────

const clients = new Map<string, ClientInfo>()        // ws → ClientInfo
const channelMembers = new Map<string, Set<string>>() // channelId → Set<userId>
const messageHistory: ChatMessage[] = []
const MAX_HISTORY = 500

// Track typing per channel
const typingUsers = new Map<string, Map<string, { userName: string; timer: ReturnType<typeof setTimeout> }>>()

// ── Helpers ─────────────────────────────────────────────────────────────

function getClientByWs(ws: WebSocket): ClientInfo | undefined {
  for (const c of clients.values()) {
    if (c.ws === ws) return c
  }
  return undefined
}

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

  const client = getClientByWs(ws)
  if (!client) {
    send(ws, { type: 'error', payload: { message: 'Not identified' } })
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

      // Send join confirmation with history
      send(ws, {
        type: 'joined',
        channel,
        payload: {
          userId: client.userId,
          members: Array.from(channelMembers.get(channel) || []),
          history: getChannelHistory(channel),
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
      const chatMsg: ChatMessage = {
        id: (payload.id as string) || `srv-${Date.now()}`,
        channelId: channel,
        senderId: (payload.senderId as string) || client.userId,
        senderName: (payload.senderName as string) || client.userName,
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
          userName: (payload.userName as string) || client.userName,
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
        payload: { userId: client.userId, userName: (payload.userName as string) || client.userName, isTyping },
      })
      break
    }

    // ── Request full presence ───────────────────────────────────────────
    case 'presence': {
      send(ws, { type: 'presence', payload: { users: getPresenceList() } })
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
    // Only upgrade WebSocket connections at /
    const url = new URL(req.url)
    if (url.pathname === '/' || url.pathname === '/ws') {
      if (server.upgrade(req)) return
      return new Response('WebSocket upgrade failed', { status: 500 })
    }
    // Health check
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
    return new Response('Not Found', { status: 404 })
  },
  websocket: {
    open(ws) {
      // Assign a temp ID; real identity comes via 'join' payload
      const tempId = `anon-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      clients.set(tempId, {
        ws,
        userId: tempId,
        userName: 'Anonymous',
        channels: new Set(),
        lastSeen: Date.now(),
      })
      console.log(`[chat] Connected: ${tempId} (${clients.size} total)`)
    },
    message(ws, message) {
      // Bun sends message as string for text frames
      if (typeof message === 'string') {
        handleMessage(ws, message)
      }
    },
    close(ws, code, reason) {
      const client = getClientByWs(ws)
      if (client) {
        console.log(`[chat] Disconnected: ${client.userId} (code: ${code})`)
        removeClient(client.userId)
      }
    },
    drain(ws) {
      // backpressure handled
    },
  },
})

console.log(`\n🚀 ALVISION Chat Service running on ws://localhost:${PORT}`)
console.log(`   Health: http://localhost:${PORT}/health\n`)
