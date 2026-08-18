'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, X, Video, Loader2, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppStore } from '@/store/app-store';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

const trustedCompanies = [
  'TechCorp', 'DataFlow', 'CloudNine', 'SecureNet', 'InnovateLabs',
];

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { setCurrentView, navigateBack, setUser, setTokens } = useAppStore();

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
      if (res.ok && result.data?.user) {
        if (result.data.accessToken && result.data.refreshToken) {
          setTokens(result.data.accessToken, result.data.refreshToken);
        }
        setUser(result.data.user);
        setCurrentView('dashboard');
        toast.success('Welcome back!');
      } else {
        toast.error(result.error?.message || result.error || 'Invalid credentials');
      }
    } catch {
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-slate-950">
      {/* Mobile background gradient orbs */}
      <div className="absolute inset-0 -z-10 lg:hidden">
        <motion.div
          className="absolute top-20 right-10 w-64 h-64 rounded-full bg-emerald-500/10 blur-[100px]"
          animate={{ y: [0, -20, 0], x: [0, 10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' as const }}
        />
        <motion.div
          className="absolute bottom-32 left-8 w-48 h-48 rounded-full bg-teal-500/10 blur-[100px]"
          animate={{ y: [0, 15, 0], x: [0, -12, 0], scale: [1, 0.95, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' as const, delay: 2 }}
        />
      </div>

      {/* Left panel (desktop) — gradient brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 order-1">
        {/* Animated floating orbs */}
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
        <motion.div
          className="absolute top-1/2 left-1/4 w-40 h-40 rounded-full bg-teal-300/15 blur-2xl"
          animate={{ y: [0, -15, 0], x: [0, 12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' as const, delay: 2 }}
        />
        <motion.div
          className="absolute top-1/4 right-1/4 w-28 h-28 rounded-full bg-cyan-200/20 blur-2xl"
          animate={{ y: [0, 25, 0], x: [0, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' as const, delay: 3 }}
        />

        {/* Geometric shapes */}
        <motion.div
          className="absolute top-32 right-24 w-16 h-16 rounded-xl border-2 border-white/20 rotate-12"
          animate={{ y: [0, -20, 0], rotate: [12, 20, 12] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' as const }}
        />
        <motion.div
          className="absolute bottom-40 left-24 w-12 h-12 rounded-full border-2 border-white/15"
          animate={{ y: [0, 15, 0], x: [0, 8, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' as const, delay: 1.5 }}
        />

        <div className="relative z-10 flex flex-col justify-center items-center p-12 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
              <Video className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Welcome Back</h1>
            <p className="text-lg text-white/70 max-w-sm leading-relaxed">
              Sign in to continue your AI-powered video conferencing experience with ALVISION.
            </p>

            {/* Trusted by */}
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

      {/* Right panel — form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 order-2">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl text-white">ALVISION</span>
          </div>

          {/* Back to landing button */}
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800/50"
            onClick={navigateBack}
          >
            <X className="mr-2 h-4 w-4" />
            Back to home
          </Button>

          {/* Login card with animated gradient border */}
          <div className="relative group">
            {/* Animated gradient border */}
            <motion.div
              className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 opacity-60 group-hover:opacity-100"
              animate={{
                background: [
                  'linear-gradient(0deg, #10b981, #2dd4bf, #06b6d4)',
                  'linear-gradient(90deg, #10b981, #2dd4bf, #06b6d4)',
                  'linear-gradient(180deg, #10b981, #2dd4bf, #06b6d4)',
                  'linear-gradient(270deg, #10b981, #2dd4bf, #06b6d4)',
                  'linear-gradient(360deg, #10b981, #2dd4bf, #06b6d4)',
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' as const }}
            />

            {/* Card content */}
            <div className="relative bg-slate-900 rounded-xl overflow-hidden">
              {/* Glass morphism overlay */}
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" />

              <div className="relative p-6 sm:p-8">
                {/* Gradient accent line */}
                <motion.div
                  className="h-1 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 mb-6"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                />

                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mb-8"
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <Video className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-bold text-lg bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent hidden sm:inline-block">
                      ALVISION
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">Sign in to your account</h2>
                  <p className="text-sm text-slate-400 mt-1.5">
                    Enter your credentials to access your workspace
                  </p>
                </motion.div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Email */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="email" className="text-slate-300">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        className={
                          'pl-10 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all duration-200' +
                          (errors.email ? ' border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50' : '')
                        }
                        {...register('email')}
                      />
                    </div>
                    <AnimatePresence>
                      {errors.email && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -4, height: 0 }}
                          className="flex items-center gap-1.5 overflow-hidden"
                        >
                          <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                          <span className="text-xs text-red-400 font-medium">{errors.email.message}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Password */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-slate-300">Password</Label>
                      <button
                        type="button"
                        className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
                        onClick={() => setCurrentView('forgot-password')}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        className={
                          'pl-10 pr-10 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all duration-200' +
                          (errors.password ? ' border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50' : '')
                        }
                        {...register('password')}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-0.5 rounded hover:bg-slate-700/50"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <AnimatePresence>
                      {errors.password && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -4, height: 0 }}
                          className="flex items-center gap-1.5 overflow-hidden"
                        >
                          <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                          <span className="text-xs text-red-400 font-medium">{errors.password.message}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Remember me */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                    className="flex items-center gap-2"
                  >
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(v) => setRememberMe(v === true)}
                      className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                    <Label htmlFor="remember" className="text-sm font-normal text-slate-400 cursor-pointer select-none hover:text-slate-300 transition-colors">
                      Remember me for 30 days
                    </Label>
                  </motion.div>

                  {/* Global error banner */}
                  <AnimatePresence>
                    {hasErrors && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -8, height: 0 }}
                        className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                      >
                        <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                        <span className="text-sm text-red-300">Please fix the errors above to continue.</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                  >
                    <Button
                      type="submit"
                      className={
                        'w-full hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 gap-2 shadow-lg text-white font-medium py-5 ' +
                        (loading
                          ? 'bg-emerald-700 shadow-emerald-600/10'
                          : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20 hover:shadow-emerald-500/30')
                      }
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
                  </motion.div>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700/50" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-slate-900 text-slate-500">or continue with</span>
                  </div>
                </div>

                {/* Social login: Google & GitHub */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    type="button"
                    className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/60 hover:border-slate-600/50 text-slate-300 hover:text-white group"
                    onClick={() => toast.info('Google SSO requires enterprise configuration')}
                  >
                    <svg className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/60 hover:border-slate-600/50 text-slate-300 hover:text-white group"
                    onClick={() => toast.info('GitHub SSO requires enterprise configuration')}
                  >
                    <svg className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    GitHub
                  </Button>
                </div>

                {/* Sign up link */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.7 }}
                  className="mt-6 text-center text-sm text-slate-500"
                >
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    className="text-emerald-400 font-medium hover:text-emerald-300 hover:underline transition-all duration-200"
                    onClick={() => setCurrentView('register')}
                  >
                    Sign up
                  </button>
                </motion.p>

                {/* Footer */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.8 }}
                  className="mt-6 pt-4 border-t border-slate-800/50 flex items-center justify-center gap-1.5 text-xs text-slate-600"
                >
                  <Shield className="h-3 w-3" />
                  <span>&copy; 2025 ALVISION. Enterprise AI conferencing.</span>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
