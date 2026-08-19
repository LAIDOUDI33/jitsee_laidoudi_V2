'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Building2,
  Pencil,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  Shield,
  KeyRound,
  Palette,
  Upload,
  Trash2,
  Globe,
  Users,
  Video,
  Loader2,
  ExternalLink,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { authFetch } from '@/lib/api'
import { useAppStore } from '@/store/app-store'
import { ROLES_HIERARCHY } from '@/lib/roles'

// ── Types ──────────────────────────────────────────────────────────────

interface OrgData {
  id: string
  name: string
  domain: string | null
  plan: string
  maxUsers: number
  maxMeetingRooms: number
  settings: Record<string, unknown>
  createdAt?: string
  updatedAt?: string
}

interface SsoData {
  samlEnabled: boolean
  samlMetadataUrl?: string
  oidcEnabled: boolean
  oidcClientId?: string
  oidcIssuer?: string
  oidcClientSecret?: string
}

// ── Plan badge config ─────────────────────────────────────────────────

const planConfig: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  free: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
  pro: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
  enterprise: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800', dot: 'bg-rose-500' },
}

// ── Animation helpers ─────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

// ── Loading skeleton ──────────────────────────────────────────────────

function SettingsSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-3'>
        <Skeleton className='h-6 w-6 rounded' />
        <div className='space-y-2'>
          <Skeleton className='h-7 w-40' />
          <Skeleton className='h-4 w-64' />
        </div>
      </div>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className='h-64 rounded-xl' />
        ))}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────

