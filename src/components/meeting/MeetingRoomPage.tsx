'use client';

import { useAppStore } from '@/store/app-store';
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, MessageSquare, Users,
  Hand, MoreHorizontal, Phone, Shield, CircleDot, Sparkles, Send, X,
  ArrowLeft, ArrowRight, Copy, Check, Plus, Pin, PinOff, LayoutGrid, UserCircle,
  Maximize2, Minimize2, Search, Pencil, CheckCircle2, Pen, LayoutDashboard,
  Wifi, Signal, Subtitles, SmilePlus, Shuffle, Clock, ChevronDown, UserPlus, DoorOpen, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ─── Interfaces ───────────────────────────────────────────────
interface ChatMessage {
  id: string;
  sender: string;
  initials: string;
  color: string;
  text: string;
  time: string;
  isSystem?: boolean;
  isAI?: boolean;
  reactions?: string[];
}

interface Participant {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: 'Host' | 'Co-host' | 'Presenter' | 'Participant';
  micOn: boolean;
  videoOn: boolean;
  online?: boolean;
  handRaised?: boolean;
}

interface BreakoutRoom {
  id: string;
  name: string;
  participantIds: string[];
  timerSeconds: number;
}

interface WaitingParticipant {
  id: string;
  name: string;
  initials: string;
  color: string;
  joinTime: string;
}

interface PollData {
  id: string;
  question: string;
  options: { label: string; votes: number; percentage: number; voted?: boolean }[];
  totalVotes: number;
}

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
}

// ─── Data ─────────────────────────────────────────────────────
const mockParticipants: Participant[] = [
  { id: '1', name: 'Alex Johnson', initials: 'AJ', color: 'bg-blue-500', role: 'Host', micOn: true, videoOn: true, online: true },
  { id: '2', name: 'Sarah Chen', initials: 'SC', color: 'bg-pink-500', role: 'Co-host', micOn: true, videoOn: true, online: true, handRaised: true },
  { id: '3', name: 'Maya Patel', initials: 'MP', color: 'bg-emerald-500', role: 'Participant', micOn: false, videoOn: true, online: true },
  { id: '4', name: 'James Wilson', initials: 'JW', color: 'bg-orange-500', role: 'Participant', micOn: true, videoOn: false, online: true },
  { id: '5', name: 'Emily Zhang', initials: 'EZ', color: 'bg-violet-500', role: 'Participant', micOn: true, videoOn: true, online: true },
  { id: '6', name: 'David Kim', initials: 'DK', color: 'bg-cyan-500', role: 'Participant', micOn: false, videoOn: false, online: false },
  { id: '7', name: 'Lisa Brown', initials: 'LB', color: 'bg-rose-500', role: 'Participant', micOn: true, videoOn: true, online: true },
  { id: '8', name: 'Tom Garcia', initials: 'TG', color: 'bg-amber-500', role: 'Participant', micOn: false, videoOn: true, online: true },
];

const initialChatMessages: ChatMessage[] = [
  { id: 'sys-1', sender: 'System', initials: '', color: '', text: 'Meeting started by Alex Johnson', time: '10:00 AM', isSystem: true },
  { id: 'msg-1', sender: 'Sarah Chen', initials: 'SC', color: 'bg-pink-500', text: 'Hi everyone! Ready to start the sprint planning?', time: '10:01 AM', reactions: ['👍', '🚀'] },
  { id: 'msg-2', sender: 'Maya Patel', initials: 'MP', color: 'bg-emerald-500', text: 'Yes, I have the updated backlog items ready.', time: '10:02 AM' },
  { id: 'msg-3', sender: 'James Wilson', initials: 'JW', color: 'bg-orange-500', text: 'Great. Let me share the velocity report from last sprint.', time: '10:03 AM' },
  { id: 'msg-4', sender: 'Emily Zhang', initials: 'EZ', color: 'bg-violet-500', text: 'Should we also discuss the tech debt items?', time: '10:04 AM', reactions: ['❤️'] },
];

const aiSuggestions = [
  'Summarize this meeting',
  'List action items',
  'Key decisions made',
  'Translate to French',
  'Identify risks',
];

const mockPolls: PollData[] = [
  {
    id: 'poll-1',
    question: 'What should be the priority for this sprint?',
    options: [
      { label: 'New features', votes: 5, percentage: 45 },
      { label: 'Bug fixes', votes: 3, percentage: 27 },
      { label: 'Tech debt', votes: 2, percentage: 18 },
      { label: 'Documentation', votes: 1, percentage: 10 },
    ],
    totalVotes: 11,
  },
  {
    id: 'poll-2',
    question: 'Preferred meeting time for daily standups?',
    options: [
      { label: '9:00 AM', votes: 6, percentage: 55, voted: true },
      { label: '9:30 AM', votes: 3, percentage: 27 },
      { label: '10:00 AM', votes: 2, percentage: 18 },
    ],
    totalVotes: 11,
  },
];

const aiResponses: { [key: string]: string } = {
  'Summarize this meeting': '## Meeting Summary\n\nThe team discussed sprint planning for Q4. Key topics included backlog prioritization, velocity improvements from last sprint (15% increase), and tech debt allocation. The team agreed to allocate 20% of capacity to tech debt. Action items were assigned to Sarah (backlog grooming), James (velocity report), and Maya (capacity planning).',
  'List action items': '**Action Items:**\n\n1. **Sarah Chen** - Groom and prioritize backlog items by EOD Tuesday\n2. **James Wilson** - Share velocity report with stakeholders\n3. **Maya Patel** - Update capacity planning spreadsheet\n4. **Alex Johnson** - Schedule follow-up with product team\n5. **Emily Zhang** - Create tech debt JIRA epic',
  'Key decisions made': '**Key Decisions:**\n\n1. Sprint velocity target set to 42 story points\n2. 20% capacity allocated to tech debt reduction\n3. Daily standups moved to 9:30 AM\n4. New feature: Real-time collaboration will be prioritized\n5. Code review SLA reduced from 24h to 12h',
  'Translate to French': '## R\u00e9sum\u00e9 de la r\u00e9union\n\nL\'\u00e9quipe a discut\u00e9 de la planification du sprint pour le T4. Les sujets principaux incluaient la prioritisation du backlog, les am\u00e9liorations de v\u00e9locit\u00e9 du dernier sprint (augmentation de 15%), et l\'allocation de la dette technique.',
  'Identify risks': '**Identified Risks:**\n\n1. **High** - Key engineer (David) on PTO next week during critical feature development\n2. **Medium** - Third-party API dependency may cause delays for authentication module\n3. **Medium** - Scope creep risk with 3 new feature requests from stakeholders\n4. **Low** - Testing environment capacity may need scaling for E2E tests',
};

const reactionEmojis = ['👍', '❤️', '😂', '🎉', '🤔', '👏'];
const reactionEmojiLabels = ['👍', '❤️', '😂', '🎉', '🤔', '👏'];

