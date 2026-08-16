import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/api-auth';
import { validateInt } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);

    // Pagination with enforced limits (max 100)
    const limit = validateInt(searchParams.get('limit'), 1, 100, 20);
    const offset = validateInt(searchParams.get('offset'), 0, 10000, 0);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: Record<string, unknown> = {};

    if (type && type !== 'all') {
      where.type = type.toLowerCase();
    }
    if (status && status !== 'all') {
      where.status = status.toLowerCase();
    }
    if (dateFrom || dateTo) {
      where.startTime = {} as Record<string, unknown>;
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        if (!isNaN(fromDate.getTime())) (where.startTime as Record<string, unknown>).gte = fromDate;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        if (!isNaN(toDate.getTime())) (where.startTime as Record<string, unknown>).lte = toDate;
      }
    }

    const [sessions, total] = await Promise.all([
      db.meeting.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          participants: {
            include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
          },
          recordings: { select: { id: true, duration: true, url: true, createdAt: true } },
          summaries: { select: { id: true, summary: true, keyTopics: true, createdAt: true } },
        },
      }),
      db.meeting.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { sessions, total, limit, offset },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Sessions API error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch session history' } },
      { status: 500 }
    );
  }
}
