import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/api-auth';
import { validateUuid } from '@/lib/security';
import { db } from '@/lib/db';

/**
 * GET /api/v1/ai/conversations/[id]/messages
 * Load all messages for a specific conversation (verify ownership).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const conversationId = validateUuid(id, 'conversation id');

    // Verify ownership
    const conv = await db.aiConversation.findUnique({
      where: { id: conversationId },
      select: { userId: true, title: true, model: true },
    });

    if (!conv || conv.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Conversation not found' } },
        { status: 404 }
      );
    }

    const messages = await db.aiConversationMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        conversation: {
          id: conversationId,
          title: conv.title,
          model: conv.model,
        },
        messages: messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Load conversation messages error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load messages' } },
      { status: 500 }
    );
  }
}
