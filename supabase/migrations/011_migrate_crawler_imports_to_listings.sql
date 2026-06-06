-- ============================================================================
-- SUPABASE 마이그레이션: crawler_imports 데이터를 listings로 마이그레이션
-- ============================================================================
-- 목적: 기존 73개의 crawler_imports 데이터를 listings로 이동
-- 조건: source_name + source_idx 기준으로 중복 제외
--

-- ============================================================================
-- 1단계: crawler_imports 데이터를 listings로 이동
-- ============================================================================

INSERT INTO listings (
  title,
  region,
  location,
  contact,
  deposit,
  monthly_rent,
  business_license,
  administrative_record,
  facilities,
  move_in_date,
  area,
  floor,
  description,
  thumbnail_url,
  main_image_url,
  status,
  idx,
  source_name,
  source_url,
  created_at
)
SELECT
  ci.title,
  ci.region,
  ci.location,
  ci.contact,
  ci.price_deposit,
  ci.price_monthly,
  CASE WHEN ci.permit_status = '여' THEN '있음' ELSE NULL END,
  CASE WHEN ci.violation_history = '부' THEN '없음' ELSE NULL END,
  ci.facilities,
  ci.available_date,
  ci.size,
  ci.floor,
  ci.description,
  ci.main_image_url,
  ci.main_image_url,
  'pending',
  ci.source_idx,
  ci.source_name,
  'https://www.xn--3e0b036btifksj.com/' || ci.source_idx,
  ci.created_at
FROM crawler_imports ci
WHERE NOT EXISTS (
  -- 중복 제외: 같은 source_name + source_idx 조합이 listings에 이미 있으면 제외
  SELECT 1 FROM listings l
  WHERE l.source_name = ci.source_name
  AND l.idx = ci.source_idx
)
ON CONFLICT (idx, source_name) DO NOTHING;

-- ============================================================================
-- 2단계: crawler_imports_images를 listing_images로 이동
-- ============================================================================

INSERT INTO listing_images (
  listing_id,
  url,
  order_num,
  is_primary,
  download_status,
  created_at
)
SELECT
  l.id,
  cii.url,
  cii.order_num,
  cii.is_primary,
  'pending',
  cii.created_at
FROM crawler_imports_images cii
INNER JOIN crawler_imports ci ON cii.crawler_import_id = ci.id
INNER JOIN listings l ON l.idx = ci.source_idx AND l.source_name = ci.source_name
WHERE NOT EXISTS (
  -- 중복 제외: 같은 listing_id + url 조합이 listing_images에 이미 있으면 제외
  SELECT 1 FROM listing_images li
  WHERE li.listing_id = l.id
  AND li.url = cii.image_url
);

-- ============================================================================
-- 마이그레이션 완료
-- ============================================================================
-- 검증 쿼리:
--   SELECT COUNT(*) FROM listings WHERE source_name = 'pcbangkingdom';
--   SELECT COUNT(*) FROM listing_images WHERE listing_id IN (
--     SELECT id FROM listings WHERE source_name = 'pcbangkingdom'
--   );
--
