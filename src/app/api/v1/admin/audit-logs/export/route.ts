/**
 * Audit Log Export API
 * GET — Export audit logs as CSV with optional filters
 *
 * Query params: startDate, endDate, action, resource, userId
 * Superadmin sees all logs; others see only their org's logs.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/api-auth';
import { validateDate } from '@/lib/security';
import { Prisma } from '@prisma/client';

const CSV_HEADER = 'Timestamp,User,Email,Action,Resource,Resource ID,Details,IP Address,User Agent';

/** Escape a field for CSV output */
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const startDate = validateDate(searchParams.get('startDate'));
    const endDate = validateDate(searchParams.get('endDate'));
    const actionFilter = searchParams.get('action') || undefined;
    const resourceFilter = searchParams.get('resource') || undefined;
    const userIdFilter = searchParams.get('userId') || undefined;

    // Build where clause
    const where: Prisma.AuditLogWhereInput = {};

    // Org-scoping: superadmin sees all, others see their org's logs via user relation
    if (user.role !== 'superadmin' && user.organizationId) {
      where.user = { organizationId: user.organizationId };
    }

    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;
    if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter;
    if (actionFilter) {
      where.action = { contains: actionFilter };
    }
    if (resourceFilter) {
      where.resource = { contains: resourceFilter };
    }
    if (userIdFilter) {
      where.userId = userIdFilter;
    }

    // Cap at 50,000 rows for safety
    const logs = await db.auditLog.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50_000,
    });

    if (logs.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_DATA', message: 'No audit logs found matching the criteria' } },
        { status: 404 }
      );
    }

    // Build CSV rows
    const rows = logs.map((log) => {
      return [
        csvEscape(log.createdAt.toISOString()),
        csvEscape(log.user?.name || 'Unknown'),
        csvEscape(log.user?.email || 'N/A'),
        csvEscape(log.action),
        csvEscape(log.resource),
        csvEscape(log.resourceId || ''),
        csvEscape(log.details || ''),
        csvEscape(log.ipAddress || ''),
        csvEscape(log.userAgent || ''),
      ].join(',');
    });

    const csv = [CSV_HEADER, ...rows].join('\n');

    const filename = `audit-logs-export-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Export audit logs error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to export audit logs' } },
      { status: 500 }
    );
  }
}
