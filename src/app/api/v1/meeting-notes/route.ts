import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/api-auth';
import { validateUuid, SecurityError } from '@/lib/security';

// ── Types ──────────────────────────────────────────────────────────────────

interface NotesPayload {
  title: string;
  content: string; // HTML
}

interface ActionItemPayload {
  id?: string;
  text: string;
  assignee: string;
  assigneeInitials: string;
  assigneeColor: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  done: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatMsOffset(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function nameToInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const SPEAKER_COLORS = [
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-sky-500',
  'bg-rose-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-pink-500',
];

const speakerColorMap = new Map<string, string>();
let colorIdx = 0;

function getSpeakerColor(speakerName: string): string {
  if (!speakerColorMap.has(speakerName)) {
    speakerColorMap.set(speakerName, SPEAKER_COLORS[colorIdx % SPEAKER_COLORS.length]);
    colorIdx++;
  }
  return speakerColorMap.get(speakerName)!;
}

// ── GET: Fetch meeting notes, transcript, and action items ─────────────────

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const rawMeetingId = searchParams.get('meetingId');

    if (!rawMeetingId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'meetingId query parameter is required' } },
        { status: 400 }
      );
    }

    const meetingId = validateUuid(rawMeetingId, 'meetingId');

    // Fetch meeting with related data
    const meeting = await db.meeting.findUnique({
      where: { id: meetingId },
      include: {
        host: { select: { id: true, name: true } },
        participants: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        transcripts: {
          orderBy: { timestamp: 'asc' },
        },
        summaries: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        actionItems: {
          include: {
            owner: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Meeting not found' } },
        { status: 404 }
      );
    }

    // Authorization: must be participant, host, or admin
    const ROLE_LEVELS: Record<string, number> = {
      superadmin: 100, orgadmin: 80, teamadmin: 60, host: 40, participant: 20, guest: 10,
    };
    const userLevel = ROLE_LEVELS[user.role] ?? 0;
    const isAdmin = userLevel >= 80;
    const isHost = meeting.hostId === user.id;
    const isParticipant = meeting.participants.some((p) => p.userId === user.id);

    if (!isHost && !isParticipant && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to this meeting' } },
        { status: 403 }
      );
    }

    // Parse stored notes JSON
    let notesData: NotesPayload = { title: meeting.title, content: '' };
    try {
      const parsed = JSON.parse(meeting.notes);
      if (parsed && typeof parsed === 'object') {
        notesData.title = parsed.title || meeting.title;
        notesData.content = parsed.content || '';
      }
    } catch {
      // notes field is not valid JSON — use defaults
    }

    // If no notes content, try to populate from the latest summary
    if (!notesData.content && meeting.summaries.length > 0) {
      const summary = meeting.summaries[0];
      let html = `<p>${summary.summary}</p>`;
      try {
        const topics = JSON.parse(summary.keyTopics);
        if (Array.isArray(topics) && topics.length > 0) {
          html += '<p><b>Key Topics:</b></p><ul>';
          for (const t of topics) html += `<li>${t}</li>`;
          html += '</ul>';
        }
      } catch { /* ignore */ }
      try {
        const decisions = JSON.parse(summary.decisions);
        if (Array.isArray(decisions) && decisions.length > 0) {
          html += '<p><b>Decisions:</b></p><ul>';
          for (const d of decisions) html += `<li>${d}</li>`;
          html += '</ul>';
        }
      } catch { /* ignore */ }
      notesData.content = html;
    }

    // Build transcript entries from DB Transcript model
    const transcript = meeting.transcripts.map((t) => ({
      id: t.id,
      speaker: t.speakerName,
      initials: nameToInitials(t.speakerName),
      color: getSpeakerColor(t.speakerName),
      time: formatMsOffset(t.timestamp),
      text: t.text,
    }));

    // Build action items from DB ActionItem model
    const actionItems = meeting.actionItems.map((item) => ({
      id: item.id,
      text: item.content,
      assignee: item.owner.name,
      assigneeInitials: nameToInitials(item.owner.name),
      assigneeColor: getSpeakerColor(item.owner.name),
      dueDate: item.dueDate
        ? new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'TBD',
      priority: item.priority === 'critical' ? 'high' : item.priority,
      done: item.status === 'completed',
    }));

    return NextResponse.json({
      success: true,
      data: {
        title: notesData.title,
        content: notesData.content,
        transcript,
        actionItems,
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
    console.error('GET meeting-notes error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch meeting notes' } },
      { status: 500 }
    );
  }
}

// ── POST: Save/update meeting notes (title + HTML content) ─────────────────

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const meetingId = validateUuid(body.meetingId, 'meetingId');

    // Validate meeting exists and user has access
    const meeting = await db.meeting.findUnique({
      where: { id: meetingId },
      include: { participants: true },
    });

    if (!meeting) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Meeting not found' } },
        { status: 404 }
      );
    }

    const ROLE_LEVELS: Record<string, number> = {
      superadmin: 100, orgadmin: 80, teamadmin: 60, host: 40, participant: 20, guest: 10,
    };
    const userLevel = ROLE_LEVELS[user.role] ?? 0;
    const isAdmin = userLevel >= 80;
    const isHost = meeting.hostId === user.id;
    const isParticipant = meeting.participants.some((p) => p.userId === user.id);

    if (!isHost && !isParticipant && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to this meeting' } },
        { status: 403 }
      );
    }

    // Extract and validate fields
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 500) : meeting.title;
    const content = typeof body.content === 'string' ? body.content.slice(0, 100000) : '';

    const notesJson = JSON.stringify({ title, content });

    await db.meeting.update({
      where: { id: meetingId },
      data: { notes: notesJson },
    });

    return NextResponse.json({
      success: true,
      data: { title, content },
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
    console.error('POST meeting-notes error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to save meeting notes' } },
      { status: 500 }
    );
  }
}

