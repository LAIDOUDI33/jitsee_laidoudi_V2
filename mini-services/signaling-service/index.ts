/**
 * ALVISION Signaling Service — WebRTC signaling mini-service
 * Port: 3011
 * Protocol: JSON over WebSocket (Bun native WebSocket)
 *
 * Mesh topology: each peer connects directly to every other peer
 * (suitable for small meetings up to ~8 participants).
 *
 * Authentication: JWT token sent as the first message after connecting.
 */

import { jwtVerify } from 'jose'

// ── JWT Configuration ───────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || 'alvision-jwt-secret-change-me'

interface TokenPayload {
  userId: string
  email: string
  role: string
  organizationId?: string | null
  name?: string
}

async function verifyJwtToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as TokenPayload
  } catch {
    return null
  }
}

// ── Types ───────────────────────────────────────────────────────────────

interface ParticipantInfo {
  userId: string
  userName: string
}

interface ConnectionState {
  ws: WebSocket
  userId: string
  userName: string
  meetingId: string | null
  authenticated: boolean
}

interface SignalData {
  type: 'offer' | 'answer' | 'candidate'
  sdp?: string
  candidate?: RTCIceCandidateInit
}

interface IncomingMessage {
  type: string
  token?: string
  meetingId?: string
  targetUserId?: string
  signal?: SignalData
  mediaType?: string
  enabled?: boolean
  timestamp?: number
}

// ── In-memory stores ─────────────────────────────────────────────────────

// rooms: meetingId → Map<userId, ConnectionState>
const rooms = new Map<string, Map<string, ConnectionState>>()

// Global lookup: userId → ConnectionState (for reconnection handling)
const connections = new Map<string, ConnectionState>()

// ── Helpers ─────────────────────────────────────────────────────────────

function send(ws: WebSocket, data: Record<string, unknown>) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data))
  }
}

function broadcastToRoom(meetingId: string, data: Record<string, unknown>, excludeWs?: WebSocket) {
  const room = rooms.get(meetingId)
  if (!room) return
  for (const conn of room.values()) {
    if (conn.ws !== excludeWs && conn.ws.readyState === WebSocket.OPEN) {
      send(conn.ws, data)
    }
  }
}

function getRoomParticipants(meetingId: string): ParticipantInfo[] {
  const room = rooms.get(meetingId)
  if (!room) return []
  return Array.from(room.values()).map(c => ({ userId: c.userId, userName: c.userName }))
}

function removeConnectionFromRoom(conn: ConnectionState) {
  if (!conn.meetingId) return
  const room = rooms.get(conn.meetingId)
  if (!room) return
  room.delete(conn.userId)
  connections.delete(conn.userId)

  // Clean up empty room
  if (room.size === 0) {
    rooms.delete(conn.meetingId)
  } else {
    // Broadcast participant_left to remaining peers
    broadcastToRoom(conn.meetingId, {
      type: 'participant_left',
      userId: conn.userId,
      userName: conn.userName,
    })
    console.log(`[signal] ${conn.userName} left room ${conn.meetingId} — ${room.size} remaining`)
  }
}

// ── Message handler ─────────────────────────────────────────────────────

