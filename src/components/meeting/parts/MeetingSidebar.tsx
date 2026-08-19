'use client';

import { X, BarChart3, Mic, Languages } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MeetingChat from './MeetingChat';
import ParticipantList from './ParticipantList';
import MeetingAIPanel from './MeetingAIPanel';
import PollsPanel from './PollsPanel';
import BreakoutRoomsPanel from './BreakoutRoomsPanel';
import TranscriptionPanel from './TranscriptionPanel';
import TranslationPanel from './TranslationPanel';
import { type ChatMessage, type PollData, type ParticipantPermissions } from './meeting-data';

// ─── Props ─────────────────────────────────────────────────────
export interface MeetingSidebarProps {
  activeTab: string;
  onTabChange: (tab: 'chat' | 'participants' | 'ai' | 'polls' | 'breakout' | 'transcription' | 'translation') => void;
  onClose: () => void;
  chatMessages: ChatMessage[];
  typingUserNames: string[];
  onSendMessage: (content: string) => void;
  onSetTyping: (isTyping: boolean) => void;
  effectiveHandRaisedIds: Set<string>;
  onlineCount: number;
  userName: string;
  displayPolls: PollData[];
  onVotePoll: (pollId: string, optionLabel: string) => void;
  onCreatePoll: (config: { question: string; options: string[] }) => void;
  onOpenPollBuilder: () => void;
  spotlightedParticipant: string | null;
  onSpotlightChange: (id: string | null) => void;
  cohosts: Set<string>;
  onCohostToggle: (id: string) => void;
  onMuteAll: () => void;
  participantPermissions: Record<string, ParticipantPermissions>;
  onPermissionsChange: (id: string, perms: ParticipantPermissions) => void;
  isHost: boolean;
}

// ─── Component ─────────────────────────────────────────────────
export default function MeetingSidebar({
  activeTab,
  onTabChange,
  onClose,
  chatMessages,
  typingUserNames,
  onSendMessage,
  onSetTyping,
  effectiveHandRaisedIds,
  onlineCount,
  userName,
  displayPolls,
  onVotePoll,
  onCreatePoll,
  onOpenPollBuilder,
  spotlightedParticipant,
  onSpotlightChange,
  cohosts,
  onCohostToggle,
  onMuteAll,
  participantPermissions,
  onPermissionsChange,
  isHost,
}: MeetingSidebarProps) {
  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className="h-full w-[360px] sm:w-[384px] bg-slate-950/80 backdrop-blur-2xl border-l border-white/10 flex flex-col overflow-hidden shrink-0 max-sm:absolute max-sm:right-0 max-sm:z-40"
    >
      {/* Sidebar Header */}
      <div className="border-b border-white/10 bg-white/[0.03] backdrop-blur-xl px-2 pt-2">
        <div className="flex items-center justify-between mb-2">
          <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as 'chat' | 'participants' | 'ai' | 'polls' | 'breakout' | 'transcription' | 'translation')} className="w-full">
            <TabsList className="bg-white/5 w-full h-9 rounded-xl">
              <TabsTrigger value="chat" className="flex-1 text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg">Chat</TabsTrigger>
              <TabsTrigger value="participants" className="flex-1 text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg">People</TabsTrigger>
              <TabsTrigger value="ai" className="flex-1 text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg">AI</TabsTrigger>
              <TabsTrigger value="transcription" className="flex-1 text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg" title="Transcription"><Mic size={12} /></TabsTrigger>
              <TabsTrigger value="translation" className="flex-1 text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg" title="Translation"><Languages size={12} /></TabsTrigger>
              <TabsTrigger value="polls" className="flex-1 text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg"><BarChart3 size={12} className="mr-0.5" /></TabsTrigger>
            </TabsList>
          </Tabs>
          <button onClick={onClose} className="ml-1.5 w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center shrink-0 transition-colors">
            <X size={14} className="text-white/60" />
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <MeetingChat
            chatMessages={chatMessages}
            typingUserNames={typingUserNames}
            onSendMessage={onSendMessage}
            onSetTyping={onSetTyping}
          />
        )}
        {activeTab === 'participants' && (
          <ParticipantList
            effectiveHandRaisedIds={effectiveHandRaisedIds}
            onlineCount={onlineCount}
            spotlightedParticipant={spotlightedParticipant}
            onSpotlightChange={onSpotlightChange}
            cohosts={cohosts}
            onCohostToggle={onCohostToggle}
            onMuteAll={onMuteAll}
            participantPermissions={participantPermissions}
            onPermissionsChange={onPermissionsChange}
            isHost={isHost}
          />
        )}
        {activeTab === 'ai' && (
          <MeetingAIPanel userName={userName} />
        )}
        {activeTab === 'polls' && (
          <PollsPanel
            displayPolls={displayPolls}
            onVotePoll={onVotePoll}
            onCreatePoll={onCreatePoll}
            onOpenPollBuilder={onOpenPollBuilder}
          />
        )}
        {activeTab === 'breakout' && (
          <BreakoutRoomsPanel />
        )}
        {activeTab === 'transcription' && (
          <TranscriptionPanel />
        )}
        {activeTab === 'translation' && (
          <TranslationPanel />
        )}
      </div>
    </motion.div>
  );
}