export default function OrgSettingsPage() {
  const { user } = useAppStore()
  const userRole = user?.role || 'participant'
  const canEdit = (ROLES_HIERARCHY[userRole] ?? 0) >= (ROLES_HIERARCHY['orgadmin'] ?? 0)

  // Org data
  const [org, setOrg] = useState<OrgData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit mode
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', domain: '', plan: 'free', maxUsers: 50, maxMeetingRooms: 20 })

  // SSO
  const [sso, setSso] = useState<SsoData | null>(null)
  const [ssoLoading, setSsoLoading] = useState(false)
  const [ssoSaving, setSsoSaving] = useState(false)
  const [ssoForm, setSsoForm] = useState<SsoData>({ samlEnabled: false, samlMetadataUrl: '', oidcEnabled: false, oidcClientId: '', oidcIssuer: '', oidcClientSecret: '' })
  const [testingSaml, setTestingSaml] = useState(false)
  const [testingOidc, setTestingOidc] = useState(false)

  // Branding
  const [brandColor, setBrandColor] = useState('#10b981')
  const [emailDomain, setEmailDomain] = useState('')

  const fetchOrg = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch('/api/v1/organization/settings')
      if (res.status === 403) {
        setError('You need organization admin permissions to view settings')
        return
      }
      if (!res.ok) throw new Error('Failed to fetch organization settings')
      const json = await res.json()
      if (json.success) {
        const data = json.data as OrgData
        setOrg(data)
        setEditForm({
          name: data.name,
          domain: data.domain || '',
          plan: data.plan,
          maxUsers: data.maxUsers,
          maxMeetingRooms: data.maxMeetingRooms,
        })
        // Extract branding from settings
        const settings = data.settings || {}
        if (typeof settings.primaryColor === 'string') setBrandColor(settings.primaryColor)
        if (typeof settings.customEmailDomain === 'string') setEmailDomain(settings.customEmailDomain)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organization settings')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSso = useCallback(async () => {
    if (!canEdit) return
    setSsoLoading(true)
    try {
      const res = await authFetch('/api/v1/organization/sso')
      if (!res.ok) return
      const json = await res.json()
      if (json.success) {
        const data = json.data as SsoData
        setSso(data)
        setSsoForm({
          samlEnabled: data.samlEnabled,
          samlMetadataUrl: data.samlMetadataUrl || '',
          oidcEnabled: data.oidcEnabled,
          oidcClientId: data.oidcClientId || '',
          oidcIssuer: data.oidcIssuer || '',
          oidcClientSecret: '', // don't prefill masked secret
        })
      }
    } catch {
      // SSO fetch is optional — don't error
    } finally {
      setSsoLoading(false)
    }
  }, [canEdit])

  useEffect(() => { fetchOrg() }, [fetchOrg])
  useEffect(() => { fetchSso() }, [fetchSso])

  // ── Save org info ──
  const handleSaveOrg = async () => {
    setSaving(true)
    try {
      const res = await authFetch('/api/v1/organization/settings', {
        method: 'PUT',
        body: JSON.stringify({
          name: editForm.name,
          domain: editForm.domain || null,
          plan: editForm.plan,
          maxUsers: editForm.maxUsers,
          maxMeetingRooms: editForm.maxMeetingRooms,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: 'Failed to save' } }))
        throw new Error(err.error?.message || 'Failed to save organization settings')
      }
      const json = await res.json()
      if (json.success) {
        setOrg(json.data)
        setEditing(false)
        toast.success('Organization settings saved')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // ── Save SSO ──
  const handleSaveSso = async () => {
    setSsoSaving(true)
    try {
      const res = await authFetch('/api/v1/organization/sso', {
        method: 'PUT',
        body: JSON.stringify(ssoForm),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: 'Failed to save SSO' } }))
        throw new Error(err.error?.message || 'Failed to save SSO configuration')
      }
      toast.success('SSO configuration saved')
      fetchSso()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save SSO')
    } finally {
      setSsoSaving(false)
    }
  }

  // ── Test SSO ──
  const handleTestSso = async (type: 'saml' | 'oidc') => {
    const url = type === 'saml' ? ssoForm.samlMetadataUrl : ssoForm.oidcIssuer
    if (!url) {
      toast.error('Please enter a URL first')
      return
    }
    if (type === 'saml') setTestingSaml(true)
    else setTestingOidc(true)
    try {
      const res = await authFetch('/api/v1/organization/sso?action=test-sso', {
        method: 'POST',
        body: JSON.stringify({ type, url }),
      })
      const json = await res.json()
      if (json.success) {
        const result = json.data
        if (result.reachable && result.validContent) {
          toast.success(`${type.toUpperCase()} endpoint is valid`) }
        else if (result.reachable) {
          toast.warning(`${type.toUpperCase()} reachable but content type may not match`)
        } else {
          toast.error(`${type.toUpperCase()} endpoint unreachable: ${result.message}`)
        }
      } else {
        toast.error(json.error?.message || `Failed to test ${type.toUpperCase()}`)
      }
    } catch {
      toast.error(`Failed to test ${type.toUpperCase()} configuration`)
    } finally {
      if (type === 'saml') setTestingSaml(false)
      else setTestingOidc(false)
    }
  }

  // ── Save branding ──
  const handleSaveBranding = async () => {
    setSaving(true)
    try {
      const res = await authFetch('/api/v1/organization/settings', {
        method: 'PUT',
        body: JSON.stringify({
          settings: { primaryColor: brandColor, customEmailDomain: emailDomain || null },
        }),
      })
      if (!res.ok) throw new Error('Failed to save branding')
      toast.success('Branding settings saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save branding')
    } finally {
      setSaving(false)
    }
  }

  // ── Render helpers ──

  function PlanBadge({ plan }: { plan: string }) {
    const cfg = planConfig[plan] || planConfig.free
    return (
      <Badge variant='outline' className={`${cfg.bg} ${cfg.text} ${cfg.border} border gap-1.5 text-xs capitalize font-medium`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {plan}
      </Badge>
    )
  }

  // ── Loading state ──
  if (loading) return <SettingsSkeleton />

  // ── Error state ──
  if (error) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center gap-3'>
          <Building2 className='h-6 w-6 text-primary' />
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Organization Settings</h1>
            <p className='text-sm text-muted-foreground'>Manage your organization configuration</p>
          </div>
        </div>
        <div className='flex flex-col items-center justify-center py-16'>
          <div className='relative'>
            <AlertCircle className='h-16 w-16 text-red-500/20' />
            <div className='absolute inset-0 flex items-center justify-center'>
              <AlertCircle className='h-8 w-8 text-red-500/40' />
            </div>
          </div>
          <p className='font-medium mt-4'>{error}</p>
          <Button variant='outline' className='mt-4 gap-2' onClick={fetchOrg}>
            <RefreshCw className='h-4 w-4' /> Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!org) return null

  return (
    <motion.div className='space-y-6' variants={container} initial='hidden' animate='show'>
      {/* ── Header ── */}
      <motion.div variants={item} className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <div className='p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-600'>
            <Building2 className='h-5 w-5' />
          </div>
          <div>
            <div className='flex items-center gap-2'>
              <h1 className='text-2xl font-bold tracking-tight'>{org.name}</h1>
              <PlanBadge plan={org.plan} />
            </div>
            <p className='text-sm text-muted-foreground'>Organization settings &amp; configuration</p>
          </div>
        </div>
        {canEdit && !editing && (
          <Button variant='outline' size='sm' className='gap-2' onClick={() => setEditing(true)}>
            <Pencil className='h-3.5 w-3.5' /> Edit Settings
          </Button>
        )}
      </motion.div>

      {/* ── Tabs layout ── */}
      <motion.div variants={item}>
        <Tabs defaultValue='general' className='space-y-6'>
          <TabsList className='w-full sm:w-auto'>
            <TabsTrigger value='general' className='gap-1.5'>
              <Building2 className='h-3.5 w-3.5' /> General
            </TabsTrigger>
            <TabsTrigger value='sso' className='gap-1.5'>
              <Shield className='h-3.5 w-3.5' /> SSO
            </TabsTrigger>
            <TabsTrigger value='branding' className='gap-1.5'>
              <Palette className='h-3.5 w-3.5' /> Branding
            </TabsTrigger>
            <TabsTrigger value='danger' className='gap-1.5'>
              <AlertCircle className='h-3.5 w-3.5' /> Danger Zone
            </TabsTrigger>
          </TabsList>

          {/* ══════ General Tab ══════ */}
          <TabsContent value='general' className='space-y-6'>
            <Card className='border border-border/50 rounded-xl hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300'>
              <CardHeader className='pb-4'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-base'>Organization Information</CardTitle>
                  {!canEdit && (
                    <Badge variant='outline' className='text-[10px] text-muted-foreground'>Read-only</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className='space-y-4'>
                {editing ? (
                  <div className='space-y-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='org-name'>Organization Name</Label>
                      <Input id='org-name' value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='org-domain'>Domain</Label>
                      <Input id='org-domain' value={editForm.domain} onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })} placeholder='company.com' />
                    </div>
                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                      <div className='space-y-2'>
                        <Label>Plan</Label>
                        <Select value={editForm.plan} onValueChange={(v) => setEditForm({ ...editForm, plan: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value='free'>Free</SelectItem>
                            <SelectItem value='pro'>Pro</SelectItem>
                            <SelectItem value='enterprise'>Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='max-users'>Max Users</Label>
                        <Input id='max-users' type='number' min={1} max={100000} value={editForm.maxUsers} onChange={(e) => setEditForm({ ...editForm, maxUsers: parseInt(e.target.value) || 50 })} />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='max-rooms'>Max Meeting Rooms</Label>
                        <Input id='max-rooms' type='number' min={1} max={10000} value={editForm.maxMeetingRooms} onChange={(e) => setEditForm({ ...editForm, maxMeetingRooms: parseInt(e.target.value) || 20 })} />
                      </div>
                    </div>
                    <div className='flex justify-end gap-2 pt-2'>
                      <Button variant='outline' onClick={() => { setEditing(false); setEditForm({ name: org.name, domain: org.domain || '', plan: org.plan, maxUsers: org.maxUsers, maxMeetingRooms: org.maxMeetingRooms }) }}>
                        <X className='h-4 w-4 mr-1' /> Cancel
                      </Button>
                      <Button onClick={handleSaveOrg} disabled={saving}>
                        {saving ? <Loader2 className='h-4 w-4 mr-1 animate-spin' /> : <Check className='h-4 w-4 mr-1' />}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div className='space-y-1'>
                      <p className='text-xs text-muted-foreground'>Organization Name</p>
                      <p className='text-sm font-medium'>{org.name}</p>
                    </div>
                    <div className='space-y-1'>
                      <p className='text-xs text-muted-foreground'>Domain</p>
                      <p className='text-sm font-medium'>{org.domain || 'Not set'}</p>
                    </div>
                    <div className='space-y-1'>
                      <p className='text-xs text-muted-foreground'>Plan</p>
                      <PlanBadge plan={org.plan} />
                    </div>
                    <div className='space-y-1'>
                      <p className='text-xs text-muted-foreground'>Max Users</p>
                      <div className='flex items-center gap-1.5'>
                        <Users className='h-3.5 w-3.5 text-muted-foreground' />
                        <p className='text-sm font-medium'>{org.maxUsers}</p>
                      </div>
                    </div>
                    <div className='space-y-1'>
                      <p className='text-xs text-muted-foreground'>Max Meeting Rooms</p>
                      <div className='flex items-center gap-1.5'>
                        <Video className='h-3.5 w-3.5 text-muted-foreground' />
                        <p className='text-sm font-medium'>{org.maxMeetingRooms}</p>
                      </div>
                    </div>
                    {org.createdAt && (
                      <div className='space-y-1'>
                        <p className='text-xs text-muted-foreground'>Created</p>
                        <p className='text-sm font-medium'>{new Date(org.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════ SSO Tab ══════ */}
          <TabsContent value='sso' className='space-y-6'>
            {!canEdit ? (
              <Card className='border border-border/50 rounded-xl'>
                <CardContent className='flex flex-col items-center justify-center py-12'>
                  <Shield className='h-12 w-12 text-muted-foreground/30 mb-3' />
                  <p className='text-sm text-muted-foreground'>SSO configuration is only available to organization admins.</p>
                </CardContent>
              </Card>
            ) : ssoLoading ? (
              <Card className='border border-border/50 rounded-xl'>
                <CardContent className='p-6 space-y-4'>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className='h-10 rounded-lg' />
                  ))}
                </CardContent>
              </Card>
            ) : (
              <>
                {/* SAML Card */}
                <Card className='border border-border/50 rounded-xl hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300'>
                  <CardHeader className='pb-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <KeyRound className='h-4 w-4 text-emerald-600' />
                        <CardTitle className='text-base'>SAML SSO</CardTitle>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Label htmlFor='saml-toggle' className='text-xs text-muted-foreground'>Enable</Label>
                        <Switch id='saml-toggle' checked={ssoForm.samlEnabled} onCheckedChange={(v) => setSsoForm({ ...ssoForm, samlEnabled: v })} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className={`space-y-4 transition-all duration-300 ${ssoForm.samlEnabled ? '' : 'opacity-50 pointer-events-none'}`}>
                      <div className='space-y-2'>
                        <Label htmlFor='saml-url'>Metadata URL</Label>
                        <Input id='saml-url' value={ssoForm.samlMetadataUrl} onChange={(e) => setSsoForm({ ...ssoForm, samlMetadataUrl: e.target.value })} placeholder='https://idp.example.com/saml/metadata' />
                      </div>
                      <Button variant='outline' size='sm' className='gap-2' onClick={() => handleTestSso('saml')} disabled={testingSaml || !ssoForm.samlMetadataUrl}>
                        {testingSaml ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <ExternalLink className='h-3.5 w-3.5' />}
                        Test SAML Connection
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* OIDC Card */}
                <Card className='border border-border/50 rounded-xl hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300'>
                  <CardHeader className='pb-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <Globe className='h-4 w-4 text-amber-600' />
                        <CardTitle className='text-base'>OpenID Connect (OIDC)</CardTitle>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Label htmlFor='oidc-toggle' className='text-xs text-muted-foreground'>Enable</Label>
                        <Switch id='oidc-toggle' checked={ssoForm.oidcEnabled} onCheckedChange={(v) => setSsoForm({ ...ssoForm, oidcEnabled: v })} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className={`space-y-4 transition-all duration-300 ${ssoForm.oidcEnabled ? '' : 'opacity-50 pointer-events-none'}`}>
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div className='space-y-2'>
                          <Label htmlFor='oidc-client-id'>Client ID</Label>
                          <Input id='oidc-client-id' value={ssoForm.oidcClientId} onChange={(e) => setSsoForm({ ...ssoForm, oidcClientId: e.target.value })} placeholder='your-client-id' />
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor='oidc-issuer'>Issuer URL</Label>
                          <Input id='oidc-issuer' value={ssoForm.oidcIssuer} onChange={(e) => setSsoForm({ ...ssoForm, oidcIssuer: e.target.value })} placeholder='https://auth.example.com' />
                        </div>
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='oidc-client-secret'>Client Secret</Label>
                        <Input id='oidc-client-secret' type='password' value={ssoForm.oidcClientSecret} onChange={(e) => setSsoForm({ ...ssoForm, oidcClientSecret: e.target.value })} placeholder={sso?.oidcClientSecret ? 'Enter new secret to update' : 'Enter client secret'} />
                        {sso?.oidcClientSecret && (
                          <p className='text-[11px] text-muted-foreground flex items-center gap-1'>
                            <Info className='h-3 w-3' /> Current secret: {sso.oidcClientSecret}
                          </p>
                        )}
                      </div>
                      <Button variant='outline' size='sm' className='gap-2' onClick={() => handleTestSso('oidc')} disabled={testingOidc || !ssoForm.oidcIssuer}>
                        {testingOidc ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <ExternalLink className='h-3.5 w-3.5' />}
                        Test OIDC Connection
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className='flex justify-end'>
                  <Button onClick={handleSaveSso} disabled={ssoSaving}>
                    {ssoSaving ? <Loader2 className='h-4 w-4 mr-1 animate-spin' /> : <Check className='h-4 w-4 mr-1' />}
                    Save SSO Configuration
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* ══════ Branding Tab ══════ */}
          <TabsContent value='branding' className='space-y-6'>
            <Card className='border border-border/50 rounded-xl hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300'>
              <CardHeader className='pb-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Palette className='h-4 w-4 text-emerald-600' />
                    <CardTitle className='text-base'>Organization Branding</CardTitle>
                  </div>
                  {!canEdit && <Badge variant='outline' className='text-[10px] text-muted-foreground'>Read-only</Badge>}
                </div>
              </CardHeader>
              <CardContent className='space-y-6'>
                {/* Logo placeholder */}
                <div className='space-y-2'>
                  <Label>Organization Logo</Label>
                  <div className='flex items-center gap-4'>
                    <div className='w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30 hover:border-primary/40 transition-colors cursor-pointer'>
                      <Upload className='h-6 w-6 text-muted-foreground/50' />
                    </div>
                    <div className='space-y-1'>
                      <p className='text-sm font-medium'>Upload logo</p>
                      <p className='text-xs text-muted-foreground'>SVG, PNG or JPG (max 2MB)</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Primary Color */}
                <div className='space-y-2'>
                  <Label htmlFor='brand-color'>Primary Color</Label>
                  <div className='flex items-center gap-3'>
                    <input
                      id='brand-color'
                      type='color'
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className='h-10 w-14 rounded-lg border border-border cursor-pointer'
                      disabled={!canEdit}
                    />
                    <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className='max-w-[200px] font-mono text-sm' disabled={!canEdit} />
                  </div>
                </div>

                <Separator />

                {/* Custom Email Domain */}
                <div className='space-y-2'>
                  <Label htmlFor='email-domain'>Custom Email Domain</Label>
                  <Input
                    id='email-domain'
                    value={emailDomain}
                    onChange={(e) => setEmailDomain(e.target.value)}
                    placeholder='meetings.yourcompany.com'
                    disabled={!canEdit}
                  />
                  <p className='text-xs text-muted-foreground'>Meeting invite emails will be sent from this domain.</p>
                </div>

                {canEdit && (
                  <div className='flex justify-end pt-2'>
                    <Button onClick={handleSaveBranding} disabled={saving}>
                      {saving ? <Loader2 className='h-4 w-4 mr-1 animate-spin' /> : <Check className='h-4 w-4 mr-1' />}
                      Save Branding
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════ Danger Zone Tab ══════ */}
          <TabsContent value='danger' className='space-y-6'>
            <Card className='border border-red-200 dark:border-red-900/50 rounded-xl'>
              <CardHeader className='pb-4'>
                <CardTitle className='text-base text-red-600 flex items-center gap-2'>
                  <AlertCircle className='h-4 w-4' /> Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20'>
                  <div>
                    <p className='text-sm font-medium'>Delete Organization</p>
                    <p className='text-xs text-muted-foreground'>Permanently remove this organization and all its data. This action cannot be undone.</p>
                  </div>
                  <Button variant='outline' size='sm' className='gap-2 text-red-600 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0' disabled>
                    <Trash2 className='h-3.5 w-3.5' /> Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
