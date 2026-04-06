/**
 * WhatsApp Business API via Twilio
 * Env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
 */

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ?? '';
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? '';
const FROM = process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886'; // Twilio sandbox default

export type WhatsAppTemplate = 'spin_reminder' | 'prize_won' | 'custom';

export interface WhatsAppMessageParams {
  to: string; // E.164 phone number e.g. +1234567890
  template: WhatsAppTemplate;
  vars?: Record<string, string>; // template variable overrides
}

const TEMPLATES: Record<WhatsAppTemplate, (v: Record<string, string>) => string> = {
  spin_reminder: (v) =>
    `🎡 Hey ${v.name ?? 'there'}! Your daily spin is waiting. Visit ${v.url ?? 'our site'} to spin and win amazing prizes! Reply STOP to opt out.`,
  prize_won: (v) =>
    `🎉 Congratulations ${v.name ?? 'Winner'}! You won *${v.prize ?? 'a prize'}*. ${v.coupon ? `Your code: *${v.coupon}*` : ''} ${v.url ? `Claim here: ${v.url}` : ''}`.trim(),
  custom: (v) => v.message ?? '',
};

export async function sendWhatsAppMessage(params: WhatsAppMessageParams): Promise<{ success: boolean; sid?: string; error?: string }> {
  if (!ACCOUNT_SID || !AUTH_TOKEN) {
    return { success: false, error: 'Twilio credentials not configured.' };
  }

  const to = params.to.startsWith('whatsapp:') ? params.to : `whatsapp:${params.to}`;
  const body = TEMPLATES[params.template](params.vars ?? {});

  const encoded = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encoded}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: FROM, Body: body }).toString(),
    },
  );

  if (res.ok) {
    const data = await res.json();
    return { success: true, sid: data.sid };
  }
  const err = await res.text();
  return { success: false, error: err };
}
