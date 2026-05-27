# Supabase Storage 설정 가이드

## 1단계: Bucket 생성

Supabase 대시보드 → Storage → Create new bucket

```
Bucket name: listings
Public: ON (체크)
```

## 2단계: RLS 정책 설정

Supabase 대시보드 → Storage → listings → Policies

### CREATE 정책
```sql
-- 로그인한 사용자만 업로드 가능
CREATE POLICY "Upload images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listings' AND (auth.uid()::text = (storage.foldername(name))[1]));
```

또는 간단하게:
```sql
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listings');
```

### SELECT 정책
```sql
-- 모두가 읽을 수 있음
CREATE POLICY "Public read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'listings');
```

### DELETE 정책
```sql
-- 파일 소유자만 삭제 가능
CREATE POLICY "Allow authenticated delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'listings');
```

## 테스트

1. 매물 등록 페이지에서 이미지 업로드
2. 업로드 성공 후 미리보기 표시 확인
3. 매물 상세페이지에서 이미지 표시 확인
