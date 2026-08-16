'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { authFetch } from '@/lib/api'
import {
  Bot,
  Send,
  Sparkles,
  FileText,
  Video,
  Lightbulb,
  RefreshCw,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Mic,
  Paperclip,
  MessageSquare,
  Zap,
  History,
  Brain,
  Target,
  BarChart3,
  HelpCircle,
  Trash2,
  Loader2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  loading?: boolean
  feedback?: 'up' | 'down'
}

const suggestions = [
  { icon: <FileText className='h-4 w-4' />, label: 'Summarize last meeting', prompt: 'Summarize the key points from our last meeting', color: 'bg-sky-500/10 text-sky-600' },
  { icon: <Video className='h-4 w-4' />, label: 'Extract action items', prompt: 'Extract action items from the meeting recording', color: 'bg-emerald-500/10 text-emerald-600' },
  { icon: <Lightbulb className='h-4 w-4' />, label: 'Improvement ideas', prompt: 'Suggest improvements for our team meetings', color: 'bg-amber-500/10 text-amber-600' },
  { icon: <Zap className='h-4 w-4' />, label: 'Weekly recap', prompt: "Give me a quick recap of this week's activities", color: 'bg-rose-500/10 text-rose-600' },
  { icon: <BarChart3 className='h-4 w-4' />, label: 'Meeting insights', prompt: 'Analyze our meeting patterns and suggest optimizations', color: 'bg-violet-500/10 text-violet-600' },
  { icon: <HelpCircle className='h-4 w-4' />, label: 'Help with ALVISION', prompt: 'How do I use ALVISION features effectively?', color: 'bg-teal-500/10 text-teal-600' },
]

const conversationHistory = [
  { id: 'h1', title: 'Q4 Strategy Summary', date: 'Jan 12', preview: 'Here are the key decisions from Q4...' },
  { id: 'h2', title: 'Action Items Extract', date: 'Jan 10', preview: 'I found 5 action items from the meeting...' },
  { id: 'h3', title: 'Meeting Tips', date: 'Jan 8', preview: 'Here are 10 tips for better meetings...' },
]

const models = [
  { value: 'alvision-pro', label: 'ALVISION Pro' },
  { value: 'alvision-fast', label: 'ALVISION Fast' },
  { value: 'alvision-creative', label: 'ALVISION Creative' },
]

const initialMessages: AIMessage[] = [
  {
    id: 'ai-1',
    role: 'assistant',
    content: 'Hello! I\'m your ALVISION AI Assistant. I can help you with meeting summaries, action items, insights from your conversations, and more. Try clicking a suggestion below or type your question!',
    timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
  },
]

