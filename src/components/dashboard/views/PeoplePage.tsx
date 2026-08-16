'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Search,
  Phone,
  Mail,
  Video,
  MessageSquare,
  MoreHorizontal,
  Star,
  Users,
  UserPlus,
  Building2,
  Briefcase,
  Circle,
} from 'lucide-react'
import { motion } from 'framer-motion'

// ── Types ──────────────────────────────────────────────────────────────

interface Person {
  id: string
  name: string
  initials: string
  role: string
  department: string
  email: string
  phone: string
  online: boolean
  featured: boolean
  gradient: string
}

// ── Mock Data ──────────────────────────────────────────────────────────

const people: Person[] = [
  {
    id: 'p-1', name: 'Sarah Chen', initials: 'SC', role: 'VP of Engineering',
    department: 'Engineering', email: 'sarah.chen@alvision.io', phone: '+1 (415) 555-0101',
    online: true, featured: true, gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'p-2', name: 'Marcus Rivera', initials: 'MR', role: 'Head of Product',
    department: 'Product', email: 'marcus.r@alvision.io', phone: '+1 (415) 555-0102',
    online: true, featured: true, gradient: 'from-violet-500 to-purple-600',
  },
  {
    id: 'p-3', name: 'Elena Volkov', initials: 'EV', role: 'Design Director',
    department: 'Design', email: 'elena.v@alvision.io', phone: '+1 (415) 555-0103',
    online: false, featured: true, gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'p-4', name: 'James Wilson', initials: 'JW', role: 'Chief Revenue Officer',
    department: 'Sales', email: 'james.w@alvision.io', phone: '+1 (415) 555-0104',
    online: true, featured: true, gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'p-5', name: 'Aisha Patel', initials: 'AP', role: 'Senior Frontend Engineer',
    department: 'Engineering', email: 'aisha.p@alvision.io', phone: '+1 (415) 555-0105',
    online: true, featured: false, gradient: 'from-rose-500 to-pink-600',
  },
  {
    id: 'p-6', name: 'Tomás Garcia', initials: 'TG', role: 'Backend Lead',
    department: 'Engineering', email: 'tomas.g@alvision.io', phone: '+1 (415) 555-0106',
    online: false, featured: false, gradient: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'p-7', name: 'Lina Johansson', initials: 'LJ', role: 'Product Manager',
    department: 'Product', email: 'lina.j@alvision.io', phone: '+1 (415) 555-0107',
    online: true, featured: false, gradient: 'from-violet-500 to-indigo-600',
  },
  {
    id: 'p-8', name: 'David Kim', initials: 'DK', role: 'UX Designer',
    department: 'Design', email: 'david.k@alvision.io', phone: '+1 (415) 555-0108',
    online: true, featured: false, gradient: 'from-emerald-500 to-green-600',
  },
  {
    id: 'p-9', name: 'Rachel Morgan', initials: 'RM', role: 'Content Strategist',
    department: 'Marketing', email: 'rachel.m@alvision.io', phone: '+1 (415) 555-0109',
    online: false, featured: false, gradient: 'from-amber-500 to-yellow-600',
  },
  {
    id: 'p-10', name: 'Carlos Mendes', initials: 'CM', role: 'Account Executive',
    department: 'Sales', email: 'carlos.m@alvision.io', phone: '+1 (415) 555-0110',
    online: true, featured: false, gradient: 'from-rose-500 to-red-600',
  },
  {
    id: 'p-11', name: 'Priya Sharma', initials: 'PS', role: 'HR Business Partner',
    department: 'HR', email: 'priya.s@alvision.io', phone: '+1 (415) 555-0111',
    online: true, featured: false, gradient: 'from-cyan-500 to-teal-600',
  },
  {
    id: 'p-12', name: 'Alexander Novak', initials: 'AN', role: 'CEO',
    department: 'Executive', email: 'alex.n@alvision.io', phone: '+1 (415) 555-0112',
    online: false, featured: false, gradient: 'from-blue-500 to-violet-600',
  },
]

const departments = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Executive'] as const

// ── Animation helpers ─────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0)
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    const duration = 1200
    const startTime = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target])
  return <span>{count}</span>
}

// ── Main Component ────────────────────────────────────────────────────

