'use client';

import { useState, useCallback, useEffect } from 'react';
import { BarChart3, CheckCircle2, Plus, X, Square, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { authFetch } from '@/lib/api';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { type PollData } from './meeting-data';

// ─── Types ─────────────────────────────────────────────────────
interface APIPollOption {
  label: string;
  votes: number;
  percentage: number;
}

interface APIPoll {
  id: string;
  meetingId: string;
  question: string;
  options: APIPollOption[];
  totalVotes: number;
  status: string;
  multiSelect: boolean;
  createdBy: string;
  createdAt: string;
  userVoted?: boolean;
  userVotedOptions?: string[];
}

// ─── Props ─────────────────────────────────────────────────────
export interface PollsPanelProps {
  displayPolls: PollData[];
  onVotePoll: (pollId: string, optionLabel: string) => void;
  onCreatePoll: (config: { question: string; options: string[] }) => void;
  onOpenPollBuilder: () => void;
}

// ─── Component ─────────────────────────────────────────────────
export default function PollsPanel({
  displayPolls,
  onVotePoll,
}: PollsPanelProps) {
  const { user, currentMeetingId } = useAppStore();
  const isHost = user?.role === 'host' || user?.role === 'cohost' || user?.role === 'superadmin' || user?.role === 'orgadmin';

  const [createOpen, setCreateOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [optList, setOptList] = useState<string[]>(['', '']);
  const [multiSelect, setMultiSelect] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiPolls, setApiPolls] = useState<APIPoll[]>([]);
  const [votedPolls, setVotedPolls] = useState<Record<string, string[]>>({});
  const [endingPolls, setEndingPolls] = useState<Set<string>>(new Set());

  // Load API polls on mount or meeting change
  useEffect(() => {
    if (!currentMeetingId) return;
    setLoading(true);
    authFetch(`/api/v1/polls?meetingId=${currentMeetingId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setApiPolls(data.data.polls);
          // Restore user vote state from API
          const voteMap: Record<string, string[]> = {};
          for (const p of data.data.polls) {
            if (p.userVoted && p.userVotedOptions) {
              voteMap[p.id] = p.userVotedOptions;
            }
          }
          setVotedPolls(voteMap);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentMeetingId]);

  // Add option input
  const addOption = useCallback(() => {
    if (optList.length < 6) setOptList(prev => [...prev, '']);
  }, [optList.length]);

  // Remove option input
  const removeOption = useCallback((idx: number) => {
    if (optList.length <= 2) return;
    setOptList(prev => prev.filter((_, i) => i !== idx));
  }, [optList.length]);

  // Update option text
  const updateOption = useCallback((idx: number, value: string) => {
    setOptList(prev => prev.map((o, i) => (i === idx ? value : o)));
  }, []);

  // Create poll via API
  const handleCreate = useCallback(async () => {
    const trimmed = question.trim();
    const validOpts = optList.map(o => o.trim()).filter(Boolean);
    if (!trimmed) { toast.error('Please enter a question'); return; }
    if (validOpts.length < 2) { toast.error('At least 2 options are required'); return; }

    setCreating(true);
    try {
      const res = await authFetch('/api/v1/polls', {
        method: 'POST',
        body: JSON.stringify({
          meetingId: currentMeetingId,
          question: trimmed,
          options: validOpts,
          multiSelect,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setApiPolls(prev => [data.data.poll, ...prev]);
        setCreateOpen(false);
        setQuestion('');
        setOptList(['', '']);
        setMultiSelect(false);
        toast.success('Poll created!');
      } else {
        toast.error(data.error?.message || 'Failed to create poll');
      }
    } catch {
      toast.error('Failed to create poll');
    } finally {
      setCreating(false);
    }
  }, [question, optList, multiSelect, currentMeetingId]);

  // Vote on a poll via API
  const handleVote = useCallback(async (poll: APIPoll, optionIndex: number) => {
    if (votedPolls[poll.id]) return;

    const existing = votedPolls[poll.id] || [];
    let newIndices: number[];

    if (poll.multiSelect) {
      // Toggle selection
      if (existing.includes(poll.options[optionIndex].label)) {
        // This shouldn't happen since votedPolls means already submitted
        return;
      }
      newIndices = [...existing, optionIndex];
    } else {
      newIndices = [optionIndex];
    }

    try {
      const res = await authFetch('/api/v1/polls', {
        method: 'PUT',
        body: JSON.stringify({ pollId: poll.id, optionIndices: newIndices }),
      });
      const data = await res.json();
      if (data.success) {
        setApiPolls(prev => prev.map(p => p.id === poll.id ? data.data.poll : p));
        setVotedPolls(prev => ({
          ...prev,
          [poll.id]: newIndices.map(i => poll.options[i].label),
        }));
        toast.success('Vote recorded!');
      } else {
        toast.error(data.error?.message || 'Failed to vote');
      }
    } catch {
      toast.error('Failed to vote');
    }
  }, [votedPolls]);

  // End a poll
  const handleEndPoll = useCallback(async (pollId: string) => {
    setEndingPolls(prev => new Set(prev).add(pollId));
    try {
      const res = await authFetch('/api/v1/polls', {
        method: 'PATCH',
        body: JSON.stringify({ pollId }),
      });
      const data = await res.json();
      if (data.success) {
        setApiPolls(prev => prev.map(p => p.id === pollId ? data.data.poll : p));
        toast.success('Poll ended');
      } else {
        toast.error(data.error?.message || 'Failed to end poll');
      }
    } catch {
      toast.error('Failed to end poll');
    } finally {
      setEndingPolls(prev => {
        const next = new Set(prev);
        next.delete(pollId);
        return next;
      });
    }
  }, []);

  // Merge: use API polls if available, otherwise use WS displayPolls
  const hasApiPolls = apiPolls.length > 0;
  const pollsToShow = hasApiPolls
    ? apiPolls.map(p => ({
        id: p.id,
        question: p.question,
        options: p.options.map(o => ({
          label: o.label,
          votes: o.votes,
          percentage: o.percentage,
          voted: votedPolls[p.id]?.includes(o.label) || false,
        })),
        totalVotes: p.totalVotes,
        _status: p.status,
        _multiSelect: p.multiSelect,
      }))
    : displayPolls.map(p => ({
        ...p,
        _status: 'active' as const,
        _multiSelect: false as const,
      }));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Polls</h3>
          <p className="text-[10px] text-white/30">Vote and create polls</p>
        </div>
        {isHost && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 rounded-lg gap-1">
                <Plus size={12} /> Create
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base">Create Poll</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {/* Question */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/70">Question</label>
                  <Input
                    placeholder="e.g. What should we prioritize next?"
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    maxLength={500}
                  />
                </div>

                {/* Options */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-white/70">Options</label>
                    <span className="text-[10px] text-white/40">{optList.length}/6</span>
                  </div>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {optList.map((opt, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-2"
                        >
                          <span className="text-xs font-mono text-teal-400 w-5 shrink-0">{idx + 1}.</span>
                          <Input
                            placeholder={`Option ${idx + 1}`}
                            value={opt}
                            onChange={e => updateOption(idx, e.target.value)}
                            className="flex-1 h-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
                            maxLength={200}
                          />
                          {optList.length > 2 && (
                            <button
                              onClick={() => removeOption(idx)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  {optList.length < 6 && (
                    <button
                      onClick={addOption}
                      className="w-full h-8 rounded-lg border border-dashed border-white/10 text-xs text-white/40 hover:text-teal-400 hover:border-teal-500/30 hover:bg-teal-500/5 transition-colors"
                    >
                      + Add option
                    </button>
                  )}
                </div>

                {/* Multi-select toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div>
                    <p className="text-sm font-medium">Allow multiple choices</p>
                    <p className="text-[10px] text-white/40">Participants can select more than one option</p>
                  </div>
                  <button
                    onClick={() => setMultiSelect(!multiSelect)}
                    className={`relative w-10 h-6 rounded-full transition-colors ${multiSelect ? 'bg-amber-500' : 'bg-white/10'}`}
                  >
                    <motion.div
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
                      animate={{ left: multiSelect ? 20 : 4 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <DialogClose asChild>
                  <Button variant="ghost" className="text-white/60">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleCreate}
                  disabled={creating}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                >
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Create Poll
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Poll List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {loading && (
            <div className="py-10 flex items-center justify-center">
              <Loader2 size={20} className="animate-spin text-white/30" />
            </div>
          )}

          {!loading && pollsToShow.length === 0 && (
            <div className="py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                <BarChart3 size={24} className="text-white/20" />
              </div>
              <p className="text-sm text-white/40 mb-1">No polls yet</p>
              <p className="text-[11px] text-white/20">Create a poll to gather feedback</p>
            </div>
          )}

          {pollsToShow.map((poll) => {
            const isEnded = (poll as Record<string, unknown>)._status === 'ended';
            const isMulti = (poll as Record<string, unknown>)._multiSelect as boolean;
            const hasVoted = !!votedPolls[poll.id];
            const apiPoll = apiPolls.find(ap => ap.id === poll.id);
            const isEnding = endingPolls.has(poll.id);

            return (
              <motion.div
                key={poll.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors"
              >
                {/* Poll header */}
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-semibold flex-1 mr-2">{poll.question}</h4>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isMulti && (
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-amber-500/10 text-amber-400 border-amber-500/20">
                        Multi
                      </Badge>
                    )}
                    {isEnded ? (
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-slate-500/10 text-slate-400 border-slate-500/20">
                        Ended
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-white/30 mb-3">{poll.totalVotes} total votes</p>

                {/* Options */}
                <div className="space-y-2">
                  {poll.options.map((opt, optIdx) => {
                    const userVotedThis = hasVoted && votedPolls[poll.id]?.includes(opt.label);
                    const canVote = !isEnded && !hasVoted && apiPoll;

                    return (
                      <motion.button
                        key={opt.label}
                        whileHover={canVote ? { scale: 1.01 } : undefined}
                        whileTap={canVote ? { scale: 0.99 } : undefined}
                        onClick={() => canVote && handleVote(apiPoll!, optIdx)}
                        disabled={!canVote}
                        className={`w-full text-left rounded-xl p-2.5 border transition-all ${
                          userVotedThis
                            ? 'border-emerald-500/30 bg-emerald-500/5'
                            : 'border-white/5 hover:border-white/15 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className={`font-medium ${userVotedThis ? 'text-teal-300' : 'text-white/80'}`}>{opt.label}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-white/40 font-mono text-[11px]">{opt.votes}</span>
                            <span className="text-white/40 font-mono">{opt.percentage}%</span>
                            {userVotedThis && <CheckCircle2 size={12} className="text-emerald-400" />}
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${userVotedThis ? 'bg-emerald-500' : 'bg-teal-600/60'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${opt.percentage}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' as const }}
                          />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* End poll button (host only, active polls) */}
                {isHost && !isEnded && apiPoll && (
                  <div className="mt-3 pt-2 border-t border-white/5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEndPoll(poll.id)}
                      disabled={isEnding}
                      className="text-[11px] text-white/50 hover:text-rose-400 hover:bg-rose-500/10 h-7 gap-1.5"
                    >
                      {isEnding ? <Loader2 size={11} className="animate-spin" /> : <Square size={11} />}
                      End Poll
                    </Button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
