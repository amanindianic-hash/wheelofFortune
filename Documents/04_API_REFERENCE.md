# API Reference

**Last Updated:** 2026-04-22  
**Base URL:** `/api`  
**Auth:** JWT in `access_token` httpOnly cookie (except public spin endpoints)

---

## Authentication

All dashboard endpoints require a valid `access_token` cookie unless noted otherwise.  
Access tokens expire in **15 minutes**. Use the refresh endpoint to renew.

### `POST /api/auth/register`
Create a new client account and owner user.

**Body:**
```json
{
  "email": "owner@company.com",
  "password": "min8chars",
  "full_name": "Jane Smith",
  "company_name": "ACME Corp"
}
```

**Response:** `201` — Sets `access_token` + `refresh_token` cookies.

---

### `POST /api/auth/login`
Authenticate with email and password.

**Body:**
```json
{ "email": "user@company.com", "password": "secret" }
```

**Response:** `200` — Sets auth cookies.

---

### `POST /api/auth/logout`
Clear auth cookies.

**Response:** `200`

---

### `GET /api/auth/me`
Return the currently authenticated user.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "Jane Smith",
  "role": "owner",
  "client_id": "uuid"
}
```

---

### `POST /api/auth/refresh`
Refresh the access token using the refresh cookie.

**Response:** `200` — Issues new `access_token` cookie.

---

### `POST /api/auth/forgot-password`
Send a password reset email.

**Body:** `{ "email": "user@example.com" }`

---

### `POST /api/auth/reset-password`
Confirm a password reset with a token from the email link.

**Body:** `{ "token": "reset-jwt", "password": "newpassword" }`

---

### `GET /api/auth/google`
Initiate Google OAuth flow (redirects to Google).

### `GET /api/auth/google/callback`
OAuth callback — sets auth cookies and redirects to dashboard.

### `POST /api/auth/google-register`
Complete Google signup flow (sets client name, etc.).

---

## Wheels

### `GET /api/wheels`
List all wheels for the authenticated client.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Summer Promo",
    "status": "active",
    "game_type": "wheel",
    "embed_token": "uuid",
    "total_spins": 1240,
    "created_at": "2026-01-01T00:00:00Z"
  }
]
```

---

### `POST /api/wheels`
Create a new wheel.

**Body:**
```json
{
  "name": "Holiday Wheel",
  "game_type": "wheel"
}
```

**Response:** `201` — Full wheel object.

---

### `GET /api/wheels/[id]`
Get a single wheel with all segments, prizes, and config.

---

### `PUT /api/wheels/[id]`
Update wheel name, status, config, branding, trigger rules, form config, or frequency rules.

**Body:** Partial wheel object (any fields to update).

---

### `DELETE /api/wheels/[id]`
Soft-delete (archive) a wheel.

---

### `POST /api/wheels/[id]/segments`
Replace all segments for a wheel.

**Body:**
```json
{
  "segments": [
    {
      "label": "10% Off",
      "color": "#FF5733",
      "weight": 40,
      "prize_id": "uuid"
    },
    {
      "label": "Try Again",
      "color": "#CCCCCC",
      "weight": 60,
      "is_no_prize": true
    }
  ]
}
```

---

### `POST /api/wheels/[id]/publish`
Activate a draft wheel (sets status to `active`).

---

### `POST /api/wheels/[id]/ab-test`
Create an A/B test variant.

**Body:**
```json
{
  "variant_name": "Variant A",
  "traffic_split": 0.5,
  "config_override": { "branding": { "primary_color": "#FF0000" } }
}
```

---

### `GET /api/wheels/[id]/leaderboard`
Get top winners for this wheel.

**Query:** `?limit=10&period=30d`

---

## Prizes

### `GET /api/prizes`
List all prizes for the client.

### `POST /api/prizes`
Create a prize.

**Body:**
```json
{
  "name": "10% Off Coupon",
  "type": "coupon",
  "display_title": "You won 10% off!",
  "coupon_mode": "static",
  "static_code": "SAVE10",
  "expiry_days": 30
}
```

### `PUT /api/prizes/[id]`
Update a prize.

### `DELETE /api/prizes/[id]`
Soft-delete a prize.

---

## Coupons

### `POST /api/coupons`
Bulk-upload coupon codes from CSV.

**Body:** `multipart/form-data` with `file` (CSV) and `prize_id`.

**CSV format:**
```
code
SUMMER01
SUMMER02
SUMMER03
```

---

## Spin Execution (Public)

These endpoints are public — authenticated by `embed_token`, not JWT.

### `POST /api/spin/session`
Create a player session before spinning.

**Body:**
```json
{
  "embed_token": "uuid",
  "fingerprint": "browser-hash",
  "form_data": {
    "email": "player@example.com",
    "name": "John Doe"
  },
  "gdpr_consent": true
}
```

**Response:**
```json
{ "session_id": "uuid" }
```

---

### `POST /api/spin/execute`
Execute the spin and resolve the outcome.

