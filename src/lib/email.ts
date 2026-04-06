/**
 * Email Service via Resend
 *
 * Required env vars:
 *   RESEND_API_KEY    — Resend API key (re_...)
 *   RESEND_FROM_EMAIL — Sender address (default: noreply@spinplatform.com)
 *                       Must be a verified domain in your Resend account.
 */

const RESEND_API_URL = 'https://api.resend.com/emails';

export async function sendWinEmail(email: string, prizeTitle: string, couponCode: string | null) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[EMAIL] RESEND_API_KEY not set — skipping win email');
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL ?? 'noreply@spinplatform.com';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You Won!</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:560px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:40px 40px 32px;text-align:center;">
              <div style="font-size:48px;">🎡</div>
              <h1 style="color:#ffffff;margin:16px 0 0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Congratulations!</h1>
              <p style="color:#c4b5fd;margin:8px 0 0;font-size:16px;">You just won a prize</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">
                Great news! Your spin was successful and you've won:
              </p>
              <div style="background:#f5f3ff;border:2px solid #7c3aed;border-radius:8px;padding:20px;text-align:center;margin:0 0 24px;">
                <p style="color:#5b21b6;font-size:22px;font-weight:700;margin:0;">🎁 ${prizeTitle}</p>
              </div>
              ${couponCode ? `
              <p style="color:#374151;font-size:15px;margin:0 0 12px;">Your exclusive coupon code:</p>
              <div style="background:#f9fafb;border:2px dashed #d1d5db;border-radius:8px;padding:16px;text-align:center;margin:0 0 24px;">
                <p style="color:#111827;font-size:24px;font-weight:700;letter-spacing:4px;margin:0;font-family:monospace;">${couponCode}</p>
              </div>
              <p style="color:#6b7280;font-size:13px;margin:0 0 24px;">Copy and paste this code at checkout to redeem your prize.</p>
              ` : ''}
              <p style="color:#6b7280;font-size:13px;margin:0;">
                If you have any questions, simply reply to this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                You're receiving this because you participated in a prize wheel.<br/>
                © ${new Date().getFullYear()} SpinPlatform. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: `🎉 You won: ${prizeTitle}`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('[EMAIL] Resend error:', err);
    }
  } catch (error) {
    console.error('[EMAIL] Fatal error:', error);
  }
}
