'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Link2,
  Check,
  QrCode,
  Mail,
  Copy,
  Calendar,
  Download,
  User,
  Clock,
  Lock,
  Send,
  ExternalLink,
} from 'lucide-react'
import { authFetch } from '@/lib/api'

interface MeetingInviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  meetingId: string
  meetingTitle: string
  hostName: string
  startTime?: string
  password?: string
  joinUrl?: string
}

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

function formatDateTime(iso?: string): string {
  if (!iso) return 'Not scheduled'
  try {
    const d = new Date(iso)
    return d.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    })
  } catch {
    return iso
  }
}

function buildInviteText(opts: {
  title: string
  joinUrl: string
  hostName: string
  startTime?: string
  password?: string
}): string {
  const lines: string[] = [
    `You're invited to join a meeting on ALVISION.`,
    '',
    `📅 ${formatDateTime(opts.startTime)}`,
    `🔗 ${opts.joinUrl}`,
    `📝 ${opts.title}`,
    `👤 Hosted by ${opts.hostName}`,
  ]
  if (opts.password) {
    lines.push(`🔑 Passcode: ${opts.password}`)
  }
  lines.push('', 'Join from your browser — no download required.')
  return lines.join('\n')
}

function buildIcsBlob(opts: {
  title: string
  joinUrl: string
  hostName: string
  startTime?: string
  meetingId: string
}): Blob {
  const now = new Date()
  const start = opts.startTime ? new Date(opts.startTime) : new Date(now.getTime() + 3600000)
  const end = new Date(start.getTime() + 3600000)

  const pad = (n: number) => String(n).padStart(2, '0')
  const fmtIcs = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`

  const uid = `${opts.meetingId}@alvision.ai`

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ALVISION//Meeting Invite//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${fmtIcs(now)}`,
    `DTSTART:${fmtIcs(start)}`,
    `DTEND:${fmtIcs(end)}`,
    `SUMMARY:${opts.title}`,
    `DESCRIPTION:Join meeting: ${opts.joinUrl}\nHosted by ${opts.hostName}`,
    `URL:${opts.joinUrl}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  return new Blob([ics], { type: 'text/calendar;charset=utf-8' })
}

function buildGoogleCalendarUrl(opts: {
  title: string
  joinUrl: string
  startTime?: string
}): string {
  const now = new Date()
  const start = opts.startTime ? new Date(opts.startTime) : new Date(now.getTime() + 3600000)
  const end = new Date(start.getTime() + 3600000)

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: opts.title,
    details: `Join meeting: ${opts.joinUrl}\nJoin from your browser — no download required.`,
    location: opts.joinUrl,
    dates: `${fmt(start)}/${fmt(end)}`,
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function buildOutlookCalendarUrl(opts: {
  title: string
  joinUrl: string
  startTime?: string
}): string {
  const now = new Date()
  const start = opts.startTime ? new Date(opts.startTime) : new Date(now.getTime() + 3600000)
  const end = new Date(start.getTime() + 3600000)

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: opts.title,
    body: `Join meeting: ${opts.joinUrl}\nJoin from your browser — no download required.`,
    location: opts.joinUrl,
    startdt: fmt(start),
    enddt: fmt(end),
  })

  return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`
}

