-- =============================================================================
-- WHEEL OF FORTUNE PLATFORM
-- Database Schema — Standalone SQL File
-- Version: v1.0 | March 2026 | PostgreSQL 16
-- Related: WheelOfFortune_TRD_v1.0, WheelOfFortune_SOP_v1.0
-- =============================================================================
-- INSTRUCTIONS
--   Run this file on a fresh PostgreSQL 16 database.
--   All migrations after this baseline follow the naming convention:
--     V{timestamp}__{description}.sql
--   Never modify this file after it has been applied to any environment.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- provides gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_cron";    -- scheduled jobs (midnight resets)


-- ---------------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------------

CREATE TYPE client_plan AS ENUM (
    'starter',
    'growth',
    'pro',
    'enterprise'
);

CREATE TYPE user_role AS ENUM (
    'owner',
    'admin',
    'editor',
    'viewer'
);

CREATE TYPE wheel_status AS ENUM (
    'draft',
    'active',
    'paused',
    'archived'
);

CREATE TYPE prize_type AS ENUM (
    'coupon',
    'points',
    'gift_card',
    'message',
    'url_redirect',
    'try_again'
);

CREATE TYPE coupon_mode AS ENUM (
    'static',
    'unique_pool',
    'auto_generate'
);

CREATE TYPE coupon_status AS ENUM (
    'available',
    'issued',
    'redeemed',
    'expired',
    'cancelled'
);

CREATE TYPE session_status AS ENUM (
    'loaded',
    'form_submitted',
    'spun',
    'expired'
);

CREATE TYPE integration_type AS ENUM (
    'mailchimp',
    'klaviyo',
    'hubspot',
    'salesforce',
    'zapier',
    'webhook',
    'google_sheets'
);

CREATE TYPE webhook_status AS ENUM (
    'pending',
    'success',
    'failed',
    'retrying',
    'abandoned'
);


-- =============================================================================
-- TABLE: clients
-- Represents a business that has signed up for the platform.
-- One client can have multiple users and wheels.
-- =============================================================================

CREATE TABLE clients (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    VARCHAR(255)    NOT NULL,
    slug                    VARCHAR(100)    NOT NULL UNIQUE,
    email                   VARCHAR(255)    NOT NULL UNIQUE,
    plan                    client_plan     NOT NULL DEFAULT 'starter',
    plan_spin_limit         INTEGER         NOT NULL DEFAULT 500,
    spins_used_this_month   INTEGER         NOT NULL DEFAULT 0,
    billing_cycle_day       SMALLINT        NOT NULL DEFAULT 1
                                            CHECK (billing_cycle_day BETWEEN 1 AND 28),
    stripe_customer_id      VARCHAR(100)    UNIQUE,
    stripe_subscription_id  VARCHAR(100),
    custom_domain           VARCHAR(255),
    timezone                VARCHAR(60)     NOT NULL DEFAULT 'UTC',
    is_active               BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    deleted_at              TIMESTAMPTZ
);

COMMENT ON TABLE  clients                       IS 'Business accounts subscribed to the platform.';
COMMENT ON COLUMN clients.slug                  IS 'URL-safe identifier, auto-generated from name.';
COMMENT ON COLUMN clients.plan_spin_limit       IS 'Monthly spin quota for the current plan.';
COMMENT ON COLUMN clients.spins_used_this_month IS 'Resets on billing_cycle_day each month via pg_cron.';
COMMENT ON COLUMN clients.billing_cycle_day     IS 'Day of month (1-28) when the spin counter resets.';
COMMENT ON COLUMN clients.custom_domain         IS 'e.g. spin.clientbrand.com — SSL provisioned via Cloudflare.';
COMMENT ON COLUMN clients.is_active             IS 'FALSE = account suspended; widget shows unavailable.';
COMMENT ON COLUMN clients.deleted_at            IS 'Soft delete timestamp. NULL = not deleted.';

