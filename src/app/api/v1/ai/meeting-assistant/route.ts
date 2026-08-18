// --- AI Meeting Assistant Endpoint ----------------------------------------------------------
// Context-aware assistant that answers questions about a specific meeting.
// Fetches transcripts, summaries, and notes from DB to build context.
// Task ID: phase6-ai-backend

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/api-auth';
import { validateUuid, sanitizePrompt, inputSanitize, SecurityError } from '@/lib/security';
import { hasMinimumRole, ROLES } from '@/lib/roles';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { meetingId, question, context: additionalContext } = body;

    // --- Validate required fields ----------------------------------------------
    const safeMeetingId = validateUuid(meetingId, 'meetingId');
    const safeQuestion = inputSanitize(question, 500, 'question');

    // --- Fetch meeting with access check ---------------------------------------
    const meeting = await db.meeting.findUnique({
      where: { id: safeMeetingId },
      include: {
        participants: { select: { userId: true } },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Meeting not found' } },
        { status: 404 }
      );
    }

    // Authorization: must be participant, host, or orgadmin+
    const isAdmin = hasMinimumRole(user.role, ROLES.ORGADMIN);
    const isHost = meeting.hostId === user.id;
    const isParticipant = meeting.participants.some((p) => p.userId === user.id);

    if (!isHost && !isParticipant && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to this meeting' } },
        { status: 403 }
      );
    }

    // --- Fetch meeting context data --------------------------------------------
    const [transcripts, summaries, notes] = await Promise.all([
      db.transcript.findMany({
        where: { meetingId: safeMeetingId },
        orderBy: { timestamp: 'asc' },
        take: 100,
      }),
      db.meetingSummary.findMany({
        where: { meetingId: safeMeetingId },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      // Notes are stored as JSON in meeting.notes
      Promise.resolve(meeting.notes),
    ]);

    // --- Build context string --------------------------------------------------
    const contextParts: string[] = [];

    // Meeting metadata
    contextParts.push(`Meeting: ${meeting.title}`);
    if (meeting.startTime) {
      contextParts.push(`Date: ${meeting.startTime.toISOString()}`);
    }
    contextParts.push(`Status: ${meeting.status}`);

    // Transcripts
    if (transcripts.length > 0) {
      const transcriptText = transcripts
        .map((t) => `[${t.speakerName}]: ${t.text}`)
        .join('\n');
      contextParts.push(`\n## Meeting Transcript:\n${transcriptText}`);
    }

    // Summaries
    if (summaries.length > 0) {
      const summaryText = summaries.map((s) => s.summary).join('\n---\n');
      contextParts.push(`\n## Existing Summaries:\n${summaryText}`);
    }

    // Meeting notes
    if (notes && notes !== '{}') {
      try {
        const parsedNotes = JSON.parse(notes);
        if (parsedNotes.content) {
          contextParts.push(`\n## Meeting Notes:\n${parsedNotes.content}`);
        }
      } catch {
        // notes content not valid JSON — skip
      }
    }

    // Additional context from caller
    if (additionalContext) {
      const safeAdditionalContext = sanitizePrompt(additionalContext, 5000);
      contextParts.push(`\n## Additional Context:\n${safeAdditionalContext}`);
    }

    const fullContext = contextParts.join('\n');

    // --- Call LLM -------------------------------------------------------------
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are ALVISION AI Meeting Assistant. You answer questions about a specific meeting based on its transcripts, summaries, and notes. Be accurate — only reference information present in the meeting data. If uncertain, say so. Be concise and professional. Keep responses under 300 words unless asked for more detail.\n\n${fullContext}`,
        },
        { role: 'user', content: safeQuestion },
      ],
      max_tokens: 800,
    });

    const answer = completion.choices?.[0]?.message?.content || 'I was unable to process your question. Please try again.';

    // Build sources list from which transcripts/summaries were used
    const sources = transcripts
      .slice(-5)
      .map((t) => ({ type: 'transcript' as const, id: t.id, speakerName: t.speakerName }));

    if (summaries.length > 0) {
      sources.push({ type: 'summary' as const, id: summaries[0].id });
    }

    // --- Audit log ------------------------------------------------------------
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'AI_MEETING_ASSISTANT',
        resource: 'Meeting',
        resourceId: safeMeetingId,
        details: `Asked: ${safeQuestion.slice(0, 100)}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: { answer, sources },
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
    const msg = error instanceof Error ? error.message : 'Meeting assistant temporarily unavailable';
    console.error('AI meeting-assistant error:', msg);
    return NextResponse.json(
      { success: false, error: { code: 'AI_ERROR', message: msg } },
      { status: 503 }
    );
  }
}
