'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MicOff, VideoOff, Hand, Pin, PinOff, Wifi, Signal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { type Participant, type NetworkQuality, networkQualityConfig, getGradient, getRoleBadgeClass } from './meeting-data';

// ─── Audio Level Bars (real level-based) ──────────────────────
function AudioLevelBars({ audioLevel }: { audioLevel?: number }) {
  // Fallback to animated mock if no level provided
  const [levels, setLevels] = useState([3, 5, 2]);
  const isReal = audioLevel !== undefined;

  useEffect(() => {
    if (isReal) return; // driven by prop
    const interval = setInterval(() => {
      setLevels([
        Math.max(1, Math.floor(Math.random() * 6) + 1),
        Math.max(1, Math.floor(Math.random() * 6) + 1),
        Math.max(1, Math.floor(Math.random() * 6) + 1),
      ]);
    }, 400);
    return () => clearInterval(interval);
  }, [isReal]);

  const barHeights = isReal
    ? [audioLevel * 14 + 2, audioLevel * 16 + 2, audioLevel * 12 + 2]
    : levels.map(h => h * 4);

  return (
    <div className="flex items-end gap-[2px] h-4">
      {barHeights.map((h, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-emerald-400"
          animate={isReal ? { height: h } : { height: [2, h, 2] }}
          transition={isReal
            ? { duration: 0.1, ease: 'easeOut' as const }
            : { duration: 0.4, delay: i * 0.1, repeat: Infinity, repeatType: 'reverse' as const, ease: 'easeInOut' as const }
          }
        />
      ))}
    </div>
  );
}

