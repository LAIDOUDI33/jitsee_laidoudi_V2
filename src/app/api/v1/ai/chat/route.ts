import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

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

    // Build user prompt with optional context and meetingId
    let userPrompt = message.trim();
    if (context && typeof context === 'string' && context.trim().length > 0) {
      userPrompt = `Context: ${context.trim()}

Question: ${userPrompt}`;
    }
    if (meetingId) {
      userPrompt = `[Meeting ID: ${meetingId}]
${userPrompt}`;
    }

    // Use z-ai-web-dev-sdk for AI chat
    const zai = new ZAI();
    const completion = await zai.chat.completions.create({
      model: 'default',
      messages: [
        {
          role: 'system',
          content:
            'You are ALVISION AI Assistant, an intelligent meeting companion. Help users with meeting-related questions, provide insights, and assist with collaboration. Be concise and professional.',
        },
        { role: 'user', content: userPrompt },
      ],
    });

    const aiMessage = completion.choices?.[0]?.message?.content || 'I was unable to generate a response. Please try again.';

    return NextResponse.json({
      success: true,
      response: aiMessage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process chat request';
    return NextResponse.json(
      { success: false, error: { code: 'AI_ERROR', message } },
      { status: 500 }
    );
  }
}