export default function PeoplePage() {
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return people.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.role.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase())
      const matchesDept = !deptFilter || p.department === deptFilter
      return matchesSearch && matchesDept
    })
  }, [search, deptFilter])

  const featured = filtered.filter((p) => p.featured)
  const regular = filtered.filter((p) => !p.featured)

  const totalCount = people.length
  const onlineCount = people.filter((p) => p.online).length
  const newThisMonth = 2

  const deptCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    departments.forEach((d) => {
      counts[d] = people.filter((p) => p.department === d).length
    })
    return counts
  }, [])

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* ── Header ── */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">People</h1>
            <p className="text-sm text-muted-foreground">Enterprise directory &amp; team contacts</p>
          </div>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search people..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </motion.div>

      {/* ── Department Filters ── */}
      <motion.div variants={item} className="flex flex-wrap gap-2">
        <Button
          variant={deptFilter === null ? 'default' : 'outline'}
          size="sm"
          className="h-8 text-xs rounded-lg"
          onClick={() => setDeptFilter(null)}
        >
          <Building2 className="h-3.5 w-3.5 mr-1.5" />
          All
        </Button>
        {departments.map((dept) => (
          <Button
            key={dept}
            variant={deptFilter === dept ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs rounded-lg"
            onClick={() => setDeptFilter(deptFilter === dept ? null : dept)}
          >
            {dept}
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px] rounded-full">
              {deptCounts[dept]}
            </Badge>
          </Button>
        ))}
      </motion.div>

      {/* ── Stats Row ── */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border border-border/50 rounded-xl hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="flex items-center gap-3 py-4 px-5">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-violet-500/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold"><AnimatedCounter target={totalCount} /></p>
              <p className="text-xs text-muted-foreground">Total People</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border/50 rounded-xl hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="flex items-center gap-3 py-4 px-5">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-600">
              <Circle className="h-5 w-5 fill-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{onlineCount}</p>
              <p className="text-xs text-muted-foreground">Online Now</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border/50 rounded-xl hover:shadow-lg hover:shadow-sky-500/10 hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="flex items-center gap-3 py-4 px-5">
            <div className="p-2 rounded-lg bg-gradient-to-br from-sky-500/20 to-blue-500/10 text-blue-600">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{newThisMonth}</p>
              <p className="text-xs text-muted-foreground">New This Month</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Featured People (horizontal scroll) ── */}
      {featured.length > 0 && (
        <motion.div variants={item}>
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold">Featured</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
            {featured.map((person) => (
              <motion.div key={person.id} variants={item} whileHover={{ y: -4 }} className="shrink-0">
                <Card
                  className={`w-64 bg-card border rounded-xl overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer ${
                    selectedId === person.id
                      ? 'border-primary ring-1 ring-primary/30'
                      : 'border-border/50'
                  }`}
                  onClick={() => setSelectedId(person.id)}
                >
                  <div className={`h-16 bg-gradient-to-r ${person.gradient}`} />
                  <CardContent className="px-4 pb-4 pt-0 -mt-6">
                    <Avatar className="h-12 w-12 border-2 border-background mb-2">
                      <AvatarFallback className={`bg-gradient-to-br ${person.gradient} text-white text-sm font-bold`}>
                        {person.initials}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-sm font-bold">{person.name}</h3>
                    <p className="text-xs text-muted-foreground">{person.role}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 rounded-full">
                        {person.department}
                      </Badge>
                      <span className={`h-2 w-2 rounded-full ${person.online ? 'bg-emerald-500 animate-breathe' : 'bg-muted-foreground/30'}`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── People Grid ── */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">
            All People
            <span className="text-muted-foreground font-normal ml-2">({filtered.length})</span>
          </h2>
        </div>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {regular.map((person) => (
            <motion.div key={person.id} variants={item}>
              <Card
                className={`bg-card border rounded-xl hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden relative ${
                  selectedId === person.id
                    ? 'border-primary ring-1 ring-primary/30'
                    : 'border-border/50'
                }`}
                onClick={() => setSelectedId(selectedId === person.id ? null : person.id)}
              >
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${person.gradient}`} />
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-11 w-11">
                        <AvatarFallback className={`bg-gradient-to-br ${person.gradient} text-white text-xs font-bold`}>
                          {person.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background ${
                          person.online ? 'bg-emerald-500 animate-breathe' : 'bg-muted-foreground/30'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold truncate">{person.name}</h3>
                        {person.online && (
                          <span className="text-[9px] text-emerald-600 font-medium">Online</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{person.role}</p>
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 rounded-full mt-1">
                        <Briefcase className="h-2.5 w-2.5 mr-1" />
                        {person.department}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{person.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span>{person.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                    <Button variant="outline" size="sm" className="h-7 text-xs flex-1 rounded-lg gap-1">
                      <MessageSquare className="h-3 w-3" />
                      Message
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs flex-1 rounded-lg gap-1">
                      <Video className="h-3 w-3" />
                      Call
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {regular.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">No people found</p>
            <p className="text-xs mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
