import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/api-auth';
import { inputSanitize, validateUuid, SecurityError } from '@/lib/security';
import { hasMinimumRole } from '@/lib/roles';

/**
 * Hash an API key using SHA-256 (fast, non-reversible, suitable for API keys).
 */
function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Generate a random API key with prefix "alv_" + 32 hex chars.
 */
function generateApiKey(): string {
  const bytes = randomBytes(16); // 16 bytes = 32 hex chars
  return `alv_${bytes.toString('hex')}`;
}

/**
 * Mask an API key for display: show prefix + last 4 chars.
 */
function maskKey(key: string): string {
  const prefix = key.slice(0, 4); // "alv_"
  const lastFour = key.slice(-4);
  return `${prefix}${'•'.repeat(28)}${lastFour}`;
}

/**
 * GET /api/v1/api-keys
 * List all API keys for the authenticated user (masked).
 */
export async function GET() {
  try {
    const user = await requireAuth();

    const apiKeys = await db.apiKey.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        permissions: true,
        isActive: true,
        lastUsed: true,
        createdAt: true,
        expiresAt: true,
        key: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const masked = apiKeys.map((k) => ({
      id: k.id,
      name: k.name,
      prefix: 'alv_',
      permissions: JSON.parse(k.permissions),
      isActive: k.isActive && (!k.expiresAt || k.expiresAt > new Date()),
      lastUsedAt: k.lastUsed,
      createdAt: k.createdAt,
      maskedKey: maskKey(k.key),
    }));

    return NextResponse.json({
      success: true,
      data: { apiKeys: masked },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error('List API keys error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch API keys' } },
      { status: 500 },
    );
  }
}

/**
 * POST /api/v1/api-keys
 * Create a new API key. Returns the FULL key only once.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const name = inputSanitize(body.name, 100, 'name');
    const permissions = Array.isArray(body.permissions) ? body.permissions : [];

    // Limit to 20 keys per user
    const keyCount = await db.apiKey.count({ where: { userId: user.id } });
    if (keyCount >= 20) {
      return NextResponse.json(
        { success: false, error: { code: 'LIMIT_EXCEEDED', message: 'Maximum of 20 API keys reached' } },
        { status: 400 },
      );
    }

    const rawKey = generateApiKey();
    const hashedKey = hashApiKey(rawKey);

    const apiKey = await db.apiKey.create({
      data: {
        name,
        key: hashedKey,
        userId: user.id,
        permissions: JSON.stringify(permissions),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          prefix: 'alv_',
          permissions: JSON.parse(apiKey.permissions),
          isActive: true,
          createdAt: apiKey.createdAt,
          // Full key — only returned on creation
          key: rawKey,
        },
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    if (error instanceof SecurityError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error('Create API key error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create API key' } },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/v1/api-keys?id=xxx
 * Delete an API key by ID. Only the owner or orgadmin+ can delete.
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const keyId = validateUuid(searchParams.get('id'), 'id');

    const existing = await db.apiKey.findUnique({ where: { id: keyId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'API key not found' } },
        { status: 404 },
      );
    }

    // Only owner or orgadmin+ can delete
    if (existing.userId !== user.id && !hasMinimumRole(user.role, 'orgadmin')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions to delete this API key' } },
        { status: 403 },
      );
    }

    await db.apiKey.delete({ where: { id: keyId } });

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    if (error instanceof SecurityError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    console.error('Delete API key error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete API key' } },
      { status: 500 },
    );
  }
}
