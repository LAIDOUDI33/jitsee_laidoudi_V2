'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Clock, Users, MessageSquare, SmilePlus, Wifi, CircleDot,
  FileText, Sparkles, BarChart3, Activity,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────
export interface MeetingStatsData {
  durationSeconds: number;
  currentParticipants: number;
  maxParticipants: number;
  participantHistory: number[];
  totalMessages: number;
  messagesPerMinute: number;
  totalReactions: number;
  networkQuality: 'Good' | 'Fair' | 'Poor';
  isRecording: boolean;
  recordingDurationSeconds: number;
  transcriptionWordCount: number;
  transcriptionLanguage: string;
  aiFeatures: { summary: boolean; transcription: boolean; translation: boolean };
}

export interface MeetingStatsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: MeetingStatsData;
}

// ─── Animated Counter Hook ───────────────────────────────────
function useAnimatedNumber(target: number, duration = 600) {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number | null>(null);
  const prevRef = useRef(target);

  useEffect(() => {
    const from = prevRef.current;
    const diff = target - from;
    if (diff === 0) return;
    prevRef.current = target;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + diff * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return display;
}

// ─── Mini Sparkline ─────────────────────────────────────────
function MiniSparkline({ data, color = 'emerald' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const padding = 2;
  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (w - padding * 2);
    const y = h - padding - ((v - min) / range) * (h - padding * 2);
    return `${x},${y}`;
  });

  const colorMap: Record<string, string> = {
    emerald: '#34d399',
    amber: '#fbbf24',
    rose: '#fb7185',
  };
  const stroke = colorMap[color] || colorMap.emerald;
  const fillOpacity = color === 'rose' ? '0.08' : '0.12';

  return (
    <svg width={w} height={h} className="shrink-0" viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={`spark-fill-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`${points[0]},${h} ${points.join(' ')} ${points[points.length - 1]},${h}`}
        fill={`url(#spark-fill-${color})`}
      />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dot on last point */}
      <circle
        cx={points[points.length - 1].split(',')[0]}
        cy={points[points.length - 1].split(',')[1]}
        r="2.5"
        fill={stroke}
      />
    </svg>
  );
}

// ─── Mini Bar Chart ─────────────────────────────────────────
function MiniBarChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[3px] h-7">
      {data.map((v, i) => {
        const h = Math.max((v / max) * 24, 2);
        return (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: h }}
            transition={{ type: 'spring', stiffness: 400, damping: 25, delay: i * 0.05 }}
            className="w-[6px] rounded-sm bg-emerald-400/60"
          />
        );
      })}
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  subtitle,
  indicator,
  children,
  className = '',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  indicator?: 'emerald' | 'amber' | 'rose' | 'teal';
  children?: React.ReactNode;
  className?: string;
}) {
  const indicatorColors: Record<string, string> = {
    emerald: 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/15 border-amber-500/20 text-amber-400',
    rose: 'bg-rose-500/15 border-rose-500/20 text-rose-400',
    teal: 'bg-teal-500/15 border-teal-500/20 text-teal-400',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`rounded-xl border p-3.5 transition-colors ${
        indicator
          ? `${indicatorColors[indicator]} border`
          : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            indicator
              ? `${indicatorColors[indicator]} border`
              : 'bg-white/[0.06] border border-white/[0.08]'
          }`}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-white/40 font-medium">{label}</p>
            <p className="text-lg font-bold text-white leading-tight mt-0.5">{value}</p>
            {subtitle && <p className="text-[11px] text-white/50 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </div>
    </motion.div>
  );
}

