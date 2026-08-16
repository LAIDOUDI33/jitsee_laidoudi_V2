'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Copy, Download, Languages, Settings, Check, X, FileText,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────
interface TranscriptEntry {
  id: number;
  speaker: string;
  initials: string;
  color: string;
  time: string;
  seconds: number;
  text: string;
}

// ─── Mock Data (20+ entries) ─────────────────────────────
const MOCK_TRANSCRIPTS: TranscriptEntry[] = [
  { id: 1, speaker: 'Alex Chen', initials: 'AC', color: 'bg-violet-500', time: '00:01', seconds: 1, text: 'Good morning everyone. Let\'s get started with our sprint planning session.' },
  { id: 2, speaker: 'Sarah Kim', initials: 'SK', color: 'bg-emerald-500', time: '00:05', seconds: 5, text: 'Morning! I\'ve prepared the backlog items we need to prioritize today.' },
  { id: 3, speaker: 'Alex Chen', initials: 'AC', color: 'bg-violet-500', time: '00:08', seconds: 8, text: 'Perfect. How many story points do we have in total this sprint?' },
  { id: 4, speaker: 'Sarah Kim', initials: 'SK', color: 'bg-emerald-500', time: '00:12', seconds: 12, text: 'We\'re looking at about 68 points across 14 user stories.' },
  { id: 5, speaker: 'Marcus Rivera', initials: 'MR', color: 'bg-amber-500', time: '00:16', seconds: 16, text: 'That\'s manageable. The team velocity has been around 60 to 70 points per sprint.' },
  { id: 6, speaker: 'Priya Patel', initials: 'PP', color: 'bg-sky-500', time: '00:20', seconds: 20, text: 'I have a concern about the authentication refactor. It might need more testing time than estimated.' },
  { id: 7, speaker: 'Alex Chen', initials: 'AC', color: 'bg-violet-500', time: '00:24', seconds: 24, text: 'Good point, Priya. Should we split that into two smaller stories?' },
  { id: 8, speaker: 'Priya Patel', initials: 'PP', color: 'bg-sky-500', time: '00:28', seconds: 28, text: 'Yes, I think splitting the backend migration and the frontend integration makes sense.' },
  { id: 9, speaker: 'Marcus Rivera', initials: 'MR', color: 'bg-amber-500', time: '00:33', seconds: 33, text: 'Agreed. I can take the backend migration. It aligns with my current work on the API layer.' },
  { id: 10, speaker: 'Sarah Kim', initials: 'SK', color: 'bg-emerald-500', time: '00:37', seconds: 37, text: 'I\'ll update the board and create the two new stories after this meeting.' },
  { id: 11, speaker: 'Alex Chen', initials: 'AC', color: 'bg-violet-500', time: '00:41', seconds: 41, text: 'Great. Now let\'s talk about the AI transcription feature. What\'s the status there?' },
  { id: 12, speaker: 'Jordan Lee', initials: 'JL', color: 'bg-rose-500', time: '00:45', seconds: 45, text: 'The real-time transcription pipeline is working. We\'re now fine-tuning the speaker diarization model.' },
  { id: 13, speaker: 'Alex Chen', initials: 'AC', color: 'bg-violet-500', time: '00:50', seconds: 50, text: 'Excellent. When can we expect the accuracy to hit the 95% threshold?' },
  { id: 14, speaker: 'Jordan Lee', initials: 'JL', color: 'bg-rose-500', time: '00:54', seconds: 54, text: 'We\'re currently at 91%. I estimate we\'ll reach 95% by end of next week with the new training data.' },
  { id: 15, speaker: 'Marcus Rivera', initials: 'MR', color: 'bg-amber-500', time: '00:59', seconds: 59, text: 'That\'s cutting it close for the release. Do we need additional compute resources?' },
  { id: 16, speaker: 'Jordan Lee', initials: 'JL', color: 'bg-rose-500', time: '01:03', seconds: 63, text: 'I requested two more GPU instances. If approved, we can parallelize the training.' },
  { id: 17, speaker: 'Sarah Kim', initials: 'SK', color: 'bg-emerald-500', time: '01:08', seconds: 68, text: 'I\'ll approve that right away. Let\'s not bottleneck the AI features.' },
  { id: 18, speaker: 'Priya Patel', initials: 'PP', color: 'bg-sky-500', time: '01:12', seconds: 72, text: 'One more thing — the mobile app needs the updated WebSocket protocol for live captions.' },
  { id: 19, speaker: 'Alex Chen', initials: 'AC', color: 'bg-violet-500', time: '01:16', seconds: 76, text: 'Right. Can you coordinate with the mobile team to align on the protocol changes?' },
  { id: 20, speaker: 'Priya Patel', initials: 'PP', color: 'bg-sky-500', time: '01:20', seconds: 80, text: 'Already on it. I have a sync scheduled with them tomorrow morning.' },
  { id: 21, speaker: 'Marcus Rivera', initials: 'MR', color: 'bg-amber-500', time: '01:25', seconds: 85, text: 'Let\'s also discuss the deployment timeline. We need to ship the beta by Friday.' },
  { id: 22, speaker: 'Alex Chen', initials: 'AC', color: 'bg-violet-500', time: '01:30', seconds: 90, text: 'The CI pipeline is green. We\'re on track for Friday deployment to staging.' },
  { id: 23, speaker: 'Sarah Kim', initials: 'SK', color: 'bg-emerald-500', time: '01:35', seconds: 95, text: 'QA has the test plan ready. They\'ll start regression testing on Thursday.' },
  { id: 24, speaker: 'Jordan Lee', initials: 'JL', color: 'bg-rose-500', time: '01:40', seconds: 100, text: 'I\'ll make sure the transcription service is deployed to staging by Wednesday evening.' },
  { id: 25, speaker: 'Alex Chen', initials: 'AC', color: 'bg-violet-500', time: '01:45', seconds: 105, text: 'Sounds like a solid plan. Let\'s finalize the sprint commitment and move forward.' },
];

