// --- AI Meeting Summarization Endpoint ---------------------------------------------------
// Enhanced with multiple summary types: brief, detailed, action-items, key-topics.
// Fetches existing transcripts from DB when meetingId is provided.
// Task ID: phase6-ai-backend

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/api-auth';
import { sanitizePrompt, validateUuidOptional, inputSanitizeOptional, SecurityError } from '@/lib/security';

type SummaryType = 'brief' | 'detailed' | 'action-items' | 'key-topics';

const VALID_TYPES: SummaryType[] = ['brief', 'detailed', 'action-items', 'key-topics'];

const SYSTEM_PROMPTS: Record<SummaryType, string> = {
  brief:
    'You are ALVISION AI Meeting Assistant. Generate a concise 2-3 sentence summary of the meeting transcript. Focus on the main outcome and key takeaway.',
  detailed:
    'You are ALVISION AI Meeting Assistant. Generate a comprehensive meeting summary with the following sections:\n\n## Executive Summary\n2-3 paragraph overview of the meeting.\n\n## Key Topics Discussed\nBulleted list of main topics with brief descriptions.\n\n## Decisions Made\nBulleted list of decisions with rationale.\n\n## Action Items\nNumbered list with owner and suggested deadline.\n\n## Risks & Concerns\nBulleted list of identified risks.\n\nRespond in plain text with markdown headings. Do NOT wrap in JSON.',
  'action-items':
    'You are ALVISION AI Meeting Assistant. Extract ONLY action items from the meeting transcript. For each action item, provide:\n- A clear description of the task\n- Who is responsible (or "Unassigned" if unclear)\n- Priority level (high/medium/low)\n- Suggested deadline if mentioned (or "No deadline specified")\n\nFormat as a numbered list. Do NOT include any other sections or commentary.',
  'key-topics':
    'You are ALVISION AI Meeting Assistant. Extract the main discussion topics from the meeting transcript. For each topic, provide:\n- Topic name (2-5 words)\n- Brief summary of the discussion (1-2 sentences)\n- Key participants mentioned\n\nFormat as a bulleted list. Do NOT include any other sections.',
};

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { meetingId, transcript, type } = body;

    // --- Validate summary type -------------------------------------------------
    const safeType = inputSanitizeOptional(type, 30) as SummaryType | null;
    const summaryType: SummaryType = safeType && VALID_TYPES.includes(safeType) ? safeType : 'brief';

    if (!transcript && !meetingId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Either transcript or meetingId is required' } },
        { status: 400 }
      );
    }

    const safeMeetingId = validateUuidOptional(meetingId);

    // --- Build transcript text -------------------------------------------------
    let transcriptText: string | undefined;

    if (safeMeetingId) {
      // Fetch ALL transcripts for this meeting (not just the first one)
      const transcriptRecords = await db.transcript.findMany({
        where: { meetingId: safeMeetingId },
        orderBy: { timestamp: 'asc' },
      });

      if (transcriptRecords.length > 0) {
        transcriptText = transcriptRecords
          .map((t) => `[${t.speakerName}]: ${t.text}`)
          .join('\n');
      }
    }

    // Override with provided transcript if given
    if (transcript && typeof transcript === 'string' && transcript.trim().length > 0) {
      transcriptText = sanitizePrompt(transcript, 10000);
    }

    // --- Build prompt ---------------------------------------------------------
    const userPrompt = transcriptText
      ? `Summarize the following meeting transcript:\n\n${transcriptText}`
      : 'Generate a sample meeting summary for a project kickoff meeting about data center deployment.';

    // --- Call LLM -------------------------------------------------------------
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS[summaryType] },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: summaryType === 'brief' ? 300 : 1500,
    });

    const summaryText = completion.choices?.[0]?.message?.content || 'Unable to generate summary.';

    // --- Save to MeetingSummary if meetingId exists ---------------------------
    if (safeMeetingId) {
      await db.meetingSummary.create({
        data: {
          meetingId: safeMeetingId,
          summary: summaryText,
          keyTopics: summaryType === 'key-topics' ? JSON.stringify([]) : JSON.stringify([]),
          decisions: JSON.stringify([]),
          risks: JSON.stringify([]),
          participantCount: 0,
          duration: 0,
        },
      });
    }

    // --- Audit log ------------------------------------------------------------
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'AI_SUMMARIZE',
        resource: 'MeetingSummary',
        resourceId: safeMeetingId || undefined,
        details: `Generated ${summaryType} summary${safeMeetingId ? ` for meeting ${safeMeetingId}` : ''}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        type: summaryType,
        summary: summaryText,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    if (error instanceof SecurityError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    const msg = error instanceof Error ? error.message : 'Failed to generate summary';
    console.error('AI summarize error:', msg);
    return NextResponse.json(
      { success: false, error: { code: 'AI_ERROR', message: msg } },
      { status: 503 }
    );
  }
}
