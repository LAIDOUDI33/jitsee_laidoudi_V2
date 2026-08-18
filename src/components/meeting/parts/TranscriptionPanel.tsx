'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Copy, Check, X, Loader2, Mic, MicOff, Languages,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useTranscription, SPEECH_LANGUAGES, type TranscriptEntry } from '@/hooks/useTranscription';
import { useAppStore } from '@/store/app-store';

// ─── Custom Scrollbar Styles ──────────────────────────────────────
const scrollbarCSS = `
  .transcription-panel-scroll::-webkit-scrollbar { width: 5px; }
  .transcription-panel-scroll::-webkit-scrollbar-track { background: transparent; }
  .transcription-panel-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 10px; }
  .transcription-panel-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
`;

// ─── Helpers ──────────────────────────────────────────────────────
function formatTimestamp(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  const s = date.getSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// ─── Component ─────────────────────────────────────────────────────
export default function TranscriptionPanel() {
  const {
    isTranscribing,
    isStarting,
    transcript,
    interimTranscript,
    error,
    language,
    setLanguage,
    startTranscription,
    stopTranscription,
  } = useTranscription();

  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') || scrollRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [transcript, interimTranscript]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return transcript;
    const q = searchQuery.toLowerCase();
    return transcript.filter(
      (e) =>
        e.text.toLowerCase().includes(q) ||
        e.speaker.toLowerCase().includes(q),
    );
  }, [transcript, searchQuery]);

  // Copy all
  const handleCopyAll = useCallback(async () => {
    const text = transcript
      .map((e) => `[${formatTimestamp(e.timestamp)}] ${e.speaker}: ${e.text}`)
      .join('\n');
    if (!text) {
      toast.info('No transcript to copy');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Transcript copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy transcript');
    }
  }, [transcript]);

  // Toggle transcription
  const handleToggle = useCallback(() => {
    if (isTranscribing || isStarting) {
      stopTranscription();
    } else {
      startTranscription();
    }
  }, [isTranscribing, isStarting, startTranscription, stopTranscription]);

  return (
    <>
      <style>{scrollbarCSS}</style>
      <div className="flex flex-col h-full">
        {/* ── Header ── */}
        <div className="shrink-0 border-b border-white/10 bg-white/[0.03] backdrop-blur-xl px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              {isTranscribing ? (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
              ) : (
                <Mic size={14} className="text-white/50" />
              )}
              <h3 className="text-sm font-semibold text-white">Live Transcription</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              disabled={isStarting}
              className={`h-8 px-3 text-xs gap-1.5 rounded-lg transition-all ${
                isTranscribing
                  ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 hover:text-red-200'
                  : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 hover:text-emerald-200'
              }`}
            >
              {isStarting ? (
                <Loader2 size={13} className="animate-spin" />
              ) : isTranscribing ? (
                <MicOff size={13} />
              ) : (
                <Mic size={13} />
              )}
              {isStarting ? 'Starting…' : isTranscribing ? 'Stop' : 'Start'}
            </Button>
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-2">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="h-7 w-[130px] text-[11px] bg-white/5 border-white/10 text-white/80 rounded-lg">
                <Languages size={11} className="mr-1 text-white/40" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                {Object.entries(SPEECH_LANGUAGES).map(([code, name]) => (
                  <SelectItem key={code} value={code} className="text-xs text-white/80">
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/30" />
              <Input
                placeholder="Search…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 pl-7 pr-7 text-[11px] bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  <X size={11} />
                </button>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyAll}
              disabled={transcript.length === 0}
              className="h-7 w-7 p-0 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
              title="Copy all transcript"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </Button>
          </div>
        </div>

        {/* ── Error ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-red-300 text-xs">
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Transcript Area ── */}
        <div ref={scrollRef} className="flex-1 overflow-hidden">
          <ScrollArea className="h-full transcription-panel-scroll">
            <div className="px-4 py-3 space-y-1">
              {/* Starting skeleton */}
              {isStarting && (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-4 w-32 bg-white/10 rounded" />
                  <Skeleton className="h-3 w-full bg-white/5 rounded" />
                  <Skeleton className="h-3 w-4/5 bg-white/5 rounded" />
                </div>
              )}

              {/* Transcript entries */}
              <AnimatePresence initial={false}>
                {filteredEntries.map((entry: TranscriptEntry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' as const }}
                    className="py-1.5 group"
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-semibold text-emerald-400">
                        {entry.speaker}
                      </span>
                      <span className="text-[10px] text-white/25 font-mono">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed pl-0.5">
                      {entry.text}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Interim (in-progress) text */}
              {interimTranscript && isTranscribing && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-white/40 italic leading-relaxed py-1"
                >
                  {interimTranscript}
                </motion.p>
              )}

              {/* Listening indicator */}
              {isTranscribing && !interimTranscript && !isStarting && (
                <div className="flex items-center gap-2 py-3 justify-center">
                  <span className="w-1 h-1 rounded-full bg-emerald-400/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 rounded-full bg-emerald-400/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 rounded-full bg-emerald-400/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[10px] text-white/30">Listening…</span>
                </div>
              )}

              {/* Empty state */}
              {!isTranscribing && !isStarting && transcript.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-white/25">
                  <Mic size={28} className="mb-3" />
                  <p className="text-xs font-medium mb-1">No transcription yet</p>
                  <p className="text-[10px]">Click Start to begin live transcription</p>
                </div>
              )}

              {/* No search results */}
              {searchQuery && filteredEntries.length === 0 && transcript.length > 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-white/25">
                  <Search size={20} className="mb-2" />
                  <p className="text-[11px]">No matching entries</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 border-t border-white/10 px-4 py-2 flex items-center justify-between">
          <span className="text-[10px] text-white/25">
            {transcript.length} {transcript.length === 1 ? 'entry' : 'entries'}
          </span>
          <span className="text-[10px] text-white/25">
            {isTranscribing ? (
              <span className="flex items-center gap-1 text-emerald-400/70">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Transcribing
              </span>
            ) : (
              'Paused'
            )}
          </span>
        </div>
      </div>
    </>
  );
}
