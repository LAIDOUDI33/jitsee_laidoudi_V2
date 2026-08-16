import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const start = Date.now();
  let dbStatus = 'ok';
  
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'error';
  }
  
  return NextResponse.json({
    status: dbStatus === 'ok' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.2.1',
    uptime: process.uptime(),
    responseTime: `${Date.now() - start}ms`,
    checks: {
      database: dbStatus,
      api: 'ok',
    },
  });
}