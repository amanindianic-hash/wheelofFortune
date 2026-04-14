-- =============================================================================
-- Migration: Add Dynamic Segment Images Support
-- Version: V20260414
-- Date: 2026-04-14
-- Description: Add ability to upload custom segment images per theme
-- =============================================================================

-- Create new table for theme segment images
CREATE TABLE IF NOT EXISTS theme_segment_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID NOT NULL REFERENCES custom_themes(id) ON DELETE CASCADE,
  segment_position INT NOT NULL CHECK (segment_position BETWEEN 1 AND 8),
  image_url VARCHAR(2048) NOT NULL,
  image_name VARCHAR(255),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one image per segment position per theme
  UNIQUE(theme_id, segment_position)
);

-- Create index for faster queries
CREATE INDEX idx_theme_segment_images_theme_id
  ON theme_segment_images(theme_id);

-- Add column to custom_themes to track if it has custom segments
ALTER TABLE custom_themes
ADD COLUMN has_custom_segments BOOLEAN DEFAULT FALSE;

-- Add segment_image_url to wheels if it doesn't exist
ALTER TABLE wheels
ADD COLUMN IF NOT EXISTS has_custom_segments BOOLEAN DEFAULT FALSE;

-- =============================================================================
-- Rollback instructions (if needed):
-- DROP TABLE IF EXISTS theme_segment_images;
-- ALTER TABLE custom_themes DROP COLUMN has_custom_segments;
-- ALTER TABLE wheels DROP COLUMN has_custom_segments;
-- =============================================================================
