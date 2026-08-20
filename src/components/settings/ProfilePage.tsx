'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { authFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Mail,
  Building2,
  Shield,
  Camera,
  Save,
  CalendarDays,
  Video,
  FileText,
  Clock,
  Edit3,
  MapPin,
  Briefcase,
  X,
  Trophy,
  Star,
  MessageSquare,
  Plus,
  Loader2,
  ImagePlus,
  RefreshCw,
  Check,
  CircleDot,
  EyeOff,
  Users,
  Share2,
  Award,
  SmilePlus,
  Zap,
  CheckCircle2,
  XCircle,
  Phone,
  Globe,
  Building,
  Timer,
  History,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────

interface ProfileData {
  id: string
  name: string
  email: string
  role: string
  organization: { id: string; name: string } | null
  avatar: string | null
  createdAt: string
  lastLogin: string | null
  isActive: boolean
}

type PresenceStatus = 'online' | 'away' | 'dnd' | 'offline'

// ── Constants ──────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'from-fuchsia-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-teal-600',
  'from-violet-500 to-fuchsia-600',
  'from-teal-500 to-emerald-600',
  'from-orange-500 to-rose-500',
]

const PRESENCE_CONFIG: Record<PresenceStatus, { label: string; description: string; color: string; dotColor: string; icon: typeof CircleDot }> = {
  online: { label: 'Online', description: 'You are active and available', color: 'text-emerald-600', dotColor: 'bg-emerald-500', icon: CircleDot },
  away: { label: 'Away', description: 'You are temporarily away', color: 'text-amber-600', dotColor: 'bg-amber-500', icon: Clock },
  dnd: { label: 'Do Not Disturb', description: 'Mute all notifications', color: 'text-rose-600', dotColor: 'bg-rose-500', icon: EyeOff },
  offline: { label: 'Appear Offline', description: 'You appear invisible to others', color: 'text-slate-500', dotColor: 'bg-slate-400', icon: EyeOff },
}

const PRESET_STATUSES = ['In a meeting', 'Focused work', 'Out of office', 'Commuting', 'On vacation', 'Sick leave']

const EMOJI_OPTIONS = ['😀', '😂', '🚀', '💡', '🎯', '🔥', '💪', '👋', '🎉', '☕', '💻', '📸', '🎵', '🌟', '✅', '❤️', '👋', '🤝', '📋', '🏠']

const heatmapData = [
  [0, 2, 1, 0, 3, 1, 0], [1, 0, 0, 2, 1, 0, 0], [0, 1, 3, 2, 0, 1, 2], [2, 0, 1, 0, 0, 2, 1], [0, 0, 0, 1, 3, 0, 1], [1, 2, 0, 0, 1, 0, 0],
  [0, 1, 2, 1, 0, 2, 0], [2, 3, 1, 0, 0, 1, 0], [0, 0, 1, 2, 1, 0, 2], [1, 0, 0, 0, 2, 1, 0], [0, 2, 1, 0, 0, 0, 1], [3, 1, 0, 2, 0, 1, 0],
]

const heatmapColors: Record<number, string> = {
  0: 'bg-muted',
  1: 'bg-emerald-500/20',
  2: 'bg-emerald-500/40',
  3: 'bg-emerald-500/70',
}

const skills = ['React', 'TypeScript', 'Node.js', 'Video Conferencing', 'AI/ML', 'System Design', 'WebRTC', 'Leadership']

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } } }

const TIMELINE_DATA = [
  { id: 't1', type: 'achievement' as const, title: 'Unlocked "Power User" badge', time: '2 hours ago', icon: Award, color: 'violet' },
  { id: 't2', type: 'meeting' as const, title: 'Hosted "Sprint Planning" meeting', time: '5 hours ago', icon: Video, color: 'emerald' },
  { id: 't3', type: 'recording' as const, title: 'Shared recording of "Design Review"', time: '1 day ago', icon: Share2, color: 'rose' },
  { id: 't4', type: 'profile' as const, title: 'Updated profile bio and job title', time: '1 day ago', icon: Edit3, color: 'amber' },
  { id: 't5', type: 'team' as const, title: 'Joined "Engineering" team', time: '2 days ago', icon: Users, color: 'teal' },
  { id: 't6', type: 'meeting' as const, title: 'Hosted "Weekly Standup" meeting', time: '2 days ago', icon: Video, color: 'emerald' },
  { id: 't7', type: 'achievement' as const, title: 'Unlocked "Team Player" badge', time: '3 days ago', icon: Award, color: 'violet' },
  { id: 't8', type: 'recording' as const, title: 'Shared recording of "Q4 Review"', time: '3 days ago', icon: Share2, color: 'rose' },
  { id: 't9', type: 'profile' as const, title: 'Changed profile avatar', time: '4 days ago', icon: Edit3, color: 'amber' },
  { id: 't10', type: 'meeting' as const, title: 'Hosted "Client Demo" meeting', time: '5 days ago', icon: Video, color: 'emerald' },
]

