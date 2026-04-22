# Database Schema

**Last Updated:** 2026-04-22  
**Database:** Neon PostgreSQL (serverless)  
**Driver:** @neondatabase/serverless (HTTP-based, no persistent connection)

---

## Entity Relationship Overview

```
clients
  └── users (many)
  └── wheels (many)
       ├── segments (many)
       │    └── prizes (one optional)
       │         └── coupon_codes (many)
       ├── spin_sessions (many)
       │    └── spin_results (one)
       ├── integrations (many)
       └── ab_tests (many)
  └── audit_logs (many)
  └── push_subscriptions (many)
```

---

## Tables

### `clients`
Represents a workspace/company account.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | TEXT | Company/workspace name |
| `slug` | TEXT | URL-safe identifier, unique |
| `email` | TEXT | Billing contact email |
| `plan` | TEXT | free / starter / growth / pro / enterprise |
| `spin_limit` | INTEGER | Monthly spin quota |
| `spins_used_this_month` | INTEGER | Rolling counter, reset by cron |
| `stripe_customer_id` | TEXT | Stripe customer reference |
| `stripe_subscription_id` | TEXT | Active subscription ID |
| `custom_domain` | TEXT | Optional white-label domain |
| `timezone` | TEXT | IANA timezone string |
| `created_at` | TIMESTAMPTZ | Auto-set on insert |
| `updated_at` | TIMESTAMPTZ | Auto-updated |
| `deleted_at` | TIMESTAMPTZ | Soft delete |

---

### `users`
Team members who log into the dashboard.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `client_id` | UUID | FK → clients.id |
| `email` | TEXT | Unique login identifier |
| `password_hash` | TEXT | bcrypt hash (nullable for OAuth users) |
| `full_name` | TEXT | Display name |
| `role` | TEXT | owner / admin / editor / viewer |
| `email_verified` | BOOLEAN | Email confirmation status |
| `google_id` | TEXT | Google OAuth subject ID |
| `last_login_at` | TIMESTAMPTZ | Updated on each login |
| `created_at` | TIMESTAMPTZ | Auto-set on insert |
| `updated_at` | TIMESTAMPTZ | Auto-updated |
| `deleted_at` | TIMESTAMPTZ | Soft delete |

---

### `wheels`
A game configuration. The central entity.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `client_id` | UUID | FK → clients.id |
| `name` | TEXT | Human-readable wheel name |
| `status` | TEXT | draft / active / paused / archived |
| `game_type` | TEXT | wheel / scratch / slot / roulette |
| `embed_token` | UUID | Public token for widget URL (unique) |
| `config` | JSONB | Spin duration, animation, confetti, kiosk mode, geo rules, frequency caps |
| `branding` | JSONB | Theme colors, fonts, background, logo, overlay image |
| `trigger_rules` | JSONB | Time-on-page, scroll depth, exit intent thresholds |
| `frequency_rules` | JSONB | Per-visitor display frequency caps |
| `form_config` | JSONB | Lead capture form field definitions |
| `total_spins` | INTEGER | Cumulative spin count |
| `created_at` | TIMESTAMPTZ | Auto-set on insert |
| `updated_at` | TIMESTAMPTZ | Auto-updated |
| `deleted_at` | TIMESTAMPTZ | Soft delete |

---

### `segments`
Individual slices of a wheel.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `wheel_id` | UUID | FK → wheels.id |
| `label` | TEXT | Display text on the segment |
| `color` | TEXT | Hex color code |
| `weight` | INTEGER | Relative probability weight |
| `prize_id` | UUID | FK → prizes.id (nullable) |
| `is_no_prize` | BOOLEAN | True if this is a "no win" segment |
| `position` | INTEGER | Segment order on wheel |
| `label_offset_x` | FLOAT | Absolute label X offset (px) |
| `label_offset_y` | FLOAT | Absolute label Y offset (px) |
| `label_rotation` | FLOAT | Label rotation angle (degrees) |
| `font_size_scale` | FLOAT | Multiplier for font size |
| `icon_url` | TEXT | Optional icon image URL |
| `icon_position` | TEXT | outer / inner / overlay |
| `relative_offset_x` | FLOAT | 0–1 scale relative X offset |
| `relative_offset_y` | FLOAT | 0–1 scale relative Y offset |
| `daily_win_cap` | INTEGER | Max wins per day for this segment |
| `total_win_cap` | INTEGER | Max wins ever for this segment |
| `wins_today` | INTEGER | Rolling daily counter |
| `wins_total` | INTEGER | Cumulative counter |
| `created_at` | TIMESTAMPTZ | Auto-set on insert |
| `updated_at` | TIMESTAMPTZ | Auto-updated |

**Constraint:** `chk_prize_or_no_prize` — each segment must have either `prize_id IS NOT NULL` or `is_no_prize = TRUE`.

---

