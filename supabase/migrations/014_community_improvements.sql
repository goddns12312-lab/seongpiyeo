-- Community: soft delete status, reports, permissive comment policies

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE posts
  ADD CONSTRAINT posts_status_check
  CHECK (status IN ('active', 'hidden', 'deleted'));

CREATE TABLE IF NOT EXISTS post_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES profiles(id),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_reports_post_id ON post_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reports_status ON post_reports(status);

ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_reports_insert_authenticated" ON post_reports;
CREATE POLICY "post_reports_insert_authenticated" ON post_reports
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "post_reports_select_admin" ON post_reports;
CREATE POLICY "post_reports_select_admin" ON post_reports
  FOR SELECT USING (true);

-- Comments: allow public read + insert (API validates session)
DROP POLICY IF EXISTS "comments_insert_all" ON comments;
CREATE POLICY "comments_insert_all" ON comments
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "comments_select_public" ON comments;
CREATE POLICY "comments_select_public" ON comments
  FOR SELECT USING (status = 'active');
