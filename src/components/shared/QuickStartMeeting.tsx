'use client'

import { useState } from 'react'
import { Video, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function QuickStartMeeting() {
  const { setCurrentView, setCurrentMeetingId, setMeetingTitle } = useAppStore()
  const [loading, setLoading] = useState(false)

  const handleStartMeeting = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Quick Meeting',
          type: 'instant',
        }),
      })
      if (!res.ok) throw new Error('Failed to create meeting')
      const meeting = await res.json()
      setMeetingTitle(meeting.title || 'Quick Meeting')
      setCurrentMeetingId(meeting.id)
      setCurrentView('meeting-room')
      toast.success('Meeting started', { description: 'Your meeting is ready to begin' })
    } catch {
      toast.error('Failed to start meeting', { description: 'Please try again in a moment' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleStartMeeting}
      disabled={loading}
      className={cn(
        'h-9 gap-2 rounded-lg bg-primary text-primary-foreground shadow-sm transition-all duration-200',
        'hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
        'disabled:opacity-70 disabled:pointer-events-none'
      )}
    >
      {loading ? (
        <Loader2 className='h-4 w-4 animate-spin' />
      ) : (
        <Video className='h-4 w-4' />
      )}
      <span className='hidden sm:inline text-sm font-medium'>
        {loading ? 'Starting...' : 'Start Meeting'}
      </span>
    </Button>
  )
}
