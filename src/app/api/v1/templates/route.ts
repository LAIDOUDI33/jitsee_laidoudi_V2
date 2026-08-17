import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/api-auth';

// ── Builtin templates to seed ──────────────────────────────────────────

const BUILTIN_TEMPLATES = [
  {
    name: 'Weekly Team Sync',
    description: 'Regular weekly alignment for team updates and blockers.',
    duration: '30m',
    maxParticipants: 15,
    settings: JSON.stringify(['Recording ON', 'AI Assistant']),
    gradient: 'from-sky-500 to-blue-500',
    iconBg: 'from-sky-500 to-blue-600',
  },
  {
    name: 'Design Review',
    description: 'Collaborate on designs, mockups, and visual assets.',
    duration: '45m',
    maxParticipants: 8,
    settings: JSON.stringify(['Recording ON', 'AI Assistant', 'Screen Share']),
    gradient: 'from-violet-500 to-purple-500',
    iconBg: 'from-violet-500 to-purple-600',
  },
  {
    name: 'Client Demo',
    description: 'Present product demos to clients and prospects.',
    duration: '30m',
    maxParticipants: 10,
    settings: JSON.stringify(['Recording ON', 'Waiting Room', 'AI Assistant']),
    gradient: 'from-emerald-500 to-teal-500',
    iconBg: 'from-emerald-500 to-teal-600',
  },
  {
    name: 'Brainstorm Session',
    description: 'Creative ideation with real-time whiteboarding.',
    duration: '45m',
    maxParticipants: 12,
    settings: JSON.stringify(['AI Assistant', 'Recording ON']),
    gradient: 'from-amber-500 to-orange-500',
    iconBg: 'from-amber-500 to-orange-600',
  },
  {
    name: 'Retrospective',
    description: 'Reflect on sprint outcomes and process improvements.',
    duration: '60m',
    maxParticipants: 10,
    settings: JSON.stringify(['Recording ON', 'Transcription', 'AI Assistant']),
    gradient: 'from-rose-500 to-pink-500',
    iconBg: 'from-rose-500 to-pink-600',
  },
  {
    name: 'Training Workshop',
    description: 'Structured learning sessions with material sharing.',
    duration: '90m',
    maxParticipants: 25,
    settings: JSON.stringify(['Recording ON', 'Waiting Room', 'Mute on Entry']),
    gradient: 'from-indigo-500 to-blue-500',
    iconBg: 'from-indigo-500 to-blue-600',
  },
  {
    name: 'Board Meeting',
    description: 'Formal governance meetings with strict access control.',
    duration: '60m',
    maxParticipants: 15,
    settings: JSON.stringify(['Recording ON', 'Waiting Room', 'Mute on Entry', 'Transcription']),
    gradient: 'from-zinc-600 to-zinc-800',
    iconBg: 'from-zinc-600 to-zinc-800',
  },
  {
    name: 'Office Hours',
    description: 'Open drop-in sessions for questions and support.',
    duration: '60m',
    maxParticipants: 20,
    settings: JSON.stringify(['AI Assistant']),
    gradient: 'from-teal-500 to-cyan-500',
    iconBg: 'from-teal-500 to-cyan-600',
  },
];

// ── Helpers ────────────────────────────────────────────────────────────

function parseSettings(settingsStr: string): string[] {
  try {
    const parsed = JSON.parse(settingsStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatTemplate(t: {
  id: string;
  name: string;
  description: string;
  duration: string;
  maxParticipants: number;
  settings: string;
  agenda: string;
  gradient: string;
  iconBg: string;
  isBuiltin: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    duration: t.duration,
    maxParticipants: String(t.maxParticipants),
    settings: parseSettings(t.settings),
    agenda: t.agenda,
    gradient: t.gradient,
    iconBg: t.iconBg,
    isBuiltin: t.isBuiltin,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

// ── Ensure builtins exist ──────────────────────────────────────────────

async function ensureBuiltins() {
  const existingBuiltinCount = await db.template.count({ where: { isBuiltin: true } });
  if (existingBuiltinCount > 0) return;

  // Find a system user to assign builtins to
  const firstUser = await db.user.findFirst({ select: { id: true, organizationId: true } });
  if (!firstUser) return;

  await db.template.createMany({
    data: BUILTIN_TEMPLATES.map(t => ({
      ...t,
      createdById: firstUser.id,
      organizationId: firstUser.organizationId,
      isBuiltin: true,
    })),
  });
}

// ── GET: List all templates ────────────────────────────────────────────

export async function GET() {
  try {
    const user = await requireAuth();

    // Ensure builtins are seeded
    await ensureBuiltins();

    const templates = await db.template.findMany({
      where: {
        OR: [
          { isBuiltin: true },
          { createdById: user.id },
          { organizationId: user.organizationId ?? undefined },
        ],
      },
      orderBy: [{ isBuiltin: 'desc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      data: { templates: templates.map(formatTemplate) },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('List templates error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch templates' } },
      { status: 500 }
    );
  }
}

// ── POST: Create a new template ───────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { name, description, duration, maxParticipants, settings, agenda, gradient, iconBg } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Template name is required' } },
        { status: 400 }
      );
    }
    if (name.trim().length > 200) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Name must be 200 characters or less' } },
        { status: 400 }
      );
    }

    const parsedSettings = Array.isArray(settings) ? settings : [];
    const parsedDuration = typeof duration === 'string' && duration.trim() ? duration.trim() : '30m';
    const parsedMaxParticipants = typeof maxParticipants === 'number' ? Math.min(Math.max(maxParticipants, 2), 100) : 10;
    const parsedDescription = typeof description === 'string' ? description.trim().slice(0, 500) : '';
    const parsedAgenda = typeof agenda === 'string' ? agenda.trim().slice(0, 2000) : '';
    const parsedGradient = typeof gradient === 'string' ? gradient.trim().slice(0, 100) : 'from-sky-500 to-blue-500';
    const parsedIconBg = typeof iconBg === 'string' ? iconBg.trim().slice(0, 100) : 'from-sky-500 to-blue-600';

    const template = await db.template.create({
      data: {
        name: name.trim(),
        description: parsedDescription,
        duration: parsedDuration,
        maxParticipants: parsedMaxParticipants,
        settings: JSON.stringify(parsedSettings),
        agenda: parsedAgenda,
        gradient: parsedGradient,
        iconBg: parsedIconBg,
        isBuiltin: false,
        createdById: user.id,
        organizationId: user.organizationId,
      },
    });

    return NextResponse.json({
      success: true,
      data: { template: formatTemplate(template) },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Create template error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create template' } },
      { status: 500 }
    );
  }
}

// ── DELETE: Delete a template ──────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Template ID is required' } },
        { status: 400 }
      );
    }

    const template = await db.template.findUnique({ where: { id } });

    if (!template) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } },
        { status: 404 }
      );
    }

    if (template.isBuiltin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Cannot delete built-in templates' } },
        { status: 403 }
      );
    }

    // Only creator, org admin, or superadmin can delete
    const isCreator = template.createdById === user.id;
    const isAdmin = ['superadmin', 'orgadmin'].includes(user.role);
    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to delete this template' } },
        { status: 403 }
      );
    }

    await db.template.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Delete template error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete template' } },
      { status: 500 }
    );
  }
}
