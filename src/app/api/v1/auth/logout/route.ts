import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken } from '@/lib/jwt-edge';
import { blacklistToken } from '@/lib/token-blacklist';

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request);

    if (token) {
      blacklistToken(token);
    }

    // Always return 200 — user may already be logged out (no token)
    return NextResponse.json({
      success: true,
      message: 'Logged out',
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Still return 200 — the client should clear local tokens regardless
    return NextResponse.json({
      success: true,
      message: 'Logged out',
    });
  }
}
