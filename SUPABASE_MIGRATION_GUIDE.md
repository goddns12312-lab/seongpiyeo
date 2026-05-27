# Supabase 마이그레이션 적용 가이드

스크래핑 데이터를 Supabase에 임포트하기 전에 테이블 스키마를 업데이트해야 합니다.

---

## 🔧 방법 1: Supabase 대시보드 (SQL Editor) - 가장 간단

### 1단계: Supabase 대시보드 접속
```
https://app.supabase.com → 프로젝트 선택
```

### 2단계: SQL Editor 열기
왼쪽 메뉴 → **SQL Editor** → **New Query**

### 3단계: SQL 복사-붙여넣기
아래 SQL을 모두 복사하여 에디터에 붙여넣고 **RUN** 버튼 클릭:

```sql
-- Add missing columns to listings table for scraped data
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS idx TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS contact TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS floor TEXT,
  ADD COLUMN IF NOT EXISTS facilities TEXT,
  ADD COLUMN IF NOT EXISTS available_date TEXT,
  ADD COLUMN IF NOT EXISTS business_license TEXT,
  ADD COLUMN IF NOT EXISTS administrative_record TEXT,
  ADD COLUMN IF NOT EXISTS premium_price INTEGER;

-- Add UNIQUE constraint on idx for upsert operations
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_idx_unique;
ALTER TABLE listings ADD CONSTRAINT listings_idx_unique UNIQUE (idx);

-- Create index for fast idx lookups
CREATE INDEX IF NOT EXISTS listings_idx_idx ON listings(idx) WHERE idx IS NOT NULL;
CREATE INDEX IF NOT EXISTS listings_source_url_idx ON listings(source_url) WHERE source_url IS NOT NULL;
```

✅ "Finished successfully" 메시지가 나오면 완료!

---

## 🔧 방법 2: Supabase CLI (고급)

```bash
# Supabase CLI 설치 (없으면)
npm install -g supabase

# 마이그레이션 적용
supabase db push

# 또는 직접 실행
supabase db execute "$(cat supabase/migrations/001_add_scraped_fields.sql)"
```

---

## ✅ 확인

마이그레이션이 성공했는지 확인:

### 방법 A: Supabase 대시보시판
1. **Table Editor** → **listings**
2. 스크롤해서 다음 컬럼 확인:
   - `idx`
   - `contact`
   - `source_url`
   - `thumbnail_url`
   - `premium_price`
   - `location`
   - `floor`
   - `facilities`
   - `available_date`
   - `business_license`
   - `administrative_record`

### 방법 B: SQL 쿼리
SQL Editor에서 실행:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='listings' 
ORDER BY ordinal_position;
```

---

## 📦 이제 임포트 시작!

마이그레이션 완료 후:

```bash
# 데이터 임포트 테스트 (변환만 확인)
node scripts/import-to-supabase.js --dry-run

# 실제 임포트
node scripts/import-to-supabase.js
```

---

## 🐛 트러블슈팅

### Q: "Could not find the 'contact' column" 오류가 계속 나요
**A:** 마이그레이션이 아직 적용되지 않았습니다.
- Supabase 대시보드에서 SQL을 다시 실행하세요
- 대소문자 정확히 맞췄는지 확인하세요 (listings, contact 등)

### Q: "UNIQUE constraint violation" on idx
**A:** 이미 같은 idx가 DB에 있습니다.
- 첫 임포트라면: 다시 임포트하세요 (자동 UPDATE됩니다)
- 재임포트라면: 의도한 동작입니다 (idx 중복 방지)

### Q: 이미지는 업로드되었는데 DB에 안 들어갔어요
**A:** 그건 정상입니다. 마이그레이션 필요:
- 위 단계를 따라 마이그레이션 실행하세요
- Storage의 이미지는 유지되고, DB만 다시 입력됩니다

---

## 📝 다음 단계

1. ✅ 마이그레이션 적용
2. ✅ `node scripts/import-to-supabase.js` 실행
3. 📊 Supabase Table Editor에서 listings 확인
4. 🌐 Next.js 플랫폼에서 `/listings` 페이지 접속해 5개 매물 표시 확인

---

**도움말:** 마이그레이션 파일: `supabase/migrations/001_add_scraped_fields.sql`
