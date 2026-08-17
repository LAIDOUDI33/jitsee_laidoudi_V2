'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, AppView } from '@/store/app-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LayoutDashboard,
  Video,
  Users,
  MessageSquare,
  FolderOpen,
  Film,
  Bot,
  BookOpen,
  CalendarDays,
  CalendarHeart,
  Settings,
  UserCircle,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Building2,
  Lock,
  FileText,
  Server,
  Activity,
  X,
  Search,
  HelpCircle,
  User as UserIcon,
  MonitorUp,
  Pen,
  BarChart3,
  UsersRound,
  Puzzle,
  Webhook as WebhookIcon,
  LayoutTemplate,
  Bell,
  LayoutGrid,
  UserPlus,
  NotebookPen,
  History,
} from 'lucide-react'
import NotificationDropdown from '@/components/shared/NotificationDropdown'
import SearchCommand from '@/components/shared/SearchCommand'
import QuickStartMeeting from '@/components/shared/QuickStartMeeting'
import OnboardingModal from '@/components/shared/OnboardingModal'
import KeyboardShortcuts, { useKeyboardShortcuts } from '@/components/shared/KeyboardShortcuts'
import { useOnboarding } from '@/hooks/useOnboarding'

const newBadgeViews = new Set<AppView>(['whiteboard', 'analytics'])

interface NavItem {
  label: string
  icon: React.ReactNode
  view: AppView
  adminOnly?: boolean
}

const mainNavItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard className='h-4 w-4' />, view: 'dashboard' },
  { label: 'Meetings', icon: <Video className='h-4 w-4' />, view: 'meetings' },
  { label: 'Teams', icon: <Users className='h-4 w-4' />, view: 'teams' },
  { label: 'Chat', icon: <MessageSquare className='h-4 w-4' />, view: 'chat' },
  { label: 'Files', icon: <FolderOpen className='h-4 w-4' />, view: 'files' },
  { label: 'Recordings', icon: <Film className='h-4 w-4' />, view: 'recordings' },
  { label: 'AI Assistant', icon: <Bot className='h-4 w-4' />, view: 'ai-assistant' },
  { label: 'Knowledge Base', icon: <BookOpen className='h-4 w-4' />, view: 'knowledge' },
  { label: 'Calendar', icon: <CalendarDays className='h-4 w-4' />, view: 'calendar' },
  { label: 'Events', icon: <CalendarHeart className='h-4 w-4' />, view: 'events' },
  { label: 'Whiteboard', icon: <Pen className='h-4 w-4' />, view: 'whiteboard' },
  { label: 'Analytics', icon: <BarChart3 className='h-4 w-4' />, view: 'analytics' },
  { label: 'Status', icon: <Activity className='h-4 w-4' />, view: 'status' },
  { label: 'People', icon: <UsersRound className='h-4 w-4' />, view: 'people' },
  { label: 'Integrations', icon: <Puzzle className='h-4 w-4' />, view: 'integrations' },
  { label: 'Help Center', icon: <HelpCircle className='h-4 w-4' />, view: 'help-center' },
  { label: 'Webhooks', icon: <WebhookIcon className='h-4 w-4' />, view: 'webhooks' },
  { label: 'Templates', icon: <LayoutTemplate className='h-4 w-4' />, view: 'templates' },
  { label: 'Notifications', icon: <Bell className='h-4 w-4' />, view: 'notifications' },
  { label: 'Breakout Rooms', icon: <LayoutGrid className='h-4 w-4' />, view: 'breakout-rooms' },
  { label: 'Participants', icon: <UserPlus className='h-4 w-4' />, view: 'participants' },
  { label: 'Meeting Notes', icon: <NotebookPen className='h-4 w-4' />, view: 'meeting-notes' },
  { label: 'Session History', icon: <History className='h-4 w-4' />, view: 'session-history' },
]

