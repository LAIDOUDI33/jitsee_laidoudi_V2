'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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
} from 'lucide-react'

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
}

interface Channel {
  id: string
  name: string
  type: 'text' | 'video' | 'announcement'
  unread: number
  lastMessage?: string
  pinned?: boolean
}

const channels: Channel[] = [
  { id: 'c1', name: 'general', type: 'text', unread: 3, lastMessage: 'Sarah: The new build is deployed!', pinned: true },
  { id: 'c2', name: 'engineering', type: 'text', unread: 0, lastMessage: 'Mike: PR ready for review' },
  { id: 'c3', name: 'random', type: 'text', unread: 12, lastMessage: 'Lisa: Check out this article' },
  { id: 'c4', name: 'design', type: 'text', unread: 1, lastMessage: 'Emily: Updated mockups in Figma' },
  { id: 'c5', name: 'announcements', type: 'announcement', unread: 2, lastMessage: 'Alex: Team offsite next Friday', pinned: true },
  { id: 'c6', name: 'standup-notes', type: 'text', unread: 0, lastMessage: 'James: Blocked on auth service' },
]

const messagesByChannel: Record<string, ChatMessage[]> = {
  c1: [
    { id: 'msg1', channelId: 'c1', senderId: 'u6', senderName: 'Alex Turner', content: 'Good morning team! Quick update on the roadmap.', timestamp: '9:02 AM', status: 'read' },
    { id: 'msg2', channelId: 'c1', senderId: 'u1', senderName: 'Sarah Chen', content: 'Morning! The new build is deployed to staging. Can everyone test?', timestamp: '9:15 AM', status: 'read' },
    { id: 'msg3', channelId: 'c1', senderId: 'u2', senderName: 'Mike Johnson', content: 'Testing now. The video quality improvements are noticeable!', timestamp: '9:18 AM', status: 'read' },
    { id: 'msg4', channelId: 'c1', senderId: 'u5', senderName: 'Lisa Park', content: 'Confirmed! The AI summaries are much better too. Great work on the prompt engineering.', timestamp: '9:22 AM', status: 'read' },
    { id: 'msg5', channelId: 'c1', senderId: 'u3', senderName: 'Emily Davis', content: 'The new UI is clean. One small thing - the participant grid could use better spacing on mobile.', timestamp: '9:30 AM', status: 'delivered' },
  ],
  c2: [
    { id: 'msg6', channelId: 'c2', senderId: 'u2', senderName: 'Mike Johnson', content: 'PR ready for review: refactor/auth-service', timestamp: '10:05 AM', status: 'read' },
    { id: 'msg7', channelId: 'c2', senderId: 'u1', senderName: 'Sarah Chen', content: 'Looking at it now. The JWT handling looks clean.', timestamp: '10:12 AM', status: 'read' },
  ],
}

const onlineUsers = ['Sarah Chen', 'Mike Johnson', 'Lisa Park']

