import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { meetingId, transcript } = body;

    if (!transcript && !meetingId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Either transcript or meetingId is required' } },
        { status: 400 }
      );
    }

    // If meetingId provided, try to fetch any existing transcript
    let transcriptText = transcript;
    if (!transcriptText && meetingId) {
      const transcriptRecord = await db.transcript.findFirst({
        where: { meetingId },
        orderBy: { createdAt: 'desc' },
      });
      transcriptText = transcriptRecord?.content || undefined;
    }

    const userPrompt = transcriptText
      ? `Please summarize the following meeting transcript:\n\n${transcriptText}`
      : 'Generate a sample meeting summary for a project kickoff meeting about data center deployment.';

    // Use z-ai-web-dev-sdk for AI summarization
    const zai = new ZAI();
    const completion = await zai.chat.completions.create({
      model: 'default',
      messages: [
        {
          role: 'system',
          content:
            'You are ALVISION AI Meeting Assistant. Generate a professional meeting summary with: Executive Summary, Key Topics (array), Decisions (array), Action Items (array with owner, dueDate, priority), Risks (array). Respond in JSON format.',
        },
        { role: 'user', content: userPrompt },
      ],
    });

    const aiMessage = completion.choices?.[0]?.message?.content || '';

    let summary: Record<string, unknown>;
    try {
      // Try to parse as JSON, fallback to wrapping in structure
      const jsonMatch = aiMessage.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        summary = JSON.parse(jsonMatch[0]);
      } else {
        summary = {
          executiveSummary: aiMessage,
          keyTopics: [],
          decisions: [],
          actionItems: [],
          risks: [],
        };
      }
    } catch {
      summary = {
        executiveSummary: aiMessage,
        keyTopics: [],
        decisions: [],
        actionItems: [],
        risks: [],
      };
    }

    // Save MeetingSummary if meetingId exists
    if (meetingId) {
      await db.meetingSummary.create({
        data: {
          meetingId,
          content: summary,
        },
      });
    }

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate summary';
    return NextResponse.json(
      { success: false, error: { code: 'AI_ERROR', message } },
      { status: 500 }
    );
  }
}
