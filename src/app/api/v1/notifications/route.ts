import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/api-auth';

export async function GET() {
  try {
    await requireAuth();

    const [recentLogs, upcomingMeetings] = await Promise.all([
      db.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      db.meeting.findMany({
        where: { status: { in: ['scheduled', 'active'] } },
        take: 5,
        orderBy: { startTime: 'asc' },
        include: { host: { select: { name: true } } },
      }),
    ]);

    const avatarColors = [
      'bg-emerald-500/15 text-emerald-600',
      'bg-violet-500/15 text-violet-600',
      'bg-amber-500/15 text-amber-600',
      'bg-rose-500/15 text-rose-600',
      'bg-cyan-500/15 text-cyan-600',
      'bg-orange-500/15 text-orange-600',
      'bg-teal-500/15 text-teal-600',
      'bg-pink-500/15 text-pink-600',
    ];

    function getInitials(name: string): string {
      return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    }

    function timeAgo(date: Date): string {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      return `${days}d ago`;
    }

    function getTimeGroup(date: Date): string {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days < 1) return 'Today';
      if (days < 2) return 'Yesterday';
      return 'Earlier';
    }

    // Map audit logs to notifications
    const actionTypeMap: Record<string, { type: string; title: string; description: string }> = {
      'MEETING_CREATED': { type: 'meeting-invite', title: 'New meeting created', description: '' },
      'USER_LOGIN': { type: 'security-alert', title: 'User login', description: '' },
      'USER_LOGOUT': { type: 'general', title: 'User logout', description: '' },
    };

    const logNotifications = recentLogs.map((log, i) => {
      const config = actionTypeMap[log.action] || { type: 'general', title: log.action, description: '' };
      const userName = log.user?.name ?? 'System';
      return {
        id: `log-${log.id}`,
        type: config.type,
        title: config.title,
        description: config.description || `${userName} performed ${log.action} on ${log.resource}${log.details ? ': ' + log.details.slice(0, 100) : ''}`,
        time: timeAgo(log.createdAt),
        timeGroup: getTimeGroup(log.createdAt) as string,
        read: false,
        sender: {
          name: userName,
          initials: getInitials(userName),
          color: avatarColors[i % avatarColors.length],
        },
      };
    });

    // Map upcoming meetings to notifications
    const meetingNotifications = upcomingMeetings.map((m, i) => {
      const hostName = m.host?.name ?? 'Team';
      return {
        id: `meeting-${m.id}`,
        type: 'meeting-soon',
        title: `Upcoming: ${m.title}`,
        description: `Scheduled by ${hostName}${m.startTime ? ' at ' + new Date(m.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}`,
        time: m.startTime ? timeAgo(new Date(m.startTime)) : 'soon',
        timeGroup: 'Today' as string,
        read: false,
        sender: {
          name: hostName,
          initials: getInitials(hostName),
          color: avatarColors[(i + 3) % avatarColors.length],
        },
      };
    });

    // Combine and sort by recency
    const all = [...meetingNotifications, ...logNotifications];

    return NextResponse.json({ success: true, data: { notifications: all } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('List notifications error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch notifications' } },
      { status: 500 }
    );
  }
}
