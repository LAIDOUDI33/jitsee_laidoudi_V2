'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading,
  Copy,
  Check,
  Plus,
  Calendar,
  Flag,
  Clock,
  Save,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { authFetch } from '@/lib/api'

// ── Types ──────────────────────────────────────────────────────────────────

interface TranscriptEntry {
  id: string
  speaker: string
  initials: string
  color: string
  time: string
  text: string
}

interface ActionItem {
  id: string
  text: string
  assignee: string
  assigneeInitials: string
  assigneeColor: string
  dueDate: string
  priority: 'high' | 'medium' | 'low'
  done: boolean
}

// ── Fallback data (standalone mode when no meetingId) ─────────────────────

const fallbackTranscript: TranscriptEntry[] = [
  { id: 't1', speaker: 'Sarah Chen', initials: 'SC', color: 'bg-emerald-500', time: '00:00:15', text: 'Good morning everyone. Let\'s start with the sprint review. We had a productive two weeks.' },
  { id: 't2', speaker: 'Mike Johnson', initials: 'MJ', color: 'bg-violet-500', time: '00:00:42', text: 'I\'ll walk through the product metrics first. User engagement is up 23% since the last release.' },
  { id: 't3', speaker: 'Sarah Chen', initials: 'SC', color: 'bg-emerald-500', time: '00:01:18', text: 'That\'s great. Can you share the breakdown by feature area?' },
  { id: 't4', speaker: 'Mike Johnson', initials: 'MJ', color: 'bg-violet-500', time: '00:01:35', text: 'Sure. The AI transcription feature drove 40% of the growth. Meeting scheduling improvements accounted for another 35%.' },
  { id: 't5', speaker: 'Emily Davis', initials: 'ED', color: 'bg-amber-500', time: '00:02:10', text: 'From the design side, we completed the new dashboard analytics layout. User testing showed a 15% improvement in task completion time.' },
  { id: 't6', speaker: 'Alex Turner', initials: 'AT', color: 'bg-sky-500', time: '00:02:48', text: 'On the engineering front, we shipped the real-time collaboration engine. It\'s handling 500+ concurrent users in staging.' },
  { id: 't7', speaker: 'Sarah Chen', initials: 'SC', color: 'bg-emerald-500', time: '00:03:15', text: 'Excellent work, Alex. Any performance bottlenecks we should be aware of?' },
  { id: 't8', speaker: 'Alex Turner', initials: 'AT', color: 'bg-sky-500', time: '00:03:30', text: 'We noticed some WebSocket reconnection delays under high latency. I\'ve created a ticket to optimize the backoff strategy.' },
  { id: 't9', speaker: 'Lisa Park', initials: 'LP', color: 'bg-rose-500', time: '00:04:05', text: 'Marketing has prepared the launch materials. We\'re targeting a blog post and social media campaign for next Monday.' },
  { id: 't10', speaker: 'Mike Johnson', initials: 'MJ', color: 'bg-violet-500', time: '00:04:32', text: 'Perfect. Let\'s also coordinate with sales for the enterprise demo scheduled on Thursday.' },
  { id: 't11', speaker: 'Sarah Chen', initials: 'SC', color: 'bg-emerald-500', time: '00:05:01', text: 'Agreed. I\'ll send the meeting invite. Any blockers or risks before we wrap up?' },
  { id: 't12', speaker: 'Emily Davis', initials: 'ED', color: 'bg-amber-500', time: '00:05:20', text: 'The only concern is the mobile responsive issues on the calendar view. It\'s in the backlog for next sprint.' },
]

const fallbackActionItems: ActionItem[] = [
  { id: 'a1', text: 'Optimize WebSocket reconnection backoff strategy', assignee: 'Alex Turner', assigneeInitials: 'AT', assigneeColor: 'bg-sky-500', dueDate: 'Jan 20', priority: 'high', done: false },
  { id: 'a2', text: 'Prepare enterprise demo environment for Thursday', assignee: 'Mike Johnson', assigneeInitials: 'MJ', assigneeColor: 'bg-violet-500', dueDate: 'Jan 18', priority: 'high', done: false },
  { id: 'a3', text: 'Draft and schedule launch blog post', assignee: 'Lisa Park', assigneeInitials: 'LP', assigneeColor: 'bg-rose-500', dueDate: 'Jan 22', priority: 'medium', done: false },
  { id: 'a4', text: 'Fix mobile responsive issues on calendar view', assignee: 'Emily Davis', assigneeInitials: 'ED', assigneeColor: 'bg-amber-500', dueDate: 'Jan 27', priority: 'medium', done: false },
  { id: 'a5', text: 'Send Q1 planning meeting invite to all leads', assignee: 'Sarah Chen', assigneeInitials: 'SC', assigneeColor: 'bg-emerald-500', dueDate: 'Jan 17', priority: 'low', done: true },
]

