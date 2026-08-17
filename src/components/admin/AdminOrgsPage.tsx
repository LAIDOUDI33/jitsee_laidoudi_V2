'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Building2,
  Plus,
  Search,
  Users,
  HardDrive,
  MoreVertical,
  Settings2,
  ExternalLink,
  Crown,
  Rocket,
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { authFetch } from '@/lib/api'

interface Org {
  id: string
  name: string
  plan: 'free' | 'pro' | 'enterprise'
  users: number
  maxUsers: number
  storage: string
  storageUsed: number
  meetings: number
  status: 'active' | 'trial' | 'suspended'
  createdAt: string
  admin: string
  members: { name: string }[]
}

interface OrgStats {
  totalOrgs: number
  totalUsers: number
  enterpriseCount: number
}

const planColors: Record<string, string> = {
  free: 'bg-zinc-500/10 text-zinc-500 border-zinc-200 dark:border-zinc-700/50',
  pro: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800/50',
  enterprise: 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800/50',
}

const planIcons: Record<string, React.ReactNode> = {
  free: <Zap className='h-3 w-3' />,
  pro: <Rocket className='h-3 w-3' />,
  enterprise: <Crown className='h-3 w-3' />,
}

const statusConfig: Record<string, { color: string; dot: string; icon: React.ReactNode }> = {
  active: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800/50', dot: 'bg-emerald-500', icon: <CheckCircle2 className='h-3 w-3' /> },
  trial: { color: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800/50', dot: 'bg-amber-500', icon: <Clock className='h-3 w-3' /> },
  suspended: { color: 'bg-red-500/10 text-red-500 border-red-200 dark:border-red-800/50', dot: 'bg-red-500', icon: <AlertCircle className='h-3 w-3' /> },
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } } }

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function AdminOrgsPage() {
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<OrgStats>({ totalOrgs: 0, totalUsers: 0, enterpriseCount: 0 })
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgPlan, setNewOrgPlan] = useState('free')

  const fetchOrgs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (planFilter !== 'all') params.set('plan', planFilter)
      const query = params.toString() ? `?${params.toString()}` : ''
      const res = await authFetch(`/api/v1/admin/organizations${query}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: 'Failed to fetch organizations' } }))
        throw new Error(err.error?.message || 'Failed to fetch organizations')
      }
      const json = await res.json()
      const { organizations, total, planCounts } = json.data

      // Transform groupBy planCounts to flat record
      const pcMap: Record<string, number> = {}
      if (Array.isArray(planCounts)) {
        for (const p of planCounts) { pcMap[p.plan] = p._count?.id || 0 }
      } else if (planCounts && typeof planCounts === 'object') {
        Object.assign(pcMap, planCounts)
      }

      const mappedOrgs: Org[] = organizations.map((o: Record<string, unknown>) => ({
        id: String(o.id ?? ''),
        name: String(o.name ?? ''),
        plan: (['free', 'pro', 'enterprise'].includes(String(o.plan)) ? String(o.plan) : 'free') as Org['plan'],
        users: Number((o._count as Record<string, unknown>)?.users ?? 0),
        maxUsers: Number(o.maxUsers ?? 10),
        storage: '—',
        storageUsed: 0,
        meetings: Number((o._count as Record<string, unknown>)?.meetings ?? 0),
        status: 'active' as const,
        createdAt: formatDate(String(o.createdAt ?? '')),
        admin: '',
        members: [],
      }))

      const totalUsers = organizations.reduce((sum: number, o: Record<string, unknown>) => sum + Number((o._count as Record<string, unknown>)?.users ?? 0), 0)
      const enterpriseCount = pcMap.enterprise ?? organizations.filter((o: Record<string, unknown>) => o.plan === 'enterprise').length

      setOrgs(mappedOrgs)
      setStats({ totalOrgs: total ?? organizations.length, totalUsers, enterpriseCount })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }, [search, planFilter])

  useEffect(() => {
    fetchOrgs()
  }, [fetchOrgs])

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) {
      toast.error('Organization name is required')
      return
    }
    try {
      const res = await authFetch('/api/v1/admin/organizations', {
        method: 'POST',
        body: JSON.stringify({ name: newOrgName, plan: newOrgPlan }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: 'Failed to create organization' } }))
        throw new Error(err.error?.message || 'Failed to create organization')
      }
      toast.success('Organization created')
      setCreateOpen(false)
      setNewOrgName('')
      setNewOrgPlan('free')
      fetchOrgs()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create organization')
    }
  }

  return (
    <motion.div className='space-y-6' variants={container} initial='hidden' animate='show'>
      {/* Stats with trend indicators */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {[
          { label: 'Organizations', value: String(stats.totalOrgs), change: '', trend: 'up' as const, icon: <Building2 className='h-5 w-5' />, color: 'from-cyan-500/10 to-cyan-500/5 text-cyan-600' },
          { label: 'Total Users', value: String(stats.totalUsers), change: '', trend: 'up' as const, icon: <Users className='h-5 w-5' />, color: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600' },
          { label: 'Enterprise', value: String(stats.enterpriseCount), icon: <Crown className='h-5 w-5' />, color: 'from-purple-500/10 to-purple-500/5 text-purple-600' },
          { label: 'Total Storage', value: '—', icon: <HardDrive className='h-5 w-5' />, color: 'from-amber-500/10 to-amber-500/5 text-amber-600' },
        ].map(s => (
          <motion.div key={s.label} variants={item}>
            <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5 border border-border/50 hover:border-primary/30 bg-gradient-to-br from-card to-card/80'>
              <CardContent className='p-4 flex items-center gap-3'>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${s.color}`}>{s.icon}</div>
                <div className='flex-1'>
                  <div className='flex items-baseline gap-2'>
                    <p className='text-2xl font-bold tracking-tight'>{s.value}</p>
                    {s.change && (
                      <span className={`text-xs font-semibold flex items-center gap-0.5 ${s.trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {s.trend === 'up' ? <TrendingUp className='h-3 w-3' /> : <TrendingDown className='h-3 w-3' />}{s.change}
                      </span>
                    )}
                  </div>
                  <p className='text-xs text-muted-foreground'>{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <motion.div variants={item} className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='flex items-center gap-2 flex-1 flex-wrap'>
          <div className='relative flex-1 max-w-xs'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input placeholder='Search organizations...' className='pl-9 h-9 focus:ring-2 focus:ring-primary/20' value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className='flex gap-1.5'>
            {['all', 'free', 'pro', 'enterprise'].map(p => (
              <button key={p} onClick={() => setPlanFilter(p)} className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-200 hover:scale-[1.02] inline-flex items-center gap-1 ${planFilter === p ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/30 text-muted-foreground'}`}>
                {p !== 'all' && planIcons[p]}{p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button size='sm' className='gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-transform'><Plus className='h-3.5 w-3.5' /> New Org</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Create Organization</DialogTitle></DialogHeader><div className='space-y-4 pt-2'><div className='space-y-2'><Label>Organization Name</Label><Input placeholder='e.g. Acme Corp' value={newOrgName} onChange={e => setNewOrgName(e.target.value)} /></div><div className='space-y-2'><Label>Plan</Label><Select value={newOrgPlan} onValueChange={setNewOrgPlan}><SelectTrigger><SelectValue placeholder='Select plan' /></SelectTrigger><SelectContent><SelectItem value='free'>Free</SelectItem><SelectItem value='pro'>Pro</SelectItem><SelectItem value='enterprise'>Enterprise</SelectItem></SelectContent></Select></div><div className='flex justify-end gap-3 pt-2'><Button variant='outline' onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleCreateOrg}>Create</Button></div></div></DialogContent>
        </Dialog>
      </motion.div>

      {/* Org table */}
      <motion.div variants={item}>
        <Card className='hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border border-border/50 bg-gradient-to-br from-card to-card/80'>
          {loading ? (
            <div className='animate-pulse p-8 space-y-4'>
              <div className='h-4 bg-muted rounded w-1/4' />
              <div className='space-y-3'>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className='h-12 bg-muted rounded' />
                ))}
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className='divide-y divide-border/50'>
                    <TableHead>Organization</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className='hidden md:table-cell'>Members</TableHead>
                    <TableHead className='hidden lg:table-cell'>Storage</TableHead>
                    <TableHead className='hidden xl:table-cell'>Meetings</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='w-10' />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgs.map(o => {
                    const sc = statusConfig[o.status]
                    return (
                      <TableRow key={o.id} className='group even:bg-muted/30 hover:bg-muted/50 divide-y divide-border/50 transition-colors'>
                        <TableCell>
                          <div className='flex items-center gap-3'>
                            {/* Org logo placeholder with initial */}
                            <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0 border border-border/50 font-bold text-sm text-primary'>
                              {o.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className='min-w-0'>
                              <p className='font-medium text-sm'>{o.name}</p>
                              <p className='text-xs text-muted-foreground'>Since {o.createdAt}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline' className={`text-[10px] capitalize gap-1 ${planColors[o.plan]}`}>{planIcons[o.plan]}{o.plan}</Badge>
                        </TableCell>
                        <TableCell className='hidden md:table-cell'>
                          <div className='flex items-center gap-2'>
                            <div className='flex -space-x-2'>
                              {o.members.slice(0, 3).map((m, i) => (
                                <Avatar key={i} className='h-6 w-6 border-2 border-background'>
                                  <AvatarFallback className='text-[9px] bg-muted font-medium'>{m.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                              ))}
                              {o.users > 3 && (
                                <div className='h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[9px] font-medium text-muted-foreground'>+{o.users - 3}</div>
                              )}
                            </div>
                            <span className='text-sm text-muted-foreground'>{o.users}{o.maxUsers > 0 ? `/${o.maxUsers}` : ' (∞)'}</span>
                          </div>
                        </TableCell>
                        <TableCell className='hidden lg:table-cell'>
                          <div className='space-y-1.5 min-w-[120px]'>
                            <div className='flex items-center justify-between'>
                              <p className='text-sm'>{o.storage}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className='hidden xl:table-cell text-sm'>{o.meetings.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant='outline' className={`text-[10px] capitalize gap-1 ${sc.color}`}>{sc.icon}<span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${o.status === 'active' ? 'animate-pulse' : ''}`} />{o.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant='ghost' size='icon' className='h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-[1.1]'><MoreVertical className='h-4 w-4' /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem className='gap-2'><Settings2 className='h-4 w-4' /> Settings</DropdownMenuItem>
                              <DropdownMenuItem className='gap-2'><Users className='h-4 w-4' /> Manage Users</DropdownMenuItem>
                              <DropdownMenuItem className='gap-2'><ExternalLink className='h-4 w-4' /> View Details</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              {orgs.length === 0 && (
                <div className='text-center py-16'>
                  <Building2 className='h-16 w-16 mx-auto mb-4 opacity-20 text-muted-foreground' />
                  <p className='font-medium text-muted-foreground'>No organizations found</p>
                  <p className='text-sm text-muted-foreground/60 mt-1'>Try adjusting your search or filters</p>
                  <Button variant='outline' size='sm' className='mt-4 gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={() => { setSearch(''); setPlanFilter('all') }}>Clear Filters</Button>
                </div>
              )}
            </>
          )}
        </Card>
      </motion.div>
    </motion.div>
  )
}