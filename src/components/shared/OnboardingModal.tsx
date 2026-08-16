'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Video,
  Brain,
  Users,
  CalendarDays,
  Camera,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  Upload,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface OnboardingModalProps {
  open: boolean
  onClose: () => void
  onComplete: () => void
}

const TOTAL_STEPS = 4

// Confetti particles for the completion step
const confettiColors = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-violet-500',
  'bg-cyan-500',
  'bg-pink-500',
  'bg-teal-500',
]

function ConfettiParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 6 + 4,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        delay: Math.random() * 0.5,
        duration: Math.random() * 2 + 2,
        rotate: Math.random() * 360,
      })),
    []
  )

  return (
    <div className='absolute inset-0 overflow-hidden pointer-events-none'>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={`absolute ${p.color} rounded-sm`}
          style={{
            width: p.size,
            height: p.size * (Math.random() > 0.5 ? 1 : 0.5),
            left: `${p.x}%`,
            top: `${p.y}%`,
            rotate: p.rotate,
          }}
          initial={{ opacity: 0, scale: 0, y: -20 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0.5],
            y: [0, -30, -10, 40],
            x: [0, (Math.random() - 0.5) * 30],
          }}
          transition={{
            delay: p.delay,
            duration: p.duration,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}

// Step indicators (dots)
function StepIndicators({ currentStep, total }: { currentStep: number; total: number }) {
  return (
    <div className='flex items-center justify-center gap-2 pt-2'>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-500 ease-out ${
            i === currentStep
              ? 'w-8 bg-primary'
              : i < currentStep
              ? 'w-2 bg-primary/40'
              : 'w-2 bg-muted-foreground/20'
          }`}
        />
      ))}
    </div>
  )
}

// Step 1: Welcome
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className='flex flex-col items-center text-center py-4'
    >
      {/* Logo */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
        className='w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20'
      >
        <Video className='h-10 w-10 text-white' />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='text-2xl font-bold tracking-tight mb-2'
      >
        Welcome to ALVISION
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className='text-sm text-muted-foreground max-w-xs mb-8'
      >
        Your enterprise AI video conferencing platform
      </motion.p>

      {/* Feature icon illustration */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className='relative w-full max-w-[260px] h-32 mb-8'
      >
        {/* Central video icon */}
        <motion.div
          className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 z-10'
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Video className='h-8 w-8 text-primary-foreground' />
        </motion.div>

        {/* Orbiting icons */}
        {[
          { Icon: Brain, color: 'bg-violet-500', x: '10%', y: '20%', delay: 0.5 },
          { Icon: Users, color: 'bg-emerald-500', x: '80%', y: '25%', delay: 0.6 },
          { Icon: CalendarDays, color: 'bg-amber-500', x: '15%', y: '70%', delay: 0.7 },
          { Icon: Sparkles, color: 'bg-rose-500', x: '78%', y: '65%', delay: 0.8 },
        ].map(({ Icon, color, x, y, delay }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, type: 'spring', stiffness: 300, damping: 20 }}
            className={`absolute ${x} ${y} w-10 h-10 rounded-lg ${color} flex items-center justify-center shadow-md`}
            style={{
              left: x,
              top: y,
            }}
          >
            <Icon className='h-5 w-5 text-white' />
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          onClick={onNext}
          className='w-full max-w-[200px] hover:scale-[1.02] active:scale-[0.98] transition-transform gap-2'
          size='lg'
        >
          Get Started
          <ArrowRight className='h-4 w-4' />
        </Button>
      </motion.div>
    </motion.div>
  )
}

// Step 2: Set Up Profile
function ProfileStep({
  onNext,
  onBack,
}: {
  onNext: () => void
  onBack: () => void
}) {
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState('')
  const [department, setDepartment] = useState('')

  const canContinue = displayName.trim().length > 0 && role.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className='py-4'
    >
      <div className='text-center mb-6'>
        <h2 className='text-2xl font-bold tracking-tight mb-2'>Set Up Your Profile</h2>
        <p className='text-sm text-muted-foreground'>
          Help us personalize your ALVISION experience
        </p>
      </div>

      {/* Avatar placeholder */}
      <div className='flex justify-center mb-6'>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className='relative group cursor-pointer'
        >
          <div className='w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30 group-hover:border-primary/50 transition-colors duration-300'>
            <Camera className='h-6 w-6 text-muted-foreground/50 group-hover:text-primary/50 transition-colors duration-300' />
          </div>
          <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
            <div className='w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center'>
              <Upload className='h-4 w-4 text-primary-foreground' />
            </div>
          </div>
        </motion.button>
      </div>

      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='display-name'>Display Name</Label>
          <Input
            id='display-name'
            placeholder='Your name'
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className='transition-all duration-200'
          />
        </div>

        <div className='space-y-2'>
          <Label>Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className='transition-all duration-200'>
              <SelectValue placeholder='Select your role' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='executive'>Executive</SelectItem>
              <SelectItem value='engineering'>Engineering</SelectItem>
              <SelectItem value='design'>Design</SelectItem>
              <SelectItem value='marketing'>Marketing</SelectItem>
              <SelectItem value='sales'>Sales</SelectItem>
              <SelectItem value='other'>Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='department'>Department</Label>
          <Input
            id='department'
            placeholder='e.g., Product, Engineering, Design'
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className='transition-all duration-200'
          />
        </div>
      </div>

      <div className='flex gap-3 mt-6'>
        <Button
          variant='outline'
          onClick={onBack}
          className='flex-1 hover:scale-[1.02] active:scale-[0.98] transition-transform'
        >
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canContinue}
          className='flex-1 hover:scale-[1.02] active:scale-[0.98] transition-transform'
        >
          Continue
          <ArrowRight className='ml-2 h-4 w-4' />
        </Button>
      </div>
    </motion.div>
  )
}

// Step 3: Quick Tour
function TourStep({
  onNext,
  onBack,
}: {
  onNext: () => void
  onBack: () => void
}) {
  const features = [
    {
      icon: <Video className='h-6 w-6' />,
      title: 'HD Video Calls',
      description: 'Crystal-clear video with up to 100 participants per meeting room.',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-500',
    },
    {
      icon: <Brain className='h-6 w-6' />,
      title: 'AI Assistant',
      description: 'Real-time meeting summaries, transcripts, and smart action items.',
      color: 'from-violet-500 to-purple-500',
      bgColor: 'bg-violet-500/10',
      textColor: 'text-violet-500',
    },
    {
      icon: <Users className='h-6 w-6' />,
      title: 'Team Collaboration',
      description: 'Channels, threads, and shared workspaces for your teams.',
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-500',
    },
    {
      icon: <CalendarDays className='h-6 w-6' />,
      title: 'Smart Scheduling',
      description: 'AI-powered scheduling that finds the perfect time for everyone.',
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-500',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className='py-4'
    >
      <div className='text-center mb-6'>
        <h2 className='text-2xl font-bold tracking-tight mb-2'>Quick Tour</h2>
        <p className='text-sm text-muted-foreground'>
          Discover what ALVISION has to offer
        </p>
      </div>

      <div className='grid grid-cols-2 gap-3 mb-6'>
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.1, type: 'spring', stiffness: 300, damping: 25 }}
            whileHover={{ y: -2, scale: 1.02 }}
            className={`rounded-xl border p-4 bg-card hover:shadow-lg transition-all duration-300 cursor-default group`}
          >
            <div
              className={`w-10 h-10 rounded-lg ${feature.bgColor} ${feature.textColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}
            >
              {feature.icon}
            </div>
            <h3 className='text-sm font-semibold mb-1'>{feature.title}</h3>
            <p className='text-xs text-muted-foreground leading-relaxed'>
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>

      <div className='flex gap-3'>
        <Button
          variant='outline'
          onClick={onBack}
          className='flex-1 hover:scale-[1.02] active:scale-[0.98] transition-transform'
        >
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back
        </Button>
        <Button
          onClick={onNext}
          className='flex-1 hover:scale-[1.02] active:scale-[0.98] transition-transform'
        >
          Finish Setup
          <ArrowRight className='ml-2 h-4 w-4' />
        </Button>
      </div>
    </motion.div>
  )
}

// Step 4: Complete
function CompleteStep({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className='flex flex-col items-center text-center py-4 relative'
    >
      {/* Confetti */}
      <ConfettiParticles />

      {/* Animated checkmark */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
        className='relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/30'
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.5 }}
        >
          <CheckCircle2 className='h-14 w-14 text-white' />
        </motion.div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className='text-2xl font-bold tracking-tight mb-2 relative z-10'
      >
        You&apos;re all set!
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className='text-sm text-muted-foreground max-w-xs mb-8 relative z-10'
      >
        Start exploring ALVISION and discover all the powerful features at your fingertips.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className='relative z-10 w-full'
      >
        <Button
          onClick={onComplete}
          className='w-full hover:scale-[1.02] active:scale-[0.98] transition-transform bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/20'
          size='lg'
        >
          Go to Dashboard
          <ArrowRight className='ml-2 h-4 w-4' />
        </Button>
      </motion.div>
    </motion.div>
  )
}

