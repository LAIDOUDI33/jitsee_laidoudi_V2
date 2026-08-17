import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, AuthError } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    await requireRole('superadmin');

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const plan = searchParams.get('plan') || '';

    const where: Record<string, unknown> = {};
    if (search) {
      where.name = { contains: search };
    }
    if (plan) {
      where.plan = plan;
    }

    const organizations = await db.organization.findMany({
      where,
      include: {
        _count: { select: { users: true, meetings: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const total = await db.organization.count({ where });

    const planCounts = await db.organization.groupBy({
      by: ['plan'],
      _count: { id: true },
    });

    return NextResponse.json({
      success: true,
      data: { organizations, total, planCounts },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Admin API error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Operation failed' } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireRole('superadmin');

    const body = await request.json();
    const { name, domain, plan } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Organization name is required' } },
        { status: 400 }
      );
    }

    const existing = await db.organization.findUnique({ where: { name: name.trim() } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'Organization with this name already exists' } },
        { status: 409 }
      );
    }

    const org = await db.organization.create({
      data: {
        name: name.trim(),
        domain: domain || null,
        plan: plan || 'free',
      },
    });

    return NextResponse.json({
      success: true,
      data: { organization: org },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Admin API error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Operation failed' } },
      { status: 500 }
    );
  }
}
