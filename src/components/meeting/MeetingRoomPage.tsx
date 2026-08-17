'use client';

import { useAppStore } from '@/store/app-store';
import { useMeetingRoom } from '@/hooks/useMeetingRoom';
import { motion, AnimatePresence } from 'framer-motion';
import { TooltipProvider } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import PollBuilder, { PollConfig } from '@/components/shared/PollBuilder';
import VirtualBackgrounds, { VirtualBgOption } from '@/components/shared/VirtualBackgrounds';
import LiveTranscriptionPanel from '@/components/shared/LiveTranscriptionPanel';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Sub-components
import MeetingHeader from './parts/MeetingHeader';
import VideoGrid from './parts/VideoGrid';
import MeetingToolbar from './parts/MeetingToolbar';
import MeetingSidebar from './parts/MeetingSidebar';

// Shared data / helpers
import {
  type FloatingReaction,
  mockParticipants,
  wsMsgToLocal,
  wsPollToLocal,
} from './parts/meeting-data';

// ─── Floating Reaction Emoji ──────────────────────────────────
function FloatingReactionEmoji({ emoji, x, onDone }: { emoji: string; x: number; onDone: () => void }) {
  return (
    <motion.div
      className="fixed bottom-32 text-4xl pointer-events-none z-[100]"
      style={{ left: x }}
      initial={{ y: 0, opacity: 1, scale: 0.5 }}
      animate={{ y: -200, opacity: 0, scale: 1.2 }}
      transition={{ duration: 2, ease: 'easeOut' as const }}
      onAnimationComplete={onDone}
    >
      {emoji}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function MeetingRoomPage() {
  const {
    meetingTitle, setMeetingTitle, meetingSidebarTab, setMeetingSidebarTab,
    setCurrentView, currentMeetingId, user
  } = useAppStore();

  // ── Real-time meeting room WebSocket ─────────────────────────
  const meetingId = currentMeetingId || 'alv-mtg-001';
  const {
    status: wsStatus,
    chatMessages: wsChatMessages,
    typingUsers: wsTypingUsers,
    handRaisedUsers: wsHandRaisedUsers,
    polls: wsPolls,
    currentCaption: wsCaption,
    sendMessage: wsSendMessage,
    setTyping: wsSetTyping,
    sendReaction: wsSendReaction,
    raiseHand: wsRaiseHand,
    lowerHand: wsLowerHand,
    createPoll: wsCreatePoll,
    votePoll: wsVotePoll,
    disconnect: wsDisconnect,
    setOnReaction,
  } = useMeetingRoom({
    meetingId,
    userId: user?.id || 'local-user',
    userName: user?.name || 'You',
  });

  // --- Shared State ---
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gridLayout, setGridLayout] = useState<'grid' | 'speaker' | 'gallery'>('grid');
  const [pinnedParticipant, setPinnedParticipant] = useState<string | null>(null);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [captionsVisible, setCaptionsVisible] = useState(true);
  const [transcriptionOpen, setTranscriptionOpen] = useState(false);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [enhancedReactionsOpen, setEnhancedReactionsOpen] = useState(false);
  const [virtualBgOpen, setVirtualBgOpen] = useState(false);
  const [virtualBg, setVirtualBg] = useState<string>('none');
  const [pollBuilderOpen, setPollBuilderOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const captionKey = useMemo(() => Date.now(), [wsCaption]);

  const meetingContainerRef = useRef<HTMLDivElement>(null);

  // ── Derive display state from WebSocket ───────────────────────
  const chatMessages = useMemo(() => wsChatMessages.map(wsMsgToLocal), [wsChatMessages]);
  const typingUserNames = useMemo(() => {
    return wsTypingUsers.map(uid => {
      const p = mockParticipants.find(mp => mp.id === uid);
      if (p) return p.name;
      const msg = wsChatMessages.find(m => m.senderId === uid);
      return msg?.senderName || uid;
    });
  }, [wsTypingUsers, wsChatMessages]);
  const displayPolls = useMemo(() => wsPolls.map(wsPollToLocal), [wsPolls]);
  const displayCaption = useMemo(() => wsCaption, [wsCaption]);

  // ── Handle incoming reactions for floating UI ──────────────────
  const handleIncomingReaction = useCallback((data: { userId: string; userName: string; emoji: string }) => {
    const id = `reaction-${Date.now()}-${Math.random()}`;
    const x = 150 + Math.random() * (window.innerWidth - 300);
    setFloatingReactions(prev => [...prev, { id, emoji: data.emoji, x }]);
    setReactionCounts(prev => ({ ...prev, [data.emoji]: (prev[data.emoji] || 0) + 1 }));
  }, []);

  useEffect(() => { setOnReaction(handleIncomingReaction); }, [handleIncomingReaction, setOnReaction]);

  // --- Timers ---
  useEffect(() => {
    const interval = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // --- Helpers ---
  const removeReaction = useCallback((id: string) => {
    setFloatingReactions(prev => prev.filter(r => r.id !== id));
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // --- Handlers ---
  const handleToggleFullscreen = () => {
    if (!meetingContainerRef.current) return;
    if (!document.fullscreenElement) {
      meetingContainerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const handleSendReaction = (emoji: string) => {
    wsSendReaction(emoji);
    const id = `reaction-${Date.now()}-${Math.random()}`;
    const x = 100 + Math.random() * (window.innerWidth - 200);
    setFloatingReactions(prev => [...prev, { id, emoji, x }]);
    setEnhancedReactionsOpen(false);
    setReactionCounts(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
  };

  const handleLeaveMeeting = () => {
    wsDisconnect();
    toast.success('You left the meeting');
    setCurrentView('dashboard');
  };

  const toggleSidebar = (tab?: 'chat' | 'participants' | 'ai' | 'polls' | 'breakout') => {
    if (tab && sidebarOpen && meetingSidebarTab === tab) setSidebarOpen(false);
    else if (tab) { setMeetingSidebarTab(tab); setSidebarOpen(true); }
    else setSidebarOpen(prev => !prev);
  };

  const handleTogglePin = (id: string) => {
    setPinnedParticipant(prev => prev === id ? null : id);
    toast(pinnedParticipant === id ? 'Unpinned participant' : 'Pinned participant');
  };

  const handleToggleHand = () => {
    if (handRaised) { wsLowerHand(); setHandRaised(false); toast('Hand lowered'); }
    else { wsRaiseHand(); setHandRaised(true); toast('\u{1F64B} Hand raised'); }
  };

  const handleCreatePoll = (config: PollConfig) => {
    wsCreatePoll(config.question, config.options);
    toast.success(`Poll "${config.question}" created with ${config.options.length} options`);
  };

  const handleApplyVirtualBg = (bg: VirtualBgOption) => setVirtualBg(bg.id);

  // --- Derived display data ---
  const displayParticipants = useMemo(() => {
    if (pinnedParticipant && gridLayout === 'speaker') {
      const pinned = mockParticipants.find(p => p.id === pinnedParticipant);
      const others = mockParticipants.filter(p => p.id !== pinnedParticipant);
      return pinned ? [pinned, ...others.slice(0, 5)] : mockParticipants.slice(0, 6);
    }
    if (gridLayout === 'speaker') return [mockParticipants[0], ...mockParticipants.slice(1, 6)];
    if (gridLayout === 'gallery') return mockParticipants;
    return mockParticipants.slice(0, 4);
  }, [gridLayout, pinnedParticipant]);

  const effectiveHandRaisedIds = useMemo(() => {
    const ids = new Set(wsHandRaisedUsers);
    if (handRaised) ids.add(user?.id || 'local-user');
    return ids;
  }, [wsHandRaisedUsers, handRaised, user?.id]);

  const onlineCount = mockParticipants.filter(p => p.online !== false).length;

  // ─── Render ─────────────────────────────────────────────────
  return (
    <>
    <TooltipProvider delayDuration={200}>
    <div ref={meetingContainerRef} className="h-screen w-screen flex bg-slate-950 text-white overflow-hidden">

      {/* Floating Reactions Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[100]">
        <AnimatePresence>
          {floatingReactions.map(r => (
            <FloatingReactionEmoji key={r.id} emoji={r.emoji} x={r.x} onDone={() => removeReaction(r.id)} />
          ))}
        </AnimatePresence>
      </div>

      {/* Main Meeting Area */}
      <div className="flex-1 relative flex flex-col min-w-0">
        {/* ALVISION Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <span className="text-[10rem] sm:text-[12rem] font-black text-white/[0.02] tracking-[0.3em] select-none">ALVISION</span>
        </div>

        <MeetingHeader
          meetingTitle={meetingTitle || 'Sprint Planning - Q4'}
          onSetTitle={setMeetingTitle}
          onGoBack={() => setCurrentView('dashboard')}
          wsStatus={wsStatus}
          isRecording={isRecording}
          recordingTime={recordingTime}
          elapsed={elapsed}
          meetingId={currentMeetingId || 'alv-mtg-001'}
          onlineCount={onlineCount}
          totalCount={mockParticipants.length}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          formatTime={formatTime}
        />

        <VideoGrid
          displayParticipants={displayParticipants}
          gridLayout={gridLayout}
          pinnedParticipant={pinnedParticipant}
          effectiveHandRaisedIds={effectiveHandRaisedIds}
          captionsVisible={captionsVisible}
          displayCaption={displayCaption}
          captionKey={captionKey}
          onTogglePin={handleTogglePin}
        />

        <MeetingToolbar
          micOn={micOn} cameraOn={cameraOn} screenSharing={screenSharing}
          handRaised={handRaised} isRecording={isRecording}
          captionsVisible={captionsVisible} transcriptionOpen={transcriptionOpen}
          virtualBgActive={virtualBg !== 'none'} gridLayout={gridLayout}
          meetingSidebarTab={meetingSidebarTab} sidebarOpen={sidebarOpen}
          reactionCounts={reactionCounts} enhancedReactionsOpen={enhancedReactionsOpen}
          onToggleMic={() => setMicOn(!micOn)}
          onToggleCamera={() => setCameraOn(!cameraOn)}
          onToggleScreenShare={() => { setScreenSharing(!screenSharing); toast(screenSharing ? 'Screen sharing stopped' : 'Screen sharing started'); }}
          onToggleHand={handleToggleHand}
          onToggleRecording={() => { const next = !isRecording; if (!next) setRecordingTime(0); setIsRecording(next); toast(next ? 'Recording started' : 'Recording stopped'); }}
          onToggleCaptions={() => setCaptionsVisible(!captionsVisible)}
          onToggleTranscription={() => setTranscriptionOpen(!transcriptionOpen)}
          onOpenVirtualBg={() => setVirtualBgOpen(true)}
          onToggleSidebar={toggleSidebar}
          onSendReaction={handleSendReaction}
          onToggleEnhancedReactions={() => setEnhancedReactionsOpen(!enhancedReactionsOpen)}
          onSetGridLayout={setGridLayout}
          onOpenPollBuilder={() => setPollBuilderOpen(true)}
          onLeaveMeeting={handleLeaveMeeting}
        />
      </div>

      {/* Right Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <MeetingSidebar
            activeTab={meetingSidebarTab}
            onTabChange={setMeetingSidebarTab}
            onClose={() => setSidebarOpen(false)}
            chatMessages={chatMessages}
            typingUserNames={typingUserNames}
            onSendMessage={wsSendMessage}
            onSetTyping={wsSetTyping}
            effectiveHandRaisedIds={effectiveHandRaisedIds}
            onlineCount={onlineCount}
            userName={user?.name || 'You'}
            displayPolls={displayPolls}
            onVotePoll={wsVotePoll}
            onCreatePoll={handleCreatePoll}
            onOpenPollBuilder={() => setPollBuilderOpen(true)}
          />
        )}
      </AnimatePresence>
    </div>
    </TooltipProvider>

    {/* External Overlays */}
    <AnimatePresence>
      {transcriptionOpen && <LiveTranscriptionPanel />}
    </AnimatePresence>
    <PollBuilder open={pollBuilderOpen} onOpenChange={setPollBuilderOpen} onCreatePoll={handleCreatePoll} />
    <VirtualBackgrounds open={virtualBgOpen} onOpenChange={setVirtualBgOpen} selectedId={virtualBg} onApply={handleApplyVirtualBg} />
    </>
  );
}