export default function MeetingInviteDialog({
  open,
  onOpenChange,
  meetingId,
  meetingTitle,
  hostName,
  startTime,
  password,
  joinUrl: propJoinUrl,
}: MeetingInviteDialogProps) {
  const joinUrl = propJoinUrl || `https://alvision.ai/join/${meetingId}`

  const [linkCopied, setLinkCopied] = useState(false)
  const [textCopied, setTextCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [emails, setEmails] = useState('')

  const inviteText = useMemo(
    () =>
      buildInviteText({
        title: meetingTitle,
        joinUrl,
        hostName,
        startTime,
        password,
      }),
    [meetingTitle, joinUrl, hostName, startTime, password]
  )

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(joinUrl)
      setLinkCopied(true)
      toast.success('Invite link copied!')
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      toast.error('Failed to copy link')
    }
  }, [joinUrl])

  const handleCopyInviteText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteText)
      setTextCopied(true)
      toast.success('Invite text copied!')
      setTimeout(() => setTextCopied(false), 2000)
    } catch {
      toast.error('Failed to copy invite text')
    }
  }, [inviteText])

  const handleSendInvite = useCallback(async () => {
    const emailList = emails
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0)
    if (emailList.length === 0) {
      toast.error('Please enter at least one email address')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalid = emailList.find((e) => !emailRegex.test(e))
    if (invalid) {
      toast.error(`Invalid email: ${invalid}`)
      return
    }

    setSending(true)
    try {
      const res = await authFetch(`/api/v1/meetings/${meetingId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ emails: emailList, message: inviteText }),
      })
      if (res.ok) {
        toast.success(`Invite sent to ${emailList.length} recipient${emailList.length > 1 ? 's' : ''}!`)
        setEmails('')
      } else {
        toast.error('Failed to send invite')
      }
    } catch {
      toast.error('Failed to send invite')
    } finally {
      setSending(false)
    }
  }, [emails, inviteText, meetingId])

  const handleDownloadIcs = useCallback(() => {
    const blob = buildIcsBlob({
      title: meetingTitle,
      joinUrl,
      hostName,
      startTime,
      meetingId,
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${meetingTitle.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_').slice(0, 50)}.ics`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Calendar file downloaded!')
  }, [meetingTitle, joinUrl, hostName, startTime, meetingId])

  const handleGoogleCalendar = useCallback(() => {
    const url = buildGoogleCalendarUrl({ title: meetingTitle, joinUrl, startTime })
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [meetingTitle, joinUrl, startTime])

  const handleOutlookCalendar = useCallback(() => {
    const url = buildOutlookCalendarUrl({ title: meetingTitle, joinUrl, startTime })
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [meetingTitle, joinUrl, startTime])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-lg font-semibold'>
            Invite People to {meetingTitle}
          </DialogTitle>
          <DialogDescription className='text-sm text-muted-foreground'>
            Share this meeting with others via link, email, or calendar invite.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-5 pt-2'>
          {/* ═══ Share Link Section ═══ */}
          <motion.div variants={sectionVariants} initial='hidden' animate='show'>
            <div className='space-y-3'>
              <div className='flex items-center gap-2 text-sm font-medium'>
                <Link2 className='h-4 w-4 text-emerald-500' />
                <span>Share Link</span>
              </div>

              <div className='flex gap-2'>
                <div className='flex-1 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground truncate'>
                  <Link2 className='h-3.5 w-3.5 shrink-0 text-emerald-500' />
                  <span className='truncate select-all'>{joinUrl}</span>
                </div>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={handleCopyLink}
                  className='shrink-0 gap-1.5 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 dark:hover:bg-emerald-950/30'
                >
                  <AnimatePresence mode='wait'>
                    {linkCopied ? (
                      <motion.span
                        key='check'
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 90 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className='flex items-center gap-1.5'
                      >
                        <Check className='h-3.5 w-3.5 text-emerald-500' />
                        Copied
                      </motion.span>
                    ) : (
                      <motion.span
                        key='copy'
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className='flex items-center gap-1.5'
                      >
                        <Copy className='h-3.5 w-3.5' />
                        Copy Link
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </div>

              {/* QR Code Placeholder */}
              <div className='flex items-center gap-3 rounded-lg border border-dashed border-border/60 bg-muted/20 p-3'>
                <div className='flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-200/30'>
                  <QrCode className='h-7 w-7 text-emerald-500' />
                </div>
                <div>
                  <p className='text-xs font-medium'>QR Code</p>
                  <p className='text-[11px] text-muted-foreground'>Participants can scan to join instantly</p>
                </div>
              </div>
            </div>
          </motion.div>

          <Separator className='opacity-60' />

          {/* ═══ Email Invite Section ═══ */}
          <motion.div variants={sectionVariants} initial='hidden' animate='show'>
            <div className='space-y-3'>
              <div className='flex items-center gap-2 text-sm font-medium'>
                <Mail className='h-4 w-4 text-amber-500' />
                <span>Email Invite</span>
              </div>

              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <span className='text-xs text-muted-foreground w-8 shrink-0'>To:</span>
                  <Input
                    placeholder='email1@example.com, email2@example.com'
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                    className='h-9 text-sm'
                  />
                </div>

                <Textarea
                  readOnly
                  value={inviteText}
                  rows={8}
                  className='text-xs leading-relaxed bg-muted/30 resize-none'
                />

                <Button
                  size='sm'
                  onClick={handleSendInvite}
                  disabled={sending}
                  className='w-full gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white'
                >
                  {sending ? (
                    <>
                      <span className='h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className='h-3.5 w-3.5' />
                      Send Invite
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>

          <Separator className='opacity-60' />

          {/* ═══ Copy Invite Text ═══ */}
          <motion.div variants={sectionVariants} initial='hidden' animate='show'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleCopyInviteText}
              className='w-full gap-2 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 dark:hover:bg-violet-950/30'
            >
              <AnimatePresence mode='wait'>
                {textCopied ? (
                  <motion.span
                    key='check'
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className='flex items-center gap-2'
                  >
                    <Check className='h-3.5 w-3.5 text-emerald-500' />
                    Invite Text Copied!
                  </motion.span>
                ) : (
                  <motion.span
                    key='copy'
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className='flex items-center gap-2'
                  >
                    <Copy className='h-3.5 w-3.5' />
                    Copy Invite Text
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>

          <Separator className='opacity-60' />

          {/* ═══ Calendar Integration Section ═══ */}
          <motion.div variants={sectionVariants} initial='hidden' animate='show'>
            <div className='space-y-3'>
              <div className='flex items-center gap-2 text-sm font-medium'>
                <Calendar className='h-4 w-4 text-teal-500' />
                <span>Add to Calendar</span>
              </div>

              <div className='grid grid-cols-3 gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleGoogleCalendar}
                  className='gap-1.5 text-xs hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 dark:hover:bg-emerald-950/30'
                >
                  <ExternalLink className='h-3.5 w-3.5' />
                  Google
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleOutlookCalendar}
                  className='gap-1.5 text-xs hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 dark:hover:bg-teal-950/30'
                >
                  <ExternalLink className='h-3.5 w-3.5' />
                  Outlook
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleDownloadIcs}
                  className='gap-1.5 text-xs hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 dark:hover:bg-violet-950/30'
                >
                  <Download className='h-3.5 w-3.5' />
                  .ics File
                </Button>
              </div>
            </div>
          </motion.div>

          {/* ═══ Meeting Details Summary ═══ */}
          <motion.div variants={sectionVariants} initial='hidden' animate='show'>
            <div className='rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2'>
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <User className='h-3.5 w-3.5' />
                <span>Host: <span className='text-foreground font-medium'>{hostName}</span></span>
              </div>
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <Clock className='h-3.5 w-3.5' />
                <span>{formatDateTime(startTime)}</span>
              </div>
              {password && (
                <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                  <Lock className='h-3.5 w-3.5' />
                  <span>Passcode: <span className='text-foreground font-medium'>{password}</span></span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
