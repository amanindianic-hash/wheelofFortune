<!-- converted from WheelOfFortune_DevOps_v1.0.docx -->

Wheel of Fortune Customization Platform
DevOps & Environment Specifications



Table of Contents
DO-01  Environment Overview
DO-02  Environment Variables Reference
DO-03  Production Infrastructure Specification
DO-04  CI/CD Pipeline Specification
DO-05  Database Migration Strategy
DO-06  Scheduled Jobs Reference
DO-07  Monitoring & Alerting
DO-08  Security Hardening Checklist
DO-09  Disaster Recovery & Backup
DO-10  Local Development Setup

DO-01  Environment Overview
The platform operates across three managed environments. All environments share the same codebase; differences are driven entirely by environment variables and infrastructure sizing.
Environment Comparison



DO-02  Environment Variables Reference
All secrets are stored in AWS Secrets Manager and injected at container start. Never commit secrets to source control.

Core Service Variables

Third-Party Service Variables

Application Tuning Variables

Widget Build-Time Variables (Public)



DO-03  Production Infrastructure Specification
Infrastructure Diagram (Logical)

Component Specifications

Network & Security Boundaries


DO-04  CI/CD Pipeline Specification
The platform uses GitHub Actions for all CI/CD. Deployments to production require a manual approval gate.
Pipeline Stages

GitHub Actions Workflow Summary

ECS Deployment Configuration

Rollback Procedure


DO-05  Database Migration Strategy
Migrations are managed via db-migrate (npm package) with PostgreSQL dialect. Migration files live in /migrations directory and are version-controlled in Git.
Naming Convention

Migration Rules

Migration Execution Steps


DO-06  Scheduled Jobs Reference
All scheduled jobs are implemented as pg_cron jobs running inside PostgreSQL. They require the pg_cron extension to be enabled on the RDS instance.


pg_cron Setup

Job Monitoring
Datadog monitor queries cron.job_run_details for failed runs (status = failed) every 10 minutes and fires a P3 alert to #ops-alerts Slack channel. Consecutive failures trigger PagerDuty P2.

DO-07  Monitoring & Alerting
Monitoring Stack

Alert Severity Levels

Key Alert Thresholds

Datadog Dashboard Panels


DO-08  Security Hardening Checklist
Run this checklist before every production deployment and at quarterly security review.
Network & Perimeter

Authentication & Secrets

Application Security

Data & Compliance


DO-09  Disaster Recovery & Backup
Recovery Objectives

Backup Strategy

Failover Runbook

Monthly Restore Test Procedure


DO-10  Local Development Setup
Follow these steps to set up a fully functional local development environment. Estimated time for a new engineer: 30-45 minutes.
Prerequisites

Step-by-Step Setup

Docker Compose Services

Common Local Dev Commands

IDE Configuration



Revision History

