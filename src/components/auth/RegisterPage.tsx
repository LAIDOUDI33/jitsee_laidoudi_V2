'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Video, User, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store/app-store';

const registerSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  organization: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { score: 0, label: '', color: 'bg-muted' },
    { score: 1, label: 'Weak', color: 'bg-red-500' },
    { score: 2, label: 'Fair', color: 'bg-yellow-500' },
    { score: 3, label: 'Good', color: 'bg-yellow-400' },
    { score: 4, label: 'Strong', color: 'bg-green-500' },
  ];

  return levels[password.length === 0 ? 0 : score];
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setCurrentView, navigateBack } = useAppStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', organization: '', password: '', confirmPassword: '' },
  });

  const passwordValue = watch('password');
  const strength = useMemo(() => getPasswordStrength(passwordValue || ''), [passwordValue]);

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          organization: data.organization,
          password: data.password,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success('Account created successfully! Please sign in.');
        setCurrentView('login');
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch {
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
        {/* Floating orbs */}
        <div className="absolute top-20 right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-24 left-20 w-48 h-48 rounded-full bg-purple-300/20 blur-3xl" />
        <div className="absolute top-1/3 right-1/3 w-32 h-32 rounded-full bg-blue-300/15 blur-2xl" />

        <div className="relative z-10 flex flex-col justify-center items-center p-12 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
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
                <linearGradient id="register-logo-grad" x1="0" y1="0" x2="36" y2="36">
                  <stop offset="0%" stopColor="#93C5FD" />
                  <stop offset="100%" stopColor="#C4B5FD" />
                </linearGradient>
              </defs>
              <rect width="36" height="36" rx="8" fill="url(#register-logo-grad)" />
              <path
                d="M12 12.5C12 11.1193 13.1193 10 14.5 10H21.5C22.8807 10 24 11.1193 24 12.5V19.5C24 20.8807 22.8807 22 21.5 22H20L16 26V22H14.5C13.1193 22 12 20.8807 12 19.5V12.5Z"
                fill="white"
                fillOpacity="0.95"
              />
              <circle cx="17" cy="16" r="1.2" fill="#4F46E5" />
              <circle cx="20" cy="16" r="1.2" fill="#4F46E5" />
            </svg>
            <h1 className="text-4xl font-bold text-white mb-4">Get Started</h1>
            <p className="text-lg text-blue-100/80 max-w-sm">
              Create your account and start experiencing AI-powered video conferencing with ALVISION.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <Video className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              ALVISION
            </span>
          </div>

          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 -ml-2"
            onClick={navigateBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Card className="border-0 shadow-none sm:border sm:shadow-sm">
            <CardContent className="p-0 sm:p-6">
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Join ALVISION and transform your team collaboration
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10"
                      {...register('name')}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="you@company.com"
                      className="pl-10"
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                {/* Organization */}
                <div className="space-y-2">
                  <Label htmlFor="org">Organization Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="org"
                      type="text"
                      placeholder="Acme Inc."
                      className="pl-10"
                      {...register('organization')}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      className="pl-10 pr-10"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}

                  {/* Password strength indicator */}
                  {passwordValue && passwordValue.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                              level <= strength.score ? strength.color : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${
                        strength.score <= 1
                          ? 'text-red-500'
                          : strength.score <= 2
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}>
                        {strength.label}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      className="pl-10 pr-10"
                      {...register('confirmPassword')}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirm(!showConfirm)}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Submit */}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>

              {/* Separator */}
              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  or continue with
                </span>
              </div>

              {/* SSO buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() =>
                    toast.info('SSO integration requires enterprise configuration')
                  }
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
                  Google
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() =>
                    toast.info('SSO integration requires enterprise configuration')
                  }
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" fill="#00A4EF"/>
                  </svg>
                  Microsoft
                </Button>
              </div>

              {/* Sign in link */}
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  className="text-primary font-medium hover:underline"
                  onClick={() => setCurrentView('login')}
                >
                  Sign in
                </button>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