export default function ChatPage() {
  const { user } = useAppStore()
  const [activeChannel, setActiveChannel] = useState('c1')
  const [input, setInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [localMessages, setLocalMessages] = useState<Record<string, ChatMessage[]>>(messagesByChannel)
  const scrollRef = useRef<HTMLDivElement>(null)

  const messages = localMessages[activeChannel] || []
  const channel = channels.find(c => c.id === activeChannel)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length])

  const handleSend = () => {
    if (!input.trim()) return
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      channelId: activeChannel,
      senderId: user?.id || 'me',
      senderName: user?.name || 'You',
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      status: 'sent',
    }
    setLocalMessages(prev => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), msg],
    }))
    setInput('')
  }

  const StatusIcon = ({ status }: { status?: string }) => {
    if (status === 'read') return <CheckCheck className='h-3.5 w-3.5 text-blue-500' />
    if (status === 'delivered') return <CheckCheck className='h-3.5 w-3.5 text-muted-foreground' />
    if (status === 'sent') return <Check className='h-3.5 w-3.5 text-muted-foreground' />
    return null
  }

  return (
    <div className='flex h-[calc(100vh-10rem)] border rounded-xl overflow-hidden bg-card'>
      {/* Channel list sidebar */}
      <div className='w-60 border-r flex flex-col shrink-0 hidden md:flex'>
        <div className='p-3 border-b'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='font-semibold text-sm'>Channels</h3>
            <Button variant='ghost' size='icon' className='h-7 w-7'><Plus className='h-4 w-4' /></Button>
          </div>
          <div className='relative'>
            <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground' />
            <Input placeholder='Search channels...' className='pl-8 h-8 text-xs' value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <ScrollArea className='flex-1'>
          <div className='p-2 space-y-0.5'>
            {channels
              .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(c => (
              <button
                key={c.id}
                onClick={() => setActiveChannel(c.id)}
                className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors text-left ${
                  activeChannel === c.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Hash className='h-4 w-4 shrink-0' />
                <span className='flex-1 truncate'>{c.name}</span>
                {c.pinned && <Pin className='h-3 w-3 text-muted-foreground/50 shrink-0' />}
                {c.unread > 0 && (
                  <Badge variant='secondary' className='h-5 min-w-[20px] px-1.5 text-[10px] font-bold shrink-0'>{c.unread}</Badge>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
        {/* Online users */}
        <div className='border-t p-3'>
          <p className='text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2 flex items-center gap-1.5'>
            <Circle className='h-2 w-2 fill-green-500 text-green-500' /> Online — {onlineUsers.length}
          </p>
          <div className='space-y-1'>
            {onlineUsers.map(name => (
              <div key={name} className='flex items-center gap-2 px-1'>
                <div className='w-1.5 h-1.5 rounded-full bg-green-500' />
                <span className='text-xs text-muted-foreground truncate'>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className='flex-1 flex flex-col min-w-0'>
        {/* Chat header */}
        <div className='h-14 border-b flex items-center justify-between px-4 shrink-0'>
          <div className='flex items-center gap-2'>
            <Hash className='h-5 w-5 text-muted-foreground' />
            <h3 className='font-semibold'>{channel?.name || 'general'}</h3>
            <Badge variant='outline' className='text-[10px] capitalize'>{channel?.type || 'text'}</Badge>
          </div>
          <div className='flex items-center gap-1'>
            <Button variant='ghost' size='icon' className='h-8 w-8'><Phone className='h-4 w-4' /></Button>
            <Button variant='ghost' size='icon' className='h-8 w-8'><Users className='h-4 w-4' /></Button>
            <Button variant='ghost' size='icon' className='h-8 w-8'><Pin className='h-4 w-4' /></Button>
            <Button variant='ghost' size='icon' className='h-8 w-8'><MoreVertical className='h-4 w-4' /></Button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className='flex-1 overflow-y-auto p-4 space-y-4'>
          {messages.length === 0 && (
            <div className='text-center py-12 text-muted-foreground'>
              <Hash className='h-10 w-10 mx-auto mb-3 opacity-30' />
              <p className='font-medium'>No messages yet</p>
              <p className='text-sm'>Start the conversation in #{channel?.name}</p>
            </div>
          )}
          {messages.map((msg, i) => {
            const isMe = msg.senderId === (user?.id || 'me')
            const showAvatar = i === 0 || messages[i - 1].senderId !== msg.senderId
            return (
              <div key={msg.id} className={`flex gap-3 group ${showAvatar ? 'mt-4' : ''}`}>
                {showAvatar ? (
                  <Avatar className='h-8 w-8 shrink-0 mt-0.5'>
                    <AvatarFallback className='text-[10px] bg-muted'>
                      {msg.senderName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                ) : <div className='w-8 shrink-0' />}
                <div className='flex-1 min-w-0'>
                  {showAvatar && (
                    <div className='flex items-baseline gap-2 mb-0.5'>
                      <span className='text-sm font-semibold'>{msg.senderName}</span>
                      <span className='text-[11px] text-muted-foreground'>{msg.timestamp}</span>
                    </div>
                  )}
                  <div className='flex items-end gap-2'>
                    <p className='text-sm leading-relaxed'>{msg.content}</p>
                    {isMe && <StatusIcon status={msg.status} />}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Message input */}
        <div className='border-t p-3'>
          <div className='flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2'>
            <Button variant='ghost' size='icon' className='h-7 w-7 shrink-0'><Paperclip className='h-4 w-4' /></Button>
            <Input
              placeholder={`Message #${channel?.name || 'general'}`}
              className='border-0 bg-transparent shadow-none focus-visible:ring-0 h-7 text-sm'
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            />
            <Button variant='ghost' size='icon' className='h-7 w-7 shrink-0'><AtSign className='h-4 w-4' /></Button>
            <Button variant='ghost' size='icon' className='h-7 w-7 shrink-0'><Smile className='h-4 w-4' /></Button>
            <Button size='icon' className='h-7 w-7 shrink-0' onClick={handleSend} disabled={!input.trim()}>
              <Send className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
