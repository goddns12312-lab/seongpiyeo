-- Listing reports (same pattern as post_reports)

CREATE TABLE IF NOT EXISTS listing_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES profiles(id),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_reports_listing_id ON listing_reports(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_reports_status ON listing_reports(status);

ALTER TABLE listing_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "listing_reports_insert_authenticated" ON listing_reports;
CREATE POLICY "listing_reports_insert_authenticated" ON listing_reports
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "listing_reports_select_admin" ON listing_reports;
CREATE POLICY "listing_reports_select_admin" ON listing_reports
  FOR SELECT USING (true);
