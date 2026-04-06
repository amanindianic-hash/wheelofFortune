/**
 * Shopify Integration Library
 * Handles automatic discount code generation when a visitor wins a prize on the wheel.
 *
 * Required env vars:
 *   SHOPIFY_SHOP_DOMAIN  — e.g. "my-store.myshopify.com"
 *   SHOPIFY_ACCESS_TOKEN — Admin API access token (offline token, read_discounts + write_discounts scope)
 *
 * The integration stores its config inside the integrations table as:
 * {
 *   shop_domain: string,       // overrides env var (per-account)
 *   access_token: string,      // overrides env var (per-account)
 *   price_rule_id: string,     // pre-created PriceRule id on Shopify (for the coupon template)
 *   prefix: string,            // e.g. "WHEEL" → codes like "WHEEL-A1B2C3"
 *   usage_limit: number,       // per-code usage limit (default 1)
 *   expiry_days: number,       // days until code expires (default 30)
 * }
 */

export interface ShopifyConfig {
  shop_domain: string;
  access_token: string;
  price_rule_id: string;
  prefix?: string;
  usage_limit?: number;
  expiry_days?: number;
}

export interface CreatedDiscountCode {
  code: string;
  discount_code_id: string;
  price_rule_id: string;
  expires_at: string | null;
  admin_url: string;
}

function shopifyApiBase(shopDomain: string) {
  const domain = shopDomain.includes('myshopify.com')
    ? shopDomain
    : `${shopDomain}.myshopify.com`;
  return `https://${domain}/admin/api/2024-04`;
}

function generateCode(prefix = 'WHEEL') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const random = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${prefix.toUpperCase()}-${random}`;
}

/**
 * Create a unique single-use Shopify discount code for a winner.
 */
export async function createShopifyDiscountCode(
  config: ShopifyConfig,
  prizeLabel: string,
): Promise<CreatedDiscountCode> {
  const {
    shop_domain = process.env.SHOPIFY_SHOP_DOMAIN || '',
    access_token = process.env.SHOPIFY_ACCESS_TOKEN || '',
    price_rule_id,
    prefix = 'WHEEL',
    usage_limit = 1,
    expiry_days = 30,
  } = config;

  if (!shop_domain || !access_token || !price_rule_id) {
    throw new Error('Missing required Shopify config: shop_domain, access_token, price_rule_id');
  }

  const code = generateCode(prefix);
  const expiresAt = new Date(Date.now() + expiry_days * 86_400_000).toISOString();
  const base = shopifyApiBase(shop_domain);

  const res = await fetch(`${base}/price_rules/${price_rule_id}/discount_codes.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': access_token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      discount_code: {
        code,
        usage_limit,
        ends_at: expiresAt,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Shopify API error ${res.status}: ${body}`);
  }

  const json = await res.json();
  const dc = json.discount_code;

  return {
    code: dc.code,
    discount_code_id: String(dc.id),
    price_rule_id,
    expires_at: expiresAt,
    admin_url: `https://${shop_domain}/admin/discounts/${dc.id}`,
  };
}

/**
 * Validate Shopify credentials and return store info.
 */
export async function validateShopifyCredentials(
  shopDomain: string,
  accessToken: string,
): Promise<{ shop_name: string; plan: string }> {
  const base = shopifyApiBase(shopDomain);
  const res = await fetch(`${base}/shop.json`, {
    headers: { 'X-Shopify-Access-Token': accessToken },
  });

  if (!res.ok) {
    throw new Error(`Invalid Shopify credentials: ${res.status}`);
  }

  const { shop } = await res.json();
  return { shop_name: shop.name, plan: shop.plan_name };
}

/**
 * List all PriceRules on the store (to help the admin pick a template).
 */
export async function listShopifyPriceRules(
  shopDomain: string,
  accessToken: string,
): Promise<{ id: string; title: string; value: string; value_type: string }[]> {
  const base = shopifyApiBase(shopDomain);
  const res = await fetch(`${base}/price_rules.json?limit=50`, {
    headers: { 'X-Shopify-Access-Token': accessToken },
  });

  if (!res.ok) {
    throw new Error(`Could not list price rules: ${res.status}`);
  }

  const { price_rules } = await res.json();
  return price_rules.map((r: any) => ({
    id: String(r.id),
    title: r.title,
    value: r.value,
    value_type: r.value_type,
  }));
}
