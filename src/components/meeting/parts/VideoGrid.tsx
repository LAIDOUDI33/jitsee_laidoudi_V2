'use client';

import { useState, useEffect, useRef } from 'react';
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
  isSpeaker?: boolean;
  isPinned?: boolean;
  isHandRaised?: boolean;
  onPin?: () => void;
  index?: number;
  compact?: boolean;
  mediaStream?: MediaStream | null;
  isLocal?: boolean;
  audioLevel?: number;
}

function ParticipantTile({
  participant,
  isSpeaker = false,
  isPinned = false,
  isHandRaised = false,
  onPin,
  index = 0,
  compact = false,
  mediaStream,
  isLocal = false,
  audioLevel,
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 20 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative w-full h-full rounded-2xl overflow-hidden flex items-center justify-center transition-all duration-300 ${
        isPinned ? 'ring-2 ring-violet-500/60 ring-offset-2 ring-offset-slate-950' :
        isSpeaker ? 'ring-1 ring-white/10' : 'ring-1 ring-white/[0.06]'
      } ${compact ? 'min-h-0' : 'min-h-[180px] sm:min-h-[220px]'}`}
    >
      {/* Video element (when real stream available) */}
      {hasVideoStream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`absolute inset-0 w-full h-full object-cover ${isLocal ? '[transform:scaleX(-1)]' : ''}`}
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
            onClick={onPin}
            className={`absolute top-3 right-3 z-20 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              isPinned ? 'bg-violet-500 text-white' : 'bg-black/40 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/60'
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

// ─── Props ─────────────────────────────────────────────────────
export interface VideoGridProps {
  displayParticipants: Participant[];
  gridLayout: 'grid' | 'speaker' | 'gallery';
  pinnedParticipant: string | null;
  effectiveHandRaisedIds: Set<string>;
  captionsVisible: boolean;
  displayCaption: { speaker: string; text: string } | null;
  captionKey: number;
  onTogglePin: (id: string) => void;
  localStream?: MediaStream | null;
  remoteStreams?: Map<string, MediaStream>;
  localAudioLevel?: number;
  webrtcStats?: { rtt: number; bitrate: number; localVideoResolution: string };
}

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
  localStream = null,
  remoteStreams,
  localAudioLevel,
  webrtcStats,
}: VideoGridProps) {
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

      <div className={`h-full flex items-center justify-center p-2 sm:p-4 pt-16 pb-28 sm:pb-24 ${
        gridLayout === 'speaker' && displayParticipants.length > 1
          ? 'flex-col sm:flex-row gap-2 sm:gap-3'
          : ''
      }`}>
        {gridLayout === 'speaker' && displayParticipants.length > 1 ? (
          /* Speaker Layout */
          <>
            {/* Main speaker */}
            <div className="flex-1 min-h-0 h-full sm:h-auto w-full sm:max-w-none">
              <ParticipantTile
                  key={displayParticipants[0].id}
                  participant={displayParticipants[0]}
                  isSpeaker
                  isPinned={pinnedParticipant === displayParticipants[0].id}
                  isHandRaised={effectiveHandRaisedIds.has(displayParticipants[0].id)}
                  onPin={() => onTogglePin(displayParticipants[0].id)}
                  mediaStream={displayParticipants[0].isLocal ? localStream : (remoteStreams?.get(displayParticipants[0].id) ?? null)}
                  isLocal={displayParticipants[0].isLocal}
                  audioLevel={displayParticipants[0].isLocal ? localAudioLevel : undefined}
                />
            </div>
            {/* Thumbnail strip */}
            <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto sm:overflow-x-hidden max-h-40 sm:max-h-none sm:w-48 lg:w-56 shrink-0">
              {displayParticipants.slice(1).map((p, i) => (
                <div key={p.id} className="min-w-[140px] sm:min-w-0 sm:w-full h-24 sm:h-20 shrink-0">
                  <ParticipantTile
                    participant={p}
                    index={i + 1}
                    isPinned={pinnedParticipant === p.id}
                    isHandRaised={effectiveHandRaisedIds.has(p.id)}
                    onPin={() => onTogglePin(p.id)}
                    compact
                    mediaStream={p.isLocal ? localStream : (remoteStreams?.get(p.id) ?? null)}
                    isLocal={p.isLocal}
                    audioLevel={p.isLocal ? localAudioLevel : undefined}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Grid / Gallery Layout */
          <div className={`grid gap-2 sm:gap-3 w-full h-full ${
            displayParticipants.length <= 1 ? 'grid-cols-1' :
            displayParticipants.length <= 2 ? 'grid-cols-2' :
            displayParticipants.length <= 4 ? 'grid-cols-1 sm:grid-cols-2' :
            displayParticipants.length <= 6 ? 'grid-cols-2 sm:grid-cols-3' :
            'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
          }`}>
            {displayParticipants.map((p, i) => (
              <ParticipantTile
                key={p.id}
                participant={p}
                index={i}
                isPinned={pinnedParticipant === p.id}
                isHandRaised={effectiveHandRaisedIds.has(p.id)}
                onPin={() => onTogglePin(p.id)}
                mediaStream={p.isLocal ? localStream : (remoteStreams?.get(p.id) ?? null)}
                isLocal={p.isLocal}
                audioLevel={p.isLocal ? localAudioLevel : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
