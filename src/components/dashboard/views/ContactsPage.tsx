'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Search,
  LayoutGrid,
  List,
  UserPlus,
  Video,
  MessageSquare,
  MoreHorizontal,
  Star,
  StarOff,
  UserMinus,
  UserCheck,
  Clock,
  Building2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { authFetch } from '@/lib/api'
import { useAppStore } from '@/store/app-store'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Contact {
  id: string
  name: string
  role: string
  status: 'online' | 'away' | 'offline'
  organization: string
  favorite: boolean
  lastContacted: string
}

type FilterTab = 'all' | 'favorites' | 'recent' | 'team' | 'organization'
type ViewMode = 'grid' | 'list'

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockContacts: Contact[] = [
  { id: '1', name: 'Sarah Chen', role: 'Engineering Lead', status: 'online', organization: 'Alvision Inc', favorite: true, lastContacted: '2h ago' },
  { id: '2', name: 'Marcus Webb', role: 'Product Manager', status: 'online', organization: 'Alvision Inc', favorite: false, lastContacted: '1d ago' },
  { id: '3', name: 'Aisha Patel', role: 'Designer', status: 'away', organization: 'Alvision Inc', favorite: true, lastContacted: '3h ago' },
  { id: '4', name: 'David Kim', role: 'Backend Engineer', status: 'offline', organization: 'Alvision Inc', favorite: false, lastContacted: '5h ago' },
  { id: '5', name: 'Elena Rodriguez', role: 'QA Engineer', status: 'online', organization: 'Alvision Inc', favorite: false, lastContacted: '1w ago' },
  { id: '6', name: 'James Foster', role: 'DevOps', status: 'away', organization: 'Alvision Inc', favorite: true, lastContacted: '30m ago' },
  { id: '7', name: 'Lisa Nakamura', role: 'Frontend Engineer', status: 'online', organization: 'Alvision Inc', favorite: false, lastContacted: '4h ago' },
  { id: '8', name: 'Omar Hassan', role: 'Security Engineer', status: 'offline', organization: 'Alvision Inc', favorite: false, lastContacted: '2d ago' },
  { id: '9', name: 'Priya Sharma', role: 'Data Scientist', status: 'online', organization: 'Alvision Inc', favorite: true, lastContacted: '1h ago' },
  { id: '10', name: 'Tom Bradley', role: 'CTO', status: 'online', organization: 'TechCorp', favorite: false, lastContacted: '3d ago' },
  { id: '11', name: 'Nina Volkov', role: 'Marketing Lead', status: 'away', organization: 'TechCorp', favorite: false, lastContacted: '1w ago' },
  { id: '12', name: 'Carlos Mendez', role: 'Sales Manager', status: 'offline', organization: 'TechCorp', favorite: false, lastContacted: '2w ago' },
]

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All Contacts' },
  { key: 'favorites', label: 'Favorites' },
  { key: 'recent', label: 'Recently Contacted' },
  { key: 'team', label: 'My Team' },
  { key: 'organization', label: 'Organization' },
]

const avatarGradients = [
  'from-emerald-500 to-teal-400',
  'from-amber-500 to-orange-400',
  'from-rose-500 to-pink-400',
  'from-violet-500 to-purple-400',
  'from-cyan-500 to-teal-400',
  'from-teal-500 to-emerald-400',
  'from-orange-500 to-amber-400',
  'from-pink-500 to-rose-400',
  'from-emerald-600 to-cyan-500',
  'from-amber-600 to-yellow-400',
  'from-rose-600 to-red-400',
  'from-violet-600 to-fuchsia-400',
]

