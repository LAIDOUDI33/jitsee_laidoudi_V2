import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/api-auth';
import { sanitizePrompt } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { message, context } = body;

    // Validate required message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Message is required' } },
        { status: 400 }
      );
    }

    // Sanitize user message — truncate to 10000 chars
    const sanitizedMessage = sanitizePrompt(message, 10000);

    // Sanitize context if provided — truncate to 10000 chars
    let sanitizedContext: string | null = null;
    if (context) {
      sanitizedContext = sanitizePrompt(context, 10000);
    }

    // Dynamic import to avoid module-level config issues
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const systemPrompt = `You are ALVISION AI Assistant, an intelligent meeting companion for an enterprise video conferencing platform. Help users with meeting-related questions, provide insights, and assist with collaboration. Be concise and professional. Keep responses under 200 words unless asked for more detail.${
      sanitizedContext ? `\n\nMeeting context: ${sanitizedContext}` : ''
    }`;

    const response = await zai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: sanitizedMessage },
      ],
      max_tokens: 500,
    });

    const aiMessage = response.choices?.[0]?.message?.content || 'I apologize, I was unable to process your request. Please try again.';

    return NextResponse.json({
      success: true,
      data: { response: aiMessage },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    const msg = error instanceof Error ? error.message : 'AI service temporarily unavailable';
    console.error('AI chat error:', msg);
    return NextResponse.json(
      { success: false, error: { code: 'AI_ERROR', message: msg } },
      { status: 503 }
    );
  }
}
