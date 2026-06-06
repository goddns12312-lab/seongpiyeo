-- ============================================================================
-- SUPABASE 마이그레이션: listing_images 테이블 생성
-- ============================================================================
-- 용도: 매물의 이미지 메타정보 저장
-- 관련: crawler_imports_images에서 승인 시 복사됨
--

-- ============================================================================
-- ✅ 테이블: listing_images (매물 이미지)
-- ============================================================================

CREATE TABLE IF NOT EXISTS listing_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- 부모 레퍼런스
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,

  -- 이미지 정보
  url TEXT NOT NULL,
  order_num INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,

  -- 다운로드 상태 (원본 크롤러이미지 다운로드 후 저장)
  download_status TEXT DEFAULT 'pending' CHECK (download_status IN ('pending', 'completed', 'failed')),

  -- 타임스탐프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (조인 쿼리 성능)
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON listing_images(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_images_order_num ON listing_images(listing_id, order_num);
CREATE INDEX IF NOT EXISTS idx_listing_images_download_status ON listing_images(download_status);

-- ============================================================================
-- ✅ Row Level Security 활성화
-- ============================================================================

ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;

-- 공개 조회 (누구나 읽을 수 있음)
DROP POLICY IF EXISTS listing_images_select_public ON listing_images;
CREATE POLICY listing_images_select_public
  ON listing_images FOR SELECT
  USING (true);

-- ============================================================================
-- 마이그레이션 완료
-- ============================================================================