**Body:**
```json
{
  "session_id": "uuid",
  "idempotency_key": "unique-client-key",
  "client_seed": "optional-entropy"
}
```

**Response:**
```json
{
  "segment_id": "uuid",
  "segment_label": "10% Off",
  "prize": {
    "type": "coupon",
    "display_title": "You won 10% off!",
    "coupon_code": "SUMMER01",
    "expires_at": "2026-05-22T00:00:00Z"
  }
}
```

---

### `GET /api/spin/game-type?token=[embed_token]`
Get the game type for a wheel (public, no auth).

**Response:** `{ "game_type": "wheel" }`

---

### `GET /api/spin/streak?session_id=[id]`
Get current win streak for a player.

---

## Leads

### `GET /api/leads`
List all lead captures for the client.

**Query:** `?wheel_id=uuid&page=1&limit=50&search=email@example.com`

**Response:**
```json
{
  "leads": [
    {
      "id": "uuid",
      "lead_email": "player@example.com",
      "lead_name": "John",
      "gdpr_consent": true,
      "wheel_name": "Summer Promo",
      "prize_name": "10% Off",
      "coupon_code": "SUMMER01",
      "created_at": "2026-04-20T12:00:00Z"
    }
  ],
  "total": 245
}
```

---

## Analytics

### `GET /api/analytics`
Summary stats for the client's wheels.

**Query:** `?wheel_id=uuid&start=2026-04-01&end=2026-04-22`

**Response:**
```json
{
  "total_spins": 1240,
  "total_winners": 480,
  "conversion_rate": 0.387,
  "daily_trend": [
    { "date": "2026-04-20", "spins": 54, "winners": 21 }
  ]
}
```

---

### `GET /api/analytics/leaderboard`
Top winners ranked by wins or points.

---

### `GET /api/analytics/export`
Export leads and analytics as CSV.

**Response:** CSV file download.

---

## Integrations

### `GET /api/integrations`
List all configured integrations for the client.

### `POST /api/integrations`
Create or update an integration.

**Body:**
```json
{
  "type": "mailchimp",
  "is_active": true,
  "config": {
    "api_key": "abc123",
    "list_id": "def456"
  }
}
```

### `POST /api/integrations/shopify`
Setup Shopify integration with store credentials.

---

## Push Notifications

### `POST /api/push/subscribe`
Register a browser's push subscription.

**Body:** Web Push subscription object from `pushManager.subscribe()`.

### `POST /api/push/unsubscribe`
Remove a push subscription.

### `POST /api/push/send`
Send a push notification campaign.

**Body:**
```json
{
  "title": "You have unclaimed prizes!",
  "body": "Spin again today for another chance to win.",
  "url": "https://app.example.com/play/token"
}
```

### `GET /api/push/stats`
Campaign delivery statistics.

### `GET /api/push/logs`
Per-subscription delivery logs.

---

## Digital Wallets

### `GET /api/wallet/apple?spin_id=[id]`
Generate and download an Apple Wallet `.pkpass` for a prize.

### `GET /api/wallet/google?spin_id=[id]`
Generate a Google Wallet JWT to save a pass to phone.

---

## Billing

### `POST /api/billing/checkout`
Create a Stripe Checkout session.

**Body:** `{ "plan": "growth" }`

**Response:** `{ "checkout_url": "https://checkout.stripe.com/..." }`

### `POST /api/billing/webhook`
Stripe webhook receiver (validates `Stripe-Signature` header).

---

## Messaging

### `POST /api/whatsapp/send`
Send a WhatsApp message via Twilio.

**Body:**
```json
{
  "to": "+15551234567",
  "message": "Your prize code is SUMMER01!"
}
```

### `POST /api/telegram/send`
Send a Telegram message via Bot API.

### `POST /api/telegram/webhook`
Telegram bot webhook receiver.

---

## Referral

### `POST /api/referral/track`
Record a referral link click.

### `POST /api/referral/credits`
Award referral bonus credits.

---

## Cron Jobs (Internal — Vercel cron only)

These endpoints require `Authorization: Bearer $CRON_SECRET`.

| Endpoint | Schedule | Action |
|---|---|---|
| `GET /api/cron/reset-daily` | `0 0 * * *` | Reset `wins_today` on all segments |
| `GET /api/cron/reset-monthly` | `5 0 1 * *` | Reset `spins_used_this_month` on all clients |
| `GET /api/cron/expire-sessions` | `0 2 * * *` | Mark expired spin sessions as `expired` |
| `GET /api/cron/push-reminder` | `0 10 * * *` | Send scheduled push notification reminders |
| `GET /api/cron/whatsapp-reminder` | `0 11 * * *` | Send scheduled WhatsApp reminders |

---

## Error Format

All error responses follow this shape:

```json
{
  "error": "Human-readable message",
  "code": "MACHINE_CODE"
}
```

| HTTP Status | Meaning |
|---|---|
| 400 | Bad request / validation error |
| 401 | Not authenticated |
| 403 | Authenticated but insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict (duplicate idempotency key, etc.) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
