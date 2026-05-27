-- 매물 댓글 테이블
CREATE TABLE IF NOT EXISTS listing_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  nickname TEXT NOT NULL DEFAULT '익명',
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 빠른 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_listing_comments_listing_id ON listing_comments(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_comments_created_at ON listing_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_comments_status ON listing_comments(status);

-- Row Level Security 활성화
ALTER TABLE listing_comments ENABLE ROW LEVEL SECURITY;

-- 기존 정책 제거 (혹시 모르니)
DROP POLICY IF EXISTS "listing_comments_select_public" ON listing_comments;
DROP POLICY IF EXISTS "listing_comments_insert_all" ON listing_comments;
DROP POLICY IF EXISTS "listing_comments_delete_own" ON listing_comments;

-- 공개 읽기 정책 (active만)
CREATE POLICY "listing_comments_select_public" ON listing_comments
  FOR SELECT USING (status = 'active');

-- 누구나 insert 가능 (custom auth 사용 중)
CREATE POLICY "listing_comments_insert_all" ON listing_comments
  FOR INSERT WITH CHECK (true);

-- 자신의 댓글만 삭제 가능 (auth.uid() 또는 user_id가 null인 경우)
CREATE POLICY "listing_comments_delete_own" ON listing_comments
  FOR DELETE USING (user_id IS NULL OR auth.uid() = user_id);
