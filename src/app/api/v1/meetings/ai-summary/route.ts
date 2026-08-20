import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/api-auth';
import { sanitizePrompt, inputSanitizeOptional, SecurityError } from '@/lib/security';

const SYSTEM_PROMPT =
  'You are an expert meeting summarizer for ALVISION video conferencing. Analyze the provided meeting notes and generate a comprehensive summary with executive summary, key points, action items, decisions, and next steps. Use markdown formatting.';

const STRUCTURED_USER_PROMPT = `Analyze the following meeting notes and generate a comprehensive, well-structured summary. Use EXACTLY this markdown format:

## Executive Summary
2-3 paragraphs providing a high-level overview of the meeting.

## Key Discussion Points
- Bullet point 1
- Bullet point 2
- Bullet point 3

## Action Items
For each action item include: task description, assignee (if mentioned), priority (high/medium/low), and deadline (if mentioned).
- [HIGH] Task description — @Assignee — Due: date
- [MEDIUM] Task description
- [LOW] Task description — Due: date

## Decisions Made
- Decision 1
- Decision 2

## Next Steps
1. Step 1
2. Step 2
3. Step 3

Here are the meeting notes:

`;

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { notes, meetingTitle, participants } = body;

    // --- Validate notes ------------------------------------------------------
    if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Meeting notes are required and cannot be empty' } },
        { status: 400 }
      );
    }

    // Sanitize and truncate notes
    const safeNotes = sanitizePrompt(notes, 15000);

    // Optional fields
    const safeTitle = inputSanitizeOptional(meetingTitle, 500);
    const safeParticipants = Array.isArray(participants)
      ? participants
          .filter((p: unknown) => typeof p === 'string' && p.trim().length > 0)
          .slice(0, 50)
          .map((p: string) => p.trim().slice(0, 100))
      : undefined;

    // --- Build user prompt ---------------------------------------------------
    let userContent = STRUCTURED_USER_PROMPT + safeNotes;

    if (safeTitle) {
      userContent = `Meeting Title: ${safeTitle}\n\n` + userContent;
    }
    if (safeParticipants && safeParticipants.length > 0) {
      userContent = `Participants: ${safeParticipants.join(', ')}\n\n` + userContent;
    }

    // --- Call LLM -----------------------------------------------------------
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      max_tokens: 2000,
    });

    const rawSummary = completion.choices?.[0]?.message?.content;
    if (!rawSummary) {
      return NextResponse.json(
        { success: false, error: { code: 'AI_ERROR', message: 'AI failed to generate a summary. Please try again.' } },
        { status: 500 }
      );
    }

    // --- Parse summary into sections -----------------------------------------
    const sections = parseSummarySections(rawSummary);

    // --- Audit log -----------------------------------------------------------
    const { db } = await import('@/lib/db');
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'AI_NOTES_SUMMARIZE',
        resource: 'MeetingNotes',
        details: `AI summary generated for meeting notes (${safeNotes.length} chars)`,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        raw: rawSummary,
        sections,
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
    const msg = error instanceof Error ? error.message : 'Failed to generate AI summary';
    console.error('AI notes summary error:', msg);
    return NextResponse.json(
      { success: false, error: { code: 'AI_ERROR', message: msg } },
      { status: 500 }
    );
  }
}

// ── Section Parser ────────────────────────────────────────────────────────────

interface SummarySections {
  executiveSummary: string;
  keyPoints: string[];
  actionItems: string[];
  decisions: string[];
  nextSteps: string[];
}

function parseSummarySections(raw: string): SummarySections {
  const result: SummarySections = {
    executiveSummary: '',
    keyPoints: [],
    actionItems: [],
    decisions: [],
    nextSteps: [],
  };

  // Split by H2 headings
  const parts = raw.split(/^##\s+(.+)$/m);
  // parts[0] is before first heading (empty or intro), then alternating: heading, content

  for (let i = 1; i < parts.length; i += 2) {
    const heading = parts[i]?.trim().toLowerCase() ?? '';
    const content = parts[i + 1]?.trim() ?? '';

    if (/executive\s*summary/.test(heading)) {
      result.executiveSummary = content;
    } else if (/key\s*(discussion\s*)?points|key\s*topics/.test(heading)) {
      result.keyPoints = extractBullets(content);
    } else if (/action\s*items?/.test(heading)) {
      result.actionItems = extractBullets(content);
    } else if (/decisions?\s*made/.test(heading)) {
      result.decisions = extractBullets(content);
    } else if (/next\s*steps?/.test(heading)) {
      result.nextSteps = extractBullets(content);
    }
  }

  // If no executive summary was extracted, use the first paragraph(s) of raw
  if (!result.executiveSummary) {
    const lines = raw.split('\n').filter((l) => l.trim().length > 0);
    result.executiveSummary = lines.slice(0, 3).join('\n');
  }

  return result;
}

function extractBullets(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').trim())
    .filter((line) => line.length > 0);
}
