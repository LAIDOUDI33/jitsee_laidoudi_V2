'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  Mail,
  Video,
  MessageSquare,
  MoreHorizontal,
  Users,
  UserPlus,
  Circle,
  Shield,
  Crown,
  Clock,
  RefreshCw,
  UserX,
  AlertCircle,
  UserCog,
  CheckCircle2,
  XCircle,
  Trash2,
  Loader2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { authFetch } from '@/lib/api'
import { useAppStore } from '@/store/app-store'
import { ROLES_HIERARCHY } from '@/lib/roles'

// ── Types ──────────────────────────────────────────────────────────────

interface ApiUser {
  id: string
  name: string
  email?: string
  role: string
  isActive: boolean
  lastLogin: string | null
  createdAt: string
}

interface Person {
  id: string
  name: string
  initials: string
  role: string
  email: string
  active: boolean
  lastLogin: string | null
  createdAt: string
}

const roleBadgeColors: Record<string, { bg: string; text: string; border: string }> = {
  superadmin: { bg: 'bg-rose-500/10', text: 'text-rose-600', border: 'border-rose-200 dark:border-rose-800' },
  orgadmin: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-200 dark:border-amber-800' },
  teamadmin: { bg: 'bg-teal-500/10', text: 'text-teal-600', border: 'border-teal-200 dark:border-teal-800' },
  host: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-200 dark:border-emerald-800' },
  participant: { bg: 'bg-slate-500/10', text: 'text-slate-600', border: 'border-slate-200 dark:border-slate-800' },
  guest: { bg: 'bg-zinc-500/10', text: 'text-zinc-600', border: 'border-zinc-200 dark:border-zinc-800' },
}

const roleIcons: Record<string, React.ReactNode> = {
  superadmin: <Crown className='h-3 w-3 text-rose-500' />,
  orgadmin: <Shield className='h-3 w-3 text-amber-500' />,
  teamadmin: <Shield className='h-3 w-3 text-teal-500' />,
  host: <Crown className='h-3 w-3 text-emerald-500' />,
  participant: <Users className='h-3 w-3 text-slate-500' />,
  guest: <Users className='h-3 w-3 text-zinc-400' />,
}

