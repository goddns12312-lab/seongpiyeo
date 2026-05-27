-- Migration: Add columns for scraped listings import
-- Date: 2026-05-18

-- Add missing columns to listings table for scraped data
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS idx TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS contact TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS area TEXT,
  ADD COLUMN IF NOT EXISTS floor TEXT,
  ADD COLUMN IF NOT EXISTS deposit INTEGER,
  ADD COLUMN IF NOT EXISTS facilities TEXT,
  ADD COLUMN IF NOT EXISTS move_in_date TEXT,
  ADD COLUMN IF NOT EXISTS business_license TEXT,
  ADD COLUMN IF NOT EXISTS administrative_record TEXT,
  ADD COLUMN IF NOT EXISTS premium_price INTEGER,
  ADD COLUMN IF NOT EXISTS monthly_rent INTEGER;

-- Add UNIQUE constraint on idx for upsert operations
-- First drop existing constraint if it exists
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_idx_unique;

-- Add new UNIQUE constraint
ALTER TABLE listings ADD CONSTRAINT listings_idx_unique UNIQUE (idx);

-- Create index for fast idx lookups (on non-null values only)
CREATE INDEX IF NOT EXISTS listings_idx_idx ON listings(idx) WHERE idx IS NOT NULL;

-- Add index for source_url lookups
CREATE INDEX IF NOT EXISTS listings_source_url_idx ON listings(source_url) WHERE source_url IS NOT NULL;
