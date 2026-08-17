'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface JitsiMeetingProps {
  roomName: string
  displayName: string
  onMeetingEnd: () => void
  configOverwrite?: Record<string, string | boolean | string[]>
  domain?: string
}

type LoadState = 'idle' | 'loading' | 'loaded' | 'error'

declare global {
  interface Window {
    JitsiMeetExternalAPI: new (...args: unknown[]) => {
      dispose: () => void
      addEventListener: (event: string, callback: () => void) => void
      removeEventListener: (event: string, callback: () => void) => void
    }
  }
}

export default function JitsiMeeting({
  roomName,
  displayName,
  onMeetingEnd,
  configOverwrite,
  domain = 'meet.jit.si',
}: JitsiMeetingProps) {
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const jitsiRef = useRef<ReturnType<typeof window.JitsiMeetExternalAPI> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const loadScript = useCallback(() => {
    setLoadState('loading')
    setErrorMessage('')

    // Check if already loaded
    if (window.JitsiMeetExternalAPI) {
      setLoadState('loaded')
      return
    }

    const script = document.createElement('script')
    script.src = `https://${domain}/external_api.js`
    script.async = true
    script.defer = true

    script.onload = () => {
      if (window.JitsiMeetExternalAPI) {
        setLoadState('loaded')
      } else {
        setLoadState('error')
        setErrorMessage('Jitsi Meet API failed to initialize')
      }
    }

    script.onerror = () => {
      setLoadState('error')
      setErrorMessage('Failed to load Jitsi Meet. Check your network connection.')
    }

    document.head.appendChild(script)
  }, [domain])

  // Initialize Jitsi when loaded
  useEffect(() => {
    if (loadState !== 'loaded' || !containerRef.current) return

    // Clean up previous instance if any
    if (jitsiRef.current) {
      try {
        jitsiRef.current.dispose()
      } catch {
        // Ignore dispose errors
      }
      jitsiRef.current = null
    }

    // Clear container
    containerRef.current.innerHTML = ''

    let disposed = false

    try {
      const options = {
        roomName: roomName,
        parentNode: containerRef.current,
        userInfo: {
          displayName: displayName,
        },
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          toolbarButtons: [
            'microphone', 'camera', 'closedcaptions', 'desktop',
            'fullscreen', 'fodeviceselection', 'hangup', 'profile',
            'chat', 'recording', 'livestreaming', 'etherpad',
            'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'shortcuts',
            'tileview', 'videobackgroundblur', 'download',
            'help', 'mute-everyone', 'security',
          ],
          ...configOverwrite,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_REMOTE_DISPLAY_NAME: 'Participant',
          DEFAULT_LOCAL_DISPLAY_NAME: displayName,
        },
        onload: () => {
          // Jitsi frame loaded
        },
      }

      jitsiRef.current = new window.JitsiMeetExternalAPI(domain, options)

      // Listen for meeting end events
      jitsiRef.current.addEventListener('videoConferenceLeft', () => {
        onMeetingEnd()
      })

      jitsiRef.current.addEventListener('suspendDetected', () => {
        // Meeting suspended
      })
    } catch (err) {
      if (!disposed) {
        // Use microtask to avoid synchronous setState in effect
        queueMicrotask(() => {
          setLoadState('error')
          setErrorMessage('Failed to initialize meeting room')
        })
      }
      console.error('Jitsi initialization error:', err)
    }

    // Cleanup on unmount
    return () => {
      disposed = true
      if (jitsiRef.current) {
        try {
          jitsiRef.current.dispose()
        } catch {
          // Ignore dispose errors on cleanup
        }
        jitsiRef.current = null
      }
    }
  }, [loadState, roomName, displayName, onMeetingEnd, configOverwrite, domain])

  // Start loading on mount
  useEffect(() => {
    // Use microtask to defer setState outside of effect body
    queueMicrotask(() => loadScript())
  }, [loadScript])

  return (
    <div className="w-full h-full relative bg-background">
      <AnimatePresence mode="wait">
        {loadState === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-background"
          >
            <div className="relative">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-primary/20 animate-ping" />
              </div>
            </div>
            <p className="text-sm font-medium text-foreground mt-4">Connecting to meeting...</p>
            <p className="text-xs text-muted-foreground mt-1">Setting up your conference room</p>
          </motion.div>
        )}

        {loadState === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-background"
          >
            <div className="flex flex-col items-center gap-4 max-w-sm text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">Unable to connect</p>
                <p className="text-sm text-muted-foreground mt-1">{errorMessage || 'An unexpected error occurred'}</p>
              </div>
              <Button
                onClick={loadScript}
                variant="outline"
                className="gap-2 mt-2 hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                <RefreshCw className="h-4 w-4" />
                Retry Connection
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Jitsi container */}
      <div
        id="jitsi-container"
        ref={containerRef}
        className="w-full h-full"
        style={{ display: loadState === 'loaded' ? 'block' : 'none' }}
      />
    </div>
  )
}
