import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, okResponse, errorResponse } from '@/lib/middleware-utils';
import { logAuditAction } from '@/lib/audit';
import { IntegrationType } from '@/lib/types';

/**
 * GET /api/integrations
 * Lists all configured integrations for the authenticated client.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  try {
    const integrations = await sql`
      SELECT id, type, config, is_active, created_at, updated_at
      FROM integrations
      WHERE client_id = ${auth.user.client_id}
      ORDER BY type ASC
    ` as any[];

    return okResponse({ integrations });
  } catch (err) {
    console.error('List integrations error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch integrations.', 500);
  }
}

/**
 * POST /api/integrations
 * Creates or updates an integration configuration.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  if (!['owner', 'admin'].includes(auth.user.role)) {
    return errorResponse('FORBIDDEN', 'Insufficient permissions to manage integrations.', 403);
  }

  try {
    const body = await req.json();
    const { type, config, is_active = true } = body;

    const validTypes: IntegrationType[] = ['mailchimp', 'klaviyo', 'hubspot', 'salesforce', 'zapier', 'webhook', 'google_sheets'];
    if (!validTypes.includes(type)) {
      return errorResponse('VALIDATION_ERROR', `Invalid integration type. Must be one of: ${validTypes.join(', ')}`, 400);
    }

    if (!config || typeof config !== 'object') {
      return errorResponse('VALIDATION_ERROR', 'Valid config object is required.', 400);
    }

    // Upsert integration by type for this client
    const results = await sql`
      INSERT INTO integrations (client_id, type, config, is_active, updated_at)
      VALUES (${auth.user.client_id}, ${type}, ${JSON.stringify(config)}::jsonb, ${is_active}, NOW())
      ON CONFLICT (client_id, type) DO UPDATE SET
        config = EXCLUDED.config,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
      RETURNING *
    `;
    const integration = (results as any)[0];

    await logAuditAction({
      req,
      userId: auth.user.id,
      clientId: auth.user.client_id,
      action: 'integration_updated',
      resourceType: 'integration',
      resourceId: integration.id,
      changes: { type, is_active }
    });

    return okResponse({ integration });
  } catch (err) {
    console.error('Update integration error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to update integration.', 500);
  }
}
