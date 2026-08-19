'use client';

import { useState, useEffect, useRef } from 'react';
import type { VideoLayout } from './VideoGrid';
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, MessageSquare, Users,
  Hand, Phone, CircleDot, Sparkles, Check, Plus, LayoutGrid, User, PanelRight,
  Subtitles, SmilePlus, Pen, FileText, ImageIcon,
  MoreHorizontal, DoorOpen, Bell, BellRing, Lock, LockOpen, BarChart3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { reactionEmojis } from './meeting-data';

// ─── Toolbar Button Component ──────────────────────────────────
function ToolbarButton({
  icon,
  label,
  onClick,
  active = false,
  glowColor,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  glowColor?: 'emerald' | 'sky' | 'amber' | 'red';
}) {
  const glowClasses: Record<string, string> = {
    emerald: 'shadow-[0_0_12px_rgba(16,185,129,0.3)] ring-emerald-500/30',
    sky: 'shadow-[0_0_12px_rgba(14,165,233,0.3)] ring-sky-500/30',
    amber: 'shadow-[0_0_12px_rgba(245,158,11,0.3)] ring-amber-500/30',
    red: 'shadow-[0_0_12px_rgba(239,68,68,0.3)] ring-red-500/30',
  };

  const inactiveStateClasses: Record<string, string> = {
    emerald: 'text-red-400',
    sky: 'text-sky-400',
    amber: 'text-amber-400',
    red: 'text-red-500',
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={onClick}
          className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all ${
            active && glowColor
              ? `text-white bg-white/10 ring-1 ${glowClasses[glowColor]}`
              : active
                ? 'text-white bg-white/15'
                : glowColor && !active
                  ? `${inactiveStateClasses[glowColor]} bg-white/5 hover:bg-white/10`
                  : 'text-white/80 bg-white/5 hover:bg-white/15'
          }`}
        >
          {icon}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="top" className="bg-slate-800/95 backdrop-blur-xl text-white border-white/10 text-xs rounded-lg">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Props ─────────────────────────────────────────────────────
export interface MeetingToolbarProps {
  micOn: boolean;
  cameraOn: boolean;
  screenSharing: boolean;
  handRaised: boolean;
  isRecording: boolean;
  captionsVisible: boolean;
  transcriptionOpen: boolean;
  virtualBgActive: boolean;
  gridLayout: VideoLayout;
  meetingSidebarTab: string;
  sidebarOpen: boolean;
  reactionCounts: Record<string, number>;
  enhancedReactionsOpen: boolean;
  waitingRoomCount: number;
  waitingRoomOpen: boolean;
  waitingRoomNotification: boolean;
  meetingLocked: boolean;
  onToggleMeetingLock: () => void;
  statsPanelOpen: boolean;
  onToggleStatsPanel: () => void;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleHand: () => void;
  onToggleRecording: () => void;
  onToggleCaptions: () => void;
  onToggleTranscription: () => void;
  onOpenVirtualBg: () => void;
  onToggleSidebar: (tab: 'chat' | 'participants' | 'ai' | 'polls' | 'breakout') => void;
  onSendReaction: (emoji: string) => void;
  onToggleEnhancedReactions: () => void;
  onSetGridLayout: (layout: VideoLayout) => void;
  onOpenPollBuilder: () => void;
  onToggleWaitingRoom: () => void;
  onLeaveMeeting: () => void;
}

// ─── Component ─────────────────────────────────────────────────
export default function MeetingToolbar({
  micOn,
  cameraOn,
  screenSharing,
  handRaised,
  isRecording,
  captionsVisible,
  transcriptionOpen,
  virtualBgActive,
  gridLayout,
  meetingSidebarTab,
  sidebarOpen,
  reactionCounts,
  enhancedReactionsOpen,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onToggleHand,
  onToggleRecording,
  onToggleCaptions,
  onToggleTranscription,
  onOpenVirtualBg,
  onToggleSidebar,
  onSendReaction,
  onToggleEnhancedReactions,
  onSetGridLayout,
  onOpenPollBuilder,
  onToggleWaitingRoom,
  onLeaveMeeting,
  waitingRoomCount,
  waitingRoomOpen,
  waitingRoomNotification,
  meetingLocked,
  onToggleMeetingLock,
  statsPanelOpen,
  onToggleStatsPanel,
}: MeetingToolbarProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const enhancedReactionsRef = useRef<HTMLDivElement>(null);

  // --- Close more menu on outside click ---
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node) &&
          mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // --- Close enhanced reactions on outside click ---
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (enhancedReactionsRef.current && !enhancedReactionsRef.current.contains(e.target as Node)) onToggleEnhancedReactions();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onToggleEnhancedReactions]);

  return (
    <>
      {/* ── Enhanced Reactions Bar (floating above toolbar) ── */}
      <div ref={enhancedReactionsRef} className="absolute bottom-24 left-[calc(50%-80px)] z-40">
        <AnimatePresence>
          {enhancedReactionsOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 mb-2"
            >
              {reactionEmojis.map((emoji) => (
                <motion.button
                  key={emoji}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={() => onSendReaction(emoji)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-all text-lg"
                >
                  {emoji}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom Toolbar ── */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex justify-center pb-4 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
          className="flex items-center gap-1.5 sm:gap-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 sm:p-2"
        >
          {/* Mic */}
          <ToolbarButton
            active={micOn}
            icon={micOn ? <Mic size={20} /> : <MicOff size={20} />}
            label={micOn ? 'Mute' : 'Unmute'}
            onClick={onToggleMic}
            glowColor="emerald"
          />
          {/* Camera */}
          <ToolbarButton
            active={cameraOn}
            icon={cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
            label={cameraOn ? 'Stop Camera' : 'Start Camera'}
            onClick={onToggleCamera}
            glowColor="emerald"
          />

          {/* ── Desktop-only buttons (hidden on mobile) ── */}
          <div className="hidden md:flex items-center">
            {/* Separator */}
            <div className="w-px h-8 bg-white/10 mx-0.5" />
            {/* Screen Share */}
            <ToolbarButton
              active={screenSharing}
              icon={screenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
              label={screenSharing ? 'Stop Sharing' : 'Share Screen'}
              onClick={onToggleScreenShare}
              glowColor="sky"
            />
            {/* Hand Raise */}
            <ToolbarButton
              active={handRaised}
              icon={<Hand size={20} />}
              label={handRaised ? 'Lower Hand' : 'Raise Hand'}
              onClick={onToggleHand}
              glowColor="amber"
            />
            {/* Recording */}
            <ToolbarButton
              active={isRecording}
              icon={<CircleDot size={20} />}
              label={isRecording ? 'Stop Recording' : 'Start Recording'}
              onClick={onToggleRecording}
              glowColor="red"
            />
            <div className="w-px h-8 bg-white/10 mx-0.5" />
            {/* Chat */}
            <ToolbarButton
              active={meetingSidebarTab === 'chat' && sidebarOpen}
              icon={<MessageSquare size={20} />}
              label="Chat"
              onClick={() => onToggleSidebar('chat')}
            />
            {/* Participants */}
            <ToolbarButton
              active={meetingSidebarTab === 'participants' && sidebarOpen}
              icon={<Users size={20} />}
              label="Participants"
              onClick={() => onToggleSidebar('participants')}
            />
            {/* Waiting Room */}
            <div className="relative">
              <ToolbarButton
                active={waitingRoomOpen}
                icon={(
                  <span className="relative">
                    {waitingRoomNotification ? (
                      <motion.span
                        animate={{ rotate: [0, 14, -14, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: 1, ease: 'easeOut' as const }}
                      >
                        <BellRing size={20} className="text-amber-400" />
                      </motion.span>
                    ) : (
                      <DoorOpen size={20} />
                    )}
                    {waitingRoomCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: waitingRoomNotification ? [1, 1.3, 1] : 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                        className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white px-1 shadow-lg shadow-amber-500/30"
                      >
                        {waitingRoomCount}
                      </motion.span>
                    )}
                  </span>
                )}
                label="Waiting Room"
                onClick={onToggleWaitingRoom}
              />
              {/* Pulse ring on notification */}
              <AnimatePresence>
                {waitingRoomNotification && (
                  <motion.span
                    className="absolute inset-0 rounded-full border-2 border-amber-400/50 pointer-events-none"
                    initial={{ scale: 0.8, opacity: 0.8 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: 'easeOut' as const }}
                  />
                )}
              </AnimatePresence>
            </div>
            {/* AI */}
            <ToolbarButton
              active={meetingSidebarTab === 'ai' && sidebarOpen}
              icon={<Sparkles size={20} />}
              label="AI Assistant"
              onClick={() => onToggleSidebar('ai')}
            />
            {/* Captions */}
            <ToolbarButton
              active={captionsVisible}
              icon={<Subtitles size={20} />}
              label={captionsVisible ? 'Hide Captions' : 'Show Captions'}
              onClick={onToggleCaptions}
            />
            {/* Live Transcription Panel */}
            <ToolbarButton
              active={transcriptionOpen}
              icon={<FileText size={20} />}
              label={transcriptionOpen ? 'Hide Transcription' : 'Live Transcription'}
              onClick={onToggleTranscription}
            />
            {/* Virtual Backgrounds */}
            <ToolbarButton
              active={virtualBgActive}
              icon={<ImageIcon size={20} />}
              label={virtualBgActive ? 'Change Background' : 'Virtual Background'}
              onClick={onOpenVirtualBg}
              glowColor="emerald"
            />
            {/* Reactions */}
            <div className="relative">
              <ToolbarButton
                active={enhancedReactionsOpen}
                icon={(
                  <span className="relative">
                    <SmilePlus size={20} />
                    {Object.keys(reactionCounts).length > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-violet-500 text-[8px] font-bold text-white px-0.5"
                      >
                        {Object.values(reactionCounts).reduce((a, b) => a + b, 0)}
                      </motion.span>
                    )}
                  </span>
                )}
                label="Reactions"
                onClick={onToggleEnhancedReactions}
              />
            </div>

            {/* ── Layout Toggle Button Group ── */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center bg-white/[0.06] rounded-xl p-0.5 gap-0.5">
                  {([
                    { layout: 'gallery' as const, icon: <LayoutGrid size={16} />, label: 'Gallery' },
                    { layout: 'speaker' as const, icon: <User size={16} />, label: 'Speaker' },
                    { layout: 'sidebar' as const, icon: <PanelRight size={16} />, label: 'Sidebar' },
                  ]).map(({ layout, icon, label }) => (
                    <motion.button
                      key={layout}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { onSetGridLayout(layout); toast(`Switched to ${label} view`); }}
                      className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                        gridLayout === layout
                          ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500/30'
                          : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
                      }`}
                    >
                      {icon}
                      {gridLayout === layout && (
                        <motion.div
                          layoutId="layout-active-indicator"
                          className="absolute inset-0 rounded-lg bg-emerald-500/15 border border-emerald-500/30"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-slate-800/95 backdrop-blur-xl text-white border-white/10 text-xs rounded-lg">
                Switch layout
              </TooltipContent>
            </Tooltip>

            <div className="w-px h-8 bg-white/10 mx-0.5" />

            {/* More menu (desktop) */}
            <div className="relative">
              <ToolbarButton
                icon={<MoreHorizontal size={20} />}
                label="More"
                onClick={() => setShowMoreMenu(!showMoreMenu)}
              />
              <AnimatePresence>
                {showMoreMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
                  >
                    {/* Other options */}
                    <div className="p-1.5">
                      <p className="text-[10px] uppercase tracking-wider text-white/40 px-3 py-1.5 font-semibold">Tools</p>
                      <button onClick={() => { onToggleSidebar('polls'); setShowMoreMenu(false); onOpenPollBuilder(); }} className="w-full px-3 py-2 text-left text-sm rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5">
                        <Plus size={16} /> Create Poll
                      </button>
                      <button onClick={() => { setShowMoreMenu(false); toast('Whiteboard coming soon!'); }} className="w-full px-3 py-2 text-left text-sm rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5">
                        <Pen size={16} /> Whiteboard
                      </button>
                      <button onClick={() => { onToggleSidebar('breakout'); setShowMoreMenu(false); }} className="w-full px-3 py-2 text-left text-sm rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5">
                        <LayoutGrid size={16} /> Breakout Rooms
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Mobile: More button (triggers same menu) ── */}
          <div className="md:hidden relative" ref={mobileMenuRef}>
            <ToolbarButton
              icon={<MoreHorizontal size={20} />}
              label="More"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
            />
            <AnimatePresence>
              {showMoreMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute bottom-full right-0 mb-2 w-52 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
                >
                  {/* Media controls */}
                  <div className="p-1.5 border-b border-white/10">
                    <p className="text-[10px] uppercase tracking-wider text-white/40 px-3 py-1.5 font-semibold">Media</p>
                    <button onClick={() => { onToggleScreenShare(); setShowMoreMenu(false); }} className="w-full px-3 py-2 text-left text-sm rounded-lg flex items-center gap-2.5 text-white/70 hover:bg-white/5 hover:text-white transition-colors">
                      {screenSharing ? <MonitorOff size={16} /> : <Monitor size={16} />}
                      {screenSharing ? 'Stop Sharing' : 'Share Screen'}
                    </button>
                    <button onClick={() => { onToggleHand(); setShowMoreMenu(false); }} className="w-full px-3 py-2 text-left text-sm rounded-lg flex items-center gap-2.5 text-white/70 hover:bg-white/5 hover:text-white transition-colors">
                      <Hand size={16} />
                      {handRaised ? 'Lower Hand' : 'Raise Hand'}
                    </button>
                    <button onClick={() => { onToggleRecording(); setShowMoreMenu(false); }} className="w-full px-3 py-2 text-left text-sm rounded-lg flex items-center gap-2.5 text-white/70 hover:bg-white/5 hover:text-white transition-colors">
                      <CircleDot size={16} className={isRecording ? 'text-red-400' : ''} />
                      {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </button>
                  </div>
                  {/* Sidebar panels */}
                  <div className="p-1.5 border-b border-white/10">
                    <p className="text-[10px] uppercase tracking-wider text-white/40 px-3 py-1.5 font-semibold">Panels</p>
                    {([
                      { tab: 'chat' as const, icon: <MessageSquare size={16} />, label: 'Chat' },
                      { tab: 'participants' as const, icon: <Users size={16} />, label: 'Participants' },
                      { tab: 'ai' as const, icon: <Sparkles size={16} />, label: 'AI Assistant' },
                    ]).map(item => (
                      <button
                        key={item.tab}
                        onClick={() => { onToggleSidebar(item.tab); setShowMoreMenu(false); }}
                        className={`w-full px-3 py-2 text-left text-sm rounded-lg flex items-center gap-2.5 transition-colors ${
                          meetingSidebarTab === item.tab && sidebarOpen ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {item.icon}
                        {item.label}
                        {meetingSidebarTab === item.tab && sidebarOpen && <Check size={14} className="ml-auto text-emerald-400" />}
                      </button>
                    ))}
                    <button onClick={() => { onToggleCaptions(); setShowMoreMenu(false); }} className={`w-full px-3 py-2 text-left text-sm rounded-lg flex items-center gap-2.5 transition-colors ${captionsVisible ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
                      <Subtitles size={16} /> {captionsVisible ? 'Hide' : 'Show'} Captions
                    </button>
                    <button onClick={() => { onToggleTranscription(); setShowMoreMenu(false); }} className={`w-full px-3 py-2 text-left text-sm rounded-lg flex items-center gap-2.5 transition-colors ${transcriptionOpen ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
                      <FileText size={16} /> {transcriptionOpen ? 'Hide' : 'Live'} Transcription
                    </button>
                    <button onClick={() => { onToggleWaitingRoom(); setShowMoreMenu(false); }} className={`w-full px-3 py-2 text-left text-sm rounded-lg flex items-center gap-2.5 transition-colors ${waitingRoomOpen ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
                      {waitingRoomNotification ? <BellRing size={16} className="text-amber-400" /> : <DoorOpen size={16} />}
                      Waiting Room
                      {waitingRoomCount > 0 && (
                        <span className="ml-auto min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white px-1">{waitingRoomCount}</span>
                      )}
                    </button>
                  </div>
                  {/* Security */}
                  <div className="p-1.5 border-b border-white/10">
                    <p className="text-[10px] uppercase tracking-wider text-white/40 px-3 py-1.5 font-semibold">Security</p>
                    <button onClick={() => { onToggleMeetingLock(); setShowMoreMenu(false); }} className={`w-full px-3 py-2 text-left text-sm rounded-lg flex items-center gap-2.5 transition-colors ${meetingLocked ? 'bg-amber-500/10 text-amber-300' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
                      {meetingLocked ? <Lock size={16} /> : <LockOpen size={16} />}
                      {meetingLocked ? 'Unlock Meeting' : 'Lock Meeting'}
                    </button>
                  </div>
                  {/* Tools */}
                  <div className="p-1.5 border-b border-white/10">
                    <p className="text-[10px] uppercase tracking-wider text-white/40 px-3 py-1.5 font-semibold">Tools</p>
                    <button onClick={() => { onOpenVirtualBg(); setShowMoreMenu(false); }} className="w-full px-3 py-2 text-left text-sm rounded-lg flex items-center gap-2.5 text-white/70 hover:bg-white/5 hover:text-white transition-colors">
                      <ImageIcon size={16} /> Virtual Background
                    </button>
                    <button onClick={() => { onToggleEnhancedReactions(); setShowMoreMenu(false); }} className="w-full px-3 py-2 text-left text-sm rounded-lg flex items-center gap-2.5 text-white/70 hover:bg-white/5 hover:text-white transition-colors">
                      <SmilePlus size={16} /> Reactions
                    </button>
                    <button onClick={() => { onOpenPollBuilder(); setShowMoreMenu(false); }} className="w-full px-3 py-2 text-left text-sm rounded-lg flex items-center gap-2.5 text-white/70 hover:bg-white/5 hover:text-white transition-colors">
                      <Plus size={16} /> Create Poll
                    </button>
                    <button onClick={() => { onToggleSidebar('breakout'); setShowMoreMenu(false); }} className="w-full px-3 py-2 text-left text-sm rounded-lg flex items-center gap-2.5 text-white/70 hover:bg-white/5 hover:text-white transition-colors">
                      <LayoutGrid size={16} /> Breakout Rooms
                    </button>
                  </div>
                  {/* Layout */}
                  <div className="p-1.5">
                    <p className="text-[10px] uppercase tracking-wider text-white/40 px-3 py-1.5 font-semibold">Layout</p>
                    {([
                      { layout: 'gallery' as const, icon: <LayoutGrid size={16} />, label: 'Gallery' },
                      { layout: 'speaker' as const, icon: <User size={16} />, label: 'Speaker' },
                      { layout: 'sidebar' as const, icon: <PanelRight size={16} />, label: 'Sidebar' },
                    ]).map(({ layout, icon, label }) => (
                      <button
                        key={layout}
                        onClick={() => { onSetGridLayout(layout); setShowMoreMenu(false); toast(`Switched to ${label} view`); }}
                        className={`w-full px-3 py-2 text-left text-sm rounded-lg flex items-center gap-2.5 transition-colors ${
                          gridLayout === layout ? 'bg-emerald-500/10 text-emerald-300' : 'text-white/70 hover:bg-white/5'
                        }`}
                      >
                        {icon}
                        {label}
                        {gridLayout === layout && <Check size={14} className="ml-auto text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Lock Meeting */}
          <div className="hidden md:block">
            <ToolbarButton
              active={meetingLocked}
              icon={meetingLocked ? <Lock size={20} /> : <LockOpen size={20} />}
              label={meetingLocked ? 'Unlock Meeting' : 'Lock Meeting'}
              onClick={onToggleMeetingLock}
              glowColor={meetingLocked ? 'amber' : undefined}
            />
          </div>

          {/* Separator */}
          <div className="w-px h-8 bg-white/10 mx-0.5" />

          {/* Leave Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onLeaveMeeting}
                className="h-10 sm:h-11 px-4 sm:px-5 rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white flex items-center gap-2 text-sm font-medium transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/40"
              >
                <Phone size={18} className="rotate-[135deg]" />
                <span className="hidden sm:inline">Leave</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-slate-800 text-white border-slate-700 text-xs">Leave meeting</TooltipContent>
          </Tooltip>
        </motion.div>
      </div>
    </>
  );
}
