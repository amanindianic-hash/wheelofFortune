<!-- converted from WheelOfFortune_SOP_v1.0.docx -->



Table of Contents
1.  Purpose & Scope
2.  System Overview
3.  Roles & Permissions
4.  Account & User Management
5.  Wheel Lifecycle Management
6.  Segment & Prize Configuration
7.  Coupon Code Management
8.  Widget Embedding Procedures
9.  Integration & Webhook Configuration
10.  Analytics & Reporting
11.  Security Procedures
12.  GDPR & Data Privacy Compliance
13.  Billing & Plan Management
14.  Monitoring, Alerting & Incident Response
15.  DevOps & Environment Operations
16.  Scheduled Jobs & Maintenance
17.  Audit & Compliance Logging
18.  Edge Cases & Escalation Matrix
19.  Document Revision History

1. Purpose & Scope
This Standard Operating Procedure (SOP) defines the operational processes, rules, responsibilities, and guidelines for running the Wheel of Fortune Customization Platform. It covers all roles — from client onboarding through to daily operations, security compliance, incident response, and data governance.
This document is to be read in conjunction with:
- WheelOfFortune_TRD_v1.1_fixed.docx — Technical Requirements Document
- WheelOfFortune_Schema_v1.1_fixed.sql — PostgreSQL Database Schema
- WheelOfFortune_API_Spec_v1.1_fixed.yaml — OpenAPI 3.0.3 API Specification


2. System Overview
The Wheel of Fortune Platform is a multi-tenant SaaS product that allows businesses (clients) to create customizable spin-to-win wheel campaigns and embed them on their websites. The platform consists of four primary components:
3. Roles & Permissions
Every dashboard user is assigned one of four roles. Roles are scoped per client account. A user belongs to exactly one client.


4. Account & User Management
4.1 Client Registration

4.2 Login & Token Management

- Rate limit: 5 failed login attempts per IP per 10 minutes → 30-minute lockout.
- Suspended accounts (is_active = false) receive HTTP 403 ACCOUNT_SUSPENDED on login.
- Unverified emails receive HTTP 403 EMAIL_NOT_VERIFIED on login.
4.3 Team Member Invitation
- Only owner or admin roles may invite new team members.
- Invitation is sent via email with a one-time token (24-hour expiry).
- Invitee sets their password on first login.
- Role is assigned at invite time and can be changed later by admin/owner.
- Maximum team members per plan: Starter = 2, Growth = 5, Pro = 15, Enterprise = unlimited.
4.4 User Deactivation
- Deactivated users have deleted_at timestamp set (soft delete).
- Active sessions of deactivated users are invalidated within 15 minutes (next token check).
- Audit log entry created: action = user_removed.
5. Wheel Lifecycle Management
5.1 Plan Limits — Active Wheels
5.2 Wheel Status Lifecycle
A wheel transitions through the following statuses. Transitions are enforced by the API. Archived wheels cannot be reactivated.
5.3 Wheel Configuration Reference
5.3.1 Behaviour Config (wheels.config JSONB)
5.3.2 Branding Config (wheels.branding JSONB)
6. Segment & Prize Configuration
6.1 Segment Rules
6.2 Prize Types & Requirements

6.3 Coupon Mode Reference
6.4 Prize Deletion Rules
- A prize CANNOT be deleted if any active segment references it (HTTP 409 PRIZE_IN_USE).
- The error response includes a list of segment IDs that reference the prize.
- Procedure: reassign or remove those segments first, then delete the prize.
7. Coupon Code Management
7.1 Uploading Unique Coupon Pools
- Upload via POST /prizes/{prize_id}/coupons with a CSV or JSON array of code strings.
- Duplicate codes within the same prize are rejected (UNIQUE constraint on prize_id + code).
- Uploaded codes start with status = available.
- Monitor coupon inventory via GET /prizes/{id}/coupons?status=available.
7.2 Coupon Status Lifecycle

7.3 Low Inventory Alert
- System sends email alert to client when available codes < 50 for any unique_pool prize.
- Dashboard shows warning banner when inventory < 20% of original pool size.
- SLA for client response: upload new codes within 24 hours to prevent fallback to try_again.
8. Widget Embedding Procedures
8.1 Standard Embed Code
Copy the following snippet from the dashboard "Embed" tab and paste before the closing </body> tag on the host page:

- YOUR_EMBED_TOKEN is NOT a secret. It is safe to include in page source.
- The widget renders inside a Shadow DOM — host page CSS does not bleed in.
- Widget bundle target: < 80KB gzipped (JS + CSS combined).
- CDN cache: versioned assets max-age=31536000, immutable. Latest alias max-age=3600.
8.2 iFrame / postMessage API
When embedded as an iFrame, the widget communicates via window.postMessage:
8.3 Widget Spin Flow (Operational Summary)

