'use client';

import { useAppStore } from '@/store/app-store';
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, MessageSquare, Users,
  Hand, MoreHorizontal, Phone, Settings, Shield, CircleDot, Sparkles, Send, X,
  ChevronLeft, ArrowLeft, Maximize2, Minimize2, Copy, Check, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useState, useEffect, useRef, useCallback } from 'react';

interface ChatMessage {
  id: string;
  sender: string;
  initials: string;
  color: string;
  text: string;
  time: string;
  isSystem?: boolean;
  isAI?: boolean;
}

interface Participant {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: 'Host' | 'Co-host' | 'Participant';
  micOn: boolean;
  videoOn: boolean;
}

interface PollData {
  id: string;
  question: string;
  options: { label: string; votes: number; percentage: number }[];
  totalVotes: number;
}

const mockParticipants: Participant[] = [
  { id: '1', name: 'Alex Johnson', initials: 'AJ', color: 'bg-blue-500', role: 'Host', micOn: true, videoOn: true },
  { id: '2', name: 'Sarah Chen', initials: 'SC', color: 'bg-pink-500', role: 'Co-host', micOn: true, videoOn: true },
  { id: '3', name: 'Maya Patel', initials: 'MP', color: 'bg-green-500', role: 'Participant', micOn: false, videoOn: true },
  { id: '4', name: 'James Wilson', initials: 'JW', color: 'bg-orange-500', role: 'Participant', micOn: true, videoOn: false },
  { id: '5', name: 'Emily Zhang', initials: 'EZ', color: 'bg-violet-500', role: 'Participant', micOn: true, videoOn: true },
  { id: '6', name: 'David Kim', initials: 'DK', color: 'bg-cyan-500', role: 'Participant', micOn: false, videoOn: false },
  { id: '7', name: 'Lisa Brown', initials: 'LB', color: 'bg-rose-500', role: 'Participant', micOn: true, videoOn: true },
  { id: '8', name: 'Tom Garcia', initials: 'TG', color: 'bg-amber-500', role: 'Participant', micOn: false, videoOn: true },
];

const gridParticipants = mockParticipants.slice(0, 4);

const initialChatMessages: ChatMessage[] = [
  { id: 'sys-1', sender: 'System', initials: '', color: '', text: 'Meeting started by Alex Johnson', time: '10:00 AM', isSystem: true },
  { id: 'msg-1', sender: 'Sarah Chen', initials: 'SC', color: 'bg-pink-500', text: 'Hi everyone! Ready to start the sprint planning?', time: '10:01 AM' },
  { id: 'msg-2', sender: 'Maya Patel', initials: 'MP', color: 'bg-green-500', text: 'Yes, I have the updated backlog items ready.', time: '10:02 AM' },
  { id: 'msg-3', sender: 'James Wilson', initials: 'JW', color: 'bg-orange-500', text: 'Great. Let me share the velocity report from last sprint.', time: '10:03 AM' },
  { id: 'msg-4', sender: 'Emily Zhang', initials: 'EZ', color: 'bg-violet-500', text: 'Should we also discuss the tech debt items?', time: '10:04 AM' },
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
      { label: '9:00 AM', votes: 6, percentage: 55 },
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
  'Translate to French': '## Résumé de la réunion\n\nL\'\u00e9quipe a discuté de la planification du sprint pour le T4. Les sujets principaux incluaient la prioritisation du backlog, les améliorations de vélocité du dernier sprint (augmentation de 15%), et l\'allocation de la dette technique. L\'\u00e9quipe a convenu d\'allouer 20% de la capacité à la dette technique.',
  'Identify risks': '**Identified Risks:**\n\n1. **High** - Key engineer (David) on PTO next week during critical feature development\n2. **Medium** - Third-party API dependency may cause delays for authentication module\n3. **Medium** - Scope creep risk with 3 new feature requests from stakeholders\n4. **Low** - Testing environment capacity may need scaling for E2E tests',
};

