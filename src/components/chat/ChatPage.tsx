'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import {
  Hash,
  Search,
  Send,
  Paperclip,
  Smile,
  AtSign,
  Phone,
  Pin,
  Users,
  Plus,
  MoreVertical,
  Check,
  CheckCheck,
  Circle,
  ChevronDown,
  ChevronRight,
  PanelRightOpen,
  PanelRightClose,
  Sparkles,
  Megaphone,
  Wifi,
  WifiOff,
  Loader2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChat } from '@/hooks/useChat'

interface ChatMessage {
  id: string
  channelId: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
  avatar?: string
  status?: 'sent' | 'delivered' | 'read'
  isBot?: boolean
  reactions?: Record<string, number>
}

interface Channel {
  id: string
  name: string
  type: 'text' | 'video' | 'announcement'
  unread: number
  lastMessage?: string
  pinned?: boolean
  category?: string
}

const channels: Channel[] = [
  { id: 'c5', name: 'announcements', type: 'announcement', unread: 2, lastMessage: 'Alex: Team offsite next Friday', pinned: true, category: 'General' },
  { id: 'c1', name: 'general', type: 'text', unread: 3, lastMessage: 'Sarah: The new build is deployed!', pinned: true, category: 'General' },
  { id: 'c3', name: 'random', type: 'text', unread: 12, lastMessage: 'Lisa: Check out this article', category: 'General' },
  { id: 'c2', name: 'engineering', type: 'text', unread: 0, lastMessage: 'Mike: PR ready for review', category: 'Projects' },
  { id: 'c4', name: 'design', type: 'text', unread: 1, lastMessage: 'Emily: Updated mockups in Figma', category: 'Projects' },
  { id: 'c6', name: 'standup-notes', type: 'text', unread: 0, lastMessage: 'James: Blocked on auth service', category: 'Projects' },
]

const messagesByChannel: Record<string, ChatMessage[]> = {
  c1: [
    { id: 'msg1', channelId: 'c1', senderId: 'u6', senderName: 'Alex Turner', content: 'Good morning team! Quick update on the roadmap.', timestamp: '9:02 AM', status: 'read', reactions: { '👍': 2 } },
    { id: 'msg2', channelId: 'c1', senderId: 'u1', senderName: 'Sarah Chen', content: 'Morning! The new build is deployed to staging. Can everyone test?', timestamp: '9:15 AM', status: 'read', reactions: { '🚀': 3 } },
    { id: 'msg3', channelId: 'c1', senderId: 'u2', senderName: 'Mike Johnson', content: 'Testing now. The video quality improvements are noticeable!', timestamp: '9:18 AM', status: 'read' },
    { id: 'msg4', channelId: 'c1', senderId: 'u5', senderName: 'Lisa Park', content: 'Confirmed! The AI summaries are much better too. Great work on the prompt engineering.', timestamp: '9:22 AM', status: 'read', reactions: { '❤️': 1, '🔥': 2 } },
    { id: 'msg5', channelId: 'c1', senderId: 'u3', senderName: 'Emily Davis', content: 'The new UI is clean. One small thing - the participant grid could use better spacing on mobile.', timestamp: '9:30 AM', status: 'delivered' },
  ],
  c2: [
    { id: 'msg6', channelId: 'c2', senderId: 'u2', senderName: 'Mike Johnson', content: 'PR ready for review: refactor/auth-service', timestamp: '10:05 AM', status: 'read' },
    { id: 'msg7', channelId: 'c2', senderId: 'u1', senderName: 'Sarah Chen', content: 'Looking at it now. The JWT handling looks clean.', timestamp: '10:12 AM', status: 'read' },
  ],
}

const onlineUsers = [
  { name: 'Sarah Chen', status: 'active' },
  { name: 'Mike Johnson', status: 'active' },
  { name: 'Lisa Park', status: 'idle' },
  { name: 'Emily Davis', status: 'active' },
  { name: 'Alex Turner', status: 'idle' },
]

