'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ── Types ───────────────────────────────────────────────────────────────

export interface RemoteParticipant {
  id: string
  name: string
  stream: MediaStream | null
  micOn: boolean
  videoOn: boolean
  screenStream: MediaStream | null
}

export interface WebRTCStats {
  localAudioLevel: number
  localVideoResolution: string
  rtt: number
  packetsLost: number
  bitrate: number
}

export interface UseWebRTCConfig {
  meetingId: string
  userId: string
  userName: string
  enabled: boolean
  baseBackoff?: number
  maxBackoff?: number
  maxRetries?: number
}

export type WebRTCConnectionState = 'disconnected' | 'connecting' | 'connected'

interface SignalMessage {
  type: string
  payload?: Record<string, unknown>
  targetUserId?: string
  fromUserId?: string
  fromUserName?: string
  sdp?: RTCSessionDescriptionInit
}

// ── ICE Servers ──────────────────────────────────────────────────────────

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

// ── Default stats ───────────────────────────────────────────────────────

const DEFAULT_STATS: WebRTCStats = {
  localAudioLevel: 0,
  localVideoResolution: '',
  rtt: 0,
  packetsLost: 0,
  bitrate: 0,
}

// ── Hook ────────────────────────────────────────────────────────────────

export function useWebRTC({
  meetingId,
  userId,
  userName,
  enabled,
  baseBackoff = 1000,
  maxBackoff = 30000,
  maxRetries = 5,
}: UseWebRTCConfig) {
  // ── State (triggers re-renders) ────────────────────────────────────────
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteParticipants, setRemoteParticipants] = useState<Map<string, RemoteParticipant>>(new Map())
  const [mediaState, setMediaState] = useState({ audio: true, video: true, screen: false })
  const [connectionState, setConnectionState] = useState<WebRTCConnectionState>('disconnected')
  const [stats, setStats] = useState<WebRTCStats>(DEFAULT_STATS)

  // ── Refs (avoid stale closures) ────────────────────────────────────────
  const wsRef = useRef<WebSocket | null>(null)
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const localStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const mountedRef = useRef(true)
  const hasJoinedRef = useRef(false)
  const retryCountRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioLevelIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const connectFnRef = useRef<() => void>(() => {})
  const mediaStateRef = useRef(mediaState)

  // Store latest config values for stable access in WS callbacks
  const configRef = useRef({ meetingId, userId, userName, enabled, baseBackoff, maxBackoff, maxRetries })
  useEffect(() => {
    configRef.current = { meetingId, userId, userName, enabled, baseBackoff, maxBackoff, maxRetries }
  }, [meetingId, userId, userName, enabled, baseBackoff, maxBackoff, maxRetries])

  // Keep mediaState ref in sync
  useEffect(() => {
    mediaStateRef.current = mediaState
  }, [mediaState])

  // ── Local media acquisition ────────────────────────────────────────────
  const acquireLocalStream = useCallback(async (audio: boolean, video: boolean): Promise<MediaStream | null> => {
    try {
      if (!audio && !video) {
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(t => t.stop())
          localStreamRef.current = null
          setLocalStream(null)
        }
        return null
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio,
        video: video ? { width: 1280, height: 720, facingMode: 'user' } : false,
      })
      localStreamRef.current = stream
      setLocalStream(stream)
      return stream
    } catch (err) {
      console.warn('[useWebRTC] getUserMedia failed:', err)
      return null
    }
  }, [])

  // ── Audio level monitoring ─────────────────────────────────────────────
  const setupAudioMonitoring = useCallback((stream: MediaStream) => {
    // Cleanup previous
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current)
      audioLevelIntervalRef.current = null
    }
    if (audioSourceRef.current) {
      try { audioSourceRef.current.disconnect() } catch { /* ok */ }
      audioSourceRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close() } catch { /* ok */ }
      audioContextRef.current = null
    }

    const audioTracks = stream.getAudioTracks()
    if (audioTracks.length === 0) {
      setStats(prev => ({ ...prev, localAudioLevel: 0 }))
      return
    }

    try {
      const ctx = new AudioContext()
      audioContextRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      audioSourceRef.current = source
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      source.connect(analyser)
      analyserRef.current = analyser

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      audioLevelIntervalRef.current = setInterval(() => {
        if (!mountedRef.current || !analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i]
        const avg = sum / dataArray.length
        const normalized = Math.min(avg / 128, 1)
        setStats(prev => ({ ...prev, localAudioLevel: normalized }))
      }, 100)
    } catch (err) {
      console.warn('[useWebRTC] Audio monitoring setup failed:', err)
    }
  }, [])

  const stopAudioMonitoring = useCallback(() => {
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current)
      audioLevelIntervalRef.current = null
    }
    if (audioSourceRef.current) {
      try { audioSourceRef.current.disconnect() } catch { /* ok */ }
      audioSourceRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close() } catch { /* ok */ }
      audioContextRef.current = null
    }
    analyserRef.current = null
    setStats(prev => ({ ...prev, localAudioLevel: 0 }))
  }, [])

  // ── Stats collection ───────────────────────────────────────────────────
  const startStatsCollection = useCallback(() => {
    if (statsIntervalRef.current) clearInterval(statsIntervalRef.current)
    statsIntervalRef.current = setInterval(async () => {
      if (!mountedRef.current) return
      let totalRtt = 0
      let totalPacketsLost = 0
      let totalBitrate = 0
      let peerCount = 0
      let prevBytesSent = 0
      let prevTimestamp = 0

      for (const pc of peersRef.current.values()) {
        try {
          const s = await pc.getStats()
          s.forEach((report) => {
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              totalRtt += (report.currentRoundTripTime as number) || 0
            }
            if (report.type === 'outbound-rtp' && report.kind === 'video') {
              totalPacketsLost += (report.packetsLost as number) || 0
              const currentBytes = (report.bytesSent as number) || 0
              if (prevTimestamp > 0) {
                const dt = (report.timestamp - prevTimestamp) / 1000
                if (dt > 0) {
                  totalBitrate += ((currentBytes - prevBytesSent) * 8) / dt / 1000
                }
              }
              prevBytesSent = currentBytes
              prevTimestamp = report.timestamp
            }
            if (report.type === 'outbound-rtp' && report.kind === 'audio') {
              totalPacketsLost += (report.packetsLost as number) || 0
            }
          })
          peerCount++
        } catch {
          // stats collection may fail for closed connections
        }
      }

      let videoRes = ''
      if (localStreamRef.current) {
        const vt = localStreamRef.current.getVideoTracks()[0]
        if (vt) {
          const settings = vt.getSettings()
          if (settings.width && settings.height) {
            videoRes = `${settings.width}x${settings.height}`
          }
        }
      }

      setStats(prev => ({
        ...prev,
        localVideoResolution: videoRes || prev.localVideoResolution,
        rtt: peerCount > 0 ? Math.round((totalRtt / peerCount) * 1000) : 0,
        packetsLost: totalPacketsLost,
        bitrate: Math.round(totalBitrate),
      }))
    }, 3000)
  }, [])

  const stopStatsCollection = useCallback(() => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current)
      statsIntervalRef.current = null
    }
  }, [])

  // ── Send message to signaling server ───────────────────────────────────
  const sendSignal = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify(data))
  }, [])

  // ── Peer connection creation ───────────────────────────────────────────
  const createPeerConnection = useCallback((remoteUserId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS)

    // Add local tracks
    const stream = localStreamRef.current
    if (stream) {
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      if (!mountedRef.current) return
      const remoteStream = event.streams[0] || new MediaStream([event.track])
      setRemoteParticipants(prev => {
        const next = new Map(prev)
        const existing = next.get(remoteUserId)
        next.set(remoteUserId, {
          id: remoteUserId,
          name: existing?.name || 'Participant',
          stream: remoteStream,
          micOn: existing?.micOn ?? true,
          videoOn: existing?.videoOn ?? true,
          screenStream: existing?.screenStream || null,
        })
        return next
      })
    }

    // ICE candidate handling
    pc.onicecandidate = (event) => {
      if (!event.candidate || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
      wsRef.current.send(JSON.stringify({
        type: 'signal',
        targetUserId: remoteUserId,
        sdp: { candidate: event.candidate.toJSON() },
      }))
    }

    pc.oniceconnectionstatechange = () => {
      if (!mountedRef.current) return
      const state = pc.iceConnectionState
      if (state === 'connected' || state === 'completed') {
        setConnectionState('connected')
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        let anyConnected = false
        for (const p of peersRef.current.values()) {
          const s = p.iceConnectionState
          if (s === 'connected' || s === 'completed') { anyConnected = true; break }
        }
        if (!anyConnected) setConnectionState('disconnected')
      }
    }

    peersRef.current.set(remoteUserId, pc)
    return pc
  }, [])

  // ── Close peer ─────────────────────────────────────────────────────────
  const closePeerConnection = useCallback((remoteUserId: string) => {
    const pc = peersRef.current.get(remoteUserId)
    if (pc) {
      pc.ontrack = null
      pc.onicecandidate = null
      pc.oniceconnectionstatechange = null
      pc.close()
      peersRef.current.delete(remoteUserId)
    }
    setRemoteParticipants(prev => {
      const next = new Map(prev)
      const rp = next.get(remoteUserId)
      if (rp?.stream) rp.stream.getTracks().forEach(t => t.stop())
      if (rp?.screenStream) rp.screenStream.getTracks().forEach(t => t.stop())
      next.delete(remoteUserId)
      return next
    })
  }, [])

  const closeAllPeers = useCallback(() => {
    for (const [uid] of peersRef.current) {
      closePeerConnection(uid)
    }
  }, [closePeerConnection])

  // ── Process incoming WebSocket messages ────────────────────────────────
  const processMessage = useCallback(async (data: SignalMessage) => {
    if (!mountedRef.current) return

    switch (data.type) {
      case 'auth_ok': {
        hasJoinedRef.current = false
        sendSignal({ type: 'join_room', meetingId: configRef.current.meetingId })
        break
      }

      case 'auth_error': {
        console.warn('[useWebRTC] Auth failed:', data.payload)
        setConnectionState('disconnected')
        break
      }

      case 'room_joined': {
        console.log('[useWebRTC] Joined room via signaling')
        hasJoinedRef.current = true
        setConnectionState('connected')
        retryCountRef.current = 0

        // Create offers for existing participants
        const existing = data.payload?.participants as Array<{ userId: string; userName: string }> | undefined
        if (existing && Array.isArray(existing)) {
          for (const p of existing) {
            if (p.userId === configRef.current.userId) continue
            const pc = createPeerConnection(p.userId)
            try {
              const offer = await pc.createOffer()
              await pc.setLocalDescription(offer)
              sendSignal({ type: 'signal', targetUserId: p.userId, sdp: offer })
            } catch (err) {
              console.warn('[useWebRTC] Failed to create offer for', p.userId, err)
            }
          }
        }
        break
      }

      case 'participant_joined': {
        const pUserId = data.fromUserId
        const pUserName = data.fromUserName
        if (!pUserId || pUserId === configRef.current.userId) break
        console.log('[useWebRTC] Participant joined:', pUserName)

        setRemoteParticipants(prev => {
          const next = new Map(prev)
          if (!next.has(pUserId)) {
            next.set(pUserId, {
              id: pUserId,
              name: pUserName || 'Participant',
              stream: null,
              micOn: true,
              videoOn: true,
              screenStream: null,
            })
          }
          return next
        })

        // We wait for the new participant to send us an offer.
        // If we should initiate, the room_joined handler already did.
        break
      }

      case 'signal': {
        const fromUserId = data.fromUserId
        const sdp = data.sdp
        if (!fromUserId || fromUserId === configRef.current.userId) break

        let pc = peersRef.current.get(fromUserId)
        if (!pc) {
          pc = createPeerConnection(fromUserId)
        }

        if (sdp?.type === 'offer') {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp))
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            sendSignal({ type: 'signal', targetUserId: fromUserId, sdp: answer })
          } catch (err) {
            console.warn('[useWebRTC] Failed to handle offer from', fromUserId, err)
          }
        } else if (sdp?.type === 'answer') {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp))
          } catch (err) {
            console.warn('[useWebRTC] Failed to handle answer from', fromUserId, err)
          }
        } else if (sdp?.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(sdp.candidate))
          } catch (err) {
            console.warn('[useWebRTC] Failed to add ICE candidate from', fromUserId, err)
          }
        }
        break
      }

      case 'participant_left': {
        const leftUserId = data.fromUserId
        if (!leftUserId) break
        console.log('[useWebRTC] Participant left:', leftUserId)
        closePeerConnection(leftUserId)
        break
      }

      case 'media_toggle': {
        const toggleUserId = data.fromUserId
        if (!toggleUserId || toggleUserId === configRef.current.userId) break
        const payload = data.payload as { micOn?: boolean; videoOn?: boolean; screenOn?: boolean } | undefined
        if (payload) {
          setRemoteParticipants(prev => {
            const next = new Map(prev)
            const rp = next.get(toggleUserId)
            if (rp) {
              next.set(toggleUserId, {
                ...rp,
                micOn: payload.micOn ?? rp.micOn,
                videoOn: payload.videoOn ?? rp.videoOn,
              })
            }
            return next
          })
        }
        break
      }

      case 'error': {
        console.warn('[useWebRTC] Server error:', data.payload)
        break
      }
    }
  }, [createPeerConnection, closePeerConnection, sendSignal])

  // ── Cleanup helper ─────────────────────────────────────────────────────
  const cleanupWs = useCallback(() => {
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

  // ── Full connect (media + signaling) ───────────────────────────────────
  const doConnect = useCallback(async () => {
    if (!mountedRef.current) return
    cleanupWs()

    const cfg = configRef.current
    if (!cfg.enabled) return

    const isReconnect = retryCountRef.current > 0
    setConnectionState('connecting')

    const token = typeof window !== 'undefined'
      ? (localStorage.getItem('alvision_access_token') || '')
      : ''

    if (!token) {
      console.warn('[useWebRTC] No auth token — skipping signaling connection')
      setConnectionState('disconnected')
      return
    }

    // Ensure local stream on reconnect
    if (!localStreamRef.current) {
      const stream = await acquireLocalStream(true, true)
      if (stream) setupAudioMonitoring(stream)
    }

    let ws: WebSocket
    try {
      ws = new WebSocket('/?XTransformPort=3011')
    } catch {
      setConnectionState('disconnected')
      return
    }
    wsRef.current = ws

    ws.onopen = () => {
      if (!mountedRef.current) { ws.close(); return }
      console.log('[useWebRTC] Signaling connected')
      retryCountRef.current = 0
      ws.send(JSON.stringify({ type: 'auth', token }))
    }

    ws.onmessage = (event) => {
      if (!mountedRef.current) return
      try {
        processMessage(JSON.parse(event.data as string) as SignalMessage)
      } catch {
        // ignore malformed
      }
    }

    ws.onclose = (event) => {
      if (!mountedRef.current) return
      wsRef.current = null
      console.log(`[useWebRTC] Signaling disconnected (code: ${event.code})`)
      setConnectionState('disconnected')

      if (event.code !== 1000 && cfg.enabled) {
        const delay = Math.min(
          cfg.baseBackoff * Math.pow(2, retryCountRef.current),
          cfg.maxBackoff,
        )
        retryCountRef.current++
        if (retryCountRef.current <= cfg.maxRetries) {
          setConnectionState('connecting')
          retryTimerRef.current = setTimeout(() => connectFnRef.current(), delay)
        }
      }
    }

    ws.onerror = () => { /* onclose fires after onerror */ }
  }, [cleanupWs, acquireLocalStream, setupAudioMonitoring, processMessage])

  // Keep connectFnRef updated
  useEffect(() => {
    connectFnRef.current = doConnect
  }, [doConnect])

  // ── Public API ─────────────────────────────────────────────────────────

  const connect = useCallback(async () => {
    if (!configRef.current.enabled) return
    const stream = await acquireLocalStream(true, true)
    if (stream) setupAudioMonitoring(stream)
    startStatsCollection()
    doConnect()
  }, [acquireLocalStream, setupAudioMonitoring, startStatsCollection, doConnect])

  const disconnect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leave_room', meetingId: configRef.current.meetingId }))
    }
    retryCountRef.current = maxRetries + 1
    cleanupWs()
    closeAllPeers()
    stopAudioMonitoring()
    stopStatsCollection()
    setConnectionState('disconnected')
    setRemoteParticipants(new Map())
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop())
      localStreamRef.current = null
      setLocalStream(null)
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop())
      screenStreamRef.current = null
    }
  }, [cleanupWs, closeAllPeers, stopAudioMonitoring, stopStatsCollection, maxRetries])

  const toggleAudio = useCallback(async () => {
    const stream = localStreamRef.current
    if (!stream) return
    const audioTracks = stream.getAudioTracks()
    const newState = !mediaStateRef.current.audio
    audioTracks.forEach(t => { t.enabled = newState })
    setMediaState(prev => ({ ...prev, audio: newState }))
    sendSignal({ type: 'media_toggle', meetingId: configRef.current.meetingId, micOn: newState })
    if (newState) {
      setupAudioMonitoring(stream)
    } else {
      stopAudioMonitoring()
    }
  }, [sendSignal, setupAudioMonitoring, stopAudioMonitoring])

  const toggleVideo = useCallback(async () => {
    const stream = localStreamRef.current
    if (!stream) return
    const videoTracks = stream.getVideoTracks()
    const newState = !mediaStateRef.current.video
    videoTracks.forEach(t => { t.enabled = newState })
    setMediaState(prev => ({ ...prev, video: newState }))
    sendSignal({ type: 'media_toggle', meetingId: configRef.current.meetingId, videoOn: newState })
  }, [sendSignal])

  const toggleScreenShare = useCallback(async () => {
    const isSharing = mediaStateRef.current.screen

    if (isSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop())
        screenStreamRef.current = null
      }
      setMediaState(prev => ({ ...prev, screen: false }))

      // Restore camera tracks
      if (mediaStateRef.current.video && localStreamRef.current) {
        const cameraTrack = localStreamRef.current.getVideoTracks()[0]
        if (cameraTrack) {
          for (const pc of peersRef.current.values()) {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video')
            if (sender) {
              try { await sender.replaceTrack(cameraTrack) } catch { /* ok */ }
            }
          }
        }
      }

      sendSignal({ type: 'media_toggle', meetingId: configRef.current.meetingId, screenOn: false })
      return
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      screenStreamRef.current = screenStream
      setMediaState(prev => ({ ...prev, screen: true }))

      const screenVideoTrack = screenStream.getVideoTracks()[0]
      if (screenVideoTrack) {
        for (const pc of peersRef.current.values()) {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video')
          if (sender) {
            try { await sender.replaceTrack(screenVideoTrack) } catch { /* ok */ }
          } else {
            try { pc.addTrack(screenVideoTrack, screenStream) } catch { /* ok */ }
          }
        }
      }

      screenStream.getVideoTracks()[0].onended = () => {
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(t => t.stop())
          screenStreamRef.current = null
        }
        setMediaState(prev => ({ ...prev, screen: false }))
        if (mediaStateRef.current.video && localStreamRef.current) {
          const cameraTrack = localStreamRef.current.getVideoTracks()[0]
          if (cameraTrack) {
            for (const pc of peersRef.current.values()) {
              const sender = pc.getSenders().find(s => s.track?.kind === 'video')
              if (sender) {
                try { sender.replaceTrack(cameraTrack) } catch { /* ok */ }
              }
            }
          }
        }
        sendSignal({ type: 'media_toggle', meetingId: configRef.current.meetingId, screenOn: false })
      }

      sendSignal({ type: 'media_toggle', meetingId: configRef.current.meetingId, screenOn: true })
    } catch (err) {
      console.warn('[useWebRTC] getDisplayMedia failed:', err)
    }
  }, [sendSignal])

  const getConnectionState = useCallback((): RTCPeerConnectionState => {
    for (const pc of peersRef.current.values()) {
      return pc.connectionState
    }
    return 'new'
  }, [])

  // ── Lifecycle ──────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true

    if (enabled) {
      const id = setTimeout(() => {
        acquireLocalStream(true, true).then(stream => {
          if (stream) setupAudioMonitoring(stream)
        })
        startStatsCollection()
        doConnect()
      }, 100)

      return () => {
        clearTimeout(id)
      }
    }

    return () => { /* noop when not enabled */ }
  }, [enabled, acquireLocalStream, setupAudioMonitoring, startStatsCollection, doConnect])

  // Unmount cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false
      cleanupWs()
      closeAllPeers()
      stopAudioMonitoring()
      stopStatsCollection()
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop())
        localStreamRef.current = null
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop())
        screenStreamRef.current = null
      }
    }
  }, [cleanupWs, closeAllPeers, stopAudioMonitoring, stopStatsCollection])

  return {
    localStream,
    remoteParticipants,
    mediaState,
    connectionState,
    stats,
    connect,
    disconnect,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    getConnectionState,
  }
}
