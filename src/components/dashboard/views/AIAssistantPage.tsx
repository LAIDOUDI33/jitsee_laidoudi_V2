'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
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
  Square,
  Plus,
  VideoIcon,
  Languages,
  ChevronDown,
  ChevronUp,
  ListTodo,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Types ──────────────────────────────────────────────────────────────────────

interface AIMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  loading?: boolean
  streaming?: boolean
  feedback?: 'up' | 'down'
}

interface ConversationListItem {
  id: string
  title: string
  model: string
  updatedAt: string
  messageCount: number
}

interface ActionItemDisplay {
  id: string
  content: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'completed'
  dueDate: string | null
  owner: { id: string; name: string; email?: string } | null
  meetingId: string | null
  createdAt: string
}

// ── Constants ──────────────────────────────────────────────────────────────────

const suggestions = [
  { icon: <FileText className='h-4 w-4' />, label: 'Summarize last meeting', prompt: 'Summarize the key points from our last meeting', color: 'bg-sky-500/10 text-sky-600' },
  { icon: <Video className='h-4 w-4' />, label: 'Extract action items', prompt: 'Extract action items from the meeting recording', color: 'bg-emerald-500/10 text-emerald-600' },
  { icon: <Lightbulb className='h-4 w-4' />, label: 'Improvement ideas', prompt: 'Suggest improvements for our team meetings', color: 'bg-amber-500/10 text-amber-600' },
  { icon: <Zap className='h-4 w-4' />, label: 'Weekly recap', prompt: "Give me a quick recap of this week's activities", color: 'bg-rose-500/10 text-rose-600' },
  { icon: <BarChart3 className='h-4 w-4' />, label: 'Meeting insights', prompt: 'Analyze our meeting patterns and suggest optimizations', color: 'bg-violet-500/10 text-violet-600' },
  { icon: <HelpCircle className='h-4 w-4' />, label: 'Help with ALVISION', prompt: 'How do I use ALVISION features effectively?', color: 'bg-teal-500/10 text-teal-600' },
]

const models = [
  { value: 'alvision-pro', label: 'ALVISION Pro' },
  { value: 'alvision-fast', label: 'ALVISION Fast' },
  { value: 'alvision-creative', label: 'ALVISION Creative' },
]

const WELCOME_MESSAGE: AIMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hello! I'm your ALVISION AI Assistant. I can help you with meeting summaries, action items, insights from your conversations, and more. Try clicking a suggestion below or type your question!",
  timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
}

// ── Priority / status helpers ──────────────────────────────────────────────────

