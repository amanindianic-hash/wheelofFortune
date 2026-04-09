-- Migration: Add per-segment label and icon rotation angle columns
-- Date: 2026-04-10

ALTER TABLE segments
  ADD COLUMN IF NOT EXISTS label_rotation_angle INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS icon_rotation_angle  INTEGER DEFAULT NULL;
