import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError, getOrgFilter } from '@/lib/api-auth';

/**
 * GET /api/v1/files
 * List files with uploader info, scoped by organization.
 */
export async function GET() {
  try {
    const user = await requireAuth();

    const orgFilter = getOrgFilter(user);

    // Files don't have organizationId directly — they belong to channels → teams → org.
    // If org filtering is needed, we filter through the channel→team relationship.
    const where: Record<string, unknown> = {};
    if ('organizationId' in orgFilter) {
      where.channel = {
        team: { organizationId: orgFilter.organizationId },
      };
    }

    const files = await db.file.findMany({
      where,
      include: {
        uploader: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: { files },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('List files error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch files' } },
      { status: 500 }
    );
  }
}
