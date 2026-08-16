'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  NotebookPen,
  Plus,
  Download,
  Search,
  CheckCircle2,
  Trash2,
  ListChecks,
  TrendingUp,
  Calendar,
  Users,
  FileText,
  Sparkles,
  X,
  Clock,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────

type Tag =
  | 'Sprint Planning'
  | 'Design Review'
  | '1-on-1'
  | 'Client Call'
  | 'Retrospective'
  | 'Board Meeting'

type Priority = 'High' | 'Medium' | 'Low'
type FilterTag = 'All' | Tag

interface Participant {
  name: string
  initials: string
  color: string
}

interface ActionItem {
  id: string
  assignee: Participant
  description: string
  priority: Priority
  dueDate: string
  completed: boolean
}

interface MeetingNote {
  id: string
  title: string
  date: string
  participants: Participant[]
  tags: Tag[]
  content: string
  actionItems: ActionItem[]
}

// ── Helpers ─────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1200, delay = 0) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const startTime = performance.now() + delay
    function step(now: number) {
      if (now < startTime) { requestAnimationFrame(step); return }
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, delay])
  return count
}

const COLORS = [
  'bg-violet-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-sky-500', 'bg-teal-500', 'bg-orange-500',
]

const p = (name: string, idx: number): Participant => ({
  name,
  initials: name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
  color: COLORS[idx % COLORS.length],
})

// ── Mock Data ──────────────────────────────────────────────────────────

