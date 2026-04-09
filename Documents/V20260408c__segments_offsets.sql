-- Migration: Add per-segment label and icon offset columns
ALTER TABLE segments
    ADD COLUMN IF NOT EXISTS label_offset_x  NUMERIC(6,2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS label_offset_y  NUMERIC(6,2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS icon_offset_x   NUMERIC(6,2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS icon_offset_y   NUMERIC(6,2) DEFAULT NULL;
