'use client'

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Zap,
  Video,
  CalendarDays,
  Users,
  Brain,
  Bell,
  PartyPopper,
  ArrowLeft,
  ArrowRight,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// ── Types ────────────────────────────────────────────────────────────

interface TourStep {
  title: string
  description: string
  target: string | null // CSS selector or null for centered
  icon: ReactNode
  accentColor: string // tailwind color class for the icon bg
}

interface TargetRect {
  top: number
  left: number
  width: number
  height: number
}

// ── Tour Steps ───────────────────────────────────────────────────────

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to ALVISION',
    description:
      'This is your command center. Get a quick overview of your meetings, stats, and activity at a glance.',
    target: '[data-tour="dashboard"]',
    icon: <LayoutDashboard className='h-6 w-6' />,
    accentColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  },
  {
    title: 'Quick Actions',
    description:
      'Start an instant meeting, schedule one for later, join with a code, or ask the AI assistant — all in one click.',
    target: '[data-tour="quick-actions"]',
    icon: <Zap className='h-6 w-6' />,
    accentColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  },
  {
    title: 'Meetings Hub',
    description:
      'View all your upcoming meetings, join with a single click, and share invite links with participants.',
    target: '[data-tour="meetings"]',
    icon: <Video className='h-6 w-6' />,
    accentColor: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  },
  {
    title: 'Smart Calendar',
    description:
      'Switch between day, week, month, and list views. Drag events to reschedule, and see everything at a glance.',
    target: '[data-tour="calendar"]',
    icon: <CalendarDays className='h-6 w-6' />,
    accentColor: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
  },
  {
    title: 'Your Teams',
    description:
      'Manage team members, channels, and collaboration spaces. Keep your entire organization connected.',
    target: '[data-tour="teams"]',
    icon: <Users className='h-6 w-6' />,
    accentColor: 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400',
  },
  {
    title: 'AI Assistant',
    description:
      'Get AI-powered meeting summaries, transcriptions, smart action items, and real-time assistance.',
    target: '[data-tour="ai-assistant"]',
    icon: <Brain className='h-6 w-6' />,
    accentColor: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  },
  {
    title: 'Notifications',
    description:
      'Stay updated with meeting reminders, mentions, and important alerts. Never miss a beat.',
    target: '[data-tour="notifications"]',
    icon: <Bell className='h-6 w-6' />,
    accentColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  },
  {
    title: 'You\'re all set!',
    description:
      'You now know the basics. Explore further from the sidebar, and revisit this tour anytime from Help Center.',
    target: null,
    icon: <PartyPopper className='h-6 w-6' />,
    accentColor: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
  },
]

const TOTAL_STEPS = TOUR_STEPS.length
const STORAGE_KEY = 'alvision_tour_completed'
const SPOTLIGHT_PADDING = 8
const TOOLTIP_OFFSET = 12

// ── Positioning helpers ──────────────────────────────────────────────

type TooltipPlacement = 'bottom' | 'top' | 'left' | 'right'

function computePlacement(rect: TargetRect, viewportW: number, viewportH: number): TooltipPlacement {
  const spaceBelow = viewportH - rect.bottom
  const spaceAbove = rect.top
  const spaceRight = viewportW - rect.right
  const spaceLeft = rect.left

  // Prefer bottom, then top, then right, then left
  if (spaceBelow >= 260) return 'bottom'
  if (spaceAbove >= 260) return 'top'
  if (spaceRight >= 420) return 'right'
  if (spaceLeft >= 420) return 'left'
  // Fallback: wherever has most space vertically
  return spaceBelow >= spaceAbove ? 'bottom' : 'top'
}

function getTooltipStyle(
  placement: TooltipPlacement,
  rect: TargetRect,
): React.CSSProperties {
  const p = SPOTLIGHT_PADDING + TOOLTIP_OFFSET
  switch (placement) {
    case 'bottom':
      return {
        top: rect.bottom + TOOLTIP_OFFSET,
        left: rect.left + rect.width / 2,
        transform: 'translateX(-50%)',
      }
    case 'top':
      return {
        bottom: (window.innerHeight - rect.top) + TOOLTIP_OFFSET,
        left: rect.left + rect.width / 2,
        transform: 'translateX(-50%)',
      }
    case 'left':
      return {
        top: rect.top + rect.height / 2,
        right: (window.innerWidth - rect.left) + TOOLTIP_OFFSET,
        transform: 'translateY(-50%)',
      }
    case 'right':
      return {
        top: rect.top + rect.height / 2,
        left: rect.right + TOOLTIP_OFFSET,
        transform: 'translateY(-50%)',
      }
  }
}

