import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError, getOrgFilter } from '@/lib/api-auth';

export async function GET() {
  try {
    const user = await requireAuth();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Organization scoping
    const orgFilter = getOrgFilter(user);

    // ─── Run all independent queries in parallel ─────────────────────────
    const [
      // 1. Meeting activity — raw meetings from last 30 days
      meetingsLast30Days,
      // 2. Meeting types
      meetingTypeGroups,
      // 3. Department data (organizations with user counts)
      orgsWithCounts,
      // 4. Top collaborators (users with most meeting participations)
      topCollabGroups,
      // 5. AI feature adoption counts
      aiConversationsCount,
      aiSummariesCount,
      transcriptsCount,
      // 6. KPI data
      totalMeetingCount,
      allMeetingDurations,
      totalParticipantCount,
      summariesThisMonth,
    ] = await Promise.all([
      // 1. Daily meeting counts for last 30 days
      db.meeting.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          ...orgFilter,
        },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),

      // 2. Count by meeting type
      db.meeting.groupBy({
        by: ['type'],
        where: orgFilter,
        _count: true,
      }),

      // 3. Organizations with user counts
      db.organization.findMany({
        include: {
          _count: { select: { users: true } },
        },
      }),

      // 4. Top collaborators — users with most meeting participations
      db.meetingParticipant.groupBy({
        by: ['userId'],
        where: orgFilter
          ? { meeting: { organizationId: orgFilter.organizationId } }
          : undefined,
        _count: true,
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),

      // 5a. AI conversations total
      db.aiConversation.count({
        where: orgFilter
          ? { user: { organizationId: orgFilter.organizationId } }
          : undefined,
      }),

      // 5b. AI summaries total
      db.meetingSummary.count({
        where: orgFilter
          ? { meeting: { organizationId: orgFilter.organizationId } }
          : undefined,
      }),

      // 5c. Transcripts total
      db.transcript.count({
        where: orgFilter
          ? { meeting: { organizationId: orgFilter.organizationId } }
          : undefined,
      }),

      // 6a. Total meetings
      db.meeting.count({ where: orgFilter }),

      // 6b. Meeting durations (for avg calculation)
      db.meeting.findMany({
        where: {
          ...orgFilter,
          startTime: { not: null },
          endTime: { not: null },
        },
        select: { startTime: true, endTime: true },
      }),

      // 6c. Total unique participants
      db.meetingParticipant.groupBy({
        by: ['userId'],
        where: orgFilter
          ? { meeting: { organizationId: orgFilter.organizationId } }
          : undefined,
      }),

      // 6d. AI summaries generated this month
      db.meetingSummary.count({
        where: {
          createdAt: { gte: startOfMonth },
          meeting: orgFilter
            ? { organizationId: orgFilter.organizationId }
            : undefined,
        },
      }),
    ]);

    // ─── 1. Meeting Activity (30 days) ────────────────────────────────────
    const meetingActivity = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const dayLabel = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const dayCount = meetingsLast30Days.filter((m) => {
        const mDate = new Date(m.createdAt).toISOString().split('T')[0];
        return mDate === dateStr;
      }).length;
      return {
        day: dayLabel,
        date: dateStr,
        meetings: dayCount,
      };
    });

    // ─── 2. Meeting Types ────────────────────────────────────────────────
    const typeLabels: Record<string, string> = {
      instant: 'Instant',
      scheduled: 'Scheduled',
      recurring: 'Recurring',
      personal: 'Personal',
    };
    const typeColors: Record<string, string> = {
      instant: '#10b981',
      scheduled: '#f59e0b',
      recurring: '#ef4444',
      personal: '#06b6d4',
    };
    const meetingTypes = meetingTypeGroups.map((g) => ({
      name: typeLabels[g.type] || g.type,
      value: g._count,
      color: typeColors[g.type] || '#10b981',
    }));

    // ─── 3. Department Data ───────────────────────────────────────────────
    const deptColors = [
      '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#8b5cf6',
      '#f97316', '#14b8a6', '#e11d48', '#84cc16',
    ];
    const departmentData = orgsWithCounts.map((org, i) => ({
      department: org.name,
      users: org._count.users,
      color: deptColors[i % deptColors.length],
    }));

    // ─── 4. Top Collaborators ─────────────────────────────────────────────
    const topUserIds = topCollabGroups.map((g) => g.userId);
    const topUsers =
      topUserIds.length > 0
        ? await db.user.findMany({
            where: { id: { in: topUserIds } },
            select: { id: true, name: true, role: true },
          })
        : [];

    const userMap = new Map(topUsers.map((u) => [u.id, u]));
    const avatarColors = [
      'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-teal-500', 'bg-orange-500',
      'bg-pink-500', 'bg-cyan-500', 'bg-red-500', 'bg-lime-500', 'bg-fuchsia-500',
    ];
    const topCollaborators = topCollabGroups.map((g, i) => {
      const u = userMap.get(g.userId);
      const name = u?.name || 'Unknown User';
      const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      return {
        name,
        role: u?.role || 'participant',
        meetings: g._count,
        initials,
        color: avatarColors[i % avatarColors.length],
      };
    });

    // ─── 5. AI Feature Adoption ───────────────────────────────────────────
    const aiFeatureAdoption = [
      {
        name: 'AI Conversations',
        count: aiConversationsCount,
        color: '#10b981',
      },
      {
        name: 'Meeting Summaries',
        count: aiSummariesCount,
        color: '#f59e0b',
      },
      {
        name: 'Transcripts',
        count: transcriptsCount,
        color: '#06b6d4',
      },
    ];

    // ─── 6. KPI Cards ─────────────────────────────────────────────────────
    // Average meeting duration in minutes
    let avgDuration = 0;
    if (allMeetingDurations.length > 0) {
      const totalMs = allMeetingDurations.reduce((sum, m) => {
        const start = new Date(m.startTime!).getTime();
        const end = new Date(m.endTime!).getTime();
        return sum + (end - start);
      }, 0);
      avgDuration = Math.round(totalMs / allMeetingDurations.length / 60000);
    }

    const kpiCards = {
      totalMeetings: totalMeetingCount,
      avgDurationMinutes: avgDuration,
      totalParticipants: totalParticipantCount.length,
      aiSummariesThisMonth: summariesThisMonth,
    };

    return NextResponse.json({
      success: true,
      data: {
        meetingActivity,
        meetingTypes,
        departmentData,
        topCollaborators,
        aiFeatureAdoption,
        kpiCards,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Analytics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch analytics' },
      },
      { status: 500 }
    );
  }
}
