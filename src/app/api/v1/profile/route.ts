import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser, AuthError } from '@/lib/api-auth';

type ProfileResponse = {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: { id: string; name: string } | null;
  avatar: string | null;
  createdAt: string;
  lastLogin: string | null;
  isActive: boolean;
};

function formatProfile(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  createdAt: Date;
  lastLogin: Date | null;
  isActive: boolean;
  organizationId: string | null;
  organization?: { id: string; name: string } | null;
}): ProfileResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organization: user.organization
      ? { id: user.organization.id, name: user.organization.name }
      : null,
    avatar: user.avatar,
    createdAt: user.createdAt.toISOString(),
    lastLogin: user.lastLogin?.toISOString() ?? null,
    isActive: user.isActive,
  };
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      throw new AuthError('UNAUTHORIZED', 'Authentication required', 401);
    }

    return NextResponse.json({
      success: true,
      data: { profile: formatProfile(user) },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Get profile error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch profile' } },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      throw new AuthError('UNAUTHORIZED', 'Authentication required', 401);
    }

    const body = await request.json();
    const { name, avatar } = body;

    // Build update data with validation
    const updateData: { name?: string; avatar?: string } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Name must be a non-empty string' } },
          { status: 400 }
        );
      }
      if (name.trim().length > 100) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Name must be 100 characters or less' } },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (avatar !== undefined) {
      if (typeof avatar !== 'string') {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Avatar must be a string (color or URL)' } },
          { status: 400 }
        );
      }
      if (avatar.length > 500) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Avatar value is too long' } },
          { status: 400 }
        );
      }
      updateData.avatar = avatar.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'No fields to update' } },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: updateData,
      include: { organization: true },
    });

    return NextResponse.json({
      success: true,
      data: { profile: formatProfile(updatedUser) },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update profile' } },
      { status: 500 }
    );
  }
}