// ─── Custom Scrollbar Styles (injected via <style>) ──────
const scrollbarCSS = `
  .transcription-scroll::-webkit-scrollbar { width: 5px; }
  .transcription-scroll::-webkit-scrollbar-track { background: transparent; }
  .transcription-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
  .transcription-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
`;

// ─── Component ───────────────────────────────────────────
export default function LiveTranscriptionPanel() {
  const [visibleEntries, setVisibleEntries] = useState<TranscriptEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Simulate real-time entries appearing one by one
  useEffect(() => {
    let index = 0;
    const addNext = () => {
      if (index < MOCK_TRANSCRIPTS.length) {
        setVisibleEntries(prev => [...prev, MOCK_TRANSCRIPTS[index]]);
        index++;
        // Random interval between 2-3 seconds
        const delay = 2000 + Math.random() * 1000;
        timerRef.current = setTimeout(addNext, delay);
      } else {
        setIsLive(false);
      }
    };
    timerRef.current = setTimeout(addNext, 1500); // Start after 1.5s
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Auto-scroll to latest entry
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleEntries]);

  // Extract unique speakers for filter
  const uniqueSpeakers = useMemo(() => {
    const speakers = new Map<string, { initials: string; color: string }>();
    MOCK_TRANSCRIPTS.forEach(t => {
      if (!speakers.has(t.speaker)) {
        speakers.set(t.speaker, { initials: t.initials, color: t.color });
      }
    });
    return speakers;
  }, []);

  const [speakerFilter, setSpeakerFilter] = useState<string>('all');

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return visibleEntries.filter(entry => {
      const matchesSearch = searchQuery === '' ||
        entry.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.speaker.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpeaker = speakerFilter === 'all' || entry.speaker === speakerFilter;
      return matchesSearch && matchesSpeaker;
    });
  }, [visibleEntries, searchQuery, speakerFilter]);

  // Copy full transcript
  const handleCopy = useCallback(async () => {
    const text = visibleEntries
      .map(e => `[${e.time}] ${e.speaker}: ${e.text}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Transcript copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy transcript');
    }
  }, [visibleEntries]);

  // Download as text
  const handleDownload = useCallback(() => {
    const text = visibleEntries
      .map(e => `[${e.time}] ${e.speaker}: ${e.text}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Transcript downloaded');
  }, [visibleEntries]);

  return (
    <>
      <style>{scrollbarCSS}</style>
      <motion.div
        initial={{ opacity: 0, x: 40, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 40, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="absolute bottom-24 right-4 z-50 w-96 max-h-[60vh] rounded-xl overflow-hidden"
        style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-semibold text-white">Live Transcription</span>
            {isLive && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30 font-medium">
                LIVE
              </span>
            )}
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-white/60 border border-white/10 font-medium flex items-center gap-1">
              <Languages size={10} />
              English
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            {/* Search */}
            <button
              onClick={() => { setShowSearch(!showSearch); if (showSearch) setSearchQuery(''); }}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                showSearch ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
              title="Search transcript"
            >
              <Search size={14} />
            </button>
            {/* Copy */}
            <button
              onClick={handleCopy}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              title="Copy full transcript"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
            {/* Download */}
            <button
              onClick={handleDownload}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              title="Download transcript"
            >
              <Download size={14} />
            </button>
            {/* Timestamp Toggle */}
            <button
              onClick={() => setShowTimestamps(!showTimestamps)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                showTimestamps ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
              title="Toggle timestamps"
            >
              <FileText size={14} />
            </button>
            {/* Settings */}
            <button
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              title="Transcription settings"
            >
              <Settings size={14} />
            </button>
          </div>
        </div>

        {/* ── Search Bar ── */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-3 py-2 border-b border-white/10">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search transcript..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full pl-8 pr-8 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Speaker Filter ── */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-white/10 overflow-x-auto">
          <button
            onClick={() => setSpeakerFilter('all')}
            className={`shrink-0 text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors ${
              speakerFilter === 'all'
                ? 'bg-white/15 text-white border border-white/20'
                : 'text-white/40 hover:text-white/70 border border-transparent hover:border-white/10'
            }`}
          >
            All
          </button>
          {Array.from(uniqueSpeakers.entries()).map(([name, info]) => (
            <button
              key={name}
              onClick={() => setSpeakerFilter(name)}
              className={`shrink-0 text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors flex items-center gap-1 ${
                speakerFilter === name
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'text-white/40 hover:text-white/70 border border-transparent hover:border-white/10'
              }`}
            >
              <span className={`w-3.5 h-3.5 rounded-full ${info.color} flex items-center justify-center text-[7px] text-white font-bold`}>  
                {info.initials[0]}
              </span>
              {name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* ── Transcript Entries ── */}
        <div
          ref={scrollRef}
          className="transcription-scroll overflow-y-auto p-3 space-y-2"
          style={{ maxHeight: 'calc(60vh - 140px)' }}
        >
          <AnimatePresence initial={false}>
            {filteredEntries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' as const }}
                className="flex gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-colors group"
              >
                {/* Speaker Avatar */}
                <div
                  className={`shrink-0 w-7 h-7 rounded-full ${entry.color} flex items-center justify-center text-[10px] text-white font-bold mt-0.5`}
                >
                  {entry.initials}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-white/90">{entry.speaker}</span>
                    {showTimestamps && (
                      <span className="text-[10px] text-white/30 font-mono">{entry.time}</span>
                    )}
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">{entry.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty state for filtered results */}
          {filteredEntries.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-white/30">
              <Search size={24} className="mb-2" />
              <p className="text-xs">No matching entries found</p>
            </div>
          )}

          {/* Loading indicator */}
          {isLive && filteredEntries.length > 0 && (
            <div className="flex items-center gap-2 py-2 justify-center">
              <div className="flex gap-1">
                <span className="w-1 h-1 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[10px] text-white/30">Listening...</span>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-4 py-2 border-t border-white/10 flex items-center justify-between">
          <span className="text-[10px] text-white/30">{visibleEntries.length} entries</span>
          <span className="text-[10px] text-white/30">{isLive ? 'Transcribing...' : 'Transcription ended'}</span>
        </div>
      </motion.div>
    </>
  );
}
