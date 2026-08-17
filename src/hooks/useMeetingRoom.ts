'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ── Types ───────────────────────────────────────────────────────────────

export interface MeetingChatMessage {
  id: string
  channelId: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
  avatar?: string
  status?: 'sent' | 'delivered' | 'read'
  isBot?: boolean
  reactions?: Record<string, number>
}

export interface PollOption {
  label: string
  votes: number
  percentage: number
  voters?: string[]
}

export interface PollData {
  id: string
  question: string
  options: PollOption[]
  totalVotes: number
  createdBy?: string
  createdByName?: string
}

export interface CaptionData {
  userId: string
  userName: string
  speaker: string
  text: string
}

export interface ParticipantMediaState {
  userId: string
  userName: string
  micOn: boolean
  videoOn: boolean
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

export interface UseMeetingRoomOptions {
  meetingId: string
  userId: string
  userName: string
  baseBackoff?: number
  maxBackoff?: number
  maxRetries?: number
}

export interface UseMeetingRoomReturn {
  status: ConnectionStatus
  chatMessages: MeetingChatMessage[]
  typingUsers: string[]
  handRaisedUsers: string[]
  polls: PollData[]
  currentCaption: CaptionData | null
  participantMediaStates: Map<string, ParticipantMediaState>
  // Actions
  sendMessage: (content: string) => void
  setTyping: (isTyping: boolean) => void
  sendReaction: (emoji: string) => void
  raiseHand: () => void
  lowerHand: () => void
  createPoll: (question: string, options: string[]) => void
  votePoll: (pollId: string, optionLabel: string) => void
  sendCaption: (speaker: string, text: string) => void
  updateMediaState: (micOn: boolean, videoOn: boolean) => void
  reconnect: () => void
  disconnect: () => void
  setOnReaction: (handler: ((data: { userId: string; userName: string; emoji: string }) => void) | null) => void
}

// ── Hook ────────────────────────────────────────────────────────────────

export function useMeetingRoom({
  meetingId,
  userId,
  userName,
  baseBackoff = 1000,
  maxBackoff = 30000,
  maxRetries = 5,
}: UseMeetingRoomOptions): UseMeetingRoomReturn {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [chatMessages, setChatMessages] = useState<MeetingChatMessage[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [handRaisedUsers, setHandRaisedUsers] = useState<string[]>([])
  const [polls, setPolls] = useState<PollData[]>([])
  const [currentCaption, setCurrentCaption] = useState<CaptionData | null>(null)
  const [participantMediaStates, setParticipantMediaStates] = useState<Map<string, ParticipantMediaState>>(new Map())

  const wsRef = useRef<WebSocket | null>(null)
  const retryCountRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)
  const hasJoinedRef = useRef(false)

  // Store latest values in refs for stable access inside WS callbacks
  const configRef = useRef({ meetingId, userId, userName, baseBackoff, maxBackoff, maxRetries })
  useEffect(() => {
    configRef.current = { meetingId, userId, userName, baseBackoff, maxBackoff, maxRetries }
  }, [meetingId, userId, userName, baseBackoff, maxBackoff, maxRetries])

  // Ref to hold the latest connect function for use in onclose handler
  const connectFnRef = useRef<() => void>(() => {})

  // Cleanup helper
  const cleanup = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
    if (wsRef.current) {
      const ws = wsRef.current
      wsRef.current = null
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, 'cleanup')
      }
    }
    hasJoinedRef.current = false
  }, [])

  // Process incoming server message
  const processMessage = useCallback((data: Record<string, unknown>) => {
    const { type, payload } = data as { type: string; channel?: string; payload?: Record<string, unknown> }

    switch (type) {
      case 'joined': {
        // Received history, polls, and hand-raised state on join
        if (payload?.history && Array.isArray(payload.history)) {
          setChatMessages(payload.history as MeetingChatMessage[])
        }
        if (payload?.handRaised && Array.isArray(payload.handRaised)) {
          setHandRaisedUsers(payload.handRaised as string[])
        }
        if (payload?.polls && Array.isArray(payload.polls)) {
          setPolls(payload.polls as PollData[])
        }
        hasJoinedRef.current = true
        break
      }
      case 'message': {
        const msg = payload as unknown as MeetingChatMessage
        setChatMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        break
      }
      case 'typing': {
        const p = payload as { userId: string; userName: string; isTyping: boolean }
        setTypingUsers(prev => {
          const filtered = prev.filter(uid => uid !== p.userId)
          if (p.isTyping) filtered.push(p.userId)
          return filtered
        })
        break
      }
      case 'reaction': {
        // Handled by the component for floating reactions
        // We just re-broadcast this as a custom event so the component can pick it up
        break
      }
      case 'hand_raised': {
        const p = payload as { userId: string }
        setHandRaisedUsers(prev => {
          if (prev.includes(p.userId)) return prev
          return [...prev, p.userId]
        })
        break
      }
      case 'hand_lowered': {
        const p = payload as { userId: string }
        setHandRaisedUsers(prev => prev.filter(uid => uid !== p.userId))
        break
      }
      case 'poll_created': {
        const poll = payload as unknown as PollData
        setPolls(prev => [...prev, poll])
        break
      }
      case 'poll_voted': {
        const poll = payload as unknown as PollData
        setPolls(prev => prev.map(p => p.id === poll.id ? poll : p))
        break
      }
      case 'caption': {
        const cap = payload as CaptionData
        setCurrentCaption(cap)
        break
      }
      case 'participant_updated': {
        const p = payload as ParticipantMediaState
        setParticipantMediaStates(prev => {
          const next = new Map(prev)
          next.set(p.userId, p)
          return next
        })
        break
      }
      case 'error': {
        console.warn('[useMeetingRoom] Server error:', (payload as { message?: string })?.message)
        break
      }
    }
  }, [])

  // Callbacks for raw incoming events that the component needs to handle directly
  // (e.g., floating reactions need to be processed with extra UI logic)
  const onReactionRef = useRef<((data: { userId: string; userName: string; emoji: string }) => void) | null>(null)

  // Connect — reads config from configRef, schedules reconnects via connectFnRef
  const connect = useCallback(() => {
    if (!mountedRef.current) return
    cleanup()

    const { userId: currentUserId, userName: currentUserName, baseBackoff: curBaseBackoff, maxBackoff: curMaxBackoff, maxRetries: curMaxRetries } = configRef.current
    const isReconnect = retryCountRef.current > 0
    setStatus(isReconnect ? 'reconnecting' : 'connecting')

    // Build WebSocket URL — token from localStorage for auth
    const token = typeof window !== 'undefined'
      ? (localStorage.getItem('alvision_access_token') || '')
      : ''

    // SECURITY: refuse to connect without a valid auth token
    if (!token) {
      console.warn('[useMeetingRoom] No auth token — skipping WebSocket connection')
      setStatus('disconnected')
      return
    }

    const baseUrl = process.env.NEXT_PUBLIC_WS_URL || ''
    const wsUrl = `${baseUrl}?token=${encodeURIComponent(token)}`

    let ws: WebSocket
    try {
      ws = new WebSocket(wsUrl)
    } catch {
      setStatus('disconnected')
      return
    }
    wsRef.current = ws

    ws.onopen = () => {
      if (!mountedRef.current) { ws.close(); return }
      console.log('[useMeetingRoom] Connected')
      retryCountRef.current = 0
      setStatus('connected')

      // Auto-join the meeting channel
      const ch = `meeting-${configRef.current.meetingId}`
      ws.send(JSON.stringify({
        type: 'join',
        channel: ch,
        payload: { userName: currentUserName },
      }))
    }

    ws.onmessage = (event) => {
      if (!mountedRef.current) return
      try {
        const data = JSON.parse(event.data as string)
        // Handle reactions via ref callback for floating UI
        if (data.type === 'reaction' && data.payload) {
          onReactionRef.current?.(data.payload as { userId: string; userName: string; emoji: string })
        }
        processMessage(data)
      } catch {
        // ignore malformed
      }
    }

    ws.onclose = (event) => {
      if (!mountedRef.current) return
      wsRef.current = null
      console.log(`[useMeetingRoom] Disconnected (code: ${event.code})`)

      if (event.code !== 1000) {
        const delay = Math.min(
          curBaseBackoff * Math.pow(2, retryCountRef.current),
          curMaxBackoff,
        )
        retryCountRef.current++
        if (retryCountRef.current <= curMaxRetries) {
          setStatus('reconnecting')
          retryTimerRef.current = setTimeout(() => connectFnRef.current(), delay)
        } else {
          setStatus('disconnected')
        }
      } else {
        setStatus('disconnected')
      }
    }

    ws.onerror = () => {
      // onclose fires after onerror
    }
  }, [cleanup, processMessage])

  // Keep the connect ref updated via effect
  useEffect(() => {
    connectFnRef.current = connect
  }, [connect])

  // Public API
  const sendRaw = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify(data))
  }, [])

  const sendMessage = useCallback((content: string) => {
    const ch = `meeting-${configRef.current.meetingId}`
    sendRaw({ type: 'message', channel: ch, payload: { content } })
  }, [sendRaw])

  const setTyping = useCallback((isTyping: boolean) => {
    const ch = `meeting-${configRef.current.meetingId}`
    sendRaw({ type: 'typing', channel: ch, payload: { isTyping } })
  }, [sendRaw])

  const sendReaction = useCallback((emoji: string) => {
    const ch = `meeting-${configRef.current.meetingId}`
    sendRaw({ type: 'reaction', channel: ch, payload: { emoji } })
  }, [sendRaw])

  const raiseHand = useCallback(() => {
    const ch = `meeting-${configRef.current.meetingId}`
    sendRaw({ type: 'hand_raise', channel: ch })
  }, [sendRaw])

  const lowerHand = useCallback(() => {
    const ch = `meeting-${configRef.current.meetingId}`
    sendRaw({ type: 'hand_lower', channel: ch })
  }, [sendRaw])

  const createPoll = useCallback((question: string, options: string[]) => {
    const ch = `meeting-${configRef.current.meetingId}`
    sendRaw({ type: 'poll_create', channel: ch, payload: { question, options } })
  }, [sendRaw])

  const votePoll = useCallback((pollId: string, optionLabel: string) => {
    const ch = `meeting-${configRef.current.meetingId}`
    sendRaw({ type: 'poll_vote', channel: ch, payload: { pollId, optionLabel } })
  }, [sendRaw])

  const sendCaption = useCallback((speaker: string, text: string) => {
    const ch = `meeting-${configRef.current.meetingId}`
    sendRaw({ type: 'caption', channel: ch, payload: { speaker, text } })
  }, [sendRaw])

  const updateMediaState = useCallback((micOn: boolean, videoOn: boolean) => {
    const ch = `meeting-${configRef.current.meetingId}`
    sendRaw({ type: 'participant_update', channel: ch, payload: { micOn, videoOn } })
  }, [sendRaw])

  const reconnect = useCallback(() => {
    retryCountRef.current = 0
    connect()
  }, [connect])

  const disconnect = useCallback(() => {
    // Send leave message before closing
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const ch = `meeting-${configRef.current.meetingId}`
      wsRef.current.send(JSON.stringify({ type: 'leave', channel: ch }))
    }
    retryCountRef.current = maxRetries + 1 // prevent auto-reconnect
    cleanup()
    setStatus('disconnected')
  }, [cleanup, maxRetries])

  // Set reaction callback for external handlers
  const setOnReaction = useCallback((handler: ((data: { userId: string; userName: string; emoji: string }) => void) | null) => {
    onReactionRef.current = handler
  }, [])

  // Lifecycle: connect on mount, disconnect on unmount
  useEffect(() => {
    mountedRef.current = true
    // Defer connect to avoid synchronous setState in effect
    const id = setTimeout(() => connect(), 0)
    return () => {
      mountedRef.current = false
      clearTimeout(id)
      cleanup()
    }
  }, [connect, cleanup])

  return {
    status,
    chatMessages,
    typingUsers,
    handRaisedUsers,
    polls,
    currentCaption,
    participantMediaStates,
    sendMessage,
    setTyping,
    sendReaction,
    raiseHand,
    lowerHand,
    createPoll,
    votePoll,
    sendCaption,
    updateMediaState,
    reconnect,
    disconnect,
    // Expose internal for advanced use
    setOnReaction,
  }
}
