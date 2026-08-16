'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowLeft, Loader2, CheckCircle2, Video } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/store/app-store'
import { Skeleton } from '@/components/ui/skeleton'

// Loading fallback
function PageLoader() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-background'>
      <div className='flex flex-col items-center gap-4'>
        <div className='relative'>
          <div className='w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin' />
        </div>
        <p className='text-sm text-muted-foreground'>Loading...</p>
      </div>
    </div>
  )
}

// Dynamic imports - only loads the component needed for current view
const LandingPage = dynamic(() => import('@/components/landing/LandingPage'), {
  loading: PageLoader,
  ssr: false,
})
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
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>,
  ssr: false,
})
const TeamsPage = dynamic(() => import('@/components/dashboard/views/TeamsPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>,
  ssr: false,
})
const ChatPage = dynamic(() => import('@/components/chat/ChatPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>,
  ssr: false,
})
const FilesPage = dynamic(() => import('@/components/dashboard/views/FilesPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>,
  ssr: false,
})
const RecordingsPage = dynamic(() => import('@/components/dashboard/views/RecordingsPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>,
  ssr: false,
})
const AIAssistantPage = dynamic(() => import('@/components/dashboard/views/AIAssistantPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>,
  ssr: false,
})
const KnowledgePage = dynamic(() => import('@/components/dashboard/views/KnowledgePage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>,
  ssr: false,
})
const CalendarPage = dynamic(() => import('@/components/dashboard/views/CalendarPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>,
  ssr: false,
})
const EventsPage = dynamic(() => import('@/components/dashboard/views/EventsPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>,
  ssr: false,
})
const WhiteboardPage = dynamic(() => import('@/components/whiteboard/WhiteboardPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>,
  ssr: false,
})
const AnalyticsPage = dynamic(() => import('@/components/dashboard/views/AnalyticsPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>,
  ssr: false,
})
const StatusPage = dynamic(() => import('@/components/dashboard/views/StatusPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>,
  ssr: false,
})
const PeoplePage = dynamic(() => import('@/components/dashboard/views/PeoplePage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>,
  ssr: false,
})
const IntegrationsPage = dynamic(() => import('@/components/dashboard/views/IntegrationsPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>,
  ssr: false,
})
const HelpCenterPage = dynamic(() => import('@/components/dashboard/views/HelpCenterPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>,
  ssr: false,
})
const WebhooksPage = dynamic(() => import('@/components/dashboard/views/WebhooksPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>,
  ssr: false,
})
const TemplatesPage = dynamic(() => import('@/components/dashboard/views/TemplatesPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>,
  ssr: false,
})

// Admin views
const AdminPage = dynamic(() => import('@/components/admin/AdminPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>,
  ssr: false,
})
const AdminUsersPage = dynamic(() => import('@/components/admin/AdminUsersPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>,
  ssr: false,
})
const AdminOrgsPage = dynamic(() => import('@/components/admin/AdminOrgsPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>,
  ssr: false,
})
const AdminSecurityPage = dynamic(() => import('@/components/admin/AdminSecurityPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>,
  ssr: false,
})
const AdminAuditPage = dynamic(() => import('@/components/admin/AdminAuditPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>,
  ssr: false,
})
const AdminSystemPage = dynamic(() => import('@/components/admin/AdminSystemPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>,
  ssr: false,
})

// Settings & Profile
const SettingsPage = dynamic(() => import('@/components/settings/SettingsPage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>,
  ssr: false,
})
const ProfilePage = dynamic(() => import('@/components/settings/ProfilePage'), {
  loading: () => <DashboardLayout><ViewLoader /></DashboardLayout>,
  ssr: false,
})

// Inner view loader for dashboard sub-views
function ViewLoader() {
  return (
    <div className='flex items-center justify-center h-64'>
      <div className='flex flex-col items-center gap-3'>
        <div className='w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin' />
        <p className='text-sm text-muted-foreground'>Loading view...</p>
      </div>
    </div>
  )
}