const gradientOptions = [
  'from-rose-500 to-pink-600',
  'from-teal-500 to-emerald-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-400 to-amber-500',
  'from-teal-500 to-green-600',
]

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatLastLogin(date: string | null): string {
  if (!date) return 'Never'
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function mapApiUser(u: ApiUser, index: number): Person {
  return {
    id: u.id,
    name: u.name,
    initials: getInitials(u.name),
    role: u.role,
    email: u.email || '',
    active: u.isActive,
    lastLogin: u.lastLogin,
    createdAt: u.createdAt,
  }
}

// ── Animation helpers ─────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
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

// ── Main Component ────────────────────────────────────────────────────

const VALID_MEMBER_ROLES = ['orgadmin', 'teamadmin', 'host', 'participant', 'guest'] as const

export default function PeoplePage() {
  const { user } = useAppStore()
  const userRole = user?.role || 'participant'
  const canManage = (ROLES_HIERARCHY[userRole] ?? 0) >= (ROLES_HIERARCHY['orgadmin'] ?? 0)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Invite dialog state
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('participant')
  const [inviting, setInviting] = useState(false)

  // Action loading state
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchPeople = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch('/api/v1/users')
      if (res.status === 403) {
        setError('You need admin permissions to view the people directory')
        return
      }
      if (!res.ok) throw new Error('Failed to fetch people')
      const json = await res.json()
      const users = json.data?.users || []
      const mapped = users.map((u: ApiUser, i: number) => mapApiUser(u, i))
      setPeople(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load people')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPeople() }, [])

  const uniqueRoles = useMemo(() => {
    const roles = new Set(people.map(p => p.role))
    return Array.from(roles).sort()
  }, [people])

  const filtered = useMemo(() => {
    return people.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.role.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase())
      const matchesRole = !roleFilter || p.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [search, roleFilter, people])

  const activeCount = people.filter(p => p.active).length
  const inactiveCount = people.filter(p => !p.active).length
  const totalCount = people.length

  // ── Invite member handler ──
  const handleInvite = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast.error('Name and email are required')
      return
    }
    setInviting(true)
    try {
      const res = await authFetch('/api/v1/organization/members', {
        method: 'POST',
        body: JSON.stringify({ name: inviteName.trim(), email: inviteEmail.trim(), role: inviteRole }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: 'Failed to invite member' } }))
        throw new Error(err.error?.message || 'Failed to invite member')
      }
      toast.success('Member invited successfully')
      setInviteOpen(false)
      setInviteName('')
      setInviteEmail('')
      setInviteRole('participant')
      fetchPeople()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to invite member')
    } finally {
      setInviting(false)
    }
  }

  // ── Change role handler ──
  const handleChangeRole = async (targetUserId: string, newRole: string) => {
    setActionLoading(targetUserId)
    try {
      const res = await authFetch('/api/v1/organization/members', {
        method: 'PUT',
        body: JSON.stringify({ userId: targetUserId, role: newRole }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: 'Failed to change role' } }))
        throw new Error(err.error?.message || 'Failed to change role')
      }
      toast.success(`Role changed to ${newRole}`)
      fetchPeople()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change role')
    } finally {
      setActionLoading(null)
    }
  }

  // ── Toggle active handler ──
  const handleToggleActive = async (targetUser: Person) => {
    setActionLoading(targetUser.id)
    try {
      const res = await authFetch('/api/v1/organization/members', {
        method: 'PUT',
        body: JSON.stringify({ userId: targetUser.id, isActive: !targetUser.active }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: 'Failed to update status' } }))
        throw new Error(err.error?.message || 'Failed to update status')
      }
      toast.success(`${targetUser.name} ${targetUser.active ? 'deactivated' : 'activated'}`)
      fetchPeople()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setActionLoading(null)
    }
  }

  // ── Remove member handler ──
  const handleRemoveMember = async (targetUser: Person) => {
    setActionLoading(targetUser.id)
    try {
      const res = await authFetch(`/api/v1/organization/members?userId=${targetUser.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: 'Failed to remove member' } }))
        throw new Error(err.error?.message || 'Failed to remove member')
      }
      toast.success(`${targetUser.name} removed from organization`)
      fetchPeople()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member')
    } finally {
      setActionLoading(null)
    }
  }

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    uniqueRoles.forEach((r) => {
      counts[r] = people.filter((p) => p.role === r).length
    })
    return counts
  }, [people, uniqueRoles])

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <Skeleton className='h-6 w-6 rounded' />
            <div className='space-y-2'>
              <Skeleton className='h-7 w-32' />
              <Skeleton className='h-4 w-56' />
            </div>
          </div>
          <Skeleton className='h-9 w-72' />
        </div>
        <div className='flex gap-2 flex-wrap'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-8 w-24 rounded-lg' />
          ))}
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className='h-20 rounded-xl' />
          ))}
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className='h-52 rounded-xl' />
          ))}
        </div>
      </div>
    )
  }

  // ── Error state ──
  if (error) {
    return (
      <div className='space-y-6'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <Users className='h-6 w-6 text-primary' />
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>People</h1>
              <p className='text-sm text-muted-foreground'>Enterprise directory &amp; team contacts</p>
            </div>
          </div>
        </div>
        <div className='flex flex-col items-center justify-center py-16'>
          <div className='relative'>
            <AlertCircle className='h-16 w-16 text-red-500/20' />
            <div className='absolute inset-0 flex items-center justify-center'>
              <AlertCircle className='h-8 w-8 text-red-500/40' />
            </div>
          </div>
          <p className='font-medium mt-4'>{error}</p>
          <Button variant='outline' className='mt-4 gap-2' onClick={fetchPeople}>
            <RefreshCw className='h-4 w-4' /> Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div className='space-y-6' variants={container} initial='hidden' animate='show'>
      {/* ── Header ── */}
      <motion.div variants={item} className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <Users className='h-6 w-6 text-primary' />
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>People</h1>
            <p className='text-sm text-muted-foreground'>Enterprise directory &amp; team contacts</p>
          </div>
        </div>
        <div className='flex items-center gap-2 w-full sm:w-auto'>
          <div className='relative flex-1 sm:w-72'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search people...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-9 h-9'
            />
          </div>
          {canManage && (
            <Button size='sm' className='gap-2 shrink-0' onClick={() => setInviteOpen(true)}>
              <UserPlus className='h-4 w-4' />
              <span className='hidden sm:inline'>Invite Member</span>
            </Button>
          )}
        </div>
      </motion.div>

      {/* ── Member Count Summary ── */}
      <motion.div variants={item} className='flex flex-wrap gap-3'>
        <div className='flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50 text-sm'>
          <Users className='h-4 w-4 text-muted-foreground' />
          <span className='font-medium'>{totalCount}</span>
          <span className='text-muted-foreground text-xs'>Total</span>
        </div>
        <div className='flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-200/50 dark:border-emerald-800/50 text-sm'>
          <span className='w-2 h-2 rounded-full bg-emerald-500' />
          <span className='font-medium text-emerald-600 dark:text-emerald-400'>{activeCount}</span>
          <span className='text-muted-foreground text-xs'>Active</span>
        </div>
        <div className='flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/5 border border-red-200/50 dark:border-red-800/50 text-sm'>
          <span className='w-2 h-2 rounded-full bg-red-500' />
          <span className='font-medium text-red-600 dark:text-red-400'>{inactiveCount}</span>
          <span className='text-muted-foreground text-xs'>Inactive</span>
        </div>
      </motion.div>

      {/* ── Role Filters ── */}
      <motion.div variants={item} className='flex flex-wrap gap-2'>
        <Button
          variant={roleFilter === null ? 'default' : 'outline'}
          size='sm'
          className='h-8 text-xs rounded-lg'
          onClick={() => setRoleFilter(null)}
        >
          All
        </Button>
        {uniqueRoles.map((role) => (
          <Button
            key={role}
            variant={roleFilter === role ? 'default' : 'outline'}
            size='sm'
            className='h-8 text-xs rounded-lg'
            onClick={() => setRoleFilter(roleFilter === role ? null : role)}
          >
            {roleIcons[role]}
            <span className='capitalize ml-1'>{role}</span>
            <Badge variant='secondary' className='ml-1.5 h-5 px-1.5 text-[10px] rounded-full'>
              {roleCounts[role] || 0}
            </Badge>
          </Button>
        ))}
      </motion.div>

      {/* ── Stats Row ── */}
      <motion.div variants={item} className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <Card className='bg-card border border-border/50 rounded-xl hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300'>
          <CardContent className='flex items-center gap-3 py-4 px-5'>
            <div className='p-2 rounded-lg bg-gradient-to-br from-primary/20 to-violet-500/10 text-primary'>
              <Users className='h-5 w-5' />
            </div>
            <div>
              <p className='text-2xl font-bold'><AnimatedCounter target={totalCount} /></p>
              <p className='text-xs text-muted-foreground'>Total People</p>
            </div>
          </CardContent>
        </Card>
        <Card className='bg-card border border-border/50 rounded-xl hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-0.5 transition-all duration-300'>
          <CardContent className='flex items-center gap-3 py-4 px-5'>
            <div className='p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-600'>
              <Circle className='h-5 w-5 fill-emerald-500' />
            </div>
            <div>
              <p className='text-2xl font-bold text-emerald-600'><AnimatedCounter target={activeCount} /></p>
              <p className='text-xs text-muted-foreground'>Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className='bg-card border border-border/50 rounded-xl hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-0.5 transition-all duration-300'>
          <CardContent className='flex items-center gap-3 py-4 px-5'>
            <div className='p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-600'>
              <UserPlus className='h-5 w-5' />
            </div>
            <div>
              <p className='text-2xl font-bold'>{people.filter(p => {
                const created = new Date(p.createdAt)
                const now = new Date()
                return (now.getTime() - created.getTime()) < 30 * 24 * 60 * 60 * 1000
              }).length}</p>
              <p className='text-xs text-muted-foreground'>Joined This Month</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── People Grid ── */}
      <motion.div variants={item}>
        <div className='flex items-center justify-between mb-3'>
          <h2 className='text-sm font-semibold'>
            All People
            <span className='text-muted-foreground font-normal ml-2'>({filtered.length})</span>
          </h2>
        </div>

        {filtered.length > 0 ? (
        <motion.div
          className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
          variants={container}
          initial='hidden'
          animate='show'
        >
          {filtered.map((person, index) => {
            const gradient = gradientOptions[index % gradientOptions.length]
            const badgeColor = roleBadgeColors[person.role] || roleBadgeColors.participant
            return (
              <motion.div key={person.id} variants={item}>
                <Card
                  className={`bg-card border rounded-xl hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden relative ${
                    selectedId === person.id
                      ? 'border-primary ring-1 ring-primary/30'
                      : 'border-border/50'
                  }`}
                  onClick={() => setSelectedId(selectedId === person.id ? null : person.id)}
                >
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient}`} />
                  <CardContent className='p-5'>
                    <div className='flex items-start gap-3'>
                      <div className='relative'>
                        <Avatar className='h-11 w-11'>
                          <AvatarFallback className={`bg-gradient-to-br ${gradient} text-white text-xs font-bold`}>
                            {person.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background ${
                            person.active ? 'bg-emerald-500' : 'bg-zinc-400'
                          }`}
                        />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2'>
                          <h3 className='text-sm font-bold truncate'>{person.name}</h3>
                          {person.active && (
                            <span className='text-[9px] text-emerald-600 font-medium'>Active</span>
                          )}
                        </div>
                        <p className='text-xs text-muted-foreground'>{person.role}</p>
                        <Badge
                          variant='outline'
                          className={`text-[10px] h-5 px-1.5 rounded-full mt-1 capitalize gap-1 ${badgeColor.bg} ${badgeColor.text} ${badgeColor.border}`}
                        >
                          {roleIcons[person.role]}
                          {person.role}
                        </Badge>
                      </div>
                    </div>

                    <div className='mt-3 space-y-1.5'>
                      {person.email && (
                        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                          <Mail className='h-3 w-3 shrink-0' />
                          <span className='truncate'>{person.email}</span>
                        </div>
                      )}
                      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                        <Clock className='h-3 w-3 shrink-0' />
                        <span>Last login: {formatLastLogin(person.lastLogin)}</span>
                      </div>
                    </div>

                    <div className='flex items-center gap-2 mt-3 pt-3 border-t border-border/50'>
                      <Button variant='outline' size='sm' className='h-7 text-xs flex-1 rounded-lg gap-1'>
                        <MessageSquare className='h-3 w-3' />
                        Message
                      </Button>
                      <Button variant='outline' size='sm' className='h-7 text-xs flex-1 rounded-lg gap-1'>
                        <Video className='h-3 w-3' />
                        Call
                      </Button>
                      {canManage ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='sm' className='h-7 w-7 p-0 rounded-lg' disabled={actionLoading === person.id}>
                              {actionLoading === person.id ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <MoreHorizontal className='h-3.5 w-3.5' />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end' className='w-48'>
                            <DropdownMenuLabel className='text-xs'>Actions</DropdownMenuLabel>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className='gap-2 text-xs'>
                                <UserCog className='h-3.5 w-3.5' /> Change Role
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {VALID_MEMBER_ROLES.filter(r => r !== person.role).map((role) => (
                                  <DropdownMenuItem key={role} className='gap-2 text-xs capitalize' onClick={() => handleChangeRole(person.id, role)}>
                                    {roleIcons[role]}
                                    {role}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className='gap-2 text-xs'
                              onClick={() => handleToggleActive(person)}
                            >
                              {person.active ? <XCircle className='h-3.5 w-3.5 text-red-500' /> : <CheckCircle2 className='h-3.5 w-3.5 text-emerald-500' />}
                              {person.active ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className='gap-2 text-xs text-red-600 focus:text-red-600'
                              onClick={() => handleRemoveMember(person)}
                            >
                              <Trash2 className='h-3.5 w-3.5' />
                              Remove from Org
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Button variant='ghost' size='sm' className='h-7 w-7 p-0 rounded-lg'>
                          <MoreHorizontal className='h-3.5 w-3.5' />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
        ) : (
          <div className='text-center py-16'>
            <div className='relative inline-block'>
              <UserX className='h-16 w-16 text-muted-foreground/20' />
              <div className='absolute inset-0 flex items-center justify-center'>
                <UserX className='h-8 w-8 text-muted-foreground/40' />
              </div>
            </div>
            <p className='font-medium mt-4'>No people found</p>
            <p className='text-sm text-muted-foreground mt-1'>Try adjusting your search or filters</p>
          </div>
        )}
      </motion.div>

      {/* ── Invite Member Dialog ── */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <UserPlus className='h-5 w-5 text-primary' />
              Invite Member
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-4 pt-2'>
            <div className='space-y-2'>
              <Label htmlFor='invite-name'>Name</Label>
              <Input id='invite-name' placeholder='Full name' value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='invite-email'>Email</Label>
              <Input id='invite-email' type='email' placeholder='user@company.com' value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            </div>
            <div className='space-y-2'>
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue placeholder='Select role' /></SelectTrigger>
                <SelectContent>
                  {VALID_MEMBER_ROLES.map((r) => (
                    <SelectItem key={r} value={r} className='capitalize'>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex justify-end gap-3 pt-2'>
              <Button variant='outline' onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button onClick={handleInvite} disabled={inviting || !inviteName.trim() || !inviteEmail.trim()}>
                {inviting ? <Loader2 className='h-4 w-4 mr-1 animate-spin' /> : <UserPlus className='h-4 w-4 mr-1' />}
                Send Invite
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
