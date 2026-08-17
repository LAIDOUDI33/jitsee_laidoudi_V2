import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/api-auth';
import { validateUuid } from '@/lib/security';

/**
 * GET /api/v1/sessions
 * List all active login sessions for the authenticated user.
 */
export async function GET() {
  try {
    const user = await requireAuth();

    // Clean up expired sessions first (lazy cleanup)
    await db.session.deleteMany({
      where: {
        userId: user.id,
        expiresAt: { lt: new Date() },
      },
    });

    const sessions = await db.session.findMany({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        lastActivity: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { lastActivity: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: { sessions },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error('List sessions error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch sessions' } },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/v1/sessions?id=xxx
 * DELETE /api/v1/sessions?all=true
 * Terminate a specific session or all other sessions.
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');
    const terminateAll = searchParams.get('all') === 'true';

    if (terminateAll) {
      // Delete all sessions except the current one
      // We identify the current session by the most recently active one
      const currentSession = await db.session.findFirst({
        where: {
          userId: user.id,
          expiresAt: { gt: new Date() },
        },
        orderBy: { lastActivity: 'desc' },
        select: { id: true },
      });

      const result = await db.session.deleteMany({
        where: {
          userId: user.id,
          ...(currentSession ? { id: { not: currentSession.id } } : {}),
        },
      });

      return NextResponse.json({
        success: true,
        data: { terminated: result.count },
      });
    }

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Provide ?id=xxx or ?all=true' } },
        { status: 400 },
      );
    }

    const validId = validateUuid(sessionId, 'id');

    const session = await db.session.findUnique({
      where: { id: validId },
    });

    if (!session || session.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } },
        { status: 404 },
      );
    }

    await db.session.delete({ where: { id: validId } });

    return NextResponse.json({
      success: true,
      data: { terminated: true },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error('Delete sessions error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to terminate session' } },
      { status: 500 },
    );
  }
}