| Document ID | DO-SPEC-v1.0 |
| --- | --- |
| Version | 1.0 |
| Date | 2025-01-15 |
| Status | APPROVED |
| Author | Platform Engineering Team |
| Reviewed By | CTO, Lead DevOps, Security Lead |
| Classification | INTERNAL - CONFIDENTIAL |
| Property | Development (local) | Staging | Production |
| --- | --- | --- | --- |
| Purpose | Feature dev & unit tests | Integration tests & QA | Live customer traffic |
| URL | http://localhost:3000 | https://staging.spinplatform.io | https://api.spinplatform.io |
| Widget CDN | http://localhost:3001 | https://cdn-staging.spinplatform.io | https://cdn.spinplatform.io |
| Database | Docker PostgreSQL 16 | RDS PostgreSQL 16 (single-AZ) | RDS PostgreSQL 16 (Multi-AZ) |
| Redis | Docker Redis 7 | ElastiCache r7g.medium (1 node) | ElastiCache r7g.large (cluster) |
| BullMQ Workers | 1 worker (local) | 1 t3.small EC2 | 2 t3.medium EC2 (auto-scale) |
| ClickHouse | Docker ClickHouse | ClickHouse Cloud (dev tier) | ClickHouse Cloud (production tier) |
| Object Storage | MinIO (local) | AWS S3 staging bucket | AWS S3 + Cloudflare R2 |
| Log Level | DEBUG | INFO | WARN + ERROR |
| Migrations | Auto on start | Manual trigger pre-deploy | Blue/green locked pre-deploy |
| Node.js Version | 20 LTS | 20 LTS | 20 LTS |
| SSL/TLS | Self-signed (optional) | ACM wildcard cert | ACM wildcard cert + HSTS |
| CORS | Allow localhost:* | Allow staging origins only | Allow listed customer domains |
| Code flow:  developer branch -> PR to main -> auto-deploy staging -> manual approval gate -> production deploy
Database migrations:  run against staging first, verified, then run against prod inside a maintenance window. |
| --- |
| Convention: variables prefixed NEXT_PUBLIC_ are embedded in the widget bundle at build time and are therefore public. All others are server-side only. |
| --- |
| Variable | Required | Example / Default | Description |
| --- | --- | --- | --- |
| NODE_ENV | Yes | production | Runtime mode. Controls log level defaults and error verbosity. |
| PORT | Yes | 3000 | HTTP listener port for the API service. |
| LOG_LEVEL | No | warn | Pino log level: trace | debug | info | warn | error | fatal. |
| DATABASE_URL | Yes | postgresql://... | Full PostgreSQL connection string including user, password, host, port, db name. |
| DATABASE_POOL_MIN | No | 2 | Minimum pg connection pool size. |
| DATABASE_POOL_MAX | No | 20 | Maximum pg connection pool size. |
| REDIS_URL | Yes | rediss://... | Redis connection string. Use rediss:// (TLS) in staging and prod. |
| REDIS_KEY_PREFIX | No | spin: | Prefix applied to all Redis keys to avoid namespace collisions. |
| JWT_SECRET | Yes | (256-bit secret) | HMAC-SHA256 signing secret for access tokens. Rotate every 90 days. |
| JWT_EXPIRY_SECONDS | No | 900 | Access token lifetime (default 15 minutes). |
| REFRESH_TOKEN_EXPIRY_DAYS | No | 30 | Opaque refresh token lifetime. |
| BCRYPT_COST_FACTOR | No | 12 | Bcrypt work factor for refresh token hashing. Min 12 in prod. |
| ENCRYPTION_KEY_ARN | Yes | arn:aws:kms:... | AWS KMS CMK ARN used to encrypt PII at rest via envelope encryption. |
| PLATFORM_BASE_URL | Yes | https://api.spinplatform.io | Base URL prepended to webhook delivery URLs and email links. |
| WIDGET_CDN_BASE_URL | Yes | https://cdn.spinplatform.io | CDN origin for widget JS/CSS. Used to generate embed snippet. |
| Variable | Required | Example / Default | Description |
| --- | --- | --- | --- |
| AWS_REGION | Yes | us-east-1 | AWS region for S3, KMS, SES calls. |
| AWS_S3_BUCKET | Yes | spinplatform-prod | S3 bucket for coupon CSV uploads and exported reports. |
| AWS_S3_PRESIGN_EXPIRY | No | 3600 | Pre-signed URL validity in seconds for file downloads. |
| STRIPE_SECRET_KEY | Yes | sk_live_... | Stripe server-side secret key for subscription management. |
| STRIPE_WEBHOOK_SECRET | Yes | whsec_... | Stripe webhook endpoint signing secret for event verification. |
| STRIPE_PRICE_STARTER | Yes | price_xxx | Stripe Price ID for the Starter plan. |
| STRIPE_PRICE_GROWTH | Yes | price_xxx | Stripe Price ID for the Growth plan. |
| STRIPE_PRICE_PRO | Yes | price_xxx | Stripe Price ID for the Pro plan. |
| STRIPE_PRICE_ENTERPRISE | No | price_xxx | Stripe Price ID for Enterprise (custom billing). |
| SENDGRID_API_KEY | Yes | SG.xxx | SendGrid API key for transactional email delivery. |
| SENDGRID_FROM_EMAIL | Yes | no-reply@spinplatform.io | Verified sender address. |
| CLICKHOUSE_URL | Yes | https://xxx.clickhouse.cloud | ClickHouse Cloud HTTPS endpoint for analytics writes. |
| CLICKHOUSE_USER | Yes | default | ClickHouse username. |
| CLICKHOUSE_PASSWORD | Yes | (secret) | ClickHouse password. Store in AWS Secrets Manager. |
| SENTRY_DSN | No | https://xxx@sentry.io | Sentry error reporting DSN. Omit to disable. |
| DATADOG_API_KEY | No | xxx | Datadog API key for APM and log forwarding. |
| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| MAX_WORKERS | No | 4 | Number of Node.js Worker Threads in the prize engine pool. |
| WORKER_CONCURRENCY | No | 10 | BullMQ concurrency per worker process (concurrent jobs). |
| WEBHOOK_TIMEOUT_MS | No | 5000 | HTTP timeout for outbound webhook delivery attempts. |
| WEBHOOK_MAX_RETRIES | No | 5 | Maximum retry attempts for failed webhook delivery. |
| SPIN_LOCK_TTL_SECONDS | No | 10 | Redis lock TTL to prevent duplicate spin processing. |
| SESSION_EXPIRY_HOURS | No | 24 | Widget session maximum age before expiry. |
| COUPON_LOW_INVENTORY_THRESHOLD | No | 10 | Alert threshold for low coupon pool inventory. |
| RATE_LIMIT_WINDOW_MS | No | 60000 | Sliding window duration for API rate limiting (ms). |
| RATE_LIMIT_MAX_REQUESTS | No | 120 | Max requests per window per IP for public endpoints. |
| SPIN_RATE_LIMIT_WINDOW_MS | No | 60000 | Sliding window for spin endpoint rate limiting. |
| SPIN_RATE_LIMIT_MAX | No | 10 | Max spin attempts per window per fingerprint. |
| GDPR_ANONYMISE_RETENTION_DAYS | No | 2555 | Days before auto-anonymisation of inactive sessions (7 years). |
| CORS_ALLOWED_ORIGINS | Yes | (dynamic from DB) | Comma-separated fallback CORS origins. Normally loaded per-client from DB. |
| CRON_SECRET | Yes | (random 256-bit) | Secret header value required to invoke cron job endpoints. |
| MAINTENANCE_MODE | No | false | Set true to return 503 for all non-health endpoints. |
| These are embedded in the widget bundle at build time via the CDN build pipeline. They are NOT secrets. |
| --- |
| Variable | Required | Example | Description |
| --- | --- | --- | --- |
| NEXT_PUBLIC_API_BASE_URL | Yes | https://api.spinplatform.io/v1 | Widget API base URL baked into CDN bundle. |
| NEXT_PUBLIC_CDN_VERSION | Yes | 1.4.2 | Semver bundle version for cache-busting. |
| NEXT_PUBLIC_SENTRY_DSN | No | https://xxx@sentry.io | Sentry DSN for widget-side error reporting. |
| [Clients / Browsers]
         |
  [Cloudflare CDN]  <------  Widget JS/CSS (R2 / S3)
         |
  [AWS ALB (HTTPS/443)]  +  [WAF + Shield Standard]
      /          \n [API EC2 a]   [API EC2 b]    (t3.medium x2, min:2 max:6)
      |              |
  [RDS PostgreSQL 16 Multi-AZ]   primary + standby (db.t3.medium)
  [ElastiCache Redis 7 Cluster]  r7g.large, 2 nodes
  [BullMQ Worker EC2 x2]         t3.small, auto-scale on queue depth
      |              |
  [AWS S3]  [ClickHouse Cloud]  [SendGrid]  [Stripe]
      |
  [AWS KMS]  [Datadog / Sentry]  [PagerDuty] |