export default function OnboardingModal({
  open,
  onClose,
  onComplete,
}: OnboardingModalProps) {
  const [step, setStep] = useState(0)

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  const handleClose = () => {
    onClose()
  }

  // Determine if we should show close/skip
  const showBackButton = step >= 1 && step <= 2

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className='sm:max-w-[520px] p-0 overflow-hidden'
        showCloseButton={false}
      >
        {/* Skip button - top right */}
        {step < 3 && (
          <button
            onClick={handleSkip}
            className='absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200'
            aria-label='Skip onboarding'
          >
            <X className='h-4 w-4' />
          </button>
        )}

        {/* Content */}
        <div className='px-6 sm:px-8 pb-6 sm:pb-8'>
          <DialogHeader className='sr-only'>
            <DialogTitle>ALVISION Onboarding</DialogTitle>
            <DialogDescription>Getting started with ALVISION</DialogDescription>
          </DialogHeader>

          {/* Step indicators */}
          <StepIndicators currentStep={step} total={TOTAL_STEPS} />

          {/* Step content */}
          <div className='mt-6'>
            <AnimatePresence mode='wait'>
              {step === 0 && <WelcomeStep key='welcome' onNext={handleNext} />}
              {step === 1 && (
                <ProfileStep key='profile' onNext={handleNext} onBack={handleBack} />
              )}
              {step === 2 && (
                <TourStep key='tour' onNext={handleNext} onBack={handleBack} />
              )}
              {step === 3 && <CompleteStep key='complete' onComplete={onComplete} />}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
