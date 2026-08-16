import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, createAccessToken } from '@/lib/jwt-edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken || typeof refreshToken !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Refresh token is required' } },
        { status: 401 }
      );
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: { code: 'TOKEN_EXPIRED', message: 'Refresh token is invalid or expired' } },
        { status: 401 }
      );
    }

    const newAccessToken = await createAccessToken(payload);

    return NextResponse.json({
      success: true,
      data: { accessToken: newAccessToken },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An internal error occurred' } },
      { status: 500 }
    );
  }
}
