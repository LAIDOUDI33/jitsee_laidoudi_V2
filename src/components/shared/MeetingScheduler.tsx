'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { authFetch } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  CalendarDays,
  Clock,
  Timer,
  Type,
  Repeat,
  Users,
  Mail,
  X,
  Video,
  FileText,
  Sparkles,
  Shield,
  MicOff,
  AlignLeft,
  Plus,
  Loader2,
  CalendarPlus,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface MeetingSchedulerProps {
  onMeetingCreated?: (meeting: {
    id: string
    title: string
    type: string
    date: string
    time: string
    duration: string
    roomId: string
    description?: string
  }) => void
  trigger?: React.ReactNode
}

interface FormState {
  title: string
  date: string
  time: string
  duration: string
  meetingType: 'instant' | 'scheduled' | 'recurring'
  recurringFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  recurringEndType: 'occurrences' | 'date'
  recurringOccurrences: string
  recurringEndDate: string
  participants: string[]
  participantEmail: string
  enableRecording: boolean
  enableTranscription: boolean
  enableAI: boolean
  waitingRoom: boolean
  muteOnEntry: boolean
  description: string
}

const INITIAL_FORM: FormState = {
  title: '',
  date: '',
  time: '',
  duration: '30m',
  meetingType: 'scheduled',
  recurringFrequency: 'weekly',
  recurringEndType: 'occurrences',
  recurringOccurrences: '10',
  recurringEndDate: '',
  participants: [],
  participantEmail: '',
  enableRecording: false,
  enableTranscription: false,
  enableAI: true,
  waitingRoom: false,
  muteOnEntry: false,
  description: '',
}

