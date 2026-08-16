'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  ShieldCheck,
  SmartphoneNfc,
  Terminal,
} from 'lucide-react'
import { toast } from 'sonner'

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

interface SecurityEvent {
  id: string
  title: string
  description: string
  time: string
  severity: 'info' | 'warning' | 'critical'
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

const securityEvents: SecurityEvent[] = [
  { id: 'se1', title: 'Brute force attack blocked', description: 'IP 203.0.113.42 blocked after 3 failed attempts', time: '5 min ago', severity: 'critical' },
  { id: 'se2', title: '2FA bypass attempt', description: 'User mike@alvision.ai tried expired 2FA code', time: '12 min ago', severity: 'warning' },
  { id: 'se3', title: 'New device login', description: 'sarah@alvision.ai logged in from new Chrome/macOS device', time: '18 min ago', severity: 'info' },
  { id: 'se4', title: 'Policy change', description: 'Password complexity policy updated by superadmin', time: '1 hour ago', severity: 'info' },
  { id: 'se5', title: 'Session anomaly detected', description: 'Concurrent sessions exceeded for user emily@techstart.com', time: '2 hours ago', severity: 'warning' },
]

const eventSeverityColors: Record<string, { dot: string; bg: string; text: string }> = {
  info: { dot: 'bg-cyan-500', bg: 'bg-cyan-500/10', text: 'text-cyan-600' },
  warning: { dot: 'bg-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-600' },
  critical: { dot: 'bg-red-500', bg: 'bg-red-500/10', text: 'text-red-500' },
}

const categoryInfo: Record<string, { icon: React.ReactNode; label: string; color: string; bgColor: string }> = {
  auth: { icon: <Key className='h-4 w-4' />, label: 'Authentication', color: 'text-amber-600', bgColor: 'from-amber-500/10 to-amber-500/5' },
  session: { icon: <Clock className='h-4 w-4' />, label: 'Session Management', color: 'text-cyan-600', bgColor: 'from-cyan-500/10 to-cyan-500/5' },
  data: { icon: <Lock className='h-4 w-4' />, label: 'Data Protection', color: 'text-emerald-600', bgColor: 'from-emerald-500/10 to-emerald-500/5' },
  network: { icon: <Globe className='h-4 w-4' />, label: 'Network Security', color: 'text-violet-600', bgColor: 'from-violet-500/10 to-violet-500/5' },
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } }

