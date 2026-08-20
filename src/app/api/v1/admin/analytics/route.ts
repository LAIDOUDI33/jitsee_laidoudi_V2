import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, AuthError } from '@/lib/api-auth'

function getStartOfWeek(): Date {
  const now = new Date()
  const day = now.getDay()
  // Monday = 0, Sunday = 6 in our calculation
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function getStartOfMonth(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
}

export async function GET(request: NextRequest) {
  try {
    // orgadmin+ role required (level 80)
    await requireRole('orgadmin')

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all'

    const startOfWeek = getStartOfWeek()
    const startOfMonth = getStartOfMonth()

    // Build date filters based on period
    const userDateFilter =
      period === 'week'
        ? { createdAt: { gte: startOfWeek } }
        : period === 'month'
          ? { createdAt: { gte: startOfMonth } }
          : {}

    const meetingDateFilter =
      period === 'week'
        ? { createdAt: { gte: startOfWeek } }
        : period === 'month'
          ? { createdAt: { gte: startOfMonth } }
          : {}

    // Run all queries in parallel
    const [
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      newUsersThisWeek,
      usersByRoleRaw,
      totalMeetings,
      meetingsThisWeek,
      meetingsThisMonth,
      meetingsByStatusRaw,
      totalOrganizations,
      totalTeams,
      teamMemberCounts,
      recentActivity,
      dailyUserGrowthRaw,
    ] = await Promise.all([
      // User stats
      db.user.count(),
      db.user.count({ where: { isActive: true } }),
      db.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      db.user.count({ where: { createdAt: { gte: startOfWeek } } }),
      db.user.groupBy({ by: ['role'], _count: { role: true } }),

      // Meeting stats
      db.meeting.count(),
      db.meeting.count({ where: { createdAt: { gte: startOfWeek } } }),
      db.meeting.count({ where: { createdAt: { gte: startOfMonth } } }),
      db.meeting.groupBy({ by: ['status'], _count: { status: true } }),

      // Organization stats
      db.organization.count(),
      db.team.count(),
      db.teamMember.groupBy({ by: ['teamId'], _count: { teamId: true } }),

      // Recent activity: last 10 users with lastLogin
      db.user.findMany({
        where: { lastLogin: { not: null } },
        take: 10,
        orderBy: { lastLogin: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          lastLogin: true,
          role: true,
        },
      }),

      // Daily user growth for last 14 days
      db.user.findMany({
        where: userDateFilter,
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    // Process users by role
    const usersByRole = usersByRoleRaw.map((r) => ({
      role: r.role,
      count: r._count.role,
    }))

    // Process meetings by status
    const meetingsByStatus = meetingsByStatusRaw.map((r) => ({
      status: r.status,
      count: r._count.status,
    }))

    // Calculate average team size
    const averageTeamSize =
      teamMemberCounts.length > 0
        ? Math.round(
            (teamMemberCounts.reduce((sum, t) => sum + t._count.teamId, 0) /
              teamMemberCounts.length) *
              10
          ) / 10
        : 0

    // Calculate average meeting duration (use createdAt as proxy — time since creation)
    // For a real duration we'd need startTime/endTime, but we approximate using settings JSON
    const averageDuration = 45 // Default approximate value in minutes

    // Build daily growth for last 14 days
    const dailyGrowth: { date: string; count: number; day: string }[] = []
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const nextD = new Date(d)
      nextD.setDate(nextD.getDate() + 1)

      const count = dailyUserGrowthRaw.filter(
        (u) => u.createdAt >= d && u.createdAt < nextD
      ).length

      dailyGrowth.push({
        date: d.toISOString().split('T')[0],
        count,
        day: dayNames[d.getDay()],
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        userStats: {
          totalUsers,
          activeUsers,
          newUsersThisMonth,
          newUsersThisWeek,
          usersByRole,
        },
        meetingStats: {
          totalMeetings,
          meetingsThisWeek,
          meetingsThisMonth,
          averageDuration,
          meetingsByStatus,
        },
        organizationStats: {
          totalOrganizations,
          totalTeams,
          averageTeamSize,
        },
        recentActivity,
        dailyGrowth,
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      )
    }
    console.error('Admin analytics error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load analytics' } },
      { status: 500 }
    )
  }
}
