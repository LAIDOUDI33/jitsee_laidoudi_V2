import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/api-auth';

export async function GET() {
  try {
    const user = await requireAuth();

    const now = new Date();
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Scope to user's organization when available
    const orgFilter = user.organizationId
      ? { organizationId: user.organizationId }
      : {};

    // Run all independent queries in parallel
    const [
      meetingsLast7Days,
      allMeetings,
      meetingsActiveToday,
      totalParticipants,
      totalRecordings,
      meetingTypeGroups,
      upcomingMeetings,
      recentAuditLogs,
      recentLoginUsers,
      totalMeetingSummaries,
    ] = await Promise.all([
      // 1. Meeting activity for last 7 days (for chart)
      db.meeting.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
          ...orgFilter,
        },
        select: { createdAt: true, id: true },
        orderBy: { createdAt: 'asc' },
      }),

      // Quick stat: total meetings
      db.meeting.count({ where: orgFilter }),

      // Quick stat: active today
      db.meeting.count({
        where: {
          createdAt: { gte: startOfToday },
          ...orgFilter,
        },
      }),

      // Quick stat: total participants (unique)
      db.meetingParticipant.groupBy({
        by: ['userId'],
        where: { meeting: { ...orgFilter } },
      }),

      // Quick stat: total recordings
      db.recording.count({
        where: { meeting: { ...orgFilter } },
      }),

      // Meeting type counts (for pie chart)
      db.meeting.groupBy({
        by: ['type'],
        where: { ...orgFilter },
        _count: true,
      }),

      // Upcoming 5 meetings (scheduled, future startTime)
      db.meeting.findMany({
        where: {
          status: { in: ['scheduled', 'active'] },
          startTime: { gte: now },
          ...orgFilter,
        },
        include: {
          host: { select: { id: true, name: true, email: true } },
          _count: { select: { participants: true } },
        },
        orderBy: { startTime: 'asc' },
        take: 5,
      }),

      // Recent 10 audit log entries (for activity feed)
      db.auditLog.findMany({
        where: {
          ...orgFilter,
          userId: { not: null },
        },
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Online users: users with lastLogin within last 30 min (or audit log user.login)
      db.user.findMany({
        where: {
          isActive: true,
          lastLogin: { gte: thirtyMinAgo },
          ...(user.organizationId ? { organizationId: user.organizationId } : {}),
        },
        select: { id: true, name: true, lastLogin: true },
        orderBy: { lastLogin: 'desc' },
        take: 20,
      }),

      // AI summaries count (for insights)
      db.meetingSummary.count({
        where: {
          createdAt: { gte: sevenDaysAgo },
          meeting: { ...orgFilter },
        },
      }),
    ]);

    // ─── 1. Meeting Activity (daily counts for last 7 days) ────────────────
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const meetingActivity = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);
      const dayStr = dayNames[date.getDay()];
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayMeetings = meetingsLast7Days.filter((m) => {
        const mDate = new Date(m.createdAt);
        return mDate >= date && mDate < nextDate;
      });

      // Count participants for those meetings
      const dayMeetingIds = dayMeetings.map((m) => m.id);

      return { day: dayStr, meetings: dayMeetings.length, date: date.toISOString() };
    });

    // ─── 2. Meeting Types (for pie chart) ────────────────────────────────
    const typeLabels: Record<string, string> = {
      instant: 'Instant',
      scheduled: 'Scheduled',
      recurring: 'Recurring',
      personal: 'Personal',
    };
    const typeTotal = meetingTypeGroups.reduce((sum, g) => sum + g._count, 0) || 1;
    const meetingTypes = meetingTypeGroups.map((g) => ({
      name: typeLabels[g.type] || g.type,
      value: Math.round((g._count / typeTotal) * 100),
      count: g._count,
    }));

    // ─── 3. Upcoming Meetings ─────────────────────────────────────────────
    const formatMeetingDate = (start: Date | null, status: string) => {
      if (!start) return 'No date set';
      const s = new Date(start);
      const isToday =
        s.getFullYear() === now.getFullYear() &&
        s.getMonth() === now.getMonth() &&
        s.getDate() === now.getDate();
      const time = s.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      if (isToday) return `Today, ${time}`;
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (
        s.getFullYear() === yesterday.getFullYear() &&
        s.getMonth() === yesterday.getMonth() &&
        s.getDate() === yesterday.getDate()
      ) {
        return `Yesterday, ${time}`;
      }
      return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`;
    };

    const formatDuration = (start: Date | null, end: Date | null) => {
      if (!start) return '—';
      const s = start.getTime();
      const e = end?.getTime() || now.getTime();
      const mins = Math.round((e - s) / 60000);
      if (mins < 60) return `${mins} min`;
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h}h ${m}min` : `${h}h`;
    };

    const upcomingMeetingsFormatted = upcomingMeetings.map((m) => ({
      id: m.id,
      title: m.title,
      date: formatMeetingDate(m.startTime, m.status),
      duration: formatDuration(m.startTime, m.endTime),
      participants: m._count.participants,
      status: m.status === 'active' ? 'Active' as const
        : m.status === 'ended' ? 'Ended' as const
        : 'Scheduled' as const,
    }));

    // ─── 4. Recent Activity (from audit logs) ─────────────────────────────
    const formatTimeAgo = (date: Date) => {
      const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
      if (diff < 60) return 'just now';
      if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    };

    const actionLabels: Record<string, string> = {
      MEETING_CREATED: 'created a meeting',
      MEETING_ENDED: 'ended a meeting',
      MEETING_JOINED: 'joined a meeting',
      RECORDING_CREATED: 'shared a recording',
      RECORDING_DOWNLOADED: 'downloaded a recording',
      USER_CREATED: 'joined the platform',
      TEAM_CREATED: 'created a team',
      SUMMARY_CREATED: 'created an AI summary',
      FILE_UPLOADED: 'uploaded a file',
      LOGIN: 'logged in',
      LOGOUT: 'logged out',
    };

    const avatarColors = [
      'bg-pink-500', 'bg-sky-500', 'bg-emerald-500', 'bg-orange-500',
      'bg-violet-500', 'bg-teal-500', 'bg-rose-500', 'bg-amber-500',
      'bg-cyan-500', 'bg-indigo-500',
    ];

    const recentActivity = recentAuditLogs.map((log, i) => {
      const name = log.user?.name || 'Unknown User';
      const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      const action = actionLabels[log.action] || log.action.toLowerCase().replace(/_/g, ' ');
      let target = '';
      if (log.details) {
        try {
          const d = JSON.parse(log.details);
          target = d.title || d.name || d.meetingId || '';
        } catch {
          // details not JSON
        }
      }
      return {
        user: name,
        initials,
        color: avatarColors[i % avatarColors.length],
        action,
        target,
        time: formatTimeAgo(log.createdAt),
      };
    });

    // ─── 5. Online Users ───────────────────────────────────────────────────
    const onlineUsers = recentLoginUsers.map((u, i) => ({
      name: u.name,
      initials: u.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
      color: avatarColors[i % avatarColors.length],
      status: 'Online',
    }));

    // ─── 6. Quick Stats ───────────────────────────────────────────────────
    const quickStats = {
      totalMeetings: allMeetings,
      activeToday: meetingsActiveToday,
      totalParticipants: totalParticipants.length,
      totalRecordings,
      aiSummariesThisWeek: totalMeetingSummaries,
    };

    // Banner stats
    const bannerStats = {
      meetingsToday: meetingsActiveToday,
      unreadMessages: 0, // Not tracked in schema
      pendingActions: 0, // Could query action items but expensive
      newRecordings: totalRecordings,
    };

    return NextResponse.json({
      success: true,
      data: {
        meetingActivity,
        meetingTypes,
        upcomingMeetings: upcomingMeetingsFormatted,
        recentActivity,
        onlineUsers,
        quickStats,
        bannerStats,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch dashboard stats' } },
      { status: 500 }
    );
  }
}