export default function AdminSecurityPage() {
  const [policyStates, setPolicyStates] = useState<Record<string, boolean>>(Object.fromEntries(policies.map(p => [p.id, p.enabled])))

  const togglePolicy = (id: string) => {
    setPolicyStates(prev => ({ ...prev, [id]: !prev[id] }))
    toast.success(`Policy ${policies.find(p => p.id === id)?.name} ${policyStates[id] ? 'disabled' : 'enabled'}`)
  }

  const enabledCount = Object.values(policyStates).filter(Boolean).length
  const securityScore = Math.round((enabledCount / policies.length) * 100)
  const blockedCount = loginAttempts.filter(a => a.status === 'blocked').length

  const gaugeRadius = 52
  const gaugeStroke = 8
  const gaugeCircumference = 2 * Math.PI * gaugeRadius
  const gaugeOffset = gaugeCircumference - (securityScore / 100) * gaugeCircumference
  const gaugeColor = securityScore >= 80 ? '#10b981' : securityScore >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <motion.div className='space-y-6' variants={container} initial='hidden' animate='show'>
      {/* Security score with circular gauge */}
      <motion.div variants={item}>
        <Card className={`bg-gradient-to-br ${securityScore >= 80 ? 'from-emerald-500/5 to-cyan-500/5 border-emerald-200/50 dark:border-emerald-800/30' : securityScore >= 50 ? 'from-amber-500/5 to-orange-500/5 border-amber-200/50 dark:border-amber-800/30' : 'from-red-500/5 to-rose-500/5 border-red-200/50 dark:border-red-800/30'} hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50`}>
          <CardContent className='p-6 flex flex-col sm:flex-row items-center gap-6'>
            <div className='relative w-32 h-32 shrink-0'>
              <svg width='128' height='128' viewBox='0 0 128 128' className='-rotate-90'>
                <circle cx='64' cy='64' r={gaugeRadius} fill='none' stroke='currentColor' strokeWidth={gaugeStroke} className='text-muted/30' />
                <motion.circle
                  cx='64' cy='64' r={gaugeRadius} fill='none' stroke={gaugeColor} strokeWidth={gaugeStroke} strokeLinecap='round'
                  strokeDasharray={gaugeCircumference}
                  initial={{ strokeDashoffset: gaugeCircumference }}
                  animate={{ strokeDashoffset: gaugeOffset }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </svg>
              <div className='absolute inset-0 flex items-center justify-center flex-col'>
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className='text-3xl font-bold' style={{ color: gaugeColor }}>{securityScore}</motion.span>
                <span className='text-[10px] text-muted-foreground uppercase tracking-wider'>Score</span>
              </div>
            </div>
            <div className='flex-1 text-center sm:text-left'>
              <h2 className='text-xl font-bold mb-1 flex items-center justify-center sm:justify-start gap-2'>
                <ShieldCheck className='h-5 w-5 text-emerald-500' />
                Security Score: {securityScore}%
              </h2>
              <p className='text-sm text-muted-foreground mb-3'>{enabledCount} of {policies.length} security policies are enabled</p>
              <div className='flex flex-wrap gap-2 justify-center sm:justify-start'>
                {securityScore >= 80 && <Badge className='bg-emerald-500/10 text-emerald-600 border-emerald-200 gap-1'><CheckCircle2 className='h-3 w-3' />Strong</Badge>}
                {securityScore < 80 && securityScore >= 50 && <Badge className='bg-amber-500/10 text-amber-600 border-amber-200 gap-1'><AlertTriangle className='h-3 w-3' />Moderate</Badge>}
                {securityScore < 50 && <Badge className='bg-red-500/10 text-red-500 border-red-200 gap-1'><XCircle className='h-3 w-3' />Weak</Badge>}
                {blockedCount > 0 && <Badge className='bg-red-500/10 text-red-500 border-red-200 gap-1'><AlertTriangle className='h-3 w-3 animate-pulse' />{blockedCount} blocked IPs</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Tabs defaultValue='policies'>
          <TabsList>
            <TabsTrigger value='policies' className='gap-1.5'><Shield className='h-3.5 w-3.5' /> Policies</TabsTrigger>
            <TabsTrigger value='events' className='gap-1.5'><Terminal className='h-3.5 w-3.5' /> Events</TabsTrigger>
            <TabsTrigger value='logins' className='gap-1.5'><Eye className='h-3.5 w-3.5' /> Login Activity</TabsTrigger>
          </TabsList>

          <TabsContent value='policies' className='mt-4 space-y-4'>
            {['auth', 'session', 'data', 'network'].map(cat => {
              const catPolicies = policies.filter(p => p.category === cat)
              const info = categoryInfo[cat]
              const catEnabled = catPolicies.filter(p => policyStates[p.id]).length
              return (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
                    <CardHeader className='pb-3'>
                      <div className='flex items-center justify-between'>
                        <CardTitle className='text-sm flex items-center gap-2'>{info.icon} {info.label}</CardTitle>
                        <Badge variant='outline' className={`text-[10px] gap-1 ${catEnabled === catPolicies.length ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-zinc-500/10 text-zinc-500 border-zinc-200'}`}>
                          {catEnabled}/{catPolicies.length} enabled
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      {catPolicies.map(p => (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25 }}
                          className={`flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-all duration-200 ${policyStates[p.id] ? 'bg-gradient-to-r from-emerald-500/5 to-transparent' : ''}`}
                        >
                          <div className='flex-1 mr-4'>
                            <p className='text-sm font-medium flex items-center gap-2'>{p.name}{policyStates[p.id] && <span className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse' />}</p>
                            <p className='text-xs text-muted-foreground'>{p.description}</p>
                          </div>
                          <Switch checked={policyStates[p.id]} onCheckedChange={() => togglePolicy(p.id)} />
                        </motion.div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}

            {/* 2FA Setup Section */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
              <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
                <CardHeader><CardTitle className='text-sm flex items-center gap-2'><SmartphoneNfc className='h-4 w-4' /> Two-Factor Authentication Setup</CardTitle><CardDescription>Configure 2FA methods for your organization</CardDescription></CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                    {[
                      { name: 'Authenticator App', icon: <Smartphone className='h-5 w-5' />, desc: 'Google Authenticator, Authy', enabled: true, color: 'text-emerald-600' },
                      { name: 'SMS Verification', icon: <Monitor className='h-5 w-5' />, desc: 'Text message codes', enabled: false, color: 'text-zinc-400' },
                      { name: 'Hardware Key', icon: <Fingerprint className='h-5 w-5' />, desc: 'YubiKey, FIDO2', enabled: false, color: 'text-zinc-400' },
                    ].map(method => (
                      <motion.div
                        key={method.name}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-all duration-200 cursor-pointer ${method.enabled ? 'ring-1 ring-emerald-500/20 bg-emerald-500/5' : ''}`}
                      >
                        <div className='flex items-center justify-between mb-2'>
                          <div className={`p-2 rounded-lg ${method.enabled ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>{method.icon}</div>
                          {method.enabled && <Badge className='text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-200 gap-1'><CheckCircle2 className='h-3 w-3 animate-pulse' />Active</Badge>}
                        </div>
                        <p className='text-sm font-medium'>{method.name}</p>
                        <p className='text-xs text-muted-foreground mt-0.5'>{method.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value='events' className='mt-4'>
            <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
              <CardHeader className='pb-3'><CardTitle className='text-sm flex items-center gap-2'><Terminal className='h-4 w-4' /> Security Events Timeline</CardTitle></CardHeader>
              <CardContent>
                <div className='relative'>
                  <div className='absolute left-[15px] top-2 bottom-2 w-px bg-border' />
                  <div className='space-y-4'>
                    {securityEvents.map((ev, i) => {
                      const sev = eventSeverityColors[ev.severity]
                      return (
                        <motion.div
                          key={ev.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08, duration: 0.3 }}
                          className='flex items-start gap-3 relative'
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 border-background ${sev.bg} ${sev.text}`}>
                            <div className={`w-2.5 h-2.5 rounded-full ${sev.dot} ${ev.severity === 'critical' ? 'animate-pulse' : ''}`} />
                          </div>
                          <div className='flex-1 min-w-0 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors'>
                            <div className='flex items-center justify-between mb-1'>
                              <p className='text-sm font-medium'>{ev.title}</p>
                              <Badge variant='outline' className={`text-[10px] capitalize ${sev.bg} ${sev.text} border-0`}>{ev.severity}</Badge>
                            </div>
                            <p className='text-xs text-muted-foreground'>{ev.description}</p>
                            <p className='text-[10px] text-muted-foreground mt-1'>{ev.time}</p>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='logins' className='mt-4'>
            <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
              <CardHeader className='pb-3'><CardTitle className='text-sm flex items-center gap-2'><Eye className='h-4 w-4' /> Recent Login Attempts</CardTitle></CardHeader>
              <Table>
                <TableHeader>
                  <TableRow className='divide-y divide-border/50'>
                    <TableHead>User</TableHead>
                    <TableHead className='hidden md:table-cell'>IP Address</TableHead>
                    <TableHead className='hidden lg:table-cell'>Location</TableHead>
                    <TableHead className='hidden md:table-cell'>Device</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginAttempts.map(a => (
                    <TableRow key={a.id} className='even:bg-muted/30 hover:bg-muted/50 divide-y divide-border/50 transition-colors'>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Avatar className='h-7 w-7 border border-border/50'><AvatarFallback className='text-[10px] bg-muted font-medium'>{a.email.split('@')[0].slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                          <span className='font-mono text-sm'>{a.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className='hidden md:table-cell font-mono text-sm text-muted-foreground'>{a.ip}</TableCell>
                      <TableCell className='hidden lg:table-cell text-sm'>{a.location}</TableCell>
                      <TableCell className='hidden md:table-cell text-sm text-muted-foreground'>{a.device}</TableCell>
                      <TableCell className='text-sm text-muted-foreground'>{a.time}</TableCell>
                      <TableCell>
                        <Badge variant='outline' className={`text-[10px] gap-1 ${a.status === 'success' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : a.status === 'failed' ? 'bg-amber-500/10 text-amber-600 border-amber-200' : 'bg-red-500/10 text-red-500 border-red-200'}`}>
                          {a.status === 'success' ? <CheckCircle2 className='h-3 w-3' /> : a.status === 'failed' ? <XCircle className='h-3 w-3' /> : <AlertTriangle className='h-3 w-3 animate-pulse' />}{a.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}