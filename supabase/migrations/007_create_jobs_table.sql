-- Create jobs table for recruitment and job seeker posts
-- Enhanced with soft delete, auto-updated timestamps, JSONB images, slug, and expiry support
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('recruitment', 'job_seeker')),

  -- SEO friendly slug for URL (예: 강남-pc방-매니저-모집)
  slug VARCHAR(255) NOT NULL,

  title VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  description TEXT NOT NULL,
  region VARCHAR(50) NOT NULL,
  employment_type VARCHAR(50),
  salary VARCHAR(100),
  contact VARCHAR(255),

  -- JSONB for multiple images with metadata (future-proof)
  -- Example: [{"url": "https://...", "order": 0, "is_primary": true}]
  images JSONB DEFAULT '[]'::jsonb,

  view_count INTEGER DEFAULT 0,

  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'closed')),

  -- Auto-expiry date (nullable - if set, job post becomes inactive after this date)
  expires_at TIMESTAMPTZ,

  -- Soft delete support
  deleted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies
-- Anyone can read active, non-deleted jobs
CREATE POLICY "Anyone can read active jobs" ON jobs
  FOR SELECT USING (status = 'active' AND deleted_at IS NULL AND (expires_at IS NULL OR expires_at > NOW()));

-- Users can read their own jobs (including deleted/expired ones)
CREATE POLICY "Users can read their own jobs" ON jobs
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create jobs
CREATE POLICY "Users can create jobs" ON jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own jobs
CREATE POLICY "Users can update their own jobs" ON jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can soft-delete their own jobs (soft delete = set deleted_at)
CREATE POLICY "Users can soft delete their own jobs" ON jobs
  FOR UPDATE USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX jobs_user_id_idx ON jobs(user_id);
CREATE INDEX jobs_category_idx ON jobs(category);
CREATE INDEX jobs_region_idx ON jobs(region);
CREATE INDEX jobs_status_idx ON jobs(status);
CREATE INDEX jobs_deleted_at_idx ON jobs(deleted_at);
CREATE INDEX jobs_expires_at_idx ON jobs(expires_at);
CREATE INDEX jobs_created_at_idx ON jobs(created_at DESC);
CREATE UNIQUE INDEX jobs_slug_idx ON jobs(slug) WHERE deleted_at IS NULL;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating updated_at
CREATE TRIGGER jobs_update_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_jobs_updated_at();

-- Function to auto-close expired jobs (helper for maintenance)
-- Call periodically: SELECT close_expired_jobs();
CREATE OR REPLACE FUNCTION close_expired_jobs()
RETURNS TABLE(closed_count INT) AS $$
DECLARE
  count INT;
BEGIN
  UPDATE jobs
  SET status = 'closed'
  WHERE expires_at IS NOT NULL
    AND expires_at <= NOW()
    AND status != 'closed'
    AND deleted_at IS NULL;

  GET DIAGNOSTICS count = ROW_COUNT;
  RETURN QUERY SELECT count;
END;
$$ LANGUAGE plpgsql;
