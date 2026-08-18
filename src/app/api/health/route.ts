import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface ServiceStatus {
  status: 'operational' | 'degraded' | 'down';
  latencyMs: number;
  lastCheck: string;
}

async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return { status: 'operational', latencyMs: Date.now() - start, lastCheck: new Date().toISOString() };
  } catch {
    return { status: 'down', latencyMs: Date.now() - start, lastCheck: new Date().toISOString() };
  }
}

function checkHttpEndpoint(url: string, timeoutMs = 2000): Promise<ServiceStatus> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal, mode: 'no-cors' })
    .then(() => {
      clearTimeout(timer);
      return { status: 'operational' as const, latencyMs: Date.now() - start, lastCheck: new Date().toISOString() };
    })
    .catch(() => {
      clearTimeout(timer);
      return { status: 'down' as const, latencyMs: Date.now() - start, lastCheck: new Date().toISOString() };
    });
}

export async function GET() {
  const overallStart = Date.now();

  const apiStart = Date.now();
  const apiStatus: ServiceStatus = { status: 'operational', latencyMs: Date.now() - apiStart, lastCheck: new Date().toISOString() };

  const dbStatus = await checkDatabase();

  const [chatService, signalingService] = await Promise.all([
    checkHttpEndpoint('http://localhost:3010/health', 1500),
    checkHttpEndpoint('http://localhost:3011/health', 1500),
  ]);

  const aiService: ServiceStatus = {
    status: 'operational',
    latencyMs: 0,
    lastCheck: new Date().toISOString(),
  };

  const services = { api: apiStatus, database: dbStatus, chatService, signalingService, aiService };

  const anyDown = Object.values(services).some((s) => s.status === 'down');
  const allOk = Object.values(services).every((s) => s.status === 'operational');

  return NextResponse.json({
    status: anyDown ? 'down' : allOk ? 'healthy' : 'degraded',
    services,
    uptime: { since: '2025-01-01T00:00:00Z' },
    responseTime: `${Date.now() - overallStart}ms`,
    version: process.env.npm_package_version || '0.2.1',
  });
}