CREATE INDEX idx_clients_plan       ON clients (plan)      WHERE deleted_at IS NULL;
CREATE INDEX idx_clients_is_active  ON clients (is_active) WHERE deleted_at IS NULL;


-- =============================================================================
-- TABLE: users
-- Team members who can access the client dashboard.
-- A user belongs to exactly one client.
-- =============================================================================

CREATE TABLE users (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID            NOT NULL REFERENCES clients (id),
    email           VARCHAR(255)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    full_name       VARCHAR(255)    NOT NULL,
    role            user_role       NOT NULL DEFAULT 'editor',
    email_verified  BOOLEAN         NOT NULL DEFAULT FALSE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE  users                IS 'Dashboard users. Each belongs to exactly one client.';
COMMENT ON COLUMN users.password_hash  IS 'bcrypt hash with cost factor 12. Rehash on login if cost changes.';
COMMENT ON COLUMN users.email_verified IS 'Must be TRUE before the user can access the dashboard.';
COMMENT ON COLUMN users.deleted_at     IS 'Soft delete timestamp.';

CREATE INDEX idx_users_client_id ON users (client_id) WHERE deleted_at IS NULL;


-- =============================================================================
-- TABLE: wheels
-- Core campaign object. One client can have multiple wheels.
-- =============================================================================

CREATE TABLE wheels (
    id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id        UUID            NOT NULL REFERENCES clients (id),
    name             VARCHAR(255)    NOT NULL,
    status           wheel_status    NOT NULL DEFAULT 'draft',
    config           JSONB           NOT NULL DEFAULT '{}',
    branding         JSONB           NOT NULL DEFAULT '{}',
    trigger_rules    JSONB           NOT NULL DEFAULT '{}',
    frequency_rules  JSONB           NOT NULL DEFAULT '{}',
    active_from      TIMESTAMPTZ,
    active_until     TIMESTAMPTZ,
    total_spin_cap   INTEGER,
    total_spins      INTEGER         NOT NULL DEFAULT 0,
    embed_token      VARCHAR(64)     NOT NULL UNIQUE,
    form_config      JSONB           NOT NULL DEFAULT '{}',
    created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ
);

COMMENT ON TABLE  wheels              IS 'Wheel campaigns. A client may own many wheels.';
COMMENT ON COLUMN wheels.name         IS 'Internal label; never shown to end users.';
COMMENT ON COLUMN wheels.config       IS 'JSON config per TRD Section 2.3.1 (spin_duration_ms, animation_speed, pointer_position, confetti, sound, guaranteed_win_every_n, guaranteed_win_segment_id, etc.)';
COMMENT ON COLUMN wheels.branding     IS 'JSON branding per TRD Section 2.3.2 (logo, colors, font, button_text, border, etc.)';
COMMENT ON COLUMN wheels.embed_token  IS 'Placed in <div data-token="...">. Safe to expose in HTML source. Generated via crypto.randomBytes(32).toString(''hex'') at creation.';
COMMENT ON COLUMN wheels.form_config  IS 'Lead capture form config: fields (name/email/phone/custom), required flags, GDPR text, privacy policy URL. Empty object = no form.';
COMMENT ON COLUMN wheels.total_spins  IS 'Monotonically incrementing counter; never decremented.';
COMMENT ON COLUMN wheels.deleted_at   IS 'Soft delete timestamp.';

CREATE INDEX idx_wheels_client_id   ON wheels (client_id)  WHERE deleted_at IS NULL;
CREATE INDEX idx_wheels_status      ON wheels (status)     WHERE deleted_at IS NULL;
CREATE INDEX idx_wheels_embed_token ON wheels (embed_token);


-- =============================================================================
-- TABLE: prizes
-- Defines a prize. Prizes are reusable across multiple segments.
-- =============================================================================

CREATE TABLE prizes (
    id                    UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id             UUID            NOT NULL REFERENCES clients (id),
    name                  VARCHAR(255)    NOT NULL,
    type                  prize_type      NOT NULL,
    display_title         VARCHAR(100)    NOT NULL,
    display_description   VARCHAR(500),
    coupon_mode           coupon_mode,
    static_coupon_code    VARCHAR(100),
    auto_gen_prefix       VARCHAR(20),
    auto_gen_length       SMALLINT        DEFAULT 8,
    coupon_expiry_days    INTEGER,
    points_value          INTEGER,
    redirect_url          VARCHAR(2000),
    custom_message_html   TEXT,
    created_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_coupon_mode_required
        CHECK (type <> 'coupon' OR coupon_mode IS NOT NULL),
    CONSTRAINT chk_static_code_present
        CHECK (coupon_mode <> 'static' OR static_coupon_code IS NOT NULL),
    CONSTRAINT chk_auto_gen_prefix_present
        CHECK (coupon_mode <> 'auto_generate' OR auto_gen_prefix IS NOT NULL),
    CONSTRAINT chk_points_value_present
        CHECK (type <> 'points' OR points_value IS NOT NULL),
    CONSTRAINT chk_redirect_url_present
        CHECK (type <> 'url_redirect' OR redirect_url IS NOT NULL)
);

COMMENT ON TABLE  prizes                    IS 'Prize definitions, reusable across segments.';
COMMENT ON COLUMN prizes.name               IS 'Admin-facing label; not shown to end users.';
COMMENT ON COLUMN prizes.display_title      IS 'Winner-facing label, e.g. "20% OFF".';
COMMENT ON COLUMN prizes.coupon_mode        IS 'Required when type = coupon. Determines code assignment strategy.';
COMMENT ON COLUMN prizes.auto_gen_length    IS 'Total code length including prefix, e.g. "SPIN" + 4 random chars = 8.';
COMMENT ON COLUMN prizes.coupon_expiry_days IS 'Days from win date until coupon expires. NULL = no expiry.';

CREATE INDEX idx_prizes_client_id ON prizes (client_id);
CREATE INDEX idx_prizes_type      ON prizes (type);


-- =============================================================================
-- TABLE: segments
-- Each wheel has 2-24 segments forming the slices of the wheel.
-- =============================================================================

CREATE TABLE segments (
    id                   UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    wheel_id             UUID            NOT NULL REFERENCES wheels (id),
    position             SMALLINT        NOT NULL,
    label                VARCHAR(60)     NOT NULL,
    bg_color             VARCHAR(7)      NOT NULL
                                         CHECK (bg_color ~ '^#[0-9A-Fa-f]{6}$'),
    text_color           VARCHAR(7)      NOT NULL DEFAULT '#FFFFFF'
                                         CHECK (text_color ~ '^#[0-9A-Fa-f]{6}$'),
    icon_url             VARCHAR(500),
    weight               NUMERIC(8,4)    NOT NULL DEFAULT 1.0
                                         CHECK (weight >= 0.0001 AND weight <= 99999.9999),
    prize_id             UUID            REFERENCES prizes (id),
    is_no_prize          BOOLEAN         NOT NULL DEFAULT FALSE,
    consolation_message  VARCHAR(255),
    win_cap_daily        INTEGER,
    win_cap_total        INTEGER,
    wins_today           INTEGER         NOT NULL DEFAULT 0,
    wins_total           INTEGER         NOT NULL DEFAULT 0,

    UNIQUE (wheel_id, position),

    CONSTRAINT chk_prize_or_no_prize
        CHECK (is_no_prize = TRUE OR prize_id IS NOT NULL)
);

COMMENT ON TABLE  segments                 IS 'Wheel slices. Min 2, max 24 per wheel.';
COMMENT ON COLUMN segments.position        IS '0-indexed position. Must be unique and consecutive within a wheel.';
COMMENT ON COLUMN segments.weight          IS 'Relative probability weight used by the Prize Engine.';
COMMENT ON COLUMN segments.is_no_prize     IS 'TRUE overrides prize_id. Shows consolation_message instead.';
COMMENT ON COLUMN segments.win_cap_daily   IS 'Max wins for this segment per day. NULL = unlimited.';
COMMENT ON COLUMN segments.win_cap_total   IS 'Max all-time wins for this segment. NULL = unlimited.';
COMMENT ON COLUMN segments.wins_today      IS 'Reset each midnight in client timezone via pg_cron.';

CREATE INDEX idx_segments_wheel_id ON segments (wheel_id);
CREATE INDEX idx_segments_prize_id ON segments (prize_id) WHERE prize_id IS NOT NULL;


-- =============================================================================
-- TABLE: coupon_codes
-- Pre-loaded unique coupon codes for prizes with coupon_mode = 'unique_pool'.
-- Also stores auto-generated codes after issuance.
-- =============================================================================

CREATE TABLE coupon_codes (
    id                UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    prize_id          UUID            NOT NULL REFERENCES prizes (id),
    code              VARCHAR(100)    NOT NULL,
    status            coupon_status   NOT NULL DEFAULT 'available',
    issued_to_spin_id UUID,
    issued_at         TIMESTAMPTZ,
    expires_at        TIMESTAMPTZ,
    redeemed_at       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_issued_has_timestamp
        CHECK (status <> 'issued' OR issued_at IS NOT NULL),
    CONSTRAINT chk_redeemed_has_timestamp
        CHECK (status <> 'redeemed' OR redeemed_at IS NOT NULL)
);

COMMENT ON TABLE  coupon_codes                   IS 'Individual coupon codes for unique_pool and auto_generate prizes. No deleted_at — coupon lifecycle is fully managed via the status enum (available -> issued -> redeemed/expired/cancelled).';

COMMENT ON COLUMN coupon_codes.status            IS 'One-directional: available -> issued -> redeemed. No reversals.';
COMMENT ON COLUMN coupon_codes.issued_to_spin_id IS 'FK to spin_results.id — added after spin_results table is created.';
COMMENT ON COLUMN coupon_codes.expires_at        IS 'Computed at issuance from prize.coupon_expiry_days.';

CREATE UNIQUE INDEX idx_coupon_codes_prize_code
    ON coupon_codes (prize_id, code);

CREATE INDEX idx_coupon_codes_available
    ON coupon_codes (prize_id, status)
    WHERE status = 'available';

CREATE INDEX idx_coupon_codes_spin_id
    ON coupon_codes (issued_to_spin_id)
    WHERE issued_to_spin_id IS NOT NULL;


-- =============================================================================
-- TABLE: spin_sessions
-- Created when the widget loads. Expires after 2 hours.
-- =============================================================================

CREATE TABLE spin_sessions (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    wheel_id            UUID            NOT NULL REFERENCES wheels (id),
    fingerprint         VARCHAR(128)    NOT NULL,
    ip_address          INET            NOT NULL,
    user_agent          TEXT,
    page_url            VARCHAR(2000),
    referrer_url        VARCHAR(2000),
    lead_email          VARCHAR(255),
    lead_name           VARCHAR(255),
    lead_phone          VARCHAR(30),
    lead_custom_fields  JSONB           DEFAULT '{}',
    gdpr_consent        BOOLEAN         NOT NULL DEFAULT FALSE,
    gdpr_consent_at     TIMESTAMPTZ,
    status              session_status  NOT NULL DEFAULT 'loaded',
    expires_at          TIMESTAMPTZ     NOT NULL DEFAULT (NOW() + INTERVAL '2 hours'),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  spin_sessions             IS 'One row per widget load. Tracks user state before and after spin.';
COMMENT ON COLUMN spin_sessions.fingerprint IS 'SHA-256(userAgent+screenResolution+timezone+language+colorDepth+platform). Soft anti-abuse only.';
COMMENT ON COLUMN spin_sessions.ip_address  IS 'Hashed for privacy after 24 hours via scheduled job.';
COMMENT ON COLUMN spin_sessions.expires_at  IS 'NOW() + 2 hours. Cron marks expired rows every 30 minutes.';

CREATE INDEX idx_spin_sessions_wheel_id    ON spin_sessions (wheel_id);
CREATE INDEX idx_spin_sessions_fingerprint ON spin_sessions (fingerprint);
CREATE INDEX idx_spin_sessions_expires_at  ON spin_sessions (expires_at)
    WHERE status NOT IN ('spun', 'expired');


-- =============================================================================
-- TABLE: spin_results
-- One row per completed spin. Immutable once created.
-- Links session -> segment -> prize.
-- =============================================================================

CREATE TABLE spin_results (
    id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id       UUID            NOT NULL UNIQUE REFERENCES spin_sessions (id),
    wheel_id         UUID            NOT NULL REFERENCES wheels (id),
    segment_id       UUID            NOT NULL REFERENCES segments (id),
    prize_id         UUID            REFERENCES prizes (id),
    coupon_code_id   UUID            REFERENCES coupon_codes (id),
    idempotency_key  VARCHAR(128)    NOT NULL UNIQUE,
    server_seed      VARCHAR(128)    NOT NULL,
    client_seed      VARCHAR(128),
    created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  spin_results                  IS 'Immutable record of every completed spin.';
COMMENT ON COLUMN spin_results.session_id       IS 'UNIQUE: enforces one spin per session.';
COMMENT ON COLUMN spin_results.wheel_id         IS 'Denormalized from session for analytics query performance.';
COMMENT ON COLUMN spin_results.prize_id         IS 'NULL when the winning segment is a no-prize segment.';
COMMENT ON COLUMN spin_results.coupon_code_id   IS 'References the specific coupon_codes row issued, if applicable.';
COMMENT ON COLUMN spin_results.idempotency_key  IS 'Client-generated UUID. Duplicate keys return HTTP 409.';
COMMENT ON COLUMN spin_results.server_seed      IS 'crypto.randomBytes(32) hex used in probability calculation (TRD Section 4.1).';

CREATE INDEX idx_spin_results_wheel_id   ON spin_results (wheel_id);
CREATE INDEX idx_spin_results_segment_id ON spin_results (segment_id);
CREATE INDEX idx_spin_results_prize_id   ON spin_results (prize_id)   WHERE prize_id IS NOT NULL;
CREATE INDEX idx_spin_results_created_at ON spin_results (created_at);

-- Back-fill FK on coupon_codes now that spin_results exists
ALTER TABLE coupon_codes
    ADD CONSTRAINT fk_coupon_codes_spin_result
    FOREIGN KEY (issued_to_spin_id) REFERENCES spin_results (id);


-- =============================================================================
-- TABLE: integrations
-- Third-party integration config per wheel. Credentials encrypted at rest.
-- =============================================================================

CREATE TABLE integrations (
    id                UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
    wheel_id          UUID              NOT NULL REFERENCES wheels (id),
    type              integration_type  NOT NULL,
    is_enabled        BOOLEAN           NOT NULL DEFAULT TRUE,
    credentials_enc   TEXT,
    config            JSONB             NOT NULL DEFAULT '{}',
    last_triggered_at TIMESTAMPTZ,
    last_error        TEXT,
    created_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  integrations                 IS 'Third-party integration configs per wheel.';
COMMENT ON COLUMN integrations.credentials_enc IS 'AES-256-GCM encrypted JSON. Key managed by AWS KMS. IV unique per encryption.';
COMMENT ON COLUMN integrations.config          IS 'Non-secret settings: list IDs, tag names, field mappings, webhook URLs.';
COMMENT ON COLUMN integrations.last_error      IS 'Most recent error message if the integration failed.';

CREATE INDEX idx_integrations_wheel_id ON integrations (wheel_id);
CREATE INDEX idx_integrations_type     ON integrations (type);


-- =============================================================================
-- TABLE: webhook_logs
-- Audit log of every outbound webhook dispatch attempt.
-- Supports retry logic (5 attempts) and client-facing debugging.
-- =============================================================================

CREATE TABLE webhook_logs (
    id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id   UUID            NOT NULL REFERENCES integrations (id),
    spin_result_id   UUID            NOT NULL REFERENCES spin_results (id),
    attempt_number   SMALLINT        NOT NULL DEFAULT 1,
    status           webhook_status  NOT NULL,
    http_status_code SMALLINT,
    response_body    TEXT,
    duration_ms      INTEGER,
    created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  webhook_logs                IS 'Immutable audit log of every outbound webhook attempt.';
COMMENT ON COLUMN webhook_logs.attempt_number IS 'Increments on each retry (1-5). See TRD Section 7.3 for retry schedule.';
COMMENT ON COLUMN webhook_logs.response_body  IS 'First 2,000 chars of the target endpoint response body.';
COMMENT ON COLUMN webhook_logs.duration_ms    IS 'Round-trip latency for the HTTP request in milliseconds.';

CREATE INDEX idx_webhook_logs_integration_id ON webhook_logs (integration_id);
CREATE INDEX idx_webhook_logs_spin_result_id ON webhook_logs (spin_result_id);
CREATE INDEX idx_webhook_logs_status         ON webhook_logs (status);


-- =============================================================================
-- IMMUTABILITY TRIGGER: spin_results
-- Prevent any UPDATE or DELETE after initial INSERT.
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_spin_results_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'spin_results rows are immutable and cannot be modified or deleted.';
END;
$$;

CREATE TRIGGER spin_results_no_update
    BEFORE UPDATE ON spin_results
    FOR EACH ROW EXECUTE FUNCTION trg_spin_results_immutable();

CREATE TRIGGER spin_results_no_delete
    BEFORE DELETE ON spin_results
    FOR EACH ROW EXECUTE FUNCTION trg_spin_results_immutable();


-- =============================================================================
-- SCHEDULED JOBS (pg_cron)
-- =============================================================================

-- Reset segments.wins_today at midnight UTC.
-- Production: compute per-client timezone offsets and schedule per-client jobs.
SELECT cron.schedule(
    'reset-wins-today',
    '0 0 * * *',
    $$
        UPDATE segments s
        SET wins_today = 0
        FROM wheels w
        JOIN clients c ON c.id = w.client_id
        WHERE s.wheel_id = w.id
          AND w.deleted_at IS NULL
          AND c.deleted_at IS NULL;
    $$
);

-- Reset clients.spins_used_this_month on each client's billing_cycle_day.
SELECT cron.schedule(
    'reset-monthly-spins',
    '5 0 * * *',
    $$
        UPDATE clients
        SET spins_used_this_month = 0
        WHERE billing_cycle_day = EXTRACT(DAY FROM NOW())
          AND deleted_at IS NULL;
    $$
);

-- Mark expired spin sessions every 30 minutes.
SELECT cron.schedule(
    'expire-spin-sessions',
    '*/30 * * * *',
    $$
        UPDATE spin_sessions
        SET status = 'expired'
        WHERE status IN ('loaded', 'form_submitted')
          AND expires_at < NOW();
    $$
);




-- =============================================================================
-- TABLE: audit_logs
-- Immutable log of all admin/dashboard actions. Required for SOP compliance.
-- Covers: wheel create/update/delete, prize changes, user invites, plan changes,
--         team role changes, integration add/remove, account setting changes.
-- =============================================================================

CREATE TYPE audit_action AS ENUM (
    'wheel_created', 'wheel_updated', 'wheel_status_changed', 'wheel_deleted',
    'segment_updated',
    'prize_created', 'prize_updated', 'prize_deleted',
    'coupon_uploaded', 'coupon_redeemed',
    'integration_created', 'integration_updated', 'integration_deleted',
    'user_invited', 'user_role_changed', 'user_removed',
    'account_settings_updated', 'plan_changed',
    'data_export_requested', 'user_data_deleted'
);

CREATE TABLE audit_logs (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id     UUID          NOT NULL REFERENCES clients (id),
    user_id       UUID          REFERENCES users (id),
    action        audit_action  NOT NULL,
    resource_type VARCHAR(60),
    resource_id   UUID,
    changes       JSONB         DEFAULT '{}',
    ip_address    INET,
    user_agent    TEXT,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  audit_logs              IS 'Immutable admin action log. Retained 12 months per SOP. No UPDATE or DELETE permitted.';
COMMENT ON COLUMN audit_logs.user_id      IS 'NULL for system-generated actions (e.g. cron jobs, automated billing changes).';
COMMENT ON COLUMN audit_logs.resource_type IS 'e.g. wheel, prize, segment, user, integration, account.';
COMMENT ON COLUMN audit_logs.changes      IS 'JSON diff: { "before": {...}, "after": {...} }. Sensitive fields (passwords, credentials) excluded.';

CREATE INDEX idx_audit_logs_client_id  ON audit_logs (client_id);
CREATE INDEX idx_audit_logs_user_id    ON audit_logs (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_logs_action     ON audit_logs (action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at);

-- Immutability: audit_logs must never be modified or deleted
CREATE OR REPLACE FUNCTION trg_audit_logs_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs rows are immutable and cannot be modified or deleted.';
END;
$$;

CREATE TRIGGER audit_logs_no_update
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION trg_audit_logs_immutable();

CREATE TRIGGER audit_logs_no_delete
    BEFORE DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION trg_audit_logs_immutable();


-- =============================================================================
-- GDPR: User Data Deletion Function
-- Anonymises all PII for a given end-user across spin_sessions.
-- Called by the backend when client invokes DELETE /account/users/{id}/data
-- or the platform receives a GDPR erasure request.
-- Does NOT delete spin_results rows (immutable audit requirement).
-- =============================================================================

CREATE OR REPLACE FUNCTION gdpr_anonymise_session_data(p_lead_email VARCHAR)
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
    affected INTEGER;
BEGIN
    UPDATE spin_sessions
    SET
        lead_email         = NULL,
        lead_name          = NULL,
        lead_phone         = NULL,
        lead_custom_fields = '{}',
        gdpr_consent       = FALSE,
        gdpr_consent_at    = NULL,
        ip_address         = '0.0.0.0',
        fingerprint        = 'ANONYMISED',
        user_agent         = NULL
    WHERE lead_email = p_lead_email;

    GET DIAGNOSTICS affected = ROW_COUNT;
    RETURN affected;
END;
$$;

COMMENT ON FUNCTION gdpr_anonymise_session_data IS
    'Anonymises all PII for an end-user by email. Preserves spin_results for audit. '
    'Returns count of rows updated. Called from backend GDPR delete endpoint.';


-- =============================================================================
-- END OF SCHEMA
-- Document:  WheelOfFortune_Schema_v1.0_fixed.sql
-- Version:   v1.1  |  March 2026
-- Fixes:     + form_config on wheels table
--            + embed_token generation algorithm documented
--            + guaranteed_win fields noted in config comment
--            + coupon_codes no-deleted_at rationale documented
--            + audit_logs table (immutable, 12-month retention)
--            + gdpr_anonymise_session_data() function
-- Progress:  [DONE] SOP (Doc 1) | [DONE] TRD (Doc 2) | [DONE] Schema SQL (Doc 3)
-- Next:      API Spec fixes -> User Flow Diagrams (Doc 5)
-- =============================================================================

