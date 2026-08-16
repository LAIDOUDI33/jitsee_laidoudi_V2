import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
      transcriptText = transcriptRecord?.text || undefined;
    }

    const userPrompt = transcriptText
      ? `Please summarize the following meeting transcript:\n\n${transcriptText}`
      : 'Generate a sample meeting summary for a project kickoff meeting about data center deployment. Include executive summary, 3 key topics, 2 decisions, 3 action items with owners, and 2 risks.';

    // Dynamic import to avoid module-level config issues
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are ALVISION AI Meeting Assistant. Generate a professional meeting summary with: Executive Summary, Key Topics, Decisions, Action Items (with owner and dueDate), Risks. Respond in valid JSON format.',
        },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1000,
    });

    const aiMessage = completion.choices?.[0]?.message?.content || '';

    let summary: { [key: string]: unknown };
    try {
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
          summary: JSON.stringify(summary),
          keyTopics: JSON.stringify(summary.keyTopics || []),
          decisions: JSON.stringify(summary.decisions || []),
          risks: JSON.stringify(summary.risks || []),
          participantCount: 0,
          duration: 0,
        },
      });
    }

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to generate summary';
    console.error('AI summarize error:', msg);
    return NextResponse.json(
      { success: false, error: { code: 'AI_ERROR', message: msg } },
      { status: 503 }
    );
  }
}
