-- =============================================================================
-- Migration: Add relative offset columns to segments table
-- Version: V20260416
-- Date: 2026-04-16
-- Description: Add per-segment relative offset fields for placement scaling fix
-- =============================================================================

ALTER TABLE segments
  ADD COLUMN IF NOT EXISTS icon_radial_offset  NUMERIC(8,4) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS icon_perp_offset    NUMERIC(8,4) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS label_radial_offset NUMERIC(8,4) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS label_perp_offset   NUMERIC(8,4) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS label_font_scale    NUMERIC(8,4) DEFAULT NULL;