export default function MeetingRoomPage() {
  const {
    meetingTitle, meetingSidebarTab, setMeetingSidebarTab,
    setCurrentView, currentMeetingId, user
  } = useAppStore();

  // Local state
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [chatInput, setChatInput] = useState('');
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiTyping, setAiTyping] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const aiEndRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    aiEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, aiTyping]);

  // Close more menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleCopyMeetingId = () => {
    navigator.clipboard?.writeText(currentMeetingId || 'alv-mtg-2024-001');
    setCopied(true);
    toast.success('Meeting ID copied!');
    setTimeout(() => setCopied(false), 2000);
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
    };
    setChatMessages(prev => [...prev, msg]);
    setChatInput('');
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
        text: aiResponses[suggestion] || 'I\'m analyzing the meeting content. Based on the discussion so far, here are my insights...',
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

  const toggleSidebar = (tab?: 'chat' | 'participants' | 'ai' | 'polls') => {
    if (tab && sidebarOpen && meetingSidebarTab === tab) {
      setSidebarOpen(false);
    } else if (tab) {
      setMeetingSidebarTab(tab);
      setSidebarOpen(true);
    } else {
      setSidebarOpen(prev => !prev);
    }
  };

  const toolbarButtons = [
    { icon: micOn ? <Mic size={20} /> : <MicOff size={20} />, active: micOn, activeColor: '', inactiveColor: 'text-red-400', label: micOn ? 'Mute' : 'Unmute', onClick: () => setMicOn(!micOn) },
    { icon: cameraOn ? <Video size={20} /> : <VideoOff size={20} />, active: cameraOn, activeColor: '', inactiveColor: 'text-red-400', label: cameraOn ? 'Stop Camera' : 'Start Camera', onClick: () => setCameraOn(!cameraOn) },
    { icon: screenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />, active: !screenSharing, activeColor: '', inactiveColor: 'text-green-400', label: screenSharing ? 'Stop Sharing' : 'Share Screen', onClick: () => { setScreenSharing(!screenSharing); toast(screenSharing ? 'Screen sharing stopped' : 'Screen sharing started'); } },
    { icon: <Hand size={20} />, active: handRaised, activeColor: '', inactiveColor: 'text-yellow-400', label: handRaised ? 'Lower Hand' : 'Raise Hand', onClick: () => setHandRaised(!handRaised) },
    { icon: <CircleDot size={20} />, active: !recording, activeColor: '', inactiveColor: 'text-red-500', label: recording ? 'Stop Recording' : 'Start Recording', onClick: () => { setRecording(!recording); toast(recording ? 'Recording stopped' : 'Recording started'); } },
    { icon: <MessageSquare size={20} />, active: meetingSidebarTab === 'chat' && sidebarOpen, activeColor: 'bg-white/20', inactiveColor: '', label: 'Chat', onClick: () => toggleSidebar('chat') },
    { icon: <Users size={20} />, active: meetingSidebarTab === 'participants' && sidebarOpen, activeColor: 'bg-white/20', inactiveColor: '', label: 'Participants', onClick: () => toggleSidebar('participants') },
    { icon: <Sparkles size={20} />, active: meetingSidebarTab === 'ai' && sidebarOpen, activeColor: 'bg-white/20', inactiveColor: '', label: 'AI Assistant', onClick: () => toggleSidebar('ai') },
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Host': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Co-host': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
    <div className="h-screen w-screen flex bg-slate-950 text-white overflow-hidden">
      {/* Main Meeting Area */}
      <div className="flex-1 relative flex flex-col">
        {/* Meeting Grid */}
        <div className="flex-1 relative">
          {/* ALVISION Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <span className="text-[12rem] font-black text-white/[0.03] tracking-widest select-none">ALVISION</span>
          </div>

          {/* Meeting Title Overlay - Top */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h2 className="text-sm font-semibold">{meetingTitle || 'Sprint Planning - Q4'}</h2>
                {recording && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-medium text-red-400">REC</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-xs">
                <span className="text-white/60">ID:</span>
                <span className="font-mono">{currentMeetingId || 'alv-mtg-2024-001'}</span>
                <button onClick={handleCopyMeetingId} className="text-white/60 hover:text-white transition-colors">
                  {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                </button>
              </div>
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-xs font-mono">
                {formatTime(elapsed)}
              </div>
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-xs">
                <Users size={12} /> 8
              </div>
              <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 text-xs text-green-400">
                <Shield size={12} /> E2E
              </div>
            </div>
          </div>

          {/* Participant Grid */}
          <div className="relative z-10 h-full flex items-center justify-center p-4 pt-16 pb-24">
            <div className={`grid gap-3 w-full max-w-5xl h-full ${
              gridParticipants.length === 1 ? 'grid-cols-1' :
              gridParticipants.length === 2 ? 'grid-cols-2' :
              'grid-cols-1 sm:grid-cols-2'
            }`}>
              {gridParticipants.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative rounded-2xl bg-slate-900 overflow-hidden flex items-center justify-center min-h-[200px] sm:min-h-[250px] ${
                    i === 0 ? 'ring-2 ring-blue-500/50' : 'ring-1 ring-white/10'
                  }`}
                >
                  {/* Avatar Placeholder */}
                  <div className="flex flex-col items-center gap-3">
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full ${p.color} flex items-center justify-center text-xl sm:text-2xl font-bold text-white`}>
                      {p.initials}
                    </div>
                  </div>

                  {/* Name Overlay - Bottom */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{p.name}</span>
                      {p.role === 'Host' && (
                        <Badge variant="secondary" className="text-[10px] h-4 bg-blue-500/20 text-blue-300 border-0">Host</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {p.micOn ? (
                        <Mic size={14} className="text-green-400" />
                      ) : (
                        <MicOff size={14} className="text-red-400" />
                      )}
                      {!p.videoOn && (
                        <VideoOff size={14} className="text-white/50" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Toolbar */}
        <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-center pb-4 px-4">
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-lg rounded-2xl p-2">
            {toolbarButtons.map((btn, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <button
                    onClick={btn.onClick}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                      btn.inactiveColor && !btn.active
                        ? btn.inactiveColor + ' bg-white/5'
                        : btn.activeColor || 'hover:bg-white/20'
                    } ${btn.active ? '' : 'bg-white/5'}`}
                  >
                    {btn.icon}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-slate-800 text-white border-slate-700 text-xs">
                  {btn.label}
                </TooltipContent>
              </Tooltip>
            ))}

            {/* More Button */}
            <div className="relative" ref={moreMenuRef}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-slate-800 text-white border-slate-700 text-xs">
                  More options
                </TooltipContent>
              </Tooltip>

              <AnimatePresence>
                {showMoreMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute bottom-full right-0 mb-2 w-48 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl z-50"
                  >
                    {['Settings', 'Reactions', 'Whiteboard', 'Breakout Rooms', 'Polls'].map(item => (
                      <button
                        key={item}
                        onClick={() => {
                          if (item === 'Polls') toggleSidebar('polls');
                          setShowMoreMenu(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                      >
                        {item}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Separator orientation="vertical" className="h-8 bg-white/10 mx-1" />

            {/* Leave Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLeaveMeeting}
                  className="h-11 px-5 rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <Phone size={18} className="rotate-[135deg]" />
                  <span className="hidden sm:inline">Leave</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-slate-800 text-white border-slate-700 text-xs">
                Leave meeting
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 384, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="h-full bg-slate-900 border-l border-white/10 flex flex-col overflow-hidden shrink-0 max-sm:w-full"
          >
            {/* Sidebar Tabs */}
            <div className="border-b border-white/10 px-2 pt-2">
              <div className="flex items-center justify-between mb-2">
                <Tabs value={meetingSidebarTab} onValueChange={(v) => setMeetingSidebarTab(v as 'chat' | 'participants' | 'ai' | 'polls')} className="w-full">
                  <TabsList className="bg-slate-800 w-full h-9">
                    <TabsTrigger value="chat" className="flex-1 text-xs data-[state=active]:bg-slate-700">Chat</TabsTrigger>
                    <TabsTrigger value="participants" className="flex-1 text-xs data-[state=active]:bg-slate-700">People</TabsTrigger>
                    <TabsTrigger value="ai" className="flex-1 text-xs data-[state=active]:bg-slate-700">AI</TabsTrigger>
                    <TabsTrigger value="polls" className="flex-1 text-xs data-[state=active]:bg-slate-700">Polls</TabsTrigger>
                  </TabsList>
                </Tabs>
                <button onClick={() => setSidebarOpen(false)} className="ml-1 w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center shrink-0">
                  <X size={14} className="text-white/60" />
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {meetingSidebarTab === 'chat' && (
                <div className="flex flex-col h-full">
                  <ScrollArea className="flex-1 max-h-[calc(100vh-12rem)]">
                    <div className="p-3 space-y-3">
                      {chatMessages.map((msg) => (
                        <div key={msg.id}>
                          {msg.isSystem ? (
                            <div className="flex items-center gap-2 py-1">
                              <div className="flex-1 h-px bg-white/10" />
                              <span className="text-[10px] text-white/40 px-2">{msg.text}</span>
                              <div className="flex-1 h-px bg-white/10" />
                            </div>
                          ) : (
                            <div className="flex gap-2.5">
                              <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                                <AvatarFallback className={`${msg.color} text-white text-[10px] font-bold`}>{msg.initials}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-xs font-semibold">{msg.sender}</span>
                                  <span className="text-[10px] text-white/30">{msg.time}</span>
                                </div>
                                <p className="text-sm text-white/80 mt-0.5 break-words">{msg.text}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="p-3 border-t border-white/10">
                    <div className="flex gap-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                        placeholder="Type a message..."
                        className="bg-slate-800 border-white/10 text-sm h-9 placeholder:text-white/30"
                      />
                      <Button size="icon" onClick={handleSendChat} className="h-9 w-9 shrink-0 bg-blue-600 hover:bg-blue-700">
                        <Send size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {meetingSidebarTab === 'participants' && (
                <div className="flex flex-col h-full">
                  <div className="px-4 py-3 border-b border-white/10">
                    <h3 className="text-sm font-semibold">{mockParticipants.length} Participants</h3>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-2 space-y-0.5">
                      {mockParticipants.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors">
                          <Avatar className="w-8 h-8 shrink-0">
                            <AvatarFallback className={`${p.color} text-white text-xs font-bold`}>{p.initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">{p.name}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getRoleBadge(p.role)}`}>{p.role}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {p.micOn ? <Mic size={14} className="text-green-400" /> : <MicOff size={14} className="text-red-400" />}
                            {p.videoOn ? <Video size={14} className="text-green-400" /> : <VideoOff size={14} className="text-white/30" />}
                            {p.role !== 'Host' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10">
                                    <MicOff size={12} className="text-white/40" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="bg-slate-800 text-white border-slate-700 text-xs">Mute</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {meetingSidebarTab === 'ai' && (
                <div className="flex flex-col h-full">
                  <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                    <Sparkles size={16} className="text-violet-400" />
                    <h3 className="text-sm font-semibold">AI Meeting Assistant</h3>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-3 space-y-3">
                      {aiMessages.length === 0 && !aiTyping && (
                        <div className="py-6">
                          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-3">
                            <Sparkles size={24} className="text-violet-400" />
                          </div>
                          <p className="text-center text-sm text-white/50 mb-4">Ask me anything about this meeting</p>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {aiSuggestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                onClick={() => handleAISuggestion(suggestion)}
                                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition-colors"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {aiMessages.map((msg) => (
                        <div key={msg.id} className={`flex gap-2.5 ${msg.isAI ? 'border-l-2 border-violet-500/50 pl-3' : ''}`}>
                          <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                            <AvatarFallback className={`${msg.color} text-white text-[10px] font-bold`}>{msg.initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs font-semibold">{msg.sender}</span>
                              <span className="text-[10px] text-white/30">{msg.time}</span>
                            </div>
                            <div className="text-sm text-white/80 mt-1 break-words whitespace-pre-wrap leading-relaxed">
                              {msg.text}
                            </div>
                          </div>
                        </div>
                      ))}

                      {aiTyping && (
                        <div className="flex gap-2.5 border-l-2 border-violet-500/50 pl-3">
                          <Avatar className="w-7 h-7 shrink-0">
                            <AvatarFallback className="bg-violet-500 text-white text-[10px] font-bold">AI</AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-1 py-2">
                            <div className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      )}

                      {aiMessages.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {aiSuggestions.map((suggestion) => (
                            <button
                              key={suggestion}
                              onClick={() => handleAISuggestion(suggestion)}
                              className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}

                      <div ref={aiEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="p-3 border-t border-white/10">
                    <div className="flex gap-2">
                      <Input
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendAI()}
                        placeholder="Ask AI something..."
                        className="bg-slate-800 border-white/10 text-sm h-9 placeholder:text-white/30"
                      />
                      <Button size="icon" onClick={handleSendAI} className="h-9 w-9 shrink-0 bg-violet-600 hover:bg-violet-700">
                        <Send size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {meetingSidebarTab === 'polls' && (
                <div className="flex flex-col h-full">
                  <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Polls</h3>
                    <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700">
                      <Plus size={12} className="mr-1" /> Create Poll
                    </Button>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-3 space-y-4">
                      {mockPolls.map((poll) => (
                        <div key={poll.id} className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                          <h4 className="text-sm font-semibold mb-3">{poll.question}</h4>
                          <div className="space-y-2.5">
                            {poll.options.map((opt) => (
                              <div key={opt.label} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span>{opt.label}</span>
                                  <span className="text-white/50">{opt.votes} votes ({opt.percentage}%)</span>
                                </div>
                                <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-blue-500 transition-all"
                                    style={{ width: `${opt.percentage}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-white/30 mt-3">{poll.totalVotes} total votes</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </TooltipProvider>
  );
}