const TIMELINE_DOT_COLORS: Record<string, string> = {
  emerald: 'bg-emerald-500',
  violet: 'bg-violet-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  teal: 'bg-teal-500',
}

const TIMELINE_LINE_COLORS: Record<string, string> = {
  emerald: 'border-emerald-200',
  violet: 'border-violet-200',
  amber: 'border-amber-200',
  rose: 'border-rose-200',
  teal: 'border-teal-200',
}

const STATS_BY_PERIOD = {
  week: [
    { label: 'Meetings', value: 8, icon: Video, color: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600' },
    { label: 'Hours', value: 12, icon: Clock, color: 'from-violet-500/10 to-violet-500/5 text-violet-600' },
    { label: 'Recordings', value: 3, icon: FileText, color: 'from-amber-500/10 to-amber-500/5 text-amber-600' },
    { label: 'Score', value: 95, icon: Trophy, color: 'from-rose-500/10 to-rose-500/5 text-rose-600' },
  ],
  month: [
    { label: 'Meetings', value: 34, icon: Video, color: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600' },
    { label: 'Hours', value: 48, icon: Clock, color: 'from-violet-500/10 to-violet-500/5 text-violet-600' },
    { label: 'Recordings', value: 14, icon: FileText, color: 'from-amber-500/10 to-amber-500/5 text-amber-600' },
    { label: 'Score', value: 98, icon: Trophy, color: 'from-rose-500/10 to-rose-500/5 text-rose-600' },
  ],
  all: [
    { label: 'Meetings', value: 142, icon: Video, color: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600' },
    { label: 'Hours', value: 286, icon: Clock, color: 'from-violet-500/10 to-violet-500/5 text-violet-600' },
    { label: 'Recordings', value: 48, icon: FileText, color: 'from-amber-500/10 to-amber-500/5 text-amber-600' },
    { label: 'Score', value: 98, icon: Trophy, color: 'from-rose-500/10 to-rose-500/5 text-rose-600' },
  ],
}

// ── Helpers ────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

// ── Animated Counter Component ─────────────────────────────────────────

function AnimatedCounter({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const mv = useMotionValue(0)
  const display = useTransform(mv, (v) => Math.round(v).toString())
  const nodeRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: 'easeOut' })
    return () => controls.stop()
  }, [mv, value, duration])

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => {
      if (nodeRef.current) nodeRef.current.textContent = v
    })
    return () => unsubscribe()
  }, [display])

  return <span ref={nodeRef}>0</span>
}

