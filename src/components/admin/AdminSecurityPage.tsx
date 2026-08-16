'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Shield,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Fingerprint,
  Globe,
  Smartphone,
  Monitor,
  Clock,
  RefreshCw,
} from 'lucide-react'

interface SecurityPolicy {
  id: string
  name: string
  description: string
  enabled: boolean
  category: 'auth' | 'session' | 'data' | 'network'
}

interface LoginAttempt {
  id: string
  email: string
  ip: string
  location: string
  device: string
  time: string
  status: 'success' | 'failed' | 'blocked'
}

const policies: SecurityPolicy[] = [
  { id: 'p1', name: 'Two-Factor Authentication', description: 'Require 2FA for all users on login', enabled: true, category: 'auth' },
  { id: 'p2', name: 'SSO / SAML Integration', description: 'Enable single sign-on via enterprise IdP', enabled: false, category: 'auth' },
  { id: 'p3', name: 'Password Complexity', description: 'Enforce minimum 12 chars, mixed case, numbers, symbols', enabled: true, category: 'auth' },
  { id: 'p4', name: 'Session Timeout', description: 'Auto-logout after 30 minutes of inactivity', enabled: true, category: 'session' },
  { id: 'p5', name: 'Max Concurrent Sessions', description: 'Limit to 3 active sessions per user', enabled: true, category: 'session' },
  { id: 'p6', name: 'End-to-End Encryption', description: 'E2E encryption for all video meetings', enabled: true, category: 'data' },
  { id: 'p7', name: 'Recording Encryption', description: 'AES-256 encryption for stored recordings', enabled: true, category: 'data' },
  { id: 'p8', name: 'IP Allowlist', description: 'Restrict access to approved IP ranges', enabled: false, category: 'network' },
  { id: 'p9', name: 'Rate Limiting', description: 'Block IPs with excessive failed login attempts', enabled: true, category: 'network' },
]

const loginAttempts: LoginAttempt[] = [
  { id: 'la1', email: 'sarah@alvision.ai', ip: '192.168.1.10', location: 'San Francisco, US', device: 'Chrome / macOS', time: '2 min ago', status: 'success' },
  { id: 'la2', email: 'unknown@external.com', ip: '203.0.113.42', location: 'Unknown', device: 'Firefox / Windows', time: '5 min ago', status: 'blocked' },
  { id: 'la3', email: 'mike@alvision.ai', ip: '192.168.1.22', location: 'San Francisco, US', device: 'Safari / iOS', time: '12 min ago', status: 'success' },
  { id: 'la4', email: 'admin@alvision.ai', ip: '203.0.113.42', location: 'Unknown', device: 'Python/requests', time: '15 min ago', status: 'failed' },
  { id: 'la5', email: 'admin@alvision.ai', ip: '203.0.113.42', location: 'Unknown', device: 'Python/requests', time: '15 min ago', status: 'failed' },
  { id: 'la6', email: 'admin@alvision.ai', ip: '203.0.113.42', location: 'Unknown', device: 'Python/requests', time: '14 min ago', status: 'blocked' },
]

export default function AdminSecurityPage() {
  const [policyStates, setPolicyStates] = useState<Record<string, boolean>>(Object.fromEntries(policies.map(p => [p.id, p.enabled])))

  const togglePolicy = (id: string) => {
    setPolicyStates(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const enabledCount = Object.values(policyStates).filter(Boolean).length
  const securityScore = Math.round((enabledCount / policies.length) * 100)

  return (
    <div className='space-y-6'>
      {/* Security score */}
      <Card className='bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 border-emerald-200/50 dark:border-emerald-800/30'>
        <CardContent className='p-6 flex flex-col sm:flex-row items-center gap-6'>
          <div className='relative'>
            <div className='w-24 h-24 rounded-full border-4 border-emerald-500/30 flex items-center justify-center'>
              <div className='text-center'><p className='text-3xl font-bold text-emerald-600'>{securityScore}</p><p className='text-[10px] text-muted-foreground'>SCORE</p></div>
            </div>
          </div>
          <div className='flex-1 text-center sm:text-left'>
            <h2 className='text-xl font-bold mb-1'>Security Score: {securityScore}%</h2>
            <p className='text-sm text-muted-foreground mb-2'>{enabledCount} of {policies.length} security policies are enabled</p>
            <div className='flex flex-wrap gap-2'>
              {securityScore >= 80 ? <Badge className='bg-emerald-500/10 text-emerald-600 border-emerald-200'><CheckCircle2 className='h-3 w-3 mr-1' />Strong</Badge> : null}
              {securityScore < 80 && securityScore >= 50 ? <Badge className='bg-amber-500/10 text-amber-600 border-amber-200'><AlertTriangle className='h-3 w-3 mr-1' />Moderate</Badge> : null}
              {loginAttempts.filter(a => a.status === 'blocked').length > 0 && <Badge className='bg-red-500/10 text-red-500 border-red-200'><AlertTriangle className='h-3 w-3 mr-1' />{loginAttempts.filter(a => a.status === 'blocked').length} blocked IPs</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue='policies'>
        <TabsList>
          <TabsTrigger value='policies'>Security Policies</TabsTrigger>
          <TabsTrigger value='logins'>Login Activity</TabsTrigger>
        </TabsList>

        <TabsContent value='policies' className='mt-4 space-y-4'>
          {['auth', 'session', 'data', 'network'].map(cat => {
            const catPolicies = policies.filter(p => p.category === cat)
            const catLabels: Record<string, { icon: React.ReactNode; label: string }> = {
              auth: { icon: <Key className='h-4 w-4' />, label: 'Authentication' },
              session: { icon: <Clock className='h-4 w-4' />, label: 'Session Management' },
              data: { icon: <Lock className='h-4 w-4' />, label: 'Data Protection' },
              network: { icon: <Globe className='h-4 w-4' />, label: 'Network Security' },
            }
            const info = catLabels[cat]
            return (
              <Card key={cat}>
                <CardHeader className='pb-3'><CardTitle className='text-sm flex items-center gap-2'>{info.icon} {info.label}</CardTitle></CardHeader>
                <CardContent className='space-y-3'>
                  {catPolicies.map(p => (
                    <div key={p.id} className='flex items-center justify-between py-2 border-b last:border-0'>
                      <div className='flex-1 mr-4'><p className='text-sm font-medium'>{p.name}</p><p className='text-xs text-muted-foreground'>{p.description}</p></div>
                      <Switch checked={policyStates[p.id]} onCheckedChange={() => togglePolicy(p.id)} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value='logins' className='mt-4'>
          <Card>
            <CardHeader className='pb-3'><CardTitle className='text-sm'>Recent Login Attempts</CardTitle></CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className='hidden md:table-cell'>IP Address</TableHead>
                  <TableHead className='hidden lg:table-cell'>Location</TableHead>
                  <TableHead className='hidden md:table-cell'>Device</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loginAttempts.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className='font-mono text-sm'>{a.email}</TableCell>
                    <TableCell className='hidden md:table-cell font-mono text-sm text-muted-foreground'>{a.ip}</TableCell>
                    <TableCell className='hidden lg:table-cell text-sm'>{a.location}</TableCell>
                    <TableCell className='hidden md:table-cell text-sm text-muted-foreground'>{a.device}</TableCell>
                    <TableCell className='text-sm text-muted-foreground'>{a.time}</TableCell>
                    <TableCell><Badge variant='outline' className={`text-[10px] ${a.status === 'success' ? 'bg-emerald-500/10 text-emerald-600' : a.status === 'failed' ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-500'}`}>{a.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