// ── Hook ─────────────────────────────────────────────────────────────

// Shared state so multiple callers can control the tour
let globalStartTour: (() => void) | null = null
let globalIsTourActive = false
let globalCurrentStep = 0
const tourListeners = new Set<() => void>()

function notifyTourListeners() {
  tourListeners.forEach((fn) => fn())
}

export function useOnboardingTour() {
  const [, forceUpdate] = useState(0)
  const subscribe = useCallback((cb: () => void) => {
    tourListeners.add(cb)
    return () => { tourListeners.delete(cb) }
  }, [])

  // subscribe to changes
  useEffect(() => {
    const cb = () => forceUpdate((n) => n + 1)
    tourListeners.add(cb)
    return () => { tourListeners.delete(cb) }
  }, [])

  const startTour = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    globalIsTourActive = true
    globalCurrentStep = 0
    notifyTourListeners()
  }, [])

  return {
    startTour,
    isTourActive: globalIsTourActive,
    currentStep: globalCurrentStep,
  }
}

// ── Spotlight overlay ────────────────────────────────────────────────

function SpotlightOverlay({
  targetRect,
}: {
  targetRect: TargetRect | null
}) {
  if (!targetRect) {
    // Full-screen overlay for the final centered step
    return (
      <motion.div
        className='fixed inset-0 z-50 bg-black/60'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      />
    )
  }

  return (
    <div
      className='fixed inset-0 z-50'
      style={{ pointerEvents: 'none' }}
    >
      {/* The spotlight hole */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className='absolute'
        style={{
          top: targetRect.top - SPOTLIGHT_PADDING,
          left: targetRect.left - SPOTLIGHT_PADDING,
          width: targetRect.width + SPOTLIGHT_PADDING * 2,
          height: targetRect.height + SPOTLIGHT_PADDING * 2,
          borderRadius: 12,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
          zIndex: 1,
        }}
      />
      {/* Emerald glow ring around the highlighted element */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
        className='absolute pointer-events-none'
        style={{
          top: targetRect.top - SPOTLIGHT_PADDING - 2,
          left: targetRect.left - SPOTLIGHT_PADDING - 2,
          width: targetRect.width + (SPOTLIGHT_PADDING + 2) * 2,
          height: targetRect.height + (SPOTLIGHT_PADDING + 2) * 2,
          borderRadius: 14,
          boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.5), 0 0 20px rgba(16, 185, 129, 0.15)',
          zIndex: 2,
        }}
      />
    </div>
  )
}

// ── Tooltip content ──────────────────────────────────────────────────

function TourTooltip({
  step,
  stepIndex,
  placement,
  isLast,
  isFirst,
  onBack,
  onNext,
  onSkip,
  onFinish,
  onClose,
  style,
}: {
  step: TourStep
  stepIndex: number
  placement: TooltipPlacement | 'center'
  isLast: boolean
  isFirst: boolean
  onBack: () => void
  onNext: () => void
  onSkip: () => void
  onFinish: () => void
  onClose: () => void
  style?: React.CSSProperties
}) {
  // Slide-in variants based on placement
  const slideVariants = {
    bottom: { initial: { opacity: 0, y: 16, x: '-50%' }, animate: { opacity: 1, y: 0, x: '-50%' }, exit: { opacity: 0, y: 16, x: '-50%' } },
    top: { initial: { opacity: 0, y: -16, x: '-50%' }, animate: { opacity: 1, y: 0, x: '-50%' }, exit: { opacity: 0, y: -16, x: '-50%' } },
    left: { initial: { opacity: 0, x: 16, y: '-50%' }, animate: { opacity: 1, x: 0, y: '-50%' }, exit: { opacity: 0, x: 16, y: '-50%' } },
    right: { initial: { opacity: 0, x: -16, y: '-50%' }, animate: { opacity: 1, x: 0, y: '-50%' }, exit: { opacity: 0, x: -16, y: '-50%' } },
    center: { initial: { opacity: 0, scale: 0.92 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.92 } },
  }

  const v = slideVariants[placement]

  // For centered step, use a wrapper with centering
  if (placement === 'center') {
    return (
      <motion.div
        className='fixed inset-0 z-[60] flex items-center justify-center pointer-events-auto'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className='max-w-sm w-full mx-4 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-border p-6 text-center'
          initial={v.initial}
          animate={v.animate}
          exit={v.exit}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        >
          <TooltipInner
            step={step}
            stepIndex={stepIndex}
            isLast={isLast}
            isFirst={isFirst}
            onBack={onBack}
            onNext={onNext}
            onSkip={onSkip}
            onFinish={onFinish}
            onClose={onClose}
          />
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className='fixed z-[60] max-w-sm w-full pointer-events-auto'
      style={style}
      initial={v.initial}
      animate={v.animate}
      exit={v.exit}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
    >
      <div className='mx-3 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-border p-5'>
        <TooltipInner
          step={step}
          stepIndex={stepIndex}
          isLast={isLast}
          isFirst={isFirst}
          onBack={onBack}
          onNext={onNext}
          onSkip={onSkip}
          onFinish={onFinish}
          onClose={onClose}
        />
      </div>
    </motion.div>
  )
}

function TooltipInner({
  step,
  stepIndex,
  isLast,
  isFirst,
  onBack,
  onNext,
  onSkip,
  onFinish,
  onClose,
}: {
  step: TourStep
  stepIndex: number
  isLast: boolean
  isFirst: boolean
  onBack: () => void
  onNext: () => void
  onSkip: () => void
  onFinish: () => void
  onClose: () => void
}) {
  return (
    <>
      {/* Close button */}
      <button
        onClick={onClose}
        className='absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
        aria-label='Close tour'
      >
        <X className='h-3.5 w-3.5' />
      </button>

      {/* Icon + step badge */}
      <div className='flex items-center gap-3 mb-3'>
        <div className={`w-10 h-10 rounded-lg ${step.accentColor} flex items-center justify-center shrink-0`}>
          {step.icon}
        </div>
        <span className='inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold'>
          {stepIndex + 1}/{TOTAL_STEPS}
        </span>
      </div>

      {/* Title & description */}
      <h3 className='font-semibold text-sm mb-1.5'>{step.title}</h3>
      <p className='text-xs text-muted-foreground leading-relaxed mb-4'>{step.description}</p>

      {/* Progress dots */}
      <div className='flex items-center justify-center gap-1.5 mb-4'>
        {TOUR_STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === stepIndex
                ? 'w-5 bg-emerald-500'
                : i < stepIndex
                ? 'w-1.5 bg-emerald-500/40'
                : 'w-1.5 bg-muted-foreground/20'
            }`}
          />
        ))}
      </div>

      {/* Buttons */}
      <div className='flex items-center gap-2'>
        {!isFirst && (
          <Button
            variant='outline'
            size='sm'
            onClick={onBack}
            className='text-xs h-8 gap-1'
          >
            <ArrowLeft className='h-3.5 w-3.5' />
            Back
          </Button>
        )}

        <div className='flex-1' />

        {!isLast && (
          <Button
            variant='ghost'
            size='sm'
            onClick={onSkip}
            className='text-xs h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10'
          >
            Skip
          </Button>
        )}

        {isLast ? (
          <Button
            size='sm'
            onClick={onFinish}
            className='text-xs h-8 gap-1 bg-teal-600 hover:bg-teal-700 text-white'
          >
            Done
            <PartyPopper className='h-3.5 w-3.5' />
          </Button>
        ) : (
          <Button
            size='sm'
            onClick={onNext}
            className='text-xs h-8 gap-1'
          >
            Next
            <ArrowRight className='h-3.5 w-3.5' />
          </Button>
        )}
      </div>
    </>
  )
}

// ── Main Component ───────────────────────────────────────────────────

export default function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)
  const [placement, setPlacement] = useState<TooltipPlacement | 'center'>('bottom')
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const isMounted = typeof document !== 'undefined'

  // Register global start handler
  useEffect(() => {
    globalStartTour = () => {
      setCurrentStep(0)
      setIsActive(true)
    }
    return () => { globalStartTour = null }
  }, [])

  // Auto-start: check if tour hasn't been completed
  useEffect(() => {
    if (typeof window === 'undefined') return
    const completed = localStorage.getItem(STORAGE_KEY)
    if (!completed) {
      // Delay start to let dashboard render fully
      const timer = setTimeout(() => {
        setCurrentStep(0)
        setIsActive(true)
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [])

  // Compute target element rect and tooltip placement
  const updatePosition = useCallback(() => {
    const step = TOUR_STEPS[currentStep]
    if (!step) return

    if (!step.target) {
      setTargetRect(null)
      setPlacement('center')
      setTooltipStyle({})
      return
    }

    const el = document.querySelector(step.target)
    if (!el) {
      // Element not found — skip to next or finish
      setTargetRect(null)
      setPlacement('center')
      setTooltipStyle({})
      return
    }

    const rect = el.getBoundingClientRect()
    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    })

    const place = computePlacement(rect, window.innerWidth, window.innerHeight)
    setPlacement(place)
    setTooltipStyle(getTooltipStyle(place, rect))
  }, [currentStep])

  // Observe position on step change + resize
  useEffect(() => {
    if (!isActive) return

    // Small delay to let the UI settle
    const timer = setTimeout(() => {
      updatePosition()
    }, 50)

    return () => clearTimeout(timer)
  }, [isActive, currentStep, updatePosition])

  // ResizeObserver for dynamic layout changes
  useEffect(() => {
    if (!isActive) return

    const step = TOUR_STEPS[currentStep]
    if (!step?.target) return

    const el = document.querySelector(step.target)
    if (!el) return

    const observer = new ResizeObserver(() => {
      updatePosition()
    })
    observer.observe(el)
    resizeObserverRef.current = observer

    return () => {
      observer.disconnect()
      resizeObserverRef.current = null
    }
  }, [isActive, currentStep, updatePosition])

  // Window resize handler
  useEffect(() => {
    if (!isActive) return

    const handleResize = () => updatePosition()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isActive, updatePosition])

  // Handlers (declared before effects that use them)
  const handleFinish = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsActive(false)
  }, [])

  const handleClose = useCallback(() => {
    handleFinish()
  }, [handleFinish])

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((s) => s + 1)
    }
  }, [currentStep])

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
    }
  }, [currentStep])

  const handleSkip = useCallback(() => {
    handleFinish()
  }, [handleFinish])

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          handleFinish()
          break
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          if (currentStep < TOTAL_STEPS - 1) {
            setCurrentStep((s) => s + 1)
          }
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          if (currentStep > 0) {
            setCurrentStep((s) => s - 1)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, currentStep, handleFinish])

  // Sync global state
  useEffect(() => {
    globalIsTourActive = isActive
    globalCurrentStep = currentStep
    notifyTourListeners()
  }, [isActive, currentStep])

  // Listen for external start-tour event
  useEffect(() => {
    const handler = () => {
      localStorage.removeItem(STORAGE_KEY)
      setCurrentStep(0)
      setIsActive(true)
    }
    window.addEventListener('start-alvision-tour', handler)
    return () => window.removeEventListener('start-alvision-tour', handler)
  }, [])

  if (!isMounted || !isActive) return null

  const step = TOUR_STEPS[currentStep]
  if (!step) return null

  const isLast = currentStep === TOTAL_STEPS - 1
  const isFirst = currentStep === 0

  return createPortal(
    <>
      {/* Spotlight overlay */}
      <AnimatePresence>
        <SpotlightOverlay targetRect={targetRect} />
      </AnimatePresence>

      {/* Tooltip */}
      <AnimatePresence mode='wait'>
        <TourTooltip
          key={currentStep}
          step={step}
          stepIndex={currentStep}
          placement={placement}
          isLast={isLast}
          isFirst={isFirst}
          onBack={handleBack}
          onNext={handleNext}
          onSkip={handleSkip}
          onFinish={handleFinish}
          onClose={handleClose}
          style={placement === 'center' ? undefined : tooltipStyle}
        />
      </AnimatePresence>
    </>,
    document.body
  )
}
