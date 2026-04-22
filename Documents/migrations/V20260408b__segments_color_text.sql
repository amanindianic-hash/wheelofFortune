-- Migration: Extend segment color columns to support CSS color values
-- (transparent, rgba(...), hex with alpha, etc.)
-- Drops the hex-only check constraints and widens columns to TEXT.

-- Drop auto-named check constraints (names assigned by Postgres for inline CHECKs)
ALTER TABLE segments DROP CONSTRAINT IF EXISTS segments_bg_color_check;
ALTER TABLE segments DROP CONSTRAINT IF EXISTS segments_text_color_check;

-- Widen to TEXT so any CSS color value fits
ALTER TABLE segments
    ALTER COLUMN bg_color   TYPE TEXT,
    ALTER COLUMN text_color TYPE TEXT;
