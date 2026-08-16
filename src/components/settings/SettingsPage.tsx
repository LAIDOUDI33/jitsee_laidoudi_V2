'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Settings,
  Bell,
  Video,
  Palette,
  Shield,
  Globe,
  Monitor,
  Volume2,
  Mic,
  Camera,
  Save,
  AlertTriangle,
  Trash2,
  Download,
  CheckCircle2,
  Users,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } }

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    toast.success('Settings saved successfully')
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleItems = [
    { label: 'Meeting Reminders', desc: 'Get notified before scheduled meetings', default: true, icon: <Bell className='h-4 w-4 text-amber-500' /> },
    { label: 'New Messages', desc: 'Notifications for new chat messages', default: true, icon: <Bell className='h-4 w-4 text-cyan-500' /> },
    { label: 'Meeting Summaries', desc: 'Receive AI-generated meeting summaries', default: true, icon: <CheckCircle2 className='h-4 w-4 text-emerald-500' /> },
    { label: 'Team Updates', desc: 'Notifications about team changes', default: false, icon: <Users className='h-4 w-4 text-violet-500' /> },
    { label: 'Marketing Emails', desc: 'Product updates and announcements', default: false, icon: <Globe className='h-4 w-4 text-zinc-400' /> },
    { label: 'Security Alerts', desc: 'Important security notifications', default: true, icon: <Shield className='h-4 w-4 text-red-500' /> },
  ]

  return (
    <motion.div className='max-w-3xl space-y-6' variants={container} initial='hidden' animate='show'>
      <motion.div variants={item}>
        <Tabs defaultValue='general'>
          <TabsList className='flex-wrap'>
            <TabsTrigger value='general' className='gap-1.5'><Settings className='h-3.5 w-3.5' /> General</TabsTrigger>
            <TabsTrigger value='notifications' className='gap-1.5'><Bell className='h-3.5 w-3.5' /> Notifications</TabsTrigger>
            <TabsTrigger value='audio-video' className='gap-1.5'><Video className='h-3.5 w-3.5' /> Audio & Video</TabsTrigger>
            <TabsTrigger value='appearance' className='gap-1.5'><Palette className='h-3.5 w-3.5' /> Appearance</TabsTrigger>
            <TabsTrigger value='privacy' className='gap-1.5'><Shield className='h-3.5 w-3.5' /> Privacy</TabsTrigger>
          </TabsList>

          <TabsContent value='general' className='mt-6 space-y-6'>
            <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
              <CardHeader><CardTitle>General Settings</CardTitle><CardDescription>Configure your general application preferences.</CardDescription></CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-2'><Label>Display Name</Label><Input defaultValue='User' className='focus:ring-2 focus:ring-primary/20 transition-all duration-200' /></div>
                <div className='space-y-2'><Label>Email</Label><Input type='email' defaultValue='user@alvision.ai' className='focus:ring-2 focus:ring-primary/20 transition-all duration-200' /></div>
                <div className='space-y-2'><Label>Timezone</Label><Select defaultValue='utc-8'><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value='utc-8'>Pacific Time (UTC-8)</SelectItem><SelectItem value='utc-5'>Eastern Time (UTC-5)</SelectItem><SelectItem value='utc+0'>UTC</SelectItem><SelectItem value='utc+1'>Central European (UTC+1)</SelectItem><SelectItem value='utc+8'>China Standard (UTC+8)</SelectItem></SelectContent></Select></div>
                <div className='space-y-2'><Label>Language</Label><Select defaultValue='en'><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value='en'>English</SelectItem><SelectItem value='zh'>Chinese</SelectItem><SelectItem value='es'>Spanish</SelectItem><SelectItem value='fr'>French</SelectItem><SelectItem value='de'>German</SelectItem></SelectContent></Select></div>
                <div className='flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors'>
                  <div><Label>Start Week On</Label><p className='text-xs text-muted-foreground'>Choose your preferred start day</p></div>
                  <Select defaultValue='monday'><SelectTrigger className='w-36'><SelectValue /></SelectTrigger><SelectContent><SelectItem value='sunday'>Sunday</SelectItem><SelectItem value='monday'>Monday</SelectItem></SelectContent></Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='notifications' className='mt-6 space-y-6'>
            <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
              <CardHeader><CardTitle>Notification Preferences</CardTitle><CardDescription>Choose how and when you want to be notified.</CardDescription></CardHeader>
              <CardContent className='space-y-1'>
                {toggleItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.25 }}
                    className='flex items-center justify-between py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 px-3 -mx-3 rounded-lg transition-colors'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='p-2 rounded-lg bg-muted/50'>{item.icon}</div>
                      <div><p className='text-sm font-medium'>{item.label}</p><p className='text-xs text-muted-foreground'>{item.desc}</p></div>
                    </div>
                    <Switch defaultChecked={item.default} />
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='audio-video' className='mt-6 space-y-6'>
            <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
              <CardHeader><CardTitle>Audio & Video Settings</CardTitle><CardDescription>Configure your camera, microphone, and speaker preferences.</CardDescription></CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-2'><Label className='flex items-center gap-2'><Camera className='h-4 w-4' /> Camera</Label><Select defaultValue='default'><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value='default'>Default Camera</SelectItem><SelectItem value='none'>No Camera</SelectItem></SelectContent></Select></div>
                <div className='space-y-2'><Label className='flex items-center gap-2'><Mic className='h-4 w-4' /> Microphone</Label><Select defaultValue='default'><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value='default'>Default Microphone</SelectItem><SelectItem value='none'>No Microphone</SelectItem></SelectContent></Select></div>
                <div className='space-y-2'><Label className='flex items-center gap-2'><Volume2 className='h-4 w-4' /> Speaker</Label><Select defaultValue='default'><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value='default'>Default Speaker</SelectItem></SelectContent></Select></div>
                <Separator />
                {[{ label: 'Noise Suppression', desc: 'Reduce background noise', def: true }, { label: 'Mirror My Video', desc: 'Flip your self-view horizontally', def: true }, { label: 'HD Video', desc: 'Enable high-quality video', def: true }].map((item, i) => (
                  <div key={i} className='flex items-center justify-between py-2.5 px-3 -mx-3 rounded-lg hover:bg-muted/30 transition-colors'>
                    <div><Label>{item.label}</Label><p className='text-xs text-muted-foreground'>{item.desc}</p></div>
                    <Switch defaultChecked={item.def} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='appearance' className='mt-6 space-y-6'>
            <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
              <CardHeader><CardTitle>Appearance</CardTitle><CardDescription>Customize the look and feel of the application.</CardDescription></CardHeader>
              <CardContent className='space-y-1'>
                <div className='flex items-center justify-between py-3 border-b border-border/50 px-3 -mx-3 rounded-lg hover:bg-muted/30 transition-colors'>
                  <div><Label>Dark Mode</Label><p className='text-xs text-muted-foreground'>Switch between light and dark theme</p></div>
                  <Switch />
                </div>
                <div className='flex items-center justify-between py-3 border-b border-border/50 px-3 -mx-3 rounded-lg hover:bg-muted/30 transition-colors'>
                  <div><Label>Font Size</Label><p className='text-xs text-muted-foreground'>Adjust the text size</p></div>
                  <Select defaultValue='medium'><SelectTrigger className='w-36'><SelectValue /></SelectTrigger><SelectContent><SelectItem value='small'>Small</SelectItem><SelectItem value='medium'>Medium</SelectItem><SelectItem value='large'>Large</SelectItem></SelectContent></Select>
                </div>
                <div className='flex items-center justify-between py-3 px-3 -mx-3 rounded-lg hover:bg-muted/30 transition-colors'>
                  <div><Label>Compact Mode</Label><p className='text-xs text-muted-foreground'>Reduce spacing for denser information display</p></div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='privacy' className='mt-6 space-y-6'>
            <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
              <CardHeader><CardTitle>Privacy & Data</CardTitle><CardDescription>Manage your data and privacy settings.</CardDescription></CardHeader>
              <CardContent className='space-y-1'>
                {[{ label: 'Profile Visibility', desc: 'Allow others to see your profile', def: true }, { label: 'Read Receipts', desc: 'Show when you\'ve read messages', def: true }, { label: 'AI Data Processing', desc: 'Allow AI to process your meeting data', def: true }, { label: 'Auto-Record Meetings', desc: 'Automatically record all meetings you host', def: false }].map((item, i) => (
                  <div key={i} className='flex items-center justify-between py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 px-3 -mx-3 rounded-lg transition-colors'>
                    <div><p className='text-sm font-medium'>{item.label}</p><p className='text-xs text-muted-foreground'>{item.desc}</p></div>
                    <Switch defaultChecked={item.def} />
                  </div>
                ))}
                <Separator className='my-4' />
                <div>
                  <Button variant='outline' size='sm' className='gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform'><Download className='h-3.5 w-3.5' /> Export My Data</Button>
                  <p className='text-xs text-muted-foreground mt-1.5'>Download all your data in JSON format</p>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
              <Card className='border-red-200/50 dark:border-red-800/30 bg-gradient-to-br from-red-500/5 to-transparent hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300'>
                <CardHeader><CardTitle className='text-red-600 flex items-center gap-2'><AlertTriangle className='h-4 w-4' /> Danger Zone</CardTitle><CardDescription>Irreversible and destructive actions</CardDescription></CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-red-200/50 dark:border-red-800/30 bg-red-500/5'>
                    <div><p className='text-sm font-medium'>Delete Account</p><p className='text-xs text-muted-foreground'>Permanently delete your account and all associated data. This cannot be undone.</p></div>
                    <Button variant='destructive' size='sm' className='gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform shrink-0' onClick={() => toast.error('Account deletion requires confirmation via email')}><Trash2 className='h-3.5 w-3.5' /> Delete</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Save button - FIXED spinner bug */}
      <motion.div variants={item} className='flex justify-end'>
        <Button onClick={handleSave} className='gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform min-w-[140px]' disabled={saved}>
          {saved ? <Loader2 className='h-4 w-4 animate-spin' /> : <Save className='h-4 w-4' />}
          {saved ? 'Saving...' : 'Save Changes'}
        </Button>
      </motion.div>
    </motion.div>
  )
}