'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/store/app-store'
import { authFetch } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  LayoutTemplate,
  Plus,
  Clock,
  Users,
  Star,
  MoreVertical,
  Pencil,
  Copy,
  Trash2,
  Video,
  Mic,
  Monitor,
  Sparkles,
  RefreshCcw,
  Lightbulb,
  Presentation,
  MessageSquare,
  UserCheck,
  GraduationCap,
  ShieldCheck,
  HeadphonesIcon,
  Loader2,
} from 'lucide-react'
import { motion } from 'framer-motion'

// ── Types ──────────────────────────────────────────────────────────────

interface Template {
  id: string
  name: string
  description: string
  duration: string
  maxParticipants: string
  settings: string[]
  agenda: string
  gradient: string
  iconBg: string
  isBuiltin: boolean
  createdAt: string
  updatedAt: string
}

interface FeaturedTemplate {
  id: string
  name: string
  duration: string
  participants: string
  gradient: string
  favorited: boolean
}

// ── Icon map for template names ──────────────────────────────────────

const templateIconMap: Record<string, React.ReactNode> = {
  'weekly team sync': <RefreshCcw className='h-5 w-5 text-white' />,
  'design review': <Presentation className='h-5 w-5 text-white' />,
  'client demo': <MessageSquare className='h-5 w-5 text-white' />,
  'brainstorm session': <Lightbulb className='h-5 w-5 text-white' />,
  'retrospective': <UserCheck className='h-5 w-5 text-white' />,
  'training workshop': <GraduationCap className='h-5 w-5 text-white' />,
  'board meeting': <ShieldCheck className='h-5 w-5 text-white' />,
  'office hours': <HeadphonesIcon className='h-5 w-5 text-white' />,
}

