import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, AuthError } from '@/lib/api-auth';

function deduceSeverity(action: string): string {
  if (/brute|critical|attack/i.test(action)) return 'critical';
  if (/failed|blocked|delete|security/i.test(action)) return 'warning';
  return 'info';
}

export async function GET(request: Request) {
  try {
    await requireRole('superadmin');

    // ── Seed audit data if empty ─────────────────────────────────────────
    const logCount = await db.auditLog.count();
    if (logCount === 0) {
      const firstUser = await db.user.findFirst({ select: { id: true } });
      const now = new Date();
      const seedData = [
        { userId: firstUser?.id ?? null, action: 'user.login', resource: 'auth', details: 'User logged in successfully', ipAddress: '192.168.1.10', createdAt: new Date(now.getTime() - 19 * 3600000) },
        { userId: firstUser?.id ?? null, action: 'user.login', resource: 'auth', details: 'User logged in successfully', ipAddress: '10.0.0.5', createdAt: new Date(now.getTime() - 18 * 3600000) },
        { userId: null, action: 'security.policy', resource: 'system', details: 'Security policy updated: password complexity requirements increased', ipAddress: null, createdAt: new Date(now.getTime() - 17 * 3600000) },
        { userId: firstUser?.id ?? null, action: 'meeting.create', resource: 'meeting', details: 'Created meeting "Sprint Planning Q4"', ipAddress: '192.168.1.10', createdAt: new Date(now.getTime() - 16 * 3600000) },
        { userId: null, action: 'user.login.failed', resource: 'auth', details: 'Login failed for unknown@email.com from 203.0.113.42', ipAddress: '203.0.113.42', createdAt: new Date(now.getTime() - 15 * 3600000) },
        { userId: firstUser?.id ?? null, action: 'user.create', resource: 'user', details: 'New user account created: sarah.johnson@acme.com', ipAddress: '192.168.1.10', createdAt: new Date(now.getTime() - 14 * 3600000) },
        { userId: null, action: 'security.block', resource: 'auth', details: 'IP 203.0.113.42 blocked after 5 failed login attempts', ipAddress: '203.0.113.42', createdAt: new Date(now.getTime() - 14.5 * 3600000) },
        { userId: firstUser?.id ?? null, action: 'meeting.create', resource: 'meeting', details: 'Created meeting "Design Review - Mobile App v3"', ipAddress: '10.0.0.5', createdAt: new Date(now.getTime() - 13 * 3600000) },
        { userId: null, action: 'org.settings', resource: 'organization', details: 'Organization settings updated: MFA enforcement enabled', ipAddress: '192.168.1.10', createdAt: new Date(now.getTime() - 12 * 3600000) },
        { userId: firstUser?.id ?? null, action: 'user.login', resource: 'auth', details: 'User logged in successfully via SSO', ipAddress: '10.0.0.22', createdAt: new Date(now.getTime() - 11 * 3600000) },
        { userId: null, action: 'security.block', resource: 'auth', details: 'IP 198.51.100.7 blocked: brute force attack detected', ipAddress: '198.51.100.7', createdAt: new Date(now.getTime() - 10 * 3600000) },
        { userId: firstUser?.id ?? null, action: 'meeting.end', resource: 'meeting', details: 'Meeting "Sprint Planning Q4" ended. Duration: 47 min, Participants: 8', ipAddress: '192.168.1.10', createdAt: new Date(now.getTime() - 9 * 3600000) },
        { userId: firstUser?.id ?? null, action: 'user.create', resource: 'user', details: 'New user account created: mike.chen@acme.com', ipAddress: '192.168.1.10', createdAt: new Date(now.getTime() - 8 * 3600000) },
        { userId: null, action: 'security.policy', resource: 'system', details: 'Session timeout policy updated to 30 minutes', ipAddress: null, createdAt: new Date(now.getTime() - 7 * 3600000) },
        { userId: firstUser?.id ?? null, action: 'meeting.create', resource: 'meeting', details: 'Created meeting "Engineering All-Hands"', ipAddress: '10.0.0.5', createdAt: new Date(now.getTime() - 6 * 3600000) },
        { userId: firstUser?.id ?? null, action: 'user.login.failed', resource: 'auth', details: 'Login failed for admin@test.com from 10.10.10.10', ipAddress: '10.10.10.10', createdAt: new Date(now.getTime() - 5 * 3600000) },
        { userId: firstUser?.id ?? null, action: 'meeting.end', resource: 'meeting', details: 'Meeting "Design Review - Mobile App v3" ended. Duration: 62 min, Participants: 5', ipAddress: '10.0.0.5', createdAt: new Date(now.getTime() - 4 * 3600000) },
        { userId: null, action: 'org.settings', resource: 'organization', details: 'Organization plan upgraded from free to pro', ipAddress: '192.168.1.10', createdAt: new Date(now.getTime() - 3 * 3600000) },
        { userId: firstUser?.id ?? null, action: 'user.login', resource: 'auth', details: 'User logged in from new device: Chrome on macOS', ipAddress: '172.16.0.1', createdAt: new Date(now.getTime() - 2 * 3600000) },
        { userId: null, action: 'security.policy', resource: 'system', details: 'API rate limiting policy updated: 100 req/min for admin endpoints', ipAddress: null, createdAt: new Date(now.getTime() - 3600000) },
      ];
      await db.auditLog.createMany({ data: seedData });
    }

    // ── Build query ──────────────────────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const action = searchParams.get('action') || '';
    const severity = searchParams.get('severity') || '';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { action: { contains: search } },
        { details: { contains: search } },
        { resource: { contains: search } },
      ];
    }
    if (action) {
      where.action = { contains: action };
    }
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }

    const entries = await db.auditLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Apply severity filter client-side since it's derived
    let filteredEntries = entries;
    if (severity) {
      filteredEntries = entries.filter((e) => deduceSeverity(e.action) === severity);
    }

    // Map severity to each entry
    const entriesWithSeverity = filteredEntries.map((entry) => ({
      ...entry,
      severity: deduceSeverity(entry.action),
    }));

    const total = await db.auditLog.count({ where });

    // Count warnings and criticals
    const allEntries = await db.auditLog.findMany({
      select: { action: true },
    });
    let warningCount = 0;
    let criticalCount = 0;
    for (const entry of allEntries) {
      const s = deduceSeverity(entry.action);
      if (s === 'warning') warningCount++;
      if (s === 'critical') criticalCount++;
    }

    return NextResponse.json({
      success: true,
      data: {
        entries: entriesWithSeverity,
        total,
        warningCount,
        criticalCount,
      },
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
