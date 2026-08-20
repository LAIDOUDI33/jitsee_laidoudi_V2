'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { authFetch } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  NotebookPen,
  Calendar,
  User,
  ListChecks,
  Sparkles,
  FileText,
  Lightbulb,
  CheckCircle2,
  Bookmark,
  ArrowRight,
  Copy,
  X,
  Loader2,
  ChevronDown,
  Save,
  FilePlus,
} from 'lucide-react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'

const MeetingNotesEditor = dynamic(
  () => import('@/components/shared/MeetingNotesEditor'),
  { ssr: false }
)

// ── Types ──────────────────────────────────────────────────────────────

interface NoteItem {
  id: string
  title: string
  content: string
  preview: string
  date: string
  startTime: string | null
  hostName: string
  actionItemsCount: number
  status: string
}

interface AISummarySections {
  executiveSummary: string
  keyPoints: string[]
  actionItems: string[]
  decisions: string[]
  nextSteps: string[]
}

interface AISummaryData {
  raw: string
  sections: AISummarySections
}

// ── Helpers ────────────────────────────────────────────────────────────

function formatNoteDate(date: string, startTime: string | null) {
  const d = new Date(startTime ?? date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function stripHtml(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.innerText || ''
}

// ── Card Skeleton ──────────────────────────────────────────────────────

function CardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ── AI Summary Section ─────────────────────────────────────────────────

function SummarySection({
  title,
  icon,
  iconColor,
  items,
  defaultOpen = true,
}: {
  title: string
  icon: React.ReactNode
  iconColor: string
  items: string[]
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  if (items.length === 0) return null

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group">
      <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 text-sm font-semibold hover:opacity-80 transition-opacity">
        <span className={iconColor}>{icon}</span>
        {title}
        <ChevronDown className={`size-3.5 ml-auto text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="space-y-1.5 pl-7 pb-2">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm text-muted-foreground leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}

// ── AI Summary Panel ───────────────────────────────────────────────────

function AISummaryPanel({
  data,
  onDismiss,
  onCopy,
  onSaveAsNotes,
  onAppendToNotes,
}: {
  data: AISummaryData
  onDismiss: () => void
  onCopy: () => void
  onSaveAsNotes: () => void
  onAppendToNotes: () => void
}) {
  const { sections } = data

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="rounded-xl border-l-4 border-l-emerald-500 border border-border/50 bg-emerald-500/5 backdrop-blur-sm shadow-sm overflow-hidden"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-500/20">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-emerald-500" />
          <span className="text-sm font-semibold">AI Summary</span>
          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
            Generated
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={onCopy}
          >
            <Copy className="size-3" />
            Copy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-red-500"
            onClick={onDismiss}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Panel Body */}
      <div className="px-4 py-3 space-y-1 max-h-[400px] overflow-y-auto">
        {/* Executive Summary */}
        {sections.executiveSummary && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-violet-500"><FileText className="size-4" /></span>
              <h4 className="text-sm font-semibold">Executive Summary</h4>
            </div>
            <div className="text-sm text-muted-foreground leading-relaxed pl-7 whitespace-pre-line">
              {sections.executiveSummary}
            </div>
          </div>
        )}

        {/* Key Points */}
        <SummarySection
          title="Key Discussion Points"
          icon={<Lightbulb className="size-4" />}
          iconColor="text-violet-500"
          items={sections.keyPoints}
          defaultOpen={true}
        />

        {/* Action Items */}
        <SummarySection
          title="Action Items"
          icon={<CheckCircle2 className="size-4" />}
          iconColor="text-teal-500"
          items={sections.actionItems}
          defaultOpen={true}
        />

        {/* Decisions */}
        <SummarySection
          title="Decisions Made"
          icon={<Bookmark className="size-4" />}
          iconColor="text-amber-500"
          items={sections.decisions}
          defaultOpen={true}
        />

        {/* Next Steps */}
        <SummarySection
          title="Next Steps"
          icon={<ArrowRight className="size-4" />}
          iconColor="text-violet-500"
          items={sections.nextSteps}
          defaultOpen={true}
        />
      </div>

      {/* Panel Footer */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-emerald-500/20">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
          onClick={onSaveAsNotes}
        >
          <Save className="size-3" />
          Save as Notes
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
          onClick={onAppendToNotes}
        >
          <FilePlus className="size-3" />
          Append to Notes
        </Button>
      </div>
    </motion.div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────

export default function MeetingNotesPage() {
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // AI state
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSummary, setAiSummary] = useState<AISummaryData | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [editorKey, setEditorKey] = useState(0)

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ sort })
      const res = await authFetch(`/api/v1/meeting-notes/list?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      if (json.success) setNotes(json.data.notes)
      else throw new Error(json.error?.message || 'Failed to fetch')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [sort])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  // Clear AI state when switching notes
  useEffect(() => {
    setAiSummary(null)
    setAiError(null)
    setCopied(false)
  }, [selectedId])

  const filtered = useMemo(() => {
    if (!search.trim()) return notes
    const q = search.toLowerCase()
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.hostName.toLowerCase().includes(q) ||
        n.preview.toLowerCase().includes(q)
    )
  }, [notes, search])

  // ── AI Summary Handlers ───────────────────────────────────────────────

  const handleAISummarize = useCallback(async () => {
    if (!selectedId || aiLoading) return
    setAiLoading(true)
    setAiError(null)
    setAiSummary(null)

    try {
      // Fetch current notes from API
      const notesRes = await authFetch(`/api/v1/meeting-notes?meetingId=${selectedId}`)
      if (!notesRes.ok) throw new Error('Failed to fetch meeting notes')
      const notesJson = await notesRes.json()
      if (!notesJson.success) throw new Error(notesJson.error?.message || 'Failed to fetch notes')

      const content = notesJson.data?.content || ''
      const plainText = stripHtml(content)

      if (!plainText.trim()) {
        setAiError('No notes content to summarize. Write some notes first.')
        return
      }

      // Call AI summary endpoint
      const aiRes = await authFetch('/api/v1/meetings/ai-summary', {
        method: 'POST',
        body: JSON.stringify({
          notes: plainText,
          meetingTitle: notesJson.data?.title,
        }),
      })

      if (!aiRes.ok) {
        const err = await aiRes.json().catch(() => null)
        throw new Error(err?.error?.message || 'Failed to generate AI summary')
      }

      const aiJson = await aiRes.json()
      if (!aiJson.success) throw new Error(aiJson.error?.message || 'AI summary failed')

      setAiSummary(aiJson.data)
      toast.success('AI summary generated successfully')
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Failed to generate summary')
      toast.error('Failed to generate AI summary')
    } finally {
      setAiLoading(false)
    }
  }, [selectedId, aiLoading])

  const handleCopySummary = useCallback(() => {
    if (!aiSummary) return
    navigator.clipboard.writeText(aiSummary.raw).then(() => {
      setCopied(true)
      toast.success('Summary copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    })
  }, [aiSummary])

  const handleSaveAsNotes = useCallback(async () => {
    if (!aiSummary || !selectedId) return
    try {
      const htmlContent = markdownToHtml(aiSummary.raw)
      const res = await authFetch('/api/v1/meeting-notes', {
        method: 'POST',
        body: JSON.stringify({
          meetingId: selectedId,
          title: undefined,
          content: htmlContent,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setEditorKey((k) => k + 1)
      setAiSummary(null)
      toast.success('Summary saved as meeting notes')
    } catch {
      toast.error('Failed to save summary as notes')
    }
  }, [aiSummary, selectedId])

  const handleAppendToNotes = useCallback(async () => {
    if (!aiSummary || !selectedId) return
    try {
      // Fetch current notes
      const notesRes = await authFetch(`/api/v1/meeting-notes?meetingId=${selectedId}`)
      if (!notesRes.ok) throw new Error('Failed to fetch notes')
      const notesJson = await notesRes.json()
      if (!notesJson.success) throw new Error('Failed to fetch notes')

      const currentHtml = notesJson.data?.content || ''
      const appendedHtml = currentHtml + '<hr/><h3>AI Summary</h3>' + markdownToHtml(aiSummary.raw)

      const res = await authFetch('/api/v1/meeting-notes', {
        method: 'POST',
        body: JSON.stringify({
          meetingId: selectedId,
          title: undefined,
          content: appendedHtml,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setEditorKey((k) => k + 1)
      setAiSummary(null)
      toast.success('Summary appended to meeting notes')
    } catch {
      toast.error('Failed to append summary to notes')
    }
  }, [aiSummary, selectedId])

  // ── Detail View ──────────────────────────────────────────────────────

  if (selectedId) {
    return (
      <div className="space-y-4">
        {/* Header with back + AI button */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 -ml-2"
            onClick={() => setSelectedId(null)}
          >
            <ArrowLeft className="size-4" />
            Back to Notes
          </Button>

          <Button
            size="sm"
            className="gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-sm shadow-emerald-500/20"
            onClick={handleAISummarize}
            disabled={aiLoading}
          >
            {aiLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generating summary...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                AI Summarize
              </>
            )}
          </Button>
        </div>

        {/* Notes Editor */}
        <MeetingNotesEditor key={editorKey} meetingId={selectedId} />

        {/* AI Error */}
        <AnimatePresence>
          {aiError && !aiLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
            >
              <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30">
                <CardContent className="p-3 flex items-center gap-2">
                  <AlertCircle className="size-4 text-red-500 shrink-0" />
                  <span className="text-sm text-red-600 dark:text-red-400 flex-1">{aiError}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-red-500 hover:text-red-700"
                    onClick={() => setAiError(null)}
                  >
                    <X className="size-3" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Summary Panel */}
        <AnimatePresence>
          {aiSummary && (
            <AISummaryPanel
              data={aiSummary}
              onDismiss={() => setAiSummary(null)}
              onCopy={handleCopySummary}
              onSaveAsNotes={handleSaveAsNotes}
              onAppendToNotes={handleAppendToNotes}
            />
          )}
        </AnimatePresence>

        {/* AI Empty State Hint */}
        <AnimatePresence>
          {!aiSummary && !aiLoading && !aiError && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <Card className="border-dashed border-border/60 bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={handleAISummarize}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">✨</span>
                    <span className="text-sm text-muted-foreground">
                      Let AI summarize your meeting notes
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-xs border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <Sparkles className="size-3" />
                    Generate
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ── List View ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Meeting Notes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {notes.length} notes from your meetings
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={fetchNotes}
          disabled={loading}
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search notes by title, host, or content..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notes Grid */}
      {loading ? (
        <CardsSkeleton />
      ) : error ? (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="size-10 text-red-400 mb-3" />
              <p className="text-sm font-medium">Failed to load notes</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={fetchNotes}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <NotebookPen className="size-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium">
                {search
                  ? 'No notes match your search'
                  : 'No meeting notes yet'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {search
                  ? 'Try a different search term'
                  : 'Notes will appear here after meetings with notes or AI summaries'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            layout
          >
            {filtered.map((note, idx) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.04, duration: 0.25 }}
              >
                <Card
                  className="border-border/50 bg-card/80 backdrop-blur-sm cursor-pointer hover:border-emerald-500/30 hover:shadow-md transition-all group"
                  onClick={() => setSelectedId(note.id)}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Title */}
                    <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {note.title}
                    </h3>

                    {/* Preview */}
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {note.preview || 'No content available'}
                    </p>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="size-3" />
                        {formatNoteDate(note.date, note.startTime)}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="size-3" />
                        {note.hostName}
                      </div>
                    </div>

                    {/* Action items badge */}
                    {note.actionItemsCount > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                      >
                        <ListChecks className="size-3 mr-1" />
                        {note.actionItemsCount} action {note.actionItemsCount === 1 ? 'item' : 'items'}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Footer */}
      {!loading && !error && filtered.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {filtered.length} of {notes.length} notes
          </span>
        </div>
      )}
    </div>
  )
}

// ── Markdown to simple HTML converter ──────────────────────────────────

function markdownToHtml(md: string): string {
  return md
    .split('\n')
    .map((line) => {
      const trimmed = line.trim()
      if (!trimmed) return '<br/>'
      // H2
      if (/^##\s+/.test(trimmed)) {
        return `<h3>${trimmed.replace(/^##\s+/, '')}</h3>`
      }
      // H3
      if (/^###\s+/.test(trimmed)) {
        return `<h4>${trimmed.replace(/^###\s+/, '')}</h4>`
      }
      // Bullet list
      if (/^[-*]\s+/.test(trimmed)) {
        return `<li>${trimmed.replace(/^[-*]\s+/, '')}</li>`
      }
      // Numbered list
      if (/^\d+\.\s+/.test(trimmed)) {
        return `<li>${trimmed.replace(/^\d+\.\s+/, '')}</li>`
      }
      // Bold
      const withBold = trimmed.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      return `<p>${withBold}</p>`
    })
    .join('\n')
}