const initialNotes: MeetingNote[] = [
  {
    id: 'mn1', title: 'Sprint 15 Planning — Engineering Team', date: 'Jan 13, 2025',
    participants: [p('Sarah Chen', 0), p('Mike Johnson', 1), p('Alex Rivera', 2), p('Emily Davis', 3), p('James Wilson', 4)],
    tags: ['Sprint Planning'],
    content: 'Discussed velocity trends from Sprint 14. Team committed to 42 story points. Key focus areas: authentication overhaul, new dashboard widgets, and API rate limiting. Decided to defer the notification redesign to Sprint 16 due to dependency on backend changes. Setup pairing sessions for complex stories.',
    actionItems: [
      { id: 'a1', assignee: p('Sarah Chen', 0), description: 'Finalize Sprint 15 backlog and assign story points', priority: 'High', dueDate: 'Jan 14, 2025', completed: true },
      { id: 'a2', assignee: p('Mike Johnson', 1), description: 'Set up CI/CD pipeline for new microservice', priority: 'High', dueDate: 'Jan 17, 2025', completed: false },
      { id: 'a3', assignee: p('Alex Rivera', 2), description: 'Draft technical design for auth overhaul', priority: 'Medium', dueDate: 'Jan 20, 2025', completed: false },
    ],
  },
  {
    id: 'mn2', title: 'Design Review — Dashboard V3 Redesign', date: 'Jan 12, 2025',
    participants: [p('Emily Davis', 3), p('Lisa Park', 5), p('Tom Brown', 6), p('Sarah Chen', 0)],
    tags: ['Design Review'],
    content: 'Reviewed the new dashboard layout proposals. Team agreed on the card-based approach with drag-and-drop widgets. Color system updated to use semantic tokens. Mobile responsive breakpoints defined. Need to revisit the data visualization component library choices.',
    actionItems: [
      { id: 'a4', assignee: p('Emily Davis', 3), description: 'Create high-fidelity mockups for dashboard V3', priority: 'High', dueDate: 'Jan 15, 2025', completed: false },
      { id: 'a5', assignee: p('Lisa Park', 5), description: 'Define component library integration plan', priority: 'Medium', dueDate: 'Jan 18, 2025', completed: true },
      { id: 'a6', assignee: p('Tom Brown', 6), description: 'Conduct user testing on prototype', priority: 'Low', dueDate: 'Jan 22, 2025', completed: false },
    ],
  },
  {
    id: 'mn3', title: '1:1 with Manager — Performance Review Prep', date: 'Jan 12, 2025',
    participants: [p('Alex Rivera', 2), p('James Wilson', 4)],
    tags: ['1-on-1'],
    content: 'Discussed career growth trajectory and areas for improvement. Agreed on three focus areas for Q1: technical leadership, cross-team collaboration, and mentoring junior developers. Identified a conference speaking opportunity for March. Need to update the skills matrix before the formal review.',
    actionItems: [
      { id: 'a7', assignee: p('Alex Rivera', 2), description: 'Update personal skills matrix and goals document', priority: 'Medium', dueDate: 'Jan 19, 2025', completed: false },
      { id: 'a8', assignee: p('James Wilson', 4), description: 'Submit conference talk proposal by deadline', priority: 'Low', dueDate: 'Feb 1, 2025', completed: false },
    ],
  },
  {
    id: 'mn4', title: 'Client Call — Acme Corp Onboarding Follow-up', date: 'Jan 11, 2025',
    participants: [p('Emily Davis', 3), p('Sarah Chen', 0), p('David Kim', 7), p('Rachel Green', 8)],
    tags: ['Client Call'],
    content: 'Follow-up call with Acme Corp after their first week on the platform. They reported high satisfaction with the video quality but requested better screen sharing controls. We agreed to prioritize the annotation tool. Scheduled a training session for their team next week.',
    actionItems: [
      { id: 'a9', assignee: p('Sarah Chen', 0), description: 'Prioritize screen sharing annotation feature in backlog', priority: 'High', dueDate: 'Jan 14, 2025', completed: true },
      { id: 'a10', assignee: p('Emily Davis', 3), description: 'Prepare training materials for Acme Corp team', priority: 'Medium', dueDate: 'Jan 18, 2025', completed: false },
      { id: 'a11', assignee: p('David Kim', 7), description: 'Send follow-up email with meeting summary', priority: 'Low', dueDate: 'Jan 12, 2025', completed: true },
    ],
  },
  {
    id: 'mn5', title: 'Sprint 14 Retrospective', date: 'Jan 10, 2025',
    participants: [p('Mike Johnson', 1), p('Alex Rivera', 2), p('Sarah Chen', 0), p('Tom Brown', 6), p('Lisa Park', 5), p('James Wilson', 4)],
    tags: ['Retrospective'],
    content: 'Sprint 14 completed with 38/42 points delivered. What went well: pairing sessions improved code quality, new CI pipeline reduced deploy time by 60%. What needs improvement: estimation accuracy, too many context switches. Action items: try time-boxed sprints for focused work, implement story point audit.',
    actionItems: [
      { id: 'a12', assignee: p('Mike Johnson', 1), description: 'Implement time-boxed focus periods in sprint', priority: 'Medium', dueDate: 'Jan 17, 2025', completed: false },
      { id: 'a13', assignee: p('Sarah Chen', 0), description: 'Create story point estimation guide', priority: 'Medium', dueDate: 'Jan 20, 2025', completed: false },
      { id: 'a14', assignee: p('Tom Brown', 6), description: 'Schedule mid-sprint check-in for at-risk stories', priority: 'Low', dueDate: 'Jan 24, 2025', completed: true },
    ],
  },
  {
    id: 'mn6', title: 'Board Meeting — Q4 Results & Q1 Strategy', date: 'Jan 9, 2025',
    participants: [p('James Wilson', 4), p('Rachel Green', 8), p('David Kim', 7), p('Emily Davis', 3)],
    tags: ['Board Meeting'],
    content: 'Presented Q4 financial results showing 23% revenue growth. Board approved Q1 investment in AI features and enterprise expansion. Discussed competitive landscape and new market opportunities. Approved headcount increase of 8 engineers for Q1. Security audit results were positive with minor findings to address.',
    actionItems: [
      { id: 'a15', assignee: p('James Wilson', 4), description: 'Draft Q1 budget allocation proposal', priority: 'High', dueDate: 'Jan 16, 2025', completed: true },
      { id: 'a16', assignee: p('Rachel Green', 8), description: 'Prepare enterprise expansion market analysis', priority: 'High', dueDate: 'Jan 23, 2025', completed: false },
      { id: 'a17', assignee: p('David Kim', 7), description: 'Address minor security audit findings', priority: 'Medium', dueDate: 'Jan 20, 2025', completed: false },
    ],
  },
  {
    id: 'mn7', title: 'Design Review — Mobile App Navigation', date: 'Jan 9, 2025',
    participants: [p('Lisa Park', 5), p('Emily Davis', 3), p('Tom Brown', 6), p('Alex Rivera', 2)],
    tags: ['Design Review'],
    content: 'Reviewed three navigation prototypes for the mobile app. Team preferred the bottom-tab approach with gesture support. Need to address deep-linking navigation states. Agreed to use shared transition animations between tabs. Accessibility audit highlighted color contrast issues on secondary buttons.',
    actionItems: [
      { id: 'a18', assignee: p('Lisa Park', 5), description: 'Finalize mobile navigation prototype with gestures', priority: 'High', dueDate: 'Jan 13, 2025', completed: true },
      { id: 'a19', assignee: p('Tom Brown', 6), description: 'Fix color contrast issues on secondary buttons', priority: 'Medium', dueDate: 'Jan 16, 2025', completed: false },
      { id: 'a20', assignee: p('Alex Rivera', 2), description: 'Document deep-linking navigation state machine', priority: 'Medium', dueDate: 'Jan 21, 2025', completed: false },
    ],
  },
  {
    id: 'mn8', title: 'Sprint 14 Planning — Product Team', date: 'Jan 8, 2025',
    participants: [p('Sarah Chen', 0), p('Emily Davis', 3), p('Mike Johnson', 1), p('Lisa Park', 5)],
    tags: ['Sprint Planning'],
    content: 'Product team aligned on Sprint 14 priorities. Focus on completing the onboarding flow, launching the new notification system, and starting work on the analytics dashboard. Dependencies identified with the data team for real-time metrics. Agreed to reduce WIP limit from 5 to 3 per developer.',
    actionItems: [
      { id: 'a21', assignee: p('Sarah Chen', 0), description: 'Define acceptance criteria for onboarding flow', priority: 'High', dueDate: 'Jan 10, 2025', completed: true },
      { id: 'a22', assignee: p('Emily Davis', 3), description: 'Coordinate with data team on real-time metrics API', priority: 'High', dueDate: 'Jan 12, 2025', completed: true },
      { id: 'a23', assignee: p('Mike Johnson', 1), description: 'Update WIP limits in project board', priority: 'Low', dueDate: 'Jan 9, 2025', completed: true },
    ],
  },
  {
    id: 'mn9', title: 'Client Call — Globex Industries Demo', date: 'Jan 8, 2025',
    participants: [p('David Kim', 7), p('Rachel Green', 8), p('Sarah Chen', 0)],
    tags: ['Client Call'],
    content: 'Demoed the enterprise plan features to Globex Industries. They were particularly interested in SSO integration and custom branding options. Pricing discussion went well — they requested a custom quote for 500 seats. Follow-up scheduled for next Thursday with their IT team for technical deep-dive.',
    actionItems: [
      { id: 'a24', assignee: p('David Kim', 7), description: 'Prepare custom 500-seat pricing proposal', priority: 'High', dueDate: 'Jan 11, 2025', completed: true },
      { id: 'a25', assignee: p('Rachel Green', 8), description: 'Create SSO integration technical brief', priority: 'Medium', dueDate: 'Jan 15, 2025', completed: false },
      { id: 'a26', assignee: p('Sarah Chen', 0), description: 'Set up demo environment for IT team', priority: 'Medium', dueDate: 'Jan 16, 2025', completed: false },
    ],
  },
  {
    id: 'mn10', title: '1:1 with Manager — Project Prioritization', date: 'Jan 7, 2025',
    participants: [p('Emily Davis', 3), p('James Wilson', 4)],
    tags: ['1-on-1'],
    content: 'Discussed prioritization conflicts between the analytics dashboard and the mobile app. Agreed that mobile takes precedence due to executive commitment. Analytics will be scoped down to MVP for Q1. Also discussed team morale and scheduled a team bonding event for February.',
    actionItems: [
      { id: 'a27', assignee: p('Emily Davis', 3), description: 'Create scoping document for analytics MVP', priority: 'High', dueDate: 'Jan 14, 2025', completed: true },
      { id: 'a28', assignee: p('James Wilson', 4), description: 'Organize team bonding event for February', priority: 'Low', dueDate: 'Jan 31, 2025', completed: false },
    ],
  },
  {
    id: 'mn11', title: 'Retrospective — Mobile App Beta Launch', date: 'Jan 6, 2025',
    participants: [p('Lisa Park', 5), p('Alex Rivera', 2), p('Tom Brown', 6), p('Mike Johnson', 1)],
    tags: ['Retrospective'],
    content: 'Beta launch had 2,000 downloads in first week. Crash rate below 0.5% which is excellent. Users loved the new video filters but found the settings page confusing. Push notification delivery had intermittent issues on Android. Performance on older devices needs optimization.',
    actionItems: [
      { id: 'a29', assignee: p('Lisa Park', 5), description: 'Redesign settings page for clarity', priority: 'High', dueDate: 'Jan 13, 2025', completed: true },
      { id: 'a30', assignee: p('Alex Rivera', 2), description: 'Fix Android push notification delivery issues', priority: 'High', dueDate: 'Jan 15, 2025', completed: false },
      { id: 'a31', assignee: p('Mike Johnson', 1), description: 'Profile and optimize performance on older devices', priority: 'Medium', dueDate: 'Jan 22, 2025', completed: false },
    ],
  },
  {
    id: 'mn12', title: 'Board Meeting — Security Compliance Review', date: 'Jan 5, 2025',
    participants: [p('James Wilson', 4), p('Rachel Green', 8), p('David Kim', 7), p('Sarah Chen', 0), p('Mike Johnson', 1)],
    tags: ['Board Meeting'],
    content: 'Annual security compliance review. SOC 2 Type II certification renewed successfully. GDPR data processing agreements updated. New requirement for HIPAA compliance due to healthcare client onboarding. Encryption at rest and in transit verified. Penetration testing scheduled for February.',
    actionItems: [
      { id: 'a32', assignee: p('David Kim', 7), description: 'Initiate HIPAA compliance assessment', priority: 'High', dueDate: 'Jan 20, 2025', completed: false },
      { id: 'a33', assignee: p('Mike Johnson', 1), description: 'Schedule and coordinate penetration testing', priority: 'High', dueDate: 'Feb 1, 2025', completed: false },
      { id: 'a34', assignee: p('Sarah Chen', 0), description: 'Update data processing agreements for GDPR', priority: 'Medium', dueDate: 'Jan 18, 2025', completed: true },
    ],
  },
  {
    id: 'mn13', title: 'Sprint 13 Retrospective', date: 'Jan 4, 2025',
    participants: [p('Sarah Chen', 0), p('Mike Johnson', 1), p('Alex Rivera', 2), p('Tom Brown', 6)],
    tags: ['Retrospective'],
    content: 'Sprint 13 was the best sprint this quarter — 45/45 points delivered. Key success factors: clear requirements, no scope creep, and excellent team communication. Decision to continue the no-meeting Wednesday policy. Need to address flaky test suite that slowed down deployments.',
    actionItems: [
      { id: 'a35', assignee: p('Mike Johnson', 1), description: 'Fix top 10 flaky tests in the suite', priority: 'Medium', dueDate: 'Jan 11, 2025', completed: true },
      { id: 'a36', assignee: p('Alex Rivera', 2), description: 'Document no-meeting Wednesday policy formally', priority: 'Low', dueDate: 'Jan 10, 2025', completed: true },
    ],
  },
  {
    id: 'mn14', title: 'Design Review — Onboarding Flow V2', date: 'Jan 3, 2025',
    participants: [p('Emily Davis', 3), p('Lisa Park', 5), p('Tom Brown', 6), p('Sarah Chen', 0), p('Alex Rivera', 2)],
    tags: ['Design Review'],
    content: 'Reviewed the redesigned onboarding flow with progressive disclosure. New flow reduces steps from 7 to 4 while collecting the same information. A/B test results show 34% higher completion rate. Decided to add a personalization step where users pick their preferred layout. Accessibility improvements include screen reader announcements.',
    actionItems: [
      { id: 'a37', assignee: p('Emily Davis', 3), description: 'Finalize onboarding V2 design and hand off to engineering', priority: 'High', dueDate: 'Jan 8, 2025', completed: true },
      { id: 'a38', assignee: p('Tom Brown', 6), description: 'Implement keyboard shortcut system for onboarding', priority: 'Medium', dueDate: 'Jan 15, 2025', completed: false },
      { id: 'a39', assignee: p('Lisa Park', 5), description: 'Add screen reader announcement tests', priority: 'Medium', dueDate: 'Jan 14, 2025', completed: true },
    ],
  },
  {
    id: 'mn15', title: 'Client Call — Wayne Enterprises Integration', date: 'Jan 2, 2025',
    participants: [p('Rachel Green', 8), p('David Kim', 7), p('Sarah Chen', 0), p('Mike Johnson', 1)],
    tags: ['Client Call'],
    content: 'Initial discovery call with Wayne Enterprises for custom integration. They need our video API embedded in their existing training platform. Requirements include custom branding, SSO, and analytics dashboard. Technical deep-dive scheduled for next week. Estimated integration timeline is 6-8 weeks.',
    actionItems: [
      { id: 'a40', assignee: p('Rachel Green', 8), description: 'Create statement of work for Wayne Enterprises', priority: 'High', dueDate: 'Jan 9, 2025', completed: true },
      { id: 'a41', assignee: p('David Kim', 7), description: 'Prepare API documentation for custom integration', priority: 'High', dueDate: 'Jan 12, 2025', completed: false },
    ],
  },
]