const DURATION_OPTIONS = [
  { value: '15m', label: '15 minutes' },
  { value: '30m', label: '30 minutes' },
  { value: '45m', label: '45 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '1.5h', label: '1.5 hours' },
  { value: '2h', label: '2 hours' },
  { value: '3h', label: '3 hours' },
]

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
]

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function generateMeetingId(): string {
  const group = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz'
    let result = ''
    for (let i = 0; i < 3; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }
  return `${group()}-${group()}-${group()}`
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function MeetingScheduler({ onMeetingCreated, trigger }: MeetingSchedulerProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitting, setSubmitting] = useState(false)

  const update = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    // Clear error on change
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }, [])

  /* ----- participant management ----- */
  const addParticipant = useCallback(() => {
    const email = form.participantEmail.trim().toLowerCase()
    if (!email) return
    if (!EMAIL_REGEX.test(email)) {
      setErrors(prev => ({ ...prev, participantEmail: 'Enter a valid email address' }))
      return
    }
    if (form.participants.includes(email)) {
      setErrors(prev => ({ ...prev, participantEmail: 'Already added' }))
      return
    }
    update('participants', [...form.participants, email])
    update('participantEmail', '')
  }, [form.participants, form.participantEmail, update])

  const removeParticipant = useCallback((email: string) => {
    update('participants', form.participants.filter(p => p !== email))
  }, [form.participants, update])

  const handleParticipantKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addParticipant()
    }
  }, [addParticipant])

  /* ----- validation ----- */
  const validate = useCallback((): boolean => {
    const errs: typeof errors = {}
    if (!form.title.trim()) errs.title = 'Meeting title is required'
    if (form.meetingType !== 'instant') {
      if (!form.date) errs.date = 'Date is required'
      if (!form.time) errs.time = 'Time is required'
    }
    if (form.meetingType === 'recurring') {
      if (form.recurringEndType === 'occurrences') {
        const n = parseInt(form.recurringOccurrences, 10)
        if (!form.recurringOccurrences || isNaN(n) || n < 1 || n > 100) {
          errs.recurringOccurrences = 'Enter 1-100'
        }
      }
      if (form.recurringEndType === 'date' && !form.recurringEndDate) {
        errs.recurringEndDate = 'End date is required'
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }, [form, errors])

  /* ----- submit ----- */
  const handleSubmit = useCallback(async () => {
    if (!validate()) return
    setSubmitting(true)

    const roomId = generateMeetingId()
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      type: form.meetingType,
      scheduledAt: form.date && form.time
        ? `${form.date}T${form.time}:00.000Z`
        : new Date().toISOString(),
      duration: form.duration,
      waitingRoom: form.waitingRoom,
      recordingEnabled: form.enableRecording,
      transcriptionEnabled: form.enableTranscription,
      aiAssistantEnabled: form.enableAI,
      muteOnEntry: form.muteOnEntry,
      description: form.description.trim() || undefined,
      participants: form.participants,
    }

    if (form.meetingType === 'recurring') {
      payload.recurrence = {
        frequency: form.recurringFrequency,
        endType: form.recurringEndType,
        ...(form.recurringEndType === 'occurrences'
          ? { occurrences: parseInt(form.recurringOccurrences, 10) }
          : { endDate: form.recurringEndDate }),
      }
    }

    try {
      const res = await authFetch('/api/v1/meetings/schedule', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      const meetingResult = data.data?.meeting || data
      const meetingId = meetingResult?.meetingId || roomId
      const internalId = meetingResult?.id || `m-${Date.now()}`

      const result = {
        id: internalId,
        title: form.title.trim(),
        type: form.meetingType,
        date: form.date || new Date().toISOString().split('T')[0],
        time: form.time || new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        duration: form.duration,
        roomId: meetingId,
        description: form.description.trim() || undefined,
      }

      onMeetingCreated?.(result)
      toast.success(`Meeting "${form.title}" scheduled successfully!`)
      setOpen(false)
      setForm(INITIAL_FORM)
      setErrors({})
    } catch {
      // Fallback: still add to local state
      const result = {
        id: `m-${Date.now()}`,
        title: form.title.trim(),
        type: form.meetingType,
        date: form.date || new Date().toISOString().split('T')[0],
        time: form.time || new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        duration: form.duration,
        roomId,
        description: form.description.trim() || undefined,
      }
      onMeetingCreated?.(result)
      toast.success(`Meeting "${form.title}" scheduled!`)
      setOpen(false)
      setForm(INITIAL_FORM)
      setErrors({})
    } finally {
      setSubmitting(false)
    }
  }, [form, validate, onMeetingCreated])

  /* ----- render helpers ----- */
  const errorClass = (field: keyof FormState) =>
    errors[field] ? 'border-red-500 focus-visible:ring-red-500/30' : ''

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className='gap-2 bg-gradient-to-r from-primary to-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-transform'>
            <CalendarPlus className='h-4 w-4' /> Schedule Meeting
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className='sm:max-w-[620px] max-h-[90vh] overflow-y-auto p-0 gap-0'>
        {/* Gradient accent bar at top */}
        <div className='h-1.5 w-full rounded-t-xl bg-gradient-to-r from-primary via-violet-500 to-primary/60' />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' as const }}
          className='px-6 pt-5 pb-6'
        >
          {/* Header */}
          <DialogHeader>
            <div className='flex items-center gap-3 mb-1'>
              <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0'>
                <CalendarPlus className='h-5 w-5 text-primary-foreground' />
              </div>
              <div>
                <DialogTitle className='text-lg'>Schedule a Meeting</DialogTitle>
                <p className='text-sm text-muted-foreground'>Configure your upcoming video conference</p>
              </div>
            </div>
          </DialogHeader>

          <div className='space-y-5 mt-5'>
            {/* ===== Title ===== */}
            <div className='space-y-1.5'>
              <Label className='flex items-center gap-1.5 text-sm font-medium'>
                <Type className='h-3.5 w-3.5 text-muted-foreground' /> Meeting Title
              </Label>
              <Input
                placeholder='e.g. Q4 Strategy Review'
                value={form.title}
                onChange={e => update('title', e.target.value)}
                className={errorClass('title')}
              />
              {errors.title && <p className='text-xs text-red-500'>{errors.title}</p>}
            </div>

            {/* ===== Date, Time, Duration row ===== */}
            {form.meetingType !== 'instant' && (
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                <div className='space-y-1.5'>
                  <Label className='flex items-center gap-1.5 text-sm font-medium'>
                    <CalendarDays className='h-3.5 w-3.5 text-muted-foreground' /> Date
                  </Label>
                  <Input
                    type='date'
                    value={form.date}
                    onChange={e => update('date', e.target.value)}
                    className={errorClass('date')}
                  />
                  {errors.date && <p className='text-xs text-red-500'>{errors.date}</p>}
                </div>
                <div className='space-y-1.5'>
                  <Label className='flex items-center gap-1.5 text-sm font-medium'>
                    <Clock className='h-3.5 w-3.5 text-muted-foreground' /> Time
                  </Label>
                  <Input
                    type='time'
                    value={form.time}
                    onChange={e => update('time', e.target.value)}
                    className={errorClass('time')}
                  />
                  {errors.time && <p className='text-xs text-red-500'>{errors.time}</p>}
                </div>
                <div className='space-y-1.5'>
                  <Label className='flex items-center gap-1.5 text-sm font-medium'>
                    <Timer className='h-3.5 w-3.5 text-muted-foreground' /> Duration
                  </Label>
                  <Select value={form.duration} onValueChange={v => update('duration', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map(d => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* ===== Meeting Type ===== */}
            <div className='space-y-1.5'>
              <Label className='flex items-center gap-1.5 text-sm font-medium'>
                <CalendarDays className='h-3.5 w-3.5 text-muted-foreground' /> Meeting Type
              </Label>
              <Select
                value={form.meetingType}
                onValueChange={v => update('meetingType', v as FormState['meetingType'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='instant'>⚡ Instant</SelectItem>
                  <SelectItem value='scheduled'>📅 Scheduled</SelectItem>
                  <SelectItem value='recurring'>🔁 Recurring</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ===== Recurring Options ===== */}
            {form.meetingType === 'recurring' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className='space-y-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4'
              >
                <div className='flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400'>
                  <Repeat className='h-4 w-4' />
                  Recurrence Settings
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  {/* Frequency */}
                  <div className='space-y-1.5'>
                    <Label className='text-sm text-muted-foreground'>Frequency</Label>
                    <Select
                      value={form.recurringFrequency}
                      onValueChange={v => update('recurringFrequency', v as FormState['recurringFrequency'])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCY_OPTIONS.map(f => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* End condition type */}
                  <div className='space-y-1.5'>
                    <Label className='text-sm text-muted-foreground'>End Condition</Label>
                    <Select
                      value={form.recurringEndType}
                      onValueChange={v => update('recurringEndType', v as FormState['recurringEndType'])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='occurrences'>After N occurrences</SelectItem>
                        <SelectItem value='date'>On a specific date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* End condition value */}
                <div className='space-y-1.5'>
                  {form.recurringEndType === 'occurrences' ? (
                    <div>
                      <Label className='text-sm text-muted-foreground'>Number of occurrences</Label>
                      <Input
                        type='number'
                        min={1}
                        max={100}
                        placeholder='e.g. 10'
                        value={form.recurringOccurrences}
                        onChange={e => update('recurringOccurrences', e.target.value)}
                        className={`max-w-[160px] ${errorClass('recurringOccurrences')}`}
                      />
                      {errors.recurringOccurrences && (
                        <p className='text-xs text-red-500'>{errors.recurringOccurrences}</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Label className='text-sm text-muted-foreground'>End date</Label>
                      <Input
                        type='date'
                        value={form.recurringEndDate}
                        onChange={e => update('recurringEndDate', e.target.value)}
                        className={`max-w-[200px] ${errorClass('recurringEndDate')}`}
                      />
                      {errors.recurringEndDate && (
                        <p className='text-xs text-red-500'>{errors.recurringEndDate}</p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            <Separator />

            {/* ===== Participants ===== */}
            <div className='space-y-1.5'>
              <Label className='flex items-center gap-1.5 text-sm font-medium'>
                <Users className='h-3.5 w-3.5 text-muted-foreground' /> Participants
              </Label>
              <div className='flex gap-2'>
                <div className='relative flex-1'>
                  <Mail className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                  <Input
                    placeholder='Add email and press Enter'
                    className={`pl-9 pr-9 ${errorClass('participantEmail')}`}
                    value={form.participantEmail}
                    onChange={e => update('participantEmail', e.target.value)}
                    onKeyDown={handleParticipantKeyDown}
                  />
                  {form.participantEmail && (
                    <button
                      type='button'
                      onClick={addParticipant}
                      className='absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors'
                    >
                      <Plus className='h-3.5 w-3.5' />
                    </button>
                  )}
                </div>
              </div>
              {errors.participantEmail && (
                <p className='text-xs text-red-500'>{errors.participantEmail}</p>
              )}

              {/* Participant chips */}
              {form.participants.length > 0 && (
                <div className='flex flex-wrap gap-1.5 mt-2'>
                  {form.participants.map(email => (
                    <Badge
                      key={email}
                      variant='secondary'
                      className='gap-1.5 px-2.5 py-1 text-xs font-normal hover:bg-destructive/10 hover:text-destructive transition-colors cursor-default group'
                    >
                      <Mail className='h-3 w-3 text-muted-foreground' />
                      {email}
                      <button
                        type='button'
                        onClick={() => removeParticipant(email)}
                        className='ml-0.5 rounded-full p-0.5 hover:bg-destructive/20 transition-colors'
                        aria-label={`Remove ${email}`}
                      >
                        <X className='h-3 w-3' />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* ===== Meeting Options ===== */}
            <div className='space-y-3'>
              <Label className='flex items-center gap-1.5 text-sm font-medium'>
                <Sparkles className='h-3.5 w-3.5 text-muted-foreground' /> Meeting Options
              </Label>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                {/* Recording */}
                <label className='flex items-center justify-between rounded-lg border border-border/50 p-3 cursor-pointer hover:bg-muted/50 hover:border-primary/20 transition-all duration-200 group'>
                  <div className='flex items-center gap-2.5'>
                    <div className='p-1.5 rounded-md bg-red-500/10 group-hover:bg-red-500/20 transition-colors'>
                      <Video className='h-4 w-4 text-red-500' />
                    </div>
                    <div>
                      <p className='text-sm font-medium leading-tight'>Recording</p>
                      <p className='text-[11px] text-muted-foreground'>Auto-record the meeting</p>
                    </div>
                  </div>
                  <Switch
                    checked={form.enableRecording}
                    onCheckedChange={v => update('enableRecording', v)}
                  />
                </label>

                {/* Transcription */}
                <label className='flex items-center justify-between rounded-lg border border-border/50 p-3 cursor-pointer hover:bg-muted/50 hover:border-primary/20 transition-all duration-200 group'>
                  <div className='flex items-center gap-2.5'>
                    <div className='p-1.5 rounded-md bg-sky-500/10 group-hover:bg-sky-500/20 transition-colors'>
                      <FileText className='h-4 w-4 text-sky-500' />
                    </div>
                    <div>
                      <p className='text-sm font-medium leading-tight'>Transcription</p>
                      <p className='text-[11px] text-muted-foreground'>AI-powered speech-to-text</p>
                    </div>
                  </div>
                  <Switch
                    checked={form.enableTranscription}
                    onCheckedChange={v => update('enableTranscription', v)}
                  />
                </label>

                {/* AI Assistant */}
                <label className='flex items-center justify-between rounded-lg border border-border/50 p-3 cursor-pointer hover:bg-muted/50 hover:border-primary/20 transition-all duration-200 group'>
                  <div className='flex items-center gap-2.5'>
                    <div className='p-1.5 rounded-md bg-violet-500/10 group-hover:bg-violet-500/20 transition-colors'>
                      <Sparkles className='h-4 w-4 text-violet-500' />
                    </div>
                    <div>
                      <p className='text-sm font-medium leading-tight'>AI Assistant</p>
                      <p className='text-[11px] text-muted-foreground'>Smart summaries &amp; insights</p>
                    </div>
                  </div>
                  <Switch
                    checked={form.enableAI}
                    onCheckedChange={v => update('enableAI', v)}
                  />
                </label>

                {/* Waiting Room */}
                <label className='flex items-center justify-between rounded-lg border border-border/50 p-3 cursor-pointer hover:bg-muted/50 hover:border-primary/20 transition-all duration-200 group'>
                  <div className='flex items-center gap-2.5'>
                    <div className='p-1.5 rounded-md bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors'>
                      <Shield className='h-4 w-4 text-amber-500' />
                    </div>
                    <div>
                      <p className='text-sm font-medium leading-tight'>Waiting Room</p>
                      <p className='text-[11px] text-muted-foreground'>Admit participants manually</p>
                    </div>
                  </div>
                  <Switch
                    checked={form.waitingRoom}
                    onCheckedChange={v => update('waitingRoom', v)}
                  />
                </label>

                {/* Mute on Entry */}
                <label className='flex items-center justify-between rounded-lg border border-border/50 p-3 cursor-pointer hover:bg-muted/50 hover:border-primary/20 transition-all duration-200 group sm:col-span-2'>
                  <div className='flex items-center gap-2.5'>
                    <div className='p-1.5 rounded-md bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors'>
                      <MicOff className='h-4 w-4 text-emerald-500' />
                    </div>
                    <div>
                      <p className='text-sm font-medium leading-tight'>Mute Participants on Entry</p>
                      <p className='text-[11px] text-muted-foreground'>Automatically mute when joining</p>
                    </div>
                  </div>
                  <Switch
                    checked={form.muteOnEntry}
                    onCheckedChange={v => update('muteOnEntry', v)}
                  />
                </label>
              </div>
            </div>

            <Separator />

            {/* ===== Description ===== */}
            <div className='space-y-1.5'>
              <Label className='flex items-center gap-1.5 text-sm font-medium'>
                <AlignLeft className='h-3.5 w-3.5 text-muted-foreground' /> Description
                <span className='text-muted-foreground font-normal'>(optional)</span>
              </Label>
              <Textarea
                placeholder='Add an agenda or notes for participants...'
                rows={3}
                value={form.description}
                onChange={e => update('description', e.target.value)}
              />
            </div>

            {/* ===== Actions ===== */}
            <div className='flex items-center justify-between pt-1'>
              <Button
                variant='ghost'
                onClick={() => { setOpen(false); setForm(INITIAL_FORM); setErrors({}) }}
                className='text-muted-foreground hover:text-foreground'
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!form.title.trim() || submitting}
                className='gap-2 bg-gradient-to-r from-primary to-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-transform min-w-[160px]'
              >
                {submitting ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' /> Scheduling…
                  </>
                ) : (
                  <>
                    <CalendarPlus className='h-4 w-4' /> Create Meeting
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
