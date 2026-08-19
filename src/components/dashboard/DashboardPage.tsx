'use client';

import { useAppStore } from '@/store/app-store';
import { authFetch } from '@/lib/api';
import {
  Video, CalendarPlus, Hash, Sparkles, Users, Clock, FileText, Brain,
  ChevronRight, Play, MoreHorizontal, Film, ArrowUpRight, ArrowDownRight,
  VideoIcon, Calendar, Mic, Monitor, Share2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import MeetingInviteDialog from '@/components/shared/MeetingInviteDialog';

// ── Animation variants ─────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

// ── Types ──────────────────────────────────────────────────────────────

interface UpcomingMeeting {
  id: string;
  title: string;
  scheduledAt: string;
  type: 'instant' | 'scheduled' | 'recurring';
  hostName: string;
  hostInitials: string;
  participants: { initials: string; color: string }[];
}

interface Recording {
  id: string;
  title: string;
  duration: string;
  date: string;
}

interface DashboardStats {
  totalMeetings: number;
  totalMeetingsTrend: string;
  totalHours: number;
  totalHoursTrend: string;
  teamMembers: number;
  teamMembersTrend: string;
  aiSummaries: number;
  aiSummariesTrend: string;
}

// ── Helpers ────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMins / 60);

  if (diffMins <= 0 && diffMins > -60) return 'Starting now';
  if (diffMins > 0 && diffMins < 60) return `In ${diffMins} min`;

  // Check if today
  if (date.toDateString() === now.toDateString()) {
    return `Today ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }

  // Check if tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const AVATAR_COLORS = [
  'bg-emerald-500',
  'bg-amber-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-teal-500',
  'bg-fuchsia-500',
  'bg-orange-500',
  'bg-cyan-500',
];

function getAvatarColor(name: string): string {
  const hash = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// ── Skeletons ──────────────────────────────────────────────────────────

function WelcomeBannerSkeleton() {
  return (
    <div className='rounded-2xl bg-muted/50 p-6 lg:p-8'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-56' />
          <Skeleton className='h-4 w-72' />
        </div>
        <Skeleton className='h-10 w-36 rounded-xl' />
      </div>
    </div>
  );
}

function QuickActionsSkeleton() {
  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className='rounded-xl border border-border/50 p-5 space-y-3'>
          <Skeleton className='w-12 h-12 rounded-full' />
          <Skeleton className='h-5 w-24' />
          <Skeleton className='h-4 w-32' />
        </div>
      ))}
    </div>
  );
}

function MeetingCardSkeleton() {
  return (
    <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80'>
      <CardContent className='p-5 space-y-4'>
        <div className='flex items-start justify-between'>
          <div className='space-y-2 flex-1'>
            <Skeleton className='h-5 w-48' />
            <Skeleton className='h-4 w-32' />
          </div>
          <Skeleton className='h-5 w-20 rounded-full' />
        </div>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Skeleton className='w-7 h-7 rounded-full' />
            <Skeleton className='w-7 h-7 rounded-full' />
            <Skeleton className='w-7 h-7 rounded-full' />
          </div>
          <div className='flex gap-2'>
            <Skeleton className='h-8 w-16 rounded-lg' />
            <Skeleton className='h-8 w-20 rounded-lg' />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecordingCardSkeleton() {
  return (
    <div className='min-w-[260px] max-w-[280px] shrink-0 rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/80 overflow-hidden'>
      <Skeleton className='h-36 w-full' />
      <div className='p-4 space-y-2'>
        <Skeleton className='h-5 w-40' />
        <div className='flex items-center gap-2'>
          <Skeleton className='h-3 w-12' />
          <Skeleton className='h-3 w-20' />
        </div>
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className='rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/80 p-5 space-y-3'>
          <div className='flex items-center justify-between'>
            <Skeleton className='w-10 h-10 rounded-xl' />
            <Skeleton className='h-4 w-16 rounded-full' />
          </div>
          <Skeleton className='h-8 w-16' />
          <Skeleton className='h-4 w-24' />
        </div>
      ))}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, setCurrentView, setMeetingTitle, setCurrentMeetingId } = useAppStore();
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [inviteMeeting, setInviteMeeting] = useState<UpcomingMeeting | null>(null);

  // Ensure user is set for display
  useEffect(() => {
    if (!user) {
      useAppStore.getState().setUser({
        id: '1',
        name: 'Sarah Mitchell',
        email: 'sarah@alvision.com',
        role: 'admin',
        organizationId: 'org1',
        organizationName: 'Alvision Inc.',
      });
    }
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'Sarah';

  // Fetch upcoming meetings
  const { data: meetingsData, isLoading: meetingsLoading } = useQuery({
    queryKey: ['dashboard-upcoming-meetings'],
    queryFn: async () => {
      try {
        const res = await authFetch('/api/v1/meetings?status=scheduled&limit=3');
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        if (json.success && json.data?.meetings?.length > 0) {
          return json.data.meetings.map((m: Record<string, unknown>) => ({
            id: m.id,
            title: m.title || 'Untitled Meeting',
            scheduledAt: m.scheduledAt || m.startTime || new Date().toISOString(),
            type: m.type || m.settings?.type || 'scheduled',
            hostName: m.hostName || user?.name || 'You',
            hostInitials: (m.hostName || user?.name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
            participants: (m.participants || []).slice(0, 5).map((p: Record<string, unknown>, i: number) => ({
              initials: ((p.name as string) || `U${i + 1}`).split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
              color: AVATAR_COLORS[i % AVATAR_COLORS.length],
            })),
          }));
        }
        throw new Error('No data');
      } catch {
        // Return mock data as fallback
        return MOCK_MEETINGS;
      }
    },
    staleTime: 30_000,
  });

  // Fetch recordings
  const { data: recordingsData, isLoading: recordingsLoading } = useQuery({
    queryKey: ['dashboard-recordings'],
    queryFn: async () => {
      try {
        const res = await authFetch('/api/v1/meetings?status=ended&limit=3&hasRecording=true');
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        if (json.success && json.data?.meetings?.length > 0) {
          return json.data.meetings.map((m: Record<string, unknown>) => ({
            id: m.id,
            title: m.title || 'Untitled Recording',
            duration: m.duration || '0:00',
            date: m.endedAt || m.updatedAt || new Date().toISOString(),
          }));
        }
        throw new Error('No data');
      } catch {
        return MOCK_RECORDINGS;
      }
    },
    staleTime: 30_000,
  });

  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats-v2'],
    queryFn: async () => {
      try {
        const res = await authFetch('/api/v1/stats/dashboard');
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          return {
            totalMeetings: d.quickStats?.totalMeetings ?? 12,
            totalMeetingsTrend: '+12%',
            totalHours: d.quickStats?.totalRecordings ?? 8.5,
            totalHoursTrend: '+5%',
            teamMembers: d.quickStats?.totalParticipants ?? 24,
            teamMembersTrend: '+3%',
            aiSummaries: d.quickStats?.aiSummariesThisWeek ?? 27,
            aiSummariesTrend: '+18%',
          };
        }
        throw new Error('No data');
      } catch {
        return MOCK_STATS;
      }
    },
    staleTime: 30_000,
  });

  // Handlers
  const handleNewMeeting = () => {
    setMeetingTitle('New Meeting');
    setCurrentMeetingId('new-' + Date.now());
    setCurrentView('meeting-room');
  };

  const handleScheduleMeeting = () => {
    setCurrentView('meetings');
    toast('Navigate to the Calendar to schedule a new meeting', {
      description: 'Use the Schedule button on the meetings page.',
    });
  };

  const handleJoinWithCode = () => {
    if (!joinCode.trim()) {
      toast.error('Please enter a meeting code');
      return;
    }
    setMeetingTitle(`Meeting ${joinCode}`);
    setCurrentMeetingId(joinCode);
    setCurrentView('meeting-room');
    setJoinCode('');
    setShowJoinInput(false);
  };

  const handleJoinMeeting = (meeting: UpcomingMeeting) => {
    setMeetingTitle(meeting.title);
    setCurrentMeetingId(meeting.id);
    setCurrentView('meeting-room');
  };

  const handleCopyLink = (meeting: UpcomingMeeting) => {
    setInviteMeeting(meeting);
  };

  const upcomingMeetings: UpcomingMeeting[] = meetingsData || [];
  const recordings: Recording[] = recordingsData || [];
  const stats: DashboardStats = statsData || MOCK_STATS;

  return (
    <motion.div className='max-w-6xl mx-auto space-y-8' variants={container} initial='hidden' animate='show'>
      {/* ═══════════════════ WELCOME BANNER ═══════════════════ */}
      <motion.div variants={item}>
        <div className='relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 lg:p-8 text-white'>
          {/* Subtle pattern overlay */}
          <div className='absolute inset-0 opacity-10 pointer-events-none' aria-hidden='true'>
            <div className='absolute inset-0' style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }} />
          </div>
          {/* Decorative blobs */}
          <div className='absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none' />
          <div className='absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/10 blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none' />

          <div className='relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div>
              <h2 className='text-2xl lg:text-3xl font-bold mb-1'>
                {getGreeting()}, {firstName}!
              </h2>
              <p className='text-emerald-100 text-sm lg:text-base'>{getFormattedDate()}</p>
            </div>
            <Button
              onClick={handleNewMeeting}
              className='bg-white text-emerald-700 hover:bg-white/90 font-semibold shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shrink-0'
            >
              <Video className='h-4 w-4 mr-2' />
              Start Meeting
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════ QUICK ACTIONS ROW ═══════════════════ */}
      <motion.div variants={item}>
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          {/* New Meeting */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className='rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 p-5 cursor-pointer group'
            onClick={handleNewMeeting}
          >
            <div className='w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/30 transition-shadow'>
              <Video className='h-5 w-5 text-white' />
            </div>
            <h3 className='font-semibold text-sm mb-1'>New Meeting</h3>
            <p className='text-xs text-muted-foreground'>Start an instant video call</p>
          </motion.div>

          {/* Schedule Meeting */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className='rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 p-5 cursor-pointer group'
            onClick={handleScheduleMeeting}
          >
            <div className='w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/30 transition-shadow'>
              <CalendarPlus className='h-5 w-5 text-white' />
            </div>
            <h3 className='font-semibold text-sm mb-1'>Schedule Meeting</h3>
            <p className='text-xs text-muted-foreground'>Plan ahead with calendar</p>
          </motion.div>

          {/* Join with Code */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className='rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 p-5 cursor-pointer group'
            onClick={() => setShowJoinInput(!showJoinInput)}
          >
            <div className='w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/30 transition-shadow'>
              <Hash className='h-5 w-5 text-white' />
            </div>
            <h3 className='font-semibold text-sm mb-1'>Join with Code</h3>
            <p className='text-xs text-muted-foreground'>Enter a code to join</p>
            {showJoinInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className='mt-3'
                onClick={(e) => e.stopPropagation()}
              >
                <div className='flex gap-2'>
                  <Input
                    placeholder='Meeting code...'
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinWithCode()}
                    className='h-8 text-xs'
                    autoFocus
                  />
                  <Button size='sm' className='h-8 px-3 text-xs shrink-0' onClick={handleJoinWithCode}>
                    Join
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* AI Assistant */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className='rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 p-5 cursor-pointer group'
            onClick={() => setCurrentView('ai-assistant')}
          >
            <div className='w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg shadow-rose-500/20 group-hover:shadow-rose-500/30 transition-shadow'>
              <Sparkles className='h-5 w-5 text-white' />
            </div>
            <h3 className='font-semibold text-sm mb-1'>AI Assistant</h3>
            <p className='text-xs text-muted-foreground'>Get help with meetings</p>
          </motion.div>
        </div>
      </motion.div>

      {/* ═══════════════════ UPCOMING MEETINGS ═══════════════════ */}
      <motion.div variants={item}>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold'>Upcoming Meetings</h2>
          <Button
            variant='ghost'
            size='sm'
            className='text-sm text-muted-foreground hover:text-foreground'
            onClick={() => setCurrentView('meetings')}
          >
            View All <ChevronRight className='h-4 w-4 ml-1' />
          </Button>
        </div>

        {meetingsLoading ? (
          <div className='space-y-4'>
            <MeetingCardSkeleton />
            <MeetingCardSkeleton />
            <MeetingCardSkeleton />
          </div>
        ) : upcomingMeetings.length > 0 ? (
          <div className='space-y-4'>
            {upcomingMeetings.map((meeting) => {
              const typeBadge = {
                instant: { label: 'Instant', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
                scheduled: { label: 'Scheduled', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
                recurring: { label: 'Recurring', className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
              }[meeting.type] || { label: 'Scheduled', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };

              return (
                <motion.div
                  key={meeting.id}
                  whileHover={{ scale: 1.005 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300'>
                    <CardContent className='p-5'>
                      <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3'>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2 mb-1.5 flex-wrap'>
                            <h3 className='font-semibold text-sm truncate'>{meeting.title}</h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${typeBadge.className}`}>
                              {typeBadge.label}
                            </span>
                          </div>
                          <div className='flex items-center gap-3 text-xs text-muted-foreground'>
                            <span className='flex items-center gap-1'>
                              <Clock className='h-3.5 w-3.5' />
                              {formatRelativeTime(meeting.scheduledAt)}
                            </span>
                            <span className='hidden sm:inline'>·</span>
                            <span className='hidden sm:flex items-center gap-1'>
                              <Users className='h-3.5 w-3.5' />
                              {meeting.hostName}
                            </span>
                          </div>
                        </div>

                        <div className='flex items-center gap-2 shrink-0'>
                          <Button
                            size='sm'
                            className='h-8 px-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                            onClick={() => handleJoinMeeting(meeting)}
                          >
                            Join
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            className='h-8 px-4 text-xs gap-1.5 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 dark:hover:bg-amber-950/30'
                            onClick={() => handleCopyLink(meeting)}
                          >
                            <Share2 className='h-3.5 w-3.5' />
                            Share
                          </Button>
                        </div>
                      </div>

                      {/* Participants avatars */}
                      {meeting.participants.length > 0 && (
                        <div className='flex items-center mt-4 pt-3 border-t border-border/50'>
                          <div className='flex -space-x-2'>
                            {meeting.participants.slice(0, 5).map((p, i) => (
                              <Avatar key={i} className='h-7 w-7 border-2 border-card'>
                                <AvatarFallback className={`${p.color} text-white text-[9px] font-bold`}>
                                  {p.initials}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {meeting.participants.length > 5 && (
                              <div className='h-7 w-7 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground'>
                                +{meeting.participants.length - 5}
                              </div>
                            )}
                          </div>
                          <span className='ml-3 text-xs text-muted-foreground'>
                            {meeting.participants.length} participant{meeting.participants.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className='border border-dashed border-border/50 bg-muted/20'>
            <CardContent className='p-12 flex flex-col items-center justify-center text-center'>
              <div className='w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4'>
                <Calendar className='h-7 w-7 text-muted-foreground' />
              </div>
              <h3 className='font-medium mb-1'>No upcoming meetings</h3>
              <p className='text-sm text-muted-foreground mb-4 max-w-sm'>
                Your schedule is clear. Start a new meeting or schedule one for later.
              </p>
              <Button variant='outline' size='sm' onClick={handleNewMeeting} className='gap-2'>
                <Video className='h-4 w-4' />
                Start a Meeting
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* ═══════════════════ RECENT RECORDINGS ═══════════════════ */}
      <motion.div variants={item}>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold'>Recent Recordings</h2>
          <Button
            variant='ghost'
            size='sm'
            className='text-sm text-muted-foreground hover:text-foreground'
            onClick={() => setCurrentView('recordings')}
          >
            View All <ChevronRight className='h-4 w-4 ml-1' />
          </Button>
        </div>

        {recordingsLoading ? (
          <div className='flex gap-4 overflow-x-auto pb-2' style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(155,155,155,0.2) transparent' }}>
            <RecordingCardSkeleton />
            <RecordingCardSkeleton />
            <RecordingCardSkeleton />
          </div>
        ) : recordings.length > 0 ? (
          <div className='flex gap-4 overflow-x-auto pb-2' style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(155,155,155,0.2) transparent' }}>
            {recordings.map((rec) => (
              <motion.div
                key={rec.id}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className='min-w-[260px] max-w-[280px] shrink-0 rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden group'
              >
                {/* Thumbnail placeholder with gradient */}
                <div className='relative h-36 bg-gradient-to-br from-rose-500/20 via-violet-500/20 to-fuchsia-500/20 flex items-center justify-center overflow-hidden'>
                  <Film className='h-10 w-10 text-muted-foreground/40 group-hover:scale-110 transition-transform duration-300' />
                  {/* Play button overlay */}
                  <div className='absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center'>
                    <div className='w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg'>
                      <Play className='h-5 w-5 text-foreground ml-0.5' />
                    </div>
                  </div>
                  {/* Duration badge */}
                  <span className='absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-medium backdrop-blur-sm'>
                    {rec.duration}
                  </span>
                </div>

                <div className='p-4'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='min-w-0 flex-1'>
                      <h4 className='font-medium text-sm truncate'>{rec.title}</h4>
                      <p className='text-xs text-muted-foreground mt-1'>
                        {new Date(rec.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon' className='h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity'>
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end' className='w-36'>
                        <DropdownMenuItem className='text-xs cursor-pointer'>Download</DropdownMenuItem>
                        <DropdownMenuItem className='text-xs cursor-pointer'>Share</DropdownMenuItem>
                        <DropdownMenuItem className='text-xs cursor-pointer'>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className='border border-dashed border-border/50 bg-muted/20'>
            <CardContent className='p-12 flex flex-col items-center justify-center text-center'>
              <div className='w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4'>
                <Film className='h-7 w-7 text-muted-foreground' />
              </div>
              <h3 className='font-medium mb-1'>No recordings yet</h3>
              <p className='text-sm text-muted-foreground max-w-sm'>
                Recordings from your meetings will appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* ═══════════════════ STATS OVERVIEW ═══════════════════ */}
      <motion.div variants={item}>
        <h2 className='text-lg font-semibold mb-4'>This Week at a Glance</h2>

        {statsLoading ? (
          <StatsSkeleton />
        ) : (
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
            {[
              {
                label: 'Total Meetings',
                value: String(stats.totalMeetings),
                trend: stats.totalMeetingsTrend,
                trendUp: true,
                icon: <VideoIcon className='h-4 w-4' />,
                color: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600',
              },
              {
                label: 'Total Hours',
                value: String(stats.totalHours),
                trend: stats.totalHoursTrend,
                trendUp: true,
                icon: <Clock className='h-4 w-4' />,
                color: 'from-teal-500/10 to-teal-500/5 text-teal-600',
              },
              {
                label: 'Team Members',
                value: String(stats.teamMembers),
                trend: stats.teamMembersTrend,
                trendUp: true,
                icon: <Users className='h-4 w-4' />,
                color: 'from-amber-500/10 to-amber-500/5 text-amber-600',
              },
              {
                label: 'AI Summaries',
                value: String(stats.aiSummaries),
                trend: stats.aiSummariesTrend,
                trendUp: true,
                icon: <Brain className='h-4 w-4' />,
                color: 'from-violet-500/10 to-violet-500/5 text-violet-600',
              },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                whileHover={{ scale: 1.03 }}
                className='rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 p-5'
              >
                <div className='flex items-start justify-between mb-3'>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    {stat.icon}
                  </div>
                  <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    stat.trendUp
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {stat.trendUp ? <ArrowUpRight className='h-3 w-3' /> : <ArrowDownRight className='h-3 w-3' />}
                    {stat.trend}
                  </span>
                </div>
                <p className='text-2xl lg:text-3xl font-bold tracking-tight'>{stat.value}</p>
                <p className='text-xs text-muted-foreground mt-1'>{stat.label}</p>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Meeting Invite Dialog */}
      {inviteMeeting && (
        <MeetingInviteDialog
          open={!!inviteMeeting}
          onOpenChange={(open) => { if (!open) setInviteMeeting(null) }}
          meetingId={inviteMeeting.id}
          meetingTitle={inviteMeeting.title}
          hostName={inviteMeeting.hostName}
          startTime={inviteMeeting.scheduledAt}
        />
      )}
    </motion.div>
  );
}

// ── Mock Data ──────────────────────────────────────────────────────────

const MOCK_MEETINGS: UpcomingMeeting[] = [
  {
    id: 'm1',
    title: 'Sprint Planning — Q4 Kickoff',
    scheduledAt: new Date(Date.now() + 30 * 60000).toISOString(),
    type: 'recurring',
    hostName: 'Sarah Mitchell',
    hostInitials: 'SM',
    participants: [
      { initials: 'AJ', color: 'bg-emerald-500' },
      { initials: 'KL', color: 'bg-amber-500' },
      { initials: 'MR', color: 'bg-violet-500' },
      { initials: 'TC', color: 'bg-rose-500' },
      { initials: 'JW', color: 'bg-teal-500' },
    ],
  },
  {
    id: 'm2',
    title: 'Design Review — New Dashboard',
    scheduledAt: new Date(Date.now() + 3 * 3600000).toISOString(),
    type: 'scheduled',
    hostName: 'Alex Johnson',
    hostInitials: 'AJ',
    participants: [
      { initials: 'SM', color: 'bg-rose-500' },
      { initials: 'LP', color: 'bg-fuchsia-500' },
      { initials: 'DW', color: 'bg-cyan-500' },
    ],
  },
  {
    id: 'm3',
    title: '1:1 with Engineering Lead',
    scheduledAt: new Date(Date.now() + 25 * 3600000).toISOString(),
    type: 'instant',
    hostName: 'Sarah Mitchell',
    hostInitials: 'SM',
    participants: [
      { initials: 'RB', color: 'bg-orange-500' },
    ],
  },
];

const MOCK_RECORDINGS: Recording[] = [
  {
    id: 'r1',
    title: 'Product Roadmap Review',
    duration: '1:02:34',
    date: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'r2',
    title: 'Client Onboarding — Acme Corp',
    duration: '0:45:12',
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'r3',
    title: 'Team Retrospective',
    duration: '0:38:50',
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

const MOCK_STATS: DashboardStats = {
  totalMeetings: 12,
  totalMeetingsTrend: '+12%',
  totalHours: 8.5,
  totalHoursTrend: '+5%',
  teamMembers: 24,
  teamMembersTrend: '+3%',
  aiSummaries: 27,
  aiSummariesTrend: '+18%',
};