// ── Priority Config ────────────────────────────────────────────────────────

const priorityConfig = {
  high: { label: 'High', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800', dot: 'bg-red-500' },
  medium: { label: 'Medium', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
  low: { label: 'Low', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
}

// ── Tab Content Transitions ───────────────────────────────────────────────

const tabContentVariants = {
  enter: { opacity: 0, x: 10 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
}

// ── Main Component ─────────────────────────────────────────────────────────

interface MeetingNotesEditorProps {
  meetingId?: string
}

export default function MeetingNotesEditor({ meetingId }: MeetingNotesEditorProps) {
  const isApiMode = !!meetingId

  const [title, setTitle] = useState(isApiMode ? '' : 'Q4 Sprint Review & Planning')
  const [activeTab, setActiveTab] = useState('notes')
  const [notesHtml, setNotesHtml] = useState(
    isApiMode
      ? ''
      : '<p>Key discussion points from today\'s sprint review:</p><ul><li>User engagement increased by 23% this sprint</li><li>AI transcription feature is the top growth driver</li><li>Real-time collaboration engine shipped successfully</li><li>Mobile calendar responsive issues flagged for next sprint</li></ul><p><b>Next Steps:</b></p><p>Coordinate enterprise demo and launch materials for next week.</p>'
  )
  const editorRef = useRef<HTMLDivElement>(null)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved')
  const [copied, setCopied] = useState(false)
  const [actionItems, setActionItems] = useState<ActionItem[]>(isApiMode ? [] : fallbackActionItems)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>(isApiMode ? [] : fallbackTranscript)
  const [loading, setLoading] = useState(isApiMode)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSavingNotesRef = useRef(false)

  // ── Fetch notes from API on mount ─────────────────────────────────────

  useEffect(() => {
    if (!meetingId) return

    let cancelled = false

    async function fetchNotes() {
      try {
        const res = await authFetch(`/api/v1/meeting-notes?meetingId=${meetingId}`)
        if (!res.ok) {
          const err = await res.json().catch(() => null)
          toast.error(err?.error?.message || 'Failed to load meeting notes')
          return
        }
        const json = await res.json()
        if (cancelled || !json.success) return

        const data = json.data
        if (data.title) setTitle(data.title)
        if (data.content) setNotesHtml(data.content)
        if (Array.isArray(data.transcript) && data.transcript.length > 0) {
          setTranscript(data.transcript)
        }
        if (Array.isArray(data.actionItems)) {
          setActionItems(data.actionItems)
        }
      } catch {
        toast.error('Failed to load meeting notes')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchNotes()
    return () => { cancelled = true }
  }, [meetingId])

  // Count words/chars from editor content
  const { wordCount, charCount } = (() => {
    const div = document.createElement('div')
    div.innerHTML = notesHtml
    const text = div.innerText || ''
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    return { wordCount: words, charCount: text.length }
  })()

  // ── Save notes to API ─────────────────────────────────────────────────

  const saveNotesToApi = useCallback(async (html: string, ttl: string) => {
    if (!meetingId || isSavingNotesRef.current) return
    isSavingNotesRef.current = true
    setSaveStatus('saving')
    try {
      const res = await authFetch('/api/v1/meeting-notes', {
        method: 'POST',
        body: JSON.stringify({ meetingId, title: ttl, content: html }),
      })
      if (!res.ok) {
        toast.error('Failed to save notes')
      }
    } catch {
      toast.error('Failed to save notes')
    } finally {
      isSavingNotesRef.current = false
      setSaveStatus('saved')
    }
  }, [meetingId])

  // Auto-save (debounced)
  const triggerAutoSave = useCallback(() => {
    if (!isApiMode) {
      // Standalone mode: simulate save
      setSaveStatus('saving')
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        setSaveStatus('saved')
      }, 1200)
      return
    }

    // API mode: debounce and save
    setSaveStatus('saving')
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      const currentHtml = editorRef.current?.innerHTML || notesHtml
      const currentTitle = title
      saveNotesToApi(currentHtml, currentTitle)
    }, 1500)
  }, [isApiMode, saveNotesToApi, notesHtml, title])

  // Editor commands
  const execFormat = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    const newHtml = editorRef.current?.innerHTML || ''
    setNotesHtml(newHtml)
    triggerAutoSave()
  }, [triggerAutoSave])

  const handleInput = useCallback(() => {
    const newHtml = editorRef.current?.innerHTML || ''
    setNotesHtml(newHtml)
    triggerAutoSave()
  }, [triggerAutoSave])

  // ── Persist title change to API ───────────────────────────────────────

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle)
    if (isApiMode && meetingId) {
      // Debounce title save
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        saveNotesToApi(notesHtml, newTitle)
      }, 1500)
    }
  }, [isApiMode, meetingId, notesHtml, saveNotesToApi])

  // Copy transcript
  const handleCopyTranscript = useCallback(() => {
    const src = transcript
    const text = src
      .map((e) => `[${e.time}] ${e.speaker}: ${e.text}`)
      .join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      toast.success('Transcript copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    })
  }, [transcript])

  // ── Toggle action item ────────────────────────────────────────────────

  const toggleActionItem = useCallback((id: string) => {
    setActionItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    )

    if (isApiMode && meetingId) {
      // Immediately sync to API
      setActionItems((prev) => {
        // We need the updated array, so schedule after state update
        setTimeout(() => {
          // Re-read via a fresh state read approach — use functional update capture
        }, 0)
        return prev
      })
      // Use a microtask to read the updated state
      queueMicrotask(async () => {
        const updated = actionItems.map((item) =>
          item.id === id ? { ...item, done: !item.done } : item
        )
        try {
          await authFetch('/api/v1/meeting-notes', {
            method: 'PUT',
            body: JSON.stringify({ meetingId, actionItems: updated }),
          })
        } catch {
          // Silent — the local state already toggled
        }
      })
    }
  }, [isApiMode, meetingId, actionItems])

  // ── Add action item ──────────────────────────────────────────────────

  const addActionItem = useCallback(() => {
    const newItem: ActionItem = {
      id: `a${Date.now()}`,
      text: 'New action item',
      assignee: 'You',
      assigneeInitials: 'YO',
      assigneeColor: 'bg-slate-500',
      dueDate: 'TBD',
      priority: 'medium',
      done: false,
    }
    setActionItems((prev) => [...prev, newItem])
    toast.success('Action item added')

    if (isApiMode && meetingId) {
      const updatedItems = [...actionItems, newItem]
      setTimeout(async () => {
        try {
          const res = await authFetch('/api/v1/meeting-notes', {
            method: 'PUT',
            body: JSON.stringify({ meetingId, actionItems: updatedItems }),
          })
          if (res.ok) {
            const json = await res.json()
            if (json.success && json.data?.actionItems) {
              setActionItems(json.data.actionItems)
            }
          }
        } catch {
          // Silent
        }
      }, 50)
    }
  }, [isApiMode, meetingId, actionItems])

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  // ── Loading state ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className="px-6 pt-5 pb-3 border-b border-border/50">
          <div className="h-6 w-64 bg-muted animate-pulse rounded" />
        </div>
        <div className="p-6 flex items-center justify-center min-h-[320px]">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Loading notes…
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
      {/* ── Title ─────────────────────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-3 border-b border-border/50">
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full text-lg font-semibold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 focus:ring-0 p-0"
          placeholder="Meeting title..."
        />
      </div>

      {/* ── Tab Bar ───────────────────────────────────────────────────── */}
      <div className="px-6 pt-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-9">
            <TabsTrigger value="notes" className="gap-1.5 text-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
              Notes
            </TabsTrigger>
            <TabsTrigger value="transcript" className="gap-1.5 text-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              Transcript
            </TabsTrigger>
            <TabsTrigger value="actions" className="gap-1.5 text-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Action Items
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs font-medium bg-primary/10 text-primary border-0">
                {actionItems.filter((i) => !i.done).length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* ── Notes Tab ──────────────────────────────────────────────── */}
          <TabsContent value="notes" className="mt-0">
            <AnimatePresence mode="wait">
              <motion.div
                key="notes"
                variants={tabContentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                {/* Toolbar */}
                <div className="flex items-center gap-1 py-2 border-b border-border/50 flex-wrap">
                  <ToolbarButton
                    icon={<Bold className="size-4" />}
                    label="Bold"
                    onClick={() => execFormat('bold')}
                  />
                  <ToolbarButton
                    icon={<Italic className="size-4" />}
                    label="Italic"
                    onClick={() => execFormat('italic')}
                  />
                  <ToolbarButton
                    icon={<Underline className="size-4" />}
                    label="Underline"
                    onClick={() => execFormat('underline')}
                  />
                  <div className="w-px h-5 bg-border mx-1" />
                  <ToolbarButton
                    icon={<List className="size-4" />}
                    label="Bullet List"
                    onClick={() => execFormat('insertUnorderedList')}
                  />
                  <ToolbarButton
                    icon={<ListOrdered className="size-4" />}
                    label="Numbered List"
                    onClick={() => execFormat('insertOrderedList')}
                  />
                  <div className="w-px h-5 bg-border mx-1" />
                  <ToolbarButton
                    icon={<Heading className="size-4" />}
                    label="Heading"
                    onClick={() => execFormat('formatBlock', 'h3')}
                  />
                </div>

                {/* Editor */}
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={handleInput}
                  className="min-h-[320px] max-h-[480px] overflow-y-auto p-4 text-sm leading-relaxed outline-none focus:ring-0 prose prose-sm dark:prose-invert max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-2 [&_li]:mb-1"
                  dangerouslySetInnerHTML={{ __html: notesHtml }}
                />

                {/* Status Bar */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-border/50 text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span>{wordCount} words</span>
                    <span>{charCount} characters</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {saveStatus === 'saving' && (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                        </span>
                        <span>Saving...</span>
                      </>
                    )}
                    {saveStatus === 'saved' && (
                      <>
                        <Save className="size-3 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Saved</span>
                      </>
                    )}
                    {saveStatus === 'idle' && (
                      <span className="text-muted-foreground/60">Ready</span>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* ── Transcript Tab ─────────────────────────────────────────── */}
          <TabsContent value="transcript" className="mt-0">
            <AnimatePresence mode="wait">
              <motion.div
                key="transcript"
                variants={tabContentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">{transcript.length} entries</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={handleCopyTranscript}
                  >
                    {copied ? (
                      <Check className="size-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    {copied ? 'Copied' : 'Copy Transcript'}
                  </Button>
                </div>
                <div className="max-h-[420px] overflow-y-auto">
                  {transcript.length === 0 && (
                    <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                      No transcript entries yet
                    </div>
                  )}
                  {transcript.map((entry, idx) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04, duration: 0.25 }}
                      className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${idx % 2 === 0 ? 'bg-muted/20' : ''}`}
                      onClick={() => toast.info(`Jumping to ${entry.time}`)}
                    >
                      <Avatar className="size-8 shrink-0 mt-0.5">
                        <AvatarFallback className={`${entry.color} text-white text-[10px] font-semibold`}>
                          {entry.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold">{entry.speaker}</span>
                          <button
                            className="text-[11px] text-muted-foreground hover:text-primary transition-colors font-mono tabular-nums flex items-center gap-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              toast.info(`Playing from ${entry.time}`)
                            }}
                          >
                            <Clock className="size-3" />
                            {entry.time}
                          </button>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{entry.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* ── Action Items Tab ───────────────────────────────────────── */}
          <TabsContent value="actions" className="mt-0">
            <AnimatePresence mode="wait">
              <motion.div
                key="actions"
                variants={tabContentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <div className="max-h-[420px] overflow-y-auto">
                  <div className="divide-y divide-border/50">
                    {actionItems.map((item, idx) => {
                      const pri = priorityConfig[item.priority]
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05, duration: 0.25 }}
                          className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/30 ${item.done ? 'opacity-60' : ''}`}
                        >
                          {/* Custom Checkbox */}
                          <button
                            onClick={() => toggleActionItem(item.id)}
                            className="mt-0.5 shrink-0"
                            aria-label={item.done ? 'Mark as incomplete' : 'Mark as complete'}
                          >
                            <motion.div
                              className={`size-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                                item.done
                                  ? 'bg-primary border-primary'
                                  : 'border-muted-foreground/30 hover:border-primary/50'
                              }`}
                              whileTap={{ scale: 0.85 }}
                            >
                              <AnimatePresence>
                                {item.done && (
                                  <motion.svg
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </motion.svg>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          </button>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${item.done ? 'line-through text-muted-foreground' : 'font-medium'}`}>
                              {item.text}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <div className="flex items-center gap-1.5">
                                <Avatar className="size-4">
                                  <AvatarFallback className={`${item.assigneeColor} text-white text-[7px] font-semibold px-0`}>{item.assigneeInitials}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">{item.assignee}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="size-3" />
                                {item.dueDate}
                              </div>
                            </div>
                          </div>

                          {/* Priority Badge */}
                          <Badge variant="outline" className={`shrink-0 text-[10px] font-medium px-2 py-0.5 border ${pri.className}`}>
                            <Flag className="size-2.5 mr-1" />
                            {pri.label}
                          </Badge>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Add Button */}
                  <div className="px-4 py-3 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full gap-2 text-muted-foreground hover:text-foreground"
                      onClick={addActionItem}
                    >
                      <Plus className="size-4" />
                      Add Action Item
                    </Button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// ── Toolbar Button ─────────────────────────────────────────────────────────

function ToolbarButton({ icon, label, onClick, active }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`size-8 flex items-center justify-center rounded-md transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {icon}
    </button>
  )
}