function getTemplateIcon(name: string): React.ReactNode {
  return templateIconMap[name.toLowerCase()] || <LayoutTemplate className='h-5 w-5 text-white' />
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const initialFeatured: FeaturedTemplate[] = [
  { id: 'f1', name: 'Daily Standup', duration: '15min', participants: '3-5', gradient: 'from-emerald-500 to-teal-600', favorited: true },
  { id: 'f2', name: 'Sprint Planning', duration: '60min', participants: '5-12', gradient: 'from-sky-500 to-blue-600', favorited: false },
  { id: 'f3', name: '1-on-1 Check-in', duration: '30min', participants: '2', gradient: 'from-violet-500 to-purple-600', favorited: true },
  { id: 'f4', name: 'All Hands', duration: '60min', participants: '20+', gradient: 'from-amber-500 to-orange-600', favorited: false },
]

// ── Component ──────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const { setCurrentView } = useAppStore()
  const [featured, setFeatured] = useState<FeaturedTemplate[]>(initialFeatured)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', description: '', duration: '30m', maxParticipants: '10',
    recording: true, transcription: false, aiAssistant: true, waitingRoom: false, muteOnEntry: false,
    agenda: '',
  })

  // Fetch templates from API
  const fetchTemplates = useCallback(async () => {
 setLoading(true)
    try {
      const res = await authFetch('/api/v1/templates')
      if (!res.ok) return
      const json = await res.json()
      if (json.success && json.data?.templates) {
        setTemplates(json.data.templates)
      }
    } catch {
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const resetForm = () => setForm({ name: '', description: '', duration: '30m', maxParticipants: '10', recording: true, transcription: false, aiAssistant: true, waitingRoom: false, muteOnEntry: false, agenda: '' })

  const openBuilder = (id?: string) => {
    if (id) {
      const t = templates.find(x => x.id === id)
      if (t) {
        setForm({
          name: t.name, description: t.description, duration: t.duration, maxParticipants: t.maxParticipants,
          recording: t.settings.includes('Recording ON'), transcription: t.settings.includes('Transcription'),
          aiAssistant: t.settings.includes('AI Assistant'), waitingRoom: t.settings.includes('Waiting Room'),
          muteOnEntry: t.settings.includes('Mute on Entry'), agenda: t.agenda || '',
        })
        setEditId(id)
      }
    } else {
      resetForm()
      setEditId(null)
    }
    setBuilderOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)

    const settings: string[] = []
    if (form.recording) settings.push('Recording ON')
    if (form.transcription) settings.push('Transcription')
    if (form.aiAssistant) settings.push('AI Assistant')
    if (form.waitingRoom) settings.push('Waiting Room')
    if (form.muteOnEntry) settings.push('Mute on Entry')

    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        duration: form.duration,
        maxParticipants: parseInt(form.maxParticipants) || 10,
        settings,
        agenda: form.agenda.trim(),
      }

      if (editId) {
        // For edit: create a new version (templates API doesn't have PUT)
        // Instead, create a new template and delete the old one
        const t = templates.find(x => x.id === editId)
        const bodyWithStyle = {
          ...body,
          gradient: t?.gradient || 'from-sky-500 to-blue-500',
          iconBg: t?.iconBg || 'from-sky-500 to-blue-600',
        }

        if (t?.isBuiltin) {
          // Builtin templates: create a copy instead of editing
          const res = await authFetch('/api/v1/templates', {
            method: 'POST',
            body: JSON.stringify({ ...bodyWithStyle, name: form.name.trim() }),
          })
          if (!res.ok) {
            const err = await res.json().catch(() => null)
            toast.error(err?.error?.message || 'Failed to update template')
            return
          }
          toast.success(`Created copy: "${form.name.trim()}" (built-in templates cannot be modified directly)`)
        } else {
          // Custom template: delete old and create new
          await authFetch(`/api/v1/templates?id=${editId}`, { method: 'DELETE' })
          const res = await authFetch('/api/v1/templates', {
            method: 'POST',
            body: JSON.stringify(bodyWithStyle),
          })
          if (!res.ok) {
            const err = await res.json().catch(() => null)
            toast.error(err?.error?.message || 'Failed to update template')
            return
          }
          toast.success(`Template "${form.name.trim()}" updated!`)
        }
      } else {
        const res = await authFetch('/api/v1/templates', {
          method: 'POST',
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => null)
          toast.error(err?.error?.message || 'Failed to create template')
          return
        }
        toast.success(`Template "${form.name.trim()}" created!`)
      }

      setBuilderOpen(false)
      resetForm()
      fetchTemplates()
    } catch {
      toast.error('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const handleDuplicate = async (id: string) => {
    const t = templates.find(x => x.id === id)
    if (!t) return

    try {
      const res = await authFetch('/api/v1/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: `${t.name} (Copy)`,
          description: t.description,
          duration: t.duration,
          maxParticipants: parseInt(t.maxParticipants) || 10,
          settings: t.settings,
          agenda: t.agenda || '',
          gradient: t.gradient,
          iconBg: t.iconBg,
        }),
      })
      if (!res.ok) {
        toast.error('Failed to duplicate template')
        return
      }
      toast.success('Template duplicated!')
      fetchTemplates()
    } catch {
      toast.error('Failed to duplicate template')
    }
  }

  const handleDelete = async (id: string) => {
    const t = templates.find(x => x.id === id)
    if (!t) return
    if (t.isBuiltin) {
      toast.error('Cannot delete built-in templates')
      return
    }
    setDeletingId(id)
    try {
      const res = await authFetch(`/api/v1/templates?id=${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        toast.error(err?.error?.message || 'Failed to delete template')
        return
      }
      toast.success('Template deleted.')
      fetchTemplates()
    } catch {
      toast.error('Failed to delete template')
    } finally {
      setDeletingId(null)
    }
  }

  const toggleFavorite = (id: string) => {
    setFeatured(prev => prev.map(f => f.id === id ? { ...f, favorited: !f.favorited } : f))
  }

  const handleUseTemplate = (name: string) => {
    toast.success(`Starting meeting from "${name}" template!`)
    setCurrentView('meeting-room')
  }

  const quickStart = (type: string) => {
    toast.success(`Starting ${type} meeting!`)
    setCurrentView('meeting-room')
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='relative'>
        <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4'>
          <div>
            <h2 className='text-3xl font-bold tracking-tight flex items-center gap-3'>
              <LayoutTemplate className='h-8 w-8 text-primary' />
              Meeting Templates
            </h2>
            <p className='text-muted-foreground text-sm mt-1'>Pre-configured meeting setups for faster scheduling</p>
            <div className='h-1 w-12 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 mt-2' />
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant='outline' className='gap-1.5 px-3 py-1 text-sm border-sky-200 bg-sky-500/5 text-sky-600 dark:border-sky-800 dark:text-sky-400'>
              <LayoutTemplate className='h-3.5 w-3.5' /> Saved Templates: {templates.length}
            </Badge>
            <Dialog open={builderOpen} onOpenChange={(open) => { setBuilderOpen(open); if (!open) resetForm() }}>
              <DialogTrigger asChild>
                <Button className='gap-2 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 hover:scale-[1.02] active:scale-[0.98] transition-all' onClick={() => openBuilder()}>
                  <Plus className='h-4 w-4' /> Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
                <DialogHeader>
                  <div className='flex items-center gap-3 mb-2'>
                    <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center'>
                      <Sparkles className='h-5 w-5 text-white' />
                    </div>
                    <div>
                      <DialogTitle>{editId ? 'Edit Template' : 'Create Template'}</DialogTitle>
                      <p className='text-sm text-muted-foreground mt-0.5'>Configure default meeting settings</p>
                    </div>
                  </div>
                </DialogHeader>
                <div className='space-y-4 pt-2'>
                  <div className='space-y-2'><Label>Template Name</Label><Input placeholder='e.g. Weekly Team Sync' value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                  <div className='space-y-2'><Label>Description</Label><Textarea placeholder='Brief description of this template...' rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label>Default Duration</Label>
                      <Select value={form.duration} onValueChange={v => setForm(p => ({ ...p, duration: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value='15m'>15 minutes</SelectItem>
                          <SelectItem value='30m'>30 minutes</SelectItem>
                          <SelectItem value='45m'>45 minutes</SelectItem>
                          <SelectItem value='60m'>60 minutes</SelectItem>
                          <SelectItem value='90m'>90 minutes</SelectItem>
                          <SelectItem value='120m'>2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='space-y-2'>
                      <Label>Default Max Participants</Label>
                      <Input type='number' min='2' max='100' value={form.maxParticipants} onChange={e => setForm(p => ({ ...p, maxParticipants: e.target.value }))} />
                    </div>
                  </div>
                  <Separator />
                  <div className='space-y-3'>
                    <Label className='text-sm font-medium'>Meeting Options</Label>
                    {([['recording', 'Recording', 'Automatically record meetings'], ['transcription', 'Transcription', 'Enable real-time transcription'], ['aiAssistant', 'AI Assistant', 'Enable AI meeting assistant'], ['waitingRoom', 'Waiting Room', 'Require host approval to join'], ['muteOnEntry', 'Mute on Entry', 'Participants join muted']] as const).map(([key, label, desc]) => (
                      <div key={key} className='flex items-center justify-between rounded-lg border border-border/50 p-3 bg-card/50 backdrop-blur-sm'>
                        <div><p className='text-sm font-medium'>{label}</p><p className='text-xs text-muted-foreground'>{desc}</p></div>
                        <Switch checked={form[key]} onCheckedChange={v => setForm(p => ({ ...p, [key]: v }))} />
                      </div>
                    ))}
                  </div>
                  <div className='space-y-2'>
                    <Label>Default Agenda</Label>
                    <Textarea placeholder='1. Welcome & introductions&#10;2. Discussion topics&#10;3. Action items' rows={4} value={form.agenda} onChange={e => setForm(p => ({ ...p, agenda: e.target.value }))} />
                  </div>
                  <div className='flex justify-end gap-3 pt-2'>
                    <Button variant='outline' onClick={() => setBuilderOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!form.name.trim() || saving} className='bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 hover:scale-[1.02] active:scale-[0.98] transition-all'>
                      {saving ? <Loader2 className='h-4 w-4 animate-spin mr-2' /> : null}
                      {editId ? 'Save Changes' : 'Create Template'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Featured Templates - Horizontal Scroll */}
      <div>
        <h3 className='text-lg font-semibold mb-3 flex items-center gap-2'><Sparkles className='h-4 w-4 text-amber-500' /> Featured Templates</h3>
        <div className='flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin'>
          {featured.map(f => (
            <motion.div key={f.id} variants={item} initial='hidden' animate='show' className='snap-start shrink-0'>
              <Card className={`relative w-64 overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br ${f.gradient}`}>
                <CardContent className='p-5 text-white relative z-10'>
                  <button onClick={() => toggleFavorite(f.id)} className='absolute top-3 right-3 z-20 p-1.5 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors'>
                    <Star className={`h-4 w-4 ${f.favorited ? 'fill-yellow-300 text-yellow-300' : 'text-white'}`} />
                  </button>
                  <div className='absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,white/0.1,transparent_60%)]' />
                  <h4 className='text-lg font-bold mb-3 relative'>{f.name}</h4>
                  <div className='flex items-center gap-3 mb-4 relative'>
                    <span className='flex items-center gap-1 text-xs bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1'><Clock className='h-3 w-3' />{f.duration}</span>
                    <span className='flex items-center gap-1 text-xs bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1'><Users className='h-3 w-3' />{f.participants}</span>
                  </div>
                  <Button size='sm' className='w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all' onClick={() => handleUseTemplate(f.name)}>
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Template Grid */}
      <div>
        <h3 className='text-lg font-semibold mb-3 flex items-center gap-2'><LayoutTemplate className='h-4 w-4 text-primary' /> All Templates</h3>
        {loading ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className='border border-border/50 h-[280px]'>
                <CardContent className='p-4 space-y-3'>
                  <Skeleton className='h-10 w-10 rounded-xl' />
                  <Skeleton className='h-4 w-2/3' />
                  <Skeleton className='h-3 w-full' />
                  <Skeleton className='h-3 w-1/2' />
                  <div className='flex gap-2 mt-2'><Skeleton className='h-5 w-16' /><Skeleton className='h-5 w-16' /></div>
                  <Skeleton className='h-8 w-full mt-4' />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <motion.div variants={container} initial='hidden' animate='show' className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {templates.map(t => (
              <motion.div key={t.id} variants={item}>
                <Card className='group border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5 h-full flex flex-col overflow-hidden relative'>
                  <div className={`h-0.5 w-full bg-gradient-to-r ${t.gradient}`} />
                  <CardContent className='p-4 flex flex-col flex-1'>
                    <div className='flex items-start justify-between mb-3'>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.iconBg} flex items-center justify-center shadow-sm`}>{getTemplateIcon(t.name)}</div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant='ghost' size='icon' className='h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity'><MoreVertical className='h-4 w-4' /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem className='gap-2' onClick={() => openBuilder(t.id)}><Pencil className='h-4 w-4' /> Edit</DropdownMenuItem>
                          <DropdownMenuItem className='gap-2' onClick={() => handleDuplicate(t.id)}><Copy className='h-4 w-4' /> Duplicate</DropdownMenuItem>
                          {!t.isBuiltin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className='gap-2 text-red-600' onClick={() => handleDelete(t.id)} disabled={deletingId === t.id}>
                                {deletingId === t.id ? <Loader2 className='h-4 w-4 animate-spin' /> : <Trash2 className='h-4 w-4' />}
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h4 className='font-semibold text-sm mb-1'>{t.name}</h4>
                    <p className='text-xs text-muted-foreground line-clamp-2 mb-3 flex-1'>{t.description}</p>
                    <div className='flex items-center gap-1.5 mb-3 flex-wrap'>
                      <Badge variant='outline' className='text-[10px] gap-1 px-1.5 py-0'><Clock className='h-2.5 w-2.5' />{t.duration}</Badge>
                      <Badge variant='outline' className='text-[10px] gap-1 px-1.5 py-0'><Users className='h-2.5 w-2.5' />{t.maxParticipants}</Badge>
                    </div>
                    <div className='flex flex-wrap gap-1 mb-4'>
                      {t.settings.map(s => (
                        <span key={s} className='text-[10px] px-1.5 py-0.5 rounded-full bg-primary/5 text-primary border border-primary/10'>{s}</span>
                      ))}
                    </div>
                    <Button size='sm' variant='outline' className='w-full gap-1.5 mt-auto hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={() => handleUseTemplate(t.name)}>Use</Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <Separator />

      {/* Quick Start Section */}
      <div>
        <h3 className='text-lg font-semibold mb-3 flex items-center gap-2'><Sparkles className='h-4 w-4 text-primary' /> Quick Start</h3>
        <motion.div variants={container} initial='hidden' animate='show' className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          {([
            { name: 'Instant Meeting', desc: 'Start a video call right now with camera and mic', icon: <Video className='h-6 w-6 text-white' />, gradient: 'from-emerald-500 to-emerald-600', hoverShadow: 'hover:shadow-emerald-500/20', type: 'Instant Video' },
            { name: 'Audio Only', desc: 'Voice-only meeting for quick discussions', icon: <Mic className='h-6 w-6 text-white' />, gradient: 'from-amber-500 to-amber-600', hoverShadow: 'hover:shadow-amber-500/20', type: 'Audio Only' },
            { name: 'Screen Share Only', desc: 'Share your screen without camera', icon: <Monitor className='h-6 w-6 text-white' />, gradient: 'from-sky-500 to-sky-600', hoverShadow: 'hover:shadow-sky-500/20', type: 'Screen Share' },
          ] as const).map(q => (
            <motion.div key={q.name} variants={item}>
              <Card className={`group cursor-pointer border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg ${q.hoverShadow} transition-all duration-300 hover:-translate-y-0.5`} onClick={() => quickStart(q.type)}>
                <CardContent className='p-5'>
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${q.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {q.icon}
                  </div>
                  <h4 className='font-semibold text-sm mb-1'>{q.name}</h4>
                  <p className='text-xs text-muted-foreground'>{q.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
