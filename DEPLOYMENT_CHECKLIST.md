# 배포 전 최종 체크리스트

## ✅ 완료된 항목

### 1. 레거시 브랜드명 제거
- [x] 피씨365 → 성피요 (0개 남음)
- [x] pcbang365 제거 (0개 남음)
- [x] @pcbang365 제거 (0개 남음)

**수정 파일:**
- public/manifest.json
- src/app/community/page.tsx
- src/app/community/[id]/page.tsx
- src/app/jobs/page.tsx
- src/app/notice/page.tsx
- src/app/page.tsx
- src/app/support/page.tsx
- src/components/layout/Footer.tsx
- src/app/layout.tsx
- src/app/listings/page.tsx
- src/app/listings/[id]/page.tsx

### 2. FAQ/Guide 메타데이터 보강
- [x] src/app/faq/layout.tsx 생성 (og:title, og:description, og:image, twitter:card, canonical, robots)
- [x] src/app/guide/layout.tsx 생성 (og:title, og:description, og:image, twitter:card, canonical, robots)

### 3. package.json Node 버전 추가
- [x] "engines": { "node": ">=18.17.0" } 추가

**수정 파일:**
- package.json

### 4. 최종 검증
- [x] npm run build: ✅ 성공
- [x] 레거시 브랜드명: ✅ 0개
- [x] SERVICE_ROLE_KEY 번들 포함: ✅ 0개

## 📋 Vercel 배포 준비

### 환경 변수 설정 (Vercel Dashboard)

다음 5개의 환경변수를 Vercel에 입력하세요:

| 변수명 | 값 | 타입 |
|--------|-----|------|
| NEXT_PUBLIC_BASE_URL | https://pc365.co.kr (실제 도메인) | Public |
| NEXT_PUBLIC_SUPABASE_URL | https://xxxxx.supabase.co | Public |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | eyJ... (anon key) | Public |
| SUPABASE_SERVICE_ROLE_KEY | eyJ... **(새로 발급한 키만)** | Secret |
| NODE_ENV | production | (자동) |

### ⚠️ 중요: SERVICE_ROLE_KEY 재생성

1. Supabase Dashboard → Settings → API
2. Service Role Key 재생성
3. 기존 키는 사용하지 않음
4. 새 키를 Vercel에 입력

### 배포 명령어

```bash
# 1. 로컬에서 최종 빌드 검증
npm run build

# 2. GitHub에 푸시
git add .
git commit -m "배포 전 최종 정리: 레거시 브랜드명 제거, 메타데이터 보강, Node 버전 추가"
git push origin main

# 3. Vercel에서 자동 배포 (GitHub 연동 시)
# 또는 Vercel CLI로 수동 배포:
vercel deploy --prod
```

## 📊 최종 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| 레거시 브랜드명 제거 | ✅ | 0개 남음 |
| 메타데이터 보강 | ✅ | FAQ, Guide 완료 |
| Node 버전 제약 | ✅ | 18.17.0 이상 |
| Build 성공 | ✅ | 56개 페이지 생성 |
| SERVICE_ROLE_KEY 안전 | ✅ | 번들에 포함 안 됨 |

## 🎯 배포 후 확인사항

- [ ] 홈페이지 로드 확인
- [ ] FAQ, Guide 페이지 메타데이터 확인 (og:image 등)
- [ ] 구글 Search Console에 배포 알림
- [ ] Vercel Analytics 모니터링
