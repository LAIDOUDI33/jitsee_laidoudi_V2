'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Users,
  Search,
  Download,
  MessageSquare,
  MicOff,
  UserMinus,
  MoreHorizontal,
  Video,
  LayoutGrid,
  LayoutList,
  UserPlus,
  ChevronDown,
  Clock,
  X,
  Send,
  ArrowUpDown,
  ShieldCheck,
  LogOut,
  DoorOpen,
} from 'lucide-react'

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type ParticipantRole = 'Host' | 'Co-host' | 'Presenter' | 'Participant' | 'Guest'
type ParticipantStatus = 'online' | 'offline' | 'in-meeting'

interface Participant {
  id: string
  name: string
  email: string
  role: ParticipantRole
  organization: string
  status: ParticipantStatus
  lastActive: string
  inMeeting: string | null
  initials: string
  gradient: string
  muted: boolean
}

/* -------------------------------------------------------------------------- */
/*                                MOCK DATA                                   */
/* -------------------------------------------------------------------------- */

const gradients = [
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-blue-600',
  'from-sky-500 to-indigo-600',
  'from-fuchsia-500 to-pink-600',
  'from-lime-500 to-green-600',
  'from-red-500 to-rose-600',
  'from-teal-500 to-cyan-600',
]

const organizations = [
  'ALVISION Inc.',
  'Acme Corp',
  'TechNova Labs',
  'Global Consulting',
  'Nexus Digital',
  'Orion Systems',
  'Pinnacle Partners',
  'Quantum Dynamics',
]