### `prizes`
Prize definitions shared across segments/wheels.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `client_id` | UUID | FK → clients.id |
| `name` | TEXT | Internal name |
| `type` | TEXT | coupon / points / gift_card / message / redirect |
| `display_title` | TEXT | Player-facing prize name |
| `coupon_mode` | TEXT | static / pool / auto_generated |
| `static_code` | TEXT | Fixed code (when coupon_mode = static) |
| `points_value` | INTEGER | Points awarded (when type = points) |
| `redirect_url` | TEXT | URL to send winner to |
| `custom_message_html` | TEXT | Rich HTML message for winner |
| `expiry_days` | INTEGER | Days until coupon expires after issue |
| `created_at` | TIMESTAMPTZ | Auto-set on insert |
| `updated_at` | TIMESTAMPTZ | Auto-updated |
| `deleted_at` | TIMESTAMPTZ | Soft delete |

---

### `coupon_codes`
Individual codes assigned to a prize pool.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `prize_id` | UUID | FK → prizes.id |
| `code` | TEXT | The coupon string |
| `status` | TEXT | available / issued / redeemed / expired |
| `issued_at` | TIMESTAMPTZ | When assigned to a player |
| `expires_at` | TIMESTAMPTZ | Calculated expiry |
| `issued_to_spin_id` | UUID | FK → spin_results.id |
| `created_at` | TIMESTAMPTZ | Auto-set on insert |

---

### `spin_sessions`
One player's game session (before they spin).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `wheel_id` | UUID | FK → wheels.id |
| `fingerprint` | TEXT | Browser fingerprint hash |
| `ip_address` | TEXT | Player IP |
| `user_agent` | TEXT | Browser user agent |
| `lead_email` | TEXT | Email captured from form |
| `lead_name` | TEXT | Name captured from form |
| `lead_phone` | TEXT | Phone captured from form |
| `form_data` | JSONB | All additional form field values |
| `gdpr_consent` | BOOLEAN | GDPR/marketing consent flag |
| `status` | TEXT | pending / completed / expired |
| `expires_at` | TIMESTAMPTZ | Session TTL (cleaned by cron) |
| `created_at` | TIMESTAMPTZ | Auto-set on insert |

---

### `spin_results`
The outcome of a completed spin.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `session_id` | UUID | FK → spin_sessions.id |
| `wheel_id` | UUID | FK → wheels.id |
| `segment_id` | UUID | FK → segments.id (winning segment) |
| `prize_id` | UUID | FK → prizes.id (nullable) |
| `coupon_code_id` | UUID | FK → coupon_codes.id (nullable) |
| `server_seed` | TEXT | CSPRNG seed used for selection |
| `client_seed` | TEXT | Client-provided randomness contribution |
| `idempotency_key` | TEXT | Unique key to prevent duplicate execution |
| `created_at` | TIMESTAMPTZ | Auto-set on insert |

---

### `integrations`
CRM and external service credentials per client.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `client_id` | UUID | FK → clients.id |
| `type` | TEXT | mailchimp / klaviyo / hubspot / salesforce / google_sheets / zapier / webhook / shopify |
| `is_active` | BOOLEAN | Whether this integration is enabled |
| `config` | JSONB | Service-specific credentials and settings |
| `created_at` | TIMESTAMPTZ | Auto-set on insert |
| `updated_at` | TIMESTAMPTZ | Auto-updated |

---

### `audit_logs`
Immutable compliance log of all dashboard actions.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `client_id` | UUID | FK → clients.id |
| `user_id` | UUID | FK → users.id |
| `action` | TEXT | Action name (e.g. wheel.update, prize.delete) |
| `resource_type` | TEXT | Entity type (wheel, prize, segment, etc.) |
| `resource_id` | UUID | Entity ID |
| `changes` | JSONB | Before/after diff |
| `ip_address` | TEXT | Request IP |
| `user_agent` | TEXT | Browser info |
| `created_at` | TIMESTAMPTZ | Immutable timestamp |

---

### `push_subscriptions`
Web Push browser subscriptions.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `client_id` | UUID | FK → clients.id |
| `endpoint` | TEXT | Browser push endpoint URL |
| `p256dh` | TEXT | ECDH public key |
| `auth` | TEXT | Auth secret |
| `user_agent` | TEXT | Browser info |
| `expires_at` | TIMESTAMPTZ | Subscription expiry |
| `created_at` | TIMESTAMPTZ | Auto-set on insert |

---

### `ab_tests`
A/B test configuration for wheel variants.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `wheel_id` | UUID | FK → wheels.id |
| `variant_name` | TEXT | e.g. "Control", "Variant A" |
| `traffic_split` | FLOAT | 0–1 percentage of traffic |
| `config_override` | JSONB | Wheel config overrides for this variant |
| `impressions` | INTEGER | Times variant was shown |
| `conversions` | INTEGER | Spins completed in variant |
| `created_at` | TIMESTAMPTZ | Auto-set on insert |

---

## Cron-Reset Columns

| Table | Column | Reset Frequency |
|---|---|---|
| `segments` | `wins_today` | Daily at midnight |
| `clients` | `spins_used_this_month` | Monthly at 00:05 |

---

## Conventions

- All primary keys are UUIDs (generated with `gen_random_uuid()`)
- Soft deletes use `deleted_at TIMESTAMPTZ` — queries filter `WHERE deleted_at IS NULL`
- All tables have `created_at` and `updated_at` auto-managed by triggers or application layer
- JSONB columns for flexible, schema-less configuration data
- No traditional ORM — raw SQL with Neon's tagged template literals for injection-safe parameterization
