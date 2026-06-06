-- ============================================================================
-- SUPABASE 마이그레이션: crawler_imports import_status 기본값 설정
-- ============================================================================
-- 목적: 기존 데이터의 import_status를 'pending'으로 설정
--

-- 기존 NULL 값을 'pending'으로 업데이트
UPDATE crawler_imports
SET import_status = 'pending'
WHERE import_status IS NULL;

-- 기본값 설정
ALTER TABLE crawler_imports
ALTER COLUMN import_status SET DEFAULT 'pending';

-- ============================================================================
-- 마이그레이션 완료
-- ============================================================================