// Dashboard sub-view map
const dashboardSubViews: Record<string, React.ComponentType> = {
  meetings: MeetingsPage,
  teams: TeamsPage,
  chat: ChatPage,
  files: FilesPage,
  recordings: RecordingsPage,
  'ai-assistant': AIAssistantPage,
  knowledge: KnowledgePage,
  calendar: CalendarPage,
  events: EventsPage,
  whiteboard: WhiteboardPage,
  analytics: AnalyticsPage,
  status: StatusPage,
  people: PeoplePage,
  integrations: IntegrationsPage,
  'help-center': HelpCenterPage,
  admin: AdminPage,
  'admin-users': AdminUsersPage,
  'admin-orgs': AdminOrgsPage,
  'admin-security': AdminSecurityPage,
  'admin-audit': AdminAuditPage,
  'admin-system': AdminSystemPage,
  settings: SettingsPage,
  profile: ProfilePage,
  'help-center': HelpCenterPage,
  webhooks: WebhooksPage,
  templates: TemplatesPage,
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { setCurrentView, navigateBack } = useAppStore()

  const handleSendResetLink = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLoading(false)
    setSent(true)
    toast.success('Password reset link sent successfully!')
  }

  return (
    <div className='min-h-screen flex'>
      {/* Left panel on desktop (gradient) */}
      <div className='hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 order-1'>
        {/* Animated floating gradient orbs */}
        <motion.div
          className='absolute top-16 left-12 w-72 h-72 rounded-full bg-white/10 blur-3xl'
          animate={{ y: [0, -30, 0], x: [0, 15, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className='absolute bottom-24 right-16 w-56 h-56 rounded-full bg-orange-300/20 blur-3xl'
          animate={{ y: [0, 20, 0], x: [0, -18, 0], scale: [1, 0.9, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.div
          className='absolute top-1/2 left-1/4 w-40 h-40 rounded-full bg-rose-300/15 blur-2xl'
          animate={{ y: [0, -15, 0], x: [0, 12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className='absolute top-1/4 right-1/4 w-28 h-28 rounded-full bg-amber-200/20 blur-2xl'
          animate={{ y: [0, 25, 0], x: [0, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        />
        <motion.div
          className='absolute bottom-1/3 left-1/2 w-20 h-20 rounded-full bg-rose-400/15 blur-2xl'
          animate={{ y: [0, -20, 0], x: [0, 20, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />
        <motion.div
          className='absolute top-2/3 right-1/2 w-32 h-32 rounded-full bg-orange-300/10 blur-3xl'
          animate={{ y: [0, 15, 0], x: [0, -15, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        />

        {/* Geometric floating shapes */}
        <motion.div
          className='absolute top-32 right-24 w-16 h-16 rounded-xl border-2 border-white/20 rotate-12'
          animate={{ y: [0, -20, 0], rotate: [12, 20, 12] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className='absolute bottom-40 left-24 w-12 h-12 rounded-full border-2 border-white/15'
          animate={{ y: [0, 15, 0], x: [0, 8, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        />
        <motion.div
          className='absolute top-2/3 right-1/3 w-10 h-10 rounded-lg border-2 border-white/10 -rotate-12'
          animate={{ y: [0, -12, 0], rotate: [-12, 5, -12] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
        />

        <div className='relative z-10 flex flex-col justify-center items-center p-12 w-full'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className='text-center'
          >
            <svg
              width='80'
              height='80'
              viewBox='0 0 36 36'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
              className='mx-auto mb-8'
            >
              <defs>
                <linearGradient id='forgot-logo-grad' x1='0' y1='0' x2='36' y2='36'>
                  <stop offset='0%' stopColor='#FDE68A' />
                  <stop offset='100%' stopColor='#FCA5A5' />
                </linearGradient>
              </defs>
              <rect width='36' height='36' rx='8' fill='url(#forgot-logo-grad)' />
              <path
                d='M12 12.5C12 11.1193 13.1193 10 14.5 10H21.5C22.8807 10 24 11.1193 24 12.5V19.5C24 20.8807 22.8807 22 21.5 22H20L16 26V22H14.5C13.1193 22 12 20.8807 12 19.5V12.5Z'
                fill='white'
                fillOpacity='0.95'
              />
              <circle cx='17' cy='16' r='1.2' fill='#EA580C' />
              <circle cx='20' cy='16' r='1.2' fill='#EA580C' />
            </svg>
            <h1 className='text-4xl font-bold text-white mb-4'>Forgot Password?</h1>
            <p className='text-lg text-white/70 max-w-sm leading-relaxed'>
              No worries! We&apos;ll send you a reset link to get back into your account.
            </p>

            {/* Feature highlights */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className='mt-12 space-y-3'
            >
              {[
                'Secure password reset via email',
                'Link expires in 15 minutes',
                'No account lockout',
              ].map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.15 }}
                  className='flex items-center gap-2 text-sm text-white/60'
                >
                  <span className='w-1.5 h-1.5 rounded-full bg-white/40 shrink-0' />
                  {item}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className='flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 order-2'>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className='w-full max-w-md'
        >
          {/* Mobile logo */}
          <div className='lg:hidden flex items-center justify-center gap-2.5 mb-8'>
            <Video className='h-6 w-6 text-primary' />
            <span className='font-bold text-xl bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-transparent'>
              ALVISION
            </span>
          </div>

          {/* Back button */}
          <Button
            variant='ghost'
            size='sm'
            className='mb-6 -ml-2 hover:scale-[1.02] active:scale-[0.98] transition-transform'
            onClick={navigateBack}
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back
          </Button>

          <div className='bg-card rounded-xl border p-6 sm:p-8'>
            {/* Animated gradient accent line at top */}
            <motion.div
              className='h-1 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 mb-6'
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            />

            <AnimatePresence mode='wait'>
              {!sent ? (
                <motion.div
                  key='form'
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Header */}
                  <div className='mb-6'>
                    <h2 className='text-2xl font-bold tracking-tight'>Reset your password</h2>
                    <p className='text-sm text-muted-foreground mt-1.5'>
                      Enter your email and we&apos;ll send you a reset link
                    </p>
                  </div>

                  {/* Form */}
                  <div className='space-y-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='reset-email'>Email address</Label>
                      <div className='relative'>
                        <Mail className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                        <Input
                          id='reset-email'
                          type='email'
                          placeholder='you@company.com'
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className='pl-10 focus:ring-2 focus:ring-orange-500/20 focus:shadow-[0_0_0_4px_hsl(25_95%/53%/0.06)] transition-all duration-200'
                          onKeyDown={(e) => e.key === 'Enter' && handleSendResetLink()}
                        />
                      </div>
                    </div>

                    <Button
                      className='w-full hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 gap-2 shadow-md shadow-orange-500/10 hover:shadow-lg hover:shadow-orange-500/15 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600'
                      disabled={loading}
                      onClick={handleSendResetLink}
                    >
                      {loading ? (
                        <>
                          <Loader2 className='h-4 w-4 animate-spin' />
                          Sending Reset Link...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </Button>
                  </div>

                  {/* Remember password link */}
                  <p className='text-center text-sm text-muted-foreground mt-5'>
                    Remember your password?{' '}
                    <button
                      onClick={() => setCurrentView('login')}
                      className='text-primary font-medium hover:underline'
                    >
                      Sign in
                    </button>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key='success'
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25, duration: 0.5 }}
                  className='text-center py-4'
                >
                  {/* Animated checkmark */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                    className='mx-auto mb-6 w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center'
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.3 }}
                    >
                      <CheckCircle2 className='h-10 w-10 text-emerald-500' />
                    </motion.div>
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className='text-2xl font-bold tracking-tight mb-2'
                  >
                    Check your email
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className='text-sm text-muted-foreground mb-6 max-w-xs mx-auto'
                  >
                    We&apos;ve sent a password reset link to <span className='font-medium text-foreground'>{email}</span>. 
                    The link will expire in 15 minutes.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Button
                      className='w-full hover:scale-[1.02] active:scale-[0.98] transition-all duration-200'
                      onClick={() => setCurrentView('login')}
                    >
                      Back to Sign In
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function Home() {
  const { currentView, isAuthenticated } = useAppStore()

  // Public views
  if (!isAuthenticated) {
    switch (currentView) {
      case 'login':
        return (
          <div className='min-h-screen flex flex-col bg-background'>
            <LoginPage />
          </div>
        )
      case 'register':
        return (
          <div className='min-h-screen flex flex-col bg-background'>
            <RegisterPage />
          </div>
        )
      case 'forgot-password':
        return <ForgotPasswordPage />
      default:
        return <LandingPage />
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
