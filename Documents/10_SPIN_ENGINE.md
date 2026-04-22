# Spin Engine & Prize Resolution

**Last Updated:** 2026-04-22

---

## Overview

The spin engine is the core of the platform. It handles fair, tamper-proof prize selection using a cryptographically secure random number generator (CSPRNG), enforces win caps, allocates coupons, and fires integrations — all in a single atomic-ish API call.

---

## Spin Lifecycle

```
1. Player fills form → POST /api/spin/session → session_id returned
2. Animation plays on client (visual only — no outcome yet)
3. POST /api/spin/execute → prize resolved server-side
4. Client receives segment + prize → shows result
5. Integrations fire in background (non-blocking)
```

---

## Server-Side Prize Resolution (prize-engine.ts)

### Step 1: Load Eligible Segments

```sql
SELECT segments.* FROM segments
WHERE wheel_id = $1
  AND (total_win_cap IS NULL OR wins_total < total_win_cap)
  AND (daily_win_cap IS NULL OR wins_today < daily_win_cap)
```

Segments that have hit their win caps are excluded before the draw.

### Step 2: Weighted Random Selection

```typescript
// Build cumulative weight table
const total = segments.reduce((sum, s) => sum + s.weight, 0);

// CSPRNG draw
const randomBytes = crypto.randomBytes(4);
const random = randomBytes.readUInt32BE(0) / 0xFFFFFFFF; // 0 to 1
const draw = random * total;

// Walk cumulative weights
let cumulative = 0;
for (const segment of segments) {
  cumulative += segment.weight;
  if (draw < cumulative) return segment;
}
```

This ensures:
- Fair probability proportional to weight
- No server-side manipulation
- Reproducible with the recorded `server_seed`

### Step 3: Win Cap Update

```sql
UPDATE segments
SET wins_today = wins_today + 1,
    wins_total = wins_total + 1
WHERE id = $1
```

### Step 4: Coupon Allocation (if prize is type = coupon)

**Static mode:** Return `prize.static_code` directly.

**Pool mode:**
```sql
UPDATE coupon_codes
SET status = 'issued', issued_at = NOW(), issued_to_spin_id = $1
WHERE id = (
  SELECT id FROM coupon_codes
  WHERE prize_id = $2 AND status = 'available'
  LIMIT 1
  FOR UPDATE SKIP LOCKED  -- prevents race condition
)
RETURNING code
```

**Auto-generated mode:** Generate a UUID-based code and insert.

### Step 5: Record spin_result

```sql
INSERT INTO spin_results (session_id, wheel_id, segment_id, prize_id, coupon_code_id, server_seed, client_seed, idempotency_key)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
```

### Step 6: Fire Integrations (non-blocking)

```typescript
Promise.allSettled([
  syncMailchimp(lead, integration),
  syncKlaviyo(lead, integration),
  syncHubSpot(lead, integration),
  syncSalesforce(lead, integration),
  syncGoogleSheets(lead, integration),
  triggerZapier(lead, integration),
  triggerWebhook(lead, integration),
  createShopifyCoupon(prize, integration),
]);
// Response returned BEFORE these settle
```

---

## Idempotency

The `idempotency_key` field on `spin_results` prevents duplicate prize execution if the client retries:

```sql
-- On execute:
INSERT INTO spin_results (..., idempotency_key)
VALUES (..., $key)
ON CONFLICT (idempotency_key) DO NOTHING
RETURNING *

-- If no row returned (conflict), fetch existing result:
SELECT * FROM spin_results WHERE idempotency_key = $key
```

The client generates the idempotency key (typically a UUID) before sending the execute request and retries with the same key if the network fails.

---

## Guaranteed Win / Forced Outcome

The wheel config supports a `guaranteed_win` flag and a `forced_segment_id`:

- When `guaranteed_win = true`, the engine re-draws until a non-no-prize segment is selected (or a max retry limit is hit)
- When `forced_segment_id` is set (admin testing), that segment always wins

---

## Fingerprint & Frequency Enforcement

The spin session creation (`POST /api/spin/session`) checks:

1. **Fingerprint uniqueness**: Has this browser fingerprint already spun in the cap window?
2. **IP rate limiting**: Excessive spins from same IP?
3. **Session expiry**: Sessions expire after a configurable TTL (cleaned by cron)

If caps are exceeded, the session endpoint returns `429` and the widget shows a "come back later" message.

---

## Kiosk Mode

When `config.kiosk_mode = true`:
- Frequency caps are bypassed
- Sessions auto-expire after result display (configurable seconds)
- No fingerprint tracking per visitor
- Intended for shared screens (trade shows, retail kiosks)

---

## A/B Testing Integration

When A/B tests are configured:
1. Session creation checks for active tests on the wheel
2. Player is assigned to a variant (via hash of session fingerprint for consistent assignment)
3. Variant's `config_override` is merged into wheel config for the session
4. Impression and conversion counters updated in `ab_tests`

---

## Audit Trail

Every spin is auditable:
- `spin_sessions`: player identity, form data, consent
- `spin_results`: which segment won, which coupon was issued, server seed
- `audit_logs`: any admin actions affecting prize/segment config

The `server_seed` allows post-hoc verification of the random draw.

---

## Daily & Monthly Reset Crons

| Cron | What It Resets |
|---|---|
| `0 0 * * *` (midnight) | `segments.wins_today = 0` for all segments |
| `5 0 1 * *` (1st of month) | `clients.spins_used_this_month = 0` for all clients |

These are idempotent — if they fail, running them again is safe.
