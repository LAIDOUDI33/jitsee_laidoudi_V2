import { NextResponse } from 'next/server'

// In-memory store for whiteboard state (mock persistence)
const whiteboardStore = new Map<string, unknown[]>()

/**
 * GET /api/v1/whiteboard
 * Returns the saved whiteboard data for a given session.
 * Query param: sessionId (optional)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId') || 'default'

    const data = whiteboardStore.get(sessionId) || []
    return NextResponse.json({ success: true, data, sessionId })
  } catch {
    return NextResponse.json({ success: false, data: [] }, { status: 500 })
  }
}

/**
 * POST /api/v1/whiteboard
 * Saves whiteboard data for a given session.
 * Body: { sessionId: string, data: unknown[] }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sessionId = 'default', data = [] } = body

    if (!sessionId || !Array.isArray(data)) {
      return NextResponse.json(
        { success: false, error: 'sessionId and data array are required' },
        { status: 400 }
      )
    }

    whiteboardStore.set(sessionId, data)
    return NextResponse.json({ success: true, sessionId, saved: data.length })
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }
}
