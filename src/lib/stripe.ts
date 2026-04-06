import Stripe from 'stripe';

export const STRIPE_PLANS = {
  growth: {
    id: process.env.STRIPE_PRICE_GROWTH ?? 'price_growth_monthly',
    name: 'Growth',
    spins: 5000,
  },
  pro: {
    id: process.env.STRIPE_PRICE_PRO ?? 'price_pro_monthly',
    name: 'Pro',
    spins: 25000,
  },
  enterprise: {
    id: process.env.STRIPE_PRICE_ENTERPRISE ?? 'price_enterprise_monthly',
    name: 'Enterprise',
    spins: 1000000,
  },
} as const;

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function createStripeCheckout(
  clientId: string,
  planKey: string,
  customerEmail: string,
): Promise<string> {
  const plan = STRIPE_PLANS[planKey as keyof typeof STRIPE_PLANS];
  if (!plan) throw new Error(`Invalid plan: ${planKey}`);

  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    customer_email: customerEmail,
    line_items: [{ price: plan.id, quantity: 1 }],
    mode: 'subscription',
    success_url: `${appUrl}/dashboard/account?upgraded=1`,
    cancel_url: `${appUrl}/dashboard/account`,
    metadata: { client_id: clientId, plan: planKey },
  });

  if (!session.url) throw new Error('Stripe did not return a checkout URL');
  return session.url;
}

export async function constructStripeEventAsync(
  payload: string,
  signature: string,
): Promise<Stripe.Event> {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }
  return getStripe().webhooks.constructEventAsync(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
}
