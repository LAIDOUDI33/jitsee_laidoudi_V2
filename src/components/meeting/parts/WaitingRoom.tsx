'use client';

import { motion } from 'framer-motion';
import { LogOut, Clock, Users, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Pulsing Dots Indicator ──────────────────────────────
function PulsingDots() {
  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2.5 h-2.5 rounded-full bg-emerald-400"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.25,
            ease: 'easeInOut' as const,
          }}
        />
      ))}
    </div>
  );
}

// ─── Animated Ring Spinner ───────────────────────────────
function RingSpinner() {
  return (
    <div className="relative w-16 h-16">
      {/* Outer ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-emerald-500/30"
        style={{ borderTopColor: '#10b981' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' as const }}
      />
      {/* Inner ring */}
      <motion.div
        className="absolute inset-2 rounded-full border-2 border-teal-500/30"
        style={{ borderBottomColor: '#14b8a6' }}
        animate={{ rotate: -360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' as const }}
      />
      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Clock className="w-6 h-6 text-emerald-400" />
      </div>
    </div>
  );
}

// ─── Props ─────────────────────────────────────────────────
interface WaitingRoomProps {
  meetingTitle: string;
  hostName: string;
  queuePosition?: number | null;
  estimatedWaitMinutes?: number | null;
  onLeave: () => void;
}

// ─── Component ──────────────────────────────────────────────
export default function WaitingRoom({
  meetingTitle,
  hostName,
  queuePosition,
  estimatedWaitMinutes,
  onLeave,
}: WaitingRoomProps) {
  const positionText = queuePosition
    ? `You're ${queuePosition === 1 ? '1st' : queuePosition === 2 ? '2nd' : queuePosition === 3 ? '3rd' : `${queuePosition}th`} in queue`
    : 'Waiting for host to admit you...';

  const waitText = estimatedWaitMinutes
    ? `Estimated wait: ~${estimatedWaitMinutes} min`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm"
    >
      {/* Subtle animated background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: ['0%', '10%', '0%'],
            y: ['0%', '5%', '0%'],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' as const }}
        />
        <motion.div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(20,184,166,0.05) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            x: ['0%', '-8%', '0%'],
            y: ['0%', '-4%', '0%'],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' as const }}
        />
      </div>

      {/* Glassmorphic Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative z-10 w-[90vw] max-w-md mx-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl shadow-2xl shadow-black/40 p-6 sm:p-8"
      >
        {/* Emerald accent line at top */}
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />

        {/* Spinner */}
        <div className="flex justify-center mb-5">
          <RingSpinner />
        </div>

        {/* Title */}
        <h2 className="text-center text-lg sm:text-xl font-semibold text-white mb-1">
          You&apos;re in the waiting room
        </h2>

        {/* Pulsing dots */}
        <div className="flex justify-center mb-5">
          <PulsingDots />
        </div>

        {/* Meeting Info */}
        <div className="space-y-3 mb-6">
          {/* Meeting title */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Meeting</p>
              <p className="text-sm text-white/90 truncate font-medium">{meetingTitle}</p>
            </div>
          </div>

          {/* Host info */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Host</p>
              <p className="text-sm text-white/90 truncate font-medium">{hostName}</p>
            </div>
          </div>
        </div>

        {/* Queue Status */}
        <div className="text-center mb-6 space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-3.5 h-3.5 text-emerald-400/70" />
            <p className="text-sm text-white/60 font-medium">{positionText}</p>
          </div>
          {waitText && (
            <p className="text-xs text-white/40">{waitText}</p>
          )}
          <motion.p
            className="text-xs text-emerald-400/50"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' as const }}
          >
            The host will admit you shortly…
          </motion.p>
        </div>

        {/* Leave Button */}
        <Button
          variant="outline"
          onClick={onLeave}
          className="w-full h-10 gap-2 border-white/10 text-white/60 hover:text-white hover:bg-red-500/10 hover:border-red-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all rounded-xl"
        >
          <LogOut className="w-4 h-4" />
          Leave Waiting Room
        </Button>
      </motion.div>
    </motion.div>
  );
}