| --- |
| Component | Type / SKU | Count | Purpose |
| --- | --- | --- | --- |
| API Service | EC2 t3.medium (2 vCPU, 4 GB) | 2 (min) - 6 (max) | Node.js Express API, horizontal auto-scale on CPU > 60%. |
| Application Load Balancer | AWS ALB + WAF | 1 (HA) | TLS termination, health-check routing, rate limiting. |
| Primary Database | RDS PostgreSQL 16 db.t3.medium | 1 primary + 1 standby | Multi-AZ failover, automated backups, encryption at rest. |
| Read Replica | RDS PostgreSQL 16 db.t3.small | 1 | Analytics read queries offloaded from primary. |
| Cache / Queue Broker | ElastiCache Redis 7 r7g.large | 2 nodes | Rate limiting, session store, spin locks, BullMQ broker. |
| BullMQ Worker | EC2 t3.small | 2 (min) - 4 (max) | Processes webhook delivery, coupon jobs, report exports. |
| Object Storage | AWS S3 + Cloudflare R2 | 2 buckets | S3 for uploads/exports; R2 for widget CDN assets (lower egress cost). |
| CDN | Cloudflare (Pro plan) | Global PoPs | Widget JS/CSS delivery, DDoS protection, image optimisation. |
| Analytics DB | ClickHouse Cloud (production) | 3-node cluster | Spin events, impression events, aggregation queries. |
| Secrets Management | AWS Secrets Manager + KMS CMK | 1 KMS key | All credentials and PII encryption key management. |
| Email | SendGrid (Essentials plan) | Shared IP pool | Transactional emails: invites, password resets, alerts. |
| Monitoring | Datadog APM + Logs + Metrics | SaaS | Full observability: APM traces, dashboards, alert policies. |
| Error Tracking | Sentry (Business plan) | SaaS | API + widget exception capture, release tracking. |
| Payments | Stripe | SaaS | Subscription lifecycle, invoicing, webhook events. |
| Layer | Control | Detail |
| --- | --- | --- |
| DNS | Cloudflare Proxy | All A/AAAA records proxied; origin IP concealed. |
| Edge | Cloudflare WAF | OWASP Core Ruleset enabled; custom rules block SQL injection patterns. |
| ALB | Security Group: inbound 443 only | All HTTP redirected to HTTPS. Only ALB SG allowed to reach EC2. |
| EC2 API | Private subnet + NAT Gateway | No public IPs; outbound via NAT for third-party API calls. |
| RDS | Private subnet, no public access | SG allows only API EC2 SG + Bastion SG on port 5432. |
| Redis | Private subnet, no public access | SG allows only API EC2 SG + Worker EC2 SG on port 6380 (TLS). |
| S3 | Bucket policy: deny public GetObject | Pre-signed URLs for all downloads; widget assets served via CDN only. |
| Secrets | IAM role-based access | Each EC2 role has least-privilege policy: GetSecretValue on specific ARNs only. |
| Stage | Trigger | Actions | Gate |
| --- | --- | --- | --- |
| 1. Lint & Type-check | Every push / PR | ESLint, tsc --noEmit, Prettier check | Fail = block merge |
| 2. Unit Tests | Every push / PR | Jest unit tests, coverage threshold >= 80% | Fail = block merge |
| 3. Integration Tests | Every push / PR | Docker Compose (pg + redis) + supertest API tests | Fail = block merge |
| 4. Security Scan | Every push / PR | npm audit --audit-level=high, Snyk IaC scan | Critical CVE = block merge |
| 5. Build Docker Image | Merge to main | docker build, tag with git SHA, push to ECR | Build failure = alert |
| 6. Deploy Staging | Merge to main | ECS rolling deploy to staging cluster, smoke tests | Smoke failure = rollback + alert |
| 7. Manual Approval | Post-staging pass | Slack notification to #deployments with changelog + approve link | Requires 1 approver |
| 8. Deploy Production | After approval | ECS rolling deploy (25% at a time), wait for health checks | Health fail = auto-rollback |
| 9. Post-deploy Verify | Post-deploy | Synthetic test via Datadog, Sentry error-rate check (5 min) | Error spike = PagerDuty alert |
| File: .github/workflows/deploy.yml