const priorityConfig: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Critical' },
  high: { color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30', label: 'High' },
  medium: { color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Medium' },
  low: { color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800/50', label: 'Low' },
}

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  pending: { color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Pending' },
  in_progress: { color: 'text-teal-600', bg: 'bg-teal-100 dark:bg-teal-900/30', label: 'In Progress' },
  completed: { color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Completed' },
}

const QUICK_PROMPTS = [
  { label: 'Summarize this meeting', endpoint: '/api/v1/ai/summarize', body: { type: 'brief' }, method: 'POST' as const },
  { label: 'Extract action items', endpoint: '/api/v1/ai/smart-action-items', body: {}, method: 'POST' as const, isSmartAction: true },
  { label: 'Key topics discussed', endpoint: '/api/v1/ai/summarize', body: { type: 'key-topics' }, method: 'POST' as const },
  { label: 'Translate last message', endpoint: '', body: {}, method: 'POST' as const, isTranslate: true },
]

// ── Component ──────────────────────────────────────────────────────────────────

export default function AIAssistantPage() {
  const { user, currentMeetingId } = useAppStore()

  // Conversation state
  const [conversations, setConversations] = useState<ConversationListItem[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [conversationsLoading, setConversationsLoading] = useState(false)

  // Chat state
  const [messages, setMessages] = useState<AIMessage[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [model, setModel] = useState('alvision-pro')
  const [streaming, setStreaming] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Meeting context mode
  const [meetingContextMode, setMeetingContextMode] = useState(false)

  // Action items panel
  const [extractedActionItems, setExtractedActionItems] = useState<ActionItemDisplay[]>([])
  const [actionItemsPanelOpen, setActionItemsPanelOpen] = useState(false)
  const [actionItemsLoading, setActionItemsLoading] = useState(false)
  const [translateOpen, setTranslateOpen] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // ── Scroll to bottom on new content ───────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, streaming])

  // ── Load conversations ──────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      setConversationsLoading(true)
      const res = await authFetch('/api/v1/ai/conversations')
      if (res.ok) {
        const data = await res.json()
        if (data.success) setConversations(data.data)
      }
    } catch {
      // silently fail — conversations list is non-critical
    } finally {
      setConversationsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // ── Load messages for a conversation ────────────────────────────────────
  const loadConversationMessages = useCallback(async (convId: string) => {
    try {
      const res = await authFetch(`/api/v1/ai/conversations/${convId}/messages`)
      if (!res.ok) return
      const data = await res.json()
      if (!data.success) return

      const loaded: AIMessage[] = data.data.messages.map((m: { id: string; role: string; content: string; createdAt: string }) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
        timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      }))

      // Update model selector to match the conversation's model
      const convModel = data.data.conversation.model
      const matchedModel = models.find(m => m.value === convModel)
      if (matchedModel) setModel(matchedModel.value)

      setMessages(loaded.length > 0 ? loaded : [WELCOME_MESSAGE])
    } catch {
      // silently fail
    }
  }, [])

  // ── Select a conversation ───────────────────────────────────────────────
  const selectConversation = (convId: string) => {
    setActiveConversationId(convId)
    loadConversationMessages(convId)
  }

  // ── New chat ────────────────────────────────────────────────────────────
  const startNewChat = () => {
    setActiveConversationId(null)
    setMessages([WELCOME_MESSAGE])
  }

  // ── Delete a conversation ───────────────────────────────────────────────
  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await authFetch('/api/v1/ai/conversations', {
        method: 'DELETE',
        body: JSON.stringify({ id: convId }),
      })
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== convId))
        if (activeConversationId === convId) startNewChat()
        toast.success('Conversation deleted')
      }
    } catch {
      toast.error('Failed to delete conversation')
    }
  }

  // ── Stop streaming ─────────────────────────────────────────────────────
  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setStreaming(false)
    setMessages(prev =>
      prev.map(m => (m.streaming ? { ...m, streaming: false, loading: false } : m))
    )
  }

  // ── Handle quick prompt ───────────────────────────────────────────────
  const handleQuickPrompt = async (qp: typeof QUICK_PROMPTS[number]) => {
    if (streaming) return

    // Translate: find last user message and open translate dialog
    if (qp.isTranslate) {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
      if (lastUserMsg) {
        setTranslateOpen(true)
      } else {
        toast.error('No message to translate')
      }
      return
    }

    // Smart action items extraction
    if (qp.isSmartAction) {
      if (!meetingContextMode || !currentMeetingId) {
        toast.error('Enable Meeting Context mode and join a meeting first')
        return
      }
      setActionItemsLoading(true)
      try {
        const res = await authFetch(qp.endpoint, {
          method: 'POST',
          body: JSON.stringify({ meetingId: currentMeetingId }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => null)
          toast.error(err?.error?.message || 'Failed to extract action items')
          setActionItemsLoading(false)
          return
        }
        const data = await res.json()
        if (data.success && data.data?.actionItems?.length > 0) {
          setExtractedActionItems(prev => [...data.data.actionItems, ...prev])
          setActionItemsPanelOpen(true)
          toast.success(`Extracted ${data.data.actionItems.length} action items!`)
        } else {
          toast.info('No action items found in this meeting')
        }
      } catch {
        toast.error('Failed to extract action items')
      } finally {
        setActionItemsLoading(false)
      }
      return
    }

    // Summarize / key-topics
    const meetingId = meetingContextMode ? currentMeetingId : undefined
    const userMsg: AIMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: qp.label,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    }
    setMessages(prev => [...prev, userMsg])

    const assistantMsgId = `ai-${Date.now()}`
    setMessages(prev => [...prev, {
      id: assistantMsgId, role: 'assistant', content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      loading: true, streaming: true,
    }])
    setStreaming(true)

    try {
      const bodyPayload = meetingId ? { ...qp.body, meetingId } : qp.body
      const res = await authFetch(qp.endpoint, {
        method: qp.method,
        body: JSON.stringify(bodyPayload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        setMessages(prev => prev.map(m => m.id === assistantMsgId
          ? { ...m, content: err?.error?.message || 'Request failed.', loading: false, streaming: false }
          : m))
        setStreaming(false)
        return
      }
      const data = await res.json()
      const summary = data.data?.summary || 'No summary generated.'
      setMessages(prev => prev.map(m => m.id === assistantMsgId
        ? { ...m, content: summary, loading: false, streaming: false }
        : m))
      loadConversations()
    } catch {
      setMessages(prev => prev.map(m => m.id === assistantMsgId
        ? { ...m, content: 'Failed to process request.', loading: false, streaming: false }
        : m))
    } finally {
      setStreaming(false)
    }
  }

  // ── Toggle action item status ────────────────────────────────────────
  const toggleActionItemStatus = async (itemId: string) => {
    setExtractedActionItems(prev => prev.map(item => {
      if (item.id !== itemId) return item
      const nextStatus = item.status === 'pending' ? 'in_progress' : item.status === 'in_progress' ? 'completed' : 'pending'
      return { ...item, status: nextStatus as ActionItemDisplay['status'] }
    }))
    try {
      const item = extractedActionItems.find(i => i.id === itemId)
      const nextStatus = item?.status === 'pending' ? 'in_progress' : item?.status === 'in_progress' ? 'completed' : 'pending'
      await authFetch('/api/v1/action-items', {
        method: 'PUT',
        body: JSON.stringify({ id: itemId, status: nextStatus }),
      })
    } catch {
      toast.error('Failed to update status')
    }
  }

  // ── Send message with SSE streaming ────────────────────────────────────
  const sendMessage = async (text?: string) => {
    const content = text || input.trim()
    if (!content || streaming) return

    const userMsg: AIMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setStreaming(true)

    const assistantMsgId = `ai-${Date.now()}`
    const assistantMsg: AIMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      loading: true,
      streaming: true,
    }
    setMessages(prev => [...prev, assistantMsg])

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    // If in meeting context mode, append meeting info to the message
    const enhancedContent = meetingContextMode && currentMeetingId
      ? `[Meeting Context Mode - Meeting ID: ${currentMeetingId}]\n${content}`
      : content

    try {
      const res = await authFetch('/api/v1/ai/chat-stream', {
        method: 'POST',
        body: JSON.stringify({
          message: enhancedContent,
          model,
          conversationId: activeConversationId || undefined,
          meetingId: meetingContextMode ? currentMeetingId : undefined,
        }),
        signal: abortController.signal,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        const errMsg = errData?.error?.message || 'Request failed. Please try again.'
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsgId
              ? { ...m, content: errMsg, loading: false, streaming: false }
              : m
          )
        )
        setStreaming(false)
        abortControllerRef.current = null
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsgId
              ? { ...m, content: 'Failed to read response stream.', loading: false, streaming: false }
              : m
          )
        )
        setStreaming(false)
        abortControllerRef.current = null
        return
      }

      const decoder = new TextDecoder()
      let accumulated = ''
      let receivedConversationId: string | null = null
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6).trim()
          if (!jsonStr) continue

          try {
            const event = JSON.parse(jsonStr)

            if (event.type === 'meta' && event.conversationId) {
              receivedConversationId = event.conversationId
              // If this is a new conversation, set it as active
              if (!activeConversationId) {
                setActiveConversationId(event.conversationId)
              }
            } else if (event.type === 'chunk' && event.content) {
              accumulated += event.content
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMsgId
                    ? { ...m, content: accumulated, loading: false }
                    : m
                )
              )
            } else if (event.type === 'done') {
              // Stream complete
            } else if (event.type === 'error') {
              if (!accumulated) {
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantMsgId
                      ? { ...m, content: event.message || 'An error occurred.', loading: false, streaming: false }
                      : m
                  )
                )
              }
            }
          } catch {
            // Ignore malformed JSON lines
          }
        }
      }

      // Finalize the assistant message
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? { ...m, streaming: false, loading: false }
            : m
        )
      )

      // Refresh conversation list to show the new/updated conversation
      loadConversations()
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User stopped the stream — that's fine
      } else {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: m.content || "I'm currently unable to connect to my AI backend. Please try again.",
                  loading: false,
                  streaming: false,
                }
              : m
          )
        )
      }
    } finally {
      setStreaming(false)
      abortControllerRef.current = null
    }
  }

  // ── Regenerate (re-send last user message) ─────────────────────────────
  const handleRegenerate = (msgId: string, originalContent: string) => {
    // Find the user message before this assistant message
    const msgIndex = messages.findIndex(m => m.id === msgId)
    if (msgIndex <= 0) return

    const prevUserMsg = messages
      .slice(0, msgIndex)
      .reverse()
      .find(m => m.role === 'user')

    if (!prevUserMsg) return

    // Remove the assistant message and re-send
    setMessages(prev => prev.filter(m => m.id !== msgId))
    sendMessage(prevUserMsg.content)
  }

  // ── Feedback ───────────────────────────────────────────────────────────
  const handleFeedback = (msgId: string, type: 'up' | 'down') => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, feedback: m.feedback === type ? undefined : type } : m))
    toast.success(type === 'up' ? 'Thanks for the feedback!' : "We'll improve this response.")
  }

  // ── Copy ───────────────────────────────────────────────────────────────
  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  // ── Format relative date ───────────────────────────────────────────────
  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
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
        {/* ── Sidebar: Conversation History ─────────────────────────────── */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className='shrink-0 overflow-hidden'
            >
              <Card className='h-full border border-border/50 bg-gradient-to-br from-card to-card/80 flex flex-col'>
                <CardHeader className='pb-2 px-3 pt-3'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-xs font-semibold flex items-center gap-1.5'>
                      <History className='h-3 w-3' /> History
                    </CardTitle>
                    <div className='flex items-center gap-1'>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-6 w-6'
                            aria-label='New chat'
                            onClick={startNewChat}
                          >
                            <Plus className='h-3 w-3' />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>New Chat</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='px-2 flex-1 overflow-y-auto space-y-1'>
                  {conversationsLoading && conversations.length === 0 && (
                    <div className='flex items-center justify-center py-8'>
                      <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                    </div>
                  )}
                  {conversations.length === 0 && !conversationsLoading && (
                    <p className='text-[11px] text-muted-foreground text-center py-8'>No conversations yet</p>
                  )}
                  {conversations.map(conv => (
                    <div
                      key={conv.id}
                      className={`group relative flex items-center rounded-lg transition-colors ${
                        activeConversationId === conv.id
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted/50 border border-transparent'
                      }`}
                    >
                      <button
                        className='w-full text-left p-2.5 pr-8 rounded-lg transition-colors'
                        onClick={() => selectConversation(conv.id)}
                      >
                        <p className='text-xs font-medium truncate'>{conv.title}</p>
                        <div className='flex items-center gap-2 mt-0.5'>
                          <p className='text-[10px] text-muted-foreground'>{conv.messageCount} msgs</p>
                          <p className='text-[10px] text-muted-foreground/60'>{formatDate(conv.updatedAt)}</p>
                        </div>
                      </button>
                      <button
                        className='absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all text-muted-foreground'
                        onClick={e => deleteConversation(conv.id, e)}
                        aria-label='Delete conversation'
                      >
                        <Trash2 className='h-3 w-3' />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main Chat Area ──────────────────────────────────────────────── */}
        <div className='flex-1 flex flex-col border rounded-xl bg-gradient-to-br from-card to-card/80 border-border/50 overflow-hidden'>
          {/* Header */}
          <div className='h-14 border-b flex items-center justify-between px-4 shrink-0 bg-card/50 backdrop-blur-sm'>
            <div className='flex items-center gap-3'>
              <div className='w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg animate-glow-ring'>
                <Bot className='h-5 w-5 text-primary-foreground' />
              </div>
              <div>
                <h3 className='font-semibold text-sm flex items-center gap-2'>
                  {meetingContextMode ? 'Meeting Assistant' : 'AI Assistant'}
                  {meetingContextMode && (
                    <Badge variant='outline' className='gap-1 text-[10px] border-teal-500/30 text-teal-600 bg-teal-500/10'>
                      <VideoIcon className='h-3 w-3' /> Live Context
                    </Badge>
                  )}
                </h3>
                <p className='text-[11px] text-emerald-600 flex items-center gap-1'>
                  <span className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse' />{' '}
                  {streaming ? 'Streaming...' : 'Online'}
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              {/* Meeting Context Toggle */}
              {currentMeetingId && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={meetingContextMode ? 'default' : 'outline'}
                      size='sm'
                      className={`gap-1.5 text-xs h-8 ${meetingContextMode ? 'bg-teal-600 hover:bg-teal-500 text-white' : ''}`}
                      onClick={() => setMeetingContextMode(!meetingContextMode)}
                    >
                      <VideoIcon className='h-3.5 w-3.5' />
                      <span className='hidden sm:inline'>Meeting Context</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{meetingContextMode ? 'Disable meeting context' : 'Enable meeting context'}</TooltipContent>
                </Tooltip>
              )}
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className='h-8 w-[140px] text-xs border-border/50'><SelectValue /></SelectTrigger>
                <SelectContent>
                  {models.map(m => (
                    <SelectItem key={m.value} value={m.value} className='text-xs'>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant='outline' className='gap-1 text-[10px] border-primary/20 text-primary bg-primary/5'>
                <Sparkles className='h-3 w-3' /> AI
              </Badge>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className='flex-1 overflow-y-auto p-4 space-y-6 bg-dot-pattern'>
            {/* Show suggestions only on welcome screen */}
            {messages.length <= 1 && messages[0]?.id === 'welcome' && !streaming && (
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
                      disabled={streaming}
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
              msg.role === 'system' ? null : (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' as const }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className='h-8 w-8 shrink-0 mt-0.5'>
                    <AvatarFallback className={msg.role === 'assistant' ? 'bg-gradient-to-br from-primary to-primary/60 text-white text-xs' : 'bg-primary/10 text-primary text-xs'}>
                      {msg.role === 'assistant' ? <Bot className='h-4 w-4' /> : (user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md shadow-primary/20'
                        : 'bg-muted rounded-bl-md shadow-black/5'
                    }`}>
                      {msg.loading && !msg.content ? (
                        <div className='flex items-center gap-1.5 py-0.5'>
                          {[0, 1, 2].map(i => (
                            <motion.div
                              key={i}
                              className='w-2 h-2 rounded-full bg-muted-foreground/50'
                              animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' as const }}
                            />
                          ))}
                        </div>
                      ) : (
                        msg.content
                      )}
                      {/* Cursor for streaming */}
                      {msg.streaming && msg.content && (
                        <span className='inline-block w-2 h-4 bg-primary/70 ml-0.5 animate-pulse rounded-sm' />
                      )}
                    </div>
                    {!msg.loading && !msg.streaming && msg.role === 'assistant' && msg.id !== 'welcome' && (
                      <div className='flex items-center gap-1 mt-1.5'>
                        <span className='text-[10px] text-muted-foreground mr-2'>{msg.timestamp}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => handleCopy(msg.id, msg.content)} className='p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground/50 hover:text-foreground'>
                              {copiedId === msg.id ? <Check className='h-3.5 w-3.5 text-emerald-500' /> : <Copy className='h-3.5 w-3.5' />}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>{copiedId === msg.id ? 'Copied!' : 'Copy'}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => handleRegenerate(msg.id, msg.content)} className='p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground/50 hover:text-foreground'>
                              <RefreshCw className='h-3.5 w-3.5' />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Regenerate</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => handleFeedback(msg.id, 'up')} className={`p-1 rounded-md hover:bg-muted transition-colors ${msg.feedback === 'up' ? 'text-emerald-600' : 'text-muted-foreground/50 hover:text-foreground'}`}>
                              <ThumbsUp className='h-3.5 w-3.5' />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Good response</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => handleFeedback(msg.id, 'down')} className={`p-1 rounded-md hover:bg-muted transition-colors ${msg.feedback === 'down' ? 'text-red-500' : 'text-muted-foreground/50 hover:text-foreground'}`}>
                              <ThumbsDown className='h-3.5 w-3.5' />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Bad response</TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            ))}
          </div>

          {/* Input Area */}
          <div className='border-t p-3 bg-card/50 backdrop-blur-sm'>
            {/* Typing indicator */}
            {streaming && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className='flex items-center gap-2 mb-2 px-2'
              >
                <div className='w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0'>
                  <Bot className='h-3 w-3 text-primary' />
                </div>
                <span className='text-[11px] text-muted-foreground'>AI is streaming...</span>
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
                placeholder={streaming ? 'AI is responding...' : 'Ask me anything about your meetings...'}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                disabled={streaming}
              />
              <Button variant='ghost' size='icon' className='h-8 w-8 shrink-0 hover:scale-110 transition-transform'><Mic className='h-4 w-4' /></Button>
              {streaming ? (
                <Button
                  size='icon'
                  variant='destructive'
                  className='h-8 w-8 shrink-0 rounded-lg hover:scale-110 active:scale-95 transition-transform'
                  onClick={stopStreaming}
                >
                  <Square className='h-4 w-4' />
                </Button>
              ) : (
                <Button
                  size='icon'
                  className='h-8 w-8 shrink-0 rounded-lg bg-gradient-to-r from-primary to-primary/90 hover:scale-110 active:scale-95 transition-transform'
                  onClick={() => sendMessage()}
                  disabled={!input.trim()}
                >
                  <Send className='h-4 w-4' />
                </Button>
              )}
            </div>
            {/* Quick Prompts Row */}
            <div className='flex flex-wrap gap-1.5 mb-2'>
              {QUICK_PROMPTS.map((qp, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleQuickPrompt(qp)}
                  disabled={streaming || (qp.isSmartAction && (!meetingContextMode || !currentMeetingId))}
                  className='flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-border/50 bg-muted/30 hover:bg-muted/60 transition-all disabled:opacity-40 hover:shadow-sm'
                >
                  {qp.isTranslate ? <Languages className='h-3 w-3 text-violet-500' />
                    : qp.isSmartAction ? <ListTodo className='h-3 w-3 text-emerald-500' />
                    : qp.body.type === 'brief' ? <FileText className='h-3 w-3 text-primary' />
                    : <Target className='h-3 w-3 text-amber-500' />}
                  <span>{qp.label}</span>
                  {actionItemsLoading && qp.isSmartAction && <Loader2 className='h-3 w-3 animate-spin' />}
                </motion.button>
              ))}
            </div>
            <p className='text-[10px] text-muted-foreground/60 text-center mt-1'>
              ALVISION {models.find(m => m.value === model)?.label || 'Pro'} · AI may produce inaccurate information.
            </p>
          </div>

          {/* Action Items Panel (collapsible) */}
          <AnimatePresence>
            {actionItemsPanelOpen && extractedActionItems.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className='overflow-hidden border-t'
              >
                <div className='px-4 py-3 bg-card/50 backdrop-blur-sm'>
                  <div className='flex items-center justify-between mb-2'>
                    <div className='flex items-center gap-2'>
                      <ListTodo className='h-4 w-4 text-primary' />
                      <span className='text-sm font-semibold'>Action Items</span>
                      <Badge variant='secondary' className='text-[10px]'>{extractedActionItems.length}</Badge>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Button
                        variant='ghost' size='sm' className='h-6 text-xs gap-1 text-primary hover:text-primary'
                        onClick={() => useAppStore.getState().setCurrentView('action-items')}
                      >
                        View All
                      </Button>
                      <Button variant='ghost' size='icon' className='h-6 w-6' onClick={() => setActionItemsPanelOpen(false)}>
                        <ChevronDown className='h-3.5 w-3.5' />
                      </Button>
                    </div>
                  </div>
                  <div className='space-y-1.5 max-h-48 overflow-y-auto pr-1'>
                    {extractedActionItems.map((item) => {
                      const pConfig = priorityConfig[item.priority] || priorityConfig.medium
                      const sConfig = statusConfig[item.status] || statusConfig.pending
                      return (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className='flex items-start gap-2.5 p-2 rounded-lg border border-border/40 bg-background/50 hover:bg-muted/30 transition-colors group'
                        >
                          <button
                            onClick={() => toggleActionItemStatus(item.id)}
                            className='mt-0.5 shrink-0 transition-transform hover:scale-110'
                            aria-label={`Toggle status for: ${item.content}`}
                          >
                            {item.status === 'completed'
                              ? <CheckCircle2 className='h-4 w-4 text-emerald-500' />
                              : item.status === 'in_progress'
                                ? <Clock className='h-4 w-4 text-teal-500' />
                                : <Circle className='h-4 w-4 text-muted-foreground/50 hover:text-amber-500' />}
                          </button>
                          <div className='flex-1 min-w-0'>
                            <p className={`text-xs leading-relaxed ${item.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{item.content}</p>
                            <div className='flex items-center gap-2 mt-1 flex-wrap'>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${pConfig.bg} ${pConfig.color}`}>{pConfig.label}</span>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${sConfig.bg} ${sConfig.color}`}>{sConfig.label}</span>
                              {item.owner && <span className='text-[10px] text-muted-foreground'>{item.owner.name}</span>}
                              {item.dueDate && <span className='text-[10px] text-muted-foreground flex items-center gap-0.5'><AlertTriangle className='h-2.5 w-2.5' />{new Date(item.dueDate).toLocaleDateString()}</span>}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right Sidebar: Quick Actions & Capabilities ────────────────── */}
        <div className='hidden xl:block w-64 space-y-4 shrink-0'>
          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80'>
            <CardHeader className='pb-3'><CardTitle className='text-sm flex items-center gap-2'><Zap className='h-4 w-4 text-primary' /> Quick Actions</CardTitle></CardHeader>
            <CardContent className='space-y-2'>
              {suggestions.slice(0, 4).map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s.prompt)}
                  className='w-full flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all text-left hover:shadow-sm hover:-translate-y-0.5'
                  disabled={streaming}
                >
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
