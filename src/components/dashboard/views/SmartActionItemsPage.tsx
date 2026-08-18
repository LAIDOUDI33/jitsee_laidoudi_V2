'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { authFetch } from '@/lib/api'
import { useAppStore } from '@/store/app-store'
import {
  Sparkles,
  Plus,
  Search,
  ListTodo,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Trash2,
  Loader2,
  Video,
  CalendarDays,
  Filter,
  X,
  Inbox,
  AlertCircle,
  User,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface ActionItem {
  id: string
  content: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'completed'
  dueDate: string | null
  createdAt: string
  owner: { id: string; name: string; email: string }
  meeting: { id: string; title: string; meetingId: string } | null
}

// ── Configs ────────────────────────────────────────────────────────────────────

const priorityConfig: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Critical' },
  high: { color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30', label: 'High' },
  medium: { color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Medium' },
  low: { color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800/50', label: 'Low' },
}

const statusConfig: Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  pending: { color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Pending', icon: <Circle className='h-4 w-4' /> },
  in_progress: { color: 'text-teal-600', bg: 'bg-teal-100 dark:bg-teal-900/30', label: 'In Progress', icon: <Clock className='h-4 w-4' /> },
  completed: { color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Completed', icon: <CheckCircle2 className='h-4 w-4' /> },
}

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
] as const

type StatusTab = (typeof STATUS_TABS)[number]['key']

// ── Component ──────────────────────────────────────────────────────────────────

export default function SmartActionItemsPage() {
  const { user, setCurrentView } = useAppStore()

  // Data state
  const [items, setItems] = useState<ActionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [statusTab, setStatusTab] = useState<StatusTab>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ content: '', priority: 'medium', dueDate: '' })
  const [creating, setCreating] = useState(false)

  // ── Fetch action items ──────────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (statusTab === 'active') {
        // Fetch both pending and in_progress, filter client side
      } else if (statusTab === 'completed') {
        params.set('status', 'completed')
      }
      if (priorityFilter !== 'all') params.set('priority', priorityFilter)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      const res = await authFetch(`/api/v1/action-items?${params.toString()}`)
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error?.message || 'Failed to fetch action items')
      }
      const data = await res.json()
      if (data.success) {
        let fetchedItems = data.data.items as ActionItem[]
        // Client-side filtering for 'active' tab
        if (statusTab === 'active') {
          fetchedItems = fetchedItems.filter(i => i.status !== 'completed')
        }
        setItems(fetchedItems)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [statusTab, priorityFilter, searchQuery])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // ── Toggle status ───────────────────────────────────────────────────────
  const toggleStatus = async (item: ActionItem) => {
    const nextStatus = item.status === 'pending' ? 'in_progress' : item.status === 'in_progress' ? 'completed' : 'pending'
    // Optimistic update
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: nextStatus as ActionItem['status'] } : i))
    try {
      const res = await authFetch('/api/v1/action-items', {
        method: 'PUT',
        body: JSON.stringify({ id: item.id, status: nextStatus }),
      })
      if (!res.ok) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: item.status } : i))
        toast.error('Failed to update status')
      }
    } catch {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: item.status } : i))
      toast.error('Failed to update status')
    }
  }

  // ── Delete item ─────────────────────────────────────────────────────────
  const deleteItem = async (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId))
    try {
      const res = await authFetch(`/api/v1/action-items?id=${itemId}`, { method: 'DELETE' })
      if (!res.ok) {
        fetchItems()
        toast.error('Failed to delete action item')
        return
      }
      toast.success('Action item deleted')
    } catch {
      fetchItems()
      toast.error('Failed to delete action item')
    }
  }

  // ── Create item ─────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!createForm.content.trim()) {
      toast.error('Content is required')
      return
    }
    setCreating(true)
    try {
      const res = await authFetch('/api/v1/action-items', {
        method: 'POST',
        body: JSON.stringify({
          content: createForm.content.trim(),
          priority: createForm.priority,
          dueDate: createForm.dueDate || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        toast.error(err?.error?.message || 'Failed to create action item')
        setCreating(false)
        return
      }
      toast.success('Action item created!')
      setCreateOpen(false)
      setCreateForm({ content: '', priority: 'medium', dueDate: '' })
      fetchItems()
    } catch {
      toast.error('Failed to create action item')
    } finally {
      setCreating(false)
    }
  }

  // ── Summary calculations ────────────────────────────────────────────────
  const allItemsCount = items.length
  const pendingCount = items.filter(i => i.status === 'pending').length
  const inProgressCount = items.filter(i => i.status === 'in_progress').length
  const completedCount = items.filter(i => i.status === 'completed').length

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg'>
              <Sparkles className='h-5 w-5 text-primary-foreground' />
            </div>
            Smart Action Items
          </h2>
          <p className='text-muted-foreground text-sm mt-1'>AI-extracted and manually created tasks from your meetings</p>
          <div className='h-1 w-12 rounded-full bg-gradient-to-r from-primary to-primary/50 mt-2' />
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className='gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform'>
              <Plus className='h-4 w-4' /> Create Action Item
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <Plus className='h-5 w-5 text-primary' />
                New Action Item
              </DialogTitle>
            </DialogHeader>
            <div className='space-y-4 py-2'>
              <div className='space-y-2'>
                <Label>Content</Label>
                <Textarea
                  placeholder='Describe the action item...'
                  value={createForm.content}
                  onChange={e => setCreateForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={3}
                  className='resize-none'
                />
              </div>
              <div className='space-y-2'>
                <Label>Priority</Label>
                <Select value={createForm.priority} onValueChange={v => setCreateForm(prev => ({ ...prev, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='low'>Low</SelectItem>
                    <SelectItem value='medium'>Medium</SelectItem>
                    <SelectItem value='high'>High</SelectItem>
                    <SelectItem value='critical'>Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Due Date (optional)</Label>
                <Input
                  type='date'
                  value={createForm.dueDate}
                  onChange={e => setCreateForm(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant='outline'>Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? <><Loader2 className='h-4 w-4 animate-spin mr-1' /> Creating...</> : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className='border-border/50 bg-gradient-to-br from-card to-card/80'>
            <CardContent className='p-4 flex items-center gap-3'>
              <div className='w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0'>
                <ListTodo className='h-5 w-5 text-primary' />
              </div>
              <div>
                <p className='text-2xl font-bold'>{allItemsCount}</p>
                <p className='text-xs text-muted-foreground'>Total</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className='border-amber-500/20 bg-gradient-to-br from-card to-amber-500/5'>
            <CardContent className='p-4 flex items-center gap-3'>
              <div className='w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0'>
                <Circle className='h-5 w-5 text-amber-600' />
              </div>
              <div>
                <p className='text-2xl font-bold text-amber-600'>{pendingCount}</p>
                <p className='text-xs text-muted-foreground'>Pending</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className='border-teal-500/20 bg-gradient-to-br from-card to-teal-500/5'>
            <CardContent className='p-4 flex items-center gap-3'>
              <div className='w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0'>
                <Clock className='h-5 w-5 text-teal-600' />
              </div>
              <div>
                <p className='text-2xl font-bold text-teal-600'>{inProgressCount}</p>
                <p className='text-xs text-muted-foreground'>In Progress</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className='border-emerald-500/20 bg-gradient-to-br from-card to-emerald-500/5'>
            <CardContent className='p-4 flex items-center gap-3'>
              <div className='w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0'>
                <CheckCircle2 className='h-5 w-5 text-emerald-600' />
              </div>
              <div>
                <p className='text-2xl font-bold text-emerald-600'>{completedCount}</p>
                <p className='text-xs text-muted-foreground'>Completed</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters Row */}
      <Card className='border-border/50 bg-gradient-to-br from-card to-card/80'>
        <CardContent className='p-4'>
          <div className='flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between'>
            <div className='flex items-center gap-1.5'>
              {STATUS_TABS.map(tab => (
                <Button
                  key={tab.key}
                  variant={statusTab === tab.key ? 'default' : 'ghost'}
                  size='sm'
                  className='text-xs h-8'
                  onClick={() => setStatusTab(tab.key)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
            <div className='flex items-center gap-2 w-full sm:w-auto'>
              <div className='relative flex-1 sm:flex-initial'>
                <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground' />
                <Input
                  placeholder='Search action items...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='h-8 pl-8 text-xs w-full sm:w-56'
                />
                {searchQuery && (
                  <button
                    className='absolute right-2 top-1/2 -translate-y-1/2'
                    onClick={() => setSearchQuery('')}
                    aria-label='Clear search'
                  >
                    <X className='h-3 w-3 text-muted-foreground hover:text-foreground' />
                  </button>
                )}
              </div>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className='h-8 w-[120px] text-xs'>
                  <Filter className='h-3 w-3 mr-1 text-muted-foreground' />
                  <SelectValue placeholder='Priority' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Priorities</SelectItem>
                  <SelectItem value='critical'>Critical</SelectItem>
                  <SelectItem value='high'>High</SelectItem>
                  <SelectItem value='medium'>Medium</SelectItem>
                  <SelectItem value='low'>Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Area */}
      <Card className='border-border/50 bg-gradient-to-br from-card to-card/80'>
        <CardContent className='p-0'>
          {/* Loading Skeleton */}
          {loading && (
            <div className='p-4 space-y-3'>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className='flex items-start gap-3 p-3'>
                  <Skeleton className='h-5 w-5 rounded-full shrink-0' />
                  <div className='flex-1 space-y-2'>
                    <Skeleton className='h-4 w-3/4' />
                    <Skeleton className='h-3 w-1/2' />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className='p-12 flex flex-col items-center justify-center text-center'>
              <div className='w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4'>
                <AlertCircle className='h-7 w-7 text-red-500' />
              </div>
              <h3 className='font-semibold text-lg mb-1'>Failed to load</h3>
              <p className='text-sm text-muted-foreground mb-4'>{error}</p>
              <Button variant='outline' size='sm' onClick={fetchItems}>
                <Loader2 className='h-3.5 w-3.5 mr-1' /> Retry
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && items.length === 0 && (
            <div className='p-12 flex flex-col items-center justify-center text-center'>
              <div className='w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4'>
                <Inbox className='h-8 w-8 text-muted-foreground' />
              </div>
              <h3 className='font-semibold text-lg mb-1'>No action items</h3>
              <p className='text-sm text-muted-foreground mb-4 max-w-sm'>
                {searchQuery || priorityFilter !== 'all' || statusTab !== 'all'
                  ? 'No items match your current filters. Try adjusting them.'
                  : 'Action items from your meetings will appear here. Use AI Assistant to extract them from transcripts.'}
              </p>
              {!searchQuery && priorityFilter === 'all' && statusTab === 'all' && (
                <Button
                  variant='outline' size='sm'
                  className='gap-2'
                  onClick={() => setCurrentView('ai-assistant')}
                >
                  <Sparkles className='h-3.5 w-3.5' /> Go to AI Assistant
                </Button>
              )}
            </div>
          )}

          {/* Action Items List */}
          {!loading && !error && items.length > 0 && (
            <div className='divide-y max-h-[calc(100vh-28rem)] overflow-y-auto'>
              <AnimatePresence>
                {items.map((item, index) => {
                  const pConfig = priorityConfig[item.priority] || priorityConfig.medium
                  const sConfig = statusConfig[item.status] || statusConfig.pending
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.03 }}
                      className='flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors group'
                    >
                      {/* Status Toggle */}
                      <button
                        onClick={() => toggleStatus(item)}
                        className='mt-0.5 shrink-0 transition-transform hover:scale-110'
                        aria-label={`Toggle status for: ${item.content}`}
                      >
                        <span className={item.status === 'completed' ? 'text-emerald-500' : item.status === 'in_progress' ? 'text-teal-500' : 'text-muted-foreground/50 hover:text-amber-500'}>
                          {sConfig.icon}
                        </span>
                      </button>

                      {/* Content */}
                      <div className='flex-1 min-w-0'>
                        <p className={`text-sm leading-relaxed ${item.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                          {item.content}
                        </p>
                        <div className='flex items-center gap-2 mt-2 flex-wrap'>
                          {/* Priority Badge */}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${pConfig.bg} ${pConfig.color}`}>
                            {pConfig.label}
                          </span>
                          {/* Status Badge */}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${sConfig.bg} ${sConfig.color}`}>
                            {sConfig.label}
                          </span>
                          {/* Owner */}
                          <span className='inline-flex items-center gap-1 text-[11px] text-muted-foreground'>
                            <User className='h-3 w-3' />
                            {item.owner.name}
                          </span>
                          {/* Due Date */}
                          {item.dueDate && (
                            <span className={`inline-flex items-center gap-1 text-[11px] ${new Date(item.dueDate) < new Date() && item.status !== 'completed' ? 'text-red-500' : 'text-muted-foreground'}`}>
                              <CalendarDays className='h-3 w-3' />
                              {new Date(item.dueDate).toLocaleDateString()}
                              {new Date(item.dueDate) < new Date() && item.status !== 'completed' && (
                                <AlertTriangle className='h-3 w-3' />
                              )}
                            </span>
                          )}
                          {/* Source Meeting */}
                          {item.meeting && (
                            <span className='inline-flex items-center gap-1 text-[11px] text-muted-foreground'>
                              <Video className='h-3 w-3' />
                              <span className='truncate max-w-[150px]'>{item.meeting.title}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Delete Button */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 transition-all'
                            aria-label='Delete action item'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Action Item?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete &quot;{item.content.slice(0, 80)}{item.content.length > 80 ? '...' : ''}&quot;. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className='bg-red-600 hover:bg-red-500'
                              onClick={() => deleteItem(item.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
