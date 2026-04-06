import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { STRIPE_PLANS, constructStripeEventAsync } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event;
  try {
    event = await constructStripeEventAsync(payload, signature);
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { client_id, plan: planKey } = (session.metadata ?? {}) as { client_id?: string; plan?: string };

      if (client_id && planKey) {
        const plan = STRIPE_PLANS[planKey as keyof typeof STRIPE_PLANS];

        if (plan) {
          await sql`
            UPDATE clients
            SET plan             = ${planKey},
                plan_spin_limit  = ${plan.spins},
                stripe_customer_id = ${String(session.customer ?? '')},
                stripe_subscription_id = ${String(session.subscription ?? '')},
                is_active        = true
            WHERE id = ${client_id}
          `;

          await sql`
            INSERT INTO audit_logs (client_id, action, resource_type, resource_id, changes)
            VALUES (
              ${client_id},
              'plan_changed',
              'client',
              ${client_id},
              ${JSON.stringify({ plan: planKey, spin_limit: plan.spins })}::jsonb
            )
          `;
        }
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customerId = String(subscription.customer);

      await sql`
        UPDATE clients
        SET plan            = 'starter',
            plan_spin_limit = 500,
            stripe_subscription_id = NULL
        WHERE stripe_customer_id = ${customerId}
      `;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Webhook processing error:', err.message);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
