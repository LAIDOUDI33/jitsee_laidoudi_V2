'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  CheckCircle2,
  Film,
  Sparkles,
  Share2,
  Clock,
  CalendarDays,
  Users,
  ChevronDown,
  ArrowLeft,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';

interface PostMeetingSummaryProps {
  meetingTitle: string;
  duration: number; // seconds
  participantCount: number;
  onBackToDashboard: () => void;
}

const MOCK_PARTICIPANTS = [
  { name: 'Sarah Chen', initials: 'SC', color: 'bg-emerald-500' },
  { name: 'Alex Rivera', initials: 'AR', color: 'bg-amber-500' },
  { name: 'Jordan Kim', initials: 'JK', color: 'bg-rose-500' },
  { name: 'Morgan Patel', initials: 'MP', color: 'bg-cyan-500' },
  { name: 'Taylor Brooks', initials: 'TB', color: 'bg-violet-500' },
];

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function PostMeetingSummary({
  meetingTitle,
  duration,
  participantCount,
  onBackToDashboard,
}: PostMeetingSummaryProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [participantsOpen, setParticipantsOpen] = useState(false);

  const ratingEmoji = (val: number): string => {
    if (val >= 4) return '😍';
    if (val >= 2) return '😐';
    if (val > 0) return '😕';
    return '';
  };

  const handleQuickAction = (action: 'recording' | 'summary' | 'share') => {
    switch (action) {
      case 'recording':
        toast.info('Recording will be available shortly');
        break;
      case 'summary':
        toast.info('Generating AI summary...');
        break;
      case 'share':
        toast.success('Shareable link copied!');
        break;
    }
  };

  const handleSubmitFeedback = () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    toast.success('Thank you for your feedback!');
  };

  const displayParticipants = MOCK_PARTICIPANTS.slice(0, Math.min(participantCount, 5));

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="fixed inset-0 bg-slate-950 text-white flex items-center justify-center p-4 z-50 overflow-y-auto"
    >
      <div className="w-full max-w-2xl py-8 space-y-6">
        {/* Meeting Ended Header */}
        <motion.div variants={itemVariants} className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/15 ring-2 ring-emerald-500/30"
          >
            <CheckCircle2 className="h-9 w-9 text-emerald-400" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight">Meeting Ended</h1>
          <p className="text-slate-400 text-sm">Your meeting has concluded successfully.</p>
        </motion.div>

        {/* Meeting Info Card */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4"
        >
          <h2 className="text-lg font-semibold">{meetingTitle}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-slate-800 flex items-center justify-center">
                <Clock className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Duration</p>
                <p className="text-sm font-medium">{formatDuration(duration)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-slate-800 flex items-center justify-center">
                <CalendarDays className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Date</p>
                <p className="text-sm font-medium">{formatDate()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-slate-800 flex items-center justify-center">
                <Clock className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Time</p>
                <p className="text-sm font-medium">{formatTime()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-slate-800 flex items-center justify-center">
                <Users className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Participants</p>
                <p className="text-sm font-medium">{participantCount}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="flex gap-3">
          <Button
            onClick={() => handleQuickAction('recording')}
            variant="outline"
            className="flex-1 h-11 bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
          >
            <Film size={16} />
            View Recording
          </Button>
          <Button
            onClick={() => handleQuickAction('summary')}
            variant="outline"
            className="flex-1 h-11 bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
          >
            <Sparkles size={16} />
            AI Summary
          </Button>
          <Button
            onClick={() => handleQuickAction('share')}
            variant="outline"
            className="flex-1 h-11 bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
          >
            <Share2 size={16} />
            Share Notes
          </Button>
        </motion.div>

        {/* Participants List (Collapsible) */}
        <motion.div variants={itemVariants}>
          <Collapsible open={participantsOpen} onOpenChange={setParticipantsOpen}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-5 py-4 hover:bg-slate-900 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium">Participants ({participantCount})</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                    participantsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="divide-y divide-slate-800">
                {displayParticipants.map((p) => (
                  <div key={p.name} className="flex items-center gap-3 px-5 py-3">
                    <div
                      className={`h-9 w-9 rounded-full ${p.color} flex items-center justify-center shrink-0`}
                    >
                      <span className="text-xs font-semibold text-white">{p.initials}</span>
                    </div>
                    <span className="text-sm text-slate-200">{p.name}</span>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </motion.div>

        {/* Meeting Feedback */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold">Meeting Feedback</h3>

          {/* Star Rating with Emoji */}
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const displayVal = hoverRating || rating;
                return (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="relative p-1 transition-transform hover:scale-110"
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    <Star
                      size={28}
                      className={`transition-colors ${
                        star <= displayVal
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
                );
              })}
              {(hoverRating || rating) > 0 && (
                <span className="ml-2 text-xl" role="img" aria-label="rating emoji">
                  {ratingEmoji(hoverRating || rating)}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {rating === 0 && 'Tap a star to rate your meeting experience'}
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Below Average'}
              {rating === 3 && 'Average'}
              {rating === 4 && 'Good'}
              {rating === 5 && 'Excellent'}
            </p>
          </div>

          {/* Text Feedback */}
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share any additional feedback (optional)..."
            rows={3}
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50"
          />

          <Button
            onClick={handleSubmitFeedback}
            variant="outline"
            className="h-9 bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
          >
            Submit Feedback
          </Button>
        </motion.div>

        {/* Back to Dashboard Button */}
        <motion.div variants={itemVariants} className="pt-2">
          <Button
            onClick={onBackToDashboard}
            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-base shadow-lg shadow-emerald-500/25 transition-all duration-200"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