function handleMessage(ws: WebSocket, raw: string) {
  let msg: IncomingMessage
  try {
    msg = JSON.parse(raw)
  } catch {
    send(ws, { type: 'error', message: 'Invalid JSON' })
    return
  }

  // Use the __conn reference directly — it's always available
  const conn = (ws as WebSocket & { __conn: ConnectionState }).__conn
  if (!conn) {
    send(ws, { type: 'error', message: 'Connection state not found' })
    return
  }

  // For non-auth messages, require authentication
  if (msg.type !== 'auth' && msg.type !== 'ping' && !conn.authenticated) {
    send(ws, { type: 'error', message: 'Not authenticated' })
    return
  }

  switch (msg.type) {
    // ── Authentication (first message after connect) ───────────────────
    case 'auth': {
      // Already authenticated
      if (conn.authenticated) {
        send(ws, { type: 'auth_ok', userId: conn.userId, userName: conn.userName })
        return
      }

      const token = msg.token
      if (!token) {
        send(ws, { type: 'auth_error', message: 'Missing token' })
        ws.close(4001, 'Missing token')
        return
      }

      // Verify token async
      verifyJwtToken(token).then(payload => {
        if (!payload) {
          send(ws, { type: 'auth_error', message: 'Invalid or expired token' })
          ws.close(4001, 'Invalid token')
          return
        }

        conn.authenticated = true
        conn.userId = payload.userId
        conn.userName = payload.name || payload.email.split('@')[0] || 'User'

        // Register in global connections map (for reconnection handling)
        connections.set(conn.userId, conn)

        console.log(`[signal] Authenticated: ${conn.userName} (${conn.userId})`)
        send(ws, { type: 'auth_ok', userId: conn.userId, userName: conn.userName })
      }).catch(() => {
        send(ws, { type: 'auth_error', message: 'Token verification failed' })
        ws.close(4001, 'Token verification failed')
      })
      break
    }

    // ── Join a meeting room ────────────────────────────────────────────
    case 'join_room': {
      if (!conn.authenticated) {
        send(ws, { type: 'error', message: 'Not authenticated' })
        return
      }

      const meetingId = msg.meetingId
      if (!meetingId) {
        send(ws, { type: 'error', message: 'Missing meetingId' })
        return
      }

      // If already in a room, leave first
      if (conn.meetingId) {
        const oldRoom = rooms.get(conn.meetingId)
        if (oldRoom) {
          oldRoom.delete(conn.userId)
          broadcastToRoom(conn.meetingId, {
            type: 'participant_left',
            userId: conn.userId,
            userName: conn.userName,
          })
          if (oldRoom.size === 0) rooms.delete(conn.meetingId)
        }
      }

      // Handle reconnection: if same userId is already in this room, replace
      const room = rooms.get(meetingId) || new Map<string, ConnectionState>()

      const existingConn = room.get(conn.userId)
      if (existingConn && existingConn.ws !== ws) {
        // Close old connection silently
        try { existingConn.ws.close(4002, 'Replaced by new connection') } catch { /* ignore */ }
        console.log(`[signal] Replacing stale connection for ${conn.userId}`)
      }

      // Also check global connections map
      const globalExisting = connections.get(conn.userId)
      if (globalExisting && globalExisting.ws !== ws) {
        try { globalExisting.ws.close(4002, 'Replaced by new connection') } catch { /* ignore */ }
      }

      conn.meetingId = meetingId
      room.set(conn.userId, conn)
      rooms.set(meetingId, room)
      connections.set(conn.userId, conn)

      const participants = getRoomParticipants(meetingId).filter(p => p.userId !== conn.userId)

      send(ws, {
        type: 'room_joined',
        meetingId,
        participants,
      })

      broadcastToRoom(meetingId, {
        type: 'participant_joined',
        userId: conn.userId,
        userName: conn.userName,
      }, ws)

      console.log(`[signal] ${conn.userName} joined room ${meetingId} — ${room.size} participants`)
      break
    }

    // ── WebRTC signaling (offer / answer / candidate) ──────────────────
    case 'signal': {
      if (!conn.authenticated) {
        send(ws, { type: 'error', message: 'Not authenticated' })
        return
      }
      if (!conn.meetingId) {
        send(ws, { type: 'error', message: 'Not in a room' })
        return
      }

      const targetUserId = msg.targetUserId
      if (!targetUserId) {
        send(ws, { type: 'error', message: 'Missing targetUserId' })
        return
      }

      const signal = msg.signal
      if (!signal || !['offer', 'answer', 'candidate'].includes(signal.type)) {
        send(ws, { type: 'error', message: 'Invalid signal — must be offer, answer, or candidate' })
        return
      }

      const room = rooms.get(conn.meetingId)
      if (!room) {
        send(ws, { type: 'error', message: 'Room not found' })
        return
      }

      const target = room.get(targetUserId)
      if (!target || target.ws.readyState !== WebSocket.OPEN) {
        send(ws, { type: 'error', message: `Target user ${targetUserId} not found in room` })
        return
      }

      send(target.ws, {
        type: 'signal',
        fromUserId: conn.userId,
        fromUserName: conn.userName,
        signal,
      })
      break
    }

    // ── Leave room ─────────────────────────────────────────────────────
    case 'leave_room': {
      if (!conn.meetingId) return
      const meetingId = conn.meetingId
      removeConnectionFromRoom(conn)
      conn.meetingId = null
      console.log(`[signal] ${conn.userName} explicitly left room ${meetingId}`)
      break
    }

    // ── Media toggle broadcast ─────────────────────────────────────────
    case 'media_toggle': {
      if (!conn.authenticated) {
        send(ws, { type: 'error', message: 'Not authenticated' })
        return
      }
      if (!conn.meetingId) {
        send(ws, { type: 'error', message: 'Not in a room' })
        return
      }

      const mediaType = msg.mediaType
      const enabled = msg.enabled
      if (!mediaType || !['audio', 'video', 'screen'].includes(mediaType)) {
        send(ws, { type: 'error', message: 'Invalid mediaType — must be audio, video, or screen' })
        return
      }
      if (typeof enabled !== 'boolean') {
        send(ws, { type: 'error', message: 'Missing or invalid enabled boolean' })
        return
      }

      broadcastToRoom(conn.meetingId, {
        type: 'media_toggle',
        userId: conn.userId,
        userName: conn.userName,
        mediaType,
        enabled,
      })
      break
    }

    // ── Ping / Pong for connection quality ─────────────────────────────
    case 'ping': {
      send(ws, { type: 'pong', timestamp: msg.timestamp ?? Date.now() })
      break
    }

    default:
      send(ws, { type: 'error', message: `Unknown message type: ${msg.type}` })
  }
}