const ALL_TAGS: FilterTag[] = [
  'All', 'Sprint Planning', 'Design Review', '1-on-1',
  'Client Call', 'Retrospective', 'Board Meeting',
]

// ── Animation Variants ─────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

// ── Priority Config ────────────────────────────────────────────────────

const priorityConfig: Record<Priority, { label: string }> = {
  High:   { label: 'bg-gradient-to-r from-red-500 to-red-400 text-white shadow-sm shadow-red-500/30' },
  Medium: { label: 'bg-gradient-to-r from-amber-500 to-amber-400 text-white shadow-sm shadow-amber-500/30' },
  Low:    { label: 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-sm shadow-emerald-500/30' },
}

// ── Component ──────────────────────────────────────────────────────────

export default function MeetingNotesPage() {
  const [notes, setNotes] = useState<MeetingNote[]>(initialNotes)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<FilterTag>('All')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAction, setNewAction] = useState({
    assignee: p('Sarah Chen', 0),
    description: '',
    priority: 'Medium' as Priority,
    dueDate: '',
  })
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  // Derived
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchTag = activeTag === 'All' || n.tags.includes(activeTag as Tag)
      const q = search.toLowerCase()
      const matchSearch = !q ||
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.actionItems.some((a) =>
          a.description.toLowerCase().includes(q) ||
          a.assignee.name.toLowerCase().includes(q)
        )
      return matchTag && matchSearch
    })
  }, [notes, activeTag, search])

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null

  const allActionItems = useMemo(() => notes.flatMap((n) => n.actionItems), [notes])
  const totalActionItems = allActionItems.length
  const completedActionItems = allActionItems.filter((a) => a.completed).length
  const pendingActionItems = totalActionItems - completedActionItems
  const completionRate = totalActionItems > 0 ? Math.round((completedActionItems / totalActionItems) * 100) : 0

  const notesThisWeek = notes.filter((n) => {
    const weekStart = new Date('2025-01-07')
    const weekEnd = new Date('2025-01-14')
    return n.date.includes('Jan 13') || n.date.includes('Jan 12') || n.date.includes('Jan 11') || n.date.includes('Jan 10') || n.date.includes('Jan 9') || n.date.includes('Jan 8') || n.date.includes('Jan 7')
  }).length

  // Animated counters
  const animTotalNotes = useCountUp(notes.length, 1000)
  const animActionItems = useCountUp(totalActionItems, 1000, 100)
  const animCompletion = useCountUp(completionRate, 1200, 200)
  const animThisWeek = useCountUp(notesThisWeek, 1000, 300)

  // Handlers
  const handleSelectNote = useCallback((id: string) => {
    setSelectedId(id)
    setShowAddForm(false)
  }, [])

  const handleToggleAction = useCallback((noteId: string, actionId: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? { ...n, actionItems: n.actionItems.map((a) => a.id === actionId ? { ...a, completed: !a.completed } : a) }
          : n
      )
    )
  }, [])

  const handleDeleteAction = useCallback((noteId: string, actionId: string) => {
    setNotes((prev) =>
      prev.map((n) => n.id === noteId ? { ...n, actionItems: n.actionItems.filter((a) => a.id !== actionId) } : n)
    )
    toast.success('Action item deleted')
  }, [])

  const handleAddAction = useCallback(() => {
    if (!selectedId || !newAction.description.trim()) {
      toast.error('Please enter a description for the action item')
      return
    }
    const action: ActionItem = {
      id: `a${Date.now()}`,
      assignee: newAction.assignee,
      description: newAction.description.trim(),
      priority: newAction.priority,
      dueDate: newAction.dueDate || 'No date set',
      completed: false,
    }
    setNotes((prev) =>
      prev.map((n) => n.id === selectedId ? { ...n, actionItems: [...n.actionItems, action] } : n)
    )
    setNewAction({ assignee: p('Sarah Chen', 0), description: '', priority: 'Medium', dueDate: '' })
    setShowAddForm(false)
    toast.success('Action item added')
  }, [selectedId, newAction])

  const handleUpdateTitle = useCallback(() => {
    if (!selectedId || !titleDraft.trim()) { setEditingTitle(false); return }
    setNotes((prev) => prev.map((n) => n.id === selectedId ? { ...n, title: titleDraft.trim() } : n))
    setEditingTitle(false)
    toast.success('Title updated')
  }, [selectedId, titleDraft])

  const handleNewNote = useCallback(() => {
    const id = `mn${Date.now()}`
    const newNote: MeetingNote = {
      id,
      title: 'Untitled Meeting Note',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      participants: [p('You', 0)],
      tags: [],
      content: '',
      actionItems: [],
    }
    setNotes((prev) => [newNote, ...prev])
    setSelectedId(id)
    setTitleDraft(newNote.title)
    setEditingTitle(true)
    toast.success('New note created')
  }, [])

  const handleExportAll = useCallback(() => {
    const text = notes
      .map((n) =>
        `# ${n.title}\nDate: ${n.date}\nParticipants: ${n.participants.map((pt) => pt.name).join(', ')}\nTags: ${n.tags.join(', ')}\n\n${n.content}\n\nAction Items:\n${n.actionItems.map((a) => `- [${a.completed ? 'x' : ' '}] ${a.description} (${a.priority}, ${a.assignee.name}, Due: ${a.dueDate})`).join('\n')}`
      )
      .join('\n\n---\n\n')
    const blob = new Blob([text], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'meeting-notes.md'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('All notes exported as Markdown')
  }, [notes])

  const allAssignees = useMemo(() => {
    const seen = new Map<string, Participant>()
    notes.forEach((n) => n.participants.forEach((pt) => seen.set(pt.name, pt)))
    return Array.from(seen.values())
  }, [notes])

  return (
    <motion.div className='space-y-6' variants={container} initial='hidden' animate='show'>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div variants={item} className='relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <div className='p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/5'>
            <NotebookPen className='h-5 w-5 text-violet-600' />
          </div>
          <div>
            <h2 className='text-3xl font-bold tracking-tight'>Meeting Notes &amp; Action Items</h2>
            <p className='text-muted-foreground text-sm mt-1'>Capture, organize, and track action items from every meeting</p>
            <div className='h-1 w-12 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 mt-2' />
          </div>
        </div>
        <div className='flex items-center gap-2 shrink-0'>
          <Button variant='outline' size='sm' className='gap-2 hover:bg-muted/80 transition-all duration-200' onClick={handleExportAll}>
            <Download className='h-4 w-4' />
            Export All
          </Button>
          <Button
            size='sm'
            className='gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 transition-all duration-200'
            onClick={handleNewNote}
          >
            <Plus className='h-4 w-4' />
            New Note
          </Button>
        </div>
      </motion.div>

      {/* ── Stats Row ───────────────────────────────────────────────────── */}
      <motion.div variants={container} initial='hidden' animate='show' className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <motion.div variants={item}>
          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300 relative overflow-hidden before:content-[""] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-violet-500/50 before:to-violet-500/0'>
            <CardContent className='p-4 flex items-center gap-3'>
              <div className='p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5'><FileText className='h-5 w-5 text-violet-600' /></div>
              <div className='flex-1'>
                <p className='text-2xl font-bold tabular-nums'>{animTotalNotes}</p>
                <p className='text-xs text-muted-foreground'>Total Notes</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 relative overflow-hidden before:content-[""] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-amber-500/50 before:to-amber-500/0'>
            <CardContent className='p-4 flex items-center gap-3'>
              <div className='p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5'><ListChecks className='h-5 w-5 text-amber-600' /></div>
              <div className='flex-1'>
                <div className='flex items-center justify-between'>
                  <p className='text-2xl font-bold tabular-nums'>{animActionItems}</p>
                  <Badge variant='secondary' className='text-[10px] font-semibold bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800'>
                    {pendingActionItems} pending
                  </Badge>
                </div>
                <p className='text-xs text-muted-foreground'>Action Items</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 relative overflow-hidden before:content-[""] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-emerald-500/50 before:to-emerald-500/0'>
            <CardContent className='p-4 flex items-center gap-3'>
              <div className='p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5'><CheckCircle2 className='h-5 w-5 text-emerald-600' /></div>
              <div className='flex-1'>
                <p className='text-2xl font-bold tabular-nums'>{animCompletion}%</p>
                <p className='text-xs text-muted-foreground mb-2'>Completion Rate</p>
                <div className='h-1.5 rounded-full bg-muted overflow-hidden'>
                  <motion.div
                    className='h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400'
                    initial={{ width: 0 }}
                    animate={{ width: `${completionRate}%` }}
                    transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 relative overflow-hidden before:content-[""] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-purple-500/50 before:to-purple-500/0'>
            <CardContent className='p-4 flex items-center gap-3'>
              <div className='p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5'><Calendar className='h-5 w-5 text-purple-600' /></div>
              <div className='flex-1'>
                <div className='flex items-center justify-between'>
                  <p className='text-2xl font-bold tabular-nums'>{animThisWeek}</p>
                  <span className='text-[10px] font-medium text-emerald-600 flex items-center gap-0.5'><TrendingUp className='h-2.5 w-2.5' />+2</span>
                </div>
                <p className='text-xs text-muted-foreground'>Notes This Week</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ── Tag Filter Bar + Search ──────────────────────────────────────── */}
      <motion.div variants={item} className='flex flex-col sm:flex-row sm:items-center gap-3'>
        <div className='flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-1'>
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border',
                activeTag === tag
                  ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white border-transparent shadow-md shadow-violet-500/20'
                  : 'bg-card text-muted-foreground border-border/50 hover:border-violet-300 hover:text-violet-600 dark:hover:border-violet-700 dark:hover:text-violet-400'
              )}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className='relative shrink-0 w-full sm:w-64'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input placeholder='Search notes &amp; actions...' className='pl-9 h-9' value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </motion.div>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <motion.div variants={item} className='grid grid-cols-1 lg:grid-cols-12 gap-6'>

        {/* Notes List Panel (left) */}
        <div className='lg:col-span-4'>
          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 overflow-hidden relative before:content-[""] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-violet-500/40 before:to-purple-500/0'>
            <div className='px-4 py-3 border-b border-border/50 flex items-center justify-between'>
              <span className='text-sm font-semibold'>Notes ({filteredNotes.length})</span>
              {search && (
                <button onClick={() => setSearch('')} className='text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors'>
                  <X className='h-3 w-3' /> Clear
                </button>
              )}
            </div>
            <ScrollArea className='h-[calc(100vh-420px)] min-h-[400px] max-h-[600px]'>
              <motion.div variants={container} initial='hidden' animate='show' className='p-2 space-y-1'>
                {filteredNotes.map((note) => {
                  const completedCount = note.actionItems.filter((a) => a.completed).length
                  const isSelected = selectedId === note.id
                  return (
                    <motion.button
                      key={note.id}
                      variants={item}
                      onClick={() => handleSelectNote(note.id)}
                      className={cn(
                        'w-full text-left rounded-lg p-3 transition-all duration-200 group border',
                        isSelected
                          ? 'bg-gradient-to-r from-violet-500/10 to-purple-500/5 border-violet-300 dark:border-violet-700 shadow-sm shadow-violet-500/10'
                          : 'hover:bg-muted/50 border-transparent hover:border-border/50'
                      )}
                    >
                      <div className='flex items-start justify-between gap-2 mb-1.5'>
                        <h3 className={cn(
                          'text-sm font-medium line-clamp-1 transition-colors',
                          isSelected ? 'text-violet-700 dark:text-violet-300' : 'group-hover:text-foreground'
                        )}>
                          {note.title}
                        </h3>
                        {note.actionItems.length > 0 && (
                          <Badge variant='secondary' className={cn(
                            'shrink-0 text-[10px] font-semibold',
                            completedCount === note.actionItems.length
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800'
                              : 'bg-violet-500/10 text-violet-600 border-violet-200 dark:border-violet-800'
                          )}>
                            <ListChecks className='h-2.5 w-2.5 mr-0.5' />
                            {completedCount}/{note.actionItems.length}
                          </Badge>
                        )}
                      </div>
                      <p className='text-xs text-muted-foreground line-clamp-2 mb-2'>
                        {note.content.length > 100 ? note.content.slice(0, 100) + '...' : note.content}
                      </p>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <div className='flex -space-x-1.5'>
                            {note.participants.slice(0, 3).map((part, i) => (
                              <TooltipProvider key={part.name} delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={cn(
                                        'h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white ring-2 ring-card',
                                        part.color
                                      )}
                                      style={{ zIndex: 3 - i }}
                                    >
                                      {part.initials}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side='bottom' className='text-xs'>{part.name}</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                            {note.participants.length > 3 && (
                              <div className='h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground ring-2 ring-card'>
                                +{note.participants.length - 3}
                              </div>
                            )}
                          </div>
                          <span className='text-[10px] text-muted-foreground'>{note.date}</span>
                        </div>
                        <div className='flex items-center gap-1'>
                          {note.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant='outline' className='text-[9px] px-1.5 py-0 h-4 border-border/50'>{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
                {filteredNotes.length === 0 && (
                  <div className='flex flex-col items-center justify-center py-12 px-4'>
                    <NotebookPen className='h-10 w-10 text-muted-foreground/20' />
                    <p className='text-sm font-medium mt-3'>No notes found</p>
                    <p className='text-xs text-muted-foreground mt-1 text-center'>{search ? 'Try a different search term' : 'No notes with this tag yet'}</p>
                  </div>
                )}
              </motion.div>
            </ScrollArea>
          </Card>
        </div>

        {/* Note Editor Panel (right) */}
        <div className='lg:col-span-8'>
          <AnimatePresence mode='wait'>
            {selectedNote ? (
              <motion.div
                key={selectedNote.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 overflow-hidden relative before:content-[""] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-violet-500/50 before:to-purple-500/0'>
                  {/* Note header */}
                  <div className='p-6 pb-4 border-b border-border/50'>
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex-1 min-w-0'>
                        {editingTitle ? (
                          <div className='flex items-center gap-2'>
                            <Input value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateTitle(); if (e.key === 'Escape') setEditingTitle(false) }} className='text-lg font-bold h-10' autoFocus />
                            <Button size='sm' variant='ghost' onClick={handleUpdateTitle} className='shrink-0'><CheckCircle2 className='h-4 w-4 text-emerald-500' /></Button>
                            <Button size='sm' variant='ghost' onClick={() => setEditingTitle(false)} className='shrink-0'><X className='h-4 w-4' /></Button>
                          </div>
                        ) : (
                          <button onClick={() => { setTitleDraft(selectedNote.title); setEditingTitle(true) }} className='text-lg font-bold text-left hover:text-violet-600 transition-colors group/title'>
                            {selectedNote.title}
                            <Sparkles className='inline-block h-3.5 w-3.5 ml-2 text-muted-foreground/0 group-hover/title:text-violet-400 transition-all duration-200' />
                          </button>
                        )}
                        <div className='flex items-center gap-3 mt-2 text-sm text-muted-foreground'>
                          <span className='flex items-center gap-1.5'><Calendar className='h-3.5 w-3.5' />{selectedNote.date}</span>
                          <span className='flex items-center gap-1.5'><Users className='h-3.5 w-3.5' />{selectedNote.participants.length} participants</span>
                        </div>
                      </div>
                      <div className='flex items-center gap-1.5 shrink-0 flex-wrap'>
                        {selectedNote.tags.map((tag) => (
                          <Badge key={tag} variant='outline' className='text-[10px] border-violet-200 dark:border-violet-800 text-violet-600 bg-violet-500/5'>{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    {/* Participants */}
                    <div className='flex items-center gap-2 mt-4 flex-wrap'>
                      {selectedNote.participants.map((part) => (
                        <div key={part.name} className='flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 text-xs'>
                          <div className={cn('h-4 w-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white', part.color)}>{part.initials}</div>
                          {part.name}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Content area */}
                  <div className='p-6 pb-4'>
                    <Textarea
                      placeholder='Meeting notes...'
                      className='min-h-[120px] resize-y bg-muted/20 border-border/50 focus:border-violet-300 dark:focus:border-violet-700 focus:ring-violet-500/20'
                      defaultValue={selectedNote.content}
                      onChange={(e) => setNotes((prev) => prev.map((n) => n.id === selectedNote.id ? { ...n, content: e.target.value } : n))}
                    />
                  </div>

                  {/* Action Items Section */}
                  <div className='px-6 pb-6'>
                    <div className='flex items-center justify-between mb-4'>
                      <div className='flex items-center gap-2'>
                        <ListChecks className='h-4 w-4 text-violet-600' />
                        <h3 className='text-sm font-semibold'>Action Items</h3>
                        <Badge variant='secondary' className='text-[10px] bg-violet-500/10 text-violet-600'>
                          {selectedNote.actionItems.filter((a) => a.completed).length}/{selectedNote.actionItems.length}
                        </Badge>
                      </div>
                      <Button size='sm' variant='outline' className='h-7 text-xs gap-1.5 border-violet-200 dark:border-violet-800 text-violet-600 hover:bg-violet-500/10' onClick={() => setShowAddForm(true)}>
                        <Plus className='h-3 w-3' />
                        Add Action Item
                      </Button>
                    </div>

                    {/* Inline add form */}
                    <AnimatePresence>
                      {showAddForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -8 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                          className='mb-4 overflow-hidden'
                        >
                          <div className='rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-500/5 p-4 space-y-3'>
                            <div className='flex items-center gap-2 flex-wrap'>
                              <Select value={newAction.assignee.name} onValueChange={(val) => {
                                const found = allAssignees.find((a) => a.name === val)
                                if (found) setNewAction((prev) => ({ ...prev, assignee: found }))
                              }}>
                                <SelectTrigger className='h-8 text-xs w-40'><SelectValue placeholder='Assignee' /></SelectTrigger>
                                <SelectContent>
                                  {allAssignees.map((a) => (
                                    <SelectItem key={a.name} value={a.name} className='text-xs'>
                                      <div className='flex items-center gap-2'>
                                        <div className={cn('h-4 w-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white shrink-0', a.color)}>{a.initials}</div>
                                        {a.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select value={newAction.priority} onValueChange={(val) => setNewAction((prev) => ({ ...prev, priority: val as Priority }))}>
                                <SelectTrigger className='h-8 text-xs w-28'><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value='High' className='text-xs'>🔴 High</SelectItem>
                                  <SelectItem value='Medium' className='text-xs'>🟡 Medium</SelectItem>
                                  <SelectItem value='Low' className='text-xs'>🟢 Low</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input type='date' className='h-8 text-xs w-36' value={newAction.dueDate} onChange={(e) => setNewAction((prev) => ({ ...prev, dueDate: e.target.value }))} />
                            </div>
                            <div className='flex items-center gap-2'>
                              <Input placeholder='Describe the action item...' className='h-8 text-xs flex-1' value={newAction.description} onChange={(e) => setNewAction((prev) => ({ ...prev, description: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') handleAddAction() }} />
                              <Button size='sm' className='h-8 text-xs bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shrink-0' onClick={handleAddAction}>Add</Button>
                              <Button size='sm' variant='ghost' className='h-8 text-xs shrink-0' onClick={() => setShowAddForm(false)}>Cancel</Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Action items list */}
                    <motion.div variants={container} initial='hidden' animate='show' className='space-y-2'>
                      {selectedNote.actionItems.map((action) => {
                        const config = priorityConfig[action.priority]
                        return (
                          <motion.div
                            key={action.id}
                            variants={item}
                            className={cn(
                              'flex items-start gap-3 rounded-lg border p-3 transition-all duration-200 group',
                              action.completed
                                ? 'bg-muted/30 border-border/30 opacity-70'
                                : 'bg-card border-border/50 hover:border-border hover:shadow-sm'
                            )}
                          >
                            <Checkbox
                              checked={action.completed}
                              onCheckedChange={() => handleToggleAction(selectedNote.id, action.id)}
                              className='mt-0.5 data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500'
                            />
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center gap-2 mb-1 flex-wrap'>
                                <div className={cn('h-5 w-5 rounded-full flex items-center justify-center text-[7px] font-bold text-white shrink-0', action.assignee.color)}>{action.assignee.initials}</div>
                                <span className={cn('text-xs font-medium', action.completed && 'line-through text-muted-foreground')}>{action.assignee.name}</span>
                                <Badge className={cn('text-[9px] px-1.5 py-0 h-4 border-0 font-semibold', config.label)}>{action.priority}</Badge>
                              </div>
                              <p className={cn('text-sm', action.completed && 'line-through text-muted-foreground')}>{action.description}</p>
                              <div className='flex items-center gap-1.5 mt-1.5 text-[11px] text-muted-foreground'>
                                <Clock className='h-3 w-3' />{action.dueDate}
                              </div>
                            </div>
                            <button onClick={() => handleDeleteAction(selectedNote.id, action.id)} className='shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500'>
                              <Trash2 className='h-3.5 w-3.5' />
                            </button>
                          </motion.div>
                        )
                      })}
                      {selectedNote.actionItems.length === 0 && (
                        <div className='flex flex-col items-center justify-center py-8 text-center'>
                          <CheckCircle2 className='h-8 w-8 text-muted-foreground/20' />
                          <p className='text-sm font-medium mt-2 text-muted-foreground'>No action items yet</p>
                          <p className='text-xs text-muted-foreground/60 mt-0.5'>Click &quot;Add Action Item&quot; to create one</p>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <motion.div key='empty' initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.25 }}>
                <Card className='border border-dashed border-border/60 bg-gradient-to-br from-card/50 to-card/20 h-full min-h-[500px] flex items-center justify-center'>
                  <div className='text-center px-8'>
                    <div className='relative mx-auto w-20 h-20 mb-6'>
                      <div className='absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/5' />
                      <div className='relative w-full h-full flex items-center justify-center'>
                        <NotebookPen className='h-10 w-10 text-violet-500/30' />
                      </div>
                      <motion.div className='absolute -top-1 -right-1' animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                        <Sparkles className='h-4 w-4 text-violet-400/50' />
                      </motion.div>
                    </div>
                    <h3 className='text-lg font-semibold mb-2'>Select a Note</h3>
                    <p className='text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed'>
                      Choose a meeting note from the list to view details and manage action items, or create a new note to get started.
                    </p>
                    <Button className='mt-6 gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-md shadow-violet-500/20' onClick={handleNewNote}>
                      <Plus className='h-4 w-4' />
                      Create New Note
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}