const adminNavItems: NavItem[] = [
  { label: 'Admin Overview', icon: <Shield className='h-4 w-4' />, view: 'admin', adminOnly: true },
  { label: 'Users', icon: <Users className='h-4 w-4' />, view: 'admin-users', adminOnly: true },
  { label: 'Organizations', icon: <Building2 className='h-4 w-4' />, view: 'admin-orgs', adminOnly: true },
  { label: 'Security', icon: <Lock className='h-4 w-4' />, view: 'admin-security', adminOnly: true },
  { label: 'Audit Log', icon: <FileText className='h-4 w-4' />, view: 'admin-audit', adminOnly: true },
  { label: 'System', icon: <Server className='h-4 w-4' />, view: 'admin-system', adminOnly: true },
]

const personalNavItems: NavItem[] = [
  { label: 'Settings', icon: <Settings className='h-4 w-4' />, view: 'settings' },
  { label: 'Profile', icon: <UserCircle className='h-4 w-4' />, view: 'profile' },
]

function isAdmin(role: string) {
  return ['superadmin', 'orgadmin'].includes(role)
}

function NavContent({ collapsed, onItemClick }: { collapsed: boolean; onItemClick?: () => void }) {
  const { currentView, setCurrentView, user } = useAppStore()
  const admin = user ? isAdmin(user.role) : false

  const handleNav = (view: AppView) => {
    setCurrentView(view)
    onItemClick?.()
  }

  const renderNavItem = (item: NavItem) => {
    const active = currentView === item.view
    if (item.adminOnly && !admin) return null
    const isNew = newBadgeViews.has(item.view)

    return (
      <TooltipProvider key={item.view} delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => handleNav(item.view)}
              aria-label={item.label}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 relative group',
                active
                  ? 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary font-medium shadow-sm'
                  : 'text-muted-foreground hover:bg-gradient-to-r hover:from-primary/8 hover:to-transparent hover:text-foreground hover:shadow-sm hover:pl-4',
                collapsed && 'justify-center px-2'
              )}
            >
              {active && (
                <motion.div
                  layoutId='sidebar-active-indicator'
                  className='absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-primary via-violet-500 to-fuchsia-500'
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{ transformOrigin: 'left' }}
                />
              )}
              <span className={cn(
                'shrink-0 transition-all duration-200',
                active ? 'text-primary drop-shadow-sm' : 'text-muted-foreground group-hover:text-foreground'
              )}>
                {item.icon}
              </span>
              {!collapsed && (
                <span className={cn('truncate transition-all duration-200', active && 'translate-x-0.5')}>
                  {item.label}
                </span>
              )}
              {isNew && !collapsed && (
                <span className='ml-auto flex items-center'>
                  <span className='flex items-center justify-center w-4 h-4 rounded-full bg-orange-500/90 text-white text-[8px] font-bold leading-none'>N</span>
                </span>
              )}
              {isNew && collapsed && (
                <span className='absolute -top-0.5 -right-0.5 flex items-center justify-center w-3 h-3 rounded-full bg-orange-500 border-2 border-card' />
              )}
            </button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side='right' className='font-medium'>
              {item.label}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    )
  }

  const userInitials = user
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  return (
    <div className='flex flex-col h-full'>
      {/* Animated gradient top accent line */}
      <div className='h-[2px] w-full shrink-0 bg-gradient-to-r from-primary via-violet-500 to-transparent animate-[shimmer_3s_ease-in-out_infinite]' />
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 h-16 border-b shrink-0', collapsed && 'justify-center px-2')}>
        <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shrink-0 shadow-md shadow-primary/20 animate-pulse-glow'>
          <Activity className='h-4 w-4 text-white' />
        </div>
        {!collapsed && (
          <div className='flex items-center gap-2'>
            <span className='text-lg font-bold gradient-text tracking-tight'>ALVISION</span>
            <span className='text-[8px] font-bold text-primary/60 bg-primary/10 rounded-md px-1.5 py-0.5 leading-none'>PRO</span>
          </div>
        )}
      </div>

      {/* Nav sections */}
      <ScrollArea className='flex-1 py-4'>
        <div className={cn('px-3 space-y-1', collapsed && 'px-2')}>
          {!collapsed && (
            <p className='px-3 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2'>
              Main
            </p>
          )}
          {mainNavItems.map(renderNavItem)}

          {admin && (
            <>
              {!collapsed && (
                <p className='px-3 pt-6 pb-2 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider'>
                  Administration
                </p>
              )}
              {collapsed && <div className='my-3 border-t' />}
              {adminNavItems.map(renderNavItem)}
            </>
          )}

          {!collapsed && (
            <p className='px-3 pt-6 pb-2 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider'>
              Personal
            </p>
          )}
          {collapsed && <div className='my-3 border-t' />}
          {personalNavItems.map(renderNavItem)}
        </div>
      </ScrollArea>

      {/* User section with gradient avatar ring & status dropdown */}
      <div className='border-t p-3 shrink-0'>
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className={cn('flex items-center gap-3 rounded-xl p-2 hover:bg-muted/80 cursor-pointer transition-all duration-200 group', collapsed && 'justify-center')}>
                <div className='relative shrink-0'>
                  <div className='rounded-full p-[2px] bg-gradient-to-br from-primary/40 via-violet-500/30 to-fuchsia-500/30 group-hover:from-primary/60 group-hover:via-violet-500/50 group-hover:to-fuchsia-500/50 transition-all duration-300'>
                    <Avatar className='h-8 w-8 ring-2 ring-card'>
                      <AvatarFallback className='bg-primary/10 text-primary text-xs font-semibold'>
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  {/* Online status indicator with pulse ring */}
                  <span className='absolute -bottom-0.5 -right-0.5 flex h-3 w-3'>
                    <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50' />
                    <span className='relative inline-flex h-3 w-3 rounded-full bg-emerald-500 border-2 border-card' />
                  </span>
                </div>
                {!collapsed && (
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium truncate'>{user.name}</p>
                    <p className='text-xs text-muted-foreground truncate'>{user.role}</p>
                  </div>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={collapsed ? 'center' : 'start'} className='w-52 rounded-lg'>
              <DropdownMenuLabel className='font-normal'>
                <div className='flex flex-col gap-0.5'>
                  <p className='text-sm font-medium'>{user.name}</p>
                  <p className='text-xs text-muted-foreground'>{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className='text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider py-1'>Status</DropdownMenuLabel>
              <DropdownMenuItem className='gap-2.5 cursor-pointer transition-colors duration-150'>
                <span className='w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0' />
                <span>Online</span>
              </DropdownMenuItem>
              <DropdownMenuItem className='gap-2.5 cursor-pointer transition-colors duration-150'>
                <span className='w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0' />
                <span>Away</span>
              </DropdownMenuItem>
              <DropdownMenuItem className='gap-2.5 cursor-pointer transition-colors duration-150'>
                <span className='w-2.5 h-2.5 rounded-full bg-red-500 shrink-0' />
                <span>Busy</span>
              </DropdownMenuItem>
              <DropdownMenuItem className='gap-2.5 cursor-pointer transition-colors duration-150'>
                <span className='w-2.5 h-2.5 rounded-full bg-zinc-400 shrink-0' />
                <span>Do Not Disturb</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleNav('profile')} className='gap-2 cursor-pointer transition-colors duration-150'>
                <UserCircle className='h-4 w-4' />
                Profile & Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showSoundWave, setShowSoundWave] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const { currentView, setCurrentView, user, clearAuth, setSearchOpen } = useAppStore()

  // Keyboard shortcuts
  useKeyboardShortcuts()
  useEffect(() => {
    const toggleHandler = () => setShortcutsOpen(prev => !prev)
    window.addEventListener('toggle-shortcuts', toggleHandler)
    return () => window.removeEventListener('toggle-shortcuts', toggleHandler)
  }, [])

  // Animate sound-wave on quick start hover
  useEffect(() => {
    const interval = setInterval(() => {
      setShowSoundWave(prev => !prev)
    }, 1500)
    return () => clearInterval(interval)
  }, [])
  const { showOnboarding, setShowOnboarding, completeOnboarding } = useOnboarding()

  const viewBreadcrumbs: Record<string, { label: string; view?: AppView }[]> = useMemo(() => ({
    dashboard: [],
    meetings: [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Meetings' }],
    teams: [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Teams' }],
    chat: [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Chat' }],
    files: [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Files' }],
    recordings: [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Recordings' }],
    'ai-assistant': [{ label: 'Dashboard', view: 'dashboard' }, { label: 'AI Assistant' }],
    knowledge: [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Knowledge Base' }],
    calendar: [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Calendar' }],
    events: [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Events' }],
    'help-center': [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Help Center' }],
    webhooks: [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Webhooks & Automation' }],
    templates: [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Meeting Templates' }],
    notifications: [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Notifications' }],
    'breakout-rooms': [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Breakout Rooms' }],
    participants: [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Participant Management' }],
    'meeting-notes': [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Meeting Notes' }],
    'session-history': [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Session History' }],
    admin: [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Administration' }, { label: 'Admin Overview' }],
    'admin-users': [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Administration', view: 'admin' }, { label: 'User Management' }],
    'admin-orgs': [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Administration', view: 'admin' }, { label: 'Organizations' }],
    'admin-security': [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Administration', view: 'admin' }, { label: 'Security' }],
    'admin-audit': [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Administration', view: 'admin' }, { label: 'Audit Log' }],
    'admin-system': [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Administration', view: 'admin' }, { label: 'System' }],
    settings: [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Settings' }],
    profile: [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Profile' }],
    search: [{ label: 'Dashboard', view: 'dashboard' }, { label: 'Search' }],
  }), [])

  const viewLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    meetings: 'Meetings',
    teams: 'Teams',
    chat: 'Chat',
    files: 'Files',
    recordings: 'Recordings',
    'ai-assistant': 'AI Assistant',
    knowledge: 'Knowledge Base',
    calendar: 'Calendar',
    events: 'Events',
    admin: 'Admin Overview',
    'admin-users': 'User Management',
    'admin-orgs': 'Organizations',
    'admin-security': 'Security',
    'admin-audit': 'Audit Log',
    'admin-system': 'System',
    settings: 'Settings',
    profile: 'Profile',
    search: 'Search',
    'help-center': 'Help Center',
    webhooks: 'Webhooks & Automation',
    templates: 'Meeting Templates',
    notifications: 'Notifications',
    'breakout-rooms': 'Breakout Rooms',
    participants: 'Participant Management',
    'meeting-notes': 'Meeting Notes',
    'session-history': 'Session History',
  }

  const handleSignOut = () => {
    clearAuth()
    setCurrentView('landing')
  }

  const userInitials = user
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  return (
    <>
      <SearchCommand />
      <OnboardingModal
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={completeOnboarding}
      />
      <KeyboardShortcuts open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <div className='h-screen flex bg-background overflow-hidden'>
        {/* Desktop sidebar */}
        <aside
          className={cn(
            'hidden lg:flex flex-col border-r bg-card transition-all duration-300 shrink-0 relative',
            collapsed ? 'w-[68px]' : 'w-[260px]'
          )}
        >
          <NavContent collapsed={collapsed} />
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className='absolute top-20 -right-3 z-10 w-6 h-6 rounded-full border bg-card flex items-center justify-center shadow-sm hover:bg-muted hover:shadow-md transition-all duration-200'
            style={{ left: collapsed ? '52px' : '244px' }}
          >
            {collapsed ? <ChevronRight className='h-3 w-3' /> : <ChevronLeft className='h-3 w-3' />}
          </button>
        </aside>

        {/* Mobile sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side='left' className='w-[280px] p-0'>
            <button
              onClick={() => setMobileOpen(false)}
              className='absolute top-4 right-4 z-10 rounded-sm opacity-70 hover:opacity-100 transition-opacity'
              aria-label='Close sidebar menu'
            >
              <X className='h-4 w-4' />
            </button>
            <NavContent collapsed={false} onItemClick={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <main className='flex-1 flex flex-col min-w-0'>
          {/* Top bar */}
          <header className='h-14 border-b flex items-center justify-between px-4 lg:px-6 shrink-0 bg-card/80 backdrop-blur-sm'>
            {/* Left: mobile menu + search */}
            <div className='flex items-center gap-3 flex-1 min-w-0'>
              <Button
                variant='ghost'
                size='icon'
                className='lg:hidden shrink-0 h-9 w-9 rounded-lg'
                onClick={() => setMobileOpen(true)}
                aria-label='Open menu'
              >
                <Menu className='h-5 w-5' />
              </Button>

              {/* Search bar with Cmd+K hint */}
              <button
                onClick={() => setSearchOpen(true)}
                className='flex items-center gap-2 h-9 px-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted hover:border-border transition-all duration-200 w-full max-w-md group'
              >
                <Search className='h-4 w-4 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors' />
                <span className='text-sm text-muted-foreground/60 group-hover:text-muted-foreground transition-colors truncate'>
                  Search...
                </span>
                <kbd className='ml-auto hidden sm:flex items-center gap-0.5 rounded-md border border-border/60 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60'>
                  <span className='text-xs'>⌘</span>K
                </kbd>
              </button>
            </div>

            {/* Right: actions */}
            <div className='flex items-center gap-2 shrink-0 ml-3'>
              {/* Quick start meeting button with sound-wave animation */}
              <div className='flex items-center gap-1.5'>
                <QuickStartMeeting />
                <div className='flex items-end gap-[2px] h-4' aria-hidden='true'>
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className='w-[3px] rounded-full bg-primary/60'
                      animate={{
                        height: showSoundWave ? [4, 10, 6] : [4, 4, 4],
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: 'easeInOut' as const,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Notification bell */}
              <NotificationDropdown />

              {/* User avatar dropdown */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon' className='h-9 w-9 rounded-lg relative transition-all duration-200 hover:bg-muted'
                      aria-label='User menu'>
                      <div className='relative'>
                        <Avatar className='h-7 w-7'>
                          <AvatarFallback className='bg-primary/10 text-primary text-[11px] font-semibold'>
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                        {/* Online status dot */}
                        <span className='absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-card' />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-48 rounded-lg'>
                    <DropdownMenuLabel className='font-normal'>
                      <div className='flex flex-col gap-0.5'>
                        <p className='text-sm font-medium'>{user.name}</p>
                        <p className='text-xs text-muted-foreground'>{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setCurrentView('profile')} className='transition-colors duration-150 cursor-pointer'>
                      <UserIcon className='mr-2 h-4 w-4' />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrentView('settings')} className='transition-colors duration-150 cursor-pointer'>
                      <Settings className='mr-2 h-4 w-4' />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrentView('help-center')} className='transition-colors duration-150 cursor-pointer'>
                      <HelpCircle className='mr-2 h-4 w-4' />
                      Help
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      variant='destructive'
                      className='transition-colors duration-150 cursor-pointer'
                    >
                      <LogOut className='mr-2 h-4 w-4' />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </header>

          {/* Gradient accent line */}
          <div className='h-0.5 bg-gradient-to-r from-primary/50 to-transparent shrink-0' />

          {/* Breadcrumb navigation */}
          <div className='px-4 lg:px-6 py-2.5 flex items-center gap-1.5 text-sm text-muted-foreground shrink-0'>
            {(viewBreadcrumbs[currentView] || []).map((crumb, i) => (
              <span key={i} className='flex items-center gap-1.5'>
                {i > 0 && <ChevronRight className='w-3.5 h-3.5' />}
                {crumb.view ? (
                  <button
                    onClick={() => setCurrentView(crumb.view!)}
                    className='hover:text-foreground transition-colors'
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className='text-foreground font-medium'>{crumb.label}</span>
                )}
              </span>
            ))}
            {(!viewBreadcrumbs[currentView] || viewBreadcrumbs[currentView].length === 0) && (
              <span className='text-foreground font-medium'>{viewLabels[currentView] || 'Dashboard'}</span>
            )}
          </div>

          {/* Page content with view transition */}
          <div className='flex-1 overflow-y-auto p-4 lg:p-6'>
            <AnimatePresence mode='wait'>
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' as const }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </>
  )
}