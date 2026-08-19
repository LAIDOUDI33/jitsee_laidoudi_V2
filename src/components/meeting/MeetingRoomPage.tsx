'use client';

import { useAppStore } from '@/store/app-store';
import { useMeetingRoom } from '@/hooks/useMeetingRoom';
import { useWebRTC } from '@/hooks/useWebRTC';
import { motion, AnimatePresence } from 'framer-motion';
import { TooltipProvider } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import PollBuilder, { PollConfig } from '@/components/shared/PollBuilder';
import VirtualBackgrounds, { VirtualBgOption } from '@/components/shared/VirtualBackgrounds';
import LiveTranscriptionPanel from '@/components/shared/LiveTranscriptionPanel';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Wifi, Loader2 } from 'lucide-react';

// Sub-components
import MeetingHeader from './parts/MeetingHeader';
import VideoGrid from './parts/VideoGrid';
import MeetingToolbar from './parts/MeetingToolbar';
import MeetingSidebar from './parts/MeetingSidebar';
import ReactionsBar from './parts/ReactionsBar';
import WaitingRoom from './parts/WaitingRoom';
import VirtualBackgroundSelector from '@/components/shared/VirtualBgSelector';
import PreJoinPreview from './PreJoinPreview';
import PostMeetingSummary from './PostMeetingSummary';
import EndMeetingDialog from './EndMeetingDialog';