// ─── Network Quality Indicator ────────────────────────────────
function NetworkQualityIndicator({ rtt = 0, bitrate = 0, resolution = '' }: { rtt?: number; bitrate?: number; resolution?: string }) {
  // Derive quality from real RTT; fallback to random if no data
  const [simQuality, setSimQuality] = useState<NetworkQuality>('excellent');
  const [simLatency, setSimLatency] = useState(22);

  useEffect(() => {
    if (rtt > 0) return; // Real data drives quality
    const qualities: NetworkQuality[] = ['excellent', 'good', 'fair', 'poor'];
    const changeQuality = () => {
      const q = qualities[Math.floor(Math.random() * qualities.length)];
      setSimQuality(q);
      const [minLat, maxLat] = networkQualityConfig[q].latency;
      setSimLatency(Math.floor(Math.random() * (maxLat - minLat + 1)) + minLat);
    };
    const interval = setInterval(changeQuality, 10000 + Math.random() * 5000);
    return () => clearInterval(interval);
  }, [rtt]);

  // Real quality from RTT
  const realQuality: NetworkQuality = rtt === 0 ? 'excellent' : rtt < 50 ? 'excellent' : rtt < 100 ? 'good' : rtt < 200 ? 'fair' : 'poor';
  const quality = rtt > 0 ? realQuality : simQuality;
  const latency = rtt > 0 ? rtt : simLatency;

  const config = networkQualityConfig[quality];
  const barCount = quality === 'excellent' ? 4 : quality === 'good' ? 3 : quality === 'fair' ? 2 : 1;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 cursor-default">
          <div className="flex items-end gap-[2px] h-3.5">
            {[1, 2, 3, 4].map((bar) => (
              <motion.div
                key={bar}
                className={`w-[3px] rounded-full ${bar <= barCount ? config.barColor : 'bg-white/20'}`}
                animate={{ height: [4, bar <= barCount ? bar * 3.5 : 4, bar <= barCount ? bar * 3.5 : 4] }}
                transition={{ duration: 0.5, delay: bar * 0.05, ease: 'easeOut' as const }}
              />
            ))}
          </div>
          {quality === 'poor' ? <Signal size={12} className={config.color} /> : <Wifi size={12} className={config.color} />}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="bg-slate-800/95 backdrop-blur-xl text-white border-white/10 text-xs rounded-lg">
        <div className="flex flex-col gap-0.5">
          <span>Network: <span className={config.color}>{config.label}</span></span>
          <span className="text-white/50">Latency: {latency}ms</span>
          {bitrate > 0 && <span className="text-white/50">Bitrate: {bitrate >= 1000 ? `${(bitrate / 1000).toFixed(1)} Mbps` : `${bitrate} kbps`}</span>}
          {resolution && <span className="text-white/50">Video: {resolution}</span>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Participant Tile Component ────────────────────────────────
interface ParticipantTileProps {
  participant: Participant;
  isActiveSpeaker?: boolean;
  isPinned?: boolean;
  isHandRaised?: boolean;
  onPin?: () => void;
  onClick?: () => void;
  index?: number;
  compact?: boolean;
  mediaStream?: MediaStream | null;
  isLocal?: boolean;
  audioLevel?: number;
  videoStyle?: React.CSSProperties;
  bgGradient?: string;
  bgBlur?: boolean;
}

function ParticipantTile({
  participant,
  isActiveSpeaker = false,
  isPinned = false,
  isHandRaised = false,
  onPin,
  onClick,
  index = 0,
  compact = false,
  mediaStream,
  isLocal = false,
  audioLevel,
  videoStyle,
  bgGradient,
  bgBlur,
}: ParticipantTileProps) {
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const gradient = getGradient(participant.color);

  const hasVideoStream = mediaStream && mediaStream.getVideoTracks().some(t => t.enabled && t.readyState === 'live');

  // Attach stream to video element
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !mediaStream) return;
    if (videoEl.srcObject !== mediaStream) {
      videoEl.srcObject = mediaStream;
    }
  }, [mediaStream]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 260, damping: 20 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      className={`relative w-full h-full rounded-2xl overflow-hidden flex items-center justify-center transition-all duration-300 ${
        isPinned ? 'ring-2 ring-amber-500/60 ring-offset-2 ring-offset-slate-950' :
        isActiveSpeaker ? 'ring-2 ring-emerald-400/70 shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-offset-2 ring-offset-slate-950' :
        'ring-1 ring-white/[0.06]'
      } ${compact ? 'min-h-0' : 'min-h-[180px] sm:min-h-[220px]'} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Active speaker green glow overlay */}
      <AnimatePresence>
        {isActiveSpeaker && !compact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-2xl pointer-events-none z-0"
            style={{
              boxShadow: 'inset 0 0 30px rgba(16,185,129,0.08), 0 0 40px rgba(16,185,129,0.12)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Virtual background layer (behind video for local) */}
      {isLocal && (bgBlur || bgGradient) && (
        <div className="absolute inset-0 z-0">
          {bgGradient && <div className="absolute inset-0" style={{ background: bgGradient }} />}
          {bgBlur && !bgGradient && <div className="absolute inset-0 bg-slate-700" />}
        </div>
      )}

      {/* Video element (when real stream available) */}
      {hasVideoStream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`absolute inset-0 w-full h-full object-cover ${isLocal ? '[transform:scaleX(-1)]' : ''}`}
          style={videoStyle}
        />
      ) : (
        <>
          {/* Gradient Background (fallback) */}
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

          {/* Subtle noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />

          {/* Avatar Placeholder */}
          <div className="relative z-10 flex flex-col items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={`rounded-full ${participant.color} flex items-center justify-center text-white font-bold shadow-lg ${
                compact ? 'w-10 h-10 text-sm' : 'w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl'
              }`}
              style={{ boxShadow: `0 8px 32px ${participant.color.replace('bg-', '')}40` }}
            >
              {participant.initials}
            </motion.div>
            {!hasVideoStream && participant.videoOn && !compact && (
              <span className="text-[10px] text-white/40 font-medium">Camera active</span>
            )}
          </div>
        </>
      )}

      {/* Audio Level Indicator (when mic on, bottom-left) */}
      {participant.micOn && !compact && (
        <div className="absolute bottom-3 left-3 z-20 bg-black/40 backdrop-blur-sm rounded-lg px-1.5 py-1">
          <AudioLevelBars audioLevel={audioLevel} />
        </div>
      )}

      {/* Hand Raised Floating Indicator */}
      <AnimatePresence>
        {isHandRaised && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.5 }}
            className="absolute top-3 left-3 z-20"
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const }}
              className="flex items-center gap-1.5 bg-amber-500/20 backdrop-blur-sm border border-amber-500/30 rounded-full px-2.5 py-1"
            >
              <Hand size={12} className="text-amber-400" />
              {!compact && <span className="text-[10px] font-medium text-amber-300">Raised</span>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pin Button (top-right, on hover) */}
      <AnimatePresence>
        {hovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={(e) => { e.stopPropagation(); onPin?.(); }}
            className={`absolute top-3 right-3 z-20 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              isPinned ? 'bg-amber-500 text-white' : 'bg-black/40 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/60'
            }`}
          >
            {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Name Label + Role Badge (bottom) */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/70 via-black/30 to-transparent pt-8 pb-2.5 px-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`font-medium truncate ${compact ? 'text-[11px]' : 'text-sm'}`}>{participant.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium border shrink-0 ${getRoleBadgeClass(participant.role)}`}>
              {participant.role}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!participant.micOn && <MicOff size={compact ? 12 : 14} className="text-red-400" />}
            {!participant.videoOn && <VideoOff size={compact ? 12 : 14} className="text-white/30" />}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Virtual Background Config ──────────────────────────
