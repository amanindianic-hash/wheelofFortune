-- Migration: Add wheel_themes table for per-client saved custom themes
-- Date: 2026-04-07

CREATE TABLE IF NOT EXISTS wheel_themes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name            VARCHAR(120) NOT NULL,
    emoji           VARCHAR(8) NOT NULL DEFAULT '🎨',
    description     TEXT,
    branding        JSONB NOT NULL DEFAULT '{}',
    config          JSONB NOT NULL DEFAULT '{}',
    segment_palette JSONB NOT NULL DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wheel_themes_client_id ON wheel_themes(client_id);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION set_wheel_themes_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_wheel_themes_updated_at
BEFORE UPDATE ON wheel_themes
FOR EACH ROW EXECUTE FUNCTION set_wheel_themes_updated_at();
