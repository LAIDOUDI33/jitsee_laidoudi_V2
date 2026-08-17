'use client';

import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, Users, Shield, Maximize2, Minimize2, Copy, Check,
  Pencil, CheckCircle2, Wifi, Loader2, WifiOff,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

// ─── Connection Status Indicator ───────────────────────────────
function MeetingConnectionIndicator({ status }: { status: string }) {
  if (status === 'connected') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] text-emerald-400">
            <Wifi size={11} />
            <span className="hidden sm:inline">Live</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-slate-800 text-white border-slate-700 text-xs">Connected to meeting room</TooltipContent>
      </Tooltip>
    );
  }
  if (status === 'connecting' || status === 'reconnecting') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] text-amber-400">
            <Loader2 size={11} className="animate-spin" />
            <span className="hidden sm:inline">{status === 'reconnecting' ? 'Reconnecting' : 'Connecting'}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-slate-800 text-white border-slate-700 text-xs">{status === 'reconnecting' ? 'Reconnecting to meeting room...' : 'Connecting to meeting room...'}</TooltipContent>
      </Tooltip>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] text-red-400">
          <WifiOff size={11} />
          <span className="hidden sm:inline">Offline</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="bg-slate-800 text-white border-slate-700 text-xs">Meeting chat unavailable</TooltipContent>
    </Tooltip>
  );
}

// ─── Props ─────────────────────────────────────────────────────
export interface MeetingHeaderProps {
  meetingTitle: string;
  onSetTitle: (title: string) => void;
  onGoBack: () => void;
  wsStatus: string;
  isRecording: boolean;
  recordingTime: number;
  elapsed: number;
  meetingId: string;
  onlineCount: number;
  totalCount: number;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  formatTime: (seconds: number) => string;
}

// ─── Component ─────────────────────────────────────────────────
export default function MeetingHeader({
  meetingTitle,
  onSetTitle,
  onGoBack,
  wsStatus,
  isRecording,
  recordingTime,
  elapsed,
  meetingId,
  onlineCount,
  totalCount,
  isFullscreen,
  onToggleFullscreen,
  formatTime,
}: MeetingHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(meetingTitle || 'Sprint Planning - Q4');
  const [copied, setCopied] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isEditingTitle) titleInputRef.current?.focus(); }, [isEditingTitle]);

  const handleCopyMeetingId = () => {
    navigator.clipboard?.writeText(meetingId);
    setCopied(true);
    toast.success('Meeting ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTitleSave = () => {
    setIsEditingTitle(false);
    if (titleDraft.trim()) {
      onSetTitle(titleDraft.trim());
      toast.success('Meeting title updated');
    }
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/70 via-black/40 to-transparent">
      <div className="flex items-center justify-between px-3 sm:px-5 py-3">
        {/* Left: Back + Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onGoBack}
            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5">
                <input
                  ref={titleInputRef}
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleTitleSave(); if (e.key === 'Escape') { setIsEditingTitle(false); setTitleDraft(meetingTitle || 'Sprint Planning - Q4'); } }}
                  className="bg-white/10 border border-white/20 rounded-md px-2 py-0.5 text-sm font-semibold outline-none focus:border-violet-500/50 w-48 sm:w-64"
                />
                <button onClick={handleTitleSave} className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/20 text-emerald-400">
                  <CheckCircle2 size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setIsEditingTitle(true); setTitleDraft(meetingTitle || 'Sprint Planning - Q4'); }}
                className="flex items-center gap-1.5 group min-w-0"
              >
                <h2 className="text-sm font-semibold truncate">{meetingTitle || 'Sprint Planning - Q4'}</h2>
                <Pencil size={12} className="text-white/0 group-hover:text-white/50 transition-colors shrink-0" />
              </button>
            )}
            {isRecording && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <motion.span
                  className="w-2 h-2 rounded-full bg-red-500"
                  animate={{ opacity: [1, 0.3, 1], scale: [1, 0.85, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' as const }}
                />
                <span className="text-[10px] font-mono font-medium text-red-400">REC {formatTime(recordingTime)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Info pills */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Connection Status */}
          <MeetingConnectionIndicator status={wsStatus} />
          {/* Meeting Timer */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] font-mono text-white/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {formatTime(elapsed)}
          </div>
          {/* Meeting ID */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] font-mono">
            <span className="text-white/50">ID:</span>
            <span>{meetingId}</span>
            <button onClick={handleCopyMeetingId} className="text-white/40 hover:text-white transition-colors">
              {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            </button>
          </div>
          {/* Participants count */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px]">
            <Users size={11} className="text-white/60" />
            <span>{onlineCount}/{totalCount}</span>
          </div>
          {/* E2E badge */}
          <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] text-emerald-400">
            <Shield size={11} />
            <span>E2E</span>
          </div>
          {/* Fullscreen toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleFullscreen}
                className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-slate-800 text-white border-slate-700 text-xs">{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
