import { NextRequest } from 'next/server';
import { okResponse } from '@/lib/middleware-utils';

// POST /api/telegram/webhook — receives Telegram bot updates
export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // Handle /start command
    const message = update.message ?? update.channel_post;
    if (message?.text?.startsWith('/start')) {
      const chatId = message.chat?.id;
      if (chatId && process.env.TELEGRAM_BOT_TOKEN) {
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `👋 Welcome to SpinPlatform bot!\n\nYour chat ID is: \`${chatId}\`\n\nAdd this to your dashboard integration settings to enable notifications.`,
            parse_mode: 'Markdown',
          }),
        });
      }
    }

    return okResponse({ ok: true });
  } catch {
    return okResponse({ ok: true }); // Always 200 to Telegram
  }
}
