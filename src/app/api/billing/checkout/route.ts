import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/middleware-utils';
import { createStripeCheckout } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  // Fail fast if Stripe is not configured — gives a clear message instead of a cryptic 500
  if (!process.env.STRIPE_SECRET_KEY) {
    return errorResponse(
      'STRIPE_NOT_CONFIGURED',
      'Stripe is not configured. Add STRIPE_SECRET_KEY to your environment variables.',
      503,
    );
  }

  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  try {
    const body = await req.json();
    const plan = body.plan ?? body.plan_key;   // accept both field names
    if (!plan) return errorResponse('MISSING_FIELDS', 'plan is required', 400);

    const checkoutUrl = await createStripeCheckout(
      auth.user.client_id,
      plan,
      auth.user.email,
    );

    return NextResponse.json({ url: checkoutUrl });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create checkout session';
    console.error('Checkout error:', error);
    return errorResponse('STRIPE_ERROR', msg, 500);
  }
}