// ─── Pulsing Dot ────────────────────────────────────────────
function PulsingDot({ color = 'emerald' }: { color?: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
  };
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <motion.span
        className={`absolute inline-flex h-full w-full rounded-full ${colors[color]} opacity-75`}
        animate={{ scale: [1, 1.8], opacity: [0.75, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' as const }}
      />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors[color]}`} />
    </span>
  );
}

// ─── Format Helpers ─────────────────────────────────────────
function formatHHMMSS(seconds: number) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// ─── Main Panel ─────────────────────────────────────────────
export default function MeetingStatsPanel({ open, onOpenChange, stats }: MeetingStatsPanelProps) {
  const animDuration = useAnimatedNumber(stats.durationSeconds, 800);
  const animParticipants = useAnimatedNumber(stats.currentParticipants, 400);
  const animMessages = useAnimatedNumber(stats.totalMessages, 500);
  const animReactions = useAnimatedNumber(stats.totalReactions, 400);
  const animWords = useAnimatedNumber(stats.transcriptionWordCount, 500);
  const animRecDuration = useAnimatedNumber(stats.recordingDurationSeconds, 800);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onOpenChange(false);
  }, [onOpenChange]);
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Network quality config
  const nwConfig: Record<string, { color: 'emerald' | 'amber' | 'rose'; icon: React.ReactNode }> = {
    Good: { color: 'emerald', icon: <Wifi size={16} className="text-emerald-400" /> },
    Fair: { color: 'amber', icon: <Wifi size={16} className="text-amber-400" /> },
    Poor: { color: 'rose', icon: <Wifi size={16} className="text-rose-400" /> },
  };
  const nw = nwConfig[stats.networkQuality] || nwConfig.Good;

  const activeAIFeatures = [
    stats.aiFeatures.summary && { key: 'summary', label: 'Summary', icon: <FileText size={12} /> },
    stats.aiFeatures.transcription && { key: 'transcription', label: 'Transcription', icon: <FileText size={12} /> },
    stats.aiFeatures.translation && { key: 'translation', label: 'Translation', icon: <Activity size={12} /> },
  ].filter(Boolean) as { key: string; label: string; icon: React.ReactNode }[];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={containerRef}
          initial={{ x: 380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 380, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="h-full w-[360px] sm:w-[384px] bg-slate-950/80 backdrop-blur-2xl border-l border-white/10 flex flex-col overflow-hidden shrink-0 max-sm:absolute max-sm:right-0 max-sm:z-40"
        >
          {/* ── Header ── */}
          <div className="px-4 pt-4 pb-3 border-b border-white/10 bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/20 flex items-center justify-center">
                  <BarChart3 size={16} className="text-teal-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Meeting Stats</h2>
                  <p className="text-[11px] text-white/40">Live dashboard</p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center shrink-0 transition-colors"
              >
                <X size={14} className="text-white/60" />
              </button>
            </div>
          </div>

          {/* ── Stats Grid ── */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Duration */}
              <StatCard
                icon={<Clock size={16} className="text-emerald-400" />}
                label="Duration"
                value={formatHHMMSS(animDuration)}
                className="sm:col-span-2"
              >
                <div className="flex items-center gap-1.5 mt-0.5">
                  <PulsingDot color="emerald" />
                  <span className="text-[10px] text-emerald-400 font-medium">LIVE</span>
                </div>
              </StatCard>

              {/* Participants */}
              <StatCard
                icon={<Users size={16} className="text-teal-400" />}
                label="Participants"
                value={`${animParticipants} / ${stats.maxParticipants}`}
                subtitle={`${stats.messagesPerMinute.toFixed(1)} msgs/min`}
                indicator="teal"
              >
                <MiniSparkline data={stats.participantHistory} color={stats.currentParticipants > stats.maxParticipants * 0.8 ? 'amber' : 'emerald'} />
              </StatCard>

              {/* Participant mini bar chart */}
              <StatCard
                icon={<BarChart3 size={16} className="text-emerald-400" />}
                label="Join Activity"
                value={`${stats.participantHistory.length} data points`}
                subtitle="Last 5 intervals"
              >
                <MiniBarChart data={stats.participantHistory} />
              </StatCard>

              {/* Messages */}
              <StatCard
                icon={<MessageSquare size={16} className="text-emerald-400" />}
                label="Messages"
                value={String(animMessages)}
                subtitle={`${stats.messagesPerMinute.toFixed(1)} msgs/min`}
                indicator="emerald"
              />

              {/* Reactions */}
              <StatCard
                icon={<SmilePlus size={16} className="text-amber-400" />}
                label="Reactions"
                value={String(animReactions)}
                subtitle={animReactions > 20 ? 'Very active' : animReactions > 10 ? 'Active' : 'Moderate'}
                indicator="amber"
              />

              {/* Network Quality */}
              <StatCard
                icon={nw.icon}
                label="Network Quality"
                value={stats.networkQuality}
                subtitle="Average across all"
                indicator={nw.color}
                className="sm:col-span-2"
              />

              {/* Recording */}
              <StatCard
                icon={(
                  <span className="relative">
                    <CircleDot size={16} className={stats.isRecording ? 'text-rose-400' : 'text-white/40'} />
                    {stats.isRecording && (
                      <motion.span
                        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-400"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      />
                    )}
                  </span>
                )}
                label="Recording"
                value={stats.isRecording ? formatHHMMSS(animRecDuration) : 'Not Recording'}
                subtitle={stats.isRecording ? 'In progress' : 'Click ⏺ to start'}
                indicator={stats.isRecording ? 'rose' : undefined}
              />

              {/* Transcription */}
              <StatCard
                icon={<FileText size={16} className="text-teal-400" />}
                label="Transcription"
                value={`${animWords.toLocaleString()} words`}
                subtitle={`Detected: ${stats.transcriptionLanguage}`}
                indicator="teal"
              />

              {/* AI Features */}
              <StatCard
                icon={<Sparkles size={16} className="text-amber-400" />}
                label="AI Features"
                value={`${activeAIFeatures.length} active`}
                subtitle={activeAIFeatures.length > 0 ? 'Enhancing meeting' : 'No AI active'}
                indicator={activeAIFeatures.length > 0 ? 'amber' : undefined}
                className="sm:col-span-2"
              >
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {activeAIFeatures.map(f => (
                    <motion.span
                      key={f.key}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/15 border border-amber-500/20 text-amber-300"
                    >
                      {f.icon}
                      {f.label}
                    </motion.span>
                  ))}
                  {activeAIFeatures.length === 0 && (
                    <span className="text-[10px] text-white/30">No AI features active</span>
                  )}
                </div>
              </StatCard>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-4 py-2.5 border-t border-white/[0.06]">
            <p className="text-[10px] text-white/25 text-center">
              Stats refresh automatically in real-time
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