const BG_GRADIENTS: Record<string, string> = {
  office: 'linear-gradient(135deg, #78350f 0%, #92400e 30%, #b45309 60%, #d97706 100%)',
  nature: 'linear-gradient(135deg, #065f46 0%, #047857 30%, #10b981 60%, #6ee7b7 100%)',
  abstract: 'linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #0f172a 50%, #334155 100%)',
  city: 'linear-gradient(135deg, #1e293b 0%, #334155 30%, #475569 60%, #64748b 100%)',
};

// ─── Props ─────────────────────────────────────────────────────
export type VideoLayout = 'gallery' | 'speaker' | 'sidebar';

export interface VideoGridProps {
  displayParticipants: Participant[];
  gridLayout: VideoLayout;
  pinnedParticipant: string | null;
  effectiveHandRaisedIds: Set<string>;
  captionsVisible: boolean;
  displayCaption: { speaker: string; text: string } | null;
  captionKey: number;
  onTogglePin: (id: string) => void;
  onSelectSpeaker?: (id: string) => void;
  localStream?: MediaStream | null;
  remoteStreams?: Map<string, MediaStream>;
  localAudioLevel?: number;
  webrtcStats?: { rtt: number; bitrate: number; localVideoResolution: string };
  virtualBg?: string;
}

// ─── Helper: compute local participant virtual bg props ────────
function getLocalBgProps(virtualBg: string) {
  if (virtualBg === 'blur') {
    return {
      videoStyle: { filter: 'blur(8px) saturate(1.2)' } as React.CSSProperties,
      bgGradient: undefined,
      bgBlur: true,
    };
  }
  const gradient = BG_GRADIENTS[virtualBg];
  if (gradient) {
    return {
      videoStyle: { filter: 'blur(2px) saturate(1.2)', mixBlendMode: 'normal' } as React.CSSProperties,
      bgGradient: gradient,
      bgBlur: false,
    };
  }
  return { videoStyle: undefined, bgGradient: undefined, bgBlur: false };
}

// ─── Speaker Detection Hook ────────────────────────────────────
function useActiveSpeaker(
  participants: Participant[],
  pinnedParticipant: string | null,
  layout: VideoLayout,
) {
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Only auto-cycle in speaker or sidebar view when no one is pinned
    if (layout !== 'speaker' && layout !== 'sidebar') {
      queueMicrotask(() => setActiveSpeakerId(null));
      return;
    }

    const eligible = participants.filter(p => p.micOn);
    if (eligible.length === 0) {
      queueMicrotask(() => setActiveSpeakerId(participants[0]?.id ?? null));
      return;
    }

    // If there's a pinned participant, they are the active speaker
    if (pinnedParticipant && eligible.find(p => p.id === pinnedParticipant)) {
      queueMicrotask(() => setActiveSpeakerId(pinnedParticipant));
      return;
    }

    // Start with first eligible participant (deferred)
    queueMicrotask(() => {
      setActiveSpeakerId(prev => prev && eligible.find(p => p.id === prev) ? prev : eligible[0].id);
    });

    // Simulate speaker cycling every 5-8 seconds
    intervalRef.current = setInterval(() => {
      setActiveSpeakerId(prev => {
        const idx = eligible.findIndex(p => p.id === prev);
        const next = (idx + 1) % eligible.length;
        return eligible[next].id;
      });
    }, 5000 + Math.random() * 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [participants, pinnedParticipant, layout]);

  // Derive the sorted participants: pinned/active speaker first
  const orderedParticipants = useMemo(() => {
    if (layout === 'gallery') return participants;

    const speakerId = activeSpeakerId || participants[0]?.id;
    const speaker = participants.find(p => p.id === speakerId);
    const others = participants.filter(p => p.id !== speakerId);

    // Prioritize: pinned first among others, then the rest
    const pinnedOthers = others.filter(p => p.id === pinnedParticipant);
    const rest = others.filter(p => p.id !== pinnedParticipant);

    return speaker ? [speaker, ...pinnedOthers, ...rest] : participants;
  }, [participants, activeSpeakerId, pinnedParticipant, layout]);

  return { activeSpeakerId, orderedParticipants };
}