Key workflow jobs:
  ci          - runs on all PRs: lint, test, audit
  build       - runs on main: docker build + ECR push
  staging     - runs after build: ECS deploy + smoke tests
  approve     - manual environment gate (GitHub Environments: production)
  production  - runs after approve: ECS rolling deploy + verification |
| --- |
| Parameter | Staging | Production |
| --- | --- | --- |
| Cluster | spinplatform-staging | spinplatform-prod |
| Service (API) | api-service | api-service |
| Service (Worker) | worker-service | worker-service |
| Deployment type | Rolling update | Rolling update (25/25) |
| Min healthy percent | 50% | 100% |
| Max percent | 200% | 150% |
| Health check grace | 30s | 60s |
| Rollback on failure | Automatic (ECS) | Automatic (ECS) + PagerDuty |
| Image tag | git-{short-sha}-staging | git-{short-sha}-prod |
| Automatic: ECS rolls back if health check fails during deploy.

Manual rollback steps:
  1. Identify last good image tag from ECR console or GitHub Actions log.
  2. Run: aws ecs update-service --cluster spinplatform-prod --service api-service --task-definition api:{previous-revision}
  3. Confirm ECS shows steady state.
  4. Post incident note in #deployments Slack channel.
  5. Open incident ticket with root cause.

Database rollback: schema migrations are forward-only. See DO-05 for strategy. |
| --- |
| File format:  {timestamp}__{description}.sql

Examples:
  20250110120000__create_initial_schema.sql
  20250115093000__add_wheel_form_config.sql
  20250120140000__add_audit_logs_table.sql
  20250201110000__add_guaranteed_win_fields.sql

