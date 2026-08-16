import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/api-auth';

// In-memory store for whiteboard state (mock persistence)
const whiteboardStore = new Map<string, unknown[]>();

/**
 * GET /api/v1/whiteboard
 * Returns the saved whiteboard data for a given session.
 * Query param: sessionId (optional)
 */
export async function GET(request: Request) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || 'default';

    // Validate sessionId format
    if (typeof sessionId !== 'string' || sessionId.length > 100) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid session ID' } },
        { status: 400 }
      );
    }

    const data = whiteboardStore.get(sessionId) || [];
    return NextResponse.json({ success: true, data: { data, sessionId, userId: user.id } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch whiteboard' } }, { status: 500 });
  }
}

/**
 * POST /api/v1/whiteboard
 * Saves whiteboard data for a given session.
 * Body: { sessionId: string, data: unknown[] }
 */
export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { sessionId = 'default', data = [] } = body;

    if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 100) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Valid sessionId is required' } },
        { status: 400 }
      );
    }

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Data must be an array' } },
        { status: 400 }
      );
    }

    // Limit data size to prevent memory abuse
    if (data.length > 10000) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Data array exceeds maximum size of 10000 items' } },
        { status: 400 }
      );
    }

    whiteboardStore.set(sessionId, data);
    return NextResponse.json({ success: true, data: { sessionId, saved: data.length, userId: user.id } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request body' } },
      { status: 400 }
    );
  }
}