const mockCaptions = [
  { speaker: 'Alex Johnson', text: 'Let me share the updated roadmap for Q4...' },
  { speaker: 'Sarah Chen', text: 'I think we should prioritize the mobile app features.' },
  { speaker: 'Maya Patel', text: 'The API redesign is almost complete, just need to finalize the endpoints.' },
  { speaker: 'James Wilson', text: 'Can we schedule a follow-up for the technical review?' },
  { speaker: 'Emily Zhang', text: "I'll take the action item for the documentation update." },
];

const initialBreakoutRooms: BreakoutRoom[] = [
  { id: 'br-1', name: 'Backend Architecture', participantIds: ['2', '3', '4'], timerSeconds: 600 },
  { id: 'br-2', name: 'Frontend UI Review', participantIds: ['5', '7', '8'], timerSeconds: 600 },
  { id: 'br-3', name: 'DevOps & Infra', participantIds: ['1'], timerSeconds: 600 },
];

const mockWaitingParticipants: WaitingParticipant[] = [
  { id: 'w-1', name: 'Ryan Foster', initials: 'RF', color: 'bg-teal-500', joinTime: '2m ago' },
  { id: 'w-2', name: 'Nina Rossi', initials: 'NR', color: 'bg-fuchsia-500', joinTime: '5m ago' },
];

type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor';

const networkQualityConfig: Record<NetworkQuality, { color: string; barColor: string; latency: [number, number]; label: string }> = {
  excellent: { color: 'text-emerald-400', barColor: 'bg-emerald-400', latency: [10, 40], label: 'Excellent' },
  good: { color: 'text-yellow-400', barColor: 'bg-yellow-400', latency: [40, 90], label: 'Good' },
  fair: { color: 'text-orange-400', barColor: 'bg-orange-400', latency: [90, 180], label: 'Fair' },
  poor: { color: 'text-red-400', barColor: 'bg-red-400', latency: [180, 400], label: 'Poor' },
};

// ─── Helpers ──────────────────────────────────────────────────
const colorToGradient: Record<string, string> = {
  'bg-blue-500': 'from-blue-600 via-blue-700 to-slate-900',
  'bg-pink-500': 'from-pink-600 via-pink-700 to-slate-900',
  'bg-green-500': 'from-emerald-600 via-emerald-700 to-slate-900',
  'bg-emerald-500': 'from-emerald-600 via-emerald-700 to-slate-900',
  'bg-orange-500': 'from-orange-600 via-orange-700 to-slate-900',
  'bg-violet-500': 'from-violet-600 via-violet-700 to-slate-900',
  'bg-cyan-500': 'from-cyan-600 via-cyan-700 to-slate-900',
  'bg-rose-500': 'from-rose-600 via-rose-700 to-slate-900',
  'bg-amber-500': 'from-amber-600 via-amber-700 to-slate-900',
};

function getGradient(color: string) {
  return colorToGradient[color] || 'from-slate-700 via-slate-800 to-slate-900';
}

function getRoleBadgeClass(role: string) {
  switch (role) {
    case 'Host': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'Co-host': return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
    default: return 'bg-white/10 text-white/50 border-white/10';
  }
}

