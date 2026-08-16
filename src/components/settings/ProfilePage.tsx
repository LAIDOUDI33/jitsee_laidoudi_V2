'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
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
  MapPin,
  Briefcase,
  X,
  Trophy,
  Star,
  MessageSquare,
  Plus,
  Loader2,
  ImagePlus,
} from 'lucide-react'

const heatmapData = [
  [0,2,1,0,3,1,0],[1,0,0,2,1,0,0],[0,1,3,2,0,1,2],[2,0,1,0,0,2,1],[0,0,0,1,3,0,1],[1,2,0,0,1,0,0],
  [0,1,2,1,0,2,0],[2,3,1,0,0,1,0],[0,0,1,2,1,0,2],[1,0,0,0,2,1,0],[0,2,1,0,0,0,1],[3,1,0,2,0,1,0],
]

const heatmapColors: Record<number, string> = {
  0: 'bg-muted',
  1: 'bg-emerald-500/20',
  2: 'bg-emerald-500/40',
  3: 'bg-emerald-500/70',
}

const skills = ['React', 'TypeScript', 'Node.js', 'Video Conferencing', 'AI/ML', 'System Design', 'WebRTC', 'Leadership']

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } }

export default function ProfilePage() {
  const { user } = useAppStore()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name || 'User')
  const [bio, setBio] = useState('Platform engineering lead with a passion for building scalable video conferencing solutions.')
  const [jobTitle, setJobTitle] = useState('Engineering Lead')
  const [location, setLocation] = useState('San Francisco, CA')
  const [saved, setSaved] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [userSkills, setUserSkills] = useState(skills)

  const handleSave = () => {
    setSaved(true)
    setEditing(false)
    toast.success('Profile saved successfully')
    setTimeout(() => setSaved(false), 2000)
  }

  const addSkill = () => {
    if (skillInput.trim() && !userSkills.includes(skillInput.trim())) {
      setUserSkills([...userSkills, skillInput.trim()])
      setSkillInput('')
    }
  }

  const removeSkill = (skill: string) => {
    setUserSkills(userSkills.filter(s => s !== skill))
  }

  const userInitials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const totalContributions = heatmapData.flat().reduce((a, b) => a + b, 0)

  return (
    <motion.div className='max-w-3xl space-y-6' variants={container} initial='hidden' animate='show'>
      {/* Profile header with cover photo */}
      <motion.div variants={item}>
        <Card className='overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
          {/* Cover photo placeholder with edit button */}
          <div className='h-36 sm:h-44 bg-gradient-to-br from-fuchsia-500/20 via-violet-500/20 to-cyan-500/20 relative group cursor-pointer'>
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(168,85,247,0.15),transparent_50%)]' />
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(236,72,153,0.1),transparent_50%)]' />
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(6,182,212,0.1),transparent_50%)]' />
            {/* Cover edit overlay */}
            <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center'>
              <div className='flex items-center gap-2 text-white text-sm font-medium'><ImagePlus className='h-4 w-4' />Change Cover</div>
            </div>
          </div>
          <CardContent className='p-6 -mt-14 relative'>
            <div className='flex flex-col sm:flex-row items-center sm:items-end gap-6'>
              {/* Avatar with edit overlay */}
              <div className='relative group cursor-pointer -mt-2'>
                <Avatar className='h-28 w-28 border-4 border-background shadow-lg'>
                  <AvatarFallback className='text-3xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white font-bold'>{userInitials}</AvatarFallback>
                </Avatar>
                <div className='absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center'>
                  <Camera className='h-6 w-6 text-white' />
                </div>
                {/* Online indicator */}
                <div className='absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-[3px] border-background shadow-sm'>
                  <div className='w-full h-full rounded-full bg-emerald-500 animate-ping opacity-75' />
                </div>
              </div>
              <div className='flex-1 text-center sm:text-left pb-1'>
                <div className='flex items-center justify-center sm:justify-start gap-2 mb-1'>
                  <h2 className='text-xl font-bold'>{name}</h2>
                  <Badge variant='outline' className='capitalize text-xs gap-1 bg-gradient-to-br from-violet-500/10 to-violet-500/5 text-violet-600 border-violet-200'><Shield className='h-3 w-3' />{user?.role || 'participant'}</Badge>
                </div>
                <p className='text-muted-foreground text-sm flex items-center justify-center sm:justify-start gap-1.5'><Briefcase className='h-3.5 w-3.5' />{jobTitle}</p>
                <div className='flex items-center justify-center sm:justify-start gap-4 mt-2 text-sm text-muted-foreground'>
                  <span className='flex items-center gap-1'><Mail className='h-3.5 w-3.5' />{user?.email || 'user@alvision.ai'}</span>
                  <span className='flex items-center gap-1'><MapPin className='h-3.5 w-3.5' />{location}</span>
                </div>
                {user?.organizationName && <p className='text-muted-foreground text-sm flex items-center justify-center sm:justify-start gap-1 mt-0.5'><Building2 className='h-3.5 w-3.5' />{user.organizationName}</p>}
              </div>
              <Button variant='outline' className='gap-1.5 shrink-0 hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={() => { setEditing(!editing); setSaved(false) }}>
                {editing ? 'Cancel' : <><Edit3 className='h-3.5 w-3.5' /> Edit</>}
              </Button>
            </div>

            {/* Activity stats with icons */}
            <div className='grid grid-cols-4 gap-3 mt-6'>
              {[
                { label: 'Meetings', value: '142', icon: <Video className='h-4 w-4' />, color: 'from-cyan-500/10 to-cyan-500/5 text-cyan-600' },
                { label: 'Storage', value: '2.3 GB', icon: <FileText className='h-4 w-4' />, color: 'from-violet-500/10 to-violet-500/5 text-violet-600' },
                { label: 'Recorded', value: '48h', icon: <Clock className='h-4 w-4' />, color: 'from-amber-500/10 to-amber-500/5 text-amber-600' },
                { label: 'Score', value: '98', icon: <Trophy className='h-4 w-4' />, color: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600' },
              ].map(s => (
                <motion.div
                  key={s.label}
                  whileHover={{ scale: 1.03 }}
                  className='text-center p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-default'
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-1.5`}>{s.icon}</div>
                  <p className='text-lg font-bold'>{s.value}</p>
                  <p className='text-[10px] text-muted-foreground'>{s.label}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Profile form / display */}
      <motion.div variants={item}>
        <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
          <CardHeader><CardTitle>Profile Information</CardTitle><CardDescription>{editing ? 'Update your profile details' : 'Your personal information'}</CardDescription></CardHeader>
          <CardContent className='space-y-5'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Full Name</Label>
                {editing ? <Input value={name} onChange={e => setName(e.target.value)} className='focus:ring-2 focus:ring-primary/20 transition-all duration-200' /> : <p className='text-sm py-2 px-3 rounded-lg border border-transparent hover:border-border/50 hover:bg-muted/30 transition-colors'>{name}</p>}
              </div>
              <div className='space-y-2'>
                <Label>Email</Label>
                <p className='text-sm py-2 px-3 rounded-lg border border-transparent hover:border-border/50 hover:bg-muted/30 transition-colors text-muted-foreground'>{user?.email || 'user@alvision.ai'}</p>
              </div>
              <div className='space-y-2'>
                <Label>Job Title</Label>
                {editing ? <Input value={jobTitle} onChange={e => setJobTitle(e.target.value)} className='focus:ring-2 focus:ring-primary/20 transition-all duration-200' /> : <p className='text-sm py-2 px-3 rounded-lg border border-transparent hover:border-border/50 hover:bg-muted/30 transition-colors'>{jobTitle}</p>}
              </div>
              <div className='space-y-2'>
                <Label>Location</Label>
                {editing ? <Input value={location} onChange={e => setLocation(e.target.value)} className='focus:ring-2 focus:ring-primary/20 transition-all duration-200' /> : <p className='text-sm py-2 px-3 rounded-lg border border-transparent hover:border-border/50 hover:bg-muted/30 transition-colors'>{location}</p>}
              </div>
              <div className='space-y-2'>
                <Label>Organization</Label>
                <p className='text-sm py-2 px-3 rounded-lg border border-transparent hover:border-border/50 hover:bg-muted/30 transition-colors text-muted-foreground'>{user?.organizationName || 'ALVISION'}</p>
              </div>
              <div className='space-y-2'>
                <Label>Role</Label>
                <div className='py-2 px-3'>
                  <Badge variant='outline' className='capitalize text-xs gap-1 bg-gradient-to-br from-violet-500/10 to-violet-500/5 text-violet-600 border-violet-200'><Shield className='h-3 w-3' />{user?.role || 'participant'}</Badge>
                </div>
              </div>
            </div>
            <div className='space-y-2'>
              <Label>Bio</Label>
              {editing ? <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className='focus:ring-2 focus:ring-primary/20 transition-all duration-200' /> : <p className='text-sm text-muted-foreground py-2 px-3 rounded-lg border border-transparent hover:border-border/50 hover:bg-muted/30 transition-colors'>{bio}</p>}
            </div>
            {editing && (
              <div className='flex justify-end'>
                <Button onClick={handleSave} className='gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform min-w-[130px]' disabled={saved}>
                  {saved ? <Loader2 className='h-4 w-4 animate-spin' /> : <Save className='h-4 w-4' />}
                  {saved ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Skills / Expertise Tags */}
      <motion.div variants={item}>
        <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
          <CardHeader><CardTitle className='flex items-center gap-2'><Star className='h-4 w-4 text-amber-500' /> Skills & Expertise</CardTitle></CardHeader>
          <CardContent>
            <div className='flex flex-wrap gap-2 mb-3'>
              {userSkills.map(skill => (
                <motion.div
                  key={skill}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Badge variant='outline' className='px-3 py-1.5 text-xs gap-1.5 hover:bg-muted/50 transition-colors cursor-default'>
                    {skill}
                    {editing && <button type='button' onClick={() => removeSkill(skill)} className='ml-0.5 hover:text-red-500 transition-colors'><X className='h-3 w-3' /></button>}
                  </Badge>
                </motion.div>
              ))}
            </div>
            {editing && (
              <div className='flex gap-2'>
                <Input placeholder='Add a skill...' value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} className='h-9 flex-1 focus:ring-2 focus:ring-primary/20' />
                <Button variant='outline' size='sm' className='gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={addSkill}><Plus className='h-3.5 w-3.5' />Add</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity heatmap */}
      <motion.div variants={item}>
        <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle className='flex items-center gap-2'><CalendarDays className='h-4 w-4 text-emerald-500' /> Activity</CardTitle>
              <p className='text-xs text-muted-foreground'>{totalContributions} contributions in the last 12 weeks</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className='flex gap-1 overflow-x-auto pb-2'>
              {heatmapData.map((week, wi) => (
                <div key={wi} className='flex flex-col gap-1'>
                  {week.map((day, di) => (
                    <motion.div
                      key={di}
                      title={`${day} contributions`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: (wi * 7 + di) * 0.005, duration: 0.15 }}
                      className={`w-3 h-3 rounded-sm transition-colors hover:ring-1 hover:ring-primary/30 ${heatmapColors[day]}`}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className='flex items-center gap-2 mt-3 text-[10px] text-muted-foreground'>
              <span>Less</span>
              <div className='w-3 h-3 rounded-sm bg-muted' />
              <div className='w-3 h-3 rounded-sm bg-emerald-500/20' />
              <div className='w-3 h-3 rounded-sm bg-emerald-500/40' />
              <div className='w-3 h-3 rounded-sm bg-emerald-500/70' />
              <span>More</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity Overview Stats */}
      <motion.div variants={item}>
        <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
          <CardHeader><CardTitle className='flex items-center gap-2'><MessageSquare className='h-4 w-4 text-violet-500' /> Activity Overview</CardTitle></CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
              {[
                { label: 'This Week', value: '8', icon: <Video className='h-4 w-4' />, color: 'from-cyan-500/10 to-cyan-500/5 text-cyan-600' },
                { label: 'This Month', value: '34', icon: <CalendarDays className='h-4 w-4' />, color: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600' },
                { label: 'Hours Recorded', value: '48', icon: <Clock className='h-4 w-4' />, color: 'from-violet-500/10 to-violet-500/5 text-violet-600' },
                { label: 'AI Summaries', value: '27', icon: <MessageSquare className='h-4 w-4' />, color: 'from-amber-500/10 to-amber-500/5 text-amber-600' },
              ].map(s => (
                <motion.div
                  key={s.label}
                  whileHover={{ scale: 1.03 }}
                  className='flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-default'
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${s.color}`}>{s.icon}</div>
                  <div><p className='text-lg font-bold'>{s.value}</p><p className='text-[10px] text-muted-foreground'>{s.label}</p></div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}