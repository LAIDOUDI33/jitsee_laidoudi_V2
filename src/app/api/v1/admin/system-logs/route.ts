import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, AuthError } from '@/lib/api-auth';

interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  source: string;
}

/**
 * Maps an audit log action to a system log severity level.
 * - failed / blocked / delete / security / brute / attack / critical → 'error'
 * - warning-related actions → 'warn'
 * - everything else → 'info'
 */
function toLogLevel(action: string): 'info' | 'warn' | 'error' {
  const lower = action.toLowerCase();
  if (
    /failed|blocked|delete|brute|attack|critical/i.test(lower)
  ) {
    return 'error';
  }
  if (
    /warn|security|policy|block/i.test(lower)
  ) {
    return 'warn';
  }
  return 'info';
}

/**
 * Formats a readable message from audit log fields.
 */
function formatMessage(action: string, resource: string, details: string | null): string {
  const detail = details || 'No details provided';
  return `[${resource}] ${action}: ${detail}`;
}

/**
 * Derives a human-readable source string from user email and/or IP address.
 */
function formatSource(
  userName: string | null,
  userEmail: string | null,
  ipAddress: string | null,
): string {
  const parts: string[] = [];
  if (userName) parts.push(userName);
  else if (userEmail) parts.push(userEmail);
  if (ipAddress) parts.push(ipAddress);
  return parts.length > 0 ? parts.join(' @ ') : 'system';
}

export async function GET() {
  try {
    await requireRole('superadmin');

    const entries = await db.auditLog.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const logs: SystemLogEntry[] = entries.map((entry) => ({
      id: entry.id,
      timestamp: entry.createdAt.toISOString(),
      level: toLogLevel(entry.action),
      message: formatMessage(entry.action, entry.resource, entry.details),
      source: formatSource(entry.user?.name ?? null, entry.user?.email ?? null, entry.ipAddress),
    }));

    return NextResponse.json({
      success: true,
      data: { logs },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error('System logs API error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch system logs' } },
      { status: 500 },
    );
  }
}
