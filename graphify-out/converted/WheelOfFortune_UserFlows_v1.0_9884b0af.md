<!-- converted from WheelOfFortune_UserFlows_v1.0.docx -->



Overview
This document defines all user flows for the Wheel of Fortune Platform. Each flow is presented as a step-by-step actor/action table with decision points, error paths, and API endpoint references. Flows are grouped by actor and functional area.

UF-01 — Client Registration & Onboarding

▼
▼
▼
▼
▼
▼
▼
▼
▼


UF-02 — Login & Session Management

▼
▼
▼
▼
▼
▼
▼
▼


UF-03 — Create & Configure a Wheel

▼
▼
▼
▼
▼
▼
▼
▼
▼
▼


UF-04 — Activate a Wheel

▼
▼
▼
▼
▼


UF-05 — Embed Widget on Website

▼
▼
▼
▼
▼
▼



UF-06 — End-User Widget Spin Flow (No Lead Form)

▼
▼
▼
▼
▼
▼
▼
▼
▼
▼
▼
▼
▼


UF-07 — End-User Widget Spin Flow (With Lead Form)

▼
▼
▼
▼
▼
▼
▼
▼
▼
▼
▼


UF-08 — Prize Redemption Flow

▼
▼
▼
▼
▼
▼



UF-09 — Coupon Pool Management

▼
▼
▼
▼
▼
▼

UF-10 — Integration Setup

▼
▼
▼
▼
▼
▼
▼


UF-11 — Analytics & Lead Export
▼
▼
▼
▼
▼
▼
▼


UF-12 — Team Member Invite & Onboarding
▼
▼
▼
▼
▼

UF-13 — Plan Upgrade Flow
▼
▼
▼
▼
▼
▼
▼

UF-14 — GDPR Data Erasure Request

▼
▼
▼
▼
▼
▼
▼
▼


UF-15 — Wheel Pause & Archive Flow
▼
▼
▼
▼
▼
▼


