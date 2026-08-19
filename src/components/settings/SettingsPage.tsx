'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { authFetch } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Settings,
  Bell,
  Video,
  Palette,
  Shield,
  Globe,
  Monitor,
  Volume2,
  Mic,
  Camera,
  Save,
  CheckCircle2,
  Loader2,
  Sun,
  Moon,
  MonitorSmartphone,
  Keyboard,
  Lock,
  Smartphone,
  Eye,
  EyeOff,
  Clock,
  VolumeX,
  Sparkles,
  UserCheck,
  Users,
  FileAudio,
  BrainCircuit,
  Mail,
  Accessibility,
  ZoomIn,
  ArrowLeftRight,
  Fingerprint,
  Laptop,
  KeyRound,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────

interface MediaDevice {
  deviceId: string
  label: string
  kind: string
}

interface AlvisionSettings {
  // General
  displayName: string
  language: string
  timezone: string
  dateFormat: string
  timeFormat: '12h' | '24h'
  // Audio & Video
  microphoneId: string
  speakerId: string
  cameraId: string
  mirrorVideo: boolean
  hdVideo: boolean
  noiseSuppression: boolean
  // Notifications
  meetingReminders: boolean
  reminderTime: string
  chatMessages: boolean
  meetingStarted: boolean
  newParticipants: boolean
  recordingReady: boolean
  aiSummaryReady: boolean
  emailNotifications: boolean
  notificationSound: boolean
  // Appearance
  theme: 'light' | 'dark' | 'system'
  compactMode: boolean
  showAvatarInMeetings: boolean
  showTimestampsInChat: boolean
  animatedBackgrounds: boolean
  // Accessibility
  reduceMotion: boolean
  highContrast: boolean
  fontSize: number
  screenReaderOptimizations: boolean
  // Privacy & Security
  profileVisibility: string
  showOnlineStatus: boolean
  readReceipts: boolean
  allowDirectMessages: boolean
}

// ── Constants ──────────────────────────────────────────────────────────

const STORAGE_KEY = 'alvision-settings'

const DEFAULT_SETTINGS: AlvisionSettings = {
  displayName: '',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  microphoneId: 'default',
  speakerId: 'default',
  cameraId: 'default',
  mirrorVideo: true,
  hdVideo: true,
  noiseSuppression: true,
  meetingReminders: true,
  reminderTime: '5',
  chatMessages: true,
  meetingStarted: true,
  newParticipants: true,
  recordingReady: true,
  aiSummaryReady: true,
  emailNotifications: true,
  notificationSound: true,
  theme: 'system',
  compactMode: false,
  showAvatarInMeetings: true,
  showTimestampsInChat: true,
  animatedBackgrounds: false,
  reduceMotion: false,
  highContrast: false,
  fontSize: 1,
  screenReaderOptimizations: false,
  profileVisibility: 'everyone',
  showOnlineStatus: true,
  readReceipts: true,
  allowDirectMessages: true,
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ar', label: 'Arabic' },
]

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC',
]

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
]

const REMINDER_TIMES = [
  { value: '1', label: '1 minute before' },
  { value: '5', label: '5 minutes before' },
  { value: '10', label: '10 minutes before' },
  { value: '15', label: '15 minutes before' },
  { value: '30', label: '30 minutes before' },
]

const FONT_SIZES = [
  { value: 0, label: 'Small' },
  { value: 1, label: 'Default' },
  { value: 2, label: 'Large' },
  { value: 3, label: 'Extra Large' },
]

const PROFILE_VISIBILITY = [
  { value: 'everyone', label: 'Everyone in Org' },
  { value: 'teams', label: 'Teams Only' },
  { value: 'me', label: 'Only Me' },
]

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } } }

// ── Helpers ────────────────────────────────────────────────────────────

function loadSettings(): AlvisionSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AlvisionSettings>
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS }
}

function saveSettingsToStorage(settings: AlvisionSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch { /* ignore */ }
}

// ── Sub-components ─────────────────────────────────────────────────────

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className='flex items-center justify-between py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 hover:-translate-y-0.5 hover:shadow-sm px-3 -mx-3 rounded-lg transition-all duration-200'>
      <div className='pr-4'>
        <p className='text-sm font-medium'>{label}</p>
        {description && <p className='text-xs text-muted-foreground mt-0.5'>{description}</p>}
      </div>
      <div className='shrink-0'>{children}</div>
    </div>
  )
}

