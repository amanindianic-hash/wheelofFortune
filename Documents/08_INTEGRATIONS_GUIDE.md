# Integrations Guide

**Last Updated:** 2026-04-22

---

## Overview

Integrations are configured per client workspace from `/dashboard/integrations`. Each integration:
- Stores credentials in the `integrations` table (JSONB `config` field)
- Is toggled on/off with `is_active`
- Fires non-blocking after a successful spin (uses `Promise.allSettled()`)
- Failures are silently logged — they never block the player experience

---

## Mailchimp

**What it does:** Adds the player's email to a Mailchimp audience list.

**Setup:**
1. Get your Mailchimp API key from Account → Extras → API Keys
2. Find your Audience/List ID in Audience → Settings → Audience name and defaults
3. Enter both in the integrations dashboard

**Data synced:**
- Email address
- First name (from lead form `name` field, split on space)
- Last name

**Config shape:**
```json
{
  "api_key": "abc123-us1",
  "list_id": "def456"
}
```

---

## Klaviyo

**What it does:** Creates or updates a subscriber profile and tracks a `Wheel Spin` event.

**Setup:**
1. Get your Private API Key from Klaviyo Account → API Keys
2. Get your List ID from the Lists tab

**Data synced:**
- Email, name, phone
- Event: `Wheel Spin` with properties: wheel name, prize won, coupon code

**Config shape:**
```json
{
  "api_key": "pk_abc123",
  "list_id": "LIST_ID"
}
```

---

## HubSpot

**What it does:** Creates or updates a Contact in HubSpot CRM.

**Setup:**
1. Create a Private App in HubSpot Settings → Integrations → Private Apps
2. Grant `crm.objects.contacts.write` scope
3. Copy the access token

**Data synced:**
- Email, first name, last name, phone
- Custom property: `wheel_prize` (prize name)
- Custom property: `wheel_coupon` (coupon code)

**Config shape:**
```json
{
  "access_token": "pat-na1-abc123"
}
```

---

## Salesforce

**What it does:** Creates a Lead object in Salesforce.

**Setup:**
1. Create a Connected App in Salesforce Setup → App Manager
2. Enable OAuth with `api` and `refresh_token` scopes
3. Store the OAuth access token (or use username+password flow for simple setups)

**Data synced:**
- Email, first name, last name, phone
- Lead Source: "Wheel of Fortune"
- Custom field: `Prize__c` (if configured on Lead object)

**Config shape:**
```json
{
  "instance_url": "https://yourorg.salesforce.com",
  "access_token": "00D...",
  "refresh_token": "5Aep..."
}
```

---

## Google Sheets

**What it does:** Appends a new row to a Google Sheet for each spin.

**Setup:**
1. Create a Google Cloud project
2. Enable Google Sheets API
3. Create a Service Account and download JSON key
4. Share the target Google Sheet with the service account email
5. Enter the Sheet ID (from the URL) and sheet name

**Data synced (columns):**
- Timestamp, Email, Name, Phone, Wheel Name, Prize, Coupon Code, GDPR Consent

**Config shape:**
```json
{
  "service_account_key": { ...google service account JSON... },
  "sheet_id": "1BxiMVs0XRA...",
  "sheet_name": "Sheet1"
}
```

---

## Zapier

**What it does:** Triggers a Zapier webhook (Zap) with full lead payload.

**Setup:**
1. Create a Zap with "Webhooks by Zapier" as trigger
2. Choose "Catch Hook"
3. Copy the webhook URL into the integrations dashboard

**Payload sent:**
```json
{
  "event": "spin.completed",
  "wheel_name": "Summer Promo",
  "email": "player@example.com",
  "name": "John Doe",
  "phone": "+15551234567",
  "prize": "10% Off",
  "coupon_code": "SUMMER01",
  "gdpr_consent": true,
  "timestamp": "2026-04-22T12:00:00Z"
}
```

**Config shape:**
```json
{
  "webhook_url": "https://hooks.zapier.com/hooks/catch/..."
}
```

---

## Custom Webhooks

**What it does:** POSTs a signed payload to any HTTPS endpoint you control.

