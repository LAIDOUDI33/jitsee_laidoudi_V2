// --- Action Items CRUD API -------------------------------------------------------------
// GET: List action items for the authenticated user (owned or from their org).
// POST: Create a manual action item.
// PUT: Update action item status and priority.
// DELETE: Delete an action item (owner or orgadmin+ only).
// Task ID: phase6-ai-enhance

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireResourceOwner, AuthError } from '@/lib/api-auth';
import { validateUuid, inputSanitize, inputSanitizeOptional, SecurityError } from '@/lib/security';
import { Prisma } from '@prisma/client';

const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const VALID_STATUSES = ['pending', 'in_progress', 'completed'];

// ── POST: Create action item ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { content, priority, dueDate } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Content is required' } },
        { status: 400 }
      );
    }

    const safeContent = inputSanitize(content, 500, 'text').trim();
    const safePriority = priority && VALID_PRIORITIES.includes(priority) ? priority : 'medium';
    const safeDueDate = dueDate ? new Date(dueDate) : null;

    // Validate due date if provided
    if (safeDueDate && isNaN(safeDueDate.getTime())) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid due date' } },
        { status: 400 }
      );
    }

    const created = await db.actionItem.create({
      data: {
        content: safeContent,
        ownerId: user.id,
        priority: safePriority,
        status: 'pending',
        dueDate: safeDueDate,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        meeting: { select: { id: true, title: true, meetingId: true } },
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
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
    const msg = error instanceof Error ? error.message : 'Failed to create action item';
    console.error('Action items POST error:', msg);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: msg } },
      { status: 500 }
    );
  }
}

// ── GET: List action items ─────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

    // Build where clause
    const where: Prisma.ActionItemWhereInput = {
      OR: [
        { ownerId: user.id },
        ...(user.organizationId
          ? [{ meeting: { organizationId: user.organizationId } }]
          : []),
      ],
    };

    if (status && VALID_STATUSES.includes(status)) {
      where.status = status;
    }

    if (priority && VALID_PRIORITIES.includes(priority)) {
      where.priority = priority;
    }

    if (search && search.trim().length > 0) {
      where.content = { contains: inputSanitize(search, 200, 'text').trim() };
    }

    // Count and fetch
    const [total, items] = await Promise.all([
      db.actionItem.count({ where }),
      db.actionItem.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          meeting: { select: { id: true, title: true, meetingId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
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
    const msg = error instanceof Error ? error.message : 'Failed to fetch action items';
    console.error('Action items GET error:', msg);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: msg } },
      { status: 500 }
    );
  }
}

// ── PUT: Update action item ─────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { id, status, priority, content, dueDate } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Action item id is required' } },
        { status: 400 }
      );
    }

    const safeId = validateUuid(id, 'id');

    // Check ownership
    const existing = await db.actionItem.findUnique({ where: { id: safeId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Action item not found' } },
        { status: 404 }
      );
    }

    await requireResourceOwner(existing.ownerId);

    // Build update data
    const updateData: Prisma.ActionItemUpdateInput = {};

    if (status && VALID_STATUSES.includes(status)) {
      updateData.status = status;
    }

    if (priority && VALID_PRIORITIES.includes(priority)) {
      updateData.priority = priority;
    }

    if (content && typeof content === 'string' && content.trim().length > 0) {
      updateData.content = inputSanitize(content, 500, 'text').trim();
    }

    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    const updated = await db.actionItem.update({
      where: { id: safeId },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        meeting: { select: { id: true, title: true, meetingId: true } },
      },
    });

    return NextResponse.json({ success: true, data: updated });
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
    const msg = error instanceof Error ? error.message : 'Failed to update action item';
    console.error('Action items PUT error:', msg);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: msg } },
      { status: 500 }
    );
  }
}

// ── DELETE: Delete action item ───────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Action item id is required' } },
        { status: 400 }
      );
    }

    const safeId = validateUuid(id, 'id');

    // Check ownership
    const existing = await db.actionItem.findUnique({ where: { id: safeId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Action item not found' } },
        { status: 404 }
      );
    }

    await requireResourceOwner(existing.ownerId);

    await db.actionItem.delete({ where: { id: safeId } });

    return NextResponse.json({ success: true, data: { deleted: true } });
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
    const msg = error instanceof Error ? error.message : 'Failed to delete action item';
    console.error('Action items DELETE error:', msg);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: msg } },
      { status: 500 }
    );
  }
}
