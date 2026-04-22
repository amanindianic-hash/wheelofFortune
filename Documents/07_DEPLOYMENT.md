# Deployment Guide

**Last Updated:** 2026-04-22  
**Platform:** Vercel  
**Database:** Neon PostgreSQL (serverless)  
**Live URL:** https://wheelof-fortune-test-2usuvgo7k-amanqureshi-8795s-projects.vercel.app

---

## Prerequisites

- Node.js 20+
- A Vercel account
- A Neon PostgreSQL database
- Stripe account (for billing)
- Resend account (for email)
- (Optional) Twilio, Telegram, Apple/Google developer accounts for messaging/wallets

---

## Local Development Setup

### 1. Clone & Install

```bash
git clone <repo-url>
cd wheelofFortune
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

Required variables:
```
DATABASE_URL=postgres://...
JWT_SECRET=your-32-char-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com
CRON_SECRET=your-cron-secret
```

### 3. Run Database Migrations

Apply the schema migrations from the migrations directory:

```bash
# Run all migration files against your Neon DATABASE_URL
# (check /src/app/api/migrations or equivalent for migration files)
```

### 4. Start Dev Server

```bash
npm run dev
```

App runs at `http://localhost:3000`.

---

## Vercel Deployment

### 1. Import Project

In the Vercel dashboard, import the GitHub repository.

### 2. Set Environment Variables

In Vercel Project Settings → Environment Variables, add all variables from `.env.example`.

Key production values:
- `NEXT_PUBLIC_APP_URL` = your production domain
- `STRIPE_SECRET_KEY` = `sk_live_...` (use live key in production)
- `STRIPE_WEBHOOK_SECRET` = from Stripe Dashboard → Webhooks

### 3. Build Command

The `vercel.json` already sets:
```json
{
  "buildCommand": "npm test && npm run build"
}
```

Tests must pass before deployment completes.

### 4. Deploy

Push to the `main` branch — Vercel auto-deploys.

Or deploy manually:
```bash
npx vercel --prod
```

---

## Cron Jobs

Defined in `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/reset-daily",    "schedule": "0 0 * * *"   },
    { "path": "/api/cron/reset-monthly",  "schedule": "5 0 1 * *"   },
    { "path": "/api/cron/expire-sessions","schedule": "0 2 * * *"   },
    { "path": "/api/cron/push-reminder",  "schedule": "0 10 * * *"  },
    { "path": "/api/cron/whatsapp-reminder","schedule": "0 11 * * *" }
  ]
}
```

Vercel calls these automatically. Each endpoint requires:
```
Authorization: Bearer $CRON_SECRET
```

---

## Stripe Webhook Setup

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/billing/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`

---

## Telegram Bot Setup

1. Create a bot via [@BotFather](https://t.me/botfather) on Telegram
2. Get the `TELEGRAM_BOT_TOKEN`
3. Set the webhook: `POST https://api.telegram.org/bot{TOKEN}/setWebhook`  
   Body: `{ "url": "https://yourdomain.com/api/telegram/webhook" }`

---

## Apple Wallet Setup

1. Apple Developer account required
2. Create a Pass Type ID in the Developer Portal
3. Generate a pass signing certificate and export as `.p12`
4. Set in environment:
   - `APPLE_PASS_TYPE_ID`
   - `APPLE_TEAM_ID`
   - `APPLE_PASS_CERT` (base64 encoded certificate)
   - `APPLE_PASS_KEY` (base64 encoded private key)
   - `APPLE_WWDR_CERT` (Apple WWDR intermediate cert, base64)

---

## Google Wallet Setup

1. Google Cloud project required
2. Enable Google Wallet API
3. Create a service account with Wallet access
4. Download service account JSON key
5. Set in environment:
   - `GOOGLE_WALLET_ISSUER_ID`
   - `GOOGLE_WALLET_CLASS_ID`
   - `GOOGLE_SERVICE_ACCOUNT_KEY` (JSON string of service account key)

---

## Custom Domain

1. In Vercel Project Settings → Domains, add your custom domain
2. Configure DNS CNAME/A records as instructed
3. Update `NEXT_PUBLIC_APP_URL` to your custom domain
4. Update Stripe webhook endpoint URL to custom domain
5. Update Telegram webhook to custom domain
6. For client white-label domains: set `custom_domain` on the `clients` record

---

## Vercel Blob Storage

Used for:
- Uploaded coupon CSV files
- Custom wheel background/overlay images
- Segment icon uploads

No additional configuration required — Vercel Blob is automatically available in Vercel projects. Just set the blob store token in the project settings.

---

## Health Checks

After deploying, verify:

- [ ] `GET /` — Landing or redirect works
- [ ] `POST /api/auth/login` — Returns 200 with valid credentials
- [ ] `GET /api/wheels` — Returns 200 (authenticated)
- [ ] `GET /widget/[valid-token]` — Widget page renders
- [ ] Stripe webhook endpoint accepts test events
- [ ] Cron jobs appear in Vercel Logs when triggered

---

## Rollback

Vercel keeps deployment history. To rollback:

1. Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "Promote to Production"

Or via CLI:
```bash
npx vercel rollback
```

---

## Monitoring & Logs

- **Vercel Function Logs**: Real-time API route logs in Vercel Dashboard
- **Vercel Analytics**: Page views, Web Vitals
- **Cron Job Logs**: Visible in Vercel → Cron tab
- **Audit Logs**: In-app at `/dashboard/audit`
- **Stripe Dashboard**: Billing events and webhook delivery logs