**Setup:**
1. Enter your endpoint URL
2. Optionally set a secret for HMAC signature verification

**Security:**
- Each request includes `X-Signature: sha256=<hmac>` header
- HMAC computed with SHA-256 using your webhook secret over the raw JSON body
- Verify on your end: `crypto.createHmac('sha256', secret).update(body).digest('hex')`

**Payload:** Same shape as Zapier payload above.

**Config shape:**
```json
{
  "url": "https://your-server.com/webhook",
  "secret": "your-signing-secret"
}
```

---

## Shopify

**What it does:** Automatically creates a unique discount code in Shopify when a player wins a coupon prize.

**Setup:**
1. In Shopify Admin → Apps → Develop Apps → Create a Private App
2. Grant: `write_discounts`, `read_price_rules`
3. Enter your Shopify store URL and admin API access token
4. Link a Shopify Price Rule ID to each prize (created in Shopify Admin → Discounts)

**Flow:**
1. Player wins a coupon-type prize
2. System calls Shopify API to create a unique discount code under the linked Price Rule
3. Code returned to player in the result screen

**Config shape:**
```json
{
  "shop_url": "yourstore.myshopify.com",
  "access_token": "shpat_abc123",
  "price_rule_id": "123456789"
}
```

---

## Twilio / WhatsApp

**What it does:** Sends the prize coupon code to the player via WhatsApp.

**Setup:**
1. Twilio account with WhatsApp Sandbox or approved business number
2. Set in environment variables (not the dashboard):
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_WHATSAPP_FROM`

**Triggered:** When player wins and has provided a phone number with WhatsApp opt-in.

**Message template:**
```
You won [Prize Name] on [Wheel Name]! 
Your code: [COUPON_CODE]
Expires: [DATE]
```

---

## Telegram

**What it does:** Sends the prize via a Telegram bot message.

**Setup:**
1. Create a Telegram bot via @BotFather
2. Set `TELEGRAM_BOT_TOKEN` environment variable
3. Set bot webhook: `POST https://api.telegram.org/bot{TOKEN}/setWebhook`  
   with `url: https://yourdomain.com/api/telegram/webhook`

**Triggered:** When player sends `/start` to the bot and completes a spin.

---

## Web Push Notifications

**What it does:** Sends browser push notifications to opted-in players.

**Setup:**
1. Generate VAPID keys: `npx web-push generate-vapid-keys`
2. Set in environment: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`

**Opt-in flow:**
1. During spin form, player sees "Get notified about future promotions" checkbox
2. On consent, browser requests push permission
3. Subscription stored in `push_subscriptions` table

**Sending campaigns:**
- From `/dashboard/push`, compose and send manual campaigns
- Or use Vercel cron-triggered reminders (daily at 10am)

---

## Apple Wallet & Google Wallet

**What it does:** Lets winners save their prize pass to their phone's wallet app.

**Apple Wallet:**
- Requires Apple Developer account and Pass Type ID certificate
- Generates `.pkpass` (ZIP of JSON + images + signature)
- Downloaded via `GET /api/wallet/apple?spin_id=uuid`

**Google Wallet:**
- Requires Google Cloud service account with Wallet API access
- Generates a JWT the player clicks "Save to Google Wallet"
- Linked via `GET /api/wallet/google?spin_id=uuid`

Both passes include:
- Prize name
- Coupon code
- Barcode
- Expiry date
- Brand logo

---

## Integration Execution Flow

```
Player spins → Prize resolved → spin_results saved
                                       │
                    ┌──────────────────┴──────────────────┐
                    │   Promise.allSettled() — parallel    │
                    ├── Mailchimp sync                     │
                    ├── Klaviyo event                      │
                    ├── HubSpot contact upsert             │
                    ├── Salesforce lead create             │
                    ├── Google Sheets append row           │
                    ├── Zapier webhook POST                │
                    ├── Custom webhook POST                │
                    ├── Shopify discount code create       │
                    ├── WhatsApp message send              │
                    └── Telegram message send              │
                                                           │
                    API response already returned to player ◄
```

Failures in any integration do **not** affect the player experience or retry the spin.
