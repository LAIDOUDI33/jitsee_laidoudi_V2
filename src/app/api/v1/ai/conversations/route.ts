import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/api-auth';
import { validateUuid } from '@/lib/security';
import { db } from '@/lib/db';
import { inputSanitizeOptional } from '@/lib/security';

/**
 * GET /api/v1/ai/conversations
 * List all conversations for the authenticated user.
 * Returns id, title, model, updatedAt, and messageCount for each.
 */
export async function GET() {
  try {
    const user = await requireAuth();

    const conversations = await db.aiConversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        model: true,
        updatedAt: true,
        createdAt: true,
        _count: { select: { messages: true } },
      },
    });

    const result = conversations.map(c => ({
      id: c.id,
      title: c.title,
      model: c.model,
      updatedAt: c.updatedAt.toISOString(),
      createdAt: c.createdAt.toISOString(),
      messageCount: c._count.messages,
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('List conversations error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list conversations' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/ai/conversations
 * Create a new conversation.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const title = inputSanitizeOptional(body.title, 200) || 'New Chat';
    const model = inputSanitizeOptional(body.model, 100) || 'gpt-4o-mini';

    const conversation = await db.aiConversation.create({
      data: {
        userId: user.id,
        title,
        model,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: conversation.id,
          title: conversation.title,
          model: conversation.model,
          updatedAt: conversation.updatedAt.toISOString(),
          createdAt: conversation.createdAt.toISOString(),
          messageCount: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create conversation' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/ai/conversations
 * Delete a conversation by ID (verify ownership).
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const id = validateUuid(body.id, 'conversation id');

    // Verify ownership
    const conv = await db.aiConversation.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!conv || conv.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Conversation not found' } },
        { status: 404 }
      );
    }

    await db.aiConversation.delete({ where: { id } });

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Delete conversation error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete conversation' } },
      { status: 500 }
    );
  }
}
