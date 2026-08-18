import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/server/auth';
import { randomBytes, createHash, timingSafeEqual } from 'crypto';

const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'email is required' } },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      // Return success regardless to prevent email enumeration
      return NextResponse.json({
        success: true,
        data: { message: 'If an account with that email exists, a password reset link has been sent.' },
      });
    }

    const token = generateResetToken();
    const tokenHash = hashToken(token);
    const expiry = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

    await db.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: tokenHash,
        resetTokenExpiry: expiry,
      },
    });

    // In a real system, send an email with the reset token here.
    // For now, return a mock success message.
    return NextResponse.json({
      success: true,
      data: {
        message: 'If an account with that email exists, a password reset link has been sent.',
        // Expose the token only in non-production environments for testing
        ...(process.env.NODE_ENV !== 'production' ? { debugToken: token } : {}),
      },
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process reset request' } },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'token is required' } },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'newPassword is required' } },
        { status: 400 }
      );
    }

    // Validate password strength
    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: strength.errors.join('; ') } },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);

    // Find user by reset token hash
    const user = await db.user.findFirst({
      where: { resetTokenHash: tokenHash },
    });

    if (!user || !user.resetTokenExpiry) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired reset token' } },
        { status: 400 }
      );
    }

    // Check token expiry
    if (user.resetTokenExpiry < new Date()) {
      // Clear expired token
      await db.user.update({
        where: { id: user.id },
        data: { resetTokenHash: null, resetTokenExpiry: null },
      });
      return NextResponse.json(
        { success: false, error: { code: 'TOKEN_EXPIRED', message: 'Reset token has expired. Please request a new one.' } },
        { status: 400 }
      );
    }

    // Verify the raw token matches the stored hash using timing-safe comparison
    const storedHash = user.resetTokenHash;
    const computedHash = createHash('sha256').update(token).digest('hex');
    const hashBuffer = Buffer.from(storedHash, 'hex');
    const computedBuffer = Buffer.from(computedHash, 'hex');

    if (hashBuffer.length !== computedBuffer.length || !timingSafeEqual(hashBuffer, computedBuffer)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid reset token' } },
        { status: 400 }
      );
    }

    // Update password and clear reset fields
    const newHash = hashPassword(newPassword);
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        resetTokenHash: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Password has been reset successfully.' },
    });
  } catch (error) {
    console.error('Password reset confirm error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to reset password' } },
      { status: 500 }
    );
  }
}
