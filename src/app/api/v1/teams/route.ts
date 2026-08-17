import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError, getOrgFilter } from '@/lib/api-auth';

/**
 * GET /api/v1/teams
 * List teams with member counts and channels for the authenticated user.
 */
export async function GET() {
  try {
    const user = await requireAuth();

    const orgFilter = getOrgFilter(user);

    const teams = await db.team.findMany({
      where: orgFilter,
      include: {
        _count: {
          select: {
            members: true,
            channels: true,
          },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
          take: 10,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: { teams },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('List teams error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch teams' } },
      { status: 500 }
    );
  }
}
