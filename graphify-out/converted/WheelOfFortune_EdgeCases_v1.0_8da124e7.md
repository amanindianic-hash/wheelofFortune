<!-- converted from WheelOfFortune_EdgeCases_v1.0.docx -->



Overview
This document is the authoritative standalone reference for all edge cases, error conditions, race conditions, and fallback behaviours. It expands on TRD section 8 and SOP section 18 with complete HTTP codes, root causes, system responses, and compensating actions.
EC-01 - Spin Execution Race Conditions

EC-02 - Prize and Coupon Edge Cases

EC-03 - Session Edge Cases

EC-04 - Account and Auth Edge Cases

EC-05 - Integration and Webhook Edge Cases

EC-06 - Data Edge Cases

EC-07 - Infrastructure Edge Cases

EC-08 - Complete Error Code Reference

EC-09 - Compensating Actions Reference

- END OF EDGE CASES & ERROR HANDLING -
| WHEEL OF FORTUNE PLATFORM
Edge Cases & Error Handling - Document 8 |
| --- |
| Document Type | Edge Cases & Error Handling |
| --- | --- |
| Version | v1.0 |
| Date | March 2026 |
| Status | APPROVED FOR DEVELOPMENT |
| Related Documents | TRD v1.1 | SOP v1.0 | API Spec v1.1 | Business Logic v1.0 |
| Scenario | Root Cause | System Behaviour | HTTP Code | Resolution |
| --- | --- | --- | --- | --- |
| User double-clicks SPIN | Two POST /spin/execute calls <100ms apart | Redis SETNX lock on session_id. Second request returns existing result. | 200 idempotent | Widget disables button on first click. Lock is defence-in-depth. |
| Network retry same key same session | POST /spin/execute timed out. Widget retries with same idempotency_key. | UNIQUE constraint matches same session_id - returns existing result. | 200 idempotent | Always retry with SAME key on timeout. |
| Same key different session (bug) | idempotency_key from session A used with session B. | UNIQUE constraint mismatch - hard reject. | 409 DUPLICATE_IDEMPOTENCY_KEY | Generate new UUID per spin attempt. Never reuse across sessions. |
| Two browser tabs same user | Both load widget, call /spin/session. | Two separate sessions. First to execute wins. Second: frequency rules may block. | 200 (can_spin=false on 2nd) | Frequency rules use fingerprint/email. Sessions are independent. |
| Redis SETNX lock failure | Redis temporarily unavailable. | Log to Sentry. Return 503. Never proceed without lock. | 503 PRIZE_ENGINE_UNAVAILABLE | Show retry button. Do not re-spin animation. Retry after 2s. |
| Prize Engine timeout >200ms | Complex weight calc or DB query exceeds budget. | Worker Thread terminated. API returns 503. | 503 PRIZE_ENGINE_UNAVAILABLE | Alert: p95 latency > 500ms. Investigate slow DB queries. |
| PostgreSQL SERIALIZABLE deadlock | Two concurrent spins acquire locks in different order. | PostgreSQL detects deadlock, rolls back one tx. Auto-retry once. | 500 then 503 if retry fails | Log to Sentry. Return 503 after retry. |
| Scenario | System Behaviour | HTTP Code | Client Action Required |
| --- | --- | --- | --- |
| unique_pool coupon pool exhausted | SELECT FOR UPDATE SKIP LOCKED returns 0 rows. Spin falls back to try_again. COUPON_INVENTORY_EMPTY alert sent. | 200 try_again result | Upload more codes via POST /prizes/{id}/coupons immediately. |
| auto_generate code collision attempts 1-4 | generateCode() produces existing code. INSERT ... ON CONFLICT DO NOTHING retries up to 5 times. | Automatic retry | No action needed. |
| auto_generate code collision all 5 attempts | All 5 generated codes exist in DB. Extremely unlikely. | 503 | Retry after 2s. Increase auto_gen_length to reduce probability. |
| static coupon infinite use | Same code given to every winner. No inventory tracking. | 200 always | Expected. Use unique_pool for one-use codes. |
| All segments hit daily win_cap | Prize Engine excludes capped segments. Falls through to first no-prize segment. | 200 no-prize result | Expected. Resets at midnight. Increase caps if undesired. |
| All segments hit total win_cap | Same as daily but permanent for the wheel. | 200 no-prize result | Increase or remove win_cap_total on segments. |
| guaranteed_win_segment is capped | Falls back to normal probability distribution. Counter still resets. | 200 normal result | Use a segment with no win caps as guaranteed_win_segment_id. |
| Prize delete blocked by segments | FK constraint prevents deletion. | 409 PRIZE_IN_USE | Reassign or remove all segments referencing the prize first. |
| Coupon expires without redemption | Scheduled cron sets status=expired at 00:15 UTC daily. | Automatic | Expected. One-directional - cannot un-expire. |
| Redeem already-redeemed coupon | PATCH on status=redeemed row. | 409 ALREADY_REDEEMED | Contact platform support if redemption was in error. |
| Scenario | System Behaviour | HTTP Code | Notes |
| --- | --- | --- | --- |
| Session expires (2h elapsed) | POST /spin/execute rejects expired session_id. | 403 SESSION_EXPIRED | Widget must reload to create new session. Cannot recover expired session. |
| Session already spun | Duplicate spin attempt. Returns existing spin_result. | 409 ALREADY_SPUN | Idempotent. Widget displays previously won prize. |
| Wheel paused after session created | can_spin was true at creation. Spin proceeds. | 200 | By design. Active sessions at pause time may complete. |
| Wheel archived after session created | Checks wheel.deleted_at. If archived, rejects spin. | 403 SPIN_NOT_ALLOWED | Expected. Archive is immediate. |
| Fingerprint collision between users | SHA-256 collision is negligible but possible. Second user may be blocked. | 200 can_spin=false | Fingerprint is soft deterrent. Enable email_check=true for strong enforcement. |
| Same user two devices simultaneously | Two sessions. First to execute wins. Second blocked by frequency rules. | 200 can_spin=false on 2nd | Expected. Frequency rules apply across devices for same fingerprint/email. |
| Widget loads offline | 5-second timeout then graceful error. Host page unaffected. | N/A | No API calls. No session created. No action needed. |
| Scenario | System Behaviour | HTTP Code | Resolution |
| --- | --- | --- | --- |
| JWT expired mid-request | Request rejected. | 401 UNAUTHORIZED | Client auto-refreshes via POST /auth/refresh. Transparent if refresh_token valid. |
| Refresh token expired 30 days | POST /auth/refresh rejects. Redis TTL expired. | 401 UNAUTHORIZED | User must log in again. Session data preserved in DB. |
| Simultaneous login two devices | Both succeed. Independent refresh_tokens issued. | 200 on both | Both sessions valid. Logout on one only revokes that token. |
| Account suspended mid-session | Existing JWTs valid until natural expiry max 15min. New login blocked. | 403 ACCOUNT_SUSPENDED on login | Widget sessions may complete. New sessions blocked. |
| Email unverified on protected endpoint | Endpoints requiring email_verified=true return 403. | 403 EMAIL_NOT_VERIFIED | Resend verification email from dashboard. |
| Plan downgrade - wheels exceed new limit | Wheels beyond new limit auto-paused (not deleted). | N/A | Client notified. Must archive excess wheels to stay within plan. |
| Stripe webhook out-of-order | Handler checks Stripe event timestamp. Processes in chronological order. | 200 idempotent | Store last applied Stripe event timestamp for ordering. |
| JWT_SECRET rotated | All existing JWTs become invalid immediately. | 401 on next request | Users must log in again. Plan rotation during low-traffic window. |
| Scenario | System Behaviour | HTTP Code | Retry? | Resolution |
| --- | --- | --- | --- | --- |
| Endpoint slow >10s timeout | BullMQ job times out at WEBHOOK_TIMEOUT_MS. Treats as failure. | Timeout | Yes | Increase WEBHOOK_TIMEOUT_MS or fix endpoint performance. |
| Endpoint returns 429 rate limited | Treated as failure. Retry schedule applies. | 429 | Yes | Backoff helps. Contact third-party for rate limit increase. |
| Endpoint SSL expired | HTTPS connection fails. SSL error = failure. | SSL Error | Yes | Client must renew SSL on endpoint. |
| All 5 attempts fail - abandoned | status=abandoned in webhook_logs. Alert email to client owner. | Various | No | Client fixes endpoint. Support can replay webhooks. |
| Third-party credentials rotated | Webhook fails with 401/403. | 401/403 | Yes 5 attempts | Client updates credentials via dashboard. |
| Integration disabled during spin batch | is_enabled=false checked at dispatch time. Skipped entirely. | N/A | No | Expected. Disable to stop dispatching immediately. |
| Scenario | System Behaviour | Notes |
| --- | --- | --- |
| GDPR erasure while spin in progress | gdpr_anonymise_session_data() is atomic. PII fields anonymised. spin_result preserved (no PII). | Safe to call at any time. Idempotent. |
| GDPR erasure for email that never spun | Returns 0 rows affected. No error. Audit log entry created. | Expected. 0 is a valid result. |
| Same lead email across two clients | Allowed. email uniqueness in spin_sessions NOT enforced across clients. | Multi-tenant isolation by design. |
| Prize hard delete with spin_results | FK constraint blocks hard delete. Use soft delete (deleted_at). | Soft delete archives prize. spin_results references preserved. |
| Coupon code same string across two prizes | Allowed. UNIQUE constraint on (prize_id, code) composite. | Codes are scoped to a prize by design. |
| audit_log INSERT fails | Non-blocking. Log to Sentry. Do NOT fail originating request. | Audit log best-effort. Retry for compliance-critical actions. |
| spin_result INSERT + wins_today UPDATE in same tx | If wins_today UPDATE fails, entire SERIALIZABLE tx rolls back including spin_result. | Safe to retry with same idempotency_key. |
| Scenario | Impact | System Behaviour | Recovery |
| --- | --- | --- | --- |
| Redis unavailable | Rate limiting, spin locks, guaranteed_win counter, refresh tokens all fail. | Rate limiting fail open. Spin lock returns 503. Refresh token returns 401. | ElastiCache Multi-AZ failover ~30s. BullMQ jobs persist and resume. |
| PostgreSQL primary failover | Write operations fail during failover window. | 503 for write endpoints. Read analytics may continue from replica. | RDS Multi-AZ auto failover ~60-120s. App auto-reconnects via pool. |
| BullMQ worker crash | Webhook/email jobs stall. | Jobs persist in Redis. Resume on restart. No job loss. | Restart worker ECS task. Alert if queue depth > 1000. |
| ClickHouse unavailable | Analytics endpoints fail. Spin flow completely unaffected. | GET /analytics/* returns 503. All spin/auth/write endpoints normal. | ClickHouse Cloud SLA 99.9%. Backfill from PostgreSQL on recovery. |
| AWS S3 unavailable | Asset uploads fail. Existing assets served from CDN cache. | Upload endpoints 503. Widget assets served from CDN max-age=31536000. | No spin disruption. New uploads resume when S3 recovers. |
| pg_cron job missed at midnight | wins_today not reset. Daily cap enforcement uses stale counts. | Spins continue but caps may block incorrectly. | Manual UPDATE segments SET wins_today=0 WHERE ...; Check cron.job_run_details. |
| HTTP Status | Error Code | Description | Endpoint(s) |
| --- | --- | --- | --- |
| 400 | INVALID_STATUS_TRANSITION | Wheel status transition not allowed | PATCH /wheels/{id}/status |
| 401 | UNAUTHORIZED | JWT missing, expired, or invalid | All authenticated endpoints |
| 401 | INVALID_CREDENTIALS | Email/password mismatch | POST /auth/login |
| 401 | INVALID_REFRESH_TOKEN | Refresh token expired or revoked | POST /auth/refresh |
| 403 | FORBIDDEN | Authenticated but insufficient role | Various |
| 403 | EMAIL_NOT_VERIFIED | Email verification required | POST /auth/login |
| 403 | ACCOUNT_SUSPENDED | Client account is_active=false | POST /auth/login, POST /spin/session |
| 403 | SESSION_EXPIRED | Spin session older than 2 hours | POST /spin/execute |
| 403 | SPIN_NOT_ALLOWED | can_spin was false at session creation | POST /spin/execute |
| 403 | PLAN_WHEEL_LIMIT | Active wheel count exceeds plan limit | POST /wheels |
| 404 | NOT_FOUND | Resource not found or not owned by client | GET/PATCH/DELETE endpoints |
| 409 | EMAIL_ALREADY_EXISTS | Email already registered | POST /auth/register |
| 409 | ALREADY_SPUN | Session already has a spin_result | POST /spin/execute |
| 409 | DUPLICATE_IDEMPOTENCY_KEY | idempotency_key used by different session | POST /spin/execute |
| 409 | PRIZE_IN_USE | Prize referenced by active segments | DELETE /prizes/{id} |
| 409 | ALREADY_REDEEMED | Coupon already marked as redeemed | PATCH /coupons/{id}/redeem |
| 422 | VALIDATION_ERROR | Request body failed validation | POST/PATCH endpoints |
| 422 | WHEEL_NOT_READY | Activation validation failed | PATCH /wheels/{id}/status |
| 422 | LEAD_REQUIRED | Wheel requires lead form but none provided | POST /spin/execute |
| 429 | TOO_MANY_REQUESTS | Rate limit exceeded | Rate-limited endpoints |
| 503 | PRIZE_ENGINE_UNAVAILABLE | Worker thread failed or Redis lock unavailable | POST /spin/execute |
| DEFINITION:  A compensating action is a manual or automated corrective step required when a system operation partially succeeds or leaves data in an inconsistent state. |
| --- |
| Failure Scenario | Inconsistent State | Compensating Action | Who Performs |
| --- | --- | --- | --- |
| spin_result + coupon not issued atomically | Cannot happen - same SERIALIZABLE tx. Full rollback on any failure. | N/A - handled by transaction | N/A |
| Webhook abandoned (5 attempts failed) | Lead NOT synced to Mailchimp/CRM/Zapier. | Export leads via CSV and re-import to CRM. Support can replay webhooks. | Client + Platform Support |
| GDPR erasure partially completed | Some spin_sessions anonymised, others not. | Re-run gdpr_anonymise_session_data(email) - idempotent. | Operations / Support |
| pg_cron reset-wins-today missed | segments.wins_today stale. | Manual UPDATE segments SET wins_today=0 FROM wheels w WHERE segments.wheel_id=w.id AND w.deleted_at IS NULL; | DevOps / On-call |
| pg_cron reset-monthly-spins missed for client | spins_used_this_month not reset. | Manual UPDATE clients SET spins_used_this_month=0 WHERE id=? AND billing_cycle_day=?; | DevOps / Support |
| Plan downgrade auto-paused wheels | Wheels beyond plan limit paused. | Upgrade plan first, then re-activate wheels via PATCH /wheels/{id}/status. | Client self-service |
| JWT_SECRET rotated - all users logged out | All active sessions invalid. | No compensating action needed. Users log in again. No data loss. | None required |