Timestamp format: YYYYMMDDHHmmss (UTC). Never reorder or rename applied migrations. |
| --- |
| Rule | Detail |
| --- | --- |
| R1 - Forward-only | Never DELETE or reverse an applied migration. Write a new compensating migration instead. |
| R2 - Idempotent DDL | Use CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS, CREATE INDEX IF NOT EXISTS. |
| R3 - No data loss DDL | Dropping a column requires: (1) stop writing to it, (2) deploy to remove app code, (3) then drop in next release. |
| R4 - Non-blocking index | All new indexes on large tables must use CREATE INDEX CONCURRENTLY to avoid table lock. |
| R5 - Transaction safety | Each migration file wraps DDL in BEGIN / COMMIT. Triggers and functions use CREATE OR REPLACE. |
| R6 - Test before prod | Every migration must run successfully against the staging database before production deployment. |
| R7 - Backup before migrate | An automated RDS snapshot is triggered before any production migration run via CI pipeline. |
| R8 - Schema version table | db-migrate maintains schema_migrations table; do not manually modify it. |
| Step | Command / Action | Who |
| --- | --- | --- |
| 1 | Automated RDS snapshot triggered by CI pre-migration step. | CI pipeline |
| 2 | db-migrate up --env staging  (dry-run: db-migrate status) | CI pipeline |
| 3 | Smoke tests pass against staging. | CI pipeline |
| 4 | Manual approval gate in GitHub Actions (production environment). | Engineering lead |
| 5 | db-migrate up --env production | CI pipeline |
| 6 | API health check passes: GET /health returns 200. | CI pipeline |
| 7 | Sentry error rate monitored for 10 minutes post-migration. | On-call engineer |
| pg_cron runs in the default cron schema. Jobs are registered in cron.job table. All times are UTC. |
| --- |
| Job ID | Schedule (cron) | Function Called | Purpose |
| --- | --- | --- | --- |
| CJ-01 | 0 0 * * * | reset_daily_spin_counts() | Resets wins_today to 0 on all wheel configurations at midnight UTC. |
| CJ-02 | */5 * * * * | expire_stale_spin_sessions() | Sets status = expired on spin_sessions where expires_at < NOW() and status = pending. |
| CJ-03 | 0 1 * * * | gdpr_anonymise_session_data() | Anonymises PII in spin_sessions / spin_results older than GDPR retention period. |
| CJ-04 | 0 2 * * 0 | archive_old_audit_logs() | Moves audit_logs older than 2 years to audit_logs_archive table (cold storage). |
| CJ-05 | */15 * * * * | check_coupon_inventory_alerts() | Publishes low-inventory events to BullMQ for email/webhook alert if coupon pool below threshold. |
| CJ-06 | 0 3 1 * * | generate_monthly_billing_report() | Aggregates spin counts and plan usage per client for the previous calendar month. |
| Enable pg_cron on RDS:
  1. In RDS parameter group, set: shared_preload_libraries = pg_cron
  2. Reboot the RDS instance.
  3. Connect as superuser and run: CREATE EXTENSION IF NOT EXISTS pg_cron;
  4. Register jobs: SELECT cron.schedule(name, schedule, command);

Verify: SELECT jobid, jobname, schedule, active FROM cron.job;
History: SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20; |
| --- |
| Tool | Purpose | Retention |
| --- | --- | --- |
| Datadog APM | Distributed traces, latency percentiles, service map. | 15 days (APM) |
| Datadog Metrics | CPU, memory, RDS, Redis, BullMQ queue depth. | 15 months |
| Datadog Logs | Structured JSON API logs, ECS container logs. | 15 days (indexed) |
| Sentry | Exception capture, release tracking, performance. | 90 days |
| RDS Performance Insights | Slow queries, wait events, top SQL. | 7 days (free tier) |
| Cloudflare Analytics | Edge request volume, DDoS events, WAF triggered rules. | Real-time dashboard |
| ClickHouse system tables | Slow queries, insert failures, replication lag. | Managed by ClickHouse Cloud |
| AWS CloudTrail | IAM and API-level audit log for all AWS calls. | 90 days (S3 archive) |
| Severity | Response Time | Channel | Examples |
| --- | --- | --- | --- |
| P1 - Critical | < 5 min | PagerDuty + Slack #incidents | API 5xx rate > 5%, database failover, Redis cluster down. |
| P2 - High | < 30 min | PagerDuty + Slack #incidents | API latency p99 > 2s for 5 min, BullMQ queue depth > 500, failed deployment. |
| P3 - Medium | < 4 hours | Slack #ops-alerts | Coupon low inventory, pg_cron job failure, cert expiry < 30 days. |
| P4 - Low | Next biz day | Jira ticket auto-created | Sentry new issue (no spike), CloudTrail unusual API call pattern. |
| Metric | Warning | Critical | Resolution |
| --- | --- | --- | --- |
| API error rate (5xx) | > 1% for 2 min | > 5% for 2 min | Check ECS task logs; potential deploy issue or DB error. |
| API p99 latency | > 1000ms for 5 min | > 2000ms for 5 min | Check slow query log; check Redis hit rate. |
| RDS CPU | > 70% for 10 min | > 90% for 5 min | Check top queries in Performance Insights; scale read replica. |
| RDS storage | < 20% free | < 10% free | Extend storage via RDS modify (can be done online). |
| Redis memory usage | > 70% | > 90% | Review key TTLs; increase cache tier. |
| BullMQ failed jobs/hour | > 10 | > 50 | Check worker logs; potential third-party service outage. |
| BullMQ queue depth (webhook) | > 100 | > 500 | Scale worker count; check target endpoint health. |
| EC2 disk usage | > 70% full | > 85% full | Clear log files; review tmpdir for large files. |
| ClickHouse insert lag | > 5s | > 30s | Check ClickHouse cluster health; throttle inserts. |
| Standard production dashboard at: https://app.datadoghq.com/dashboard/spinplatform-prod

