import { NextRequest } from 'next/server';
import { requireAuth, AuthError } from '@/lib/api-auth';
import { sanitizePrompt } from '@/lib/security';
import { db } from '@/lib/db';
import { validateUuidOptional } from '@/lib/security';

const SYSTEM_PROMPT_BASE =
  'You are ALVISION AI Assistant, an intelligent meeting companion for an enterprise video conferencing platform. Help users with meeting-related questions, provide insights, and assist with collaboration. Be concise and professional. Keep responses under 200 words unless asked for more detail.';

const MAX_CONTEXT_MESSAGES = 20;

/**
 * Build an SSE formatted string.
 */
function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { message, model, conversationId } = body;

    // Validate required message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Message is required' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sanitizedMessage = sanitizePrompt(message, 10000);

    // Resolve model — map friendly names to actual model IDs
    const modelMap: Record<string, string> = {
      'alvision-pro': 'gpt-4o-mini',
      'alvision-fast': 'gpt-4o-mini',
      'alvision-creative': 'gpt-4o-mini',
    };
    const resolvedModel = modelMap[model] || model || 'gpt-4o-mini';

    // Resolve or create conversation
    let convId = validateUuidOptional(conversationId);
    let isFirstMessage = false;

    if (convId) {
      // Verify ownership
      const conv = await db.aiConversation.findUnique({
        where: { id: convId },
        select: { userId: true },
      });
      if (!conv || conv.userId !== user.id) {
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Conversation not found' },
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Auto-create a new conversation
      const newConv = await db.aiConversation.create({
        data: {
          userId: user.id,
          title: sanitizedMessage.slice(0, 80),
          model: resolvedModel,
        },
      });
      convId = newConv.id;
      isFirstMessage = true;
    }

    // Save user message
    await db.aiConversationMessage.create({
      data: {
        conversationId: convId,
        role: 'user',
        content: sanitizedMessage,
      },
    });

    // Load recent conversation context
    const recentMessages = await db.aiConversationMessage.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: 'asc' },
      take: MAX_CONTEXT_MESSAGES,
      select: { role: true, content: true },
    });

    // Build messages array for the AI
    const aiMessages: { role: string; content: string }[] = [
      { role: 'system', content: SYSTEM_PROMPT_BASE },
      ...recentMessages.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    ];

    // Initialize the z-ai-web-dev-sdk
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    // Create a streaming response using ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullContent = '';

        try {
          // Send the conversation ID first so the client can track it
          controller.enqueue(
            encoder.encode(sseEvent({ type: 'meta', conversationId: convId }))
          );

          // Call the AI SDK
          const response = await zai.chat.completions.create({
            model: resolvedModel,
            messages: aiMessages,
            max_tokens: 500,
            stream: true,
          });

          // Check if the response is a stream (AsyncIterable)
          if (response && typeof (response as unknown as AsyncIterable<unknown>)[Symbol.asyncIterator] === 'function') {
            for await (const chunk of response as unknown as AsyncIterable<{ choices?: { delta?: { content?: string } } }>) {
              const delta = chunk?.choices?.[0]?.delta?.content;
              if (delta) {
                fullContent += delta;
                controller.enqueue(
                  encoder.encode(sseEvent({ type: 'chunk', content: delta }))
                );
              }
            }
          } else {
            // Fallback: the SDK returned a non-streaming response
            const content =
              (response as unknown as { choices?: { message?: { content?: string } } })
                ?.choices?.[0]?.message?.content ||
              'I apologize, I was unable to process your request.';
            fullContent = content;
            controller.enqueue(
              encoder.encode(sseEvent({ type: 'chunk', content }))
            );
          }

          // Save assistant message to DB
          if (fullContent) {
            await db.aiConversationMessage.create({
              data: {
                conversationId: convId!,
                role: 'assistant',
                content: fullContent,
              },
            });

            // Auto-generate title from first user message if still default
            if (isFirstMessage) {
              const title = sanitizedMessage.length > 80
                ? sanitizedMessage.slice(0, 77) + '...'
                : sanitizedMessage;
              await db.aiConversation.update({
                where: { id: convId },
                data: { title },
              });
            }

            // Touch updatedAt
            await db.aiConversation.update({
              where: { id: convId },
              data: { updatedAt: new Date() },
            });
          }

          controller.enqueue(encoder.encode(sseEvent({ type: 'done' })));
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Stream error';
          console.error('AI stream error:', msg);
          // Send error event to client
          controller.enqueue(
            encoder.encode(sseEvent({ type: 'error', message: msg }))
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: error.code, message: error.message },
        }),
        { status: error.statusCode, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const msg = error instanceof Error ? error.message : 'AI service temporarily unavailable';
    console.error('AI chat-stream error:', msg);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'AI_ERROR', message: msg },
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
