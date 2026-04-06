import { NextRequest } from 'next/server';
import { sendTelegramMessage, sendTelegramPhoto, testTelegramConnection } from '@/lib/telegram';
import { getAuthUser } from '@/lib/auth';
import { okResponse, errorResponse } from '@/lib/middleware-utils';

// POST /api/telegram/send
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);

    const body = await req.json();
    const { chat_id, text, image_url, caption, test } = body;

    if (!chat_id) return errorResponse('VALIDATION_ERROR', 'chat_id is required.', 400);

    if (test) {
      const result = await testTelegramConnection(chat_id);
      return result.ok ? okResponse({ ok: true }) : errorResponse('SEND_FAILED', result.error ?? 'Connection failed.', 502);
    }

    let result;
    if (image_url) {
      result = await sendTelegramPhoto(chat_id, image_url, caption ?? text);
    } else {
      if (!text) return errorResponse('VALIDATION_ERROR', 'text or image_url is required.', 400);
      result = await sendTelegramMessage(chat_id, text);
    }

    if (!result.ok) return errorResponse('SEND_FAILED', result.error ?? 'Failed to send.', 502);
    return okResponse({ ok: true });
  } catch (err) {
    console.error('Telegram send error:', err);
    return errorResponse('INTERNAL_ERROR', 'Failed to send Telegram message.', 500);
  }
}