// ─── Layout transition variants ────────────────────────────────
const layoutVariants = {
  gallery: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.05 },
  },
  speaker: {
    opacity: 1,
    transition: { staggerChildren: 0.02, delayChildren: 0.05 },
  },
  sidebar: {
    opacity: 1,
    transition: { staggerChildren: 0.02, delayChildren: 0.05 },
  },
};

// ─── Component ─────────────────────────────────────────────────
export default function VideoGrid({
  displayParticipants,
  gridLayout,
  pinnedParticipant,
  effectiveHandRaisedIds,
  captionsVisible,
  displayCaption,
  captionKey,
  onTogglePin,
  onSelectSpeaker,
  localStream = null,
  remoteStreams,
  localAudioLevel,
  webrtcStats,
  virtualBg = 'none',
}: VideoGridProps) {
  // Pre-compute virtual bg props for local participant
  const localBgProps = useMemo(() => getLocalBgProps(virtualBg), [virtualBg]);

  // Smart speaker detection
  const { activeSpeakerId, orderedParticipants } = useActiveSpeaker(
    displayParticipants, pinnedParticipant, gridLayout,
  );

  const handleSelectSpeaker = useCallback((id: string) => {
    onSelectSpeaker?.(id);
  }, [onSelectSpeaker]);

  // Helper to render a tile with all common props
  const renderTile = (p: Participant, i: number, opts?: { compact?: boolean; isActiveSpeaker?: boolean; onClick?: () => void }) => (
    <ParticipantTile
      key={p.id}
      participant={p}
      index={i}
      isActiveSpeaker={opts?.isActiveSpeaker}
      isPinned={pinnedParticipant === p.id}
      isHandRaised={effectiveHandRaisedIds.has(p.id)}
      onPin={() => onTogglePin(p.id)}
      onClick={opts?.onClick}
      compact={opts?.compact}
      mediaStream={p.isLocal ? localStream : (remoteStreams?.get(p.id) ?? null)}
      isLocal={p.isLocal}
      audioLevel={p.isLocal ? localAudioLevel : undefined}
      videoStyle={p.isLocal ? localBgProps.videoStyle : undefined}
      bgGradient={p.isLocal ? localBgProps.bgGradient : undefined}
      bgBlur={p.isLocal ? localBgProps.bgBlur : undefined}
    />
  );

  return (
    <div className="flex-1 relative z-10">
      {/* ── Network Quality Indicator ── */}
      <NetworkQualityIndicator
        rtt={webrtcStats?.rtt}
        bitrate={webrtcStats?.bitrate}
        resolution={webrtcStats?.localVideoResolution}
      />

      {/* ── Live Captions Panel ── */}
      <AnimatePresence mode="wait">
        {captionsVisible && displayCaption && (
          <motion.div
            key={captionKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.4, ease: 'easeInOut' as const }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-2xl pointer-events-none"
          >
            <div className="flex flex-col gap-1 px-5 py-2.5 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10">
              <p className="text-sm text-white/90 leading-relaxed text-center line-clamp-2">
                <span className="font-bold text-white">{displayCaption.speaker}:</span>{' '}
                {displayCaption.text}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Layout Container ── */}
      <AnimatePresence mode="wait">
        {gridLayout === 'gallery' && (
          <motion.div
            key="gallery"
            variants={layoutVariants}
            initial={{ opacity: 0 }}
            animate="gallery"
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className={`h-full flex items-center justify-center p-2 sm:p-4 pt-16 pb-28 sm:pb-24`}
          >
            <div className={`grid gap-2 sm:gap-3 w-full h-full ${
              orderedParticipants.length <= 1 ? 'grid-cols-1' :
              orderedParticipants.length <= 2 ? 'grid-cols-2' :
              orderedParticipants.length <= 4 ? 'grid-cols-1 sm:grid-cols-2' :
              orderedParticipants.length <= 6 ? 'grid-cols-2 sm:grid-cols-3' :
              'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
            }`}>
              {orderedParticipants.map((p, i) => renderTile(p, i))}
            </div>
          </motion.div>
        )}

        {gridLayout === 'speaker' && (
          <motion.div
            key="speaker"
            variants={layoutVariants}
            initial={{ opacity: 0 }}
            animate="speaker"
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="h-full flex flex-col sm:flex-row items-stretch p-2 sm:p-4 pt-16 pb-28 sm:pb-24 gap-2 sm:gap-3"
          >
            {/* Main Speaker — 70% of space */}
            {orderedParticipants.length > 0 && (
              <div className="w-full sm:w-[70%] min-h-0 h-full sm:h-auto shrink-0">
                {renderTile(orderedParticipants[0], 0, {
                  isActiveSpeaker: orderedParticipants[0].id === activeSpeakerId,
                })}
              </div>
            )}

            {/* Thumbnail Strip — 30% on desktop, horizontal strip on mobile */}
            <AnimatePresence>
              {orderedParticipants.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="w-full sm:w-[30%] h-24 sm:h-full shrink-0"
                >
                  <div className="flex sm:flex-col gap-1.5 sm:gap-2 overflow-x-auto sm:overflow-y-auto sm:overflow-x-hidden h-full max-h-24 sm:max-h-none custom-scrollbar">
                    {orderedParticipants.slice(1).map((p, i) => (
                      <div
                        key={p.id}
                        className={`min-w-[120px] sm:min-w-0 sm:w-full h-20 sm:h-auto sm:flex-1 shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
                          p.id === activeSpeakerId
                            ? 'ring-2 ring-emerald-400/60'
                            : 'hover:ring-1 hover:ring-white/20'
                        }`}
                        onClick={() => handleSelectSpeaker(p.id)}
                      >
                        {renderTile(p, i + 1, {
                          compact: true,
                          isActiveSpeaker: p.id === activeSpeakerId,
                          onClick: () => handleSelectSpeaker(p.id),
                        })}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {gridLayout === 'sidebar' && (
          <motion.div
            key="sidebar"
            variants={layoutVariants}
            initial={{ opacity: 0 }}
            animate="sidebar"
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="h-full flex flex-col sm:flex-row items-stretch p-2 sm:p-4 pt-16 pb-28 sm:pb-24 gap-2 sm:gap-3"
          >
            {/* Main Video — 70% left */}
            {orderedParticipants.length > 0 && (
              <div className="w-full sm:w-[70%] h-[60%] sm:h-full shrink-0 min-h-0">
                {renderTile(orderedParticipants[0], 0, {
                  isActiveSpeaker: orderedParticipants[0].id === activeSpeakerId,
                })}
              </div>
            )}

            {/* Sidebar Participant List — 30% right, scrollable */}
            <AnimatePresence>
              {orderedParticipants.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="w-full sm:w-[30%] h-[40%] sm:h-full shrink-0 min-h-0"
                >
                  <div className="h-full rounded-xl overflow-hidden bg-black/20 border border-white/[0.06] flex flex-col">
                    {/* Sidebar header */}
                    <div className="shrink-0 px-3 py-2 bg-white/[0.03] border-b border-white/[0.06] flex items-center justify-between">
                      <span className="text-xs font-medium text-white/50">Participants ({orderedParticipants.length})</span>
                      <span className="text-[10px] text-emerald-400/70 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live
                      </span>
                    </div>

                    {/* Scrollable participant thumbnails */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 flex flex-col gap-1.5">
                      {orderedParticipants.slice(1).map((p, i) => (
                        <motion.div
                          key={p.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 25 }}
                          className={`relative w-full aspect-video rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                            p.id === activeSpeakerId
                              ? 'ring-2 ring-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                              : pinnedParticipant === p.id
                                ? 'ring-2 ring-amber-500/50'
                                : 'hover:ring-1 hover:ring-white/20'
                          }`}
                          onClick={() => handleSelectSpeaker(p.id)}
                        >
                          {renderTile(p, i + 1, {
                            compact: true,
                            isActiveSpeaker: p.id === activeSpeakerId,
                            onClick: () => handleSelectSpeaker(p.id),
                          })}

                          {/* Speaking indicator dot */}
                          {p.id === activeSpeakerId && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)] z-30"
                            />
                          )}

                          {/* Pinned indicator */}
                          {pinnedParticipant === p.id && p.id !== activeSpeakerId && (
                            <div className="absolute top-1.5 right-1.5 z-30">
                              <Pin size={10} className="text-amber-400" />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