function CameraPreview({ deviceId, mirror }: { deviceId: string; mirror: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function startCamera() {
      try {
        setError(null)
        setLoading(true)
        const constraints: MediaStreamConstraints = {
          video: deviceId && deviceId !== 'default'
            ? { deviceId: { exact: deviceId } }
            : true,
        }
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
        setLoading(false)
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof DOMException
            ? err.name === 'NotAllowedError'
              ? 'Camera permission denied. Please allow camera access in your browser.'
              : err.name === 'NotFoundError'
                ? 'No camera found on this device.'
                : 'Could not access camera.'
            : 'Could not access camera.'
          setError(msg)
          setLoading(false)
        }
      }
    }

    startCamera()

    return () => {
      cancelled = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
  }, [deviceId])

  return (
    <div className='relative w-full aspect-video rounded-xl overflow-hidden bg-muted/50 border border-border/50'>
      {loading && !error && (
        <div className='absolute inset-0 flex items-center justify-center'>
          <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
        </div>
      )}
      {error && (
        <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center'>
          <Camera className='h-8 w-8 text-muted-foreground' />
          <p className='text-xs text-muted-foreground'>{error}</p>
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`h-full w-full object-cover ${mirror ? 'scale-x-[-1]' : ''}`}
        style={{ display: error ? 'none' : 'block' }}
      />
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user } = useAppStore()
  const [settings, setSettings] = useState<AlvisionSettings>(DEFAULT_SETTINGS)
  const [initialSettings, setInitialSettings] = useState<AlvisionSettings>(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Media devices
  const [audioInputs, setAudioInputs] = useState<MediaDevice[]>([])
  const [audioOutputs, setAudioOutputs] = useState<MediaDevice[]>([])
  const [videoInputs, setVideoInputs] = useState<MediaDevice[]>([])
  const [devicesLoading, setDevicesLoading] = useState(true)
  const [devicesError, setDevicesError] = useState<string | null>(null)

  // Audio test
  const [testingAudio, setTestingAudio] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number>(0)
  const audioStreamRef = useRef<MediaStream | null>(null)

  // Change password dialog
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)

  // Load settings from localStorage
  useEffect(() => {
    const loaded = loadSettings()
    if (user?.name && !loaded.displayName) {
      loaded.displayName = user.name
    }
    setSettings(loaded)
    setInitialSettings(loaded)
  }, [user])

  // Dirty state check
  const isDirty = JSON.stringify(settings) !== JSON.stringify(initialSettings)

  // Update a setting
  const update = useCallback(<K extends keyof AlvisionSettings>(key: K, value: AlvisionSettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      saveSettingsToStorage(next)
      return next
    })
  }, [])

  // Enumerate devices
  const enumerateDevices = useCallback(async () => {
    try {
      setDevicesLoading(true)
      setDevicesError(null)

      // We need to request a stream first to get device labels (browser security)
      let tempStream: MediaStream | null = null
      try {
        tempStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      } catch {
        // If we can't get a stream, try just audio
        try {
          tempStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        } catch {
          // Will still list devices, just without labels
        }
      }

      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioIn: MediaDevice[] = []
      const audioOut: MediaDevice[] = []
      const videoIn: MediaDevice[] = []

      for (const d of devices) {
        const entry: MediaDevice = { deviceId: d.deviceId, label: d.label, kind: d.kind }
        if (d.kind === 'audioinput') audioIn.push(entry)
        else if (d.kind === 'audiooutput') audioOut.push(entry)
        else if (d.kind === 'videoinput') videoIn.push(entry)
      }

      setAudioInputs(audioIn)
      setAudioOutputs(audioOut)
      setVideoInputs(videoIn)

      // Clean up temp stream
      if (tempStream) {
        tempStream.getTracks().forEach(t => t.stop())
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setDevicesError('Permission to access media devices was denied. Please allow camera and microphone access and reload the page.')
      } else {
        setDevicesError('Unable to enumerate media devices. Your browser may not support this feature.')
      }
    } finally {
      setDevicesLoading(false)
    }
  }, [])

  useEffect(() => {
    enumerateDevices()
  }, [enumerateDevices])

  // Test audio
  const startAudioTest = useCallback(async () => {
    try {
      const micId = settings.microphoneId && settings.microphoneId !== 'default'
        ? settings.microphoneId
        : undefined
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: micId ? { deviceId: { exact: micId } } : true,
      })
      audioStreamRef.current = stream

      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      source.connect(analyser)
      analyserRef.current = analyser

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      setTestingAudio(true)

      function measure() {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)
        const sum = dataArray.reduce((a, b) => a + b, 0)
        const avg = sum / dataArray.length
        const level = Math.min(100, Math.round((avg / 128) * 100))
        setAudioLevel(level)
        animFrameRef.current = requestAnimationFrame(measure)
      }
      measure()
    } catch {
      toast.error('Could not access microphone for audio test')
    }
  }, [settings.microphoneId])

  const stopAudioTest = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current)
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(t => t.stop())
      audioStreamRef.current = null
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }
    analyserRef.current = null
    setTestingAudio(false)
    setAudioLevel(0)
  }, [])

  // Save settings
  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      // Save display name to API
      if (settings.displayName) {
        try {
          await authFetch('/api/v1/profile', {
            method: 'PUT',
            body: JSON.stringify({ name: settings.displayName }),
          })
        } catch { /* non-critical */ }
      }

      saveSettingsToStorage(settings)
      setInitialSettings({ ...settings })
      setSaved(true)
      toast.success('Settings saved successfully')
      setTimeout(() => setSaved(false), 2000)
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }, [settings])

  // Change password
  const handleChangePassword = useCallback(async () => {
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setChangingPassword(true)
    try {
      const res = await authFetch('/api/v1/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        toast.error(err?.error?.message || 'Failed to change password')
        return
      }
      toast.success('Password changed successfully')
      setPasswordDialogOpen(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      toast.error('Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }, [currentPassword, newPassword, confirmPassword])

  // Active sessions mock data
  const activeSessions = [
    {
      device: 'Chrome on macOS',
      icon: <Laptop className='h-4 w-4' />,
      location: 'San Francisco, CA',
      lastActive: 'Active now',
      current: true,
    },
    {
      device: 'Safari on iPhone',
      icon: <Smartphone className='h-4 w-4' />,
      location: 'San Francisco, CA',
      lastActive: '2 hours ago',
      current: false,
    },
  ]

  const tabConfig: Record<string, { icon: React.ReactNode }> = {
    general: { icon: <Settings className='h-3.5 w-3.5' /> },
    'audio-video': { icon: <Video className='h-3.5 w-3.5' /> },
    notifications: { icon: <Bell className='h-3.5 w-3.5' /> },
    appearance: { icon: <Palette className='h-3.5 w-3.5' /> },
    accessibility: { icon: <Accessibility className='h-3.5 w-3.5' /> },
    'privacy-security': { icon: <Shield className='h-3.5 w-3.5' /> },
  }

  return (
    <motion.div className='max-w-3xl space-y-6' variants={container} initial='hidden' animate='show'>
      <motion.div variants={item}>
        <Tabs defaultValue='general'>
          <TabsList className='flex-wrap h-auto gap-1 relative'>
            <motion.div
              className='absolute h-[calc(100%-6px)] rounded-md bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 border border-primary/20'
              layout
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
            {Object.entries(tabConfig).map(([key, cfg]) => (
              <TabsTrigger
                key={key}
                value={key}
                className='gap-1.5 relative z-10 data-[state=active]:text-primary data-[state=active]:font-semibold text-xs sm:text-sm'
              >
                {cfg.icon}
                <span className='hidden sm:inline'>{key.charAt(0).toUpperCase() + key.slice(1).replace('-', ' ')}</span>
                <span className='sm:hidden'>{key === 'general' ? 'General' : key === 'audio-video' ? 'A/V' : key === 'privacy-security' ? 'Privacy' : key.charAt(0).toUpperCase() + key.slice(1)}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ═══════════════════ GENERAL TAB ═══════════════════ */}
          <TabsContent value='general' className='mt-6 space-y-6'>
            <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <div className='p-2 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/5'>
                    <Settings className='h-4 w-4 text-emerald-600' />
                  </div>
                  General Settings
                </CardTitle>
                <CardDescription>Configure your profile display and regional preferences.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-1'>
                <div className='space-y-2 pb-4 border-b border-border/50'>
                  <Label>Display Name</Label>
                  <p className='text-xs text-muted-foreground'>This name will be shown to other participants in meetings.</p>
                  <Input
                    value={settings.displayName}
                    onChange={e => update('displayName', e.target.value)}
                    placeholder='Enter your display name'
                    className='focus:ring-2 focus:ring-primary/20 transition-all duration-200'
                  />
                </div>

                <SettingRow label='Language' description='Choose your preferred interface language.'>
                  <Select value={settings.language} onValueChange={v => update('language', v)}>
                    <SelectTrigger className='w-44'><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(l => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SettingRow>

                <SettingRow label='Timezone' description='Used for meeting scheduling and reminders.'>
                  <Select value={settings.timezone} onValueChange={v => update('timezone', v)}>
                    <SelectTrigger className='w-56'><SelectValue /></SelectTrigger>
                    <SelectContent className='max-h-60'>
                      {TIMEZONES.map(tz => (
                        <SelectItem key={tz} value={tz}>{tz.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SettingRow>

                <SettingRow label='Date Format' description='How dates are displayed throughout the app.'>
                  <Select value={settings.dateFormat} onValueChange={v => update('dateFormat', v)}>
                    <SelectTrigger className='w-40'><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DATE_FORMATS.map(f => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SettingRow>

                <SettingRow label='Time Format' description='12-hour or 24-hour clock display.'>
                  <div className='flex items-center gap-2'>
                    <button
                      type='button'
                      onClick={() => update('timeFormat', '12h')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                        settings.timeFormat === '12h'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm shadow-emerald-500/30'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      12h
                    </button>
                    <button
                      type='button'
                      onClick={() => update('timeFormat', '24h')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                        settings.timeFormat === '24h'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm shadow-emerald-500/30'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      24h
                    </button>
                  </div>
                </SettingRow>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════ AUDIO & VIDEO TAB ═══════════════════ */}
          <TabsContent value='audio-video' className='mt-6 space-y-6'>
            {/* Device Selection Card */}
            <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <div className='p-2 rounded-lg bg-gradient-to-br from-cyan-500/10 to-teal-500/5'>
                    <Video className='h-4 w-4 text-cyan-600' />
                  </div>
                  Device Settings
                </CardTitle>
                <CardDescription>Select your preferred audio and video devices.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-1'>
                {devicesLoading && (
                  <div className='flex items-center gap-2 py-4 text-muted-foreground text-sm'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Detecting devices...
                  </div>
                )}
                {devicesError && (
                  <div className='flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-200/50 dark:border-rose-800/30 mb-2'>
                    <VolumeX className='h-4 w-4 text-rose-500 shrink-0 mt-0.5' />
                    <p className='text-xs text-rose-600 dark:text-rose-400'>{devicesError}</p>
                  </div>
                )}

                <SettingRow label='Microphone' description='Input device for your voice.'>
                  <Select value={settings.microphoneId} onValueChange={v => update('microphoneId', v)} disabled={devicesLoading}>
                    <SelectTrigger className='w-56'><SelectValue placeholder='Select microphone' /></SelectTrigger>
                    <SelectContent>
                      {audioInputs.length === 0 && !devicesLoading && (
                        <SelectItem value='default' disabled>No microphones found</SelectItem>
                      )}
                      {audioInputs.map(d => (
                        <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${audioInputs.indexOf(d) + 1}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SettingRow>

                <SettingRow label='Speaker' description='Output device for meeting audio.'>
                  <Select value={settings.speakerId} onValueChange={v => update('speakerId', v)} disabled={devicesLoading}>
                    <SelectTrigger className='w-56'><SelectValue placeholder='Select speaker' /></SelectTrigger>
                    <SelectContent>
                      {audioOutputs.length === 0 && !devicesLoading && (
                        <SelectItem value='default' disabled>No speakers found</SelectItem>
                      )}
                      {audioOutputs.map(d => (
                        <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || `Speaker ${audioOutputs.indexOf(d) + 1}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SettingRow>

                <SettingRow label='Camera' description='Video input device for meetings.'>
                  <Select value={settings.cameraId} onValueChange={v => update('cameraId', v)} disabled={devicesLoading}>
                    <SelectTrigger className='w-56'><SelectValue placeholder='Select camera' /></SelectTrigger>
                    <SelectContent>
                      {videoInputs.length === 0 && !devicesLoading && (
                        <SelectItem value='default' disabled>No cameras found</SelectItem>
                      )}
                      {videoInputs.map(d => (
                        <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${videoInputs.indexOf(d) + 1}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SettingRow>

                {/* Audio Test */}
                <div className='pt-4 border-t border-border/50'>
                  <div className='flex items-center justify-between mb-3'>
                    <div>
                      <p className='text-sm font-medium'>Test Microphone</p>
                      <p className='text-xs text-muted-foreground'>Speak into your mic to check the input level.</p>
                    </div>
                    <Button
                      variant={testingAudio ? 'destructive' : 'outline'}
                      size='sm'
                      onClick={testingAudio ? stopAudioTest : startAudioTest}
                      className='gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-transform'
                    >
                      {testingAudio ? <VolumeX className='h-3.5 w-3.5' /> : <Mic className='h-3.5 w-3.5' />}
                      {testingAudio ? 'Stop Test' : 'Test Audio'}
                    </Button>
                  </div>
                  {testingAudio && (
                    <div className='relative h-4 rounded-full bg-muted overflow-hidden'>
                      <motion.div
                        className='h-full rounded-full transition-all duration-100'
                        animate={{
                          width: `${Math.max(2, audioLevel)}%`,
                          backgroundColor: audioLevel > 70
                            ? '#ef4444'
                            : audioLevel > 40
                              ? '#f59e0b'
                              : '#10b981',
                        }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Video Settings Card */}
            <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <div className='p-2 rounded-lg bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5'>
                    <Camera className='h-4 w-4 text-violet-600' />
                  </div>
                  Video Settings
                </CardTitle>
                <CardDescription>Adjust your video preferences and preview your camera.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-1'>
                <SettingRow label='Mirror my video' description='Flip your self-view horizontally for a more natural feel.'>
                  <Switch
                    checked={settings.mirrorVideo}
                    onCheckedChange={v => update('mirrorVideo', v)}
                  />
                </SettingRow>

                <SettingRow label='HD Video' description='Enable high-definition video (requires sufficient bandwidth).'>
                  <Switch
                    checked={settings.hdVideo}
                    onCheckedChange={v => update('hdVideo', v)}
                  />
                </SettingRow>

                <SettingRow label='Noise Suppression' description='Reduce background noise during meetings using AI.'>
                  <Switch
                    checked={settings.noiseSuppression}
                    onCheckedChange={v => update('noiseSuppression', v)}
                  />
                </SettingRow>

                <div className='pt-4 border-t border-border/50'>
                  <p className='text-sm font-medium mb-2'>Camera Preview</p>
                  <p className='text-xs text-muted-foreground mb-3'>Preview how your camera will appear to other participants.</p>
                  <CameraPreview deviceId={settings.cameraId} mirror={settings.mirrorVideo} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════ NOTIFICATIONS TAB ═══════════════════ */}
          <TabsContent value='notifications' className='mt-6 space-y-6'>
            <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <div className='p-2 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/5'>
                    <Bell className='h-4 w-4 text-amber-600' />
                  </div>
                  Meeting Notifications
                </CardTitle>
                <CardDescription>Choose which meeting events you want to be notified about.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-1'>
                <SettingRow label='Meeting Reminders' description='Get a reminder before scheduled meetings start.'>
                  <Switch
                    checked={settings.meetingReminders}
                    onCheckedChange={v => update('meetingReminders', v)}
                  />
                </SettingRow>

                <SettingRow label='Reminder Time' description='How far in advance to send meeting reminders.'>
                  <Select
                    value={settings.reminderTime}
                    onValueChange={v => update('reminderTime', v)}
                    disabled={!settings.meetingReminders}
                  >
                    <SelectTrigger className='w-48'><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {REMINDER_TIMES.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SettingRow>

                <SettingRow label='Meeting Started' description={'Notify when a meeting you’re invited to begins.'}>
                  <Switch
                    checked={settings.meetingStarted}
                    onCheckedChange={v => update('meetingStarted', v)}
                  />
                </SettingRow>

                <SettingRow label='New Participants' description='Notify when someone joins your meeting.'>
                  <Switch
                    checked={settings.newParticipants}
                    onCheckedChange={v => update('newParticipants', v)}
                  />
                </SettingRow>
              </CardContent>
            </Card>

            <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <div className='p-2 rounded-lg bg-gradient-to-br from-fuchsia-500/10 to-violet-500/5'>
                    <Mail className='h-4 w-4 text-fuchsia-600' />
                  </div>
                  Content Notifications
                </CardTitle>
                <CardDescription>Notifications for chat, recordings, and AI features.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-1'>
                <SettingRow label='Chat Messages' description='Get notified about new direct and channel messages.'>
                  <Switch
                    checked={settings.chatMessages}
                    onCheckedChange={v => update('chatMessages', v)}
                  />
                </SettingRow>

                <SettingRow label='Recording Ready' description='Notify when a meeting recording has been processed.'>
                  <Switch
                    checked={settings.recordingReady}
                    onCheckedChange={v => update('recordingReady', v)}
                  />
                </SettingRow>

                <SettingRow label='AI Summary Ready' description='Notify when an AI-generated meeting summary is available.'>
                  <Switch
                    checked={settings.aiSummaryReady}
                    onCheckedChange={v => update('aiSummaryReady', v)}
                  />
                </SettingRow>
              </CardContent>
            </Card>

            <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <div className='p-2 rounded-lg bg-gradient-to-br from-emerald-500/10 to-cyan-500/5'>
                    <Volume2 className='h-4 w-4 text-emerald-600' />
                  </div>
                  Notification Delivery
                </CardTitle>
                <CardDescription>Control how notifications are delivered to you.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-1'>
                <SettingRow label='Email Notifications' description='Master switch for receiving notifications via email.'>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={v => update('emailNotifications', v)}
                  />
                </SettingRow>

                <SettingRow label='Notification Sound' description='Play a sound when receiving in-app notifications.'>
                  <Switch
                    checked={settings.notificationSound}
                    onCheckedChange={v => update('notificationSound', v)}
                  />
                </SettingRow>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════ APPEARANCE TAB ═══════════════════ */}
          <TabsContent value='appearance' className='mt-6 space-y-6'>
            <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <div className='p-2 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/5'>
                    <Palette className='h-4 w-4 text-violet-600' />
                  </div>
                  Theme
                </CardTitle>
                <CardDescription>Choose how ALVISION looks on your screen.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-3 gap-3'>
                  {([
                    { value: 'light' as const, label: 'Light', icon: <Sun className='h-6 w-6 text-amber-500' />, bg: 'bg-white dark:bg-white/10', border: 'border-amber-200 dark:border-amber-500/30' },
                    { value: 'dark' as const, label: 'Dark', icon: <Moon className='h-6 w-6 text-violet-400' />, bg: 'bg-zinc-900 dark:bg-zinc-800', border: 'border-zinc-700' },
                    { value: 'system' as const, label: 'System', icon: <MonitorSmartphone className='h-6 w-6 text-cyan-500' />, bg: 'bg-gradient-to-br from-white to-zinc-900 dark:from-zinc-300 dark:to-zinc-700', border: 'border-border' },
                  ]).map(theme => (
                    <motion.button
                      key={theme.value}
                      type='button'
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => update('theme', theme.value)}
                      className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                        settings.theme === theme.value
                          ? `${theme.border} ring-2 ring-primary/30 shadow-lg shadow-primary/10`
                          : 'border-border/50 hover:border-border'
                      }`}
                    >
                      <div className={`w-full aspect-video rounded-lg ${theme.bg} flex items-center justify-center`}>
                        {theme.icon}
                      </div>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm font-medium'>{theme.label}</span>
                        {settings.theme === theme.value && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className='w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center'
                          >
                            <CheckCircle2 className='h-3 w-3 text-white' />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <div className='p-2 rounded-lg bg-gradient-to-br from-rose-500/10 to-pink-500/5'>
                    <Sparkles className='h-4 w-4 text-rose-600' />
                  </div>
                  Display Options
                </CardTitle>
                <CardDescription>Fine-tune how content is displayed in the interface.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-1'>
                <SettingRow label='Compact Mode' description='Reduce sidebar padding and spacing for a denser layout.'>
                  <Switch
                    checked={settings.compactMode}
                    onCheckedChange={v => update('compactMode', v)}
                  />
                </SettingRow>

                <SettingRow label='Show Avatar in Meetings' description='Display participant avatars alongside their video feeds.'>
                  <Switch
                    checked={settings.showAvatarInMeetings}
                    onCheckedChange={v => update('showAvatarInMeetings', v)}
                  />
                </SettingRow>

                <SettingRow label='Show Timestamps in Chat' description='Display the time each message was sent.'>
                  <Switch
                    checked={settings.showTimestampsInChat}
                    onCheckedChange={v => update('showTimestampsInChat', v)}
                  />
                </SettingRow>

                <SettingRow label='Animated Backgrounds' description='Enable subtle background animations during video calls.'>
                  <Switch
                    checked={settings.animatedBackgrounds}
                    onCheckedChange={v => update('animatedBackgrounds', v)}
                  />
                </SettingRow>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════ ACCESSIBILITY TAB ═══════════════════ */}
          <TabsContent value='accessibility' className='mt-6 space-y-6'>
            <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <div className='p-2 rounded-lg bg-gradient-to-br from-teal-500/10 to-emerald-500/5'>
                    <Accessibility className='h-4 w-4 text-teal-600' />
                  </div>
                  Accessibility
                </CardTitle>
                <CardDescription>Customize ALVISION to work best for your needs.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-1'>
                <SettingRow label='Reduce Motion' description='Minimize animations throughout the interface. Respects your system preference.'>
                  <Switch
                    checked={settings.reduceMotion}
                    onCheckedChange={v => update('reduceMotion', v)}
                  />
                </SettingRow>

                <SettingRow label='High Contrast' description='Increase color contrast for better readability.'>
                  <Switch
                    checked={settings.highContrast}
                    onCheckedChange={v => update('highContrast', v)}
                  />
                </SettingRow>

                <div className='py-3 border-b border-border/50 px-3 -mx-3 rounded-lg hover:bg-muted/30 transition-all duration-200'>
                  <div className='flex items-center justify-between mb-2'>
                    <div>
                      <p className='text-sm font-medium'>Font Size</p>
                      <p className='text-xs text-muted-foreground'>Adjust the base text size across the interface.</p>
                    </div>
                    <Badge variant='outline' className='text-xs shrink-0'>
                      {FONT_SIZES[settings.fontSize]?.label || 'Default'}
                    </Badge>
                  </div>
                  <Slider
                    value={[settings.fontSize]}
                    onValueChange={([v]) => update('fontSize', v)}
                    min={0}
                    max={3}
                    step={1}
                    className='w-full'
                  />
                  <div className='flex justify-between text-[10px] text-muted-foreground mt-1'>
                    <span>Small</span>
                    <span>Default</span>
                    <span>Large</span>
                    <span>Extra Large</span>
                  </div>
                </div>

                <SettingRow label='Screen Reader Optimizations' description='Enable additional ARIA labels and semantic markup.'>
                  <Switch
                    checked={settings.screenReaderOptimizations}
                    onCheckedChange={v => update('screenReaderOptimizations', v)}
                  />
                </SettingRow>

                <div className='pt-3'>
                  <div className='flex items-center gap-2 p-3 rounded-lg border border-border/50 bg-muted/30'>
                    <Keyboard className='h-4 w-4 text-muted-foreground shrink-0' />
                    <div>
                      <p className='text-sm font-medium'>Keyboard Shortcuts</p>
                      <p className='text-xs text-muted-foreground'>Press <kbd className='px-1.5 py-0.5 rounded bg-background border border-border text-[10px] font-mono'>?</kbd> in a meeting to view all available keyboard shortcuts.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════ PRIVACY & SECURITY TAB ═══════════════════ */}
          <TabsContent value='privacy-security' className='mt-6 space-y-6'>
            {/* Profile Visibility Card */}
            <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <div className='p-2 rounded-lg bg-gradient-to-br from-rose-500/10 to-red-500/5'>
                    <Eye className='h-4 w-4 text-rose-600' />
                  </div>
                  Privacy
                </CardTitle>
                <CardDescription>Control who can see your information and activity.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-1'>
                <SettingRow label='Profile Visibility' description='Choose who can view your profile information.'>
                  <Select value={settings.profileVisibility} onValueChange={v => update('profileVisibility', v)}>
                    <SelectTrigger className='w-48'><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROFILE_VISIBILITY.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SettingRow>

                <SettingRow label='Show Online Status' description='Let others see when you are currently active.'>
                  <Switch
                    checked={settings.showOnlineStatus}
                    onCheckedChange={v => update('showOnlineStatus', v)}
                  />
                </SettingRow>

                <SettingRow label='Read Receipts' description='Show when you have read messages in chat.'>
                  <Switch
                    checked={settings.readReceipts}
                    onCheckedChange={v => update('readReceipts', v)}
                  />
                </SettingRow>

                <SettingRow label='Allow Direct Messages' description='Let other organization members send you direct messages.'>
                  <Switch
                    checked={settings.allowDirectMessages}
                    onCheckedChange={v => update('allowDirectMessages', v)}
                  />
                </SettingRow>
              </CardContent>
            </Card>

            {/* Security Card */}
            <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <div className='p-2 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/5'>
                    <Lock className='h-4 w-4 text-emerald-600' />
                  </div>
                  Security
                </CardTitle>
                <CardDescription>Manage your account security and authentication.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-1'>
                {/* Two-Factor Authentication */}
                <div className='flex items-center justify-between py-3 border-b border-border/50 px-3 -mx-3 rounded-lg hover:bg-muted/30 transition-all duration-200'>
                  <div className='flex items-center gap-3'>
                    <div className='p-2 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/5'>
                      <Fingerprint className='h-4 w-4 text-emerald-600' />
                    </div>
                    <div>
                      <p className='text-sm font-medium'>Two-Factor Authentication</p>
                      <p className='text-xs text-muted-foreground'>Add an extra layer of security to your account.</p>
                    </div>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    className='gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-transform'
                    onClick={() => toast.info('Please contact your organization admin to enable two-factor authentication.')}
                  >
                    <Shield className='h-3.5 w-3.5' />
                    Enable
                  </Button>
                </div>

                {/* Change Password */}
                <div className='flex items-center justify-between py-3 border-b border-border/50 px-3 -mx-3 rounded-lg hover:bg-muted/30 transition-all duration-200'>
                  <div className='flex items-center gap-3'>
                    <div className='p-2 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/5'>
                      <KeyRound className='h-4 w-4 text-amber-600' />
                    </div>
                    <div>
                      <p className='text-sm font-medium'>Change Password</p>
                      <p className='text-xs text-muted-foreground'>Update your account password.</p>
                    </div>
                  </div>
                  <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant='outline'
                        size='sm'
                        className='gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-transform'
                      >
                        <ArrowLeftRight className='h-3.5 w-3.5' />
                        Change
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
                      </DialogHeader>
                      <div className='space-y-4 py-2'>
                        <div className='space-y-2'>
                          <Label>Current Password</Label>
                          <div className='relative'>
                            <Input
                              type={showCurrentPw ? 'text' : 'password'}
                              value={currentPassword}
                              onChange={e => setCurrentPassword(e.target.value)}
                              placeholder='Enter current password'
                              className='pr-10'
                            />
                            <button
                              type='button'
                              className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                              onClick={() => setShowCurrentPw(!showCurrentPw)}
                            >
                              {showCurrentPw ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                            </button>
                          </div>
                        </div>
                        <div className='space-y-2'>
                          <Label>New Password</Label>
                          <div className='relative'>
                            <Input
                              type={showNewPw ? 'text' : 'password'}
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                              placeholder='Enter new password'
                              className='pr-10'
                            />
                            <button
                              type='button'
                              className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                              onClick={() => setShowNewPw(!showNewPw)}
                            >
                              {showNewPw ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                            </button>
                          </div>
                          <p className='text-[10px] text-muted-foreground'>Must be at least 8 characters long.</p>
                        </div>
                        <div className='space-y-2'>
                          <Label>Confirm New Password</Label>
                          <Input
                            type='password'
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder='Confirm new password'
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant='outline'
                          onClick={() => setPasswordDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleChangePassword}
                          disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                          className='gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform'
                        >
                          {changingPassword ? <Loader2 className='h-4 w-4 animate-spin' /> : <Lock className='h-4 w-4' />}
                          {changingPassword ? 'Changing...' : 'Update Password'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Active Sessions */}
                <div className='pt-4 border-t border-border/50'>
                  <p className='text-sm font-medium mb-1'>Active Sessions</p>
                  <p className='text-xs text-muted-foreground mb-3'>Devices currently signed in to your account.</p>
                  <div className='space-y-2'>
                    {activeSessions.map((session, i) => (
                      <div
                        key={i}
                        className='flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-all duration-200'
                      >
                        <div className='flex items-center gap-3'>
                          <div className='p-2 rounded-lg bg-muted/50 text-muted-foreground'>
                            {session.icon}
                          </div>
                          <div>
                            <p className='text-sm font-medium flex items-center gap-2'>
                              {session.device}
                              {session.current && (
                                <Badge variant='outline' className='text-[10px] bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-emerald-600 border-emerald-200/50'>
                                  This device
                                </Badge>
                              )}
                            </p>
                            <p className='text-xs text-muted-foreground'>{session.location} · {session.lastActive}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Save button — only visible when dirty */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className='flex items-center justify-end gap-3'
          >
            <Button
              variant='outline'
              onClick={() => { setSettings({ ...initialSettings }) }}
              className='hover:scale-[1.02] active:scale-[0.98] transition-transform'
            >
              Discard
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className='gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform min-w-[150px] bg-gradient-to-r from-primary to-primary/90'
            >
              {saving ? <Loader2 className='h-4 w-4 animate-spin' /> : <Save className='h-4 w-4' />}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved confirmation */}
      <AnimatePresence>
        {saved && !isDirty && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className='flex items-center gap-2 text-emerald-600 text-sm font-medium'
          >
            <div className='w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center'>
              <CheckCircle2 className='h-4 w-4' />
            </div>
            All changes saved successfully
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
