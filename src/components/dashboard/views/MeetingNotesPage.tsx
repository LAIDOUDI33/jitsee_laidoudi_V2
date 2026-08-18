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
} from 'lucide-react'
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

// ── Helpers ────────────────────────────────────────────────────────────

function formatNoteDate(date: string, startTime: string | null) {
  const d = new Date(startTime ?? date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
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

// ── Main Component ─────────────────────────────────────────────────────

export default function MeetingNotesPage() {
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [selectedId, setSelectedId] = useState<string | null>(null)

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

  // ── Detail View ──────────────────────────────────────────────────────

  if (selectedId) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 -ml-2"
          onClick={() => setSelectedId(null)}
        >
          <ArrowLeft className="size-4" />
          Back to Notes
        </Button>
        <MeetingNotesEditor meetingId={selectedId} />
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
