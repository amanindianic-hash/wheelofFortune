/**
 * Zapier Integration
 *
 * Triggers a Zapier webhook (Catch Hook trigger) when a visitor wins on the wheel.
 * In Zapier, create a "Webhooks by Zapier" trigger with "Catch Hook" event,
 * then paste the webhook URL into this integration's config.
 *
 * Config shape (stored in integrations.config jsonb):
 * {
 *   webhook_url: string,  // Zapier webhook URL (https://hooks.zapier.com/hooks/catch/...)
 * }
 */

export async function syncToZapier(
  email: string,
  firstName: string,
  lastName: string,
  prize: any,
  config: any,
) {
  const { webhook_url } = config;
  if (!webhook_url) return;

  const payload = {
    event: 'spin.won',
    email,
    first_name: firstName,
    last_name: lastName,
    prize_title: prize?.display_title ?? null,
    prize_type: prize?.type ?? null,
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Zapier webhook error:', response.status);
    }
  } catch (error) {
    console.error('Zapier fatal error:', error);
  }
}