9. Integration & Webhook Configuration
9.1 Supported Integration Types

9.2 Webhook Payload Schema
All webhook dispatches use a standard envelope regardless of integration type:
9.3 Webhook Retry Policy
9.4 Webhook Signature Verification (Client Responsibility)
- Signature = HMAC-SHA256(raw request body bytes, client_webhook_secret).
- Delivered in header: X-Spin-Signature: sha256={hex_string}.
- Clients MUST verify the signature before processing the webhook payload.
- Reject any webhook where signature verification fails.
10. Analytics & Reporting
10.1 Available Analytics Endpoints
10.2 ClickHouse vs PostgreSQL Query Routing
- High-volume analytics (timeseries, aggregate counts) are served from ClickHouse.
- Lead detail lookups, coupon status, and per-spin data are served from PostgreSQL.
- API layer transparently routes to the correct store — clients see a unified interface.
11. Security Procedures
11.1 Authentication Token Specifications
11.2 Rate Limiting Rules

- Rate limit counters stored in Redis. Response headers always include: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset.
11.3 Input Validation Rules
11.4 Credential Encryption
- Algorithm: AES-256-GCM.
- Key management: AWS KMS. IV is generated fresh per encryption operation.
- Encrypted credentials are NEVER returned in any API response.
- Key rotation: coordinate with AWS KMS rotation policy. Re-encrypt stored credentials on rotation.
11.5 Browser Fingerprinting (Widget Anti-Abuse)
The widget computes a soft fingerprint client-side:
- fingerprint = SHA-256(userAgent + screenResolution + timezone + language + colorDepth + platform)
- Sent with POST /spin/session. Server stores the hash only — raw values discarded.
- This is a soft deterrent only. It is not cryptographically strong. Do not rely on it as a sole anti-abuse mechanism.
- IP address is the primary anti-abuse signal. IP is hashed for privacy after 24 hours.
12. GDPR & Data Privacy Compliance
12.1 Personal Data Collected
12.2 GDPR Erasure Procedure
- Triggered via: DELETE /account/users/{id}/data (admin/owner only) OR internal GDPR request workflow.
- Executes the gdpr_anonymise_session_data(email) PostgreSQL function.
- Anonymisation action: lead_email, lead_name, lead_phone, lead_custom_fields, fingerprint, user_agent set to NULL/anonymised. ip_address set to 0.0.0.0. gdpr_consent reset to FALSE.
- spin_results rows are IMMUTABLE and are NOT deleted. They contain no PII — only UUIDs and timestamps.
- Return value: count of session rows anonymised. Log in audit_logs with action = user_data_deleted.
- SLA: Erasure must be executed within 72 hours of a verified GDPR request.

12.3 Consent Management
- If wheel.form_config.gdpr_enabled = true, a consent checkbox is shown before spin.
- Consent timestamp (gdpr_consent_at) is recorded in spin_sessions.
- Users who do not check the consent box cannot proceed with form submission.
- GDPR text and privacy policy URL are configurable per wheel.
13. Billing & Plan Management
13.1 Monthly Spin Quota Reset
- clients.spins_used_this_month resets to 0 on each client's billing_cycle_day.
- Reset is performed by the pg_cron job "reset-monthly-spins" at 00:05 UTC daily.
- Only clients whose billing_cycle_day matches today's date are reset.
- billing_cycle_day is set at account creation and can only be changed by platform support.
13.2 Spin Limit Enforcement
13.3 Stripe Integration Procedures
- Stripe customer is created on client registration (stripe_customer_id stored in clients table).
- Subscription upgrades/downgrades handled via Stripe Billing portal.
- Stripe webhook events update the clients.plan field in real-time.
- STRIPE_WEBHOOK_SECRET must be configured to verify Stripe webhook signatures.
- On subscription cancellation: plan reverts to starter after grace period. Active wheels exceeding starter limit are paused automatically.
14. Monitoring, Alerting & Incident Response
14.1 Alert Thresholds
14.2 Incident Response Procedure
15. DevOps & Environment Operations
15.1 Required Environment Variables

15.2 Production Infrastructure
15.3 Database Migration Strategy
- Tool: db-migrate or Flyway for versioned SQL migrations.
- Naming: V{timestamp}__{description}.sql (e.g. V20260315120000__add_ab_test_flag.sql).
- NEVER modify an existing migration file after it has been applied to any environment.
- Every forward migration must have a corresponding rollback migration.
- Run migrations BEFORE deploying new application code (Blue-Green deployment pattern).
- The baseline schema is WheelOfFortune_Schema_v1.1_fixed.sql. All migrations are additive.
16. Scheduled Jobs & Maintenance

