<!-- converted from WheelOfFortune_BusinessLogic_v1.0.docx -->



BL-01 — Plan Limits & Quotas
BL-01.1 Active Wheel Limits

BL-01.2 Spin Quota Enforcement Rules
BL-01.3 File Upload Limits

BL-02 — Wheel Configuration Rules
BL-02.1 Wheel Scheduling Rules
BL-02.2 Trigger Rules Schema (wheels.trigger_rules JSONB)
BL-02.3 Frequency Rules Schema (wheels.frequency_rules JSONB)


BL-03 — Segment & Weight Rules

BL-04 — Prize Engine Logic Rules
BL-04.1 Probability Calculation
BL-04.2 Idempotency Rules
BL-04.3 Guaranteed Win Rules
BL-04.4 Jackpot Mode Rules

BL-05 — Coupon Assignment Rules

BL-06 — Role-Based Access Control Rules


BL-07 — Spin Session Rules

BL-08 — Integration & Webhook Dispatch Rules

BL-09 — Data Integrity & Immutability Rules

BL-10 — Billing & Subscription Rules

— END OF BUSINESS LOGIC RULES —
| WHEEL OF FORTUNE PLATFORM
Business Logic Rules — Document #6 |
| --- |
| Document Type | Business Logic Rules |
| --- | --- |
| Version | v1.0 |
| Date | March 2026 |
| Status | APPROVED FOR DEVELOPMENT |
| Related Documents | TRD v1.1 | SOP v1.0 | API Spec v1.1 | Schema v1.1 |
| Audience | Developers, QA, Product, Architects |
| Plan | Max Active Wheels | Monthly Spin Quota | Max Team Members | Max Segments/Wheel | Max Prizes/Client |
| --- | --- | --- | --- | --- | --- |
| starter | 1 | 500 | 2 | 24 | 10 |
| growth | 5 | 5,000 | 5 | 24 | 50 |
| pro | 20 | 50,000 | 15 | 24 | 200 |
| enterprise | Unlimited | Custom (negotiated) | Unlimited | 24 | Unlimited |
| RULE:  Max segments per wheel (24) is UNIVERSAL across all plans. It is a technical hard limit, not a plan feature. |
| --- |
| Rule ID | Rule | Enforcement Point |
| --- | --- | --- |
| Q-01 | Increment clients.spins_used_this_month atomically on every successful spin (UPDATE ... SET spins_used_this_month = spins_used_this_month + 1) | Prize Engine — after spin_result inserted |
| Q-02 | If spins_used_this_month >= plan_spin_limit at session creation: return can_spin=false, reason=MONTHLY_LIMIT_REACHED | POST /spin/session |
| Q-03 | Do NOT re-check quota mid-spin. If session was created with can_spin=true, the spin may proceed even if quota fills up between session creation and spin execution. | By design — avoids race condition |
| Q-04 | Quota resets to 0 on billing_cycle_day each month at 00:05 UTC via pg_cron. | pg_cron: reset-monthly-spins |
| Q-05 | At 90% quota consumed: send in-app banner + email to client owner. | Background job check after each spin |
| Q-06 | Plan upgrades immediately update plan_spin_limit. No spin history is lost. | Stripe webhook handler |
| Asset Type | Max File Size | Allowed MIME Types | Storage Location |
| --- | --- | --- | --- |
| Logo / Branding Image | 5 MB | image/png, image/jpeg, image/svg+xml, image/webp | AWS S3 / Cloudflare R2 |
| Segment Icon | 5 MB | image/png, image/jpeg, image/svg+xml, image/webp | AWS S3 / Cloudflare R2 |
| Sound File | 5 MB | audio/mpeg, audio/ogg | AWS S3 / Cloudflare R2 |
| Custom Font | 5 MB | font/woff2 | AWS S3 / Cloudflare R2 |
| Center Image (wheel hub) | 5 MB | image/png, image/jpeg, image/svg+xml, image/webp | AWS S3 / Cloudflare R2 |
| Rule ID | Rule |
| --- | --- |
| W-01 | If active_from is set and current time < active_from: widget returns can_spin=false, reason=OUTSIDE_DATE_RANGE |
| W-02 | If active_until is set and current time > active_until: widget returns can_spin=false, reason=OUTSIDE_DATE_RANGE |
| W-03 | If both active_from and active_until are NULL: wheel is always available while status=active |
| W-04 | active_from and active_until are stored as TIMESTAMPTZ (UTC). Clients set them in their own timezone; API converts. |
| W-05 | If total_spin_cap is set and total_spins >= total_spin_cap: can_spin=false, reason=SPIN_CAP_REACHED |
| W-06 | total_spins is monotonically incrementing. It is NEVER decremented. |
| Field | Type | Description | Example |
| --- | --- | --- | --- |
| show_on_exit_intent | boolean | Show wheel when cursor moves toward browser bar | true |
| show_after_seconds | integer | null | Show wheel after N seconds on page. NULL = immediate. | 10 |
| show_after_scroll_pct | integer | null | Show wheel after user scrolls N% of page. NULL = disabled. | 50 |
| show_on_page_urls | array of string | null | Only show on matching page URL patterns (glob). NULL = all pages. | ["/checkout", "/product/*"] |
| show_max_times_per_session | integer | Max times the wheel popup shows per browser session. Default 1. | 1 |
| show_only_new_visitors | boolean | Only show to users with no prior session fingerprint match. Default false. | false |
| hide_on_mobile | boolean | Do not show widget on mobile viewports (< 768px). Default false. | false |
| Field | Type | Description | Default |
| --- | --- | --- | --- |
| allow_spin_once_per | string | null | Frequency limit: "session" | "day" | "week" | "month" | "ever" | null (unlimited) | null (unlimited) |
| fingerprint_check | boolean | Enforce frequency limit using browser fingerprint (soft). Default true. | true |
| email_check | boolean | Enforce frequency limit using submitted lead email (strong). Requires form. | false |
| cooldown_message | string | null | Message shown when user has already spun within the frequency window. | null (use default) |
| RULE:  "allow_spin_once_per": "ever" + "email_check": true = the strongest duplicate prevention. User can only win once across all time if they submit the same email. "session" = soft limit only (new browser session = new eligibility). |
| --- |
| Rule ID | Rule |
| --- | --- |
| S-01 | A wheel must have between 2 and 24 segments (inclusive). Activation blocked otherwise. |
| S-02 | Segment positions must be 0-indexed consecutive integers with no gaps (0, 1, 2...). Gaps cause 422 VALIDATION_ERROR. |
| S-03 | At least 1 segment must have is_no_prize=false with a valid prize_id to activate the wheel. |
| S-04 | A segment may have is_no_prize=true OR a prize_id — not both non-null. Constraint: is_no_prize=true OR prize_id IS NOT NULL. |
| S-05 | Weight must be between 0.0001 and 99999.9999 (NUMERIC 8,4). Weights are relative — only the ratio matters. |
| S-06 | Segments with weight = 0 are excluded from the probability distribution entirely. |
| S-07 | The sum of eligible (non-capped, non-zero-weight) segment weights must be > 0 at spin time. |
| S-08 | win_cap_daily resets at midnight in client.timezone. If timezone is UTC, resets at 00:00 UTC. |
| S-09 | win_cap_total never decrements. Once a cap is hit, the segment is excluded from prize draws permanently for that wheel. |
| S-10 | When a prize segment becomes capped mid-spin (race condition), the Prize Engine falls through to the next eligible segment, then first no_prize segment. |
| S-11 | Segments are replaced atomically (PUT /wheels/{id}/segments). No partial updates. All-or-nothing. |
| S-12 | Deleting a segment that is referenced by a spin_result is NOT allowed via the API — spin history references segment IDs permanently. |
| Step | Rule |
| --- | --- |
| 1 — Load segments | Fetch all segments for the wheel. Exclude: weight=0, wins_today >= win_cap_daily, wins_total >= win_cap_total. |
| 2 — Build distribution | totalWeight = SUM of eligible segment weights. cumulativeWeight[i] = SUM(weight[0..i]) / totalWeight. Produces array of values 0→1. |
| 3 — Generate server seed | serverSeed = crypto.randomBytes(32).toString("hex"). Stored immutably in spin_results.server_seed. |
| 4 — Compute spinRandom | spinRandom = parseInt(serverSeed.substring(0,8), 16) / 0xFFFFFFFF. Result: float in [0, 1). |
| 5 — Determine winner | winningSegment = first segment i where spinRandom < cumulativeWeight[i]. |
| 6 — Cap check (atomic) | Acquire PostgreSQL advisory lock on segment row. Re-check wins_today < win_cap_daily AND wins_total < win_cap_total. |
| 7 — Cap race fallback | If segment now capped: fall through to next eligible segment. If no eligible winning segments: return first no-prize segment. |
| 8 — Record result | INSERT into spin_results (immutable). INCREMENT segments.wins_today and wins_total. INCREMENT clients.spins_used_this_month. |
| Rule ID | Rule |
| --- | --- |
| I-01 | idempotency_key must be a UUID v4 generated client-side (by the widget) per spin attempt. |
| I-02 | If POST /spin/execute is called with an idempotency_key that already exists for the SAME session_id: return existing spin_result (HTTP 200). Do NOT re-spin. |
| I-03 | If POST /spin/execute is called with an idempotency_key that already exists for a DIFFERENT session_id: return HTTP 409 DUPLICATE_IDEMPOTENCY_KEY. Hard reject. |
| I-04 | If POST /spin/execute is called after the session_id already has a spin_result (different idempotency_key): return HTTP 409 ALREADY_SPUN with existing result. |
| I-05 | Redis SETNX lock on session_id must be acquired BEFORE the Prize Engine runs. TTL = 30 seconds. Prevents concurrent duplicate spins. |
| Rule ID | Rule |
| --- | --- |
| G-01 | If wheel.config.guaranteed_win_every_n is set (integer ≥ 1): maintain Redis counter "gw:{wheel_id}" per wheel. |
| G-02 | On each spin: INCR Redis counter. If counter >= guaranteed_win_every_n: force landing on guaranteed_win_segment_id. RESET counter to 0. |
| G-03 | guaranteed_win_segment_id must reference a valid segment on the wheel with is_no_prize=false. |
| G-04 | Guaranteed win overrides normal probability distribution entirely for that spin. |
| G-05 | If guaranteed_win_segment_id segment is capped when guaranteed win triggers: fallback to normal probability distribution for that spin. Do NOT skip the counter reset. |
| G-06 | The guaranteed win counter persists across sessions and page loads (Redis key, not per-session). |
| Rule ID | Rule |
| --- | --- |
| J-01 | A segment may have jackpot_mode=true in its JSONB data within the segments config. |
| J-02 | When jackpot_mode=true, the segment's probability is overridden with jackpot_probability (e.g. 0.001 = 0.1%). |
| J-03 | jackpot_probability is stored in the segment config JSONB — NOT shown to end users. |
| J-04 | The jackpot segment participates in the normal weighted distribution with the overridden probability. |
| J-05 | Jackpot segments may have their own win_cap_total to limit maximum jackpot wins. |
| Rule ID | Rule |
| --- | --- |
| C-01 | coupon_mode is REQUIRED when prize.type = "coupon". NULL coupon_mode with type="coupon" is rejected at prize creation. |
| C-02 | static mode: prize.static_coupon_code is returned directly. No coupon_codes row created. Code is infinite — same code given to every winner. |
| C-03 | unique_pool mode: SELECT FOR UPDATE SKIP LOCKED on coupon_codes WHERE prize_id=? AND status="available" LIMIT 1. Atomic — no two winners can get the same code. |
| C-04 | If unique_pool is exhausted (no available rows): trigger COUPON_INVENTORY_EMPTY alert, return try_again spin result. Spin still counted toward quota. |
| C-05 | auto_generate mode: generateCode(prefix, length) using crypto.randomBytes. INSERT with ON CONFLICT DO NOTHING + retry up to 5 times. 503 if all fail. |
| C-06 | expires_at = NOW() + INTERVAL (prize.coupon_expiry_days days). Computed at issuance time, not at code creation time. |
| C-07 | coupon_codes.status transitions are ONE-DIRECTIONAL: available → issued → redeemed/expired/cancelled. No reversals permitted. |
| C-08 | A coupon_code row is NEVER deleted. Status tracking is the full audit trail. |
| C-09 | Coupon codes marked redeemed cannot be un-redeemed. Errors must be handled by platform support. |
| Action | viewer | editor | admin | owner |
| --- | --- | --- | --- | --- |
| View wheels, analytics, leads | ✓ | ✓ | ✓ | ✓ |
| Create/edit wheels, prizes, segments | ✗ | ✓ | ✓ | ✓ |
| Activate/pause/archive wheels | ✗ | ✗ | ✓ | ✓ |
| Delete prizes | ✗ | ✗ | ✓ | ✓ |
| Upload coupon codes | ✗ | ✓ | ✓ | ✓ |
| Manage integrations | ✗ | ✗ | ✓ | ✓ |
| Invite/remove team members | ✗ | ✗ | ✓ | ✓ |
| Change team member roles | ✗ | ✗ | ✓ | ✓ |
| Export lead data (CSV) | ✗ | ✗ | ✓ | ✓ |
| View/change billing plan | ✗ | ✗ | ✗ | ✓ |
| Delete account / GDPR erasure | ✗ | ✗ | ✓ | ✓ |
| Transfer owner role | ✗ | ✗ | ✗ | Platform support only |
| RULE:  Role checks are performed on every API request. A downgraded role takes effect on the next API call — existing JWT tokens still encode the old role for up to 15 minutes until they expire. |
| --- |
| Rule ID | Rule |
| --- | --- |
| SS-01 | A spin_session is created on every widget load (POST /spin/session). One session per widget page load. |
| SS-02 | Sessions expire after exactly 2 hours (expires_at = NOW() + INTERVAL 2 hours). |
| SS-03 | A session with status=spun cannot spin again. Returns 409 ALREADY_SPUN with existing result. |
| SS-04 | A session with status=expired returns 403 SESSION_EXPIRED. Widget must reload to create a new session. |
| SS-05 | One spin_result per session (UNIQUE constraint on spin_results.session_id). This is the single strongest duplication guard. |
| SS-06 | Session frequency enforcement (allow_spin_once_per) is checked at session creation time, not at spin time. |
| SS-07 | If frequency check uses fingerprint: compare incoming fingerprint against spin_sessions WHERE wheel_id=? AND status=spun AND fingerprint=? within the frequency window. |
| SS-08 | If frequency check uses email: check only AFTER lead form submission. Email check is stronger than fingerprint. |
| SS-09 | The can_spin=false flag is advisory — the Prize Engine still enforces all rules independently (defence in depth). |
| SS-10 | Multiple concurrent sessions from the same fingerprint/IP are allowed. Only spin execution is locked (Redis SETNX per session_id). |
| Rule ID | Rule |
| --- | --- |
| INT-01 | Webhooks are dispatched ASYNCHRONOUSLY via BullMQ after spin_result is saved. They do NOT block the POST /spin/execute response. |
| INT-02 | Only integrations where is_enabled=true are dispatched on spin completion. |
| INT-03 | Webhook payload always includes the HMAC-SHA256 signature. Signature = HMAC-SHA256(raw_body, client_webhook_secret). |
| INT-04 | Retry schedule: attempt 1 (immediate), 2 (+30s), 3 (+5min), 4 (+30min), 5 (+2h). 5 attempts total. |
| INT-05 | HTTP 2xx = success. Any other HTTP status OR timeout = failure. Retry. |
| INT-06 | After 5 failed attempts: set webhook_logs.status=abandoned. Send email alert to client owner. |
| INT-07 | Each attempt creates a new webhook_logs row (attempt_number increments 1→5). |
| INT-08 | Credentials encrypted with AES-256-GCM (AWS KMS). Decrypted only at dispatch time. Never logged. |
| INT-09 | If a wheel has multiple integrations, all are dispatched independently. Failure of one does not affect others. |
| INT-10 | lead data is only included in webhook payload if the wheel has a form (form_config.enabled=true) and the user submitted the form. |
| Rule ID | Rule | Enforcement |
| --- | --- | --- |
| DI-01 | spin_results rows are IMMUTABLE after INSERT. No UPDATE or DELETE permitted. | PostgreSQL trigger trg_spin_results_immutable |
| DI-02 | audit_logs rows are IMMUTABLE after INSERT. No UPDATE or DELETE permitted. | PostgreSQL trigger trg_audit_logs_immutable |
| DI-03 | coupon_codes status is one-directional. No reversal. | Application logic + no reverse transitions in code |
| DI-04 | clients.spins_used_this_month incremented atomically: UPDATE ... SET spins_used_this_month = spins_used_this_month + 1. | Atomic SQL — no race conditions |
| DI-05 | segments.wins_today and wins_total updated atomically within PostgreSQL advisory lock. | Advisory lock in Prize Engine |
| DI-06 | All Prize Engine DB operations use SERIALIZABLE isolation level. | PostgreSQL transaction isolation |
| DI-07 | A prize cannot be deleted if any segment references it (prize_id FK constraint). | HTTP 409 PRIZE_IN_USE with segment list |
| DI-08 | Soft deletes used on: clients, users, wheels, prizes. Hard deletes NEVER used. | deleted_at TIMESTAMPTZ field |
| DI-09 | All major tables use gen_random_uuid() for primary keys. No sequential IDs exposed. | UUID v4 via pgcrypto |
| DI-10 | coupon_codes has no deleted_at — full lifecycle tracked via status enum (available/issued/redeemed/expired/cancelled). | Status enum only |
| Rule ID | Rule |
| --- | --- |
| B-01 | Stripe is the single source of truth for billing. All plan changes originate from Stripe webhooks. |
| B-02 | On subscription upgrade: clients.plan and clients.plan_spin_limit updated immediately on Stripe webhook receipt. |
| B-03 | On subscription downgrade/cancellation: plan reverts to "starter" after the current billing period ends (grace period). |
| B-04 | During grace period: client retains current plan limits. On grace period expiry: limits reduced to starter. |
| B-05 | If a client on starter with 1 active wheel is downgraded from growth (after having 5 wheels): additional active wheels (beyond 1) are auto-paused, not deleted. |
| B-06 | billing_cycle_day (1-28) is set at registration. Can only be changed by platform support. Prevents timezone-related reset timing issues. |
| B-07 | spins_used_this_month resets ONLY on billing_cycle_day. If a client upgrades mid-month, the counter is NOT reset. |
| B-08 | Custom domain SSL provisioning is handled by Cloudflare. SLA: up to 24 hours. No billing action required. |