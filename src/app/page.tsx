'use client'

import { useAppStore } from '@/store/app-store'
import LandingPage from '@/components/landing/LandingPage'
import LoginPage from '@/components/auth/LoginPage'
import RegisterPage from '@/components/auth/RegisterPage'
import DashboardPage from '@/components/dashboard/DashboardPage'
import MeetingRoomPage from '@/components/meeting/MeetingRoomPage'

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
        return (
          <div className='min-h-screen flex flex-col bg-background'>
            <ForgotPasswordPage />
          </div>
        )
      default:
        return <LandingPage />
    }
  }

  // Authenticated views
  switch (currentView) {
    case 'meeting-room':
      return <MeetingRoomPage />
    default:
      return <DashboardPage />
  }
}

// Minimal forgot password page
function ForgotPasswordPage() {
  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <div className='text-4xl font-bold gradient-text mb-2'>ALVISION</div>
          <h1 className='text-2xl font-semibold'>Reset Password</h1>
          <p className='text-muted-foreground mt-2'>Enter your email to receive a reset link.</p>
        </div>
        <div className='bg-card rounded-xl border p-6'>
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium mb-1.5'>Email</label>
              <input
                type='email'
                placeholder='you@company.com'
                className='w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50'
              />
            </div>
            <button className='w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:opacity-90 transition-opacity'>
              Send Reset Link
            </button>
          </div>
          <p className='text-center text-sm text-muted-foreground mt-4'>
            Remember your password?{' '}
            <button
              onClick={() => useAppStore.getState().setCurrentView('login')}
              className='text-primary hover:underline'
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
