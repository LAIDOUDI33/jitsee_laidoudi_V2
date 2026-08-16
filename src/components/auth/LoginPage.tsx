'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Video, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppStore } from '@/store/app-store';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

const trustedCompanies = [
  'TechCorp', 'GlobalNet', 'InnovateCo', 'DataFlow', 'CloudSync', 'NexGen',
];

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { setCurrentView, navigateBack, setUser } = useAppStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok && result.user) {
        setUser(result.user);
        setCurrentView('dashboard');
        toast.success('Welcome back!');
      } else {
        toast.error(result.error || 'Invalid credentials');
      }
    } catch {
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Right panel on desktop (gradient) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 order-1">
        {/* Animated floating gradient orbs - 6 orbs with varied sizes, colors, speeds */}
        <motion.div
          className="absolute top-16 left-12 w-72 h-72 rounded-full bg-white/10 blur-3xl"
          animate={{ y: [0, -30, 0], x: [0, 15, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-24 right-16 w-56 h-56 rounded-full bg-fuchsia-300/20 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -18, 0], scale: [1, 0.9, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/4 w-40 h-40 rounded-full bg-pink-300/15 blur-2xl"
          animate={{ y: [0, -15, 0], x: [0, 12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute top-1/4 right-1/4 w-28 h-28 rounded-full bg-violet-200/20 blur-2xl"
          animate={{ y: [0, 25, 0], x: [0, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        />
        <motion.div
          className="absolute bottom-1/3 left-1/2 w-20 h-20 rounded-full bg-rose-400/15 blur-2xl"
          animate={{ y: [0, -20, 0], x: [0, 20, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />
        <motion.div
          className="absolute top-2/3 right-1/2 w-32 h-32 rounded-full bg-indigo-300/10 blur-3xl"
          animate={{ y: [0, 15, 0], x: [0, -15, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        />

        {/* Geometric floating shapes */}
        <motion.div
          className="absolute top-32 right-24 w-16 h-16 rounded-xl border-2 border-white/20 rotate-12"
          animate={{ y: [0, -20, 0], rotate: [12, 20, 12] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-40 left-24 w-12 h-12 rounded-full border-2 border-white/15"
          animate={{ y: [0, 15, 0], x: [0, 8, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        />
        <motion.div
          className="absolute top-2/3 right-1/3 w-10 h-10 rounded-lg border-2 border-white/10 -rotate-12"
          animate={{ y: [0, -12, 0], rotate: [-12, 5, -12] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
        />

        <div className="relative z-10 flex flex-col justify-center items-center p-12 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <svg
              width="80"
              height="80"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto mb-8"
            >
              <defs>
                <linearGradient id="login-logo-grad" x1="0" y1="0" x2="36" y2="36">
                  <stop offset="0%" stopColor="#93C5FD" />
                  <stop offset="100%" stopColor="#C4B5FD" />
                </linearGradient>
              </defs>
              <rect width="36" height="36" rx="8" fill="url(#login-logo-grad)" />
              <path
                d="M12 12.5C12 11.1193 13.1193 10 14.5 10H21.5C22.8807 10 24 11.1193 24 12.5V19.5C24 20.8807 22.8807 22 21.5 22H20L16 26V22H14.5C13.1193 22 12 20.8807 12 19.5V12.5Z"
                fill="white"
                fillOpacity="0.95"
              />
              <circle cx="17" cy="16" r="1.2" fill="#4F46E5" />
              <circle cx="20" cy="16" r="1.2" fill="#4F46E5" />
            </svg>
            <h1 className="text-4xl font-bold text-white mb-4">Welcome Back</h1>
            <p className="text-lg text-white/70 max-w-sm leading-relaxed">
              Sign in to continue your AI-powered video conferencing experience with ALVISION.
            </p>

            {/* Trusted by section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mt-12"
            >
              <p className="text-xs text-white/50 uppercase tracking-widest mb-4">Trusted by 10,000+ organizations</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {trustedCompanies.map((name, i) => (
                  <motion.span
                    key={name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-xs text-white/60 font-medium"
                  >
                    {name}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Left panel - form (right on desktop) */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 order-2">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <Video className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              ALVISION
            </span>
          </div>

          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 -ml-2 hover:scale-[1.02] active:scale-[0.98] transition-transform"
            onClick={navigateBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Card className="border-0 shadow-none sm:border sm:shadow-sm">
            <CardContent className="p-0 sm:p-6">
              {/* Animated gradient accent line at top */}
              <motion.div
                className="h-1 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 mb-6"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              />

              {/* Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight">Sign in to your account</h2>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Enter your credentials to access your workspace
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      className="pl-10 focus:ring-2 focus:ring-primary/20 focus:shadow-[0_0_0_4px_hsl(var(--primary)/0.06)] transition-all duration-200"
                      {...register('email')}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        className="text-xs text-destructive overflow-hidden"
                      >
                        {errors.email.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => setCurrentView('forgot-password')}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="pl-10 pr-10 focus:ring-2 focus:ring-primary/20 focus:shadow-[0_0_0_4px_hsl(var(--primary)/0.06)] transition-all duration-200"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded hover:bg-muted"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <AnimatePresence>
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        className="text-xs text-destructive overflow-hidden"
                      >
                        {errors.password.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Remember me */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(v) => setRememberMe(v === true)}
                    className="accent-primary"
                  />
                  <Label htmlFor="remember" className="text-sm font-normal cursor-pointer select-none">
                    Remember me for 30 days
                  </Label>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 gap-2 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/15"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              {/* Separator */}
              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  or continue with
                </span>
              </div>

              {/* SSO provider buttons */}
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  type="button"
                  className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 hover:shadow-lg hover:shadow-red-500/5 hover:border-red-300/80 hover:-translate-y-0.5 group relative overflow-hidden"
                  onClick={() =>
                    toast.info('Google SSO integration requires enterprise configuration')
                  }
                >
                  <span className="absolute inset-0 bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <svg className="h-4 w-4 relative z-10 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="hidden xl:inline relative z-10">Google</span>
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/5 hover:border-cyan-300/80 hover:-translate-y-0.5 group relative overflow-hidden"
                  onClick={() =>
                    toast.info('Microsoft SSO integration requires enterprise configuration')
                  }
                >
                  <span className="absolute inset-0 bg-cyan-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <svg className="h-4 w-4 relative z-10 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
                    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" fill="#00A4EF"/>
                  </svg>
                  <span className="hidden xl:inline relative z-10">Microsoft</span>
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/5 hover:border-emerald-300/80 hover:-translate-y-0.5 group relative overflow-hidden"
                  onClick={() =>
                    toast.info('SAML SSO integration requires enterprise IdP configuration')
                  }
                >
                  <span className="absolute inset-0 bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <Shield className="h-4 w-4 relative z-10 group-hover:scale-110 transition-transform duration-200" />
                  <span className="hidden xl:inline relative z-10">SAML</span>
                </Button>
              </div>

              {/* Sign up link */}
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  className="text-primary font-medium hover:underline"
                  onClick={() => setCurrentView('register')}
                >
                  Sign up
                </button>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
