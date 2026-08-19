/**
 * User Activity Report API
 * GET — Per-user activity summary for the organization
 *
 * Query params: range (7d, 30d, 90d)
 * Requires orgadmin+ role.
 * Returns: per-user meeting count, total meeting hours, last active, messages sent, files uploaded.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireOrgAdmin, AuthError } from '@/lib/api-auth';
import { Prisma } from '@prisma/client';

const RANGE_DAYS: Record<string, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

export async function GET(request: NextRequest) {
  try {
    const user = await requireOrgAdmin();

    if (!user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_ORG', message: 'User does not belong to an organization' } },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    const days = RANGE_DAYS[range] ?? 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Fetch all members in the org (active only)
    const members = await db.user.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        lastLogin: true,
      },
    });

    const userIds = members.map((m) => m.id);

    // Meeting participation count per user in date range
    const meetingParticipation = await db.meetingParticipant.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds },
        meeting: {
          startTime: { gte: since },
        },
      },
      _count: { id: true },
    });

    const meetingCountMap = new Map<string, number>();
    for (const mp of meetingParticipation) {
      meetingCountMap.set(mp.userId, mp._count.id);
    }

    // Total meeting hours per user in date range
    // We look at meetings the user participated in where both startTime and endTime exist
    const meetingsWithTimes = await db.meetingParticipant.findMany({
      where: {
        userId: { in: userIds },
        meeting: {
          startTime: { gte: since },
          endTime: { not: null },
        },
      },
      select: {
        userId: true,
        meeting: {
          select: { startTime: true, endTime: true },
        },
      },
    });

    const meetingHoursMap = new Map<string, number>();
    for (const entry of meetingsWithTimes) {
      const start = entry.meeting.startTime?.getTime();
      const end = entry.meeting.endTime?.getTime();
      if (start && end && end > start) {
        const hours = (end - start) / 3_600_000;
        meetingHoursMap.set(entry.userId, (meetingHoursMap.get(entry.userId) || 0) + hours);
      }
    }

    // Messages sent per user in date range
    const messageCounts = await db.message.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds },
        createdAt: { gte: since },
      },
      _count: { id: true },
    });

    const messageCountMap = new Map<string, number>();
    for (const mc of messageCounts) {
      messageCountMap.set(mc.userId, mc._count.id);
    }

    // Files uploaded per user in date range
    const fileCounts = await db.file.groupBy({
      by: ['uploadedBy'],
      where: {
        uploadedBy: { in: userIds },
        createdAt: { gte: since },
      },
      _count: { id: true },
    });

    const fileCountMap = new Map<string, number>();
    for (const fc of fileCounts) {
      fileCountMap.set(fc.uploadedBy, fc._count.id);
    }

    // Last activity: latest audit log entry per user in the date range
    const latestActivities = await db.auditLog.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds },
        createdAt: { gte: since },
      },
      _max: { createdAt: true },
    });

    const lastActivityMap = new Map<string, Date | null>();
    for (const la of latestActivities) {
      if (la.userId) {
        lastActivityMap.set(la.userId, la._max.createdAt);
      }
    }

    // Assemble the report
    const report = members.map((member) => {
      const lastActivity = lastActivityMap.get(member.id) || member.lastLogin;
      return {
        userId: member.id,
        name: member.name,
        email: member.email,
        avatar: member.avatar,
        role: member.role,
        meetingCount: meetingCountMap.get(member.id) || 0,
        totalMeetingHours: Math.round((meetingHoursMap.get(member.id) || 0) * 100) / 100,
        messagesSent: messageCountMap.get(member.id) || 0,
        filesUploaded: fileCountMap.get(member.id) || 0,
        lastActive: lastActivity ? lastActivity.toISOString() : null,
      };
    });

    // Sort by meeting count descending
    report.sort((a, b) => b.meetingCount - a.meetingCount);

    // Aggregate totals
    const totals = {
      totalMembers: members.length,
      totalMeetings: report.reduce((sum, u) => sum + u.meetingCount, 0),
      totalMeetingHours: Math.round(report.reduce((sum, u) => sum + u.totalMeetingHours, 0) * 100) / 100,
      totalMessages: report.reduce((sum, u) => sum + u.messagesSent, 0),
      totalFiles: report.reduce((sum, u) => sum + u.filesUploaded, 0),
      activeMembers: report.filter((u) => u.lastActive !== null).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        range,
        days,
        from: since.toISOString(),
        to: new Date().toISOString(),
        users: report,
        totals,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Activity report error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate activity report' } },
      { status: 500 }
    );
  }
}