export default function AIAssistantPage() {
  const { user } = useAppStore()
  const [messages, setMessages] = useState<AIMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [model, setModel] = useState('alvision-pro')
  const [showHistory, setShowHistory] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages.length, loading])

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
      const res = await authFetch('/api/v1/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: content, context: 'dashboard' }),
      })
      const data = await res.json()
      const reply = data.data?.response || data.reply || data.message || 'I apologize, I couldn\'t process your request. Please try again.'
      setMessages(prev => prev.map(m => m.id === loadingMsg.id ? { ...m, content: reply, loading: false } : m))
    } catch {
      setMessages(prev => prev.map(m => m.id === loadingMsg.id ? {
        ...m,
        content: 'I\'m currently unable to connect to my AI backend. Please ensure the AI service is running and try again.',
        loading: false,
      } : m))
    }
    setLoading(false)
  }

  const handleRegenerate = (msgId: string, originalContent: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: '', loading: true } : m))
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: originalContent, loading: false } : m))
    }, 1500)
  }

  const handleFeedback = (msgId: string, type: 'up' | 'down') => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, feedback: m.feedback === type ? undefined : type } : m))
    toast.success(type === 'up' ? 'Thanks for the feedback!' : 'We\'ll improve this response.')
  }

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-end justify-between'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>AI Assistant</h2>
          <p className='text-muted-foreground text-sm mt-1'>Powered by advanced language models for intelligent meeting insights</p>
          <div className='h-1 w-12 rounded-full bg-gradient-to-r from-primary to-primary/50 mt-2' />
        </div>
        <Button
          variant='outline'
          size='sm'
          className='gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform'
          onClick={() => setShowHistory(!showHistory)}
        >
          <History className='h-4 w-4' /> {showHistory ? 'Hide' : 'Show'} History
        </Button>
      </div>

      <div className='flex h-[calc(100vh-14rem)] gap-4'>
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className='shrink-0 overflow-hidden'
            >
              <Card className='h-full border border-border/50 bg-gradient-to-br from-card to-card/80'>
                <CardHeader className='pb-2 px-3 pt-3'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-xs font-semibold flex items-center gap-1.5'><History className='h-3 w-3' /> History</CardTitle>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-6 w-6'
                      aria-label='Clear history'
                      onClick={() => {
                        setMessages(initialMessages)
                        toast.success('Conversation history cleared')
                      }}
                    >
                      <Trash2 className='h-3 w-3' />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className='px-2 space-y-1'>
                  {conversationHistory.map(h => (
                    <button key={h.id} className='w-full text-left p-2.5 rounded-lg hover:bg-muted/50 transition-colors group'>
                      <p className='text-xs font-medium group-hover:text-primary transition-colors truncate'>{h.title}</p>
                      <p className='text-[10px] text-muted-foreground mt-0.5 line-clamp-1'>{h.preview}</p>
                      <p className='text-[10px] text-muted-foreground/60 mt-1'>{h.date}</p>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className='flex-1 flex flex-col border rounded-xl bg-gradient-to-br from-card to-card/80 border-border/50 overflow-hidden'>
          <div className='h-14 border-b flex items-center justify-between px-4 shrink-0 bg-card/50 backdrop-blur-sm'>
            <div className='flex items-center gap-3'>
              <div className='w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg animate-glow-ring'>
                <Bot className='h-5 w-5 text-primary-foreground' />
              </div>
              <div>
                <h3 className='font-semibold text-sm'>AI Assistant</h3>
                <p className='text-[11px] text-emerald-600 flex items-center gap-1'><span className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse' /> Online</p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className='h-8 w-[140px] text-xs border-border/50'><SelectValue /></SelectTrigger>
                <SelectContent>
                  {models.map(m => (
                    <SelectItem key={m.value} value={m.value} className='text-xs'>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant='outline' className='gap-1 text-[10px] border-primary/20 text-primary bg-primary/5'><Sparkles className='h-3 w-3' /> AI</Badge>
            </div>
          </div>

          <div ref={scrollRef} className='flex-1 overflow-y-auto p-4 space-y-6 bg-dot-pattern'>
            {messages.length <= 1 && !loading && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <p className='text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-3'>Suggested Prompts</p>
                <div className='flex flex-wrap gap-2'>
                  {suggestions.map((s, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      onClick={() => sendMessage(s.prompt)}
                      className='relative flex items-center gap-2 px-3 py-2 rounded-xl bg-background hover:bg-muted/50 transition-all hover:shadow-sm hover:shadow-primary/5 hover:-translate-y-0.5 text-sm hover:scale-[1.02] active:scale-[0.98] overflow-hidden disabled:opacity-50'
                      disabled={loading}
                    >
                      <span className='absolute inset-0 rounded-xl p-[1.5px] bg-gradient-to-r from-primary via-emerald-500 to-teal-500 animate-border-gradient opacity-60 group-hover:opacity-100' style={{ WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />
                      <span className={`p-1.5 rounded-lg ${s.color} relative z-10`}>{s.icon}</span>
                      <span className='relative z-10'>{s.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {messages.map(msg => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' as const }} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <Avatar className='h-8 w-8 shrink-0 mt-0.5'>
                  <AvatarFallback className={msg.role === 'assistant' ? 'bg-gradient-to-br from-primary to-primary/60 text-white text-xs' : 'bg-primary/10 text-primary text-xs'}>
                    {msg.role === 'assistant' ? <Bot className='h-4 w-4' /> : (user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md shadow-primary/20' : 'bg-muted rounded-bl-md shadow-black/5'}`}>
                    {msg.loading ? (
                      <div className='flex items-center gap-1.5 py-0.5'>
                        {[0, 1, 2].map(i => (
                          <motion.div key={i} className='w-2 h-2 rounded-full bg-muted-foreground/50' animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' as const }} />
                        ))}
                      </div>
                    ) : msg.content}
                  </div>
                  {!msg.loading && msg.role === 'assistant' && (
                    <div className='flex items-center gap-1 mt-1.5'>
                      <span className='text-[10px] text-muted-foreground mr-2'>{msg.timestamp}</span>
                      <Tooltip><TooltipTrigger asChild><button onClick={() => handleCopy(msg.id, msg.content)} className='p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground/50 hover:text-foreground'>{copiedId === msg.id ? <Check className='h-3.5 w-3.5 text-emerald-500' /> : <Copy className='h-3.5 w-3.5' />}</button></TooltipTrigger><TooltipContent>{copiedId === msg.id ? 'Copied!' : 'Copy'}</TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><button onClick={() => handleRegenerate(msg.id, msg.content)} className='p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground/50 hover:text-foreground'><RefreshCw className='h-3.5 w-3.5' /></button></TooltipTrigger><TooltipContent>Regenerate</TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><button onClick={() => handleFeedback(msg.id, 'up')} className={`p-1 rounded-md hover:bg-muted transition-colors ${msg.feedback === 'up' ? 'text-emerald-600' : 'text-muted-foreground/50 hover:text-foreground'}`}><ThumbsUp className='h-3.5 w-3.5' /></button></TooltipTrigger><TooltipContent>Good response</TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><button onClick={() => handleFeedback(msg.id, 'down')} className={`p-1 rounded-md hover:bg-muted transition-colors ${msg.feedback === 'down' ? 'text-red-500' : 'text-muted-foreground/50 hover:text-foreground'}`}><ThumbsDown className='h-3.5 w-3.5' /></button></TooltipTrigger><TooltipContent>Bad response</TooltipContent></Tooltip>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <div className='border-t p-3 bg-card/50 backdrop-blur-sm'>
            {/* Typing indicator in input area when AI is thinking */}
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className='flex items-center gap-2 mb-2 px-2'
              >
                <div className='w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0'>
                  <Bot className='h-3 w-3 text-primary' />
                </div>
                <span className='text-[11px] text-muted-foreground'>AI is thinking</span>
                <div className='flex items-center gap-[3px]'>
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className='w-1.5 h-1.5 rounded-full bg-primary/60'
                      animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' as const }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
            <div className='flex items-center gap-2 bg-muted/50 rounded-xl px-4 py-2.5 border border-border/50 focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/20 focus-within:shadow-[0_0_0_4px_hsl(var(--primary)/0.06)] transition-all duration-300'>
              <Button variant='ghost' size='icon' className='h-8 w-8 shrink-0 hover:scale-110 transition-transform'><Paperclip className='h-4 w-4' /></Button>
              <input
                className='flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground'
                placeholder={loading ? 'Waiting for AI response...' : 'Ask me anything about your meetings...'}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                disabled={loading}
              />
              <Button variant='ghost' size='icon' className='h-8 w-8 shrink-0 hover:scale-110 transition-transform'><Mic className='h-4 w-4' /></Button>
              <Button size='icon' className='h-8 w-8 shrink-0 rounded-lg bg-gradient-to-r from-primary to-primary/90 hover:scale-110 active:scale-95 transition-transform' onClick={() => sendMessage()} disabled={!input.trim() || loading}>
                {loading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Loader2 className='h-4 w-4' /></motion.div> : <Send className='h-4 w-4' />}
              </Button>
            </div>
            <p className='text-[10px] text-muted-foreground/60 text-center mt-2'>ALVISION {models.find(m => m.value === model)?.label || 'Pro'} · AI may produce inaccurate information.</p>
          </div>
        </div>

        <div className='hidden xl:block w-64 space-y-4 shrink-0'>
          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80'>
            <CardHeader className='pb-3'><CardTitle className='text-sm flex items-center gap-2'><Zap className='h-4 w-4 text-primary' /> Quick Actions</CardTitle></CardHeader>
            <CardContent className='space-y-2'>
              {suggestions.slice(0, 4).map((s, i) => (
                <button key={i} onClick={() => sendMessage(s.prompt)} className='w-full flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all text-left hover:shadow-sm hover:-translate-y-0.5'>
                  <div className={`p-1.5 rounded-lg ${s.color}`}>{s.icon}</div>
                  <span className='text-sm'>{s.label}</span>
                </button>
              ))}
            </CardContent>
          </Card>
          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80'>
            <CardHeader className='pb-3'><CardTitle className='text-sm flex items-center gap-2'><Brain className='h-4 w-4 text-primary' /> Capabilities</CardTitle></CardHeader>
            <CardContent className='space-y-2.5 text-sm text-muted-foreground'>
              <div className='flex items-start gap-2'><Sparkles className='h-4 w-4 text-primary shrink-0 mt-0.5' /><span>Meeting summaries with key decisions</span></div>
              <div className='flex items-start gap-2'><FileText className='h-4 w-4 text-primary shrink-0 mt-0.5' /><span>Action item extraction & tracking</span></div>
              <div className='flex items-start gap-2'><MessageSquare className='h-4 w-4 text-primary shrink-0 mt-0.5' /><span>Conversation insights & patterns</span></div>
              <div className='flex items-start gap-2'><Lightbulb className='h-4 w-4 text-primary shrink-0 mt-0.5' /><span>Meeting improvement suggestions</span></div>
              <div className='flex items-start gap-2'><Target className='h-4 w-4 text-primary shrink-0 mt-0.5' /><span>Goal tracking & progress updates</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