// ── Server ───────────────────────────────────────────────────────────────

const PORT = 3011

const server = Bun.serve({
  port: PORT,
  fetch(req, server) {
    const url = new URL(req.url)

    // Health check
    if (url.pathname === '/health') {
      return Response.json({
        status: 'ok',
        service: 'alvision-signaling',
        connections: connections.size,
        rooms: rooms.size,
        totalParticipants: Array.from(rooms.values()).reduce((sum, room) => sum + room.size, 0),
        uptime: process.uptime(),
      })
    }

    // WebSocket upgrade — authentication happens via first message
    if (url.pathname === '/' || url.pathname === '/ws') {
      // Create a placeholder connection (not yet authenticated)
      const placeholderConn: ConnectionState = {
        ws: null as unknown as WebSocket,
        userId: '',
        userName: '',
        meetingId: null,
        authenticated: false,
      }

      if (server.upgrade(req, { data: placeholderConn })) {
        return undefined
      }
      return new Response('WebSocket upgrade failed', { status: 500 })
    }

    return new Response('Not Found', { status: 404 })
  },
  websocket: {
    open(ws) {
      const conn = (ws as WebSocket & { data: ConnectionState }).data
      // Bind the WebSocket to the connection state
      conn.ws = ws
      // Set up the __conn reference on ws for quick lookup
      ;(ws as WebSocket & { __conn: ConnectionState }).__conn = conn
      // Temporarily store in connections under a placeholder until authenticated
      // We don't store yet — will be stored on auth
    },
    message(ws, message) {
      if (typeof message === 'string') {
        handleMessage(ws, message)
      }
    },
    close(ws, code, reason) {
      const conn = (ws as WebSocket & { __conn: ConnectionState }).__conn
      if (conn) {
        if (conn.authenticated) {
          console.log(`[signal] Disconnected: ${conn.userName} (${conn.userId}, code: ${code})`)
          removeConnectionFromRoom(conn)
        }
        connections.delete(conn.userId)
      }
    },
    drain(ws) {
      // backpressure handled
    },
  },
})

console.log(`\n🚀 ALVISION Signaling Service running on ws://localhost:${PORT}`)
console.log(`   Health: http://localhost:${PORT}/health`)
console.log(`   Auth: JWT token sent as first message ({ type: 'auth', token: '...' })`)
console.log(`   Topology: Mesh (P2P) — suitable for meetings up to ~8 participants\n`)
