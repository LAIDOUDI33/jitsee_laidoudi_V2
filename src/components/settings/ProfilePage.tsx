'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  UserCircle,
  Mail,
  Building2,
  Shield,
  Camera,
  Save,
  CalendarDays,
  Video,
  FileText,
  Clock,
  Edit3,
} from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAppStore()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name || 'User')
  const [bio, setBio] = useState('Platform engineering lead with a passion for building scalable video conferencing solutions.')
  const [jobTitle, setJobTitle] = useState('Engineering Lead')
  const [location, setLocation] = useState('San Francisco, CA')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 2000)
  }

  const userInitials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className='max-w-3xl space-y-6'>
      {/* Profile header */}
      <Card>
        <CardContent className='p-6'>
          <div className='flex flex-col sm:flex-row items-center sm:items-start gap-6'>
            <div className='relative group'>
              <Avatar className='h-24 w-24'>
                <AvatarFallback className='text-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-white'>{userInitials}</AvatarFallback>
              </Avatar>
              <button className='absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                <Camera className='h-5 w-5 text-white' />
              </button>
            </div>
            <div className='flex-1 text-center sm:text-left'>
              <div className='flex items-center justify-center sm:justify-start gap-2 mb-1'>
                <h2 className='text-xl font-bold'>{name}</h2>
                <Badge variant='outline' className='capitalize text-xs'>{user?.role || 'participant'}</Badge>
              </div>
              <p className='text-muted-foreground text-sm mb-1'>{jobTitle}</p>
              <p className='text-muted-foreground text-sm flex items-center justify-center sm:justify-start gap-1'><Mail className='h-3.5 w-3.5' />{user?.email || 'user@alvision.ai'}</p>
              {user?.organizationName && <p className='text-muted-foreground text-sm flex items-center justify-center sm:justify-start gap-1 mt-0.5'><Building2 className='h-3.5 w-3.5' />{user.organizationName}</p>}
              <div className='flex items-center justify-center sm:justify-start gap-4 mt-3'>
                <div className='text-center'><p className='text-lg font-bold'>142</p><p className='text-[10px] text-muted-foreground'>Meetings</p></div>
                <div className='text-center'><p className='text-lg font-bold'>2.3 GB</p><p className='text-[10px] text-muted-foreground'>Storage</p></div>
                <div className='text-center'><p className='text-lg font-bold'>48h</p><p className='text-[10px] text-muted-foreground'>Recorded</p></div>
              </div>
            </div>
            <Button variant='outline' className='gap-1.5 shrink-0' onClick={() => { setEditing(!editing); setSaved(false) }}>
              {editing ? 'Cancel' : <><Edit3 className='h-3.5 w-3.5' /> Edit</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile form / display */}
      <Card>
        <CardHeader><CardTitle>Profile Information</CardTitle><CardDescription>{editing ? 'Update your profile details' : 'Your personal information'}</CardDescription></CardHeader>
        <CardContent className='space-y-5'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Full Name</Label>
              {editing ? <Input value={name} onChange={e => setName(e.target.value)} /> : <p className='text-sm py-2'>{name}</p>}
            </div>
            <div className='space-y-2'>
              <Label>Email</Label>
              <p className='text-sm py-2 text-muted-foreground'>{user?.email || 'user@alvision.ai'}</p>
            </div>
            <div className='space-y-2'>
              <Label>Job Title</Label>
              {editing ? <Input value={jobTitle} onChange={e => setJobTitle(e.target.value)} /> : <p className='text-sm py-2'>{jobTitle}</p>}
            </div>
            <div className='space-y-2'>
              <Label>Location</Label>
              {editing ? <Input value={location} onChange={e => setLocation(e.target.value)} /> : <p className='text-sm py-2'>{location}</p>}
            </div>
            <div className='space-y-2'>
              <Label>Organization</Label>
              <p className='text-sm py-2 text-muted-foreground'>{user?.organizationName || 'ALVISION'}</p>
            </div>
            <div className='space-y-2'>
              <Label>Role</Label>
              <p className='text-sm py-2 capitalize'>{user?.role || 'participant'}</p>
            </div>
          </div>
          <div className='space-y-2'>
            <Label>Bio</Label>
            {editing ? <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} /> : <p className='text-sm text-muted-foreground'>{bio}</p>}
          </div>
          {editing && (
            <div className='flex justify-end'>
              <Button onClick={handleSave} className='gap-2'>
                {saved ? <><span className='inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' /></> : <Save className='h-4 w-4' />}
                {saved ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity stats */}
      <Card>
        <CardHeader><CardTitle>Activity Overview</CardTitle></CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
            {[
              { label: 'This Week', value: '8', icon: <Video className='h-4 w-4' />, color: 'text-blue-600', bg: 'bg-blue-500/10' },
              { label: 'This Month', value: '34', icon: <CalendarDays className='h-4 w-4' />, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
              { label: 'Hours Recorded', value: '48', icon: <Clock className='h-4 w-4' />, color: 'text-violet-600', bg: 'bg-violet-500/10' },
              { label: 'AI Summaries', value: '27', icon: <FileText className='h-4 w-4' />, color: 'text-amber-600', bg: 'bg-amber-500/10' },
            ].map(s => (
              <div key={s.label} className='flex items-center gap-3 p-3 rounded-lg border'>
                <div className={`p-2 rounded-lg ${s.bg} ${s.color}`}>{s.icon}</div>
                <div><p className='text-lg font-bold'>{s.value}</p><p className='text-[10px] text-muted-foreground'>{s.label}</p></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