17. Audit & Compliance Logging
17.1 Audit Log Coverage
The audit_logs table records all significant admin and system actions. Rows are immutable (UPDATE/DELETE trigger raises exception).
17.2 Audit Log Retention
- Retention period: 12 months from creation_at.
- After 12 months: archive to cold storage (S3 Glacier) before deletion.
- Sensitive fields excluded from changes JSONB: password hashes, raw credentials.
- System-generated actions (cron jobs, billing events) have user_id = NULL.
18. Edge Cases & Escalation Matrix
19. Document Revision History

— END OF STANDARD OPERATING PROCEDURE —
| WHEEL OF FORTUNE PLATFORM
Standard Operating Procedure (SOP) |
| --- |
| Document Type | Standard Operating Procedure |
| --- | --- |
| Version | v1.0 |
| Date | March 2026 |
| Status | APPROVED FOR OPERATIONS |
| Audience | Operations, Support, DevOps, Compliance, Engineering |
| Owner | Engineering Team |
| Related Documents | TRD v1.1_fixed | Schema v1.1_fixed.sql | API Spec v1.1_fixed.yaml |
| Confidentiality | Confidential — Internal Use Only |
| SCOPE:  This SOP applies to all environments: development, staging, and production. Where procedures differ per environment, this is explicitly noted. |
| --- |
| Component | Technology | Responsibility |
| --- | --- | --- |
| Client Dashboard (SPA) | Next.js 14 + TailwindCSS + TypeScript | Wheel builder, prize management, analytics, team settings |
| Embeddable Widget | React 18 + Vite + CSS Modules | End-user spin experience, lead capture form (<80KB gzipped) |
| Backend API | Node.js 20 + Express 5 + TypeScript | Auth, business logic, prize engine, webhooks |
| Prize Engine (Worker) | Node.js Worker Thread + BullMQ | Isolated probability calculation, idempotency enforcement |
| Primary Database | PostgreSQL 16 | All persistent relational data |
| Cache / Sessions | Redis 7 | JWT refresh tokens, rate-limit counters, spin locks |
| Job Queue | BullMQ (Redis-backed) | Async webhook dispatch, email, coupon generation |
| File Storage | AWS S3 / Cloudflare R2 | Logos, fonts, audio, widget assets |
| CDN | Cloudflare | Widget JS delivery, edge caching |
| Email Service | AWS SES / Resend | Transactional emails to clients and end-users |
| Billing | Stripe Billing + Webhooks | Subscription management, invoice generation |
| Analytics Store | ClickHouse | High-volume spin event ingestion and queries |
| Monitoring | Sentry + Datadog | Error tracking, uptime, performance metrics |
| Role | Wheel Create/Edit | Wheel Activate/Pause | Prize Manage | Segment Edit | Team Manage | Billing | Data Export / GDPR | Account Delete |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| owner | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ |
| editor | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| viewer | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| IMPORTANT:  Each client account must have exactly one owner. The owner role cannot be removed or transferred to another user without platform support intervention. |
| --- |
| Step | Action | API Endpoint | Notes |
| --- | --- | --- | --- |
| 1 | Client submits registration form | POST /auth/register | Fields: company_name, email, password (min 8 chars, 1 uppercase, 1 number), full_name |
| 2 | System creates client + owner user | — | Account created with plan = starter, plan_spin_limit = 500 |
| 3 | JWT access token returned | — | Access token expires in 15 minutes. Refresh token expires in 30 days. |
| 4 | Verification email sent | — | Dashboard accessible but email-verification-required features are locked |
| 5 | User verifies email | GET /auth/verify-email?token= | email_verified = true. Full dashboard access unlocked. |
| RATE LIMIT:  Registration is rate-limited to 3 attempts per IP per hour. Exceeding returns HTTP 429. |
| --- |
| Token Type | Algorithm / Format | Expiry | Storage | Rotation |
| --- | --- | --- | --- | --- |
| JWT Access Token | HS256 JWT — payload: {sub, clientId, role, iat, exp} | 15 minutes | Client memory (never localStorage) | On every /auth/refresh call |
| Refresh Token | crypto.randomBytes(64).toString(hex) — stored as bcrypt hash in Redis | 30 days | HttpOnly cookie or secure storage | Rotated on every refresh. Old token invalidated. |
| Plan | Max Active Wheels | Monthly Spin Quota | Max Team Members |
| --- | --- | --- | --- |
| starter | 1 | 500 | 2 |
| growth | 5 | 5,000 | 5 |
| pro | 20 | 50,000 | 15 |
| enterprise | Unlimited | Custom | Unlimited |
| From Status | To Status | Who Can Trigger | Validation Required | Effect |
| --- | --- | --- | --- | --- |
| draft | active | admin / owner | Min 2 segments; ≥1 prize segment with valid prize; embed_token present | Widget immediately starts accepting sessions |
| active | paused | admin / owner | None | New sessions blocked. Open sessions may still complete their spin. |
| active | archived | admin / owner | None | Soft-archived. Spin history preserved. Cannot reactivate. |
| paused | active | admin / owner | Same as draft→active | Widget resumes accepting sessions. |
| paused | archived | admin / owner | None | Soft-archived. Cannot reactivate. |
| any | draft | — (not allowed) | — | Draft is the initial state only. Cannot revert. |
| Field | Type | Default | Allowed Values / Range | Description |
| --- | --- | --- | --- | --- |
| spin_duration_ms | integer | 4000 | 2000 – 10000 | Total spin animation duration in ms |
| animation_speed | enum | medium | slow | medium | fast | custom | Easing preset for spin deceleration |
| pointer_position | enum | top | top | right | bottom | left | Position of the win indicator pointer |
| confetti_enabled | boolean | true | true | false | Show confetti burst on win |
| sound_enabled | boolean | false | true | false | Play audio on spin |
| sound_url | string | null | S3 URL | null | Required when sound_enabled = true |
| show_segment_labels | boolean | true | true | false | Display text labels on wheel segments |
| center_image_url | string | null | S3 URL | null | Optional logo displayed in center of wheel |
| guaranteed_win_every_n | integer | null | ≥1 | null | Force a win every N spins. null = disabled. |
| guaranteed_win_segment_id | uuid | null | valid segment UUID | null | Segment forced on guaranteed win. Required if guaranteed_win_every_n set. |
| Field | Type | Default | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| logo_url | string | null | S3 URL | null | Client logo displayed on/above wheel |
| logo_position | enum | above | above | center | Where to render the logo |
| primary_color | hex | #1E3A5F | #RRGGBB | Primary brand colour |
| secondary_color | hex | #2E86C1 | #RRGGBB | Accent colour |
| background_type | enum | solid | solid | gradient | image | Wheel background fill type |
| background_value | string | #FFFFFF | hex | CSS gradient | S3 URL | Background value matching background_type |
| font_family | string | Inter | Google Font name | custom | Font for widget UI text |
| custom_font_url | string | null | S3 woff2 URL | null | Required when font_family = custom |
| button_text | string | SPIN NOW! | max 30 chars | CTA button label |
| button_color | hex | #2E86C1 | #RRGGBB | Button background colour |
| border_color | hex | #CCCCCC | #RRGGBB | Wheel border colour |
| border_width | integer | 4 | 1 – 20 (px) | Wheel border width in pixels |
| Rule | Detail |
| --- | --- |
| Min segments per wheel | 2 |
| Max segments per wheel | 24 |
| Position indexing | 0-indexed, consecutive integers starting at 0. No gaps allowed. |
| Weight range | 0.0001 to 99999.9999 (NUMERIC 8,4). Weight 0 = excluded from draws. |
| Weight sum | Sum of all segment weights must be > 0 after excluding capped segments. |
| Segment replacement | Use PUT /wheels/{id}/segments — replaces ALL segments atomically. Partial updates not supported. |
| Label max length | 60 characters |
| Hex color validation | Must match ^#[0-9A-Fa-f]{6}$ for both bg_color and text_color |
| Win cap — daily | Resets at midnight in client timezone. NULL = unlimited. |
| Win cap — total | All-time limit. NULL = unlimited. Never decrements. |
| Prize Type | Required Fields | Description |
| --- | --- | --- |
| coupon | coupon_mode (required) + see 6.3 | Issues a coupon/discount code to the winner |
| points | points_value (integer, required) | Returns a numeric points value to the host page via postMessage |
| gift_card | display_title, display_description | Informational — client fulfils gift card manually |
| message | custom_message_html (sanitised HTML) | Shows a custom HTML message to the winner |
| url_redirect | redirect_url (https:// required) | Redirects winner to a URL (e.g. product page) |
| try_again | display_title | No-win outcome with a friendly message. Not counted as a win. |
| SECURITY:  custom_message_html is sanitised server-side using DOMPurify. Allowed tags: p, b, i, br, a, ul, li. All other tags and attributes are stripped. |
| --- |
| Coupon Mode | Behaviour | Setup Required | Exhaustion Behaviour |
| --- | --- | --- | --- |
| static | All winners receive the same code (e.g. SUMMER20) | Set static_coupon_code | N/A — code is infinite |
| unique_pool | Each winner gets a unique pre-loaded code from the pool | Upload codes via POST /prizes/{id}/coupons | Fallback to try_again result. Alert sent to client. |
| auto_generate | System generates a unique code at spin time using crypto.randomBytes | Set auto_gen_prefix and auto_gen_length | Collision retry × 5. 503 on total failure. |
| Status | Meaning | Transition To | Who Triggers |
| --- | --- | --- | --- |
| available | Ready to be issued | issued | Prize Engine at spin time |
| issued | Assigned to a winner | redeemed, expired, cancelled | Client marks redeemed; system sets expired at expires_at; client cancels |
| redeemed | Winner has used the code | — (terminal) | Client via PATCH /coupons/{id}/redeem |
| expired | Expiry date passed without use | — (terminal) | Scheduled cron job |
| cancelled | Manually voided by client | — (terminal) | Client via PATCH /coupons/{id}/cancel |
| IMPORTANT:  Coupon status transitions are ONE-DIRECTIONAL. There is no reversal. available → issued → redeemed/expired/cancelled. No row is ever deleted from coupon_codes. |
| --- |
| <div id="spin-widget" data-token="YOUR_EMBED_TOKEN"></div>
<script src="https://cdn.spinplatform.io/widget/v1/wheel.min.js" async></script> |
| --- |
| Direction | Event / Command | Payload | Description |
| --- | --- | --- | --- |
| Widget → Parent | WOF_LOADED | { type, wheelId } | Widget fully loaded and session created |
| Widget → Parent | WOF_SPIN_COMPLETE | { type, prize: { type, display_title, coupon_code } } | Spin completed and result displayed |
| Widget → Parent | WOF_LEAD_CAPTURED | { type, email } | Lead form submitted |
| Parent → Widget | WOF_OPEN | { command } | Programmatically open the widget |
| Parent → Widget | WOF_CLOSE | { command } | Programmatically close the widget |
| Step | Action | API Call | Notes |
| --- | --- | --- | --- |
| 1 | Widget loads on host page | POST /spin/session | Creates session. Returns wheel config, segments, can_spin flag. |
| 2 | If can_spin = false, display reason | — | Reasons: ALREADY_SPUN_TODAY, SPIN_CAP_REACHED, WHEEL_INACTIVE, OUTSIDE_DATE_RANGE, MONTHLY_LIMIT_REACHED |
| 3 | Lead capture form shown (if enabled) | — | Fields defined in wheel.form_config. GDPR consent collected if gdpr_enabled = true. |
| 4 | User clicks SPIN | — | Canvas animation begins immediately (visual only). Spin result NOT yet determined. |
| 5 | Animation completes → execute spin | POST /spin/execute | Sends session_id, idempotency_key, and lead data. Prize Engine runs here. |
| 6 | Result displayed to user | — | Show prize overlay with display_title and coupon_code (if applicable). |
| 7 | Integration webhooks dispatched | — | Async via BullMQ. Does NOT block spin response. |
| CRITICAL:  The visual wheel spin animation and the API call to POST /spin/execute are sequential — animation runs first, then the API call determines the actual result. Never call /spin/execute before animation starts. |
| --- |
| Integration | Type | Data Sent On Spin | Credentials Required |
| --- | --- | --- | --- |
| Mailchimp | Email marketing | Lead email, name, tags | API key + list ID |
| Klaviyo | Email marketing | Lead email, name, custom properties | Private API key + list ID |
| HubSpot | CRM | Contact properties | Private app token |
| Salesforce | CRM | Lead record | OAuth credentials |
| Zapier | Automation | Full spin payload | Zapier webhook URL |
| Generic Webhook | Custom HTTP | Full spin payload (signed) | Target URL + optional secret |
| Google Sheets | Spreadsheet | Row per spin: email, prize, time | Service account JSON |
| SECURITY:  All integration credentials (API keys, OAuth tokens) are encrypted at rest using AES-256-GCM with keys managed by AWS KMS. Credentials are NEVER returned in API responses. |
| --- |
| Field | Type | Description |
| --- | --- | --- |
| event | string | Always "spin.completed" |
| timestamp | ISO8601 | UTC timestamp of the spin |
| wheel_id | UUID | Which wheel was spun |
| spin_result_id | UUID | Unique spin record ID |
| lead | object | { email, name, phone, custom_fields } |
| prize | object | { type, display_title, coupon_code, expires_at } — null if no-prize |
| is_no_prize | boolean | true when winning segment is a no-prize segment |
| signature | string | HMAC-SHA256(raw_body, webhook_secret) — hex string |
| Attempt | Delay After Previous | Success Condition | On Failure |
| --- | --- | --- | --- |
| 1st (immediate) | — | HTTP 2xx response | Schedule 2nd attempt |
| 2nd | 30 seconds | HTTP 2xx response | Schedule 3rd attempt |
| 3rd | 5 minutes | HTTP 2xx response | Schedule 4th attempt |
| 4th | 30 minutes | HTTP 2xx response | Schedule 5th attempt |
| 5th (final) | 2 hours | HTTP 2xx response | Status = abandoned. Alert email sent to client. |
| Endpoint | Data Returned | Auth |
| --- | --- | --- |
| GET /analytics/summary?wheel_id={id}&from={date}&to={date} | Total spins, unique leads, prize distribution, conversion rate | JWT Bearer |
| GET /analytics/timeseries?wheel_id={id}&interval=day|hour | Spin counts grouped by time interval | JWT Bearer |
| GET /analytics/leads?wheel_id={id} | Paginated lead list (email, name, prize won, timestamp) | JWT Bearer |
| GET /analytics/leads/export?wheel_id={id}&format=csv | Full CSV export of all leads. Rate-limited: 1 export per 5 minutes. | JWT Bearer — admin/owner only |
| Token | Algorithm / Format | Expiry | Storage Location | Notes |
| --- | --- | --- | --- | --- |
| JWT Access Token | HS256. Payload: sub, clientId, role, iat, exp | 15 min | Client memory only | Never store in localStorage. Rotate JWT_SECRET every 90 days. |
| Refresh Token | crypto.randomBytes(64) hex. Stored as bcrypt hash in Redis | 30 days | HttpOnly secure cookie | Rotated on every /auth/refresh call. Old token invalidated immediately. |
| Embed Token | crypto.randomBytes(32) hex. Plain text in DB. | Never expires | HTML source (public) | NOT a secret. Safe to expose. Used only for widget session creation. |
| API Key | sk_live_ + base58, 48 chars. Stored as SHA-256 hash in DB. | No expiry | Client dashboard (shown once) | Shown only at creation. Cannot be retrieved later. |
| Endpoint | Limit | Window | Key Used | Lockout on Breach |
| --- | --- | --- | --- | --- |
| POST /auth/login | 5 attempts | 10 minutes | IP address | 30-minute lockout |
| POST /auth/register | 3 attempts | 1 hour | IP address | HTTP 429 Retry-After |
| POST /spin/session | 30 requests | 1 minute | embed_token + IP | HTTP 429 |
| POST /spin/execute | 10 requests | 1 minute | session_id | HTTP 429 |
| All dashboard APIs | 300 requests | 1 minute | JWT userId | HTTP 429 |
| Input Type | Validation Rule |
| --- | --- |
| All string inputs | Strip leading/trailing whitespace before validation |
| Email addresses | RFC 5322 regex + MX record check on new registrations |
| Hex colours | Must match ^#[0-9A-Fa-f]{6}$ |
| URLs | Must match ^https?://. Max 2000 characters. |
| HTML fields | Sanitise with DOMPurify server-side. Allowed tags: p, b, i, br, a, ul, li. |
| File uploads | Max 5MB. Allowed MIME: image/png, image/jpeg, image/svg+xml, image/webp, audio/mpeg, audio/ogg, font/woff2 |
| Password | Min 8 chars, at least 1 uppercase letter and 1 number. Hashed with bcrypt cost factor 12. |
| Segment weights | NUMERIC(8,4) between 0.0001 and 99999.9999 |
| Data Field | Table | Purpose | Retention |
| --- | --- | --- | --- |
| lead_email | spin_sessions | Lead capture, integration dispatch | Until GDPR erasure or client data deletion |
| lead_name | spin_sessions | Lead capture | Until GDPR erasure or client data deletion |
| lead_phone | spin_sessions | Lead capture | Until GDPR erasure or client data deletion |
| lead_custom_fields | spin_sessions | Custom form fields | Until GDPR erasure or client data deletion |
| ip_address | spin_sessions | Abuse prevention | Hashed to 0.0.0.0 after 24 hours |
| fingerprint | spin_sessions | Soft duplicate spin prevention | Replaced with "ANONYMISED" on GDPR erasure |
| user_agent | spin_sessions | Analytics / debugging | Nulled on GDPR erasure |
| gdpr_consent | spin_sessions | GDPR consent record | Reset to FALSE on erasure |
| password_hash | users | Authentication | Deleted on user soft-delete |
| LEGAL NOTE:  spin_results rows are preserved for audit integrity. They contain no PII. The immutability trigger prevents deletion. This is compliant with GDPR Article 17 exemptions for audit and legal obligation. |
| --- |
| Threshold | System Action |
| --- | --- |
| spins_used_this_month reaches 90% of plan_spin_limit | In-dashboard banner shown + email alert sent to client owner |
| spins_used_this_month reaches plan_spin_limit | can_spin = false with reason MONTHLY_LIMIT_REACHED. Widget shows upgrade prompt. |
| After plan upgrade | plan_spin_limit updated immediately. can_spin re-evaluated on next session creation. |
| Alert | Threshold | Channel | Priority |
| --- | --- | --- | --- |
| API error rate (5xx) | > 1% of requests in 5-min window | PagerDuty | P1 |
| Spin processing failure rate | > 0.1% failure rate | PagerDuty | P2 |
| Prize Engine p95 latency | > 500ms | Slack #alerts | P2 |
| Database connections | > 80% of max_connections | PagerDuty | P2 |
| Redis memory usage | > 80% used | Slack #alerts | P3 |
| Webhook abandoned | Any abandoned webhook job | Email to client + Slack | P3 |
| Coupon inventory low | < 50 available codes per prize | Email to client | P3 |
| Monthly spin limit at 90% | Per-client threshold | In-app banner + email | Info |
| Severity | Definition | Response SLA | Steps |
| --- | --- | --- | --- |
| P1 — Critical | Platform-wide outage, spin failures > 1%, data loss risk | 15 min | 1. Page on-call engineer 2. Assess scope 3. Rollback if deploy-related 4. Status page update |
| P2 — High | Elevated error rates, Prize Engine latency > 500ms | 1 hour | 1. Alert engineering 2. Identify root cause 3. Mitigate 4. Post-incident review |
| P3 — Medium | Webhook failures, coupon pool low, Redis warnings | 4 hours | 1. Investigate 2. Notify affected clients 3. Schedule fix |
| P4 — Low | Single client issue, UI bugs, integration errors | 24 hours | 1. Log ticket 2. Triage 3. Fix in next sprint |
| Variable | Required | Description |
| --- | --- | --- |
| DATABASE_URL | All envs | PostgreSQL connection string. Use PgBouncer in production. |
| REDIS_URL | All envs | Redis connection string |
| JWT_SECRET | All envs | Min 256-bit random string. Rotate every 90 days. |
| ENCRYPTION_KEY_ARN | All envs | AWS KMS key ARN for AES-256-GCM credential encryption |
| AWS_S3_BUCKET | All envs | S3 bucket name for asset storage |
| STRIPE_SECRET_KEY | All envs | sk_live_... in production, sk_test_... in staging/dev |
| STRIPE_WEBHOOK_SECRET | All envs | For verifying Stripe webhook event signatures |
| SENDGRID_API_KEY | All envs | Email delivery API key |
| CLICKHOUSE_URL | All envs | ClickHouse analytics database connection URL |
| WIDGET_CDN_BASE_URL | All envs | Base CDN URL e.g. https://cdn.spinplatform.io |
| PLATFORM_BASE_URL | All envs | e.g. https://spinplatform.io |
| NODE_ENV | All envs | development | staging | production |
| LOG_LEVEL | All envs | debug | info | warn | error |
| SENTRY_DSN | Prod only | Error tracking DSN |
| SECURITY:  NO secrets in code or .env files in production. All secrets must be stored in AWS Secrets Manager and injected at runtime. |
| --- |
| Service | Configuration | Scaling |
| --- | --- | --- |
| API Servers | 2× EC2 t3.medium behind AWS ALB | Auto-scale up at 70% CPU |
| PostgreSQL | AWS RDS PostgreSQL 16, db.t3.medium, Multi-AZ, 30-day backups | Vertical scaling on demand |
| Redis | AWS ElastiCache Redis 7, cache.t3.micro (single node for MVP) | Upgrade to cluster mode at scale |
| BullMQ Worker | Separate EC2 t3.small, 1 instance minimum | Add workers on queue depth increase |
| Widget CDN | Cloudflare CDN + Cloudflare R2 as origin | Global edge — no scaling needed |
| ClickHouse | ClickHouse Cloud starter tier for MVP | Migrate to self-hosted at 1B events/month |
| SSL/TLS | AWS ACM on ALB. Cloudflare SSL for CDN and custom domains. | — |
| CI/CD | GitHub Actions → build → test → Docker → ECR → ECS rolling deploy | Zero-downtime rolling deploys |
| Job Name | Schedule (UTC) | Action | Notes |
| --- | --- | --- | --- |
| reset-wins-today | 0 0 * * * (midnight) | Sets segments.wins_today = 0 for all active segments | Per-client timezone support required in production. Current MVP resets at UTC midnight. |
| reset-monthly-spins | 5 0 * * * (00:05 daily) | Sets clients.spins_used_this_month = 0 for clients whose billing_cycle_day = today | Runs 5 minutes after midnight to avoid collision with wins reset. |
| expire-spin-sessions | */30 * * * * (every 30m) | Sets spin_sessions.status = expired WHERE expires_at < NOW() AND status NOT IN (spun, expired) | Sessions expire 2 hours after creation. |
| expire-coupon-codes | Daily (00:15 UTC) | Sets coupon_codes.status = expired WHERE expires_at < NOW() AND status = issued | Not in base schema — must be added via migration. |
| hash-ip-addresses | Daily (01:00 UTC) | Replaces ip_address with 0.0.0.0 for spin_sessions older than 24 hours | GDPR requirement. Not in base schema — must be added. |
| NOTE:  The pg_cron extension must be installed and enabled on the PostgreSQL instance. Verify with: SELECT cron.job_run_details ORDER BY start_time DESC LIMIT 20; |
| --- |
| Action (audit_action enum) | Triggered By |
| --- | --- |
| wheel_created / wheel_updated / wheel_status_changed / wheel_deleted | Dashboard user actions on wheel lifecycle |
| segment_updated | PUT /wheels/{id}/segments |
| prize_created / prize_updated / prize_deleted | Dashboard prize management |
| coupon_uploaded / coupon_redeemed | Coupon pool upload or redemption |
| integration_created / integration_updated / integration_deleted | Integration configuration changes |
| user_invited / user_role_changed / user_removed | Team management actions |
| account_settings_updated | Profile or account configuration changes |
| plan_changed | Stripe webhook — subscription upgrade/downgrade |
| data_export_requested | Analytics CSV export triggered |
| user_data_deleted | GDPR erasure executed |
| Scenario | System Behaviour | HTTP Code | Client Action Required |
| --- | --- | --- | --- |
| User attempts to spin twice simultaneously | Redis SETNX lock on session_id. Second request gets existing result. | 409 ALREADY_SPUN | None — idempotent response |
| Duplicate idempotency_key from different session | Hard reject. UNIQUE constraint on spin_results.idempotency_key. | 409 DUPLICATE_IDEMPOTENCY_KEY | Client must generate a new UUID |
| Coupon pool exhausted mid-spin | Spin succeeds. Prize falls back to try_again. COUPON_INVENTORY_EMPTY alert sent. | 200 (with fallback) | Upload more codes immediately |
| All segments hit daily win cap | All spins return no-prize result. Wheel still shows. | 200 (no prize) | None — expected behaviour |
| Client hits monthly spin limit | can_spin = false. Widget shows upgrade prompt. | 200 (can_spin=false) | Upgrade plan or wait for reset |
| Wheel activated with insufficient segments | Activation blocked until ≥2 segments + ≥1 prize segment. | 422 WHEEL_NOT_READY | Add required segments |
| Client deletes prize with active segments | Deletion blocked. Returns list of referencing segment IDs. | 409 PRIZE_IN_USE | Reassign segments first |
| Session expires before spin | Spin rejected. Session must be recreated by widget reload. | 403 SESSION_EXPIRED | Reload page / widget |
| Auto-generated coupon collision (5 retries) | All 5 attempts produce colliding codes. | 503 (temporary) | Retry after 2 seconds |
| Webhook endpoint fails all 5 attempts | Job status = abandoned. Alert email sent to client. | — | Fix webhook endpoint and request manual resend |
| Client account suspended mid-spin | Open sessions may complete. New sessions blocked. | 403 ACCOUNT_SUSPENDED | Resolve suspension with support |
| Custom domain SSL not yet provisioned | Wheel loads on platform default domain. | — | Wait up to 24 hours for SSL provisioning |
| Widget loads with no internet connection | Loading spinner for 5s, then graceful error. Host page unaffected. | — | None — handled by widget |
| Version | Date | Changes | Author |
| --- | --- | --- | --- |
| v1.0 | March 2026 | Initial SOP — full operational coverage aligned with TRD v1.1_fixed, Schema v1.1_fixed, API Spec v1.1_fixed | Engineering Team |