// Shared data / helpers
import {
  type Participant,
  type FloatingReaction,
  mockParticipants,
  wsMsgToLocal,
  wsPollToLocal,
  nameToColor,
  nameToInitials,
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

// ─── WebRTC Connection Indicator ──────────────────────────────
function WebRTCIndicator({ state }: { state: string }) {
  if (state === 'disconnected') return null;
  const isConnecting = state === 'connecting';
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium border ${
      isConnecting
        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    }`}>
      {isConnecting
        ? <Loader2 size={11} className="animate-spin" />
        : <Wifi size={11} />
      }
      <span>{isConnecting ? 'Connecting…' : 'P2P'}</span>
    </div>
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
  const userId = user?.id || 'local-user';
  const userName = user?.name || 'You';

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
    updateMediaState: wsUpdateMediaState,
  } = useMeetingRoom({ meetingId, userId, userName });

  // --- Flow state ---
  const [preJoinComplete, setPreJoinComplete] = useState(false);
  const [showPostMeeting, setShowPostMeeting] = useState(false);
  const [endMeetingDialogOpen, setEndMeetingDialogOpen] = useState(false);

  // ── WebRTC hook ───────────────────────────────────────────────
  const {
    localStream,
    remoteParticipants: webrtcRemoteParticipants,
    mediaState: webrtcMediaState,
    connectionState: webrtcConnectionState,
    stats: webrtcStats,
    toggleAudio: webrtcToggleAudio,
    toggleVideo: webrtcToggleVideo,
    toggleScreenShare: webrtcToggleScreenShare,
    disconnect: webrtcDisconnect,
  } = useWebRTC({
    meetingId,
    userId,
    userName,
    enabled: preJoinComplete,
  });

  // --- Shared State ---
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
  const [showWaitingRoom, setShowWaitingRoom] = useState(false);
  const [bgSelectorOpen, setBgSelectorOpen] = useState(false);
  const [pollBuilderOpen, setPollBuilderOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const captionKey = useMemo(() => Date.now(), [wsCaption]);

  const meetingContainerRef = useRef<HTMLDivElement>(null);

  // Derive mic/camera/screen state from WebRTC
  const micOn = webrtcMediaState.audio;
  const cameraOn = webrtcMediaState.video;
  const screenSharing = webrtcMediaState.screen;

  // Build remote streams map for VideoGrid
  const remoteStreams = useMemo(() => {
    const map = new Map<string, MediaStream>();
    for (const [id, rp] of webrtcRemoteParticipants) {
      if (rp.stream) map.set(id, rp.stream);
    }
    return map;
  }, [webrtcRemoteParticipants]);

  // Whether WebRTC has real remote participants
  const hasRemoteParticipants = webrtcRemoteParticipants.size > 0 &&
    (webrtcConnectionState === 'connected' || webrtcConnectionState === 'connecting');

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

  // ── Build local participant object ────────────────────────────
  const localParticipant = useMemo((): Participant => ({
    id: userId,
    name: userName,
    initials: nameToInitials(userName),
    color: nameToColor(userName),
    role: 'Host',
    micOn,
    videoOn: cameraOn,
    online: true,
    isLocal: true,
  }), [userId, userName, micOn, cameraOn]);

  // ── Map WebRTC remote participants to display Participants ────
  const remoteParticipantList = useMemo((): Participant[] => {
    const list: Participant[] = [];
    for (const [, rp] of webrtcRemoteParticipants) {
      list.push({
        id: rp.id,
        name: rp.name,
        initials: nameToInitials(rp.name),
        color: nameToColor(rp.name),
        role: 'Participant',
        micOn: rp.micOn,
        videoOn: rp.videoOn,
        online: true,
        isLocal: false,
      });
    }
    return list;
  }, [webrtcRemoteParticipants]);

  // --- Derived display data ---
  const displayParticipants = useMemo(() => {
    // Use real WebRTC participants when available
    if (hasRemoteParticipants) {
      const all: Participant[] = [localParticipant, ...remoteParticipantList];
      if (pinnedParticipant && gridLayout === 'speaker') {
        const pinned = all.find(p => p.id === pinnedParticipant);
        const others = all.filter(p => p.id !== pinnedParticipant);
        return pinned ? [pinned, ...others.slice(0, 5)] : all.slice(0, 6);
      }
      if (gridLayout === 'speaker') return all.slice(0, 6);
      if (gridLayout === 'gallery') return all;
      return all.slice(0, 4);
    }

    // Fallback: mock participants (demo mode)
    // Replace the first mock participant with the local user if local stream exists
    if (localStream) {
      const withLocal = [localParticipant, ...mockParticipants];
      if (pinnedParticipant && gridLayout === 'speaker') {
        const pinned = withLocal.find(p => p.id === pinnedParticipant);
        const others = withLocal.filter(p => p.id !== pinnedParticipant);
        return pinned ? [pinned, ...others.slice(0, 5)] : withLocal.slice(0, 6);
      }
      if (gridLayout === 'speaker') return [withLocal[0], ...withLocal.slice(1, 6)];
      if (gridLayout === 'gallery') return withLocal;
      return withLocal.slice(0, 4);
    }

    // Pure fallback (no WebRTC at all)
    if (pinnedParticipant && gridLayout === 'speaker') {
      const pinned = mockParticipants.find(p => p.id === pinnedParticipant);
      const others = mockParticipants.filter(p => p.id !== pinnedParticipant);
      return pinned ? [pinned, ...others.slice(0, 5)] : mockParticipants.slice(0, 6);
    }
    if (gridLayout === 'speaker') return [mockParticipants[0], ...mockParticipants.slice(1, 6)];
    if (gridLayout === 'gallery') return mockParticipants;
    return mockParticipants.slice(0, 4);
  }, [hasRemoteParticipants, localParticipant, remoteParticipantList, localStream, gridLayout, pinnedParticipant]);

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
    setEndMeetingDialogOpen(true);
  };

  const handleDialogLeave = () => {
    webrtcDisconnect();
    wsDisconnect();
    toast.success('You left the meeting');
    setShowPostMeeting(true);
  };

  const handleEndForAll = () => {
    webrtcDisconnect();
    wsDisconnect();
    toast('Meeting ended for all participants');
    setShowPostMeeting(true);
  };

  const toggleSidebar = (tab?: 'chat' | 'participants' | 'ai' | 'polls' | 'breakout' | 'transcription' | 'translation') => {
    if (tab && sidebarOpen && meetingSidebarTab === tab) setSidebarOpen(false);
    else if (tab) { setMeetingSidebarTab(tab); setSidebarOpen(true); }
    else setSidebarOpen(prev => !prev);
  };

  const handleTogglePin = (id: string) => {
    setPinnedParticipant(prev => prev === id ? null : id);
    toast(pinnedParticipant === id ? 'Unpinned participant' : 'Pinned participant');
  };

  const handleToggleHand = useCallback(() => {
    if (handRaised) { wsLowerHand(); setHandRaised(false); toast('Hand lowered'); }
    else { wsRaiseHand(); setHandRaised(true); wsSendMessage(`✋ ${userName} raised their hand`); toast('\u{1F64B} Hand raised'); }
  }, [handRaised, wsLowerHand, wsRaiseHand, wsSendMessage, userName]);

  const handleCreatePoll = (config: PollConfig) => {
    wsCreatePoll(config.question, config.options);
    toast.success(`Poll "${config.question}" created with ${config.options.length} options`);
  };

  const handleApplyVirtualBg = (bg: VirtualBgOption) => setVirtualBg(bg.id);

  // Media toggle handlers — WebRTC + WS media state broadcast
  const handleToggleMic = useCallback(async () => {
    await webrtcToggleAudio();
    wsUpdateMediaState(!micOn, cameraOn);
  }, [webrtcToggleAudio, wsUpdateMediaState, micOn, cameraOn]);

  const handleToggleCamera = useCallback(async () => {
    await webrtcToggleVideo();
    wsUpdateMediaState(micOn, !cameraOn);
  }, [webrtcToggleVideo, wsUpdateMediaState, micOn, cameraOn]);

  const handleToggleScreenShare = useCallback(async () => {
    await webrtcToggleScreenShare();
    toast(screenSharing ? 'Screen sharing stopped' : 'Screen sharing started');
  }, [webrtcToggleScreenShare, screenSharing]);

  const effectiveHandRaisedIds = useMemo(() => {
    const ids = new Set(wsHandRaisedUsers);
    if (handRaised) ids.add(userId);
    return ids;
  }, [wsHandRaisedUsers, handRaised, userId]);

  const onlineCount = hasRemoteParticipants
    ? webrtcRemoteParticipants.size + 1
    : mockParticipants.filter(p => p.online !== false).length;

  const totalCount = hasRemoteParticipants
    ? webrtcRemoteParticipants.size + 1
    : mockParticipants.length;

  // ─── Render ─────────────────────────────────────────────────

  // Pre-join screen
  if (!preJoinComplete) {
    return (
      <PreJoinPreview
        meetingTitle={meetingTitle || 'Sprint Planning - Q4'}
        meetingId={meetingId}
        onJoin={() => setPreJoinComplete(true)}
        onCancel={() => setCurrentView('dashboard')}
      />
    );
  }

  // Post-meeting summary
  if (showPostMeeting) {
    return (
      <PostMeetingSummary
        meetingTitle={meetingTitle || 'Sprint Planning - Q4'}
        duration={elapsed}
        participantCount={displayParticipants.length}
        onBackToDashboard={() => setCurrentView('dashboard')}
      />
    );
  }

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
          meetingId={meetingId}
          onlineCount={onlineCount}
          totalCount={totalCount}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          formatTime={formatTime}
        />

        {/* WebRTC Connection Indicator */}
        {localStream && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30">
            <WebRTCIndicator state={webrtcConnectionState} />
          </div>
        )}

        <VideoGrid
          displayParticipants={displayParticipants}
          gridLayout={gridLayout}
          pinnedParticipant={pinnedParticipant}
          effectiveHandRaisedIds={effectiveHandRaisedIds}
          captionsVisible={captionsVisible}
          displayCaption={displayCaption}
          captionKey={captionKey}
          onTogglePin={handleTogglePin}
          localStream={localStream}
          remoteStreams={remoteStreams}
          localAudioLevel={webrtcStats.localAudioLevel}
          webrtcStats={webrtcStats}
          virtualBg={virtualBg}
        />

        <MeetingToolbar
          micOn={micOn} cameraOn={cameraOn} screenSharing={screenSharing}
          handRaised={handRaised} isRecording={isRecording}
          captionsVisible={captionsVisible} transcriptionOpen={transcriptionOpen}
          virtualBgActive={virtualBg !== 'none'} gridLayout={gridLayout}
          meetingSidebarTab={meetingSidebarTab} sidebarOpen={sidebarOpen}
          reactionCounts={reactionCounts} enhancedReactionsOpen={enhancedReactionsOpen}
          onToggleMic={handleToggleMic}
          onToggleCamera={handleToggleCamera}
          onToggleScreenShare={handleToggleScreenShare}
          onToggleHand={handleToggleHand}
          onToggleRecording={() => { const next = !isRecording; if (!next) setRecordingTime(0); setIsRecording(next); toast(next ? 'Recording started' : 'Recording stopped'); }}
          onToggleCaptions={() => setCaptionsVisible(!captionsVisible)}
          onToggleTranscription={() => setTranscriptionOpen(!transcriptionOpen)}
          onOpenVirtualBg={() => setBgSelectorOpen(true)}
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
            userName={userName}
            displayPolls={displayPolls}
            onVotePoll={wsVotePoll}
            onCreatePoll={handleCreatePoll}
            onOpenPollBuilder={() => setPollBuilderOpen(true)}
          />
        )}
      </AnimatePresence>
    </div>
    </TooltipProvider>

    {/* Reactions floating bar */}
    <ReactionsBar
      handRaised={handRaised}
      onSendReaction={handleSendReaction}
      onToggleHand={handleToggleHand}
    />

    {/* External Overlays */}
    <AnimatePresence>
      {transcriptionOpen && <LiveTranscriptionPanel />}
    </AnimatePresence>
    <PollBuilder open={pollBuilderOpen} onOpenChange={setPollBuilderOpen} onCreatePoll={handleCreatePoll} />
    <VirtualBackgrounds open={virtualBgOpen} onOpenChange={setVirtualBgOpen} selectedId={virtualBg} onApply={handleApplyVirtualBg} />

    {/* Waiting Room Overlay */}
    <AnimatePresence>
      {showWaitingRoom && (
        <WaitingRoom
          meetingTitle={meetingTitle || 'Sprint Planning - Q4'}
          hostName={'Meeting Host'}
          onLeave={() => {
            setShowWaitingRoom(false);
            handleLeaveMeeting();
          }}
        />
      )}
    </AnimatePresence>

    {/* Virtual Background Selector Popover (toolbar-level) */}
    <VirtualBackgroundSelector
      open={bgSelectorOpen}
      onOpenChange={setBgSelectorOpen}
      selectedBg={virtualBg}
      onSelect={(bgId) => {
        setVirtualBg(bgId);
        setBgSelectorOpen(false);
      }}
    />

    {/* End Meeting Dialog */}
    <EndMeetingDialog
      open={endMeetingDialogOpen}
      onOpenChange={setEndMeetingDialogOpen}
      onLeave={handleDialogLeave}
      onEndForAll={handleEndForAll}
      isHost={localParticipant.role === 'Host'}
    />
    </>
  );
}