const initialParticipants: Participant[] = [
  { id: 'pt-1', name: 'Sarah Chen', email: 'sarah.chen@alvision.io', role: 'Host', organization: 'ALVISION Inc.', status: 'in-meeting', lastActive: '2 min ago', inMeeting: 'Sprint Planning Q4', initials: 'SC', gradient: gradients[0], muted: false },
  { id: 'pt-2', name: 'Marcus Rivera', email: 'marcus.r@acme.com', role: 'Co-host', organization: 'Acme Corp', status: 'in-meeting', lastActive: '1 min ago', inMeeting: 'Sprint Planning Q4', initials: 'MR', gradient: gradients[1], muted: false },
  { id: 'pt-3', name: 'Elena Volkov', email: 'elena.v@technova.io', role: 'Presenter', organization: 'TechNova Labs', status: 'online', lastActive: 'Just now', inMeeting: null, initials: 'EV', gradient: gradients[2], muted: false },
  { id: 'pt-4', name: 'James Wilson', email: 'james.w@globalconsult.com', role: 'Participant', organization: 'Global Consulting', status: 'in-meeting', lastActive: '5 min ago', inMeeting: 'Client Review', initials: 'JW', gradient: gradients[3], muted: true },
  { id: 'pt-5', name: 'Aisha Patel', email: 'aisha.p@alvision.io', role: 'Co-host', organization: 'ALVISION Inc.', status: 'online', lastActive: '3 min ago', inMeeting: null, initials: 'AP', gradient: gradients[4], muted: false },
  { id: 'pt-6', name: 'Tomás Garcia', email: 'tomas.g@nexusdigital.com', role: 'Participant', organization: 'Nexus Digital', status: 'offline', lastActive: '2h ago', inMeeting: null, initials: 'TG', gradient: gradients[5], muted: false },
  { id: 'pt-7', name: 'Lina Johansson', email: 'lina.j@orionsys.com', role: 'Presenter', organization: 'Orion Systems', status: 'online', lastActive: 'Just now', inMeeting: null, initials: 'LJ', gradient: gradients[6], muted: false },
  { id: 'pt-8', name: 'David Kim', email: 'david.k@pinnacle.com', role: 'Participant', organization: 'Pinnacle Partners', status: 'offline', lastActive: '1d ago', inMeeting: null, initials: 'DK', gradient: gradients[7], muted: false },
  { id: 'pt-9', name: 'Rachel Morgan', email: 'rachel.m@alvision.io', role: 'Host', organization: 'ALVISION Inc.', status: 'in-meeting', lastActive: '1 min ago', inMeeting: 'Design Sync', initials: 'RM', gradient: gradients[8], muted: false },
  { id: 'pt-10', name: 'Carlos Mendes', email: 'carlos.m@quantumd.io', role: 'Participant', organization: 'Quantum Dynamics', status: 'online', lastActive: '10 min ago', inMeeting: null, initials: 'CM', gradient: gradients[9], muted: false },
  { id: 'pt-11', name: 'Priya Sharma', email: 'priya.s@alvision.io', role: 'Guest', organization: 'ALVISION Inc.', status: 'in-meeting', lastActive: '3 min ago', inMeeting: 'Sprint Planning Q4', initials: 'PS', gradient: gradients[0], muted: true },
  { id: 'pt-12', name: 'Alexander Novak', email: 'alex.n@acme.com', role: 'Participant', organization: 'Acme Corp', status: 'offline', lastActive: '5h ago', inMeeting: null, initials: 'AN', gradient: gradients[1], muted: false },
  { id: 'pt-13', name: 'Mei Lin', email: 'mei.l@technova.io', role: 'Co-host', organization: 'TechNova Labs', status: 'online', lastActive: '2 min ago', inMeeting: null, initials: 'ML', gradient: gradients[2], muted: false },
  { id: 'pt-14', name: 'Omar Hassan', email: 'omar.h@globalconsult.com', role: 'Participant', organization: 'Global Consulting', status: 'in-meeting', lastActive: 'Just now', inMeeting: 'Client Review', initials: 'OH', gradient: gradients[3], muted: false },
  { id: 'pt-15', name: 'Sophie Laurent', email: 'sophie.l@nexusdigital.com', role: 'Guest', organization: 'Nexus Digital', status: 'offline', lastActive: '3d ago', inMeeting: null, initials: 'SL', gradient: gradients[4], muted: false },
  { id: 'pt-16', name: 'Ryan Tanaka', email: 'ryan.t@orionsys.com', role: 'Presenter', organization: 'Orion Systems', status: 'online', lastActive: '15 min ago', inMeeting: null, initials: 'RT', gradient: gradients[5], muted: false },
  { id: 'pt-17', name: 'Isabella Rossi', email: 'isabella.r@pinnacle.com', role: 'Participant', organization: 'Pinnacle Partners', status: 'offline', lastActive: '12h ago', inMeeting: null, initials: 'IR', gradient: gradients[6], muted: false },
  { id: 'pt-18', name: 'Noah Anderson', email: 'noah.a@alvision.io', role: 'Participant', organization: 'ALVISION Inc.', status: 'in-meeting', lastActive: '1 min ago', inMeeting: 'Design Sync', initials: 'NA', gradient: gradients[7], muted: false },
  { id: 'pt-19', name: 'Yuki Tanaka', email: 'yuki.t@quantumd.io', role: 'Co-host', organization: 'Quantum Dynamics', status: 'online', lastActive: '5 min ago', inMeeting: null, initials: 'YT', gradient: gradients[8], muted: false },
  { id: 'pt-20', name: 'Diego Morales', email: 'diego.m@acme.com', role: 'Guest', organization: 'Acme Corp', status: 'offline', lastActive: '2d ago', inMeeting: null, initials: 'DM', gradient: gradients[9], muted: false },
  { id: 'pt-21', name: 'Emma Thompson', email: 'emma.t@technova.io', role: 'Participant', organization: 'TechNova Labs', status: 'online', lastActive: '8 min ago', inMeeting: null, initials: 'ET', gradient: gradients[0], muted: false },
  { id: 'pt-22', name: 'Liam O\'Brien', email: 'liam.o@globalconsult.com', role: 'Host', organization: 'Global Consulting', status: 'in-meeting', lastActive: 'Just now', inMeeting: 'Client Review', initials: 'LO', gradient: gradients[1], muted: false },
]

/* -------------------------------------------------------------------------- */
/*                              ROLE BADGE COLORS                             */
/* -------------------------------------------------------------------------- */

const roleBadgeClasses: Record<ParticipantRole, string> = {
  Host: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  'Co-host': 'bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/20',
  Presenter: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20',
  Participant: 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/20',
  Guest: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
}

const statusDotClasses: Record<ParticipantStatus, string> = {
  online: 'bg-emerald-500 animate-breathe',
  offline: 'bg-zinc-400',
  'in-meeting': 'bg-emerald-500 animate-breathe ring-2 ring-emerald-500/30',
}

/* -------------------------------------------------------------------------- */
/*                              ANIMATION HELPERS                             */
/* -------------------------------------------------------------------------- */

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0)
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    const duration = 1200
    const startTime = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target])
  return <span>{count}</span>
}

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

