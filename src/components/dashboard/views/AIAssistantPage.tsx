'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Bot,
  Send,
  Sparkles,
  FileText,
  Video,
  Lightbulb,
  RefreshCw,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Mic,
  Paperclip,
  MessageSquare,
  Zap,
} from 'lucide-react'

interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  loading?: boolean
  feedback?: 'up' | 'down'
}

const suggestions = [
  { icon: <FileText className='h-4 w-4' />, label: 'Summarize last meeting', prompt: 'Summarize the key points from our last meeting' },
  { icon: <Video className='h-4 w-4' />, label: 'Meeting action items', prompt: 'Extract action items from the meeting recording' },
  { icon: <Lightbulb className='h-4 w-4' />, label: 'Improvement ideas', prompt: 'Suggest improvements for our team meetings' },
  { icon: <Zap className='h-4 w-4' />, label: 'Quick recap', prompt: 'Give me a quick recap of this week\'s activities' },
]

const initialMessages: AIMessage[] = [
  {
    id: 'ai-1',
    role: 'assistant',
    content: 'Hello! I\'m your ALVISION AI Assistant. I can help you with meeting summaries, action items, insights from your conversations, and more. How can I assist you today?',
    timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
  },
]

export default function AIAssistantPage() {
  const { user } = useAppStore()
  const [messages, setMessages] = useState<AIMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages.length])

  const sendMessage = async (text?: string) => {
    const content = text || input.trim()
    if (!content || loading) return

    const userMsg: AIMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const loadingMsg: AIMessage = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      loading: true,
    }
    setMessages(prev => [...prev, loadingMsg])

    try {
      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, context: 'dashboard' }),
      })
      const data = await res.json()
      const reply = data.reply || data.message || 'I apologize, I couldn\'t process your request. Please try again.'
      setMessages(prev => prev.map(m => m.id === loadingMsg.id ? { ...m, content: reply, loading: false } : m))
    } catch {
      setMessages(prev => prev.map(m => m.id === loadingMsg.id ? {
        ...m,
        content: 'I\'m currently unable to connect to my AI backend. Please ensure the AI service is running and try again. In the meantime, I can tell you that ALVISION supports real-time meeting summaries, action item extraction, and intelligent insights powered by advanced language models.',
        loading: false,
      } : m))
    }
    setLoading(false)
  }

  const handleFeedback = (msgId: string, type: 'up' | 'down') => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, feedback: m.feedback === type ? undefined : type } : m))
  }

  return (
    <div className='flex h-[calc(100vh-10rem)] gap-4'>
      {/* Chat area */}
      <div className='flex-1 flex flex-col border rounded-xl bg-card overflow-hidden'>
        {/* Header */}
        <div className='h-14 border-b flex items-center justify-between px-4 shrink-0'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center'>
              <Bot className='h-4 w-4 text-white' />
            </div>
            <div>
              <h3 className='font-semibold text-sm'>AI Assistant</h3>
              <p className='text-[11px] text-emerald-600 flex items-center gap-1'><span className='w-1.5 h-1.5 rounded-full bg-emerald-500' /> Online</p>
            </div>
          </div>
          <Badge variant='outline' className='gap-1 text-[10px]'><Sparkles className='h-3 w-3' /> Powered by AI</Badge>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className='flex-1 overflow-y-auto p-4 space-y-6'>
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <Avatar className='h-8 w-8 shrink-0 mt-0.5'>
                <AvatarFallback className={msg.role === 'assistant' ? 'bg-gradient-to-br from-blue-500 to-violet-600 text-white text-xs' : 'bg-primary/10 text-primary text-xs'}>
                  {msg.role === 'assistant' ? <Bot className='h-4 w-4' /> : user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-muted rounded-tl-sm'
                }`}>
                  {msg.loading ? (
                    <div className='flex items-center gap-2 text-muted-foreground'>
                      <RefreshCw className='h-4 w-4 animate-spin' /> Thinking...
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
                {!msg.loading && msg.role === 'assistant' && (
                  <div className='flex items-center gap-1 mt-1.5'>
                    <span className='text-[10px] text-muted-foreground mr-2'>{msg.timestamp}</span>
                    <button onClick={() => handleFeedback(msg.id, 'up')} className={`p-1 rounded hover:bg-muted transition-colors ${msg.feedback === 'up' ? 'text-green-600' : 'text-muted-foreground/50'}`}><ThumbsUp className='h-3 w-3' /></button>
                    <button onClick={() => handleFeedback(msg.id, 'down')} className={`p-1 rounded hover:bg-muted transition-colors ${msg.feedback === 'down' ? 'text-red-500' : 'text-muted-foreground/50'}`}><ThumbsDown className='h-3 w-3' /></button>
                    <button onClick={() => navigator.clipboard.writeText(msg.content)} className='p-1 rounded hover:bg-muted transition-colors text-muted-foreground/50'><Copy className='h-3 w-3' /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className='border-t p-3'>
          <div className='flex items-center gap-2 bg-muted/50 rounded-xl px-4 py-2.5'>
            <Button variant='ghost' size='icon' className='h-8 w-8 shrink-0'><Paperclip className='h-4 w-4' /></Button>
            <input
              className='flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground'
              placeholder='Ask me anything about your meetings...'
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={loading}
            />
            <Button variant='ghost' size='icon' className='h-8 w-8 shrink-0'><Mic className='h-4 w-4' /></Button>
            <Button size='icon' className='h-8 w-8 shrink-0 rounded-lg' onClick={() => sendMessage()} disabled={!input.trim() || loading}>
              <Send className='h-4 w-4' />
            </Button>
          </div>
          <p className='text-[10px] text-muted-foreground/60 text-center mt-2'>AI may produce inaccurate information. Verify important details.</p>
        </div>
      </div>

      {/* Suggestions sidebar */}
      <div className='hidden xl:block w-72 space-y-4'>
        <Card>
          <CardHeader className='pb-3'><CardTitle className='text-sm'>Quick Actions</CardTitle></CardHeader>
          <CardContent className='space-y-2'>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s.prompt)}
                className='w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors text-left'
              >
                <div className='p-1.5 rounded-md bg-primary/10 text-primary'>{s.icon}</div>
                <span className='text-sm'>{s.label}</span>
              </button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-3'><CardTitle className='text-sm'>Capabilities</CardTitle></CardHeader>
          <CardContent className='space-y-2.5 text-sm text-muted-foreground'>
            <div className='flex items-start gap-2'><Sparkles className='h-4 w-4 text-primary shrink-0 mt-0.5' /><span>Meeting summaries with key decisions</span></div>
            <div className='flex items-start gap-2'><FileText className='h-4 w-4 text-primary shrink-0 mt-0.5' /><span>Action item extraction & tracking</span></div>
            <div className='flex items-start gap-2'><MessageSquare className='h-4 w-4 text-primary shrink-0 mt-0.5' /><span>Conversation insights & patterns</span></div>
            <div className='flex items-start gap-2'><Lightbulb className='h-4 w-4 text-primary shrink-0 mt-0.5' /><span>Meeting improvement suggestions</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
