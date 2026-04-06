/**
 * Telegram Bot API helpers
 * Env var: TELEGRAM_BOT_TOKEN
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
const BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendTelegramMessage(chatId: string | number, text: string): Promise<{ ok: boolean; error?: string }> {
  if (!BOT_TOKEN) return { ok: false, error: 'TELEGRAM_BOT_TOKEN not configured.' };
  const res = await fetch(`${BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  });
  if (res.ok) return { ok: true };
  const data = await res.json().catch(() => ({}));
  return { ok: false, error: data.description ?? 'Telegram API error' };
}

export async function sendTelegramPhoto(chatId: string | number, imageUrl: string, caption?: string): Promise<{ ok: boolean; error?: string }> {
  if (!BOT_TOKEN) return { ok: false, error: 'TELEGRAM_BOT_TOKEN not configured.' };
  const res = await fetch(`${BASE}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, photo: imageUrl, caption, parse_mode: 'Markdown' }),
  });
  if (res.ok) return { ok: true };
  const data = await res.json().catch(() => ({}));
  return { ok: false, error: data.description ?? 'Telegram API error' };
}

export async function testTelegramConnection(chatId: string): Promise<{ ok: boolean; error?: string }> {
  return sendTelegramMessage(chatId, '✅ SpinPlatform connected successfully!');
}