export default function ParticipantsPage() {
  // ── State ────────────────────────────────────────────────────────────────
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('name')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmails, setInviteEmails] = useState('')
  const [inviteRole, setInviteRole] = useState<ParticipantRole>('Participant')
  const [inviteMessage, setInviteMessage] = useState('')
  const [sendingInvite, setSendingInvite] = useState(false)

  // ── Computed values ─────────────────────────────────────────────────────
  const totalParticipants = participants.length
  const onlineCount = participants.filter(p => p.status === 'online' || p.status === 'in-meeting').length
  const inMeetingCount = participants.filter(p => p.status === 'in-meeting').length
  const pendingInvites = 4

  const filteredParticipants = useMemo(() => {
    let result = [...participants]

    // Search
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.organization.toLowerCase().includes(q)
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      result = result.filter(p => p.role === roleFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter)
    }

    // Sort
    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'role': {
        const roleOrder: Record<ParticipantRole, number> = { Host: 0, 'Co-host': 1, Presenter: 2, Participant: 3, Guest: 4 }
        result.sort((a, b) => roleOrder[a.role] - roleOrder[b.role])
        break
      }
      case 'last-active': {
        const timeOrder: Record<ParticipantStatus, number> = { 'in-meeting': 0, online: 1, offline: 2 }
        result.sort((a, b) => timeOrder[a.status] - timeOrder[b.status])
        break
      }
    }

    return result
  }, [participants, search, roleFilter, statusFilter, sortBy])

  const allSelected = filteredParticipants.length > 0 && filteredParticipants.every(p => selectedIds.has(p.id))

  // ── Handlers ────────────────────────────────────────────────────────────
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredParticipants.map(p => p.id)))
    }
  }, [allSelected, filteredParticipants])

  const handleRoleChange = useCallback((id: string, newRole: ParticipantRole) => {
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, role: newRole } : p))
    toast.success(`Role updated to ${newRole}`)
  }, [])

  const handleMute = useCallback((id: string) => {
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, muted: !p.muted } : p))
    const p = participants.find(p => p.id === id)
    toast.success(p?.muted ? `${p?.name} unmuted` : `${p?.name} muted`)
  }, [participants])

  const handleRemove = useCallback((id: string) => {
    const p = participants.find(p => p.id === id)
    setParticipants(prev => prev.filter(p => p.id !== id))
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n })
    toast.success(`${p?.name} removed`)
  }, [participants])

  const handleMoveToWaitingRoom = useCallback((id: string) => {
    toast.success('Participant moved to waiting room')
  }, [])

  const handleDisconnect = useCallback((id: string) => {
    const p = participants.find(p => p.id === id)
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, status: 'offline' as const, inMeeting: null } : p))
    toast.success(`${p?.name} disconnected`)
  }, [participants])

  const handleSendMessage = useCallback((name: string) => {
    toast.success(`Message sent to ${name}`)
  }, [])

  // Bulk actions
  const handleBulkMute = useCallback(() => {
    setParticipants(prev => prev.map(p => selectedIds.has(p.id) ? { ...p, muted: true } : p))
    toast.success(`${selectedIds.size} participant(s) muted`)
    setSelectedIds(new Set())
  }, [selectedIds])

  const handleBulkRemove = useCallback(() => {
    setParticipants(prev => prev.filter(p => !selectedIds.has(p.id)))
    toast.success(`${selectedIds.size} participant(s) removed`)
    setSelectedIds(new Set())
  }, [selectedIds])

  const handleBulkRoleChange = useCallback((newRole: ParticipantRole) => {
    setParticipants(prev => prev.map(p => selectedIds.has(p.id) ? { ...p, role: newRole } : p))
    toast.success(`${selectedIds.size} participant(s) role changed to ${newRole}`)
    setSelectedIds(new Set())
  }, [selectedIds])

  const handleExport = useCallback(() => {
    toast.success('Participant list exported as CSV')
  }, [])

  const handleInvite = useCallback(async () => {
    if (!inviteEmails.trim()) {
      toast.error('Please enter at least one email address')
      return
    }
    setSendingInvite(true)
    await new Promise(resolve => setTimeout(resolve, 1200))
    setSendingInvite(false)
    setInviteOpen(false)
    setInviteEmails('')
    setInviteMessage('')
    setInviteRole('Participant')
    const emailCount = inviteEmails.split(',').filter(e => e.trim()).length
    toast.success(`Invitations sent to ${emailCount} participant(s)`)
  }, [inviteEmails])

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <motion.div className='space-y-6' variants={container} initial='hidden' animate='show'>
      {/* ── Header ── */}
      <motion.div variants={item} className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <div className='p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-600'>
            <Users className='h-6 w-6' />
          </div>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Participant Management</h1>
            <p className='text-sm text-muted-foreground'>Manage participants, roles, and meeting access</p>
            <div className='h-1 w-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500/50 mt-2' />
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            className='h-9 gap-2 rounded-lg'
            onClick={handleExport}
          >
            <Download className='h-4 w-4' />
            Export
          </Button>
          <Button
            size='sm'
            className='h-9 gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200'
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus className='h-4 w-4' />
            Invite Participants
          </Button>
        </div>
      </motion.div>

      {/* ── Stats Row ── */}
      <motion.div variants={item} className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 rounded-xl hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden before:content-["\"] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-emerald-500/60 before:to-teal-500/60'>
          <CardContent className='flex items-center gap-3 py-4 px-5'>
            <div className='p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-600'>
              <Users className='h-5 w-5' />
            </div>
            <div>
              <p className='text-2xl font-bold'><AnimatedCounter target={totalParticipants} /></p>
              <p className='text-xs text-muted-foreground'>Total Participants</p>
            </div>
          </CardContent>
        </Card>

        <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 rounded-xl hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden before:content-["\"] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-emerald-500/60 before:to-green-500/60'>
          <CardContent className='flex items-center gap-3 py-4 px-5'>
            <div className='p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/10 text-emerald-600'>
              <div className='relative'>
                <span className='h-2.5 w-2.5 rounded-full bg-emerald-500 block animate-breathe' />
              </div>
            </div>
            <div>
              <p className='text-2xl font-bold text-emerald-600'><AnimatedCounter target={onlineCount} /></p>
              <p className='text-xs text-muted-foreground'>Online Now</p>
            </div>
          </CardContent>
        </Card>

        <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 rounded-xl hover:shadow-lg hover:shadow-violet-500/5 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden before:content-["\"] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-violet-500/60 before:to-purple-500/60'>
          <CardContent className='flex items-center gap-3 py-4 px-5'>
            <div className='p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/10 text-violet-600'>
              <Video className='h-5 w-5' />
            </div>
            <div>
              <p className='text-2xl font-bold text-violet-600'><AnimatedCounter target={inMeetingCount} /></p>
              <p className='text-xs text-muted-foreground'>In Meetings</p>
            </div>
          </CardContent>
        </Card>

        <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 rounded-xl hover:shadow-lg hover:shadow-amber-500/5 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden before:content-["\"] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-amber-500/60 before:to-orange-500/60'>
          <CardContent className='flex items-center gap-3 py-4 px-5'>
            <div className='p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-600'>
              <Send className='h-5 w-5' />
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <p className='text-2xl font-bold text-amber-600'>{pendingInvites}</p>
                <Badge className='bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px] px-1.5 py-0'>
                  pending
                </Badge>
              </div>
              <p className='text-xs text-muted-foreground'>Pending Invites</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Search & Filter Bar ── */}
      <motion.div variants={item} className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search participants...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-9 h-9'
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger size='sm' className='w-[140px] rounded-lg'>
            <SelectValue placeholder='Role' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Roles</SelectItem>
            <SelectItem value='Host'>Host</SelectItem>
            <SelectItem value='Co-host'>Co-host</SelectItem>
            <SelectItem value='Presenter'>Presenter</SelectItem>
            <SelectItem value='Participant'>Participant</SelectItem>
            <SelectItem value='Guest'>Guest</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger size='sm' className='w-[140px] rounded-lg'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            <SelectItem value='online'>Online</SelectItem>
            <SelectItem value='offline'>Offline</SelectItem>
            <SelectItem value='in-meeting'>In Meeting</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger size='sm' className='w-[140px] rounded-lg'>
            <ArrowUpDown className='h-3.5 w-3.5 mr-1.5 text-muted-foreground' />
            <SelectValue placeholder='Sort by' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='name'>Name</SelectItem>
            <SelectItem value='role'>Role</SelectItem>
            <SelectItem value='last-active'>Last Active</SelectItem>
          </SelectContent>
        </Select>

        {/* View Toggle */}
        <div className='flex items-center border rounded-lg p-0.5 bg-muted/30'>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size='sm'
            className='h-7 w-7 p-0 rounded-md'
            onClick={() => setViewMode('table')}
          >
            <LayoutList className='h-3.5 w-3.5' />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size='sm'
            className='h-7 w-7 p-0 rounded-md'
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className='h-3.5 w-3.5' />
          </Button>
        </div>
      </motion.div>

      {/* ── Bulk Actions Bar ── */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className='border-emerald-500/30 bg-emerald-500/5 rounded-xl overflow-hidden'>
              <CardContent className='flex items-center gap-3 py-3 px-4'>
                <span className='text-sm font-medium text-emerald-700 dark:text-emerald-400'>
                  {selectedIds.size} selected
                </span>
                <Separator orientation='vertical' className='h-5' />
                <Button variant='outline' size='sm' className='h-7 text-xs gap-1.5 rounded-lg' onClick={handleBulkMute}>
                  <MicOff className='h-3 w-3' />
                  Mute All
                </Button>
                <Button variant='outline' size='sm' className='h-7 text-xs gap-1.5 rounded-lg' onClick={() => handleBulkRoleChange('Participant')}>
                  <ShieldCheck className='h-3 w-3' />
                  Change Role
                </Button>
                <Button variant='outline' size='sm' className='h-7 text-xs gap-1.5 rounded-lg text-destructive hover:text-destructive' onClick={handleBulkRemove}>
                  <UserMinus className='h-3 w-3' />
                  Remove
                </Button>
                <div className='ml-auto'>
                  <Button variant='ghost' size='sm' className='h-7 text-xs rounded-lg' onClick={() => setSelectedIds(new Set())}>
                    <X className='h-3 w-3 mr-1' />
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Table View ── */}
      <motion.div variants={item}>
        {viewMode === 'table' ? (
          <Card className='border border-border/50 rounded-xl overflow-hidden relative before:content-["\"] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-emerald-500/60 before:to-teal-500/40'>
            <div className='max-h-[520px] overflow-y-auto custom-scrollbar'>
              <Table>
                <TableHeader>
                  <TableRow className='bg-muted/30 hover:bg-muted/30'>
                    <TableHead className='w-10 pl-4'>
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleSelectAll}
                        className='rounded-md'
                      />
                    </TableHead>
                    <TableHead className='pl-0'>Participant</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className='hidden md:table-cell'>Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='hidden lg:table-cell'>Last Active</TableHead>
                    <TableHead className='text-right pr-4'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParticipants.map((p) => (
                    <TableRow
                      key={p.id}
                      className={`group transition-colors duration-150 ${selectedIds.has(p.id) ? 'bg-emerald-500/5' : ''}`}
                    >
                      <TableCell className='pl-4'>
                        <Checkbox
                          checked={selectedIds.has(p.id)}
                          onCheckedChange={() => toggleSelect(p.id)}
                          className='rounded-md'
                        />
                      </TableCell>
                      <TableCell className='pl-0'>
                        <div className='flex items-center gap-3'>
                          <div className='relative shrink-0'>
                            <Avatar className='h-9 w-9'>
                              <AvatarFallback className={`bg-gradient-to-br ${p.gradient} text-white text-xs font-bold`}>
                                {p.initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${statusDotClasses[p.status]}`} />
                          </div>
                          <div className='min-w-0'>
                            <div className='flex items-center gap-2'>
                              <p className='text-sm font-medium truncate'>{p.name}</p>
                              {p.inMeeting && (
                                <Badge className='bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px] px-1.5 py-0 h-4 gap-0.5'>
                                  <Video className='h-2.5 w-2.5' />
                                  In Meeting
                                </Badge>
                              )}
                            </div>
                            <p className='text-xs text-muted-foreground truncate'>{p.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className='cursor-pointer'>
                              <Badge variant='outline' className={`text-[11px] px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${roleBadgeClasses[p.role]}`}>
                                {p.role}
                                <ChevronDown className='ml-1 h-2.5 w-2.5 opacity-50' />
                              </Badge>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='start' className='w-40'>
                            <DropdownMenuLabel className='text-xs text-muted-foreground'>Change Role</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {(['Host', 'Co-host', 'Presenter', 'Participant', 'Guest'] as ParticipantRole[]).map(role => (
                              <DropdownMenuItem
                                key={role}
                                onClick={() => handleRoleChange(p.id, role)}
                                className={p.role === role ? 'font-medium' : ''}
                              >
                                {role === p.role && '✓ '}{role}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell className='hidden md:table-cell'>
                        <span className='text-sm text-muted-foreground'>{p.organization}</span>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-1.5'>
                          <span className={`h-2 w-2 rounded-full shrink-0 ${statusDotClasses[p.status]}`} />
                          <span className='text-sm capitalize'>{p.status.replace('-', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell className='hidden lg:table-cell'>
                        <div className='flex items-center gap-1.5 text-sm text-muted-foreground'>
                          <Clock className='h-3.5 w-3.5' />
                          {p.lastActive}
                        </div>
                      </TableCell>
                      <TableCell className='text-right pr-4'>
                        <div className='flex items-center justify-end gap-1'>
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant='ghost' size='sm' className='h-7 w-7 p-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity' onClick={() => handleSendMessage(p.name)}>
                                  <MessageSquare className='h-3.5 w-3.5' />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Message</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant='ghost' size='sm' className={`h-7 w-7 p-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${p.muted ? 'text-amber-500' : ''}`} onClick={() => handleMute(p.id)}>
                                  <MicOff className='h-3.5 w-3.5' />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{p.muted ? 'Unmute' : 'Mute'}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant='ghost' size='sm' className='h-7 w-7 p-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive' onClick={() => handleRemove(p.id)}>
                                  <UserMinus className='h-3.5 w-3.5' />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Remove</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='sm' className='h-7 w-7 p-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity'>
                                <MoreHorizontal className='h-3.5 w-3.5' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='w-48'>
                              <DropdownMenuLabel className='text-xs'>Actions for {p.name}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleRoleChange(p.id, 'Presenter')}>
                                <ShieldCheck className='h-4 w-4 mr-2' />
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleMoveToWaitingRoom(p.id)}>
                                <DoorOpen className='h-4 w-4 mr-2' />
                                Move to Waiting Room
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDisconnect(p.id)} className='text-destructive focus:text-destructive'>
                                <LogOut className='h-4 w-4 mr-2' />
                                Disconnect
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredParticipants.length === 0 && (
              <div className='text-center py-12 text-muted-foreground'>
                <Users className='h-10 w-10 mx-auto mb-3 opacity-50' />
                <p className='text-sm font-medium'>No participants found</p>
                <p className='text-xs mt-1'>Try adjusting your search or filters</p>
              </div>
            )}
          </Card>
        ) : (
          /* ── Grid View ── */
          <>
            <div className='flex items-center justify-between mb-3'>
              <p className='text-sm text-muted-foreground'>{filteredParticipants.length} participant(s)</p>
              {filteredParticipants.length > 0 && (
                <div className='flex items-center gap-2'>
                  <Button variant='outline' size='sm' className='h-7 text-xs gap-1.5 rounded-lg' onClick={toggleSelectAll}>
                    <Checkbox checked={allSelected} className='rounded-md mr-1' />
                    Select All
                  </Button>
                </div>
              )}
            </div>
            <motion.div
              className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4'
              variants={container}
              initial='hidden'
              animate='show'
            >
              {filteredParticipants.map((p) => (
                <motion.div key={p.id} variants={item} whileHover={{ y: -2 }}>
                  <Card
                    className={`bg-gradient-to-br from-card to-card/80 border rounded-xl overflow-hidden hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300 relative ${
                      selectedIds.has(p.id)
                        ? 'border-emerald-500/50 ring-1 ring-emerald-500/20'
                        : 'border-border/50'
                    }`}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${p.gradient}`} />
                    <CardContent className='p-4'>
                      <div className='flex items-start gap-3'>
                        <div className='relative shrink-0'>
                          <Avatar className='h-10 w-10'>
                            <AvatarFallback className={`bg-gradient-to-br ${p.gradient} text-white text-xs font-bold`}>
                              {p.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${statusDotClasses[p.status]}`} />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2'>
                            <h3 className='text-sm font-bold truncate'>{p.name}</h3>
                            {p.muted && (
                              <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <MicOff className='h-3.5 w-3.5 text-amber-500 shrink-0' />
                                  </TooltipTrigger>
                                  <TooltipContent>Muted</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <p className='text-xs text-muted-foreground truncate'>{p.email}</p>
                          <div className='flex items-center gap-1.5 mt-1'>
                            <Badge variant='outline' className={`text-[10px] px-1.5 py-0 rounded-full ${roleBadgeClasses[p.role]}`}>
                              {p.role}
                            </Badge>
                            {p.inMeeting && (
                              <Badge className='bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px] px-1.5 py-0 rounded-full gap-0.5'>
                                <Video className='h-2.5 w-2.5' />
                                In Meeting
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Checkbox
                          checked={selectedIds.has(p.id)}
                          onCheckedChange={() => toggleSelect(p.id)}
                          className='rounded-md shrink-0'
                        />
                      </div>

                      <div className='mt-3 space-y-1.5'>
                        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                          <span className='h-2 w-2 rounded-full shrink-0 bg-muted-foreground/30' />
                          <span className='truncate'>{p.organization}</span>
                        </div>
                        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                          <Clock className='h-3 w-3 shrink-0' />
                          <span>{p.lastActive}</span>
                        </div>
                      </div>

                      <Separator className='my-3' />

                      <div className='flex items-center gap-1.5'>
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant='outline' size='sm' className='h-7 flex-1 text-xs gap-1 rounded-lg' onClick={() => handleSendMessage(p.name)}>
                                <MessageSquare className='h-3 w-3' />
                                Message
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Send message</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant='outline' size='sm' className={`h-7 w-7 p-0 rounded-lg ${p.muted ? 'text-amber-500 border-amber-500/30' : ''}`} onClick={() => handleMute(p.id)}>
                                <MicOff className='h-3 w-3' />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{p.muted ? 'Unmute' : 'Mute'}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='outline' size='sm' className='h-7 w-7 p-0 rounded-lg'>
                              <MoreHorizontal className='h-3 w-3' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end' className='w-48'>
                            <DropdownMenuLabel className='text-xs'>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleRoleChange(p.id, 'Host')}>
                              <ShieldCheck className='h-4 w-4 mr-2' />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMoveToWaitingRoom(p.id)}>
                              <DoorOpen className='h-4 w-4 mr-2' />
                              Move to Waiting Room
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleRemove(p.id)} className='text-destructive focus:text-destructive'>
                              <UserMinus className='h-4 w-4 mr-2' />
                              Remove
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDisconnect(p.id)} className='text-destructive focus:text-destructive'>
                              <LogOut className='h-4 w-4 mr-2' />
                              Disconnect
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
            {filteredParticipants.length === 0 && (
              <div className='text-center py-12 text-muted-foreground'>
                <Users className='h-10 w-10 mx-auto mb-3 opacity-50' />
                <p className='text-sm font-medium'>No participants found</p>
                <p className='text-xs mt-1'>Try adjusting your search or filters</p>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* ── Invite Dialog ── */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className='sm:max-w-md rounded-xl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <div className='p-1.5 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-600'>
                <UserPlus className='h-4 w-4' />
              </div>
              Invite Participants
            </DialogTitle>
            <DialogDescription>Send invitations to new participants via email.</DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-2'>
            <div className='space-y-2'>
              <Label htmlFor='invite-emails'>Email Addresses</Label>
              <Textarea
                id='invite-emails'
                placeholder='Enter email addresses separated by commas...'
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                rows={3}
                className='resize-none'
              />
              <p className='text-xs text-muted-foreground'>Separate multiple emails with commas</p>
            </div>

            <div className='space-y-2'>
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as ParticipantRole)}>
                <SelectTrigger className='rounded-lg'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Host'>Host</SelectItem>
                  <SelectItem value='Co-host'>Co-host</SelectItem>
                  <SelectItem value='Presenter'>Presenter</SelectItem>
                  <SelectItem value='Participant'>Participant</SelectItem>
                  <SelectItem value='Guest'>Guest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='invite-message'>Personal Message (optional)</Label>
              <Textarea
                id='invite-message'
                placeholder='Add a personal message to the invitation...'
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                rows={3}
                className='resize-none'
              />
            </div>
          </div>

          <DialogFooter className='gap-2 sm:gap-0'>
            <Button variant='outline' onClick={() => setInviteOpen(false)} className='rounded-lg'>
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={sendingInvite}
              className='rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md shadow-emerald-500/20'
            >
              {sendingInvite ? (
                <>
                  <motion.div
                    className='h-4 w-4 border-2 border-white/30 border-t-white rounded-full'
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                  Sending...
                </>
              ) : (
                <>
                  <Send className='h-4 w-4 mr-2' />
                  Send Invitations
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