— END OF USER FLOW DIAGRAMS —
| WHEEL OF FORTUNE PLATFORM
User Flow Diagrams — Document #5 |
| --- |
| Document Type | User Flow Diagrams |
| --- | --- |
| Version | v1.0 |
| Date | March 2026 |
| Status | APPROVED FOR DEVELOPMENT |
| Related Documents | TRD v1.1 | SOP v1.0 | API Spec v1.1 |
| Audience | Developers, UI/UX, QA, Product |
| Flow # | Flow Name | Primary Actor | Key API Endpoints |
| --- | --- | --- | --- |
| UF-01 | Client Registration & Onboarding | New Client | POST /auth/register, GET /auth/verify-email |
| UF-02 | Login & Session Management | Dashboard User | POST /auth/login, POST /auth/refresh, POST /auth/logout |
| UF-03 | Create & Configure a Wheel | Editor/Admin | POST /wheels, PUT /wheels/{id}/segments, PATCH /wheels/{id} |
| UF-04 | Activate a Wheel | Admin/Owner | PATCH /wheels/{id}/status |
| UF-05 | Embed Widget on Website | Client Developer | — (copy embed code from dashboard) |
| UF-06 | End-User Widget Spin Flow (No Form) | End User (Widget) | POST /spin/session, POST /spin/execute |
| UF-07 | End-User Widget Spin Flow (With Lead Form) | End User (Widget) | POST /spin/session, POST /spin/execute (with lead) |
| UF-08 | Prize Redemption Flow | End User / Client | PATCH /coupons/{id}/redeem |
| UF-09 | Coupon Pool Management | Editor/Admin | POST /prizes/{id}/coupons, GET /prizes/{id}/coupons |
| UF-10 | Integration Setup | Admin/Owner | POST /wheels/{id}/integrations, POST /wheels/{id}/integrations/{id}/test |
| UF-11 | View Analytics & Export Leads | Admin/Owner/Viewer | GET /analytics/summary, GET /analytics/leads/export |
| UF-12 | Team Member Invite & Onboarding | Owner/Admin | POST /account/team/invite |
| UF-13 | Plan Upgrade Flow | Owner | POST /account/billing/upgrade |
| UF-14 | GDPR Data Erasure Request | Owner/Admin | DELETE /account/users/{id}/data |
| UF-15 | Wheel Pause & Archive Flow | Admin/Owner | PATCH /wheels/{id}/status |
| TRIGGER:  New business visits spinplatform.io and clicks "Start Free Trial". |
| --- |
| CLIENT | Navigates to /register and fills form: company_name, email, password, full_name | All fields required |
| --- | --- | --- |
| CLIENT | Submits registration form | POST /auth/register |
| --- | --- | --- |
| API | Validates: email format + MX check, password strength (min 8, 1 upper, 1 number) | HTTP 422 on failure |
| --- | --- | --- |
| API | Checks for duplicate email | HTTP 409 EMAIL_ALREADY_EXISTS if found |
| --- | --- | --- |
| SYSTEM | Creates client record (plan=starter, spin_limit=500) + owner user record | gen_random_uuid() for IDs |
| --- | --- | --- |
| SYSTEM | Generates JWT access token (15min) + refresh token (30 days) | Returns HTTP 201 |
| --- | --- | --- |
| SYSTEM | Sends verification email with one-time token (24h expiry) | AWS SES / Resend |
| --- | --- | --- |
| CLIENT | Receives JWT, lands on dashboard in limited access mode | email_verified = false |
| --- | --- | --- |
| CLIENT | Clicks verification link in email | GET /auth/verify-email?token=... |
| --- | --- | --- |
| SYSTEM | Sets email_verified = true. Full dashboard access granted. | Audit log: account_settings_updated |
| --- | --- | --- |
| Condition | Result |
| --- | --- |
| Email already registered | HTTP 409. Show "Email already in use. Login instead?" message. |
| Password too weak | HTTP 422. Show inline field error with requirements. |
| Rate limit hit (3/hour/IP) | HTTP 429. Show "Too many attempts. Try again later." |
| Verification email not received | Resend option available in dashboard. Token regenerated. |
| Verification token expired (24h) | Show "Link expired" page with resend button. |
| TRIGGER:  Returning user visits dashboard login page. |
| --- |
| CLIENT | Enters email and password on /login page | POST /auth/login |
| --- | --- | --- |
| API | Validates credentials against bcrypt hash (cost 12) | Increments failed attempt counter in Redis on failure |
| --- | --- | --- |
| API | Checks: email_verified = true AND client.is_active = true | 403 if either false |
| --- | --- | --- |
| SYSTEM | Returns access_token (JWT 15min) + refresh_token (opaque 30d) + user object | HTTP 200 |
| --- | --- | --- |
| CLIENT | Stores access_token in memory, refresh_token in HttpOnly cookie | Never localStorage |
| --- | --- | --- |
| CLIENT | Makes API calls with Authorization: Bearer {access_token} | All dashboard endpoints |
| --- | --- | --- |
| SYSTEM | When access_token nears expiry, auto-refresh | POST /auth/refresh with refresh_token |
| --- | --- | --- |
| SYSTEM | Issues new access_token + rotated refresh_token. Old refresh_token invalidated. | HTTP 200 |
| --- | --- | --- |
| CLIENT | On logout: POST /auth/logout with refresh_token | Refresh token revoked in Redis |
| --- | --- | --- |
| Condition | Result |
| --- | --- |
| Wrong password (< 5 attempts) | HTTP 401 INVALID_CREDENTIALS |
| 5 failed attempts in 10 min | HTTP 429. 30-minute lockout. Retry-After header set. |
| Email not verified | HTTP 403 EMAIL_NOT_VERIFIED. Show resend verification link. |
| Account suspended | HTTP 403 ACCOUNT_SUSPENDED. Show contact support message. |
| Refresh token expired/invalid | HTTP 401. Force logout. Redirect to login. |
| TRIGGER:  Editor/Admin clicks "Create New Wheel" in the dashboard. |
| --- |
| EDITOR | Clicks "New Wheel". Enters wheel name. | POST /wheels → returns wheel in draft status |
| --- | --- | --- |
| SYSTEM | Creates wheel with embed_token = crypto.randomBytes(32).hex() | Status = draft |
| --- | --- | --- |
| EDITOR | Opens Wheel Builder. Configures behaviour (spin_duration_ms, animation_speed, confetti, sound, pointer_position) | PATCH /wheels/{id} |
| --- | --- | --- |
| EDITOR | Configures branding (logo, colors, font, button_text, border) | PATCH /wheels/{id} with branding object |
| --- | --- | --- |
| EDITOR | Navigates to Segments tab. Adds segments (min 2, max 24). | PUT /wheels/{id}/segments — atomic replace |
| --- | --- | --- |
| EDITOR | For each segment: sets label, colors, weight, assigns prize or marks is_no_prize=true | Prizes must exist before assignment |
| --- | --- | --- |
| EDITOR | (Optional) Configures lead capture form: fields, GDPR consent, privacy URL | PATCH /wheels/{id} with form_config |
| --- | --- | --- |
| EDITOR | (Optional) Sets scheduling: active_from, active_until, total_spin_cap | PATCH /wheels/{id} |
| --- | --- | --- |
| EDITOR | (Optional) Sets trigger_rules and frequency_rules | PATCH /wheels/{id} |
| --- | --- | --- |
| SYSTEM | Validates all segment positions (0-indexed, consecutive), weight sum > 0, colour formats | HTTP 422 on invalid |
| --- | --- | --- |
| EDITOR | Saves. Wheel remains in draft status until activated by Admin. | Ready for UF-04 |
| --- | --- | --- |
| Condition | Result |
| --- | --- |
| Plan wheel limit reached (e.g. starter=1) | HTTP 403 PLAN_WHEEL_LIMIT. Show upgrade prompt. |
| Segment position not consecutive | HTTP 422. Show position error. |
| prize_id references prize from different client | HTTP 422 VALIDATION_ERROR. |
| Weight sum = 0 after capping | HTTP 422. At least one segment must have weight > 0. |
| Custom font URL invalid/unreachable | HTTP 422. Font must be accessible S3 URL. |
| TRIGGER:  Admin/Owner reviews a draft wheel and clicks "Activate". |
| --- |
| ADMIN | Reviews wheel in dashboard. Confirms segments, prizes, branding look correct. | Pre-activation checklist |
| --- | --- | --- |
| ADMIN | Clicks "Activate Wheel" | PATCH /wheels/{id}/status {status: "active"} |
| --- | --- | --- |
| API | Validates: segment count ≥ 2 | Fail → HTTP 422 WHEEL_NOT_READY |
| --- | --- | --- |
| API | Validates: at least 1 non-no_prize segment with valid prize_id | Fail → HTTP 422 |
| --- | --- | --- |
| API | Validates: embed_token is present (always true — generated on creation) | Fail → HTTP 422 |
| --- | --- | --- |
| SYSTEM | Sets status = active. Widget immediately begins accepting sessions. | HTTP 200. Audit log: wheel_status_changed |
| --- | --- | --- |
| Transition | Allowed | Required Role | Validation |
| --- | --- | --- | --- |
| draft → active | ✓ | admin/owner | ≥2 segments, ≥1 prize segment |
| active → paused | ✓ | admin/owner | None |
| active → archived | ✓ | admin/owner | None — irreversible |
| paused → active | ✓ | admin/owner | Same as draft→active |
| paused → archived | ✓ | admin/owner | None — irreversible |
| archived → any | ✗ | — | Cannot reactivate archived wheels |
| any → draft | ✗ | — | Draft is initial state only |
| TRIGGER:  Client developer needs to add the wheel to their website. |
| --- |
| DEVELOPER | Opens dashboard → Wheel → "Embed" tab. | Embed code is pre-generated |
| --- | --- | --- |
| SYSTEM | Displays embed code with wheel-specific embed_token | embed_token is NOT a secret — safe in HTML source |
| --- | --- | --- |
| DEVELOPER | Copies two-line snippet | <div data-token="..."> + <script> tag |
| --- | --- | --- |
| DEVELOPER | Pastes snippet before closing </body> tag on target page | Any HTML page or CMS |
| --- | --- | --- |
| SYSTEM | Widget JS loads from CDN: https://cdn.spinplatform.io/widget/v1/wheel.min.js | Cloudflare CDN, max-age=3600 |
| --- | --- | --- |
| WIDGET | Reads data-token attribute from div. Initialises React app inside Shadow DOM. | CSS isolation from host page |
| --- | --- | --- |
| WIDGET | Calls POST /spin/session to check eligibility and load config. | See UF-06/07 for spin flows |
| --- | --- | --- |
| IFRAME MODE:  For stricter isolation, embed as <iframe src="https://spin.spinplatform.io/w/{embed_token}">. Use postMessage API for cross-frame communication. Events: WOF_LOADED, WOF_SPIN_COMPLETE, WOF_LEAD_CAPTURED. |
| --- |
| TRIGGER:  End user visits a page where the widget is embedded. Wheel has form_config.enabled = false. |
| --- |
| WIDGET | Page loads. Widget script initialises. Computes browser fingerprint. | SHA-256(UA+screen+TZ+lang+colorDepth+platform) |
| --- | --- | --- |
| WIDGET | Creates spin session | POST /spin/session {embed_token, fingerprint, page_url, referrer_url} |
| --- | --- | --- |
| API | Validates embed_token. Loads wheel config, segments, branding. | Returns can_spin flag |
| --- | --- | --- |
| SYSTEM | Checks eligibility: wheel active, within date range, total_spin_cap not hit, monthly quota not hit | can_spin = true/false |
| --- | --- | --- |
| WIDGET | If can_spin = false: displays reason message. Spin button disabled. | ALREADY_SPUN_TODAY / SPIN_CAP_REACHED / etc. |
| --- | --- | --- |
| WIDGET | If can_spin = true: renders wheel using HTML5 Canvas. Shows "SPIN NOW!" button. | 60fps Canvas animation |
| --- | --- | --- |
| END USER | Clicks "SPIN NOW!" button | User interaction |
| --- | --- | --- |
| WIDGET | Generates idempotency_key = UUID v4 (client-side). | Prevents duplicate spins on retry |
| --- | --- | --- |
| WIDGET | Starts spin animation immediately (visual only). Wheel rotates 3-7 full turns. | easeOutCubic easing |
| --- | --- | --- |
| WIDGET | Animation completes. Calls execute spin. | POST /spin/execute {session_id, idempotency_key} |
| --- | --- | --- |
| API | Prize Engine runs in Worker Thread. Computes winning segment using server seed. | Must complete < 200ms |
| --- | --- | --- |
| API | Assigns prize (coupon issued if applicable). Records spin_result (immutable). | HTTP 200 with result |
| --- | --- | --- |
| WIDGET | Displays result overlay: prize display_title, coupon_code (if any), expiry. | Confetti if enabled |
| --- | --- | --- |
| SYSTEM | Dispatches integration webhooks asynchronously via BullMQ. | Does NOT block response |
| --- | --- | --- |
| Condition | Widget Behaviour | HTTP Code |
| --- | --- | --- |
| can_spin = false (ALREADY_SPUN_TODAY) | Show "You have already spun today. Come back tomorrow!" | 200 (can_spin=false) |
| can_spin = false (SPIN_CAP_REACHED) | Show "This promotion has ended." | 200 (can_spin=false) |
| can_spin = false (WHEEL_INACTIVE) | Show "This promotion is not currently active." | 200 (can_spin=false) |
| can_spin = false (MONTHLY_LIMIT_REACHED) | Show "This promotion is temporarily unavailable." (client upgrade prompt in dashboard) | 200 (can_spin=false) |
| POST /spin/execute returns 409 ALREADY_SPUN | Show previously won prize (idempotent response) | 409 |
| POST /spin/execute returns 503 | Show error with "Try again" retry button. Do NOT re-spin animation. | 503 |
| No internet connection | Loading spinner 5s, then graceful error. Host page unaffected. | — |
| TRIGGER:  End user visits embedded wheel page. Wheel has form_config.enabled = true. |
| --- |
| WIDGET | Loads and creates spin session. can_spin check same as UF-06. | POST /spin/session |
| --- | --- | --- |
| WIDGET | Renders lead capture form BEFORE showing spin button. | Fields defined in form_config.fields |
| --- | --- | --- |
| END USER | Fills in form fields (email required by default, name/phone optional, custom fields). | Client-configurable |
| --- | --- | --- |
| END USER | If gdpr_enabled = true: must check GDPR consent checkbox to proceed. | Consent timestamp recorded |
| --- | --- | --- |
| END USER | Clicks "Submit & Spin" (or configured button text). | Form submitted |
| --- | --- | --- |
| WIDGET | Validates form fields client-side (email format, required fields). | Before API call |
| --- | --- | --- |
| WIDGET | If validation passes: starts spin animation immediately. | Optimistic UX |
| --- | --- | --- |
| WIDGET | Calls execute spin with lead data | POST /spin/execute {session_id, idempotency_key, lead: {email, name, phone, custom_fields, gdpr_consent}} |
| --- | --- | --- |
| API | Validates lead data server-side. Updates spin_session with lead fields. | HTTP 422 on invalid |
| --- | --- | --- |
| API | Sets session.status = form_submitted, then spun after prize awarded. | Atomic |
| --- | --- | --- |
| WIDGET | Displays prize result overlay. | Same as UF-06 |
| --- | --- | --- |
| SYSTEM | Integration webhooks include lead data in payload. | Mailchimp/Klaviyo/CRM subscribed |
| --- | --- | --- |
| Condition | Result |
| --- | --- |
| Required field missing on submit | Client-side validation error. Form re-shown with field highlight. |
| Email format invalid | Client-side + server-side validation. HTTP 422 VALIDATION_ERROR. |
| GDPR consent not checked (if required) | Submit button disabled until checked. |
| Server rejects lead data (422) | Animation stopped. Form re-shown with server error message. |
| Lead email already in system | Not blocked — same email can spin on different wheels/sessions. |
| TRIGGER:  End user presents a coupon code at point-of-sale or online checkout. |
| --- |
| END USER | Receives coupon_code in widget result overlay and/or email. | From spin result |
| --- | --- | --- |
| END USER | Uses coupon code at checkout (online or in-store). | External to platform |
| --- | --- | --- |
| CLIENT STAFF | Looks up coupon code in dashboard → Coupons tab. | GET /prizes/{id}/coupons?code=... |
| --- | --- | --- |
| CLIENT STAFF | Verifies code status = issued and expires_at has not passed. | Visual check in dashboard |
| --- | --- | --- |
| CLIENT STAFF | Clicks "Mark as Redeemed" | PATCH /coupons/{id}/redeem |
| --- | --- | --- |
| SYSTEM | Sets coupon_codes.status = redeemed, redeemed_at = NOW(). | Audit log: coupon_redeemed |
| --- | --- | --- |
| CLIENT STAFF | Provides prize/discount to end user. | Offline fulfilment |
| --- | --- | --- |
| NOTE:  Redemption is irreversible. Once a code is marked redeemed, it cannot be reset. If a code was redeemed in error, contact platform support. |
| --- |
| TRIGGER:  Client needs to upload unique coupon codes for a prize with coupon_mode = unique_pool. |
| --- |
| ADMIN | Navigates to Prizes → selects prize with coupon_mode = unique_pool. | Must create prize first |
| --- | --- | --- |
| ADMIN | Clicks "Upload Codes". Selects CSV file (one code per line). | POST /prizes/{id}/coupons |
| --- | --- | --- |
| API | Validates: no duplicate codes within same prize_id (UNIQUE constraint). | Rejects entire batch if duplicates found |
| --- | --- | --- |
| SYSTEM | Inserts all codes with status = available. Returns count of uploaded codes. | HTTP 201 with count |
| --- | --- | --- |
| ADMIN | Monitors inventory via Coupons tab. | GET /prizes/{id}/coupons?status=available |
| --- | --- | --- |
| SYSTEM | Sends low-inventory alert email when available < 50 | Automated alert |
| --- | --- | --- |
| ADMIN | Uploads additional codes before inventory exhausted. | Same flow repeated |
| --- | --- | --- |
| TRIGGER:  Admin wants to sync spin leads with Mailchimp/Klaviyo/HubSpot/webhook. |
| --- |
| ADMIN | Opens Wheel → Integrations tab. Clicks "Add Integration". | POST /wheels/{id}/integrations |
| --- | --- | --- |
| ADMIN | Selects integration type (mailchimp/klaviyo/hubspot/salesforce/zapier/webhook/google_sheets). | type field |
| --- | --- | --- |
| ADMIN | Enters credentials (API key, list ID, target URL, etc.). | Encrypted AES-256-GCM at rest |
| --- | --- | --- |
| ADMIN | Configures non-secret settings (field mappings, tags, list ID). | config JSONB |
| --- | --- | --- |
| ADMIN | Clicks "Test Connection" | POST /wheels/{id}/integrations/{id}/test |
| --- | --- | --- |
| SYSTEM | Sends test request to third-party service. Returns success/failure. | HTTP 200 or error details |
| --- | --- | --- |
| ADMIN | If test passes: integration is active (is_enabled = true). | Webhooks fire on next spin |
| --- | --- | --- |
| SYSTEM | On each spin: BullMQ dispatches webhook asynchronously using retry policy. | 5 attempts max |
| --- | --- | --- |
| USER | Opens Analytics section in dashboard. | Viewer role can access; export requires admin/owner |
| --- | --- | --- |
| USER | Selects wheel and date range. Views summary stats. | GET /analytics/summary |
| --- | --- | --- |
| SYSTEM | Returns: total spins, unique leads, prize distribution, conversion rate. | ClickHouse query |
| --- | --- | --- |
| USER | Views time-series chart (daily/hourly spin volume). | GET /analytics/timeseries |
| --- | --- | --- |
| ADMIN | Clicks "Export Leads" to download CSV. | GET /analytics/leads/export?format=csv |
| --- | --- | --- |
| SYSTEM | Validates rate limit: 1 export per 5 minutes. | Returns 429 if too frequent |
| --- | --- | --- |
| SYSTEM | Generates CSV with columns: email, name, phone, prize_type, coupon_code, timestamp. | Streamed download |
| --- | --- | --- |
| ADMIN | Downloads CSV. Imports into CRM or email tool. | External action |
| --- | --- | --- |
| OWNER/ADMIN | Opens Settings → Team. Clicks "Invite Member". | POST /account/team/invite |
| --- | --- | --- |
| OWNER/ADMIN | Enters invitee email and selects role (admin/editor/viewer). | Role assigned at invite time |
| --- | --- | --- |
| SYSTEM | Checks plan team member limit. Sends invite email with one-time token (24h). | HTTP 403 if limit reached |
| --- | --- | --- |
| INVITEE | Clicks invite link in email. Redirected to set-password page. | Token validated |
| --- | --- | --- |
| INVITEE | Sets password and completes profile. | user record created, email_verified = true |
| --- | --- | --- |
| SYSTEM | Invitee can now log in with assigned role. | Audit log: user_invited |
| --- | --- | --- |
| OWNER | Sees upgrade prompt (spin limit / wheel limit reached) OR opens Settings → Billing. | Dashboard trigger |
| --- | --- | --- |
| OWNER | Clicks "Upgrade Plan". Views plan comparison table. | GET /account/billing/plans |
| --- | --- | --- |
| OWNER | Selects new plan and clicks "Upgrade". | POST /account/billing/upgrade |
| --- | --- | --- |
| SYSTEM | Redirects to Stripe Billing Portal for payment. | Stripe hosted page |
| --- | --- | --- |
| OWNER | Completes payment on Stripe. | Stripe handles PCI compliance |
| --- | --- | --- |
| STRIPE | Sends subscription.updated webhook to platform. | Stripe webhook |
| --- | --- | --- |
| SYSTEM | Updates clients.plan and clients.plan_spin_limit immediately. | Audit log: plan_changed |
| --- | --- | --- |
| OWNER | Redirected back to dashboard. New limits take effect immediately. | can_spin re-evaluated |
| --- | --- | --- |
| SLA:  Erasure must be executed within 72 hours of a verified GDPR request. |
| --- |
| END USER | Submits GDPR erasure request (via email to client, or in-platform if enabled). | External trigger |
| --- | --- | --- |
| ADMIN/OWNER | Receives and verifies request. Confirms identity of requester. | Manual verification step |
| --- | --- | --- |
| ADMIN/OWNER | Opens Settings → Data & Privacy. Searches by lead email. | — |
| --- | --- | --- |
| ADMIN/OWNER | Clicks "Delete User Data" | DELETE /account/users/{id}/data |
| --- | --- | --- |
| SYSTEM | Calls gdpr_anonymise_session_data(email) PostgreSQL function. | Atomic operation |
| --- | --- | --- |
| SYSTEM | Nulls: lead_email, lead_name, lead_phone, lead_custom_fields, user_agent. Sets ip_address = 0.0.0.0, fingerprint = ANONYMISED, gdpr_consent = false. | PII cleared |
| --- | --- | --- |
| SYSTEM | spin_results rows preserved (no PII, audit compliance). | Immutable — not deleted |
| --- | --- | --- |
| SYSTEM | Returns count of rows anonymised. Creates audit_logs entry: user_data_deleted. | Response to admin |
| --- | --- | --- |
| ADMIN/OWNER | Confirms erasure to end user within 72h SLA. | Compliance record kept |
| --- | --- | --- |
| ADMIN | Opens Wheels dashboard. Locates active wheel. | — |
| --- | --- | --- |
| ADMIN | Clicks "Pause" to temporarily stop the wheel. | PATCH /wheels/{id}/status {status:"paused"} |
| --- | --- | --- |
| SYSTEM | Widget immediately stops creating new sessions. Open sessions may complete their spin. | HTTP 200 |
| --- | --- | --- |
| ADMIN | To resume: clicks "Activate". | PATCH /wheels/{id}/status {status:"active"} |
| --- | --- | --- |
| ADMIN | To permanently retire: clicks "Archive". | PATCH /wheels/{id}/status {status:"archived"} |
| --- | --- | --- |
| SYSTEM | Sets deleted_at on wheel (soft archive). Spin history fully preserved. | Cannot be reactivated |
| --- | --- | --- |
| SYSTEM | Creates audit_log entry: wheel_status_changed | Immutable record |
| --- | --- | --- |
| WARNING:  Archiving is irreversible. The wheel cannot be reactivated after archiving. All historical spin data and analytics remain accessible. |
| --- |