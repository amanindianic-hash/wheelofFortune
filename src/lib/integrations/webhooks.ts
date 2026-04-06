import crypto from 'crypto';

export async function syncToWebhook(email: string, firstName: string, lastName: string, prize: any, config: any) {
  const { url, secret } = config;
  if (!url) return;

  const payload = JSON.stringify({
    event: 'spin.won',
    email,
    first_name: firstName,
    last_name: lastName,
    prize,
    timestamp: new Date().toISOString(),
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (secret) {
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    headers['X-Wheel-Signature'] = signature;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: payload,
    });

    if (!response.ok) {
      console.error('Webhook sync error:', response.status);
    }
  } catch (error) {
    console.error('Webhook fatal error:', error);
  }
}
