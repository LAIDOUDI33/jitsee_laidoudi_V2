'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { getAccessToken } from '@/lib/api'

// ── Types ───────────────────────────────────────────────────────────────

export interface ChatMessage {
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

export interface PresenceUser {
  userId: string
  userName: string
  status: 'active' | 'idle'
  channels: string[]
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

export interface UseChatOptions {
  url?: string
  userId: string
  userName: string
  baseBackoff?: number
  maxBackoff?: number
  maxRetries?: number
}

export interface UseChatReturn {
  status: ConnectionStatus
  messages: Record<string, ChatMessage[]>
  typingUsers: Record<string, string[]>
  onlineUsers: PresenceUser[]
  sendMessage: (channel: string, msg: Omit<ChatMessage, 'timestamp' | 'channelId' | 'status' | 'reactions'>) => void
  joinChannel: (channel: string) => void
  leaveChannel: (channel: string) => void
  setTyping: (channel: string, isTyping: boolean) => void
  reconnect: () => void
}

// ── Hook ────────────────────────────────────────────────────────────────

export function useChat({
  url = process.env.NEXT_PUBLIC_WS_URL || '',
  userId,
  userName,
  baseBackoff = 1000,
  maxBackoff = 30000,
  maxRetries = 5,
}: UseChatOptions): UseChatReturn {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({})
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({})
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])

  const wsRef = useRef<WebSocket | null>(null)
  const retryCountRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)
  const joinedChannelsRef = useRef<Set<string>>(new Set())

  // Store latest values in refs for stable access inside WS callbacks
  const configRef = useRef({ url, userId, userName, baseBackoff, maxBackoff, maxRetries })
  useEffect(() => {
    configRef.current = { url, userId, userName, baseBackoff, maxBackoff, maxRetries }
  }, [url, userId, userName, baseBackoff, maxBackoff, maxRetries])

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
        ws.close()
      }
    }
  }, [])

  // Process incoming server message — only uses stable setState
  const processMessage = useCallback((data: Record<string, unknown>) => {
    const { type, channel, payload } = data as { type: string; channel?: string; payload?: Record<string, unknown> }

    switch (type) {
      case 'joined': {
        if (payload?.history && Array.isArray(payload.history)) {
          const ch = channel || ''
          setMessages(prev => ({ ...prev, [ch]: payload.history as ChatMessage[] }))
        }
        break
      }
      case 'message': {
        const ch = channel || ''
        const msg = payload as unknown as ChatMessage
        setMessages(prev => {
          const existing = prev[ch] || []
          if (existing.some(m => m.id === msg.id)) return prev
          return { ...prev, [ch]: [...existing, msg] }
        })
        break
      }
      case 'typing': {
        const ch = channel || ''
        const p = payload as { userId: string; userName: string; isTyping: boolean }
        setTypingUsers(prev => {
          const channelTyping = prev[ch]?.filter(n => n !== p.userName) || []
          if (p.isTyping) channelTyping.push(p.userName)
          return { ...prev, [ch]: channelTyping }
        })
        break
      }
      case 'presence': {
        if (payload?.users && Array.isArray(payload.users)) {
          setOnlineUsers(payload.users as PresenceUser[])
        }
        break
      }
      case 'error': {
        console.warn('[useChat] Server error:', payload?.message)
        break
      }
    }
  }, [])

  // Connect — reads config from configRef, schedules reconnects via connectFnRef
  const connect = useCallback(() => {
    if (!mountedRef.current) return
    cleanup()

    const { url: currentUrl, userId: currentUserId, userName: currentUserName, baseBackoff: currentBaseBackoff, maxBackoff: currentMaxBackoff, maxRetries: currentMaxRetries } = configRef.current
    const isReconnect = retryCountRef.current > 0
    setStatus(isReconnect ? 'reconnecting' : 'connecting')

    // SECURITY: require JWT token for WebSocket connection
    const token = getAccessToken()
    if (!token) {
      console.warn('[useChat] No auth token — skipping WebSocket connection')
      setStatus('disconnected')
      return
    }

    const wsUrl = `${currentUrl}?token=${encodeURIComponent(token)}`
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
      console.log('[useChat] Connected')
      retryCountRef.current = 0
      setStatus('connected')

      for (const ch of joinedChannelsRef.current) {
        ws.send(JSON.stringify({
          type: 'join',
          channel: ch,
          payload: { userId: currentUserId, userName: currentUserName },
        }))
      }
      ws.send(JSON.stringify({ type: 'presence' }))
    }

    ws.onmessage = (event) => {
      if (!mountedRef.current) return
      try {
        processMessage(JSON.parse(event.data as string))
      } catch {
        // ignore malformed
      }
    }

    ws.onclose = (event) => {
      if (!mountedRef.current) return
      wsRef.current = null
      console.log(`[useChat] Disconnected (code: ${event.code})`)

      if (event.code !== 1000) {
        const delay = Math.min(
          currentBaseBackoff * Math.pow(2, retryCountRef.current),
          currentMaxBackoff,
        )
        retryCountRef.current++
        if (retryCountRef.current <= currentMaxRetries) {
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

  // Keep the connect ref updated via effect (not during render)
  useEffect(() => {
    connectFnRef.current = connect
  }, [connect])

  // Public API
  const sendMessage = useCallback((channel: string, msg: Omit<ChatMessage, 'timestamp' | 'channelId' | 'status' | 'reactions'>) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify({ type: 'message', channel, payload: msg }))
  }, [])

  const joinChannel = useCallback((channel: string) => {
    joinedChannelsRef.current.add(channel)
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'join',
        channel,
        payload: { userId: configRef.current.userId, userName: configRef.current.userName },
      }))
    }
  }, [])

  const leaveChannel = useCallback((channel: string) => {
    joinedChannelsRef.current.delete(channel)
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'leave',
        channel,
        payload: { userId: configRef.current.userId },
      }))
    }
  }, [])

  const setTyping = useCallback((channel: string, isTyping: boolean) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify({
      type: 'typing',
      channel,
      payload: { userId: configRef.current.userId, userName: configRef.current.userName, isTyping },
    }))
  }, [])

  const reconnect = useCallback(() => {
    retryCountRef.current = 0
    connect()
  }, [connect])

  // Lifecycle: connect on mount, disconnect on unmount
  useEffect(() => {
    mountedRef.current = true
    // Defer connect to avoid synchronous setState in effect
    const id = setTimeout(() => connect(), 0)
    return () => {
      mountedRef.current = false
      clearTimeout(id)
      cleanup()
      // Use a ref-based setter to avoid the lint warning on cleanup
      // (component is unmounting, so direct setState is fine here)
    }
  }, [connect, cleanup])

  return {
    status,
    messages,
    typingUsers,
    onlineUsers,
    sendMessage,
    joinChannel,
    leaveChannel,
    setTyping,
    reconnect,
  }
}
