'use client';

import { useState, useCallback } from 'react';
import { BarChart3, CheckCircle2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { type PollData } from './meeting-data';

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
  onOpenPollBuilder,
}: PollsPanelProps) {
  const [votedPolls, setVotedPolls] = useState<Record<string, string>>({});

  const handleVotePoll = useCallback((pollId: string, optionLabel: string) => {
    if (votedPolls[pollId]) return;
    onVotePoll(pollId, optionLabel);
    setVotedPolls(prev => ({ ...prev, [pollId]: optionLabel }));
    toast.success('Vote recorded!', { description: `You voted for "${optionLabel}"` });
  }, [votedPolls, onVotePoll]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Polls</h3>
          <p className="text-[10px] text-white/30">Vote and create polls</p>
        </div>
        <Button size="sm" className="h-7 text-xs bg-violet-600 hover:bg-violet-700 rounded-lg" onClick={onOpenPollBuilder}>
          <Plus size={12} className="mr-1" /> Create
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {displayPolls.length === 0 && (
            <div className="py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                <BarChart3 size={24} className="text-white/20" />
              </div>
              <p className="text-sm text-white/40 mb-1">No polls yet</p>
              <p className="text-[11px] text-white/20">Create a poll to gather feedback</p>
            </div>
          )}
          {displayPolls.map((poll) => (
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
                          transition={{ duration: 0.8, ease: 'easeOut' as const }}
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
  );
}
