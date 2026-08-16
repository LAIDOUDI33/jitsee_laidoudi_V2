'use client'

import { useEffect, useCallback } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { useAppStore, AppView } from '@/store/app-store'
import {
  LayoutDashboard,
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
  UserPlus,
  CalendarPlus,
  CircleDot,
  Clock,
  type LucideIcon,
} from 'lucide-react'

interface SearchItem {
  label: string
  view: AppView
  icon: LucideIcon
  shortcut?: string
}

const quickActions: SearchItem[] = [
  { label: 'New Meeting', view: 'meetings', icon: Video, shortcut: '⌘N' },
  { label: 'Join Meeting', view: 'meeting-room', icon: UserPlus, shortcut: '⌘J' },
  { label: 'Schedule Meeting', view: 'calendar', icon: CalendarPlus, shortcut: '⌘S' },
  { label: 'Start Recording', view: 'recordings', icon: CircleDot },
]

const pages: SearchItem[] = [
  { label: 'Dashboard', view: 'dashboard', icon: LayoutDashboard },
  { label: 'Meetings', view: 'meetings', icon: Video },
  { label: 'Teams', view: 'teams', icon: Users },
  { label: 'Chat', view: 'chat', icon: MessageSquare },
  { label: 'Files', view: 'files', icon: FolderOpen },
  { label: 'Recordings', view: 'recordings', icon: Film },
  { label: 'AI Assistant', view: 'ai-assistant', icon: Bot },
  { label: 'Knowledge Base', view: 'knowledge', icon: BookOpen },
  { label: 'Calendar', view: 'calendar', icon: CalendarDays },
  { label: 'Events', view: 'events', icon: CalendarHeart },
  { label: 'Settings', view: 'settings', icon: Settings },
]

const recentItems: SearchItem[] = [
  { label: 'Sprint Planning', view: 'meetings', icon: Video },
  { label: 'Engineering Team', view: 'teams', icon: Users },
  { label: 'Q4 Review Recording', view: 'recordings', icon: Film },
]

export default function SearchCommand() {
  const { searchOpen, setSearchOpen, setCurrentView } = useAppStore()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(!searchOpen)
      }
    },
    [searchOpen, setSearchOpen]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleSelect = (view: AppView) => {
    setCurrentView(view)
    setSearchOpen(false)
  }

  return (
    <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
      <CommandInput placeholder='Search pages, actions, and recent items...' />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading='Quick Actions'>
          {quickActions.map((item) => (
            <CommandItem
              key={item.label}
              onSelect={() => handleSelect(item.view)}
              className='transition-colors duration-150 cursor-pointer'
            >
              <item.icon className='h-4 w-4 text-muted-foreground' />
              <span>{item.label}</span>
              {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading='Pages'>
          {pages.map((item) => (
            <CommandItem
              key={item.label}
              onSelect={() => handleSelect(item.view)}
              className='transition-colors duration-150 cursor-pointer'
            >
              <item.icon className='h-4 w-4 text-muted-foreground' />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading='Recent'>
          {recentItems.map((item) => (
            <CommandItem
              key={item.label}
              onSelect={() => handleSelect(item.view)}
              className='transition-colors duration-150 cursor-pointer'
            >
              <Clock className='h-4 w-4 text-muted-foreground mr-1' />
              <item.icon className='h-4 w-4 text-muted-foreground' />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
