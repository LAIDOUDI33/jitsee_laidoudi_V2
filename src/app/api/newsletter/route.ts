import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: 'A valid email address is required' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Store newsletter subscription in AuditLog as a temporary solution
    // TODO: Add NewsletterSubscriber model to Prisma schema
    await db.auditLog.create({
      data: {
        action: 'NEWSLETTER_SUBSCRIBE',
        resource: 'Newsletter',
        details: JSON.stringify({ email: trimmedEmail }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Subscribed successfully',
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
