'use client'

import { useState } from 'react'
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
} from 'lucide-react'

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className='max-w-3xl space-y-6'>
      <Tabs defaultValue='general'>
        <TabsList className='flex-wrap'>
          <TabsTrigger value='general' className='gap-1.5'><Settings className='h-3.5 w-3.5' /> General</TabsTrigger>
          <TabsTrigger value='notifications' className='gap-1.5'><Bell className='h-3.5 w-3.5' /> Notifications</TabsTrigger>
          <TabsTrigger value='audio-video' className='gap-1.5'><Video className='h-3.5 w-3.5' /> Audio & Video</TabsTrigger>
          <TabsTrigger value='appearance' className='gap-1.5'><Palette className='h-3.5 w-3.5' /> Appearance</TabsTrigger>
          <TabsTrigger value='privacy' className='gap-1.5'><Shield className='h-3.5 w-3.5' /> Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value='general' className='mt-6 space-y-6'>
          <Card>
            <CardHeader><CardTitle>General Settings</CardTitle><CardDescription>Configure your general application preferences.</CardDescription></CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-2'><Label>Display Name</Label><Input defaultValue='User' /></div>
              <div className='space-y-2'><Label>Email</Label><Input type='email' defaultValue='user@alvision.ai' /></div>
              <div className='space-y-2'><Label>Timezone</Label><Select defaultValue='utc-8'><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value='utc-8'>Pacific Time (UTC-8)</SelectItem><SelectItem value='utc-5'>Eastern Time (UTC-5)</SelectItem><SelectItem value='utc+0'>UTC</SelectItem><SelectItem value='utc+1'>Central European (UTC+1)</SelectItem><SelectItem value='utc+8'>China Standard (UTC+8)</SelectItem></SelectContent></Select></div>
              <div className='space-y-2'><Label>Language</Label><Select defaultValue='en'><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value='en'>English</SelectItem><SelectItem value='zh'>Chinese</SelectItem><SelectItem value='es'>Spanish</SelectItem><SelectItem value='fr'>French</SelectItem><SelectItem value='de'>German</SelectItem></SelectContent></Select></div>
              <div className='flex items-center justify-between'><div><Label>Start Week On</Label><p className='text-xs text-muted-foreground'>Choose your preferred start day</p></div><Select defaultValue='monday'><SelectTrigger className='w-36'><SelectValue /></SelectTrigger><SelectContent><SelectItem value='sunday'>Sunday</SelectItem><SelectItem value='monday'>Monday</SelectItem></SelectContent></Select></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='notifications' className='mt-6 space-y-6'>
          <Card>
            <CardHeader><CardTitle>Notification Preferences</CardTitle><CardDescription>Choose how and when you want to be notified.</CardDescription></CardHeader>
            <CardContent className='space-y-4'>
              {[{ label: 'Meeting Reminders', desc: 'Get notified before scheduled meetings', default: true }, { label: 'New Messages', desc: 'Notifications for new chat messages', default: true }, { label: 'Meeting Summaries', desc: 'Receive AI-generated meeting summaries', default: true }, { label: 'Team Updates', desc: 'Notifications about team changes', default: false }, { label: 'Marketing Emails', desc: 'Product updates and announcements', default: false }, { label: 'Security Alerts', desc: 'Important security notifications', default: true }].map((item, i) => (
                <div key={i} className='flex items-center justify-between py-2 border-b last:border-0'>
                  <div><p className='text-sm font-medium'>{item.label}</p><p className='text-xs text-muted-foreground'>{item.desc}</p></div>
                  <Switch defaultChecked={item.default} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='audio-video' className='mt-6 space-y-6'>
          <Card>
            <CardHeader><CardTitle>Audio & Video Settings</CardTitle><CardDescription>Configure your camera, microphone, and speaker preferences.</CardDescription></CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-2'><Label className='flex items-center gap-2'><Camera className='h-4 w-4' /> Camera</Label><Select defaultValue='default'><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value='default'>Default Camera</SelectItem><SelectItem value='none'>No Camera</SelectItem></SelectContent></Select></div>
              <div className='space-y-2'><Label className='flex items-center gap-2'><Mic className='h-4 w-4' /> Microphone</Label><Select defaultValue='default'><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value='default'>Default Microphone</SelectItem><SelectItem value='none'>No Microphone</SelectItem></SelectContent></Select></div>
              <div className='space-y-2'><Label className='flex items-center gap-2'><Volume2 className='h-4 w-4' /> Speaker</Label><Select defaultValue='default'><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value='default'>Default Speaker</SelectItem></SelectContent></Select></div>
              <Separator />
              <div className='flex items-center justify-between'><div><Label>Noise Suppression</Label><p className='text-xs text-muted-foreground'>Reduce background noise</p></div><Switch defaultChecked /></div>
              <div className='flex items-center justify-between'><div><Label>Mirror My Video</Label><p className='text-xs text-muted-foreground'>Flip your self-view horizontally</p></div><Switch defaultChecked /></div>
              <div className='flex items-center justify-between'><div><Label>HD Video</Label><p className='text-xs text-muted-foreground'>Enable high-quality video</p></div><Switch defaultChecked /></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='appearance' className='mt-6 space-y-6'>
          <Card>
            <CardHeader><CardTitle>Appearance</CardTitle><CardDescription>Customize the look and feel of the application.</CardDescription></CardHeader>
            <CardContent className='space-y-6'>
              <div className='flex items-center justify-between'><div><Label>Dark Mode</Label><p className='text-xs text-muted-foreground'>Switch between light and dark theme</p></div><Switch /></div>
              <div className='space-y-2'><Label>Font Size</Label><Select defaultValue='medium'><SelectTrigger className='w-48'><SelectValue /></SelectTrigger><SelectContent><SelectItem value='small'>Small</SelectItem><SelectItem value='medium'>Medium</SelectItem><SelectItem value='large'>Large</SelectItem></SelectContent></Select></div>
              <div className='space-y-2'><Label>Compact Mode</Label><p className='text-xs text-muted-foreground'>Reduce spacing for denser information display</p><Switch /></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='privacy' className='mt-6 space-y-6'>
          <Card>
            <CardHeader><CardTitle>Privacy & Data</CardTitle><CardDescription>Manage your data and privacy settings.</CardDescription></CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between py-2 border-b'><div><p className='text-sm font-medium'>Profile Visibility</p><p className='text-xs text-muted-foreground'>Allow others to see your profile</p></div><Switch defaultChecked /></div>
              <div className='flex items-center justify-between py-2 border-b'><div><p className='text-sm font-medium'>Read Receipts</p><p className='text-xs text-muted-foreground'>Show when you\'ve read messages</p></div><Switch defaultChecked /></div>
              <div className='flex items-center justify-between py-2 border-b'><div><p className='text-sm font-medium'>AI Data Processing</p><p className='text-xs text-muted-foreground'>Allow AI to process your meeting data</p></div><Switch defaultChecked /></div>
              <div className='flex items-center justify-between py-2 border-b'><div><p className='text-sm font-medium'>Auto-Record Meetings</p><p className='text-xs text-muted-foreground'>Automatically record all meetings you host</p></div><Switch /></div>
              <Separator />
              <div><Button variant='outline' size='sm'>Export My Data</Button><p className='text-xs text-muted-foreground mt-1'>Download all your data in JSON format</p></div>
              <div><Button variant='destructive' size='sm'>Delete Account</Button><p className='text-xs text-muted-foreground mt-1'>Permanently delete your account and all associated data</p></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save button */}
      <div className='flex justify-end'>
        <Button onClick={handleSave} className='gap-2'>
          {saved ? <><span className='inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' /></> : <Save className='h-4 w-4' />}
          {saved ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
