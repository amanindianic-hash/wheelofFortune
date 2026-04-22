-- =============================================================================
-- Migration: Increase character limits for URL and text columns
-- Version: V20260416_2
-- Date: 2026-04-16
-- Description: Converts VARCHAR columns to TEXT to support 
--              Base64 icons, long redirect URLs, and marketing descriptions.
-- =============================================================================

-- 1. Segments Table: icon_url often contains long Base64 strings or signed URLs.
ALTER TABLE segments 
  ALTER COLUMN icon_url TYPE TEXT,
  ALTER COLUMN consolation_message TYPE TEXT;

-- 2. Prizes Table: display_description and redirect_url can exceed previous limits.
ALTER TABLE prizes
  ALTER COLUMN display_description TYPE TEXT,
  ALTER COLUMN redirect_url TYPE TEXT;

-- 3. Theme Segment Images: image_url needs to support Base64 as well.
-- Note: Table created in V20260414 migration.
ALTER TABLE theme_segment_images
  ALTER COLUMN image_url TYPE TEXT;

-- 4. Verification
-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name IN ('segments', 'prizes', 'theme_segment_images') 
-- AND column_name IN ('icon_url', 'display_description', 'consolation_message', 'redirect_url', 'image_url');
