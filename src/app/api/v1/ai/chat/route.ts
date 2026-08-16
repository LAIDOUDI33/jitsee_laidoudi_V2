import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, meetingId, context } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Message is required' } },
        { status: 400 }
      );
    }

    // Dynamic import to avoid module-level config issues
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const systemPrompt = `You are ALVISION AI Assistant, an intelligent meeting companion for an enterprise video conferencing platform. Help users with meeting-related questions, provide insights, and assist with collaboration. Be concise and professional. Keep responses under 200 words unless asked for more detail.${context ? `\n\nMeeting context: ${context}` : ''}`;

    const response = await zai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message.trim() },
      ],
      max_tokens: 500,
    });

    const aiMessage = response.choices?.[0]?.message?.content || 'I apologize, I was unable to process your request. Please try again.';

    return NextResponse.json({
      success: true,
      response: aiMessage,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'AI service temporarily unavailable';
    console.error('AI chat error:', msg);
    return NextResponse.json(
      { success: false, error: { code: 'AI_ERROR', message: msg } },
      { status: 503 }
    );
  }
}
