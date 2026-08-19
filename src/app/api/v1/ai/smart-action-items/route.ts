// --- AI Smart Action Item Extraction Endpoint ---------------------------------------------
// Extracts action items from meeting transcripts using LLM.
// Saves extracted items to the ActionItem table.
// Task ID: phase6-ai-backend

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/api-auth';
import { validateUuid, sanitizePrompt, inputSanitizeOptional, SecurityError } from '@/lib/security';

interface ExtractedActionItem {
  content: string;
  suggestedOwner: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  suggestedDueDate: string | null;
}

const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { meetingId, content } = body;

    // --- Validate required: meetingId ----------------------------------------
    const safeMeetingId = validateUuid(meetingId, 'meetingId');

    // --- Build content from transcripts or provided content -------------------
    let contentText: string;

    if (content && typeof content === 'string' && content.trim().length > 0) {
      contentText = sanitizePrompt(content, 10000);
    } else {
      // Fetch transcripts from DB
      const transcripts = await db.transcript.findMany({
        where: { meetingId: safeMeetingId },
        orderBy: { timestamp: 'asc' },
        take: 100,
      });

      if (transcripts.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: 'NO_CONTENT', message: 'No transcripts found for this meeting and no content provided' } },
          { status: 400 }
        );
      }

      contentText = transcripts
        .map((t) => `[${t.speakerName}]: ${t.text}`)
        .join('\n');
    }

    // --- Call LLM to extract action items -------------------------------------
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are ALVISION AI Meeting Assistant. Extract action items from the meeting transcript.

For each action item, return a JSON object with:
- "content": clear description of the task (required)
- "suggestedOwner": name of the person responsible, or null if unclear
- "priority": one of "low", "medium", "high", "critical" (default: "medium")
- "suggestedDueDate": ISO 8601 date string if a deadline was mentioned, or null

Return ONLY a valid JSON array of objects. No markdown, no explanation, no extra text.
Example: [{"content":"Update the API documentation","suggestedOwner":"Alice","priority":"high","suggestedDueDate":"2025-02-15T00:00:00.000Z"}]`,
        },
        { role: 'user', content: `Extract action items from:\n\n${contentText}` },
      ],
      max_tokens: 1500,
    });

    const rawResponse = completion.choices?.[0]?.message?.content || '[]';

    // --- Parse LLM response --------------------------------------------------
    let extractedItems: ExtractedActionItem[];
    try {
      const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        extractedItems = JSON.parse(jsonMatch[0]);
      } else {
        extractedItems = [];
      }
    } catch {
      extractedItems = [];
    }

    // Validate and normalize items
    const validItems = extractedItems
      .filter((item) => item.content && typeof item.content === 'string' && item.content.trim().length > 0)
      .map((item) => ({
        content: item.content.trim().slice(0, 500),
        suggestedOwner: typeof item.suggestedOwner === 'string' ? item.suggestedOwner.trim().slice(0, 100) : null,
        priority: VALID_PRIORITIES.includes(item.priority) ? item.priority : 'medium',
        suggestedDueDate: isValidIsoDate(item.suggestedDueDate) ? item.suggestedDueDate : null,
      }));

    // --- Resolve owner IDs and save to DB -------------------------------------
    // Fetch meeting participants for owner name matching
    const participants = await db.meetingParticipant.findMany({
      where: { meetingId: safeMeetingId },
      include: { user: { select: { id: true, name: true } } },
    });

    const savedItems = await Promise.all(
      validItems.map(async (item) => {
        // Try to match suggestedOwner to a participant by name
        let ownerId = user.id; // default to current user

        if (item.suggestedOwner) {
          const matched = participants.find(
            (p) =>
              p.user.name.toLowerCase() === item.suggestedOwner!.toLowerCase() ||
              p.user.name.toLowerCase().includes(item.suggestedOwner!.toLowerCase())
          );
          if (matched) {
            ownerId = matched.userId;
          }
        }

        const dueDate = item.suggestedDueDate ? new Date(item.suggestedDueDate) : null;

        return db.actionItem.create({
          data: {
            content: item.content,
            ownerId,
            meetingId: safeMeetingId,
            dueDate,
            priority: item.priority,
            status: 'pending',
          },
          include: {
            owner: { select: { id: true, name: true, email: true } },
          },
        });
      })
    );

    // --- Audit log -----------------------------------------------------------
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'AI_EXTRACT_ACTION_ITEMS',
        resource: 'ActionItem',
        resourceId: safeMeetingId,
        details: `Extracted ${savedItems.length} action items from meeting ${safeMeetingId}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        actionItems: savedItems.map((item) => ({
          id: item.id,
          content: item.content,
          owner: item.owner,
          priority: item.priority,
          dueDate: item.dueDate,
          status: item.status,
          createdAt: item.createdAt,
        })),
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
    const msg = error instanceof Error ? error.message : 'Action item extraction temporarily unavailable';
    console.error('AI smart-action-items error:', msg);
    return NextResponse.json(
      { success: false, error: { code: 'AI_ERROR', message: msg } },
      { status: 503 }
    );
  }
}

// --- Helpers ---------------------------------------------------------------------------

function isValidIsoDate(value: unknown): value is string {
  if (!value || typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}
