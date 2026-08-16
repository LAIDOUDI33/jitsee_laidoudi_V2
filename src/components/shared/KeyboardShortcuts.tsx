'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Video, Calendar, MessageSquare, Search, FileText, Brain, Users,
  Settings, User, ChevronLeft, ChevronRight, ArrowLeft, Slash, CircleSlash,
  Mic, Monitor, Pen, BarChart3, BookOpen, Bell, Bot
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAppStore } from '@/store/app-store'

const SHORTCUT_GROUPS = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['⌘', 'K'], label: 'Open Command Palette', icon: <Search className='h-4 w-4' />, action: 'Opens global search and command palette' },
      { keys: ['⌘', '.'], label: 'Toggle Notifications', icon: <Bell className='h-4 w-4' />, action: 'Open notification panel' },
      { keys: ['⌘', ','], label: 'Open Settings', icon: <Settings className='h-4 w-4' />, action: 'Navigate to settings page' },
      { keys: ['Esc'], label: 'Go Back', icon: <ArrowLeft className='h-4 w-4' />, action: 'Navigate to previous view' },
    ],
  },
  {
    title: 'Meetings',
    shortcuts: [
      { keys: ['⌘', 'Shift', 'N'], label: 'New Meeting', icon: <Video className='h-4 w-4' />, action: 'Start an instant meeting' },
      { keys: ['⌘', 'Shift', 'S'], label: 'Schedule Meeting', icon: <Calendar className='h-4 w-4' />, action: 'Open meeting scheduler' },
      { keys: ['⌘', 'Shift', 'C'], label: 'Open Chat', icon: <MessageSquare className='h-4 w-4' />, action: 'Navigate to team chat' },
    ],
  },
  {
    title: 'Meeting Room',
    shortcuts: [
      { keys: ['⌘', 'D'], label: 'Toggle Camera', icon: <Video className='h-4 w-4' />, action: 'Turn camera on/off' },
      { keys: ['⌘', 'M'], label: 'Toggle Microphone', icon: <Mic className='h-4 w-4' />, action: 'Mute/unmute microphone' },
      { keys: ['⌘', 'E'], label: 'Toggle Screen Share', icon: <Monitor className='h-4 w-4' />, action: 'Start/stop screen sharing' },
      { keys: ['⌘', 'W'], label: 'Open Whiteboard', icon: <Pen className='h-4 w-4' />, action: 'Open collaborative whiteboard' },
      { keys: ['⌘', 'I'], label: 'Toggle AI Assistant', icon: <Bot className='h-4 w-4' />, action: 'Open/close AI assistant panel' },
      { keys: ['⌘', 'Shift', 'R'], label: 'Toggle Recording', icon: <Monitor className='h-4 w-4' />, action: 'Start/stop meeting recording' },
      { keys: ['⌘', '\\'], label: 'Toggle Sidebar', icon: <ChevronLeft className='h-4 w-4' />, action: 'Show/hide meeting sidebar' },
    ],
  },
  {
    title: 'Tools',
    shortcuts: [
      { keys: ['⌘', 'B'], label: 'Knowledge Base', icon: <BookOpen className='h-4 w-4' />, action: 'Open knowledge base' },
      { keys: ['⌘', 'A'], label: 'Analytics', icon: <BarChart3 className='h-4 w-4' />, action: 'View analytics dashboard' },
      { keys: ['⌘', 'P'], label: 'Profile', icon: <User className='h-4 w-4' />, action: 'Open your profile' },
      { keys: ['⌘', '/'], label: 'Keyboard Shortcuts', icon: <span className='text-xs font-bold'>⌨</span>, action: 'Show this help panel' },
    ],
  },
]

export function useKeyboardShortcuts() {
  const { setCurrentView, setSearchOpen, setMeetingTitle, setCurrentMeetingId, setSidebarOpen } = useAppStore()
  
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey
      
      // Cmd+K - Command palette
      if (isCmd && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      // Cmd+, - Settings
      else if (isCmd && e.key === ',') {
        e.preventDefault()
        setCurrentView('settings')
      }
      // Cmd+Shift+N - New Meeting
      else if (isCmd && e.shiftKey && e.key === 'N') {
        e.preventDefault()
        setMeetingTitle('New Meeting')
        setCurrentMeetingId('new-' + Date.now())
        setCurrentView('meeting-room')
      }
      // Cmd+/ - Show shortcuts
      else if (isCmd && e.key === '/') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('toggle-shortcuts'))
      }
      // Escape - Go back
      else if (e.key === 'Escape') {
        const store = useAppStore.getState()
        if (store.searchOpen) {
          store.setSearchOpen(false)
        }
      }
    }
    
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setCurrentView, setSearchOpen, setMeetingTitle, setCurrentMeetingId, setSidebarOpen])
}

export default function KeyboardShortcuts({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [searchQuery, setSearchQuery] = useState('')
  
  const filteredGroups = SHORTCUT_GROUPS.map(group => ({
    ...group,
    shortcuts: group.shortcuts.filter(s => 
      s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.action.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(g => g.shortcuts.length > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[80vh] overflow-hidden p-0'>
        <DialogHeader className='p-6 pb-0'>
          <DialogTitle className='flex items-center gap-2 text-lg'>
            <span className='w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-amber-500/20'>⌨</span>
            Keyboard Shortcuts
          </DialogTitle>
          <div className='relative mt-3'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <input
              type='text'
              placeholder='Search shortcuts...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all'
              autoFocus
            />
          </div>
        </DialogHeader>
        <div className='p-6 overflow-y-auto' style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(155,155,155,0.3) transparent' }}>
          <div className='space-y-6'>
            {filteredGroups.map((group) => (
              <div key={group.title}>
                <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3'>{group.title}</h3>
                <div className='space-y-1'>
                  {group.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.label}
                      className='flex items-center gap-4 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group'
                    >
                      <div className='w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors shrink-0'>
                        {shortcut.icon}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium'>{shortcut.label}</p>
                        <p className='text-xs text-muted-foreground truncate'>{shortcut.action}</p>
                      </div>
                      <div className='flex items-center gap-1 shrink-0'>
                        {shortcut.keys.map((key, i) => (
                          <span key={i}>
                            {i > 0 && <span className='text-xs text-muted-foreground mx-0.5'>+</span>}
                            <kbd className='inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-md border border-border/80 bg-background shadow-sm text-xs font-mono font-medium text-foreground'>
                              {key}
                            </kbd>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className='px-6 pb-4 pt-2 border-t'>
          <p className='text-xs text-muted-foreground text-center'>
            Press <kbd className='inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded border border-border bg-background shadow-sm text-[10px] font-mono mx-1'>⌘</kbd>+<kbd className='inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded border border-border bg-background shadow-sm text-[10px] font-mono mx-1'>/</kbd> to toggle this panel
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}