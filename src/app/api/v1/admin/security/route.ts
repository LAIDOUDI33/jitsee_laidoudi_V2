import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, AuthError } from '@/lib/api-auth';

export async function GET() {
  try {
    await requireRole('superadmin');

    const [loginAttempts, securityEvents, blockedIps] = await Promise.all([
      // Last 20 entries where action contains 'login'
      db.auditLog.findMany({
        where: { action: { contains: 'login' } },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      // Last 10 entries where action contains 'security'
      db.auditLog.findMany({
        where: { action: { contains: 'security' } },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      // Count of entries where action contains 'block'
      db.auditLog.count({
        where: { action: { contains: 'block' } },
      }),
    ]);

    // Map severity/status for login attempts
    const loginAttemptsWithStatus = loginAttempts.map((entry) => {
      let status: string = 'success';
      if (/failed/i.test(entry.action)) status = 'failed';
      if (/blocked/i.test(entry.action)) status = 'blocked';
      return {
        ...entry,
        status,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        loginAttempts: loginAttemptsWithStatus,
        securityEvents,
        blockedIps,
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
