'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { motion, useInView } from 'framer-motion'
import {
  Shield, Zap, Brain, Globe, Lock, BarChart3,
  Video, ArrowRight, Play, Check, Menu, X,
  Mic, MicOff, MonitorUp, MessageSquare, MoreHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAppStore } from '@/store/app-store'

// ---------------------------------------------------------------------------
// Dynamic imports for non-landing views
// ---------------------------------------------------------------------------

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    </div>
  )
}

function ViewLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading view...</p>
      </div>
    </div>
  )
}

const LoginPage = dynamic(() => import('@/components/auth/LoginPage'), {
  loading: PageLoader,
  ssr: false,
})
const RegisterPage = dynamic(() => import('@/components/auth/RegisterPage'), {
  loading: PageLoader,
  ssr: false,
})
const DashboardPage = dynamic(() => import('@/components/dashboard/DashboardPage'), {
  loading: PageLoader,
  ssr: false,
})
const MeetingRoomPage = dynamic(() => import('@/components/meeting/MeetingRoomPage'), {
  loading: PageLoader,
  ssr: false,
})
const DashboardLayout = dynamic(() => import('@/components/dashboard/DashboardLayout'), {
  loading: PageLoader,
  ssr: false,
})

// Dashboard sub-views
const MeetingsPage = dynamic(() => import('@/components/dashboard/views/MeetingsPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})
const TeamsPage = dynamic(() => import('@/components/dashboard/views/TeamsPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})
const ChatPage = dynamic(() => import('@/components/chat/ChatPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})
const FilesPage = dynamic(() => import('@/components/dashboard/views/FilesPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})
const RecordingsPage = dynamic(() => import('@/components/dashboard/views/RecordingsPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})
const AIAssistantPage = dynamic(() => import('@/components/dashboard/views/AIAssistantPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})
const KnowledgePage = dynamic(() => import('@/components/dashboard/views/KnowledgePage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})
const CalendarPage = dynamic(() => import('@/components/dashboard/views/CalendarPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})
const EventsPage = dynamic(() => import('@/components/dashboard/views/EventsPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})
const WhiteboardPage = dynamic(() => import('@/components/whiteboard/WhiteboardPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})
const AnalyticsPage = dynamic(() => import('@/components/dashboard/views/AnalyticsPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})
const StatusPage = dynamic(() => import('@/components/dashboard/views/StatusPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})
const PeoplePage = dynamic(() => import('@/components/dashboard/views/PeoplePage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})
const IntegrationsPage = dynamic(() => import('@/components/dashboard/views/IntegrationsPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})
const HelpCenterPage = dynamic(() => import('@/components/dashboard/views/HelpCenterPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})
const WebhooksPage = dynamic(() => import('@/components/dashboard/views/WebhooksPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})
const TemplatesPage = dynamic(() => import('@/components/dashboard/views/TemplatesPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})
const NotificationsPage = dynamic(() => import('@/components/dashboard/views/NotificationsPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})
const BreakoutRoomsPage = dynamic(() => import('@/components/dashboard/views/BreakoutRoomsPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})
const ParticipantsPage = dynamic(() => import('@/components/dashboard/views/ParticipantsPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})
const MeetingNotesPage = dynamic(() => import('@/components/dashboard/views/MeetingNotesPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})
const SessionHistoryPage = dynamic(() => import('@/components/dashboard/views/SessionHistoryPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})

// Admin views
const AdminPage = dynamic(() => import('@/components/admin/AdminPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})
const AdminUsersPage = dynamic(() => import('@/components/admin/AdminUsersPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})
const AdminOrgsPage = dynamic(() => import('@/components/admin/AdminOrgsPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})
const AdminSecurityPage = dynamic(() => import('@/components/admin/AdminSecurityPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})
const AdminAuditPage = dynamic(() => import('@/components/admin/AdminAuditPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})
const AdminSystemPage = dynamic(() => import('@/components/admin/AdminSystemPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})

// Settings & Profile
const SettingsPage = dynamic(() => import('@/components/settings/SettingsPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})
const ProfilePage = dynamic(() => import('@/components/settings/ProfilePage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>, ssr: false,
})

// ---------------------------------------------------------------------------
// Forgot Password page (kept inline)
// ---------------------------------------------------------------------------

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { setCurrentView, navigateBack } = useAppStore()

  const handleSendResetLink = async () => {
    if (!email.trim()) return
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLoading(false)
    setSent(true)
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 order-1">
        <motion.div
          className="absolute top-16 left-12 w-72 h-72 rounded-full bg-white/10 blur-3xl"
          animate={{ y: [0, -30, 0], x: [0, 15, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' as const }}
        />
        <motion.div
          className="absolute bottom-24 right-16 w-56 h-56 rounded-full bg-emerald-300/20 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -18, 0], scale: [1, 0.9, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' as const, delay: 1 }}
        />
        <div className="relative z-10 flex flex-col justify-center items-center p-12 w-full">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
              <Video className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Forgot Password?</h1>
            <p className="text-lg text-white/70 max-w-sm">No worries! We&apos;ll send you a reset link to get back into your account.</p>
          </motion.div>
        </div>
      </div>
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 order-2">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <Video className="h-6 w-6 text-emerald-500" />
            <span className="font-bold text-xl text-white">ALVISION</span>
          </div>
          <Button variant="ghost" size="sm" className="mb-6 -ml-2 text-slate-400 hover:text-white" onClick={navigateBack}>
            <X className="mr-2 h-4 w-4" /> Back
          </Button>
          <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-xl">
            <CardContent className="p-6 sm:p-8">
              <motion.div className="h-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 mb-6" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, delay: 0.3 }} />
              {!sent ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Reset your password</h2>
                  <p className="text-sm text-slate-400 mb-6">Enter your email and we&apos;ll send you a reset link</p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Email address</label>
                      <input
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && handleSendResetLink()}
                      />
                    </div>
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                      disabled={loading}
                      onClick={handleSendResetLink}
                    >
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                  </div>
                  <p className="text-center text-sm text-slate-500 mt-5">
                    Remember your password?{' '}
                    <button onClick={() => setCurrentView('login')} className="text-emerald-400 hover:underline font-medium">
                      Sign in
                    </button>
                  </p>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                  <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Check className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
                  <p className="text-sm text-slate-400 mb-6">We&apos;ve sent a reset link to <span className="font-medium text-slate-200">{email}</span></p>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white" onClick={() => setCurrentView('login')}>
                    Back to Sign In
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dashboard sub-view map
// ---------------------------------------------------------------------------

const dashboardSubViews: Record<string, React.ComponentType> = {
  meetings: MeetingsPage, teams: TeamsPage, chat: ChatPage, files: FilesPage,
  recordings: RecordingsPage, 'ai-assistant': AIAssistantPage, knowledge: KnowledgePage,
  calendar: CalendarPage, events: EventsPage, whiteboard: WhiteboardPage,
  analytics: AnalyticsPage, status: StatusPage, people: PeoplePage,
  integrations: IntegrationsPage, 'help-center': HelpCenterPage, admin: AdminPage,
  'admin-users': AdminUsersPage, 'admin-orgs': AdminOrgsPage,
  'admin-security': AdminSecurityPage, 'admin-audit': AdminAuditPage,
  'admin-system': AdminSystemPage, settings: SettingsPage, profile: ProfilePage,
  webhooks: WebhooksPage, templates: TemplatesPage, notifications: NotificationsPage,
  'breakout-rooms': BreakoutRoomsPage, participants: ParticipantsPage,
  'meeting-notes': MeetingNotesPage, 'session-history': SessionHistoryPage,
}

// ===========================================================================
// LANDING PAGE
// ===========================================================================

/* ---- Animated counter hook ---- */
function useCountUp(target: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const hasStarted = useRef(false)

  useEffect(() => {
    if (startOnView && !inView) return
    if (hasStarted.current) return
    hasStarted.current = true

    const startTime = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, target, duration, startOnView])

  return { count, ref }
}

/* ---- Fade-up section wrapper ---- */
function FadeUp({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ---- Navbar ---- */
function LandingNavbar() {
  const { setCurrentView } = useAppStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Security', href: '#security' },
    { label: 'Analytics', href: '#stats' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">ALVISION</span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-slate-400 hover:text-white transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              className="text-slate-300 hover:text-white hover:bg-slate-800"
              onClick={() => setCurrentView('login')}
            >
              Sign In
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
              onClick={() => setCurrentView('register')}
            >
              Get Started <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-slate-400 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <motion.div
        initial={false}
        animate={{ height: mobileOpen ? 'auto' : 0, opacity: mobileOpen ? 1 : 0 }}
        className="md:hidden overflow-hidden border-t border-slate-800/50"
      >
        <div className="px-4 py-4 space-y-3 bg-slate-950/95">
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="block text-sm text-slate-400 hover:text-white py-2"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <Button variant="ghost" className="w-full text-slate-300 hover:text-white justify-start" onClick={() => setCurrentView('login')}>
              Sign In
            </Button>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white" onClick={() => setCurrentView('register')}>
              Get Started <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </nav>
  )
}

/* ---- Hero Mock Meeting Card ---- */
function HeroMockMeeting() {
  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* Glow effect behind card */}
      <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-3xl blur-2xl" />

      <div className="relative bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl shadow-black/40">
        {/* Mock title bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/60 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-xs text-slate-400 font-medium">Sprint Planning — Engineering Team</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400">Live</span>
          </div>
        </div>

        {/* Video grid mockup */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1 p-1">
          {/* Participant 1 - main speaker */}
          <div className="col-span-1 md:col-span-2 md:row-span-2 relative rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 aspect-video">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-xl">
                SK
              </div>
            </div>
            <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-2.5 py-1">
              <Mic className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-white font-medium">Sarah K.</span>
            </div>
            {/* Speaking indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 animate-pulse" />
          </div>

          {/* Participant 2 */}
          <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 aspect-video">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                MR
              </div>
            </div>
            <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded px-1.5 py-0.5">
              <MicOff className="w-2.5 h-2.5 text-slate-400" />
              <span className="text-[10px] text-white/80">Mike R.</span>
            </div>
          </div>

          {/* Participant 3 */}
          <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 aspect-video">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-600 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                AL
              </div>
            </div>
            <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded px-1.5 py-0.5">
              <Mic className="w-2.5 h-2.5 text-emerald-400" />
              <span className="text-[10px] text-white/80">Alex L.</span>
            </div>
          </div>

          {/* Participant 4 - hidden on small screens */}
          <div className="hidden md:block relative rounded-lg overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 aspect-video">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                JW
              </div>
            </div>
            <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded px-1.5 py-0.5">
              <MicOff className="w-2.5 h-2.5 text-slate-400" />
              <span className="text-[10px] text-white/80">Jane W.</span>
            </div>
          </div>
        </div>

        {/* Mock toolbar */}
        <div className="flex items-center justify-center gap-2 py-3 bg-slate-800/40 border-t border-slate-700/50">
          {[Mic, MicOff, MonitorUp, MessageSquare, MoreHorizontal].map((Icon, i) => (
            <div
              key={i}
              className="w-9 h-9 rounded-full bg-slate-700/60 hover:bg-slate-600/60 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Icon className="w-4 h-4 text-slate-300" />
            </div>
          ))}
          <div className="w-9 h-9 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-colors cursor-pointer">
            <X className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---- Features data ---- */
const features = [
  { icon: Shield, title: 'End-to-End Encryption', description: 'Military-grade encryption protects every call, chat, and file shared across your organization.' },
  { icon: Zap, title: 'Real-Time WebRTC', description: 'Sub-50ms latency powered by peer-to-peer WebRTC connections for crystal-clear video.' },
  { icon: Brain, title: 'AI Meeting Assistant', description: 'Automatic transcripts, action items, and smart summaries generated in real-time.' },
  { icon: Globe, title: 'Global Scale', description: 'Edge servers in 40+ regions ensure reliable, low-latency connections worldwide.' },
  { icon: Lock, title: 'Enterprise Security', description: 'SOC 2 Type II, HIPAA, and GDPR compliant with SSO, SCIM, and audit logging.' },
  { icon: BarChart3, title: 'Advanced Analytics', description: 'Deep insights into meeting patterns, adoption metrics, and collaboration trends.' },
]

/* ---- Trusted companies ---- */
const trustedBy = ['TechCorp', 'DataFlow', 'CloudNine', 'SecureNet', 'InnovateLabs']

/* ---- Footer links ---- */
const footerSections = [
  { title: 'Product', links: ['Features', 'Pricing', 'Integrations', 'Changelog'] },
  { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
  { title: 'Resources', links: ['Documentation', 'API Reference', 'Status', 'Support'] },
  { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Compliance'] },
]

/* ---- Stat counter card ---- */
function StatCard({ prefix, target, suffix, label, delay }: { prefix: string; target: number; suffix: string; label: string; delay: number }) {
  const { count, ref } = useCountUp(target, 2000)
  return (
    <FadeUp delay={delay}>
      <div className="text-center p-8 rounded-2xl bg-slate-900/30 border border-slate-800/40">
        <div className="text-4xl sm:text-5xl font-bold text-white mb-2 tabular-nums" ref={ref}>
          {prefix}{count}{suffix}
        </div>
        <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">{label}</p>
      </div>
    </FadeUp>
  )
}

// ===========================================================================
// Full Landing Page
// ===========================================================================

function LandingPageContent() {
  const { isAuthenticated, setCurrentView } = useAppStore()

  // Auto-redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setCurrentView('dashboard')
    }
  }, [isAuthenticated, setCurrentView])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <LandingNavbar />

      {/* HERO SECTION */}      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        {/* Gradient orbs */}
        <motion.div
          className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px]"
          animate={{ y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' as const }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-teal-500/8 blur-[100px]"
          animate={{ y: [0, 20, 0], scale: [1, 0.9, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' as const, delay: 2 }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AI-Native Collaboration Platform
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
            >
              Enterprise Video
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Conferencing, Reimagined
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              AI-powered meetings with real-time transcription, intelligent summaries, and enterprise-grade security. Built for teams that demand more.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                size="lg"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/20 hover:shadow-emerald-500/30 text-base px-8 py-6 rounded-xl"
                onClick={() => setCurrentView('register')}
              >
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-600 text-base px-8 py-6 rounded-xl"
              >
                <Play className="mr-2 h-5 w-5" /> Watch Demo
              </Button>
            </motion.div>
          </div>

          {/* Mock meeting card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <HeroMockMeeting />
          </motion.div>
        </div>
      </section>

      {/* FEATURES GRID */}      <section id="features" className="relative py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Everything you need for
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent"> modern collaboration</span>
            </h2>
            <p className="text-lg text-slate-400">
              A complete platform built from the ground up with AI at its core.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FadeUp key={feature.title} delay={i * 0.1}>
                <Card className="bg-slate-900/50 border-slate-800/60 hover:border-emerald-500/30 hover:bg-slate-900/80 transition-all duration-300 group h-full">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:bg-emerald-500/15 group-hover:border-emerald-500/30 transition-colors">
                      <feature.icon className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* STATS SECTION */}      <section id="stats" className="relative py-24 md:py-32 border-y border-slate-800/50">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.02] to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Built for{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">uncompromising performance</span>
            </h2>
            <p className="text-lg text-slate-400">
              Enterprise-grade reliability that your team can count on every day.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <StatCard prefix="" target={99.99} suffix="%" label="Uptime" delay={0} />
            <StatCard prefix="< " target={50} suffix="ms" label="Average Latency" delay={0.15} />
            <StatCard prefix="" target={256} suffix="-bit" label="Encryption" delay={0.3} />
          </div>
        </div>
      </section>

      {/* SECURITY SECTION */}      <section id="security" className="relative py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <div className="relative rounded-3xl overflow-hidden border border-slate-800/60">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-slate-900 to-teal-900/20" />
              <div className="relative p-8 md:p-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                  Security you can trust
                </h2>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
                  SOC 2 Type II certified, HIPAA and GDPR compliant. Your data never leaves your control with on-premise deployment options.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {['SOC 2 Type II', 'HIPAA', 'GDPR', 'ISO 27001', 'SSO / SAML'].map(cert => (
                    <span key={cert} className="px-4 py-2 rounded-full bg-slate-800/60 border border-slate-700/50 text-sm text-slate-300 font-medium">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* TRUSTED BY SECTION */}      <section className="py-16 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <p className="text-center text-xs text-slate-500 uppercase tracking-widest mb-8 font-medium">
              Trusted by forward-thinking organizations worldwide
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
              {trustedBy.map((name, i) => (
                <motion.span
                  key={name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="text-lg md:text-xl font-bold text-slate-600 tracking-tight hover:text-slate-400 transition-colors"
                >
                  {name}
                </motion.span>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* CTA SECTION */}      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[120px]"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' as const }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeUp>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Ready to transform how
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                your team collaborates?
              </span>
            </h2>
            <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10">
              Join thousands of organizations already using ALVISION for their most important meetings.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/20 text-base px-8 py-6 rounded-xl"
                onClick={() => setCurrentView('register')}
              >
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-base px-8 py-6 rounded-xl"
                onClick={() => setCurrentView('login')}
              >
                Sign In
              </Button>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* FOOTER */}      <footer className="border-t border-slate-800/50 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-4 lg:mb-0">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center">
                  <Video className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg text-white">ALVISION</span>
              </div>
              <p className="text-sm text-slate-500 max-w-xs">
                Enterprise AI video conferencing built for security, performance, and collaboration.
              </p>
            </div>

            {/* Link columns */}
            {footerSections.map(section => (
              <div key={section.title}>
                <h4 className="text-sm font-semibold text-slate-300 mb-4">{section.title}</h4>
                <ul className="space-y-2.5">
                  {section.links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              &copy; {new Date().getFullYear()} ALVISION. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-slate-600 hover:text-slate-400 transition-colors">Privacy</a>
              <a href="#" className="text-sm text-slate-600 hover:text-slate-400 transition-colors">Terms</a>
              <a href="#" className="text-sm text-slate-600 hover:text-slate-400 transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ===========================================================================
// Main Home component (router)
// ===========================================================================

export default function Home() {
  const { currentView, isAuthenticated } = useAppStore()

  // Public views
  if (!isAuthenticated) {
    switch (currentView) {
      case 'login':
        return (
          <div className="min-h-screen flex flex-col bg-slate-950">
            <LoginPage />
          </div>
        )
      case 'register':
        return (
          <div className="min-h-screen flex flex-col bg-slate-950">
            <RegisterPage />
          </div>
        )
      case 'forgot-password':
        return <ForgotPasswordPage />
      default:
        return <LandingPageContent />
    }
  }

  // Authenticated views
  switch (currentView) {
    case 'meeting-room':
      return <MeetingRoomPage />
    case 'dashboard':
      return <DashboardPage />
    default: {
      const SubView = dashboardSubViews[currentView]
      if (SubView) {
        return <DashboardLayout><SubView /></DashboardLayout>
      }
      return <DashboardPage />
    }
  }
}
