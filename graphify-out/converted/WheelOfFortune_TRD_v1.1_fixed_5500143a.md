<!-- converted from WheelOfFortune_TRD_v1.1_fixed.docx -->


WHEEL OF FORTUNE PLATFORM
Technical Requirements Document (TRD)
Version 1.1  —  Gap-Fixed Release  |  March 2026  |  Confidential



# GAP FIX SUMMARY — v1.0 to v1.1

The following gaps were identified in the v1.0 review and have been corrected in this version:


# 1. SYSTEM OVERVIEW

## 1.1 Purpose of This Document
This Technical Requirements Document (TRD) provides complete, precise specifications for building the Wheel of Fortune Customization Platform. It is intended for development teams, AI code-generation systems, architects, and QA engineers. Every section contains exact field names, data types, validation rules, logic formulas, API contracts, and error codes required to implement the system without ambiguity.

## 1.2 High-Level System Components

# 2. DATABASE SCHEMA — GAP-FIXED ADDITIONS


## 2.1 NEW: wheels.form_config JSONB Column
Added to the wheels table. Stores the lead capture form configuration shown to end-users before they can spin.
{ "enabled": false,                  // boolean — false = no form shown
"fields": [                         // array of field definitions
{ "key": "email",                 // "email"|"name"|"phone"|custom string
"label": "Your Email Address",
"type": "email",                // "email"|"text"|"tel"|"checkbox"
"required": true                // boolean
}
],
"gdpr_enabled": true,               // boolean
"gdpr_text": "I agree to...",        // string — shown next to checkbox
"privacy_policy_url": "https://...", // string | null
"terms_url": "https://..."          // string | null }

## 2.2 FIX: wheels.embed_token Generation Algorithm
The embed_token must be generated server-side at wheel creation time using the following algorithm:
embed_token = crypto.randomBytes(32).toString('hex')
This produces a 64-character lowercase hex string. It is NOT a secret — it is safe to embed in public HTML. It is used only to identify which wheel to load, not to authenticate privileged actions.

## 2.3 FIX: wheels.config — Guaranteed Win Fields
Two fields were missing from the wheels.config JSONB schema documentation in v1.0:
{ ...existing fields...,
"guaranteed_win_every_n": null,        // integer | null — force win every N spins
"guaranteed_win_segment_id": null      // uuid | null — segment to land on for guaranteed wins }
These fields are implemented in the Prize Engine (Section 4.3). The Redis counter key pattern is: guaranteed_win_counter:{wheel_id}

## 2.4 NEW: audit_logs Table
Added to track all admin/dashboard actions. Required for SOP Section 10 compliance (12-month audit log retention).

## 2.5 NEW: gdpr_anonymise_session_data() Function
PostgreSQL function for GDPR right-to-erasure compliance. Anonymises all PII in spin_sessions for a given email. spin_results rows are preserved (they contain no PII — only segment/prize data).
SELECT gdpr_anonymise_session_data('user@example.com');
-- Returns: INTEGER (count of sessions anonymised)
Fields anonymised: lead_email, lead_name, lead_phone, lead_custom_fields, ip_address, fingerprint, user_agent, gdpr_consent, gdpr_consent_at.

# 3. API SPECIFICATION — GAP-FIXED ADDITIONS


## 3.1 NEW: POST /auth/verify-email
Verifies a user's email using the single-use token sent in the verification email. Sets email_verified = true. Token expires after 24 hours.
Request Body
{ "token": "string (required)" }
Responses

## 3.2 NEW: POST /auth/resend-verification
Resends the email verification link. Rate-limited to 3 requests per hour per email. Silently succeeds if email is already verified (prevents user enumeration).
Request Body
{ "email": "string (required, valid email)" }
Response: 204 No Content

## 3.3 NEW: POST /account/data-export
Triggers a full GDPR data export for the client account. Compiled asynchronously and emailed to the account owner within 24 hours. Requires owner role. Rate-limited to once per 24 hours.
Response 202
{ "message": "Data export has been queued. You will receive an email within 24 hours." }
Error Codes

## 3.4 NEW: POST /account/gdpr/erase-end-user
Anonymises all PII for an end-user (spin participant) identified by email. Calls gdpr_anonymise_session_data() internally. Action is recorded in audit_logs. Requires owner or admin role.
Request Body
{ "email": "string (required, email of end-user to erase — NOT a dashboard user)" }
Response 200
{ "sessions_anonymised": 3,
"message": "3 session records anonymised. Spin result audit records preserved." }

## 3.5 NEW: GET /wheels/{wheel_id}/analytics/export
Downloads spin event data as CSV or JSON. Available on Growth plan and above. Limited to 100,000 rows per export — use date range filtering for larger datasets.
Query Parameters
CSV Columns
spin_result_id, timestamp, lead_email, lead_name, segment_label, prize_type, prize_display_title, coupon_code, is_no_prize
Error Codes

## 3.6 FIX: CreatePrizeRequest Schema
POST /prizes previously incorrectly used the full Prize schema as the request body, which included server-set fields (id, client_id, created_at). A dedicated CreatePrizeRequest schema has been defined in the YAML spec that excludes these fields. Required fields: name, type, display_title.

# 4. PRIZE ENGINE — LOGIC (UNCHANGED FROM v1.0)

The Prize Engine logic defined in TRD v1.0 remains unchanged. All 5 steps of the probability algorithm, coupon assignment logic, and guaranteed win / jackpot modes are as documented. Refer to v1.0 Section 4 for the full specification.


# 5. SECURITY SPECIFICATIONS (UNCHANGED FROM v1.0)

All security specifications from v1.0 remain valid. This includes JWT configuration, bcrypt cost factor, AES-256-GCM credential encryption, browser fingerprint algorithm, rate limiting rules, and input validation rules. Refer to TRD v1.0 Section 5.

## 5.1 Audit Log Security Addition
The new audit_logs table (Section 2.4) is protected by an immutability trigger identical to the spin_results trigger. No row can be modified or deleted after creation. The application layer must INSERT-only into audit_logs.

# 6. WIDGET TECHNICAL SPEC (UNCHANGED FROM v1.0)

The embeddable widget specification from TRD v1.0 Section 6 remains unchanged. This includes bundle size targets, Shadow DOM usage, Canvas rendering algorithm, and the postMessage API for iFrame mode. Refer to TRD v1.0 Section 6.

# 7. WEBHOOK & INTEGRATION DISPATCH (UNCHANGED FROM v1.0)

The webhook payload schema, HMAC signature verification, and 5-attempt retry policy from TRD v1.0 Section 7 remain unchanged. Refer to TRD v1.0 Section 7.

# 8. EDGE CASES — ADDITIONS IN v1.1

The following edge cases supplement the 12 scenarios documented in TRD v1.0 Section 8:


# 9. DEVOPS & ENVIRONMENT (UNCHANGED FROM v1.0)

All DevOps and environment specifications from TRD v1.0 Section 9 remain unchanged. This includes environment variables, production infrastructure, database migration strategy, and monitoring/alerting rules. Refer to TRD v1.0 Section 9.

# 10. DOCUMENT REVISION HISTORY



— END OF TRD v1.1 —
| WHAT'S NEW IN v1.1 | Fixed 5 documented gaps from review: form_config on wheels, embed_token generation algorithm, guaranteed_win fields in config, audit_logs table, GDPR endpoints. All cross-document inconsistencies resolved. |
| --- | --- |
| Document Type | Technical Requirements Document |
| --- | --- |
| Version | v1.1 (Gap-Fixed) |
| Previous Version | v1.0 — March 2026 |
| Audience | Developers, Architects, AI Systems, QA Engineers |
| Related Documents | SOP v1.0, Schema v1.1_fixed.sql, API_Spec v1.1_fixed.yaml |
| Status | APPROVED FOR DEVELOPMENT |
| # | Gap Identified | Fix Applied | Affected Files |
| --- | --- | --- | --- |
| 1 | form_config missing from wheels table | Added form_config JSONB column with full schema definition | TRD, SQL, YAML |
| 2 | embed_token generation algorithm undocumented | Specified: crypto.randomBytes(32).toString('hex') at wheel creation | TRD, SQL |
| 3 | guaranteed_win fields missing from SQL schema | Added to wheels.config JSONB schema docs and SQL comment | TRD, SQL |
| 4 | No audit_logs table (required by SOP) | Added full audit_logs table with immutability trigger | TRD, SQL |
| 5 | No GDPR endpoints (mentioned in SOP) | Added /auth/verify-email, /account/gdpr/erase-end-user, /account/data-export | TRD, YAML |
| 6 | No analytics CSV export endpoint | Added GET /wheels/{id}/analytics/export with plan gating | TRD, YAML |
| 7 | POST /prizes used wrong request schema | Created separate CreatePrizeRequest schema (excludes id, client_id, created_at) | YAML |
| 8 | coupon_codes missing rationale for no deleted_at | Added explanatory comment confirming status enum handles lifecycle | SQL |
| Component | Technology | Responsibility |
| --- | --- | --- |
| Client Dashboard (SPA) | Next.js 14 + TailwindCSS + TypeScript | Wheel builder, prize mgmt, analytics, settings |
| Embeddable Widget | React 18 + Vite + CSS Modules | End-user spin experience, lead capture form |
| Backend API | Node.js 20 + Express 5 + TypeScript | Business logic, auth, prize engine, webhooks |
| Prize Engine (Worker) | Node.js Worker Thread / BullMQ | Isolated probability computation, idempotency |
| Primary Database | PostgreSQL 16 | All persistent relational data |
| Cache / Sessions | Redis 7 | Session tokens, rate-limit counters, spin locks |
| Job Queue | BullMQ (Redis-backed) | Async webhook dispatch, email, coupon generation |
| File Storage | AWS S3 / Cloudflare R2 | Logos, fonts, audio files, widget assets |
| CDN | Cloudflare | Widget JS bundle delivery, edge caching |
| Email Service | AWS SES / Resend | Transactional emails to clients and end-users |
| Billing | Stripe Billing + Webhooks | Subscription management, invoice generation |
| Analytics Store | ClickHouse (self-hosted or Cloud) | High-volume spin event ingestion and queries |
| Monitoring | Sentry (errors) + Datadog (metrics) | Error tracking, uptime, performance |
| NOTE | The complete database schema is in WheelOfFortune_Schema_v1.1_fixed.sql. This section documents only the additions and corrections made in v1.1. |
| --- | --- |
| Column | Type | Description |
| --- | --- | --- |
| id | UUID PK | Primary key |
| client_id | UUID FK | Owning client |
| user_id | UUID FK NULL | User who performed action. NULL for system actions. |
| action | ENUM | One of 20 defined audit_action values (see SQL file) |
| resource_type | VARCHAR(60) | e.g. wheel, prize, user, integration, account |
| resource_id | UUID NULL | ID of the affected resource |
| changes | JSONB | Diff: { before: {...}, after: {...} }. No sensitive fields. |
| ip_address | INET | Request IP of the acting user |
| created_at | TIMESTAMPTZ | Immutable — no UPDATE or DELETE permitted (trigger enforced) |
| NOTE | The complete API specification is in WheelOfFortune_API_Spec_v1.1_fixed.yaml (OpenAPI 3.0.3). This section documents only the new endpoints added in v1.1. |
| --- | --- |
| HTTP | Code | Condition |
| --- | --- | --- |
| 200 | OK | Email verified. Returns updated User object. |
| 400 | INVALID_VERIFICATION_TOKEN | Token is invalid or older than 24 hours. |
| 409 | ALREADY_VERIFIED | Email was already verified previously. |
| HTTP | Code | Condition |
| --- | --- | --- |
| 403 | FORBIDDEN | Requires owner role |
| 429 | TOO_MANY_REQUESTS | Export already requested in last 24 hours |
| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| from | date | Yes | Start date e.g. 2026-03-01 |
| to | date | Yes | End date e.g. 2026-03-31 |
| format | string | No | csv (default) or json |
| HTTP | Code | Condition |
| --- | --- | --- |
| 403 | FEATURE_NOT_IN_PLAN | Starter plan cannot export. Requires Growth or above. |
| REMINDER | The guaranteed_win fields (guaranteed_win_every_n and guaranteed_win_segment_id) are now correctly documented in both the wheels.config JSONB schema (Section 2.3 above) and the SQL schema file. |
| --- | --- |
| Scenario | System Behavior |
| --- | --- |
| Email verify token expired | Return 400 INVALID_VERIFICATION_TOKEN. Suggest user click 'Resend verification' link in dashboard. |
| GDPR erase request for email with no sessions | Return 200 with sessions_anonymised: 0. Not an error. |
| GDPR erase for a dashboard user (not end-user) | This endpoint is for end-users (spin participants) only. Dashboard user deletion is handled via DELETE /account/team/{user_id}. |
| Analytics export exceeds 100,000 rows | Return 400 with message advising to narrow the date range. Include row_count in details. |
| Audit log write fails | Log error to Sentry. Do not block the primary action (audit failure is non-critical). Retry async via BullMQ queue. |
| form_config.enabled = false but wheel has existing leads | Disabling the form does not delete existing lead data. Future spins just skip the form step. |
| Version | Date | Changes | Author |
| --- | --- | --- | --- |
| v1.0 | March 2026 | Initial TRD — DB schema, API spec, Prize Engine, Security, DevOps | Engineering Team |
| v1.1 | March 2026 | Gap-fix release: form_config, embed_token algo, audit_logs, GDPR endpoints, analytics export, CreatePrizeRequest fix | Engineering Team |