Panel inventory:
  - API request rate + error rate (timeseries)
  - Latency percentiles p50 / p95 / p99 (timeseries)
  - Active spin sessions (count)
  - Spins per minute (timeseries)
  - Coupon redemptions today (counter)
  - BullMQ queue depth by queue name (gauge)
  - RDS connections + CPU + IOPS (multi-series)
  - Redis hit rate + memory (gauge)
  - Top 10 slow endpoints (table)
  - Sentry error volume (timeseries) |
| --- |
| Check | Status | Verification Method |
| --- | --- | --- |
| TLS 1.2+ enforced on ALB; TLS 1.0/1.1 disabled. | Required | aws elbv2 describe-load-balancer-attributes |
| HSTS header present with max-age >= 31536000. | Required | curl -I https://api.spinplatform.io | grep strict |
| Cloudflare WAF OWASP ruleset active. | Required | Cloudflare dashboard > Security > WAF |
| All EC2 instances in private subnet; no public IPs. | Required | AWS EC2 console or aws ec2 describe-instances |
| Security groups follow least-privilege (deny by default). | Required | aws ec2 describe-security-groups |
| S3 bucket Block Public Access = enabled on all buckets. | Required | aws s3api get-public-access-block |
| RDS publicly_accessible = false. | Required | aws rds describe-db-instances |
| Check | Status | Verification Method |
| --- | --- | --- |
| JWT_SECRET is >= 256-bit random; not reused across envs. | Required | Check AWS Secrets Manager entry creation date + entropy. |
| Refresh tokens hashed with bcrypt cost >= 12. | Required | Code review: BCRYPT_COST_FACTOR env variable. |
| AWS IAM roles use least-privilege; no wildcard actions. | Required | IAM Access Analyzer findings = 0 critical. |
| No secrets in environment variables at ECS task level. | Required | All secrets injected from Secrets Manager via secretsFrom. |
| Stripe webhook signature verified on every inbound event. | Required | Code review: stripe.webhooks.constructEvent() present. |
| JWT_SECRET rotated in the last 90 days. | Required | AWS Secrets Manager last-rotated date. |
| MFA enabled for all AWS IAM users with console access. | Required | aws iam list-mfa-devices for each user. |
| Check | Status | Verification Method |
| --- | --- | --- |
| All SQL queries use parameterised statements (no string concatenation). | Required | Code grep: search for raw query string concatenation patterns. |
| Input validation on all API endpoints (zod or joi schemas). | Required | Code review: every route handler has validateBody/validateQuery. |
| Rate limiting active on /spin and /auth/* endpoints. | Required | Redis: scan 0 match rate:* count 10 to verify keys exist. |
| CORS restricted to registered client domains only. | Required | curl with bad Origin header - check response headers. |
| Embed token entropy: crypto.randomBytes(32). | Required | Code review: embed_token generation in wheel creation flow. |
| PII encrypted at rest via KMS envelope encryption. | Required | Code review: kms.encrypt() calls for email fields. |
| npm audit shows 0 high/critical vulnerabilities. | Required | Run: npm audit --audit-level=high |
| Snyk IaC scan shows 0 critical issues. | Required | GitHub Actions security scan stage output. |
| Content-Security-Policy header set on dashboard frontend. | Required | curl -I https://dashboard.spinplatform.io | grep content-security |
| Widget Shadow DOM prevents CSS bleed-through. | Required | Browser DevTools: confirm attachShadow({mode: closed}) call. |
| Check | Status | Verification Method |
| --- | --- | --- |
| GDPR anonymisation pg_cron job active and running. | Required | SELECT * FROM cron.job WHERE jobname = gdpr_anonymise; |
| Audit log immutability triggers present on audit_logs. | Required | psql: check prevent_audit_log_modification function exists |
| Spin results immutability trigger present on spin_results. | Required | psql: check prevent_spin_result_modification function exists |
| RDS encryption at rest enabled (AES-256). | Required | aws rds describe-db-instances --query StorageEncrypted |
| S3 server-side encryption enabled (SSE-S3 or SSE-KMS). | Required | aws s3api get-bucket-encryption |
| Data Processing Agreement signed with all sub-processors. | Required | Legal: DPA tracker spreadsheet (monthly review). |
| Metric | Target | Scope |
| --- | --- | --- |
| RTO (Recovery Time Objective) | < 30 minutes | Full service restoration after primary failure. |
| RPO (Recovery Point Objective) | < 5 minutes | Maximum data loss window (RDS transaction log shipping). |
| MTTR (Mean Time to Restore) | < 60 minutes | Target for all P1 incidents. |
| Backup Verification | Monthly | Full restore test into isolated environment. |
| Component | Method | Frequency | Retention | Restore SLA |
| --- | --- | --- | --- | --- |
| PostgreSQL (RDS) | Automated RDS snapshots + continuous transaction log backup | Continuous (PITR) | 35 days | < 10 min for PITR to any second |
| PostgreSQL (manual) | pg_dump full backup to S3 via Lambda cron | Daily at 02:00 UTC | 90 days | < 30 min to restore full dump |
| Redis (ElastiCache) | RDB persistence snapshot to S3 | Every 12 hours | 7 days | < 5 min (new cluster + snapshot) |
| S3 (uploads/exports) | S3 Versioning + cross-region replication to us-west-2 | Continuous (versioned) | Indefinite | Immediate (versioning rollback) |
| Cloudflare R2 (widget) | Re-deploy from ECR image tag (reproducible build) | Per deploy | All ECR image tags | < 15 min (CDN re-deploy) |
| ClickHouse (analytics) | ClickHouse Cloud managed backups | Daily | 30 days | < 60 min (analytics non-critical) |
| Secrets (AWS SM) | AWS Secrets Manager automatic replication | Continuous | Indefinite | Immediate (read from SM) |
| Scenario | Auto or Manual | Steps |
| --- | --- | --- |
| RDS primary fails | Automatic (Multi-AZ) | RDS promotes standby in < 60s. DNS CNAME flips automatically. Monitor: aws rds describe-events. |
| EC2 API node fails | Automatic (ALB health check) | ALB removes unhealthy instance. ASG launches replacement within 3 min. No action needed. |
| Redis node fails | Automatic (cluster failover) | ElastiCache promotes replica. Application reconnects via cluster endpoint (static DNS). |
| Full AZ outage | Manual | 1. Verify RDS Multi-AZ failed over. 2. Verify ASG replaced instances in surviving AZ. 3. If ASG stuck: manually terminate failed instances. 4. Post status update. |
| Accidental data delete | Manual | 1. Set MAINTENANCE_MODE=true. 2. RDS PITR restore to T-5min in isolated VPC. 3. Identify deleted rows via audit_logs. 4. Migrate rows back via psql import. 5. Restore MAINTENANCE_MODE=false. |
| Compromised JWT_SECRET | Manual | 1. Rotate secret in AWS Secrets Manager. 2. Force new ECS deployment (restarts all API tasks). 3. All existing tokens invalidated. 4. Users must re-login. 5. Send incident comms. |
| Corrupted widget bundle | Manual | 1. Identify last good ECR image tag. 2. Re-deploy from that tag. 3. Cloudflare cache purge --tag widget. 4. Verify with curl against CDN URL. |
| Monthly test (first Monday of each month, performed by on-call engineer):

  1. Create isolated test VPC (use Terraform module: infra/test-restore-vpc).
  2. Restore RDS snapshot (latest automated) to db.t3.micro in test VPC.
  3. Run schema integrity check: SELECT COUNT(*) FROM clients, wheels, spin_results;
  4. Restore Redis snapshot to ElastiCache test cluster.
  5. Run smoke API test suite against test environment.
  6. Document results in #ops-logs Slack; update DR test tracker spreadsheet.
  7. Destroy test VPC.
  8. Confirm next test date. |
| --- |
| Tool | Required Version | Install |
| --- | --- | --- |
| Node.js | 20 LTS (20.x.x) | nvm install 20 && nvm use 20 |
| npm | >= 10.x | Comes with Node.js 20 |
| Docker | >= 24.x | Docker Desktop (Mac/Windows) or docker-ce (Linux) |
| Docker Compose | >= 2.x (v2) | Bundled with Docker Desktop; or: apt install docker-compose-plugin |
| Git | >= 2.40 | Pre-installed on macOS/Linux; git-scm.com on Windows |
| psql | >= 16 | brew install postgresql@16 (for CLI tooling; DB runs in Docker) |
| AWS CLI | >= 2.x | brew install awscli (optional: only needed for S3/KMS local testing) |
| Step | Action | Commands / Notes |
| --- | --- | --- |
| 1 | Clone repository | git clone git@github.com:spinplatform/api.git && cd api |
| 2 | Install dependencies | npm install |
| 3 | Copy env template | cp .env.example .env.local
# Edit .env.local: set JWT_SECRET, STRIPE_SECRET_KEY, SENDGRID_API_KEY
# For local dev, use test/sandbox keys only |
| 4 | Start Docker services | docker compose up -d
# Starts: PostgreSQL 16 (port 5432), Redis 7 (port 6379),
#         ClickHouse (port 8123), MinIO (port 9000) |
| 5 | Run database migrations | npm run db:migrate
# Applies all migration files in /migrations to local PostgreSQL |
| 6 | Seed development data | npm run db:seed
# Creates 1 test client, 2 users (admin + member),
# 1 wheel with 6 segments, 10 test coupon codes |
| 7 | Start API server | npm run dev
# Starts Express API on http://localhost:3000
# Starts BullMQ worker process
# Hot-reload via ts-node-dev |
| 8 | Start widget dev server | cd ../widget && npm install && npm run dev
# Starts Vite dev server on http://localhost:3001 |
| 9 | Verify setup | curl http://localhost:3000/health
# Expected: { status: ok, db: ok, redis: ok, timestamp: ... } |
| 10 | Run test suite | npm run test && npm run test:integration
# All tests should pass against local Docker services |
| File: docker-compose.yml

Services and exposed ports:
  postgres      -> localhost:5432   (db: spinplatform, user: spinuser, password: spinpass)
  redis         -> localhost:6379   (no auth for local dev)
  clickhouse    -> localhost:8123   (HTTP), 9000 (native)
  minio         -> localhost:9000   (access key: minioadmin, secret: minioadmin)
  minio-console -> localhost:9001   (MinIO web UI)

Useful commands:
  docker compose logs -f postgres   - tail PostgreSQL logs
  docker compose restart redis      - restart single service
  docker compose down -v            - stop all + delete volumes (full reset) |
| --- |
| Command | Purpose |
| --- | --- |
| npm run dev | Start API in watch mode (ts-node-dev + BullMQ worker). |
| npm run test | Run unit tests (Jest) - no Docker required. |
| npm run test:integration | Run integration tests (requires Docker services running). |
| npm run test:coverage | Run unit + integration tests with coverage report. |
| npm run db:migrate | Apply pending SQL migrations. |
| npm run db:migrate:down | Roll back last migration batch. |
| npm run db:seed | Insert development seed data. |
| npm run db:reset | Drop + recreate database + run all migrations + seed. |
| npm run lint | Run ESLint on all TypeScript files. |
| npm run typecheck | Run tsc --noEmit (no output, type errors only). |
| npm run build | Compile TypeScript to /dist for production. |
| npm run worker | Start BullMQ worker standalone (useful for queue debugging). |
| Recommended: Visual Studio Code with extensions:
  - ESLint (dbaeumer.vscode-eslint)
  - Prettier (esbenp.prettier-vscode)
  - PostgreSQL (ckolkman.vscode-postgres)
  - Thunder Client or REST Client (for API testing)
  - GitLens (eamodio.gitlens)

Settings (already in .vscode/settings.json in repo):
  editor.formatOnSave: true
  editor.defaultFormatter: esbenp.prettier-vscode
  typescript.tsdk: node_modules/typescript/lib |
| --- |
| # .env.example - copy to .env.local and fill in real values
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
DATABASE_URL=postgresql://spinuser:spinpass@localhost:5432/spinplatform
REDIS_URL=redis://localhost:6379
JWT_SECRET=CHANGE_ME_TO_256_BIT_RANDOM_HEX
JWT_EXPIRY_SECONDS=900
REFRESH_TOKEN_EXPIRY_DAYS=30
BCRYPT_COST_FACTOR=10
ENCRYPTION_KEY_ARN=local-mock
PLATFORM_BASE_URL=http://localhost:3000
WIDGET_CDN_BASE_URL=http://localhost:3001
AWS_REGION=us-east-1
AWS_S3_BUCKET=spinplatform-local
STRIPE_SECRET_KEY=sk_test_XXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXX
SENDGRID_API_KEY=SG.XXXX
CLICKHOUSE_URL=http://localhost:8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
CRON_SECRET=local-dev-cron-secret
SPIN_LOCK_TTL_SECONDS=10
SESSION_EXPIRY_HOURS=24
# SENTRY_DSN=       # Leave blank for local dev
# DATADOG_API_KEY=  # Leave blank for local dev |
| --- |
| Version | Date | Author | Change Summary |
| --- | --- | --- | --- |
| 1.0 | 2025-01-15 | Platform Engineering | Initial release covering all 10 DevOps and environment specification sections. |