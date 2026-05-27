-- Migration: Add source_name column for multi-source scraper tracking
-- Date: 2026-05-18

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS source_name TEXT DEFAULT 'pcbangkingdom';

-- Index for filtering by source
CREATE INDEX IF NOT EXISTS listings_source_name_idx ON listings(source_name) WHERE source_name IS NOT NULL;