// ── PUT: Update action items only ──────────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const meetingId = validateUuid(body.meetingId, 'meetingId');
    const { actionItems } = body as { actionItems?: ActionItemPayload[] };

    if (!Array.isArray(actionItems)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'actionItems array is required' } },
        { status: 400 }
      );
    }

    // Validate meeting exists and user has access
    const meeting = await db.meeting.findUnique({
      where: { id: meetingId },
      include: { participants: true },
    });

    if (!meeting) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Meeting not found' } },
        { status: 404 }
      );
    }

    const ROLE_LEVELS: Record<string, number> = {
      superadmin: 100, orgadmin: 80, teamadmin: 60, host: 40, participant: 20, guest: 10,
    };
    const userLevel = ROLE_LEVELS[user.role] ?? 0;
    const isAdmin = userLevel >= 80;
    const isHost = meeting.hostId === user.id;
    const isParticipant = meeting.participants.some((p) => p.userId === user.id);

    if (!isHost && !isParticipant && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to this meeting' } },
        { status: 403 }
      );
    }

    // Sync action items: delete removed, update existing, create new
    const incomingIds = new Set<string>();

    for (const item of actionItems) {
      if (item.id) {
        incomingIds.add(item.id);
        // Map client-side priority/values to DB model
        const dbPriority = item.priority === 'high' ? 'high' : item.priority;
        const dbStatus = item.done ? 'completed' : 'pending';

        // Find matching ActionItem by id
        const existing = await db.actionItem.findUnique({ where: { id: item.id } });
        if (existing && existing.meetingId === meetingId) {
          await db.actionItem.update({
            where: { id: item.id },
            data: {
              content: item.text,
              priority: dbPriority,
              status: dbStatus,
            },
          });
        }
      } else {
        // New action item — find or create owner by name
        // Try to find a user with that name; fall back to current user
        let ownerId = user.id;
        if (item.assignee && item.assignee !== 'You') {
      const match = await db.user.findFirst({
        where: { name: item.assignee },
        select: { id: true },
      });
          if (match) ownerId = match.id;
        }

        await db.actionItem.create({
          data: {
            content: item.text,
            ownerId,
            meetingId,
            priority: item.priority,
            status: item.done ? 'completed' : 'pending',
            dueDate: item.dueDate && item.dueDate !== 'TBD'
              ? new Date(item.dueDate)
              : null,
          },
        });
      }
    }

    // Delete action items that were removed by the client
    const existingItems = await db.actionItem.findMany({
      where: { meetingId },
      select: { id: true },
    });

    for (const existing of existingItems) {
      if (!incomingIds.has(existing.id)) {
        await db.actionItem.delete({ where: { id: existing.id } });
      }
    }

    // Return the updated list
    const updatedItems = await db.actionItem.findMany({
      where: { meetingId },
      include: { owner: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const responseItems = updatedItems.map((item) => ({
      id: item.id,
      text: item.content,
      assignee: item.owner.name,
      assigneeInitials: nameToInitials(item.owner.name),
      assigneeColor: getSpeakerColor(item.owner.name),
      dueDate: item.dueDate
        ? new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'TBD',
      priority: item.priority === 'critical' ? 'high' : item.priority,
      done: item.status === 'completed',
    }));

    return NextResponse.json({
      success: true,
      data: { actionItems: responseItems },
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
    console.error('PUT meeting-notes error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update action items' } },
      { status: 500 }
    );
  }
}