// ─── Audio Level Bars ─────────────────────────────────────────
function AudioLevelBars() {
  const [levels, setLevels] = useState([3, 5, 2]);
  useEffect(() => {
    const interval = setInterval(() => {
      setLevels([
        Math.max(1, Math.floor(Math.random() * 6) + 1),
        Math.max(1, Math.floor(Math.random() * 6) + 1),
        Math.max(1, Math.floor(Math.random() * 6) + 1),
      ]);
    }, 400);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex items-end gap-[2px] h-4">
      {levels.map((h, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-emerald-400"
          animate={{ height: [2, h * 4, 2] }}
          transition={{ duration: 0.4, delay: i * 0.1, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ─── Floating Reaction ────────────────────────────────────────
function FloatingReactionEmoji({ emoji, x, onDone }: { emoji: string; x: number; onDone: () => void }) {
  return (
    <motion.div
      className="fixed bottom-32 text-4xl pointer-events-none z-[100]"
      style={{ left: x }}
      initial={{ y: 0, opacity: 1, scale: 0.5 }}
      animate={{ y: -200, opacity: 0, scale: 1.2 }}
      transition={{ duration: 2, ease: 'easeOut' }}
      onAnimationComplete={onDone}
    >
      {emoji}
    </motion.div>
  );
}

// ─── AI Typing Indicator ──────────────────────────────────────
function AITypingIndicator() {
  return (
    <div className="flex gap-2.5 border-l-2 border-violet-500/50 pl-3">
      <Avatar className="w-7 h-7 shrink-0">
        <AvatarFallback className="bg-violet-500 text-white text-[10px] font-bold">AI</AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-1.5 py-2.5">
        <motion.span
          className="w-2 h-2 rounded-full bg-violet-400"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
        />
        <motion.span
          className="w-2 h-2 rounded-full bg-violet-400"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
        />
        <motion.span
          className="w-2 h-2 rounded-full bg-violet-400"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
        />
      </div>
    </div>
  );
}

// ─── Network Quality Indicator ────────────────────────────────
function NetworkQualityIndicator() {
  const [quality, setQuality] = useState<NetworkQuality>('excellent');
  const [latency, setLatency] = useState(22);

  useEffect(() => {
    const qualities: NetworkQuality[] = ['excellent', 'good', 'fair', 'poor'];
    const changeQuality = () => {
      const q = qualities[Math.floor(Math.random() * qualities.length)];
      setQuality(q);
      const [minLat, maxLat] = networkQualityConfig[q].latency;
      setLatency(Math.floor(Math.random() * (maxLat - minLat + 1)) + minLat);
    };
    const interval = setInterval(changeQuality, 10000 + Math.random() * 5000);
    return () => clearInterval(interval);
  }, []);

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
                transition={{ duration: 0.5, delay: bar * 0.05, ease: 'easeOut' }}
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
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function MeetingRoomPage() {
  const {
    meetingTitle, setMeetingTitle, meetingSidebarTab, setMeetingSidebarTab,
    setCurrentView, currentMeetingId, user
  } = useAppStore();

  // --- State ---
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [chatInput, setChatInput] = useState('');
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiTyping, setAiTyping] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gridLayout, setGridLayout] = useState<'grid' | 'speaker' | 'gallery'>('grid');
  const [pinnedParticipant, setPinnedParticipant] = useState<string | null>(null);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(meetingTitle || 'Sprint Planning - Q4');
  const [participantSearch, setParticipantSearch] = useState('');
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionList, setShowMentionList] = useState(false);
  const [votedPolls, setVotedPolls] = useState<Record<string, string>>({});
  const [captionsVisible, setCaptionsVisible] = useState(true);
  const [currentCaptionIndex, setCurrentCaptionIndex] = useState(0);
  const [captionKey, setCaptionKey] = useState(0);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [enhancedReactionsOpen, setEnhancedReactionsOpen] = useState(false);
  const enhancedReactionsRef = useRef<HTMLDivElement>(null);

  // --- Breakout Rooms state ---
  const [breakoutRooms, setBreakoutRooms] = useState<BreakoutRoom[]>(initialBreakoutRooms);
  const [breakoutTimerActive, setBreakoutTimerActive] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingRoomName, setEditingRoomName] = useState('');
  const [waitingParticipants, setWaitingParticipants] = useState<WaitingParticipant[]>(mockWaitingParticipants);
  const [participantRoles, setParticipantRoles] = useState<Record<string, Participant['role']>>(
    Object.fromEntries(mockParticipants.map(p => [p.id, p.role]))
  );
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const aiEndRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const meetingContainerRef = useRef<HTMLDivElement>(null);

  // --- Meeting elapsed timer (always running) ---
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Recording timer ---
  useEffect(() => {
    if (!isRecording) { setRecordingTime(0); return; }
    const interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  // --- Auto-scroll chat ---
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);
  useEffect(() => { aiEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiMessages, aiTyping]);

  // --- Close more menu on outside click ---
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) setShowMoreMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // --- Close enhanced reactions on outside click ---
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (enhancedReactionsRef.current && !enhancedReactionsRef.current.contains(e.target as Node)) setEnhancedReactionsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // --- Breakout Rooms countdown timer ---
  useEffect(() => {
    if (!breakoutTimerActive) return;
    const interval = setInterval(() => {
      setBreakoutRooms(prev => {
        const allDone = prev.every(r => r.timerSeconds <= 0);
        if (allDone) { setBreakoutTimerActive(false); return prev; }
        return prev.map(r => r.timerSeconds > 0 ? { ...r, timerSeconds: r.timerSeconds - 1 } : r);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [breakoutTimerActive]);

  // --- Close role dropdown on outside click ---
  useEffect(() => {
    if (!roleDropdownOpen) return;
    const handleClick = () => setRoleDropdownOpen(null);
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [roleDropdownOpen]);

  // --- Cycle mock captions every 3-4 seconds ---
  useEffect(() => {
    if (!captionsVisible) return;
    const interval = setInterval(() => {
      setCurrentCaptionIndex(prev => (prev + 1) % mockCaptions.length);
      setCaptionKey(prev => prev + 1);
    }, 3000 + Math.random() * 1000);
    return () => clearInterval(interval);
  }, [captionsVisible]);

  // --- Focus title input when editing ---
  useEffect(() => { if (isEditingTitle) titleInputRef.current?.focus(); }, [isEditingTitle]);

  // --- Clean up floating reactions ---
  const removeReaction = useCallback((id: string) => {
    setFloatingReactions(prev => prev.filter(r => r.id !== id));
  }, []);

  // --- Formatters ---
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // --- Handlers ---
  const handleCopyMeetingId = () => {
    navigator.clipboard?.writeText(currentMeetingId || 'alv-mtg-2024-001');
    setCopied(true);
    toast.success('Meeting ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

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

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const handleSendReaction = (emoji: string) => {
    const id = `reaction-${Date.now()}-${Math.random()}`;
    const x = 100 + Math.random() * (window.innerWidth - 200);
    setFloatingReactions(prev => [...prev, { id, emoji, x }]);
    setEnhancedReactionsOpen(false);
    setReactionCounts(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
    // Also simulate someone else reacting
    setTimeout(() => {
      const id2 = `reaction-${Date.now()}-${Math.random()}`;
      const x2 = 150 + Math.random() * (window.innerWidth - 300);
      setFloatingReactions(prev => [...prev, { id: id2, emoji, x: x2 }]);
    }, 800);
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: user?.name || 'You',
      initials: (user?.name || 'Y').split(' ').map(n => n[0]).join(''),
      color: 'bg-blue-500',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: [],
    };
    setChatMessages(prev => [...prev, msg]);
    setChatInput('');
    setShowMentionList(false);
  };

  const handleChatInputChange = (value: string) => {
    setChatInput(value);
    const atIndex = value.lastIndexOf('@');
    if (atIndex >= 0) {
      const query = value.slice(atIndex + 1).split(/\s/)[0];
      if (query.length > 0 || atIndex === value.length - 1) {
        setMentionQuery(query.toLowerCase());
        setShowMentionList(true);
        return;
      }
    }
    setShowMentionList(false);
  };

  const handleMentionSelect = (name: string) => {
    const atIndex = chatInput.lastIndexOf('@');
    const before = chatInput.slice(0, atIndex);
    setChatInput(`${before}@${name} `);
    setShowMentionList(false);
    chatInputRef.current?.focus();
  };

  const handleAISuggestion = (suggestion: string) => {
    const userMsg: ChatMessage = {
      id: `ai-user-${Date.now()}`,
      sender: user?.name || 'You',
      initials: (user?.name || 'Y').split(' ').map(n => n[0]).join(''),
      color: 'bg-blue-500',
      text: suggestion,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setAiMessages(prev => [...prev, userMsg]);
    setAiTyping(true);
    setTimeout(() => {
      setAiTyping(false);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ALVISION AI',
        initials: 'AI',
        color: 'bg-violet-500',
        text: aiResponses[suggestion] || "I'm analyzing the meeting content. Based on the discussion so far, here are my insights...",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAI: true,
      };
      setAiMessages(prev => [...prev, aiMsg]);
    }, 2000);
  };

  const handleSendAI = () => {
    if (!aiInput.trim()) return;
    handleAISuggestion(aiInput.trim());
    setAiInput('');
  };

  const handleLeaveMeeting = () => {
    toast.success('You left the meeting');
    setCurrentView('dashboard');
  };

  const toggleSidebar = (tab?: 'chat' | 'participants' | 'ai' | 'polls' | 'breakout') => {
    if (tab && sidebarOpen && meetingSidebarTab === tab) setSidebarOpen(false);
    else if (tab) { setMeetingSidebarTab(tab); setSidebarOpen(true); }
    else setSidebarOpen(prev => !prev);
  };

  const handleTitleSave = () => {
    setIsEditingTitle(false);
    if (titleDraft.trim()) {
      setMeetingTitle(titleDraft.trim());
      toast.success('Meeting title updated');
    }
  };

  const handleVotePoll = (pollId: string, optionLabel: string) => {
    setVotedPolls(prev => ({ ...prev, [pollId]: optionLabel }));
    toast.success('Vote recorded!', { description: `You voted for "${optionLabel}"` });
  };

  const handleTogglePin = (id: string) => {
    setPinnedParticipant(prev => prev === id ? null : id);
    toast(pinnedParticipant === id ? 'Unpinned participant' : 'Pinned participant');
  };

  // --- Breakout Rooms Handlers ---
  const handleCreateBreakoutRoom = () => {
    if (breakoutRooms.length >= 8) { toast.error('Maximum 8 breakout rooms allowed'); return; }
    const newRoom: BreakoutRoom = {
      id: `br-${Date.now()}`,
      name: `Room ${breakoutRooms.length + 1}`,
      participantIds: [],
      timerSeconds: 600,
    };
    setBreakoutRooms(prev => [...prev, newRoom]);
    toast.success(`Created ${newRoom.name}`);
  };

  const handleDeleteBreakoutRoom = (roomId: string) => {
    setBreakoutRooms(prev => prev.filter(r => r.id !== roomId));
    toast.success('Room removed');
  };

  const handleRenameBreakoutRoom = (roomId: string) => {
    if (!editingRoomName.trim()) { setEditingRoomId(null); return; }
    setBreakoutRooms(prev => prev.map(r => r.id === roomId ? { ...r, name: editingRoomName.trim() } : r));
    setEditingRoomId(null);
    toast.success('Room renamed');
  };

  const handleAutoAssign = () => {
    const assignableIds = mockParticipants.filter(p => p.online !== false).map(p => p.id);
    const shuffled = [...assignableIds].sort(() => Math.random() - 0.5);
    const newRooms = breakoutRooms.map((room, i) => ({
      ...room,
      participantIds: shuffled.slice(
        Math.floor(i * shuffled.length / breakoutRooms.length),
        Math.floor((i + 1) * shuffled.length / breakoutRooms.length)
      ),
    }));
    setBreakoutRooms(newRooms);
    setBreakoutTimerActive(true);
    toast.success('Participants auto-assigned to rooms');
  };

  const handleCloseAllRooms = () => {
    setBreakoutRooms([]);
    setBreakoutTimerActive(false);
    toast.success('All breakout rooms closed');
  };

  const handleJoinBreakoutRoom = (roomName: string) => {
    toast.success(`Joining ${roomName}...`);
  };

  // --- Role change handler ---
  const handleChangeRole = (participantId: string, newRole: Participant['role']) => {
    setParticipantRoles(prev => ({ ...prev, [participantId]: newRole }));
    setRoleDropdownOpen(null);
    const p = mockParticipants.find(pp => pp.id === participantId);
    toast.success(`Changed ${p?.name || 'participant'} role to ${newRole}`);
  };

  // --- Waiting room handlers ---
  const handleAdmitParticipant = (id: string) => {
    const wp = waitingParticipants.find(w => w.id === id);
    setWaitingParticipants(prev => prev.filter(w => w.id !== id));
    toast.success(`${wp?.name} admitted to the meeting`);
  };

  const handleDenyParticipant = (id: string) => {
    const wp = waitingParticipants.find(w => w.id === id);
    setWaitingParticipants(prev => prev.filter(w => w.id !== id));
    toast.success(`${wp?.name} was denied entry`);
  };

  // --- Filtered participants ---
  const filteredParticipants = useMemo(() => {
    if (!participantSearch.trim()) return mockParticipants;
    return mockParticipants.filter(p => p.name.toLowerCase().includes(participantSearch.toLowerCase()));
  }, [participantSearch]);

  const filteredMentions = useMemo(() => {
    if (!mentionQuery) return mockParticipants.slice(0, 5);
    return mockParticipants.filter(p => p.name.toLowerCase().includes(mentionQuery));
  }, [mentionQuery]);

  // --- Grid participants based on layout ---
  const displayParticipants = useMemo(() => {
    if (pinnedParticipant && gridLayout === 'speaker') {
      const pinned = mockParticipants.find(p => p.id === pinnedParticipant);
      const others = mockParticipants.filter(p => p.id !== pinnedParticipant);
      return pinned ? [pinned, ...others.slice(0, 5)] : mockParticipants.slice(0, 6);
    }
    if (gridLayout === 'speaker') {
      return [mockParticipants[0], ...mockParticipants.slice(1, 6)];
    }
    if (gridLayout === 'gallery') {
      return mockParticipants;
    }
    return mockParticipants.slice(0, 4);
  }, [gridLayout, pinnedParticipant]);

  const onlineCount = mockParticipants.filter(p => p.online !== false).length;

  // ─── Render ─────────────────────────────────────────────────
  return (
    <TooltipProvider delayDuration={200}>
    <div ref={meetingContainerRef} className="h-screen w-screen flex bg-slate-950 text-white overflow-hidden">

      {/* ── Floating Reactions Overlay ── */}
      <div className="fixed inset-0 pointer-events-none z-[100]">
        <AnimatePresence>
          {floatingReactions.map(r => (
            <FloatingReactionEmoji key={r.id} emoji={r.emoji} x={r.x} onDone={() => removeReaction(r.id)} />
          ))}
        </AnimatePresence>
      </div>

      {/* ── Main Meeting Area ── */}
      <div className="flex-1 relative flex flex-col min-w-0">

        {/* ── ALVISION Watermark ── */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <span className="text-[10rem] sm:text-[12rem] font-black text-white/[0.02] tracking-[0.3em] select-none">ALVISION</span>
        </div>

        {/* ── Top Bar ── */}
        <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/70 via-black/40 to-transparent">
          <div className="flex items-center justify-between px-3 sm:px-5 py-3">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => setCurrentView('dashboard')}
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
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <span className="text-[10px] font-mono font-medium text-red-400">REC {formatTime(recordingTime)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Info pills */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Meeting Timer */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] font-mono text-white/70">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {formatTime(elapsed)}
              </div>
              {/* Meeting ID */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] font-mono">
                <span className="text-white/50">ID:</span>
                <span>{currentMeetingId || 'alv-mtg-001'}</span>
                <button onClick={handleCopyMeetingId} className="text-white/40 hover:text-white transition-colors">
                  {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                </button>
              </div>
              {/* Participants count */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px]">
                <Users size={11} className="text-white/60" />
                <span>{onlineCount}/{mockParticipants.length}</span>
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
                    onClick={handleToggleFullscreen}
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

        {/* ── Video Grid ── */}
        <div className="flex-1 relative z-10">

          {/* ── Network Quality Indicator ── */}
          <NetworkQualityIndicator />

          {/* ── Live Captions Panel ── */}
          <AnimatePresence mode="wait">
            {captionsVisible && (
              <motion.div
                key={captionKey}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-2xl pointer-events-none"
              >
                <div className="flex flex-col gap-1 px-5 py-2.5 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10">
                  <p className="text-sm text-white/90 leading-relaxed text-center line-clamp-2">
                    <span className="font-bold text-white">{mockCaptions[currentCaptionIndex].speaker}:</span>{' '}
                    {mockCaptions[currentCaptionIndex].text}
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
                      isHandRaised={handRaised && displayParticipants[0].id === '1'}
                      onPin={() => handleTogglePin(displayParticipants[0].id)}
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
                        isHandRaised={p.handRaised === true}
                        onPin={() => handleTogglePin(p.id)}
                        compact
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
                    isHandRaised={p.handRaised === true || (handRaised && p.id === '1')}
                    onPin={() => handleTogglePin(p.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

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
                    onClick={() => handleSendReaction(emoji)}
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
              onClick={() => setMicOn(!micOn)}
              glowColor="emerald"
            />
            {/* Camera */}
            <ToolbarButton
              active={cameraOn}
              icon={cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
              label={cameraOn ? 'Stop Camera' : 'Start Camera'}
              onClick={() => setCameraOn(!cameraOn)}
              glowColor="emerald"
            />
            {/* Screen Share */}
            <ToolbarButton
              active={screenSharing}
              icon={screenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
              label={screenSharing ? 'Stop Sharing' : 'Share Screen'}
              onClick={() => { setScreenSharing(!screenSharing); toast(screenSharing ? 'Screen sharing stopped' : 'Screen sharing started'); }}
              glowColor="sky"
            />
            {/* Hand Raise */}
            <ToolbarButton
              active={handRaised}
              icon={<Hand size={20} />}
              label={handRaised ? 'Lower Hand' : 'Raise Hand'}
              onClick={() => { setHandRaised(!handRaised); toast(handRaised ? 'Hand lowered' : '\u{1F64B} Hand raised'); }}
              glowColor="amber"
            />
            {/* Recording */}
            <ToolbarButton
              active={isRecording}
              icon={<CircleDot size={20} />}
              label={isRecording ? 'Stop Recording' : 'Start Recording'}
              onClick={() => { setIsRecording(!isRecording); toast(isRecording ? 'Recording stopped' : 'Recording started'); }}
              glowColor="red"
            />

            {/* Separator */}
            <div className="w-px h-8 bg-white/10 mx-0.5" />

            {/* Chat */}
            <ToolbarButton
              active={meetingSidebarTab === 'chat' && sidebarOpen}
              icon={<MessageSquare size={20} />}
              label="Chat"
              onClick={() => toggleSidebar('chat')}
            />
            {/* Participants */}
            <ToolbarButton
              active={meetingSidebarTab === 'participants' && sidebarOpen}
              icon={<Users size={20} />}
              label="Participants"
              onClick={() => toggleSidebar('participants')}
            />
            {/* AI */}
            <ToolbarButton
              active={meetingSidebarTab === 'ai' && sidebarOpen}
              icon={<Sparkles size={20} />}
              label="AI Assistant"
              onClick={() => toggleSidebar('ai')}
            />
            {/* Captions */}
            <ToolbarButton
              active={captionsVisible}
              icon={<Subtitles size={20} />}
              label={captionsVisible ? 'Hide Captions' : 'Show Captions'}
              onClick={() => setCaptionsVisible(!captionsVisible)}
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
                onClick={() => setEnhancedReactionsOpen(!enhancedReactionsOpen)}
              />
            </div>

            {/* Layout toggle */}
            <div className="relative" ref={moreMenuRef}>
              <ToolbarButton
                icon={<LayoutGrid size={20} />}
                label="Layout"
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
                    {/* Layout options */}
                    <div className="p-1.5 border-b border-white/10">
                      <p className="text-[10px] uppercase tracking-wider text-white/40 px-3 py-1.5 font-semibold">Layout</p>
                      {(['grid', 'speaker', 'gallery'] as const).map(layout => (
                        <button
                          key={layout}
                          onClick={() => { setGridLayout(layout); setShowMoreMenu(false); toast(`Switched to ${layout} view`); }}
                          className={`w-full px-3 py-2 text-left text-sm rounded-lg flex items-center gap-2.5 transition-colors ${
                            gridLayout === layout ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'
                          }`}
                        >
                          {layout === 'grid' && <LayoutGrid size={16} />}
                          {layout === 'speaker' && <UserCircle size={16} />}
                          {layout === 'gallery' && <LayoutDashboard size={16} />}
                          <span className="capitalize">{layout}</span>
                          {gridLayout === layout && <Check size={14} className="ml-auto text-violet-400" />}
                        </button>
                      ))}
                    </div>
                    {/* Other options */}
                    <div className="p-1.5">
                      <p className="text-[10px] uppercase tracking-wider text-white/40 px-3 py-1.5 font-semibold">Tools</p>
                      <button onClick={() => { toggleSidebar('polls'); setShowMoreMenu(false); }} className="w-full px-3 py-2 text-left text-sm rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5">
                        <Plus size={16} /> Create Poll
                      </button>
                      <button onClick={() => { setShowMoreMenu(false); toast('Whiteboard coming soon!'); }} className="w-full px-3 py-2 text-left text-sm rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5">
                        <Pen size={16} /> Whiteboard
                      </button>
                      <button onClick={() => { toggleSidebar('breakout'); setShowMoreMenu(false); }} className="w-full px-3 py-2 text-left text-sm rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2.5">
                        <LayoutGrid size={16} /> Breakout Rooms
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Separator */}
            <div className="w-px h-8 bg-white/10 mx-0.5" />

            {/* Leave Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLeaveMeeting}
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
      </div>

      {/* ── Right Sidebar ── */}
      <AnimatePresence>
        {sidebarOpen && (
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
                <Tabs value={meetingSidebarTab} onValueChange={(v) => setMeetingSidebarTab(v as 'chat' | 'participants' | 'ai' | 'polls' | 'breakout')} className="w-full">
                  <TabsList className="bg-white/5 w-full h-9 rounded-xl">
                    <TabsTrigger value="chat" className="flex-1 text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg">Chat</TabsTrigger>
                    <TabsTrigger value="participants" className="flex-1 text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg">People</TabsTrigger>
                    <TabsTrigger value="ai" className="flex-1 text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg">AI</TabsTrigger>
                    <TabsTrigger value="breakout" className="flex-1 text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg">Breakout</TabsTrigger>
                    <TabsTrigger value="polls" className="flex-1 text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-lg"><BarChart3 size={12} className="mr-0.5" /></TabsTrigger>
                  </TabsList>
                </Tabs>
                <button onClick={() => setSidebarOpen(false)} className="ml-1.5 w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center shrink-0 transition-colors">
                  <X size={14} className="text-white/60" />
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">

              {/* ── Chat Tab ── */}
              {meetingSidebarTab === 'chat' && (
                <div className="flex flex-col h-full">
                  <ScrollArea className="flex-1">
                    <div className="p-3 space-y-3">
                      {chatMessages.map((msg) => (
                        <div key={msg.id}>
                          {msg.isSystem ? (
                            <div className="flex items-center gap-2 py-1">
                              <div className="flex-1 h-px bg-white/10" />
                              <span className="text-[10px] text-white/30 px-2">{msg.text}</span>
                              <div className="flex-1 h-px bg-white/10" />
                            </div>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="group"
                            >
                              <div className="flex gap-2.5">
                                <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                                  <AvatarFallback className={`${msg.color} text-white text-[10px] font-bold`}>{msg.initials}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-xs font-semibold text-white/90">{msg.sender}</span>
                                    <span className="text-[10px] text-white/25">{msg.time}</span>
                                  </div>
                                  <div className="mt-1 bg-white/[0.06] rounded-2xl rounded-tl-sm px-3 py-2 inline-block max-w-full">
                                    <p className="text-sm text-white/80 break-words leading-relaxed">{msg.text}</p>
                                  </div>
                                  {/* Reactions row */}
                                  {msg.reactions && msg.reactions.length > 0 && (
                                    <div className="flex gap-1 mt-1">
                                      {msg.reactions.map((r, ri) => (
                                        <span key={ri} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs hover:bg-white/10 cursor-pointer transition-colors">
                                          {r} <span className="text-[10px] text-white/40">{ri + 1}</span>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>

                  {/* @Mention dropdown */}
                  <AnimatePresence>
                    {showMentionList && filteredMentions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="absolute bottom-14 left-3 right-3 max-h-40 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
                      >
                        <ScrollArea className="max-h-40">
                          <div className="p-1">
                            {filteredMentions.map(p => (
                              <button
                                key={p.id}
                                onClick={() => handleMentionSelect(p.name)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                              >
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className={`${p.color} text-white text-[9px] font-bold`}>{p.initials}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <span className="text-xs font-medium">{p.name}</span>
                                  <span className="text-[10px] text-white/40 ml-2">{p.role}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </ScrollArea>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Chat Input */}
                  <div className="p-3 border-t border-white/10 bg-white/[0.02]">
                    <div className="flex gap-2">
                      <Input
                        ref={chatInputRef}
                        value={chatInput}
                        onChange={(e) => handleChatInputChange(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !showMentionList && handleSendChat()}
                        placeholder="Type a message... (use @ to mention)"
                        className="bg-white/5 border-white/10 text-sm h-9 placeholder:text-white/25 focus:border-violet-500/50 rounded-xl"
                      />
                      <Button size="icon" onClick={handleSendChat} className="h-9 w-9 shrink-0 bg-violet-600 hover:bg-violet-700 rounded-xl">
                        <Send size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Participants Tab ── */}
              {meetingSidebarTab === 'participants' && (
                <div className="flex flex-col h-full">
                  {/* Search bar + action buttons */}
                  <div className="px-3 py-2.5 border-b border-white/10 bg-white/[0.02]">
                    <div className="relative mb-2">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
                      <input
                        value={participantSearch}
                        onChange={(e) => setParticipantSearch(e.target.value)}
                        placeholder="Search participants..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs outline-none placeholder:text-white/25 focus:border-violet-500/50 transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toast.success('All participants muted')}
                        className="h-6 text-[10px] border-white/10 hover:bg-white/10 text-white/60 hover:text-white rounded-md px-2"
                      >
                        <MicOff size={11} className="mr-1" /> Mute All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toast.success('All cameras turned off')}
                        className="h-6 text-[10px] border-white/10 hover:bg-white/10 text-white/60 hover:text-white rounded-md px-2"
                      >
                        <VideoOff size={11} className="mr-1" /> Video Off All
                      </Button>
                    </div>
                  </div>

                  {/* Hand Raised Queue */}
                  {mockParticipants.filter(p => p.handRaised).length > 0 && (
                    <div className="px-3 py-2 border-b border-amber-500/20 bg-amber-500/5">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Hand size={11} className="text-amber-400" />
                        <span className="text-[10px] font-semibold text-amber-300">Raised Hands ({mockParticipants.filter(p => p.handRaised).length})</span>
                      </div>
                      <div className="space-y-0.5">
                        {mockParticipants.filter(p => p.handRaised).map(p => (
                          <div key={`hr-${p.id}`} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-500/10">
                            <Avatar className="w-6 h-6 shrink-0">
                              <AvatarFallback className={`${p.color} text-white text-[8px] font-bold`}>{p.initials}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-amber-200 flex-1 truncate">{p.name}</span>
                            <Button
                              size="sm"
                              onClick={() => toast.success(`Lowered ${p.name}'s hand`)}
                              className="h-5 text-[9px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-md px-1.5"
                            >
                              Lower
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="px-4 py-2 border-b border-white/10">
                    <h3 className="text-xs font-semibold text-white/50">{filteredParticipants.length} Participants ({onlineCount} online)</h3>
                  </div>
                  <ScrollArea className="flex-1 max-h-96 overflow-y-auto">
                    <div className="p-1.5 space-y-0.5">
                      {filteredParticipants.map((p) => {
                        const currentRole = participantRoles[p.id] || p.role;
                        return (
                          <div
                            key={p.id}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group ${
                              p.online === false ? 'opacity-50' : ''
                            }`}
                          >
                            <div className="relative">
                              <Avatar className="w-9 h-9 shrink-0">
                                <AvatarFallback className={`${p.color} text-white text-xs font-bold`}>{p.initials}</AvatarFallback>
                              </Avatar>
                              {/* Online indicator */}
                              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                                p.online === false ? 'bg-slate-500' : 'bg-emerald-400'
                              }`} />
                              {/* Hand raised indicator */}
                              {p.handRaised && (
                                <motion.span
                                  className="absolute -top-1 -right-1 text-sm"
                                  animate={{ y: [0, -3, 0] }}
                                  transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                                >
                                  {'✋'}
                                </motion.span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate">{p.name}</span>
                                {/* Role dropdown */}
                                <div className="relative">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setRoleDropdownOpen(roleDropdownOpen === p.id ? null : p.id); }}
                                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${getRoleBadgeClass(currentRole)} hover:opacity-80 transition-opacity flex items-center gap-0.5`}
                                  >
                                    {currentRole} <ChevronDown size={9} />
                                  </button>
                                  <AnimatePresence>
                                    {roleDropdownOpen === p.id && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        className="absolute top-full left-0 mt-1 w-32 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden shadow-2xl z-50"
                                      >
                                        {(['Host', 'Co-host', 'Presenter', 'Participant'] as const).map(role => (
                                          <button
                                            key={role}
                                            onClick={() => handleChangeRole(p.id, role)}
                                            className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${
                                              currentRole === role ? 'bg-violet-500/20 text-violet-300' : 'text-white/70 hover:bg-white/10 hover:text-white'
                                            }`}
                                          >
                                            {role}
                                          </button>
                                        ))}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                              <span className={`text-[10px] ${p.online === false ? 'text-slate-500' : 'text-white/30'}`}>
                                {p.online === false ? 'Offline' : 'In meeting'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${p.micOn ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-red-400 hover:bg-red-500/10'}`}>
                                    {p.micOn ? <Mic size={14} /> : <MicOff size={14} />}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="bg-slate-800 text-white border-slate-700 text-xs">{p.micOn ? 'Muted' : 'Unmuted'}</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${p.videoOn ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-white/20 hover:bg-white/10'}`}>
                                    {p.videoOn ? <Video size={14} /> : <VideoOff size={14} />}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="bg-slate-800 text-white border-slate-700 text-xs">{p.videoOn ? 'Camera on' : 'Camera off'}</TooltipContent>
                              </Tooltip>
                              {currentRole !== 'Host' && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:bg-white/10 hover:text-white/50 opacity-0 group-hover:opacity-100 transition-all">
                                      <MicOff size={12} />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="left" className="bg-slate-800 text-white border-slate-700 text-xs">Mute participant</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  {/* Waiting Room Section */}
                  {waitingParticipants.length > 0 && (
                    <div className="border-t border-white/10 bg-white/[0.02]">
                      <div className="px-4 py-2 flex items-center gap-1.5">
                        <DoorOpen size={11} className="text-white/40" />
                        <span className="text-[10px] font-semibold text-white/50">Waiting Room ({waitingParticipants.length})</span>
                      </div>
                      <div className="px-1.5 pb-2 space-y-0.5">
                        {waitingParticipants.map(wp => (
                          <motion.div
                            key={wp.id}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/5 transition-colors"
                          >
                            <Avatar className="w-8 h-8 shrink-0">
                              <AvatarFallback className={`${wp.color} text-white text-[10px] font-bold`}>{wp.initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-medium truncate block">{wp.name}</span>
                              <span className="text-[10px] text-white/30">Waiting {wp.joinTime}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                onClick={() => handleAdmitParticipant(wp.id)}
                                className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700 rounded-md px-2"
                              >
                                <UserPlus size={10} className="mr-0.5" /> Admit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDenyParticipant(wp.id)}
                                className="h-6 text-[10px] rounded-md px-2"
                              >
                                Deny
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── AI Tab ── */}
              {meetingSidebarTab === 'ai' && (
                <div className="flex flex-col h-full">
                  <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02] flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
                      <Sparkles size={14} className="text-violet-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">AI Meeting Assistant</h3>
                      <p className="text-[10px] text-white/30">Powered by ALVISION</p>
                    </div>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-3 space-y-3">
                      {aiMessages.length === 0 && !aiTyping && (
                        <div className="py-8">
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 flex items-center justify-center mx-auto mb-4 border border-violet-500/20"
                          >
                            <Sparkles size={28} className="text-violet-400" />
                          </motion.div>
                          <p className="text-center text-sm text-white/40 mb-5">Ask me anything about this meeting</p>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {aiSuggestions.map((suggestion) => (
                              <motion.button
                                key={suggestion}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleAISuggestion(suggestion)}
                                className="px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 hover:bg-violet-500/20 hover:border-violet-500/30 transition-all"
                              >
                                {suggestion}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}

                      {aiMessages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`${msg.isAI ? 'border-l-2 border-violet-500/50 pl-3 ml-0.5' : ''}`}
                        >
                          <div className="flex gap-2.5">
                            <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                              <AvatarFallback className={`${msg.color} text-white text-[10px] font-bold`}>{msg.initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs font-semibold text-white/90">{msg.sender}</span>
                                <span className="text-[10px] text-white/25">{msg.time}</span>
                              </div>
                              <div className={`mt-1 text-sm text-white/75 break-words whitespace-pre-wrap leading-relaxed ${
                                msg.isAI ? 'bg-violet-500/5 rounded-xl px-3 py-2' : 'bg-white/[0.06] rounded-2xl rounded-tl-sm px-3 py-2 inline-block'
                              }`}>
                                {msg.text}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      {aiTyping && <AITypingIndicator />}

                      {aiMessages.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                          {aiSuggestions.slice(0, 3).map((suggestion) => (
                            <motion.button
                              key={suggestion}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleAISuggestion(suggestion)}
                              className="px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 hover:bg-violet-500/20 transition-all"
                            >
                              {suggestion}
                            </motion.button>
                          ))}
                        </div>
                      )}

                      <div ref={aiEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="p-3 border-t border-white/10 bg-white/[0.02]">
                    <div className="flex gap-2">
                      <Input
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendAI()}
                        placeholder="Ask AI something..."
                        className="bg-white/5 border-white/10 text-sm h-9 placeholder:text-white/25 focus:border-violet-500/50 rounded-xl"
                      />
                      <Button size="icon" onClick={handleSendAI} className="h-9 w-9 shrink-0 bg-violet-600 hover:bg-violet-700 rounded-xl">
                        <Send size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Polls Tab ── */}
              {meetingSidebarTab === 'polls' && (
                <div className="flex flex-col h-full">
                  <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">Polls</h3>
                      <p className="text-[10px] text-white/30">Vote and create polls</p>
                    </div>
                    <Button size="sm" className="h-7 text-xs bg-violet-600 hover:bg-violet-700 rounded-lg" onClick={() => toast.info('Poll creation coming soon')}>
                      <Plus size={12} className="mr-1" /> Create
                    </Button>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-3 space-y-4">
                      {mockPolls.map((poll) => (
                        <motion.div
                          key={poll.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors"
                        >
                          <h4 className="text-sm font-semibold mb-1">{poll.question}</h4>
                          <p className="text-[10px] text-white/30 mb-3">{poll.totalVotes} total votes</p>
                          <div className="space-y-2">
                            {poll.options.map((opt) => {
                              const hasVoted = votedPolls[poll.id] === opt.label || opt.voted;
                              return (
                                <motion.button
                                  key={opt.label}
                                  whileHover={{ scale: 1.01 }}
                                  whileTap={{ scale: 0.99 }}
                                  onClick={() => !votedPolls[poll.id] && handleVotePoll(poll.id, opt.label)}
                                  className={`w-full text-left rounded-xl p-2.5 border transition-all ${
                                    hasVoted
                                      ? 'border-violet-500/30 bg-violet-500/5'
                                      : 'border-white/5 hover:border-white/15 hover:bg-white/5'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-xs mb-1.5">
                                    <span className={`font-medium ${hasVoted ? 'text-violet-300' : 'text-white/80'}`}>{opt.label}</span>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-white/40 font-mono">{opt.percentage}%</span>
                                      {hasVoted && <CheckCircle2 size={12} className="text-violet-400" />}
                                    </div>
                                  </div>
                                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                    <motion.div
                                      className={`h-full rounded-full ${hasVoted ? 'bg-violet-500' : 'bg-white/20'}`}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${opt.percentage}%` }}
                                      transition={{ duration: 0.8, ease: 'easeOut' }}
                                    />
                                  </div>
                                </motion.button>
                              );
                            })}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* ── Breakout Rooms Tab ── */}
              {meetingSidebarTab === 'breakout' && (
                <BreakoutRoomsPanel
                  rooms={breakoutRooms}
                  timerActive={breakoutTimerActive}
                  editingRoomId={editingRoomId}
                  editingRoomName={editingRoomName}
                  onSetEditingRoomId={setEditingRoomId}
                  onSetEditingRoomName={setEditingRoomName}
                  onCreateRoom={handleCreateBreakoutRoom}
                  onDeleteRoom={handleDeleteBreakoutRoom}
                  onRenameRoom={handleRenameBreakoutRoom}
                  onAutoAssign={handleAutoAssign}
                  onCloseAll={handleCloseAllRooms}
                  onJoinRoom={handleJoinBreakoutRoom}
                  onStartTimer={() => {
                    setBreakoutTimerActive(true);
                    if (!breakoutTimerActive) setBreakoutRooms(prev => prev.map(r => ({ ...r, timerSeconds: 600 })));
                    toast.success('Timer started');
                  }}
                  onResetTimer={() => {
                    setBreakoutRooms(prev => prev.map(r => ({ ...r, timerSeconds: 600 })));
                    setBreakoutTimerActive(false);
                    toast.success('Timer reset');
                  }}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </TooltipProvider>
  );
}

// ─── Participant Tile Component ────────────────────────────────
function ParticipantTile({
  participant,
  isSpeaker = false,
  isPinned = false,
  isHandRaised = false,
  onPin,
  index = 0,
  compact = false,
}: {
  participant: Participant;
  isSpeaker?: boolean;
  isPinned?: boolean;
  isHandRaised?: boolean;
  onPin?: () => void;
  index?: number;
  compact?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const gradient = getGradient(participant.color);

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
      {/* Gradient Background */}
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
        {participant.videoOn && !compact && (
          <span className="text-[10px] text-white/40 font-medium">Camera active</span>
        )}
      </div>

      {/* Audio Level Indicator (when mic on, bottom-left) */}
      {participant.micOn && !compact && (
        <div className="absolute bottom-3 left-3 z-20 bg-black/40 backdrop-blur-sm rounded-lg px-1.5 py-1">
          <AudioLevelBars />
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
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
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

// ─── Breakout Rooms Panel Component ──────────────────────────
function BreakoutRoomsPanel({
  rooms,
  timerActive,
  editingRoomId,
  editingRoomName,
  onSetEditingRoomId,
  onSetEditingRoomName,
  onCreateRoom,
  onDeleteRoom,
  onRenameRoom,
  onAutoAssign,
  onCloseAll,
  onJoinRoom,
  onStartTimer,
  onResetTimer,
}: {
  rooms: BreakoutRoom[];
  timerActive: boolean;
  editingRoomId: string | null;
  editingRoomName: string;
  onSetEditingRoomId: (id: string | null) => void;
  onSetEditingRoomName: (name: string) => void;
  onCreateRoom: () => void;
  onDeleteRoom: (id: string) => void;
  onRenameRoom: (id: string) => void;
  onAutoAssign: () => void;
  onCloseAll: () => void;
  onJoinRoom: (name: string) => void;
  onStartTimer: () => void;
  onResetTimer: () => void;
}) {
  const getTimerColor = (seconds: number) => {
    if (seconds <= 60) return 'text-red-400';
    if (seconds <= 180) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Global min timer across all rooms
  const globalMinTimer = rooms.length > 0 ? Math.min(...rooms.map(r => r.timerSeconds)) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Breakout Rooms</h3>
          <Badge variant="secondary" className="h-5 text-[10px] bg-violet-500/20 text-violet-300 border-violet-500/30 hover:bg-violet-500/20">
            {rooms.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          {rooms.length > 0 && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono ${getTimerColor(globalMinTimer)}`}>
              <Clock size={11} />
              {formatCountdown(globalMinTimer)}
            </div>
          )}
          <Button
            size="sm"
            onClick={onCreateRoom}
            disabled={rooms.length >= 8}
            className="h-7 text-xs bg-violet-600 hover:bg-violet-700 rounded-lg disabled:opacity-40"
          >
            <Plus size={12} className="mr-1" /> Create Room
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      {rooms.length > 0 && (
        <div className="px-3 py-2 border-b border-white/10 bg-white/[0.01] flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onAutoAssign}
            className="h-7 text-[11px] border-white/10 hover:bg-white/10 text-white/70 hover:text-white rounded-lg"
          >
            <Shuffle size={12} className="mr-1" /> Auto-assign
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={timerActive ? onResetTimer : onStartTimer}
            className="h-7 text-[11px] border-white/10 hover:bg-white/10 text-white/70 hover:text-white rounded-lg"
          >
            <Clock size={12} className="mr-1" /> {timerActive ? 'Reset Timer' : 'Start Timer'}
          </Button>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="destructive"
            onClick={onCloseAll}
            className="h-7 text-[11px] rounded-lg"
          >
            <X size={12} className="mr-1" /> Close All
          </Button>
        </div>
      )}

      {/* Rooms List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2.5">
          <AnimatePresence>
            {rooms.map((room) => {
              const participants = room.participantIds
                .map(id => mockParticipants.find(p => p.id === id))
                .filter(Boolean) as Participant[];

              return (
                <motion.div
                  key={room.id}
                  layout
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="border border-border/50 rounded-lg p-3 bg-gradient-to-r from-primary/5 to-transparent hover:shadow-md hover:shadow-primary/5 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex-1 min-w-0">
                      {editingRoomId === room.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            value={editingRoomName}
                            onChange={(e) => onSetEditingRoomName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') onRenameRoom(room.id);
                              if (e.key === 'Escape') onSetEditingRoomId(null);
                            }}
                            onBlur={() => onRenameRoom(room.id)}
                            autoFocus
                            className="bg-white/10 border border-white/20 rounded-md px-2 py-0.5 text-xs outline-none focus:border-violet-500/50 w-full"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => { onSetEditingRoomId(room.id); onSetEditingRoomName(room.name); }}
                          className="text-sm font-semibold text-left truncate hover:text-violet-300 transition-colors"
                        >
                          {room.name}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {/* Timer */}
                      <span className={`text-[11px] font-mono ${getTimerColor(room.timerSeconds)}`}>
                        {formatCountdown(room.timerSeconds)}
                      </span>
                      <button
                        onClick={() => onDeleteRoom(room.id)}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Participant avatar stack */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex -space-x-2">
                        {participants.slice(0, 4).map((p) => (
                          <Avatar key={p.id} className="w-7 h-7 ring-2 ring-slate-950">
                            <AvatarFallback className={`${p.color} text-white text-[9px] font-bold`}>{p.initials}</AvatarFallback>
                          </Avatar>
                        ))}
                        {participants.length > 4 && (
                          <div className="w-7 h-7 rounded-full bg-white/10 ring-2 ring-slate-950 flex items-center justify-center text-[9px] font-medium text-white/60">
                            +{participants.length - 4}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-white/40 ml-2.5">{participants.length} {participants.length === 1 ? 'person' : 'people'}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onJoinRoom(room.name)}
                      className="h-7 text-[11px] bg-white/10 hover:bg-white/20 text-white rounded-lg"
                    >
                      Join <ArrowRight size={12} className="ml-1" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {rooms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
                <LayoutGrid size={24} className="text-white/20" />
              </div>
              <p className="text-sm text-white/40 mb-1">No breakout rooms</p>
              <p className="text-[11px] text-white/20">Create a room to split participants into groups</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

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