const typingUsers = ['Sarah Chen']

const reactionEmojis = ['👍', '❤️', '😂', '🚀', '🔥', '👀']

const categoryIcons: Record<string, React.ReactNode> = {
  General: <Hash className='h-3.5 w-3.5' />,
  Projects: <Sparkles className='h-3.5 w-3.5' />,
}

function ConnectionIndicator({ isConnected, isConnecting, isReconnecting }: { isConnected: boolean; isConnecting: boolean; isReconnecting: boolean }) {
  if (isConnected) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className='flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400'>
            <Wifi className='h-3 w-3' />
            <span className='hidden lg:inline'>Live</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>Connected to real-time chat</TooltipContent>
      </Tooltip>
    )
  }
  if (isConnecting || isReconnecting) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className='flex items-center gap-1.5 text-[11px] text-amber-500'>
            <Loader2 className='h-3 w-3 animate-spin' />
            <span className='hidden lg:inline'>{isReconnecting ? 'Reconnecting' : 'Connecting'}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>{isReconnecting ? 'Reconnecting to chat service...' : 'Connecting to chat service...'}</TooltipContent>
      </Tooltip>
    )
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className='flex items-center gap-1.5 text-[11px] text-muted-foreground'>
          <WifiOff className='h-3 w-3' />
          <span className='hidden lg:inline'>Offline</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>Chat service unavailable — using local mode</TooltipContent>
    </Tooltip>
  )
}

function StatusIcon({ status }: { status?: string }) {
  if (status === 'read') return <CheckCheck className='h-3.5 w-3.5 text-primary' />
  if (status === 'delivered') return <CheckCheck className='h-3.5 w-3.5 text-muted-foreground' />
  if (status === 'sent') return <Check className='h-3.5 w-3.5 text-muted-foreground' />
  return null
}

