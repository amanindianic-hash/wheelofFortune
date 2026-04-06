import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { logAuditAction } from '@/lib/audit';
import { okResponse, errorResponse } from '@/lib/middleware-utils';
import { validateShopifyCredentials, listShopifyPriceRules } from '@/lib/integrations/shopify';

/**
 * GET /api/integrations/shopify
 * Returns the current Shopify integration config (masked token) + price rules.
 */
export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);

  const rows = await sql`
    SELECT id, config, is_active, created_at, updated_at
    FROM integrations
    WHERE client_id = ${user.client_id}
      AND type = 'shopify'
      AND deleted_at IS NULL
    LIMIT 1
  `;
  const integration = (rows as any[])[0];

  if (!integration) {
    return okResponse({ connected: false });
  }

  const config = integration.config as Record<string, any>;

  // Mask token for safety
  const maskedConfig = {
    ...config,
    access_token: config.access_token
      ? `${String(config.access_token).slice(0, 6)}${'*'.repeat(12)}`
      : null,
  };

  // Optionally fetch price rules
  let priceRules: any[] = [];
  try {
    priceRules = await listShopifyPriceRules(config.shop_domain, config.access_token);
  } catch {
    // Non-fatal — store may be temporarily unreachable
  }

  return okResponse({
    connected: true,
    integration: { ...integration, config: maskedConfig },
    price_rules: priceRules,
  });
}

/**
 * POST /api/integrations/shopify
 * Connect Shopify — validate credentials and upsert integration row.
 */
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);

  const body = await req.json();
  const { shop_domain, access_token, price_rule_id, prefix, usage_limit, expiry_days } = body;

  if (!shop_domain || !access_token || !price_rule_id) {
    return errorResponse('VALIDATION_ERROR', 'shop_domain, access_token and price_rule_id are required.', 400);
  }

  // Validate credentials live
  let shopInfo: { shop_name: string; plan: string };
  try {
    shopInfo = await validateShopifyCredentials(shop_domain, access_token);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid credentials';
    return errorResponse('INVALID_CREDENTIALS', msg, 422);
  }

  const config = {
    shop_domain,
    access_token,
    price_rule_id,
    prefix: prefix || 'WHEEL',
    usage_limit: usage_limit || 1,
    expiry_days: expiry_days || 30,
    shop_name: shopInfo.shop_name,
    plan: shopInfo.plan,
  };

  // Upsert the row
  const upserted = await sql`
    INSERT INTO integrations (client_id, type, config, is_active)
    VALUES (${user.client_id}, 'shopify', ${JSON.stringify(config)}::jsonb, true)
    ON CONFLICT (client_id, type) DO UPDATE SET
      config = EXCLUDED.config,
      is_active = true,
      updated_at = NOW()
    RETURNING id
  `;
  const row = (upserted as any[])[0];

  await logAuditAction({
    req,
    userId: user.id,
    clientId: user.client_id,
    action: 'integration_created',
    resourceType: 'integration',
    resourceId: row?.id,
    changes: { type: 'shopify', shop_domain, shop_name: shopInfo.shop_name },
  });

  return okResponse({ success: true, integration_id: row?.id }, 201);
}

/**
 * PUT /api/integrations/shopify
 * Update partial config (swap price rule, adjust settings).
 */
export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);

  const updates = await req.json();

  const currentRows = await sql`
    SELECT id, config FROM integrations
    WHERE client_id = ${user.client_id} AND type = 'shopify' AND deleted_at IS NULL
    LIMIT 1
  `;
  const current = (currentRows as any[])[0];
  if (!current) return errorResponse('NOT_FOUND', 'Shopify integration not connected.', 404);

  const merged = { ...(current.config as Record<string, any>), ...updates };

  await sql`
    UPDATE integrations
    SET config = ${JSON.stringify(merged)}::jsonb, updated_at = NOW()
    WHERE id = ${current.id}
  `;

  await logAuditAction({
    req,
    userId: user.id,
    clientId: user.client_id,
    action: 'integration_updated',
    resourceType: 'integration',
    resourceId: current.id,
    changes: { type: 'shopify', ...updates },
  });

  return okResponse({ success: true });
}

/**
 * DELETE /api/integrations/shopify
 * Soft-delete / disconnect the Shopify integration.
 */
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);

  await sql`
    UPDATE integrations
    SET deleted_at = NOW(), is_active = false, updated_at = NOW()
    WHERE client_id = ${user.client_id} AND type = 'shopify' AND deleted_at IS NULL
  `;

  await logAuditAction({
    req,
    userId: user.id,
    clientId: user.client_id,
    action: 'integration_deleted',
    resourceType: 'integration',
    changes: { type: 'shopify' },
  });

  return okResponse({ success: true });
}
