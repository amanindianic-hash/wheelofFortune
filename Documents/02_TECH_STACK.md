# Tech Stack & Dependencies

**Last Updated:** 2026-04-22

---

## Frontend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | Next.js | 16.2.2 | App Router, SSR/SSG, API routes |
| UI Library | React | 19.2.4 | Component model |
| Styling | Tailwind CSS | 4.x | Utility-first CSS |
| Component Library | Shadcn/ui | Latest | Pre-built accessible UI primitives |
| Icons | Lucide React | Latest | SVG icon set |
| Toasts | Sonner | Latest | Non-blocking notification toasts |
| Base UI | Base UI React | 1.3.0 | Headless accessible primitives |
| Rendering | HTML5 Canvas | Native | Wheel / slot / roulette visual rendering |
| Language | TypeScript | 5.x | Full strict-mode type safety |

---

## Backend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Runtime | Node.js (Vercel) | 20.x | Next.js API routes server |
| Database | Neon PostgreSQL | Latest | Serverless relational DB |
| DB Driver | @neondatabase/serverless | Latest | HTTP-based Postgres driver |
| Auth | Jose | Latest | JWT sign/verify (HS256) |
| Password | bcryptjs | Latest | Password hashing (bcrypt) |
| Payments | Stripe SDK | 21.0.1 | Subscription billing, webhook handling |
| Email | Resend | HTTP API | Transactional email delivery |
| Push | web-push | Latest | VAPID-based Web Push API |
| File Storage | @vercel/blob | Latest | User-uploaded assets (images, CSVs) |
| QR Codes | qrcode | Latest | QR code generation for prize redemption |
| Image | pngjs | Latest | PNG manipulation for barcodes |

---

## Integrations & Messaging

| Service | Library / Method | Use Case |
|---|---|---|
| Mailchimp | HTTP API | Lead contact sync |
| Klaviyo | HTTP API | Event tracking + subscriber lists |
| HubSpot | HTTP API | CRM contact creation |
| Salesforce | HTTP API (REST) | Lead object creation |
| Google Sheets | HTTP API | Append lead rows |
| Zapier | Webhook POST | Custom automation triggers |
| Generic Webhooks | HMAC-signed POST | Flexible external integrations |
| Shopify | HTTP API | Auto-create discount codes |
| Twilio | HTTP API | WhatsApp messaging |
| Telegram | Bot API | Direct message notifications |
| Apple Wallet | passkit-generator | PKPass `.pkpass` generation |
| Google Wallet | Google API JWT | Save to Phone pass generation |

---

## Testing

| Tool | Version | Purpose |
|---|---|---|
| Playwright | 1.59.1 | End-to-end browser testing |
| Vitest | Latest | Unit/integration tests |
| React Testing Library | Latest | Component rendering tests |
| JSDOM / Happy DOM | Latest | DOM simulation for unit tests |

---

## DevOps & Deployment

| Tool | Purpose |
|---|---|
| Vercel | Hosting, edge CDN, serverless functions |
| Neon PostgreSQL | Managed serverless database |
| Vercel Blob | File/asset storage |
| Vercel Cron | 5 scheduled background jobs |
| GitHub | Source control + CI trigger |

---

## Development Scripts

```bash
npm run dev          # Start local dev server on :3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check
npm test             # Run unit tests (Vitest)
npm run test:e2e     # Run E2E tests (Playwright)
npm run test:e2e:ui  # Interactive Playwright UI mode
```

---

## Environment Variable Summary

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `JWT_SECRET` | Yes | 32+ char signing secret for JWTs |
| `NEXT_PUBLIC_APP_URL` | Yes | Public base URL (e.g. https://app.example.com) |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook endpoint secret |
| `STRIPE_PRICE_GROWTH` | Yes | Stripe price ID for Growth plan |
| `STRIPE_PRICE_PRO` | Yes | Stripe price ID for Pro plan |
| `STRIPE_PRICE_ENTERPRISE` | Yes | Stripe price ID for Enterprise plan |
| `VAPID_PUBLIC_KEY` | Push | Web Push VAPID public key |
| `VAPID_PRIVATE_KEY` | Push | Web Push VAPID private key |
| `VAPID_SUBJECT` | Push | Web Push VAPID subject (mailto:) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Push | Browser-exposed VAPID key |
| `TWILIO_ACCOUNT_SID` | WhatsApp | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | WhatsApp | Twilio auth token |
| `TWILIO_WHATSAPP_FROM` | WhatsApp | WhatsApp sender number |
| `TELEGRAM_BOT_TOKEN` | Telegram | Telegram bot API token |
| `GOOGLE_WALLET_ISSUER_ID` | Wallet | Google Wallet issuer ID |
| `GOOGLE_WALLET_CLASS_ID` | Wallet | Google Wallet pass class ID |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Wallet | Google service account JSON key |
| `APPLE_PASS_TYPE_ID` | Wallet | Apple Wallet pass type identifier |
| `APPLE_TEAM_ID` | Wallet | Apple Developer Team ID |
| `APPLE_PASS_CERT` | Wallet | Apple pass signing certificate |
| `APPLE_PASS_KEY` | Wallet | Apple pass signing private key |
| `APPLE_WWDR_CERT` | Wallet | Apple WWDR certificate |
| `CRON_SECRET` | Cron | Bearer token for Vercel cron auth |
| `RESEND_API_KEY` | Email | Resend email service API key |
| `RESEND_FROM_EMAIL` | Email | Sender email address |

---

## Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Copy the output into `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.