export default function ChatPage() {
  const { user } = useAppStore()
  const [activeChannel, setActiveChannel] = useState('c1')
  const [input, setInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [localMessages, setLocalMessages] = useState<Record<string, ChatMessage[]>>({})
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [showOnlinePanel, setShowOnlinePanel] = useState(true)
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null)
  const [showReactions, setShowReactions] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Real-time chat hook ──────────────────────────────────────────────
  const {
    status: wsStatus,
    messages: wsMessages,
    typingUsers: wsTypingUsers,
    onlineUsers: wsOnlineUsers,
    sendMessage,
    joinChannel,
    setTyping,
  } = useChat({
    userId: user?.id || 'local-user',
    userName: user?.name || 'You',
  })

  const isConnected = wsStatus === 'connected'
  const isReconnecting = wsStatus === 'reconnecting'
  const isConnecting = wsStatus === 'connecting'

  // Merge WS messages with local fallback messages
  const allMessages = useMemo(() => {
    // If WebSocket has messages for this channel, prefer them
    if (isConnected && wsMessages[activeChannel]?.length) {
      return wsMessages[activeChannel]
    }
    // Fall back to local state, then to static demo data
    if (localMessages[activeChannel]?.length) {
      return localMessages[activeChannel]
    }
    return messagesByChannel[activeChannel] || []
  }, [isConnected, wsMessages, localMessages, activeChannel])

  // Online users from WebSocket or fallback
  const effectiveOnlineUsers = useMemo(() => {
    if (isConnected && wsOnlineUsers.length > 0) {
      return wsOnlineUsers.map(u => ({ name: u.userName, status: u.status }))
    }
    return onlineUsers
  }, [isConnected, wsOnlineUsers])

  // Typing users from WebSocket or fallback
  const effectiveTypingUsers = useMemo(() => {
    if (isConnected) {
      return wsTypingUsers[activeChannel] || []
    }
    return typingUsers
  }, [isConnected, wsTypingUsers, activeChannel])

  // Join channel when activeChannel changes
  useEffect(() => {
    if (isConnected) {
      joinChannel(activeChannel)
    }
  }, [activeChannel, isConnected, joinChannel])

  const messages = allMessages
  const channel = channels.find(c => c.id === activeChannel)

  const groupedChannels = useMemo(() => {
    const groups: Record<string, Channel[]> = {}
    channels
      .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .forEach(c => {
        const cat = c.category || 'Other'
        if (!groups[cat]) groups[cat] = []
        groups[cat].push(c)
      })
    return groups
  }, [searchQuery])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length])

  const handleSend = useCallback(async () => {
    if (!input.trim()) return
    const trimmed = input.trim()
    setInput('')

    const msgData = {
      id: `msg-${Date.now()}`,
      senderId: user?.id || 'me',
      senderName: user?.name || 'You',
      content: trimmed,
      avatar: user?.avatar || undefined,
    }

    if (isConnected) {
      // Send via WebSocket
      sendMessage(activeChannel, msgData)
      // Clear typing
      setTyping(activeChannel, false)
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    } else {
      // Fallback: HTTP API + local state
      const msg: ChatMessage = {
        ...msgData,
        channelId: activeChannel,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        status: 'sent',
        reactions: {},
      }
      // Optimistically add to local state
      setLocalMessages(prev => ({
        ...prev,
        [activeChannel]: [...(prev[activeChannel] || []), msg],
      }))
      // Also POST to HTTP API (fire-and-forget)
      try {
        await fetch('/api/v1/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelId: activeChannel, ...msgData }),
        })
      } catch {
        // silent fallback — message already shown locally
      }
    }
  }, [input, activeChannel, user, isConnected, sendMessage, setTyping])

  const handleReact = (msgId: string, emoji: string) => {
    setLocalMessages(prev => {
      const channelMsgs = prev[activeChannel] || []
      return {
        ...prev,
        [activeChannel]: channelMsgs.map(m => {
          if (m.id !== msgId) return m
          const reactions = { ...(m.reactions || {}) }
          reactions[emoji] = (reactions[emoji] || 0) + 1
          return { ...m, reactions }
        }),
      }
    })
    setShowReactions(null)
  }

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Message copied!')
  }

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  // Typing indicator via WebSocket
  const handleInputChange = useCallback((value: string) => {
    setInput(value)
    if (isConnected) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      setTyping(activeChannel, true)
      typingTimerRef.current = setTimeout(() => {
        setTyping(activeChannel, false)
      }, 3000)
    }
  }, [activeChannel, isConnected, setTyping])

  const unreadCount = channels.reduce((a, c) => a + c.unread, 0)

  return (
    <div className='flex h-[calc(100vh-10rem)] border rounded-xl overflow-hidden bg-gradient-to-br from-card to-card/80 border-border/50'>
      {/* Channel list sidebar */}
      <div className='w-64 border-r flex flex-col shrink-0 hidden md:flex bg-card'>
        {/* Channel header */}
        <div className='p-3 border-b'>
          <div className='flex items-center justify-between mb-3'>
            <div className='flex items-center gap-2'>
              <h3 className='font-semibold text-sm'>Channels</h3>
              {unreadCount > 0 && (
                <Badge variant='secondary' className='h-5 min-w-[20px] px-1.5 text-[10px] font-bold bg-primary/10 text-primary'>{unreadCount}</Badge>
              )}
            </div>
            <Button variant='ghost' size='icon' className='h-7 w-7 hover:scale-105 transition-transform'><Plus className='h-4 w-4' /></Button>
          </div>
          <div className='relative'>
            <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground' />
            <Input placeholder='Search channels...' className='pl-8 h-8 text-xs' value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>
        {/* Channel list with categories */}
        <ScrollArea className='flex-1'>
          <div className='p-2 space-y-1'>
            {Object.entries(groupedChannels).map(([category, chs]) => {
              const isCollapsed = collapsedCategories.has(category)
              const catUnread = chs.reduce((a, c) => a + c.unread, 0)
              return (
                <div key={category}>
                  <button
                    onClick={() => toggleCategory(category)}
                    className='flex items-center gap-1 w-full px-1 py-1.5 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider hover:text-foreground transition-colors'
                  >
                    {isCollapsed ? <ChevronRight className='h-3 w-3' /> : <ChevronDown className='h-3 w-3' />}
                    {categoryIcons[category]}
                    <span className='flex-1 text-left'>{category}</span>
                    {catUnread > 0 && !isCollapsed && (
                      <span className='h-4 min-w-[16px] px-1 text-[10px] font-bold rounded bg-primary/10 text-primary flex items-center justify-center'>{catUnread}</span>
                    )}
                  </button>
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className='overflow-hidden space-y-0.5'
                      >
                        {chs.map(c => (
                          <button
                            key={c.id}
                            onClick={() => setActiveChannel(c.id)}
                            className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-all text-left group ${
                              activeChannel === c.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                          >
                            {c.type === 'announcement' ? <Megaphone className='h-4 w-4 shrink-0 text-amber-500' /> : <Hash className='h-4 w-4 shrink-0' />}
                            <span className='flex-1 truncate'>{c.name}</span>
                            {c.pinned && <Pin className='h-3 w-3 text-muted-foreground/30 shrink-0' />}
                            {c.unread > 0 && (
                              <Badge variant='secondary' className={`h-5 min-w-[20px] px-1.5 text-[10px] font-bold shrink-0 ${activeChannel === c.id ? 'bg-primary text-primary-foreground' : ''}`}>{c.unread}</Badge>
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </ScrollArea>
        {/* Online users footer */}
        <div className='border-t p-3'>
          <p className='text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2 flex items-center gap-1.5'>
            <Circle className='h-2 w-2 fill-emerald-500 text-emerald-500' /> Online — {effectiveOnlineUsers.length}
          </p>
          <div className='space-y-1.5 max-h-32 overflow-y-auto'>
            {effectiveOnlineUsers.map(u => (
              <div key={u.name} className='flex items-center gap-2 px-1 group cursor-pointer hover:bg-muted/50 rounded-md py-0.5 -mx-1 px-1 transition-colors'>
                <div className='relative'>
                  <div className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </div>
                <span className='text-xs text-muted-foreground truncate group-hover:text-foreground transition-colors'>{u.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className='flex-1 flex flex-col min-w-0'>
        {/* Chat header */}
        <div className='h-14 border-b flex items-center justify-between px-4 shrink-0 bg-card/50 backdrop-blur-sm'>
          <div className='flex items-center gap-2.5'>
            {channel?.type === 'announcement' ? <Megaphone className='h-5 w-5 text-amber-500' /> : <Hash className='h-5 w-5 text-muted-foreground' />}
            <div>
              <h3 className='font-semibold text-sm'>{channel?.name || 'general'}</h3>
              <p className='text-[11px] text-muted-foreground'>{channel?.type || 'text'} channel</p>
            </div>
            {channel?.type === 'announcement' && (
              <Badge variant='outline' className='text-[10px] gap-1 border-amber-200 dark:border-amber-800 text-amber-600 bg-amber-500/5'>
                <Megaphone className='h-3 w-3' /> Announcement
              </Badge>
            )}
          </div>
          <div className='flex items-center gap-1'>
            <ConnectionIndicator isConnected={isConnected} isConnecting={isConnecting} isReconnecting={isReconnecting} />
            <Separator orientation='vertical' className='h-5 mx-1' />
            <Button variant='ghost' size='icon' className='h-8 w-8 hover:scale-105 transition-transform'><Phone className='h-4 w-4' /></Button>
            <Button
              variant={showOnlinePanel ? 'secondary' : 'ghost'}
              size='icon'
              className='h-8 w-8 hover:scale-105 transition-transform'
              onClick={() => setShowOnlinePanel(!showOnlinePanel)}
            >
              {showOnlinePanel ? <PanelRightClose className='h-4 w-4' /> : <PanelRightOpen className='h-4 w-4' />}
            </Button>
            <Button variant='ghost' size='icon' className='h-8 w-8 hover:scale-105 transition-transform'><Pin className='h-4 w-4' /></Button>
            <Button variant='ghost' size='icon' className='h-8 w-8 hover:scale-105 transition-transform'><MoreVertical className='h-4 w-4' /></Button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className='flex-1 overflow-y-auto p-4 space-y-1'>
          {messages.length === 0 && (
            <div className='flex flex-col items-center justify-center py-16'>
              <div className='relative'>
                <Hash className='h-16 w-16 text-muted-foreground/20' />
                <div className='absolute inset-0 flex items-center justify-center'>
                  <Hash className='h-8 w-8 text-muted-foreground/40' />
                </div>
              </div>
              <p className='font-medium mt-4'>No messages yet</p>
              <p className='text-sm text-muted-foreground mt-1'>Start the conversation in #{channel?.name}</p>
              <Button variant='outline' className='mt-4 gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={() => document.querySelector<HTMLInputElement>('input[placeholder]')?.focus()}>
                <Send className='h-4 w-4' /> Send First Message
              </Button>
            </div>
          )}
          {messages.map((msg, i) => {
            const isMe = msg.senderId === (user?.id || 'me')
            const showAvatar = i === 0 || messages[i - 1].senderId !== msg.senderId
            return (
              <div
                key={msg.id}
                className={`flex gap-3 group relative ${showAvatar ? 'mt-4' : ''}`}
                onMouseEnter={() => setHoveredMessage(msg.id)}
                onMouseLeave={() => { setHoveredMessage(null); setShowReactions(null) }}
              >
                {showAvatar ? (
                  <Avatar className='h-9 w-9 shrink-0 mt-0.5'>
                    <AvatarFallback className='text-[10px] bg-muted'>
                      {msg.senderName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                ) : <div className='w-9 shrink-0' />}
                <div className='flex-1 min-w-0'>
                  {showAvatar && (
                    <div className='flex items-baseline gap-2 mb-0.5'>
                      <span className='text-sm font-semibold hover:underline cursor-pointer'>{msg.senderName}</span>
                      <span className='text-[11px] text-muted-foreground'>{msg.timestamp}</span>
                    </div>
                  )}
                  <div className='flex items-end gap-2'>
                    <div className={`inline-block rounded-2xl px-3.5 py-2 text-sm leading-relaxed max-w-[85%] ${
                      isMe
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted rounded-bl-md'
                    }`}>
                      {msg.content}
                    </div>
                    {isMe && <StatusIcon status={msg.status} />}
                  </div>
                  {/* Reactions */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className='flex flex-wrap gap-1 mt-1.5'>
                      {Object.entries(msg.reactions).map(([emoji, count]) => (
                        <button
                          key={emoji}
                          onClick={() => handleReact(msg.id, emoji)}
                          className='flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-border/50 bg-background text-xs hover:bg-muted transition-colors hover:scale-105 active:scale-[0.98] transition-transform'
                        >
                          <span>{emoji}</span>
                          <span className='text-muted-foreground'>{count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Hover actions */}
                  {hoveredMessage === msg.id && !isMe && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className='absolute -top-3 right-0 flex items-center gap-0.5 bg-background border border-border/50 rounded-lg shadow-sm p-0.5 z-10'
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className='p-1 hover:bg-muted rounded transition-colors'
                            onClick={() => setShowReactions(showReactions === msg.id ? null : msg.id)}
                          >
                            <Smile className='h-3.5 w-3.5 text-muted-foreground' />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>React</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className='p-1 hover:bg-muted rounded transition-colors' onClick={() => handleCopyMessage(msg.content)}>
                            <CheckCheck className='h-3.5 w-3.5 text-muted-foreground' />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Copy</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className='p-1 hover:bg-muted rounded transition-colors'>
                            <MoreVertical className='h-3.5 w-3.5 text-muted-foreground' />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>More</TooltipContent>
                      </Tooltip>
                    </motion.div>
                  )}
                  {/* Reaction picker */}
                  <AnimatePresence>
                    {showReactions === msg.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className='flex items-center gap-1 mt-1.5 p-1 bg-background border border-border/50 rounded-lg shadow-lg w-fit'
                      >
                        {reactionEmojis.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleReact(msg.id, emoji)}
                            className='w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted transition-all hover:scale-125 text-lg'
                          >{emoji}</button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )
          })}
          {/* Typing indicator */}
          {effectiveTypingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className='flex items-center gap-2 mt-3 text-xs text-muted-foreground'
            >
              <div className='flex items-center gap-1'>
                {effectiveTypingUsers.map(name => (
                  <span key={name} className='font-medium text-foreground'>{name}</span>
                )).reduce((prev, curr, i) => (
                  <span key={i}>{prev}{i > 0 && <span className='text-muted-foreground'>, </span>}{curr}</span>
                ))}
                <span>is typing</span>
              </div>
              <div className='flex gap-0.5'>
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className='w-1.5 h-1.5 rounded-full bg-primary'
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Message input */}
        <div className='border-t p-3 bg-card/50 backdrop-blur-sm'>
          <div className='flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2 border border-border/50 focus-within:border-primary/30 transition-colors'>
            <Button variant='ghost' size='icon' className='h-7 w-7 shrink-0 hover:scale-110 transition-transform'><Paperclip className='h-4 w-4' /></Button>
            <Input
              placeholder={`Message #${channel?.name || 'general'}`}
              className='border-0 bg-transparent shadow-none focus-visible:ring-0 h-7 text-sm'
              value={input}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            />
            <Button variant='ghost' size='icon' className='h-7 w-7 shrink-0 hover:scale-110 transition-transform'><AtSign className='h-4 w-4' /></Button>
            <Button variant='ghost' size='icon' className='h-7 w-7 shrink-0 hover:scale-110 transition-transform'><Smile className='h-4 w-4' /></Button>
            <Button size='icon' className='h-7 w-7 shrink-0 rounded-lg bg-gradient-to-r from-primary to-primary/90 hover:scale-110 active:scale-95 transition-transform' onClick={handleSend} disabled={!input.trim()}>
              <Send className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>

      {/* Online users panel (right) */}
      <AnimatePresence>
        {showOnlinePanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className='border-l flex flex-col shrink-0 overflow-hidden bg-card'
          >
            <div className='p-3 border-b'>
              <h4 className='font-semibold text-sm flex items-center gap-2'>
                <Users className='h-4 w-4' />
                Members
              </h4>
            </div>
            <ScrollArea className='flex-1'>
              <div className='p-2 space-y-1'>
                <p className='text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-1 mb-1'>
                  Online — {effectiveOnlineUsers.filter(u => u.status === 'active').length}
                </p>
                {effectiveOnlineUsers.filter(u => u.status === 'active').map(u => (
                  <div key={u.name} className='flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer'>
                    <div className='relative'>
                      <Avatar className='h-7 w-7'>
                        <AvatarFallback className='text-[9px] bg-muted'>{u.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className='absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card' />
                    </div>
                    <span className='text-xs font-medium truncate'>{u.name}</span>
                  </div>
                ))}
                <p className='text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-1 mt-3 mb-1'>
                  Idle — {effectiveOnlineUsers.filter(u => u.status === 'idle').length}
                </p>
                {effectiveOnlineUsers.filter(u => u.status === 'idle').map(u => (
                  <div key={u.name} className='flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer opacity-60'>
                    <div className='relative'>
                      <Avatar className='h-7 w-7'>
                        <AvatarFallback className='text-[9px] bg-muted'>{u.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className='absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-card' />
                    </div>
                    <span className='text-xs font-medium truncate'>{u.name}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