const statusConfig = {
  online: { color: 'bg-emerald-500', label: 'Online', pulse: true },
  away: { color: 'bg-amber-500', label: 'Away', pulse: false },
  offline: { color: 'bg-gray-400', label: 'Offline', pulse: false },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getAvatarGradient(id: string): string {
  const idx = parseInt(id, 10) % avatarGradients.length
  return avatarGradients[idx] || avatarGradients[0]
}

/** Parse lastContacted into a sortable number (minutes ago). Very approximate. */
function parseLastContacted(lc: string): number {
  const match = lc.match(/(\d+)([mhdw])\s*ago/)
  if (!match) return 999999
  const num = parseInt(match[1], 10)
  const unit = match[2]
  switch (unit) {
    case 'm': return num
    case 'h': return num * 60
    case 'd': return num * 60 * 24
    case 'w': return num * 60 * 24 * 7
    default: return 999999
  }
}

// ---------------------------------------------------------------------------
// Status Dot
// ---------------------------------------------------------------------------

function StatusDot({ status }: { status: Contact['status'] }) {
  const cfg = statusConfig[status]
  return (
    <span className='relative flex h-3 w-3 shrink-0'>
      {cfg.pulse && (
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full ${cfg.color} opacity-40`}
        />
      )}
      <span className={`relative inline-flex h-3 w-3 rounded-full ${cfg.color}`} />
    </span>
  )
}

function StatusBadge({ status }: { status: Contact['status'] }) {
  const cfg = statusConfig[status]
  const variant = status === 'online' ? 'default' : status === 'away' ? 'secondary' : 'outline'
  const dotColor = status === 'online' ? 'bg-emerald-500' : status === 'away' ? 'bg-amber-500' : 'bg-gray-400'
  return (
    <Badge variant={variant} className='gap-1.5 text-xs font-normal'>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {cfg.label}
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Contact Grid Card
// ---------------------------------------------------------------------------

function ContactGridCard({
  contact,
  index,
  onVideoCall,
  onChat,
  onToggleFavorite,
  onRemove,
}: {
  contact: Contact
  index: number
  onVideoCall: (c: Contact) => void
  onChat: (c: Contact) => void
  onToggleFavorite: (c: Contact) => void
  onRemove: (c: Contact) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      layout
    >
      <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80 overflow-hidden group'>
        <CardContent className='p-5'>
          {/* Top row: avatar + info */}
          <div className='flex items-start gap-4 mb-4'>
            <div className='relative shrink-0'>
              <div
                className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarGradient(contact.id)} flex items-center justify-center text-white font-bold text-sm shadow-md`}
              >
                {getInitials(contact.name)}
              </div>
              <span className='absolute -bottom-0.5 -right-0.5'>
                <StatusDot status={contact.status} />
              </span>
            </div>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-1.5'>
                <h3 className='font-semibold text-sm truncate'>{contact.name}</h3>
                {contact.favorite && (
                  <Star className='h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0' />
                )}
              </div>
              <p className='text-xs text-muted-foreground truncate'>{contact.role}</p>
            </div>
          </div>

          {/* Organization + last contacted */}
          <div className='flex items-center gap-2 mb-4 text-xs text-muted-foreground'>
            <Building2 className='h-3 w-3 shrink-0' />
            <span className='truncate'>{contact.organization}</span>
            <span className='mx-1 text-border'>·</span>
            <Clock className='h-3 w-3 shrink-0' />
            <span className='shrink-0'>{contact.lastContacted}</span>
          </div>

          {/* Status badge */}
          <div className='mb-4'>
            <StatusBadge status={contact.status} />
          </div>

          {/* Action buttons */}
          <div className='flex items-center gap-2'>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size='sm'
                    className='flex-1 bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 h-8 text-xs'
                    onClick={() => onVideoCall(contact)}
                  >
                    <Video className='h-3.5 w-3.5' />
                    <span className='hidden sm:inline'>Call</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Start video call</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size='sm'
                    variant='outline'
                    className='flex-1 border-teal-500/30 text-teal-600 hover:bg-teal-50 hover:text-teal-700 gap-1.5 h-8 text-xs'
                    onClick={() => onChat(contact)}
                  >
                    <MessageSquare className='h-3.5 w-3.5' />
                    <span className='hidden sm:inline'>Chat</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send a message</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size='sm' variant='ghost' className='h-8 w-8 p-0'>
                  <MoreHorizontal className='h-4 w-4 text-muted-foreground' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-48'>
                <DropdownMenuItem
                  className='gap-2 cursor-pointer'
                  onClick={() => {
                    toast.info(`Starting meeting with ${contact.name}...`)
                  }}
                >
                  <Video className='h-4 w-4' />
                  Start Meeting
                </DropdownMenuItem>
                <DropdownMenuItem
                  className='gap-2 cursor-pointer'
                  onClick={() => onToggleFavorite(contact)}
                >
                  {contact.favorite ? (
                    <>
                      <StarOff className='h-4 w-4' />
                      Remove from Favorites
                    </>
                  ) : (
                    <>
                      <Star className='h-4 w-4' />
                      Add to Favorites
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className='gap-2 cursor-pointer text-destructive focus:text-destructive'
                  onClick={() => onRemove(contact)}
                >
                  <UserMinus className='h-4 w-4' />
                  Remove Contact
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className='gap-2 cursor-pointer'
                  onClick={() => toast.info(`Viewing profile for ${contact.name}`)}
                >
                  <UserCheck className='h-4 w-4' />
                  View Profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Contact List Row
// ---------------------------------------------------------------------------

function ContactListRow({
  contact,
  index,
  onVideoCall,
  onChat,
  onToggleFavorite,
  onRemove,
}: {
  contact: Contact
  index: number
  onVideoCall: (c: Contact) => void
  onChat: (c: Contact) => void
  onToggleFavorite: (c: Contact) => void
  onRemove: (c: Contact) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      layout
    >
      <div className='flex items-center gap-4 px-4 py-3 rounded-lg border border-border/40 bg-card/60 hover:bg-card hover:border-border/70 hover:shadow-sm transition-all duration-200 group'>
        {/* Avatar */}
        <div className='relative shrink-0'>
          <div
            className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(contact.id)} flex items-center justify-center text-white font-bold text-xs shadow-sm`}
          >
            {getInitials(contact.name)}
          </div>
          <span className='absolute -bottom-0.5 -right-0.5'>
            <StatusDot status={contact.status} />
          </span>
        </div>

        {/* Info */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-1.5'>
            <span className='font-medium text-sm truncate'>{contact.name}</span>
            {contact.favorite && (
              <Star className='h-3 w-3 text-amber-400 fill-amber-400 shrink-0' />
            )}
          </div>
          <p className='text-xs text-muted-foreground truncate'>
            {contact.role} · {contact.organization}
          </p>
        </div>

        {/* Last contacted (hidden on mobile) */}
        <span className='hidden md:flex items-center gap-1 text-xs text-muted-foreground shrink-0'>
          <Clock className='h-3 w-3' />
          {contact.lastContacted}
        </span>

        {/* Status badge (hidden on mobile) */}
        <div className='hidden sm:block shrink-0'>
          <StatusBadge status={contact.status} />
        </div>

        {/* Quick actions */}
        <div className='flex items-center gap-1 shrink-0'>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size='icon'
                  variant='ghost'
                  className='h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                  onClick={() => onVideoCall(contact)}
                >
                  <Video className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Video call</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size='icon'
                  variant='ghost'
                  className='h-8 w-8 text-teal-600 hover:bg-teal-50 hover:text-teal-700'
                  onClick={() => onChat(contact)}
                >
                  <MessageSquare className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Chat</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='icon' variant='ghost' className='h-8 w-8'>
                <MoreHorizontal className='h-4 w-4 text-muted-foreground' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
              <DropdownMenuItem
                className='gap-2 cursor-pointer'
                onClick={() => toast.info(`Starting meeting with ${contact.name}...`)}
              >
                <Video className='h-4 w-4' />
                Start Meeting
              </DropdownMenuItem>
              <DropdownMenuItem
                className='gap-2 cursor-pointer'
                onClick={() => onToggleFavorite(contact)}
              >
                {contact.favorite ? (
                  <>
                    <StarOff className='h-4 w-4' />
                    Remove from Favorites
                  </>
                ) : (
                  <>
                    <Star className='h-4 w-4' />
                    Add to Favorites
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className='gap-2 cursor-pointer text-destructive focus:text-destructive'
                onClick={() => onRemove(contact)}
              >
                <UserMinus className='h-4 w-4' />
                Remove Contact
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className='gap-2 cursor-pointer'
                onClick={() => toast.info(`Viewing profile for ${contact.name}`)}
              >
                <UserCheck className='h-4 w-4' />
                View Profile
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Alphabet Section Header
// ---------------------------------------------------------------------------

function LetterHeader({ letter }: { letter: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className='sticky top-0 z-10 bg-background/95 backdrop-blur-sm pt-2 pb-1'
    >
      <span className='text-xs font-bold text-muted-foreground uppercase tracking-widest px-1'>
        {letter}
      </span>
      <div className='mt-1 h-px bg-border/60' />
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

const emptyMessages: Record<FilterTab, { title: string; description: string }> = {
  all: {
    title: 'No contacts found',
    description: 'Try adjusting your search or add new contacts to get started.',
  },
  favorites: {
    title: 'No favorites yet',
    description: 'Star contacts to add them here for quick access.',
  },
  recent: {
    title: 'No recent contacts',
    description: 'Contacts you\'ve recently chatted or called with will appear here.',
  },
  team: {
    title: 'No team members',
    description: 'Your team members will show up here once assigned.',
  },
  organization: {
    title: 'No organization contacts',
    description: 'Contacts from your organization will be grouped here.',
  },
}

function EmptyState({ tab }: { tab: FilterTab }) {
  const msg = emptyMessages[tab]
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className='flex flex-col items-center justify-center py-20 text-center'
    >
      <div className='w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center mb-4'>
        <Users className='h-8 w-8 text-muted-foreground/60' />
      </div>
      <h3 className='text-base font-semibold mb-1'>{msg.title}</h3>
      <p className='text-sm text-muted-foreground max-w-xs'>{msg.description}</p>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ContactsPage() {
  const { setCurrentView } = useAppStore()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // -----------------------------------------------------------------------
  // Fetch contacts
  // -----------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false

    async function fetchContacts() {
      try {
        const res = await authFetch('/api/v1/users?limit=50')
        if (res.ok) {
          const json = await res.json()
          const users = json?.data?.users || json?.data || json?.users || []
          if (Array.isArray(users) && users.length > 0 && !cancelled) {
            const mapped: Contact[] = users.slice(0, 50).map(
              (u: Record<string, unknown>, i: number) => ({
                id: String(u.id ?? i),
                name: String(u.name ?? u.fullName ?? 'Unknown'),
                role: String(u.role ?? u.jobTitle ?? 'Team Member'),
                status: (['online', 'away', 'offline'].includes(String(u.status))
                  ? u.status
                  : 'offline') as Contact['status'],
                organization: String(u.organizationName ?? u.organization ?? 'Alvision Inc'),
                favorite: Boolean(u.favorite),
                lastContacted: String(u.lastContacted ?? `${Math.floor(Math.random() * 24)}h ago`),
              }),
            )
            setContacts(mapped)
            return
          }
        }
      } catch {
        // API failed — fall through to mock data
      }
      if (!cancelled) {
        setContacts(mockContacts)
      }
    }

    fetchContacts().finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [])

  // -----------------------------------------------------------------------
  // Filtered contacts
  // -----------------------------------------------------------------------
  const filteredContacts = useMemo(() => {
    let result = [...contacts]

    // Apply filter tab
    switch (activeTab) {
      case 'favorites':
        result = result.filter((c) => c.favorite)
        break
      case 'recent':
        result.sort((a, b) => parseLastContacted(a.lastContacted) - parseLastContacted(b.lastContacted))
        break
      case 'team':
        result = result.slice(0, 6)
        break
      case 'organization':
        // Group by org, no further filtering
        break
      default:
        break
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q) ||
          c.organization.toLowerCase().includes(q),
      )
    }

    return result
  }, [contacts, activeTab, searchQuery])

  // -----------------------------------------------------------------------
  // Grouped by org (for organization tab)
  // -----------------------------------------------------------------------
  const groupedByOrg = useMemo(() => {
    if (activeTab !== 'organization') return null
    const groups: Record<string, Contact[]> = {}
    for (const c of filteredContacts) {
      if (!groups[c.organization]) groups[c.organization] = []
      groups[c.organization].push(c)
    }
    return groups
  }, [filteredContacts, activeTab])

  // -----------------------------------------------------------------------
  // Grouped alphabetically (for list view)
  // -----------------------------------------------------------------------
  const groupedAlphabetically = useMemo(() => {
    if (viewMode !== 'list') return null
    const groups: Record<string, Contact[]> = {}
    for (const c of filteredContacts) {
      const letter = c.name[0].toUpperCase()
      if (!groups[letter]) groups[letter] = []
      groups[letter].push(c)
    }
    // Sort letters alphabetically
    const sortedKeys = Object.keys(groups).sort()
    return sortedKeys.map((letter) => ({ letter, contacts: groups[letter] }))
  }, [filteredContacts, viewMode])

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------
  const handleVideoCall = useCallback((contact: Contact) => {
    toast.success(`Starting call with ${contact.name}...`)
  }, [])

  const handleChat = useCallback((contact: Contact) => {
    toast.info(`Opening chat with ${contact.name}...`)
    setCurrentView('chat')
  }, [setCurrentView])

  const handleToggleFavorite = useCallback((contact: Contact) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === contact.id ? { ...c, favorite: !c.favorite } : c)),
    )
    if (contact.favorite) {
      toast.info(`Removed ${contact.name} from favorites`)
    } else {
      toast.success(`Added ${contact.name} to favorites`)
    }
  }, [])

  const handleRemove = useCallback((contact: Contact) => {
    setContacts((prev) => prev.filter((c) => c.id !== contact.id))
    toast.info(`Removed ${contact.name} from contacts`)
  }, [])

  const handleAddContact = useCallback(() => {
    toast.info('Add Contact dialog would open here')
  }, [])

  // -----------------------------------------------------------------------
  // Count per tab
  // -----------------------------------------------------------------------
  const tabCounts = useMemo(() => {
    const searchFiltered = searchQuery.trim()
      ? contacts.filter(
          (c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.organization.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : contacts
    return {
      all: searchFiltered.length,
      favorites: searchFiltered.filter((c) => c.favorite).length,
      recent: searchFiltered.length,
      team: Math.min(searchFiltered.length, 6),
      organization: searchFiltered.length,
    }
  }, [contacts, searchQuery])

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className='flex flex-col h-full'>
      {/* ----------------------------------------------------------------- */}
      {/* Header */}
      {/* ----------------------------------------------------------------- */}
      <div className='shrink-0 space-y-4 mb-6'>
        {/* Title row */}
        <div className='flex items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20'>
              <Users className='h-5 w-5 text-white' />
            </div>
            <div>
              <h1 className='text-xl font-bold tracking-tight'>Contacts</h1>
              <p className='text-xs text-muted-foreground'>Find and reach your team quickly</p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            {/* View toggle */}
            <div className='flex items-center border border-border/60 rounded-lg p-0.5'>
              <Button
                size='icon'
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                className={`h-8 w-8 ${viewMode === 'grid' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm' : 'text-muted-foreground'}`}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className='h-4 w-4' />
              </Button>
              <Button
                size='icon'
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                className={`h-8 w-8 ${viewMode === 'list' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm' : 'text-muted-foreground'}`}
                onClick={() => setViewMode('list')}
              >
                <List className='h-4 w-4' />
              </Button>
            </div>

            {/* Add Contact */}
            <Button
              className='bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-sm shadow-emerald-600/20'
              onClick={handleAddContact}
            >
              <UserPlus className='h-4 w-4' />
              <span className='hidden sm:inline'>Add Contact</span>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search by name, role, or organization...'
            className='pl-10 rounded-xl bg-background border-border/60 h-10'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter tabs */}
        <div className='flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none'>
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={
                `relative shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap `
              }
            >
              {activeTab === tab.key && (
                <motion.div
                  layoutId='activeContactTab'
                  className='absolute inset-0 bg-emerald-600 text-white rounded-lg shadow-sm shadow-emerald-600/20'
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span
                className={`relative z-10 flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key
                      ? 'bg-white/20 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {tabCounts[tab.key]}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Content */}
      {/* ----------------------------------------------------------------- */}
      <ScrollArea className='flex-1 -mx-1'>
        <div className='px-1'>
          {loading ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className='border border-border/50'>
                  <CardContent className='p-5'>
                    <div className='flex items-start gap-4 mb-4'>
                      <div className='w-12 h-12 rounded-full bg-muted animate-pulse' />
                      <div className='flex-1 space-y-2'>
                        <div className='h-4 w-28 bg-muted rounded animate-pulse' />
                        <div className='h-3 w-20 bg-muted rounded animate-pulse' />
                      </div>
                    </div>
                    <div className='space-y-2'>
                      <div className='h-3 w-full bg-muted rounded animate-pulse' />
                      <div className='h-8 w-full bg-muted rounded animate-pulse' />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredContacts.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : viewMode === 'grid' && !groupedByOrg ? (
            /* ---- Grid View (non-organization tabs) ---- */
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
              <AnimatePresence mode='popLayout'>
                {filteredContacts.map((contact, i) => (
                  <ContactGridCard
                    key={contact.id}
                    contact={contact}
                    index={i}
                    onVideoCall={handleVideoCall}
                    onChat={handleChat}
                    onToggleFavorite={handleToggleFavorite}
                    onRemove={handleRemove}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : viewMode === 'grid' && groupedByOrg ? (
            /* ---- Grid View (organization tab, grouped) ---- */
            <div className='space-y-8'>
              {Object.entries(groupedByOrg).map(([org, orgContacts]) => (
                <div key={org}>
                  <div className='flex items-center gap-2 mb-4'>
                    <Building2 className='h-4 w-4 text-muted-foreground' />
                    <h2 className='text-sm font-semibold'>{org}</h2>
                    <Badge variant='secondary' className='text-xs'>
                      {orgContacts.length}
                    </Badge>
                  </div>
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                    <AnimatePresence mode='popLayout'>
                      {orgContacts.map((contact, i) => (
                        <ContactGridCard
                          key={contact.id}
                          contact={contact}
                          index={i}
                          onVideoCall={handleVideoCall}
                          onChat={handleChat}
                          onToggleFavorite={handleToggleFavorite}
                          onRemove={handleRemove}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === 'list' && groupedAlphabetically ? (
            /* ---- List View (grouped alphabetically) ---- */
            <div className='space-y-2'>
              <AnimatePresence mode='popLayout'>
                {groupedAlphabetically.map(({ letter, contacts: letterContacts }) => (
                  <div key={letter}>
                    <LetterHeader letter={letter} />
                    <div className='space-y-1.5'>
                      {letterContacts.map((contact, i) => (
                        <ContactListRow
                          key={contact.id}
                          contact={contact}
                          index={i}
                          onVideoCall={handleVideoCall}
                          onChat={handleChat}
                          onToggleFavorite={handleToggleFavorite}
                          onRemove={handleRemove}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </AnimatePresence>
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  )
}
