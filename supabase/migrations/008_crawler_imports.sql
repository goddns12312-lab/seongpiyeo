-- ============================================================================
-- SUPABASE 마이그레이션: crawler_imports 테이블 생성
-- ============================================================================
-- 용도: 크롤러가 수집한 신규 매물 임시 저장소
-- 상태: 실행 준비 완료
--
-- 테이블 구조:
--   crawler_imports: 크롤러 수집 매물 (Supabase INSERT 권장)
--   crawler_imports_images: 크롤러 수집 이미지 메타
--
-- 데이터 흐름:
--   1. 크롤러가 신규 글 발견
--   2. Supabase 중복 체크 (source_name + source_idx)
--   3. crawler_imports + crawler_imports_images INSERT
--   4. 관리자가 승인 후 listings로 이동 (후속 작업)
--

-- ============================================================================
-- ✅ 테이블 1: crawler_imports (크롤러 수집 매물)
-- ============================================================================

CREATE TABLE IF NOT EXISTS crawler_imports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- 소스 정보
  source_name TEXT NOT NULL DEFAULT 'pcbangkingdom',
  source_idx TEXT NOT NULL,

  -- 매물 정보 (원본 데이터)
  title TEXT NOT NULL,
  region TEXT,
  location TEXT,
  contact TEXT,

  -- 가격 정보
  price_deposit INTEGER,
  price_monthly INTEGER,

  -- 부동산 세부 정보
  business_type TEXT,
  size TEXT,
  floor TEXT,
  facilities TEXT,
  available_date TEXT,
  permit_status TEXT,
  violation_history TEXT,
  description TEXT,

  -- 이미지
  main_image_url TEXT,

  -- 승인 상태 (NULL인 기존 데이터는 pending으로 간주)
  import_status TEXT CHECK (import_status IN ('pending', 'approved', 'rejected')),

  -- 크롤링 정보
  crawled_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 제약 조건: 같은 소스에서 같은 idx는 중복으로 처리
  CONSTRAINT unique_source_idx UNIQUE (source_name, source_idx),

  -- 필수 필드 확인
  CONSTRAINT source_name_not_null CHECK (source_name IS NOT NULL),
  CONSTRAINT source_idx_not_null CHECK (source_idx IS NOT NULL),
  CONSTRAINT title_not_null CHECK (title IS NOT NULL)
);

-- 인덱스 생성 (쿼리 성능)
CREATE INDEX IF NOT EXISTS idx_crawler_imports_source ON crawler_imports(source_name, source_idx);
CREATE INDEX IF NOT EXISTS idx_crawler_imports_region ON crawler_imports(region);
CREATE INDEX IF NOT EXISTS idx_crawler_imports_created_at ON crawler_imports(created_at DESC);


-- ============================================================================
-- ✅ 테이블 2: crawler_imports_images (이미지 메타정보)
-- ============================================================================

CREATE TABLE IF NOT EXISTS crawler_imports_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- 부모 레퍼런스
  import_id UUID NOT NULL REFERENCES crawler_imports(id) ON DELETE CASCADE,

  -- 이미지 정보
  image_url TEXT NOT NULL,
  order_num INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,

  -- 타임스탐프
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (조인 쿼리 성능)
CREATE INDEX IF NOT EXISTS idx_crawler_imports_images_import_id ON crawler_imports_images(import_id);


-- ============================================================================
-- ✅ Row Level Security 활성화 (선택 사항: 현재 공개 접근 허용)
-- ============================================================================

ALTER TABLE crawler_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawler_imports_images ENABLE ROW LEVEL SECURITY;

-- 공개 조회 (누구나 읽을 수 있음)
DROP POLICY IF EXISTS crawler_imports_select_public ON crawler_imports;
CREATE POLICY crawler_imports_select_public
  ON crawler_imports FOR SELECT
  USING (true);

DROP POLICY IF EXISTS crawler_imports_images_select_public ON crawler_imports_images;
CREATE POLICY crawler_imports_images_select_public
  ON crawler_imports_images FOR SELECT
  USING (true);


-- ============================================================================
-- 마이그레이션 완료
-- ============================================================================
--
-- 예상 결과:
--   ✓ crawler_imports 테이블 생성
--   ✓ crawler_imports_images 테이블 생성
--   ✓ 4개 인덱스 생성
--   ✓ RLS 정책 2개 생성
--
-- 검증 쿼리:
--   SELECT COUNT(*) FROM crawler_imports;  -- 0 (또는 기존 데이터)
--   SELECT COUNT(*) FROM crawler_imports_images;  -- 0 (또는 기존 이미지)
--
