/**
 * SSO Configuration API
 * GET       — Retrieve SSO config from organization.settings JSON
 * PUT       — Update SSO configuration (orgadmin+ only)
 * POST      — Validate SAML/OIDC endpoint (?action=test-sso)
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireOrgAdmin, AuthError } from '@/lib/api-auth';
import { inputSanitizeOptional, SecurityError } from '@/lib/security';
import { headers } from 'next/headers';

interface SsoConfig {
  samlEnabled?: boolean;
  samlMetadataUrl?: string;
  oidcEnabled?: boolean;
  oidcClientId?: string;
  oidcIssuer?: string;
  oidcClientSecret?: string;
}

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

/** Extract SSO config from organization settings */
function extractSsoConfig(settings: Record<string, unknown>): SsoConfig {
  return {
    samlEnabled: typeof settings.samlEnabled === 'boolean' ? settings.samlEnabled : false,
    samlMetadataUrl: typeof settings.samlMetadataUrl === 'string' ? settings.samlMetadataUrl : undefined,
    oidcEnabled: typeof settings.oidcEnabled === 'boolean' ? settings.oidcEnabled : false,
    oidcClientId: typeof settings.oidcClientId === 'string' ? settings.oidcClientId : undefined,
    oidcIssuer: typeof settings.oidcIssuer === 'string' ? settings.oidcIssuer : undefined,
    oidcClientSecret: typeof settings.oidcClientSecret === 'string' ? settings.oidcClientSecret : undefined,
  };
}

/** Mask a secret string, showing only last 4 chars */
function maskSecret(secret?: string): string | undefined {
  if (!secret) return undefined;
  if (secret.length <= 4) return '****';
  return '*'.repeat(secret.length - 4) + secret.slice(-4);
}

export async function GET() {
  try {
    const user = await requireOrgAdmin();

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
    const ssoConfig = extractSsoConfig(settings);

    return NextResponse.json({
      success: true,
      data: {
        ...ssoConfig,
        oidcClientSecret: maskSecret(ssoConfig.oidcClientSecret),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Get SSO config error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve SSO configuration' } },
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
    const ssoUpdate: Partial<SsoConfig> = {};
    const changes: string[] = [];

    // SAML fields
    if (body.samlEnabled !== undefined && body.samlEnabled !== null) {
      ssoUpdate.samlEnabled = Boolean(body.samlEnabled);
      changes.push(`samlEnabled -> ${ssoUpdate.samlEnabled}`);
    }

    if (body.samlMetadataUrl !== undefined && body.samlMetadataUrl !== null) {
      const url = inputSanitizeOptional(body.samlMetadataUrl, 2000);
      if (url) {
        ssoUpdate.samlMetadataUrl = url;
        changes.push('samlMetadataUrl updated');
      }
    }

    // OIDC fields
    if (body.oidcEnabled !== undefined && body.oidcEnabled !== null) {
      ssoUpdate.oidcEnabled = Boolean(body.oidcEnabled);
      changes.push(`oidcEnabled -> ${ssoUpdate.oidcEnabled}`);
    }

    if (body.oidcClientId !== undefined && body.oidcClientId !== null) {
      const clientId = inputSanitizeOptional(body.oidcClientId, 500);
      if (clientId) {
        ssoUpdate.oidcClientId = clientId;
        changes.push('oidcClientId updated');
      }
    }

    if (body.oidcIssuer !== undefined && body.oidcIssuer !== null) {
      const issuer = inputSanitizeOptional(body.oidcIssuer, 2000);
      if (issuer) {
        ssoUpdate.oidcIssuer = issuer;
        changes.push('oidcIssuer updated');
      }
    }

    if (body.oidcClientSecret !== undefined && body.oidcClientSecret !== null) {
      const secret = inputSanitizeOptional(body.oidcClientSecret, 500);
      if (secret) {
        ssoUpdate.oidcClientSecret = secret;
        changes.push('oidcClientSecret updated');
      }
    }

    if (Object.keys(ssoUpdate).length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_CHANGES', message: 'No valid SSO fields to update' } },
        { status: 400 }
      );
    }

    // Merge with existing org settings
    const org = await db.organization.findUnique({
      where: { id: user.organizationId },
    });
    if (!org) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Organization not found' } },
        { status: 404 }
      );
    }

    const existingSettings = parseOrgSettings(org.settings);
    const mergedSettings = { ...existingSettings, ...ssoUpdate };

    await db.organization.update({
      where: { id: user.organizationId },
      data: { settings: JSON.stringify(mergedSettings) },
    });

    // Audit log
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null;
    const ua = headersList.get('user-agent') || null;
    await db.auditLog.create({
      data: {
        action: 'SSO_CONFIG_UPDATED',
        resource: 'Organization',
        resourceId: user.organizationId,
        userId: user.id,
        details: JSON.stringify({ changes }),
        ipAddress: ip,
        userAgent: ua,
      },
    });

    const finalSso = extractSsoConfig(mergedSettings);

    return NextResponse.json({
      success: true,
      data: {
        ...finalSso,
        oidcClientSecret: maskSecret(finalSso.oidcClientSecret),
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
    console.error('Update SSO config error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update SSO configuration' } },
      { status: 500 }
    );
  }
}

/**
 * Test SSO configuration — validate SAML metadata URL or OIDC discovery endpoint.
 * Requires ?action=test-sso query parameter.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireOrgAdmin();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action !== 'test-sso') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ACTION', message: 'Use ?action=test-sso to test SSO configuration' } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const ssoType = inputSanitizeOptional(body.type, 20);
    const url = inputSanitizeOptional(body.url, 2000);

    if (!ssoType || !url) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'SSO type (saml/oidc) and URL are required' } },
        { status: 400 }
      );
    }

    if (ssoType !== 'saml' && ssoType !== 'oidc') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TYPE', message: 'SSO type must be "saml" or "oidc"' } },
        { status: 400 }
      );
    }

    // Attempt to fetch the URL with a 10s timeout
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(10_000),
        headers: { 'Accept': ssoType === 'saml' ? 'application/xml,text/xml' : 'application/json' },
      });
    } catch (fetchErr) {
      return NextResponse.json({
        success: true,
        data: {
          type: ssoType,
          url,
          reachable: false,
          status: null,
          message: `Failed to connect: ${fetchErr instanceof Error ? fetchErr.message : 'Unknown error'}`,
        },
      });
    }

    const reachable = response.ok;
    const contentType = response.headers.get('content-type') || '';

    // Basic content validation
    let validContent = false;
    if (ssoType === 'saml') {
      validContent = contentType.includes('xml');
    } else {
      validContent = contentType.includes('json');
    }

    // Audit log the test
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null;
    const ua = headersList.get('user-agent') || null;
    await db.auditLog.create({
      data: {
        action: 'SSO_TEST',
        resource: 'Organization',
        resourceId: user.organizationId,
        userId: user.id,
        details: JSON.stringify({ type: ssoType, url, status: response.status, reachable, validContent }),
        ipAddress: ip,
        userAgent: ua,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        type: ssoType,
        url,
        reachable,
        statusCode: response.status,
        contentType,
        validContent,
        message: reachable
          ? (validContent ? 'Endpoint reachable and returns valid content type' : 'Endpoint reachable but content type may not match expected format')
          : `Endpoint returned HTTP ${response.status}`,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Test SSO error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to test SSO configuration' } },
      { status: 500 }
    );
  }
}
