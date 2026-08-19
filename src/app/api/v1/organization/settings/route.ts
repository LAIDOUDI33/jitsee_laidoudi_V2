/**
 * Organization Settings API
 * GET  — Retrieve current user's organization settings
 * PUT  — Update organization settings (orgadmin+ only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireOrgAdmin, AuthError } from '@/lib/api-auth';
import { inputSanitizeOptional, validateInt, SecurityError } from '@/lib/security';
import { headers } from 'next/headers';

const VALID_PLANS = ['free', 'pro', 'enterprise'] as const;

/** Safely parse the organization.settings JSON string */
function parseOrgSettings(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

export async function GET() {
  try {
    const user = await requireAuth();

    if (!user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_ORG', message: 'User does not belong to an organization' } },
        { status: 400 }
      );
    }

    const org = await db.organization.findUnique({
      where: { id: user.organizationId },
    });

    if (!org) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Organization not found' } },
        { status: 404 }
      );
    }

    const settings = parseOrgSettings(org.settings);

    return NextResponse.json({
      success: true,
      data: {
        id: org.id,
        name: org.name,
        domain: org.domain,
        plan: org.plan,
        maxUsers: org.maxUsers,
        maxMeetingRooms: org.maxMeetingRooms,
        settings,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Get org settings error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve organization settings' } },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireOrgAdmin();

    if (!user.organizationId) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_ORG', message: 'User does not belong to an organization' } },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Build update data with validation
    const updateData: Record<string, unknown> = {};
    const changes: string[] = [];

    // Name — sanitize, max 200 chars
    const name = inputSanitizeOptional(body.name, 200);
    if (name !== null) {
      updateData.name = name;
      changes.push(`name -> "${name}"`);
    }

    // Domain — sanitize, max 200 chars
    const domain = inputSanitizeOptional(body.domain, 200);
    if (domain !== null) {
      updateData.domain = domain;
      changes.push(`domain -> "${domain}"`);
    }

    // Plan — validate against allowed values
    if (body.plan !== undefined && body.plan !== null) {
      const plan = String(body.plan).toLowerCase();
      if (!VALID_PLANS.includes(plan as typeof VALID_PLANS[number])) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_PLAN', message: `Plan must be one of: ${VALID_PLANS.join(', ')}` } },
          { status: 400 }
        );
      }
      updateData.plan = plan;
      changes.push(`plan -> ${plan}`);
    }

    // maxUsers — validate int range
    if (body.maxUsers !== undefined && body.maxUsers !== null) {
      const maxUsers = validateInt(body.maxUsers, 1, 100000, 50);
      updateData.maxUsers = maxUsers;
      changes.push(`maxUsers -> ${maxUsers}`);
    }

    // maxMeetingRooms — validate int range
    if (body.maxMeetingRooms !== undefined && body.maxMeetingRooms !== null) {
      const maxMeetingRooms = validateInt(body.maxMeetingRooms, 1, 10000, 20);
      updateData.maxMeetingRooms = maxMeetingRooms;
      changes.push(`maxMeetingRooms -> ${maxMeetingRooms}`);
    }

    // Settings JSON — validate it parses as an object
    if (body.settings !== undefined && body.settings !== null) {
      let settingsObj: Record<string, unknown>;
      if (typeof body.settings === 'string') {
        try {
          settingsObj = JSON.parse(body.settings);
        } catch {
          return NextResponse.json(
            { success: false, error: { code: 'INVALID_SETTINGS', message: 'Settings must be a valid JSON object' } },
            { status: 400 }
          );
        }
      } else if (typeof body.settings === 'object' && !Array.isArray(body.settings)) {
        settingsObj = body.settings as Record<string, unknown>;
      } else {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_SETTINGS', message: 'Settings must be a valid JSON object' } },
          { status: 400 }
        );
      }

      // Merge with existing settings
      const existingOrg = await db.organization.findUnique({
        where: { id: user.organizationId },
      });
      const existingSettings = existingOrg ? parseOrgSettings(existingOrg.settings) : {};
      const mergedSettings = { ...existingSettings, ...settingsObj };
      updateData.settings = JSON.stringify(mergedSettings);
      changes.push('settings updated');
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_CHANGES', message: 'No valid fields to update' } },
        { status: 400 }
      );
    }

    const org = await db.organization.update({
      where: { id: user.organizationId },
      data: updateData,
    });

    // Audit log
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null;
    const ua = headersList.get('user-agent') || null;
    await db.auditLog.create({
      data: {
        action: 'ORG_SETTINGS_UPDATED',
        resource: 'Organization',
        resourceId: user.organizationId,
        userId: user.id,
        details: JSON.stringify({ changes }),
        ipAddress: ip,
        userAgent: ua,
      },
    });

    const settings = parseOrgSettings(org.settings);

    return NextResponse.json({
      success: true,
      data: {
        id: org.id,
        name: org.name,
        domain: org.domain,
        plan: org.plan,
        maxUsers: org.maxUsers,
        maxMeetingRooms: org.maxMeetingRooms,
        settings,
        updatedAt: org.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    if (error instanceof SecurityError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Update org settings error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update organization settings' } },
      { status: 500 }
    );
  }
}
