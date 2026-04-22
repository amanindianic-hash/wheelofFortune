-- Migration: Extend segment color fields to support "transparent" and longer values
-- Version: 2026-04-08

ALTER TABLE segments
    ALTER COLUMN bg_color TYPE VARCHAR(9),
    ALTER COLUMN text_color TYPE VARCHAR(9);