// ── Component ──────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, setUser } = useAppStore()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('Platform engineering lead with a passion for building scalable video conferencing solutions.')
  const [jobTitle, setJobTitle] = useState('Engineering Lead')
  const [location, setLocation] = useState('San Francisco, CA')
  const [phone, setPhone] = useState('+1 (555) 123-4567')
  const [timezone, setTimezone] = useState('America/Los_Angeles')
  const [department, setDepartment] = useState('Engineering')
  const [saved, setSaved] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [userSkills, setUserSkills] = useState(skills)
  const [avatarColorIndex, setAvatarColorIndex] = useState(0)

  // Presence state (persisted to localStorage)
  const [presence, setPresence] = useState<PresenceStatus>('online')
  const [presencePopoverOpen, setPresencePopoverOpen] = useState(false)

  // Custom status message
  const [statusEmoji, setStatusEmoji] = useState('')
  const [statusText, setStatusText] = useState('')
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)

  // Avatar upload
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null)
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Stats tab
  const [statsPeriod, setStatsPeriod] = useState<'week' | 'month' | 'all'>('all')

  // Completion checklist
  const completionItems = [
    { id: 'photo', label: 'Profile photo uploaded', completed: !!uploadedAvatarUrl },
    { id: 'bio', label: 'Bio / About filled in', completed: bio.length > 10 },
    { id: 'phone', label: 'Phone number added', completed: phone.length > 5 },
    { id: 'timezone', label: 'Timezone set', completed: timezone.length > 0 },
    { id: 'department', label: 'Department set', completed: department.length > 0 },
    { id: 'status', label: 'Status message set', completed: statusText.length > 0 },
    { id: 'hosted', label: 'First meeting hosted', completed: true },
  ]
  const completedCount = completionItems.filter(i => i.completed).length
  const totalCount = completionItems.length
  const completionPct = Math.round((completedCount / totalCount) * 100)

  // Load persisted state from localStorage on mount
  useEffect(() => {
    try {
      const savedPresence = localStorage.getItem('alvision_presence') as PresenceStatus | null
      if (savedPresence && PRESENCE_CONFIG[savedPresence]) setPresence(savedPresence)
      const savedEmoji = localStorage.getItem('alvision_status_emoji')
      if (savedEmoji) setStatusEmoji(savedEmoji)
      const savedStatusText = localStorage.getItem('alvision_status_text')
      if (savedStatusText) setStatusText(savedStatusText)
      const savedAvatar = localStorage.getItem('alvision_uploaded_avatar')
      if (savedAvatar) setUploadedAvatarUrl(savedAvatar)
      const savedPhone = localStorage.getItem('alvision_profile_phone')
      if (savedPhone) setPhone(savedPhone)
      const savedTz = localStorage.getItem('alvision_profile_timezone')
      if (savedTz) setTimezone(savedTz)
      const savedDept = localStorage.getItem('alvision_profile_department')
      if (savedDept) setDepartment(savedDept)
      const savedBio = localStorage.getItem('alvision_profile_bio')
      if (savedBio) setBio(savedBio)
      const savedJobTitle = localStorage.getItem('alvision_profile_jobtitle')
      if (savedJobTitle) setJobTitle(savedJobTitle)
      const savedLocation = localStorage.getItem('alvision_profile_location')
      if (savedLocation) setLocation(savedLocation)
    } catch {
      // Silently fail
    }
  }, [])

  // Fetch profile from API
  const fetchProfile = useCallback(async () => {
    try {
      const res = await authFetch('/api/v1/profile')
      if (!res.ok) return
      const json = await res.json()
      if (json.success && json.data?.profile) {
        setProfile(json.data.profile)
        setName(json.data.profile.name)
        const hash = json.data.profile.id.split('').reduce((acc: number, ch: string) => acc + ch.charCodeAt(0), 0)
        setAvatarColorIndex(hash % AVATAR_COLORS.length)
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await authFetch('/api/v1/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name,
          avatar: AVATAR_COLORS[avatarColorIndex],
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        toast.error(err?.error?.message || 'Failed to save profile')
        return
      }
      const json = await res.json()
      if (json.success && json.data?.profile) {
        setProfile(json.data.profile)
        if (user) {
          setUser({ ...user, name: json.data.profile.name, avatar: json.data.profile.avatar ?? undefined })
        }
        setSaved(true)
        setEditing(false)
        toast.success('Profile saved successfully')
        setTimeout(() => setSaved(false), 2000)
      }
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSetPresence = (status: PresenceStatus) => {
    setPresence(status)
    setPresencePopoverOpen(false)
    localStorage.setItem('alvision_presence', status)
    toast.success(`Status set to ${PRESENCE_CONFIG[status].label}`)
  }

  const handleSetStatusEmoji = (emoji: string) => {
    setStatusEmoji(emoji)
    setEmojiPickerOpen(false)
    localStorage.setItem('alvision_status_emoji', emoji)
  }

  const handleSetStatusText = (text: string) => {
    setStatusText(text)
    localStorage.setItem('alvision_status_text', text)
  }

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }
    const url = URL.createObjectURL(file)
    setUploadedAvatarUrl(url)
    setAvatarPreviewOpen(true)
    // Reset the input so the same file can be re-selected
    e.target.value = ''
  }

  const handleConfirmAvatar = () => {
    if (uploadedAvatarUrl) {
      localStorage.setItem('alvision_uploaded_avatar', uploadedAvatarUrl)
      toast.success('Avatar updated successfully')
    }
    setAvatarPreviewOpen(false)
  }

  const handleRemoveAvatar = () => {
    setUploadedAvatarUrl(null)
    localStorage.removeItem('alvision_uploaded_avatar')
    toast.success('Avatar removed')
  }

  const cycleAvatarColor = () => {
    setAvatarColorIndex((prev) => (prev + 1) % AVATAR_COLORS.length)
    if (!editing) setEditing(true)
  }

  const addSkill = () => {
    if (skillInput.trim() && !userSkills.includes(skillInput.trim())) {
      setUserSkills([...userSkills, skillInput.trim()])
      setSkillInput('')
    }
  }

  const removeSkill = (skill: string) => {
    setUserSkills(userSkills.filter(s => s !== skill))
  }

  // Display values
  const displayName = profile?.name || user?.name || name
  const displayEmail = profile?.email || user?.email || ''
  const displayRole = profile?.role || user?.role || 'participant'
  const displayOrg = profile?.organization?.name || user?.organizationName || 'ALVISION'
  const userInitials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const avatarGradient = profile?.avatar || AVATAR_COLORS[avatarColorIndex]
  const totalContributions = heatmapData.flat().reduce((a, b) => a + b, 0)
  const presenceCfg = PRESENCE_CONFIG[presence]

  if (loading) {
    return (
      <div className='max-w-3xl space-y-6'>
        <Skeleton className='h-[340px] w-full rounded-xl' />
        <Skeleton className='h-[400px] w-full rounded-xl' />
        <Skeleton className='h-[260px] w-full rounded-xl' />
        <Skeleton className='h-[400px] w-full rounded-xl' />
      </div>
    )
  }

  return (
    <motion.div className='max-w-3xl space-y-6' variants={container} initial='hidden' animate='show'>
      {/* ─── Profile Header Card ──────────────────────────────────── */}
      <motion.div variants={item}>
        <Card className='overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
          {/* Cover photo placeholder */}
          <div className='h-36 sm:h-44 bg-gradient-to-br from-fuchsia-500/20 via-violet-500/20 to-teal-500/20 relative group cursor-pointer'>
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(168,85,247,0.15),transparent_50%)]' />
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(236,72,153,0.1),transparent_50%)]' />
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(20,184,166,0.1),transparent_50%)]' />
            <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center'>
              <div className='flex items-center gap-2 text-white text-sm font-medium'><ImagePlus className='h-4 w-4' />Change Cover</div>
            </div>
          </div>
          <CardContent className='p-6 -mt-14 relative'>
            <div className='flex flex-col sm:flex-row items-center sm:items-end gap-6'>
              {/* ── Enhanced Avatar (96px) ── */}
              <div className='relative group -mt-2'>
                <Avatar className='h-24 w-24 border-4 border-background shadow-lg ring-2 ring-border/30'>
                  {uploadedAvatarUrl
                    ? <img src={uploadedAvatarUrl} alt='Avatar' className='h-full w-full object-cover' />
                    : <AvatarFallback className={`text-2xl bg-gradient-to-br ${avatarGradient} text-white font-bold`}>{userInitials}</AvatarFallback>
                  }
                </Avatar>
                {/* Hover overlay - upload */}
                <div
                  className='absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center cursor-pointer'
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className='h-6 w-6 text-white' />
                </div>
                {/* Remove avatar button */}
                {uploadedAvatarUrl && (
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleRemoveAvatar}
                    className='absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md hover:bg-rose-600 transition-colors z-10'
                  >
                    <X className='h-3.5 w-3.5' />
                  </motion.button>
                )}
                {/* ── Presence Indicator (clickable) ── */}
                <Popover open={presencePopoverOpen} onOpenChange={setPresencePopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className={`absolute bottom-1 right-1 w-6 h-6 rounded-full ${presenceCfg.dotColor} border-[3px] border-background shadow-sm hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-ring/30`}
                      aria-label='Set presence status'
                    >
                      {presence === 'online' && <div className='w-full h-full rounded-full bg-emerald-500 animate-ping opacity-75' />}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className='w-56 p-2' align='start' sideOffset={8}>
                    <p className='text-xs font-medium text-muted-foreground px-2 pb-1.5'>Set your status</p>
                    {(Object.keys(PRESENCE_CONFIG) as PresenceStatus[]).map((status) => {
                      const cfg = PRESENCE_CONFIG[status]
                      const StatusIcon = cfg.icon
                      return (
                        <button
                          key={status}
                          onClick={() => handleSetPresence(status)}
                          className={`w-full flex items-center gap-3 px-2 py-2 rounded-md text-left text-sm transition-colors hover:bg-muted/80 ${presence === status ? 'bg-muted/50' : ''}`}
                        >
                          <div className={`w-3 h-3 rounded-full ${cfg.dotColor} shrink-0`} />
                          <StatusIcon className={`h-4 w-4 ${cfg.color} shrink-0`} />
                          <div className='flex-1 min-w-0'>
                            <p className='font-medium text-foreground'>{cfg.label}</p>
                            <p className='text-[11px] text-muted-foreground'>{cfg.description}</p>
                          </div>
                          {presence === status && <Check className='h-4 w-4 text-emerald-500 shrink-0' />}
                        </button>
                      )
                    })}
                  </PopoverContent>
                </Popover>
                {/* Hidden file input */}
                <input ref={fileInputRef} type='file' accept='image/*' className='hidden' onChange={handleAvatarFileSelect} />
              </div>

              {/* ── Name, Status, Info ── */}
              <div className='flex-1 text-center sm:text-left pb-1'>
                <div className='flex items-center justify-center sm:justify-start gap-2 mb-1'>
                  <h2 className='text-xl font-bold'>{editing ? name : displayName}</h2>
                  <Badge variant='outline' className='capitalize text-xs gap-1 bg-gradient-to-br from-violet-500/10 to-violet-500/5 text-violet-600 border-violet-200'><Shield className='h-3 w-3' />{displayRole}</Badge>
                </div>
                <p className='text-muted-foreground text-sm flex items-center justify-center sm:justify-start gap-1.5'><Briefcase className='h-3.5 w-3.5' />{jobTitle}</p>

                {/* ── Custom Status Message ── */}
                <div className='mt-2 flex items-center justify-center sm:justify-start gap-1.5'>
                  <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                    <PopoverTrigger asChild>
                      <button className='text-base hover:scale-110 transition-transform focus:outline-none' aria-label='Pick emoji'>
                        {statusEmoji || <SmilePlus className='h-4 w-4 text-muted-foreground' />}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className='w-52 p-2' align='start' sideOffset={4}>
                      <p className='text-xs font-medium text-muted-foreground px-1 pb-1'>Pick an emoji</p>
                      <div className='grid grid-cols-5 gap-1'>
                        {EMOJI_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleSetStatusEmoji(emoji)}
                            className='h-9 w-9 flex items-center justify-center rounded-md text-lg hover:bg-muted/80 transition-colors'
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {editing ? (
                    <Input
                      value={statusText}
                      onChange={(e) => handleSetStatusText(e.target.value.slice(0, 100))}
                      placeholder='Set a status...'
                      className='h-7 text-sm max-w-[240px]'
                    />
                  ) : statusText ? (
                    <span className='text-sm text-muted-foreground'>{statusEmoji}{' '}{statusText}</span>
                  ) : (
                    <span className='text-sm text-muted-foreground/50 italic'>No status set</span>
                  )}
                </div>

                {/* ── Quick Status Presets (only when editing) ── */}
                {editing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className='mt-2 flex flex-wrap gap-1.5 justify-center sm:justify-start'
                  >
                    {PRESET_STATUSES.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => handleSetStatusText(preset)}
                        className={`px-2.5 py-1 text-[11px] rounded-full border transition-colors ${
                          statusText === preset
                            ? 'bg-emerald-500/10 text-emerald-700 border-emerald-300'
                            : 'bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </motion.div>
                )}

                <div className='flex items-center justify-center sm:justify-start gap-4 mt-2 text-sm text-muted-foreground'>
                  <span className='flex items-center gap-1'><Mail className='h-3.5 w-3.5' />{displayEmail}</span>
                  <span className='flex items-center gap-1'><MapPin className='h-3.5 w-3.5' />{location}</span>
                </div>
                {displayOrg && <p className='text-muted-foreground text-sm flex items-center justify-center sm:justify-start gap-1 mt-0.5'><Building2 className='h-3.5 w-3.5' />{displayOrg}</p>}
              </div>
              <Button
                variant='outline'
                className='gap-1.5 shrink-0 hover:scale-[1.02] active:scale-[0.98] transition-transform'
                onClick={() => { setEditing(!editing); setSaved(false); if (!editing) { setName(displayName) } }}
              >
                {editing ? 'Cancel' : <><Edit3 className='h-3.5 w-3.5' /> Edit</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Profile Completion Tracker ────────────────────────────── */}
      <motion.div variants={item}>
        <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
          <CardHeader>
            <CardTitle className='flex items-center justify-between'>
              <span className='flex items-center gap-2'><Trophy className='h-4 w-4 text-emerald-500' /> Profile Completion</span>
              <span className='text-sm font-bold text-emerald-600'>{completedCount}/{totalCount}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Progress bar with animated counter */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>{completionPct === 100 ? 'All done! Your profile is complete' : `Complete your profile to unlock all features`}</span>
                <span className='text-lg font-bold text-emerald-600 flex items-center gap-1'>
                  <AnimatedCounter value={completionPct} duration={1.0} />
                  <span className='text-sm'>%</span>
                </span>
              </div>
              <div className='relative h-3 rounded-full bg-muted overflow-hidden'>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPct}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                  className='h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500'
                />
              </div>
            </div>

            {/* Checklist items */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
              {completionItems.map((ci, idx) => (
                <motion.div
                  key={ci.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.06 }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-colors ${
                    ci.completed
                      ? 'bg-emerald-500/5 border-emerald-200/50'
                      : 'bg-muted/30 border-border/50'
                  }`}
                >
                  {ci.completed
                    ? <CheckCircle2 className='h-4 w-4 text-emerald-500 shrink-0' />
                    : <XCircle className='h-4 w-4 text-muted-foreground/40 shrink-0' />
                  }
                  <span className={`text-sm ${ci.completed ? 'text-foreground' : 'text-muted-foreground'}`}>{ci.label}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Profile Form / Display ────────────────────────────────── */}
      <motion.div variants={item}>
        <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>{editing ? 'Update your profile details' : 'Your personal information'}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-5'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Full Name</Label>
                {editing
                  ? <Input value={name} onChange={e => setName(e.target.value)} className='focus:ring-2 focus:ring-primary/20 transition-all duration-200' />
                  : <p className='text-sm py-2 px-3 rounded-lg border border-transparent hover:border-border/50 hover:bg-muted/30 transition-colors'>{displayName}</p>}
              </div>
              <div className='space-y-2'>
                <Label>Email</Label>
                <p className='text-sm py-2 px-3 rounded-lg border border-transparent hover:border-border/50 hover:bg-muted/30 transition-colors text-muted-foreground'>{displayEmail}</p>
              </div>
              <div className='space-y-2'>
                <Label>Job Title</Label>
                {editing
                  ? <Input value={jobTitle} onChange={e => { setJobTitle(e.target.value); localStorage.setItem('alvision_profile_jobtitle', e.target.value) }} className='focus:ring-2 focus:ring-primary/20 transition-all duration-200' />
                  : <p className='text-sm py-2 px-3 rounded-lg border border-transparent hover:border-border/50 hover:bg-muted/30 transition-colors'>{jobTitle}</p>}
              </div>
              <div className='space-y-2'>
                <Label>Location</Label>
                {editing
                  ? <Input value={location} onChange={e => { setLocation(e.target.value); localStorage.setItem('alvision_profile_location', e.target.value) }} className='focus:ring-2 focus:ring-primary/20 transition-all duration-200' />
                  : <p className='text-sm py-2 px-3 rounded-lg border border-transparent hover:border-border/50 hover:bg-muted/30 transition-colors'>{location}</p>}
              </div>
              <div className='space-y-2'>
                <Label>Phone Number</Label>
                {editing
                  ? <Input value={phone} onChange={e => { setPhone(e.target.value); localStorage.setItem('alvision_profile_phone', e.target.value) }} className='focus:ring-2 focus:ring-primary/20 transition-all duration-200' placeholder='+1 (555) 000-0000' />
                  : <p className='text-sm py-2 px-3 rounded-lg border border-transparent hover:border-border/50 hover:bg-muted/30 transition-colors'>{phone || 'Not set'}</p>}
              </div>
              <div className='space-y-2'>
                <Label>Timezone</Label>
                {editing
                  ? <Input value={timezone} onChange={e => { setTimezone(e.target.value); localStorage.setItem('alvision_profile_timezone', e.target.value) }} className='focus:ring-2 focus:ring-primary/20 transition-all duration-200' placeholder='America/Los_Angeles' />
                  : <p className='text-sm py-2 px-3 rounded-lg border border-transparent hover:border-border/50 hover:bg-muted/30 transition-colors flex items-center gap-1.5'><Globe className='h-3.5 w-3.5 text-muted-foreground' />{timezone || 'Not set'}</p>}
              </div>
              <div className='space-y-2'>
                <Label>Department</Label>
                {editing
                  ? <Input value={department} onChange={e => { setDepartment(e.target.value); localStorage.setItem('alvision_profile_department', e.target.value) }} className='focus:ring-2 focus:ring-primary/20 transition-all duration-200' placeholder='e.g. Engineering' />
                  : <p className='text-sm py-2 px-3 rounded-lg border border-transparent hover:border-border/50 hover:bg-muted/30 transition-colors flex items-center gap-1.5'><Building className='h-3.5 w-3.5 text-muted-foreground' />{department || 'Not set'}</p>}
              </div>
              <div className='space-y-2'>
                <Label>Organization</Label>
                <p className='text-sm py-2 px-3 rounded-lg border border-transparent hover:border-border/50 hover:bg-muted/30 transition-colors text-muted-foreground'>{displayOrg}</p>
              </div>
              <div className='space-y-2'>
                <Label>Role</Label>
                <div className='py-2 px-3'>
                  <Badge variant='outline' className='capitalize text-xs gap-1 bg-gradient-to-br from-violet-500/10 to-violet-500/5 text-violet-600 border-violet-200'><Shield className='h-3 w-3' />{displayRole}</Badge>
                </div>
              </div>
            </div>
            <div className='space-y-2'>
              <Label>Bio</Label>
              {editing
                ? <Textarea value={bio} onChange={e => { setBio(e.target.value); localStorage.setItem('alvision_profile_bio', e.target.value) }} rows={3} className='focus:ring-2 focus:ring-primary/20 transition-all duration-200' />
                : <p className='text-sm text-muted-foreground py-2 px-3 rounded-lg border border-transparent hover:border-border/50 hover:bg-muted/30 transition-colors'>{bio}</p>}
            </div>

            {/* Account details (read-only from API) */}
            {profile && (
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/50'>
                <div className='space-y-1'>
                  <Label className='text-muted-foreground text-xs'>Account Created</Label>
                  <p className='text-sm flex items-center gap-1.5'><CalendarDays className='h-3.5 w-3.5 text-muted-foreground' />{formatDate(profile.createdAt)}</p>
                </div>
                <div className='space-y-1'>
                  <Label className='text-muted-foreground text-xs'>Last Login</Label>
                  <p className='text-sm flex items-center gap-1.5'><RefreshCw className='h-3.5 w-3.5 text-muted-foreground' />{profile.lastLogin ? formatDateTime(profile.lastLogin) : 'N/A'}</p>
                </div>
                <div className='space-y-1'>
                  <Label className='text-muted-foreground text-xs'>Account Status</Label>
                  <Badge variant={profile.isActive ? 'outline' : 'destructive'} className='text-xs'>
                    {profile.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            )}

            {editing && (
              <div className='flex justify-end'>
                <Button onClick={handleSave} className='gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform min-w-[130px]' disabled={saving || !name.trim()}>
                  {saving ? <Loader2 className='h-4 w-4 animate-spin' /> : <Save className='h-4 w-4' />}
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Stats Section with Tab Toggle ─────────────────────────── */}
      <motion.div variants={item}>
        <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
          <CardHeader>
            <div className='flex items-center justify-between flex-wrap gap-2'>
              <CardTitle className='flex items-center gap-2'><Zap className='h-4 w-4 text-emerald-500' /> Meeting Stats</CardTitle>
              <Tabs value={statsPeriod} onValueChange={(v) => setStatsPeriod(v as 'week' | 'month' | 'all')}>
                <TabsList className='h-8'>
                  <TabsTrigger value='week' className='text-xs px-3 h-6'>This Week</TabsTrigger>
                  <TabsTrigger value='month' className='text-xs px-3 h-6'>This Month</TabsTrigger>
                  <TabsTrigger value='all' className='text-xs px-3 h-6'>All Time</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {/* Top stats with animated counters */}
            <div className='grid grid-cols-4 gap-3 mb-5'>
              {STATS_BY_PERIOD[statsPeriod].map((s) => {
                const Icon = s.icon
                return (
                  <motion.div
                    key={s.label + statsPeriod}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.03 }}
                    className='text-center p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-default'
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-1.5`}><Icon className='h-4 w-4' /></div>
                    <p className='text-lg font-bold'><AnimatedCounter value={s.value} duration={0.8} /></p>
                    <p className='text-[10px] text-muted-foreground'>{s.label}</p>
                  </motion.div>
                )
              })}
            </div>

            {/* Activity heatmap */}
            <div className='border-t border-border/50 pt-4'>
              <div className='flex items-center justify-between mb-3'>
                <p className='text-sm font-medium flex items-center gap-1.5'><CalendarDays className='h-3.5 w-3.5 text-emerald-500' />Activity Heatmap</p>
                <p className='text-xs text-muted-foreground'>{totalContributions} contributions in the last 12 weeks</p>
              </div>
              <div className='flex gap-1 overflow-x-auto pb-2'>
                {heatmapData.map((week, wi) => (
                  <div key={wi} className='flex flex-col gap-1'>
                    {week.map((day, di) => (
                      <motion.div
                        key={di}
                        title={`${day} contributions`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: (wi * 7 + di) * 0.005, duration: 0.15 }}
                        className={`w-3 h-3 rounded-sm transition-colors hover:ring-1 hover:ring-primary/30 ${heatmapColors[day]}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className='flex items-center gap-2 mt-2 text-[10px] text-muted-foreground'>
                <span>Less</span>
                <div className='w-3 h-3 rounded-sm bg-muted' />
                <div className='w-3 h-3 rounded-sm bg-emerald-500/20' />
                <div className='w-3 h-3 rounded-sm bg-emerald-500/40' />
                <div className='w-3 h-3 rounded-sm bg-emerald-500/70' />
                <span>More</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Activity Timeline ─────────────────────────────────────── */}
      <motion.div variants={item}>
        <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'><History className='h-4 w-4 text-violet-500' /> Recent Activity</CardTitle>
            <CardDescription>Your latest actions and achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='relative max-h-[480px] overflow-y-auto pr-2'>
              {/* Timeline line */}
              <div className='absolute left-[15px] top-2 bottom-2 w-px bg-border' />
              <div className='space-y-0'>
                {TIMELINE_DATA.map((entry, idx) => {
                  const Icon = entry.icon
                  const dotColor = TIMELINE_DOT_COLORS[entry.color] || 'bg-muted-foreground'
                  const lineColor = TIMELINE_LINE_COLORS[entry.color] || 'border-border'
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + idx * 0.05, duration: 0.35 }}
                      className='relative flex gap-4 py-3 group'
                    >
                      {/* Timeline dot */}
                      <div className={`relative z-10 mt-0.5 w-[30px] h-[30px] rounded-full border-2 ${lineColor} bg-background flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                      </div>
                      {/* Content */}
                      <div className='flex-1 min-w-0 pb-1'>
                        <div className='flex items-center gap-2'>
                          <Icon className={`h-3.5 w-3.5 shrink-0 ${dotColor.replace('bg-', 'text-')}`} />
                          <p className='text-sm font-medium truncate'>{entry.title}</p>
                        </div>
                        <p className='text-xs text-muted-foreground mt-0.5 ml-5.5'>{entry.time}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Skills / Expertise Tags ────────────────────────────────── */}
      <motion.div variants={item}>
        <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
          <CardHeader><CardTitle className='flex items-center gap-2'><Star className='h-4 w-4 text-amber-500' /> Skills & Expertise</CardTitle></CardHeader>
          <CardContent>
            <div className='flex flex-wrap gap-2 mb-3'>
              {userSkills.map((skill, si) => {
                const gradients = [
                  'bg-gradient-to-r from-violet-500/10 to-violet-500/5 text-violet-600 border-violet-200/50',
                  'bg-gradient-to-r from-teal-500/10 to-teal-500/5 text-teal-600 border-teal-200/50',
                  'bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 text-emerald-600 border-emerald-200/50',
                  'bg-gradient-to-r from-amber-500/10 to-amber-500/5 text-amber-600 border-amber-200/50',
                  'bg-gradient-to-r from-rose-500/10 to-rose-500/5 text-rose-600 border-rose-200/50',
                  'bg-gradient-to-r from-fuchsia-500/10 to-fuchsia-500/5 text-fuchsia-600 border-fuchsia-200/50',
                  'bg-gradient-to-r from-teal-500/10 to-teal-500/5 text-teal-600 border-teal-200/50',
                  'bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 text-emerald-600 border-emerald-200/50',
                ]
                const grad = gradients[si % gradients.length]
                return (
                  <motion.div
                    key={skill}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: si * 0.04 }}
                  >
                    <Badge variant='outline' className={`px-3 py-1.5 text-xs gap-1.5 hover:opacity-80 transition-all cursor-default ${grad}`}>
                      {skill}
                      {editing && <button type='button' onClick={() => removeSkill(skill)} className='ml-0.5 hover:text-red-500 transition-colors'><X className='h-3 w-3' /></button>}
                    </Badge>
                  </motion.div>
                )
              })}
            </div>
            {editing && (
              <div className='flex gap-2'>
                <Input placeholder='Add a skill...' value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} className='h-9 flex-1 focus:ring-2 focus:ring-primary/20' />
                <Button variant='outline' size='sm' className='gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={addSkill}><Plus className='h-3.5 w-3.5' />Add</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Avatar Preview Modal ───────────────────────────────────── */}
      <Dialog open={avatarPreviewOpen} onOpenChange={setAvatarPreviewOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Preview Avatar</DialogTitle>
            <DialogDescription>Confirm your new profile photo</DialogDescription>
          </DialogHeader>
          <div className='flex flex-col items-center gap-4 py-4'>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <Avatar className='h-32 w-32 border-4 border-background shadow-xl ring-4 ring-emerald-500/20'>
                {uploadedAvatarUrl && <img src={uploadedAvatarUrl} alt='Avatar preview' className='h-full w-full object-cover' />}
              </Avatar>
            </motion.div>
            <p className='text-sm text-muted-foreground text-center'>This photo will be visible to other team members in meetings and chat.</p>
          </div>
          <DialogFooter className='gap-2 sm:gap-0'>
            <Button variant='outline' onClick={() => setAvatarPreviewOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmAvatar} className='gap-2'><Check className='h-4 w-4' />Save Avatar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
