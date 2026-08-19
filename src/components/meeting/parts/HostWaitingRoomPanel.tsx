'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, UserCheck, UserX, UserPlus, UsersRound, Clock, Bell, BellRing,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { type WaitingParticipant } from './meeting-data';

// ─── Types ──────────────────────────────────────────────────
export interface HostWaitingRoomPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  waitingParticipants: WaitingParticipant[];
  onAdmit: (id: string) => void;
  onReject: (id: string) => void;
  onAdmitAll: () => void;
  onRejectAll: () => void;
}

// ─── Notification pulse for external trigger button ─────────
export function useWaitingRoomNotification(count: number) {
  const [justArrived, setJustArrived] = useState(false);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count > prevCount.current && count > 0) {
      queueMicrotask(() => setJustArrived(true));
      const timer = setTimeout(() => setJustArrived(false), 2500);
      return () => clearTimeout(timer);
    }
    prevCount.current = count;
  }, [count]);

  return justArrived;
}

// ─── Waiting Participant Row ────────────────────────────────
function WaitingParticipantRow({
  participant,
  onAdmit,
  onReject,
  isNew,
}: {
  participant: WaitingParticipant;
  onAdmit: (id: string) => void;
  onReject: (id: string) => void;
  isNew: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
        isNew
          ? 'bg-emerald-500/10 border border-emerald-500/20'
          : 'bg-white/[0.03] border border-transparent hover:bg-white/[0.05]'
      }`}
    >
      {/* Avatar with initials */}
      <div className={`relative w-10 h-10 rounded-full ${participant.color} flex items-center justify-center shrink-0 shadow-lg`}>
        <span className="text-sm font-bold text-white">{participant.initials}</span>
        {isNew && (
          <motion.span
            className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.4, 1] }}
            transition={{ duration: 0.6, ease: 'easeOut' as const }}
          />
        )}
      </div>

      {/* Name + time */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{participant.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Clock className="w-3 h-3 text-white/30" />
          <p className="text-xs text-white/40">Joined {participant.joinTime}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onAdmit(participant.id)}
          className="h-8 px-3 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-500/40 transition-colors flex items-center gap-1.5 text-xs font-medium"
        >
          <UserCheck className="w-3.5 h-3.5" />
          Admit
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onReject(participant.id)}
          className="h-8 px-3 rounded-lg bg-rose-500/15 border border-rose-500/25 text-rose-400 hover:bg-rose-500/25 hover:border-rose-500/40 transition-colors flex items-center gap-1.5 text-xs font-medium"
        >
          <UserX className="w-3.5 h-3.5" />
          Reject
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Empty State ─────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">
        <UsersRound className="w-7 h-7 text-white/20" />
      </div>
      <p className="text-sm font-medium text-white/50 mb-1">No one is waiting</p>
      <p className="text-xs text-white/30 leading-relaxed">
        When participants arrive, they&apos;ll appear here for you to admit or reject.
      </p>
    </motion.div>
  );
}

// ─── Main Panel Component ────────────────────────────────────
export default function HostWaitingRoomPanel({
  open,
  onOpenChange,
  waitingParticipants,
  onAdmit,
  onReject,
  onAdmitAll,
  onRejectAll,
}: HostWaitingRoomPanelProps) {
  const [newArrivalIds, setNewArrivalIds] = useState<Set<string>>(new Set());
  const [chimeActive, setChimeActive] = useState(false);
  const prevCountRef = useRef(waitingParticipants.length);

  // Detect new arrivals for animation + chime
  useEffect(() => {
    if (waitingParticipants.length > prevCountRef.current) {
      const prevLength = prevCountRef.current;
      prevCountRef.current = waitingParticipants.length;
      // Find newly added participants (last N added)
      const newOnes = waitingParticipants.slice(prevLength);
      if (newOnes.length > 0) {
        const newIds = newOnes.map(p => p.id);
        // Defer state updates to avoid synchronous setState in effect
        queueMicrotask(() => {
          setNewArrivalIds(prev => {
            const next = new Set(prev);
            for (const id of newIds) next.add(id);
            return next;
          });
          setChimeActive(true);
        });
        const chimeTimer = setTimeout(() => setChimeActive(false), 2000);
        const clearTimer = setTimeout(() => {
          setNewArrivalIds(prev => {
            const next = new Set(prev);
            for (const id of newIds) next.delete(id);
            return next;
          });
        }, 3000);
        return () => { clearTimeout(chimeTimer); clearTimeout(clearTimer); };
      }
      return undefined;
    }
    prevCountRef.current = waitingParticipants.length;
    return undefined;
  }, [waitingParticipants]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: 380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 380, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="h-full w-[360px] sm:w-[384px] bg-slate-950/80 backdrop-blur-2xl border-l border-white/10 flex flex-col overflow-hidden shrink-0 max-sm:absolute max-sm:right-0 max-sm:z-40"
        >
          {/* ── Header ── */}
          <div className="px-4 pt-4 pb-3 border-b border-white/10 bg-white/[0.03]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                {/* Animated chime icon */}
                <div className="relative w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {chimeActive ? (
                      <motion.div
                        key="ringing"
                        initial={{ scale: 0.5, rotate: -15 }}
                        animate={{ scale: 1, rotate: [0, 12, -12, 8, -8, 0] }}
                        exit={{ scale: 0.5 }}
                        transition={{ duration: 0.6, ease: 'easeOut' as const }}
                      >
                        <BellRing className="w-4 h-4 text-amber-400" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="silent"
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                      >
                        <Bell className="w-4 h-4 text-amber-400/60" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {/* Pulse ring on chime */}
                  <AnimatePresence>
                    {chimeActive && (
                      <motion.span
                        className="absolute inset-0 rounded-lg border-2 border-amber-400/40"
                        initial={{ scale: 1, opacity: 0.8 }}
                        animate={{ scale: 1.8, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1, ease: 'easeOut' as const }}
                      />
                    )}
                  </AnimatePresence>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Waiting Room</h2>
                  <p className="text-[11px] text-white/40">
                    {waitingParticipants.length === 0
                      ? 'No one waiting'
                      : `${waitingParticipants.length} ${waitingParticipants.length === 1 ? 'person' : 'people'} waiting`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center shrink-0 transition-colors"
              >
                <X size={14} className="text-white/60" />
              </button>
            </div>

            {/* ── Bulk actions ── */}
            {waitingParticipants.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAdmitAll}
                  className="flex-1 h-8 text-xs gap-1.5 rounded-lg bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Admit All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRejectAll}
                  className="flex-1 h-8 text-xs gap-1.5 rounded-lg bg-rose-500/10 border-rose-500/25 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40"
                >
                  <UserX className="w-3.5 h-3.5" />
                  Reject All
                </Button>
              </div>
            )}
          </div>

          {/* ── Participant List ── */}
          <div className="flex-1 overflow-hidden">
            {waitingParticipants.length === 0 ? (
              <EmptyState />
            ) : (
              <ScrollArea className="h-full">
                <div className="p-3 space-y-2">
                  <AnimatePresence mode="popLayout">
                    {waitingParticipants.map(p => (
                      <WaitingParticipantRow
                        key={p.id}
                        participant={p}
                        onAdmit={onAdmit}
                        onReject={onReject}
                        isNew={newArrivalIds.has(p.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </div>

          {/* ── Footer ── */}
          <Separator className="bg-white/[0.06]" />
          <div className="px-4 py-2.5">
            <p className="text-[10px] text-white/25 text-center">
              Participants will be notified when admitted or rejected
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
