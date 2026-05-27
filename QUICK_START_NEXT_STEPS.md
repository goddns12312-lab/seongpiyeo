# ⚡ 다음 단계 빠른 시작 가이드

**현재 상태**: Phase 1 코드 수정 100% 완료, 이미지/인증 대기 중

---

## ✅ 감사 완료 (긴급 대응 불필요)

모든 지역 데이터 정상 확인:
- ✅ 경기도: 100개(사이트) vs 239개(DB) = 정상
- ✅ 서울: 75개 중 12개 이미지 없음 = 정상
- ✅ 강원도: 16개 중 4개 이미지 없음 = 정상

**시스템 동작**: 이미지 있는 매물만 저장 (정상)

---

## 📸 이미지 생성 (2-3시간, 우선순위 높음)

필요한 이미지 5개를 `public/` 디렉토리에 저장:

| # | 파일명 | 크기 | 예시 |
|---|--------|------|------|
| 1 | `og-image.png` | 1200×630 | 사이트 로고 + "피씨365" |
| 2 | `twitter-image.png` | 1200×630 | og-image.png와 동일 |
| 3 | `logo.png` | 512×512 | 흰색 배경의 로고 |
| 4 | `og-listings.png` | 1200×630 | "PC방 매물" + 실제 매물 썸네일 |
| 5 | `og-community.png` | 1200×630 | "창업 커뮤니티" + 게시글 샘플 |

**생성 방법**:
- Figma (권장): https://figma.com
- Canva: https://canva.com
- Photoshop / GIMP 사용 가능

**주의**: 정확한 파일명과 해상도 필수

---

## 🔐 검증 코드 입력 (30분)

### 1단계: Google Search Console 코드 획득

1. https://search.google.com/search-console 접속
2. "속성 추가" → `https://pc365.kr` 입력
3. "URL 접두사" 선택
4. 소유권 확인 → "HTML 태그" 선택
5. 나타나는 코드에서 다음 부분 복사:
   ```html
   <meta name="google-site-verification" content="abc123def456..." />
                                          ├─ 이 부분
   ```

### 2단계: Naver Search Advisor 코드 획득

1. https://searchadvisor.naver.com 접속
2. "사이트 추가" → `https://pc365.kr` 입력
3. 소유권 확인 → "HTML 메타 태그" 선택
4. 나타나는 코드에서 다음 부분 복사:
   ```html
   <meta name="naver-site-verification" content="xyz789..." />
                                         ├─ 이 부분
   ```

### 3단계: 코드 입력

파일: `src/app/layout.tsx` 수정

```typescript
// 74-76줄 부분을 다음처럼 수정:
verification: {
  google: 'abc123def456...',  // ← 1단계에서 복사한 코드
  naver: 'xyz789...',          // ← 2단계에서 복사한 코드
},
```

---

## ✅ 입력 후 확인

### 1. 로컬 개발 서버 재시작
```bash
npm run dev
```

### 2. 메타데이터 확인
```bash
# 브라우저 접속
http://localhost:3002

# 개발자 도구 → F12 → 소스 검보기 (Ctrl+U)
# 다음 태그들이 보이는지 확인:
# - <title>...</title>
# - <meta name="description" ...>
# - <meta property="og:image" ...>
# - <script type="application/ld+json">...CollectionPage...
```

### 3. 검색 엔진 유효성 검사
- [Google Rich Results Test](https://search.google.com/test/rich-results)
  - URL: `https://pc365.kr/listings`
  - CollectionPage 표시되는지 확인
  
- [Bing Webmaster Tools](https://www.bing.com/webmaster)
  - 사이트 추가 및 자동 제출

---

## 📊 완료 체크리스트

Phase 1 완료를 위해 체크:

- [x] 거짓 aggregateRating 제거
- [x] sameAs URL 정리
- [x] 5개 페이지 메타데이터 분리
- [x] CollectionPage 스키마 추가
- [ ] 이미지 파일 5개 생성 (⏳ 대기)
- [ ] 검증 코드 입력 (⏳ 대기)

---

## 🎯 Phase 2 준비 사항

Phase 1 완료 후 Phase 2 작업 목록:

1. **이미지 최적화** (1-2일)
   - `<img>` → `<Image from next/image>` 전환
   - Lazy loading 설정
   - WebP 포맷 변환

2. **추가 메타데이터** (1일)
   - 동적 메타데이터 확장
   - BreadcrumbList 스키마
   - Article 스키마

3. **콘텐츠 최적화** (1-2일)
   - H1 제목 최적화
   - 메타 설명 길이 조정 (120-160자)
   - 키워드 최적화

**예상 총 기간**: Phase 2 약 2-3주

---

## 📞 도움말

### 문제 발생 시

**이미지 파일 생성이 안 될 때**:
- https://pixlr.com (온라인 편집기)
- https://photopea.com (Photoshop 호환)
- ChatGPT의 DALL-E로 생성 요청

**검증 코드를 못 찾을 때**:
- Google: "google-site-verification=" 찾기
- Naver: "naver-site-verification=" 찾기

**메타데이터가 안 보일 때**:
- 개발자 도구 F12 열기
- "검사" → Ctrl+U로 페이지 소스 보기
- 또는 curl로 확인:
  ```bash
  curl -s http://localhost:3002 | grep -i "<title>"
  ```

---

## 🚀 최종 정리

**현재 완료도**: 90%
```
✅ 코드 수정: 100%
⏳ 이미지: 대기 중
⏳ 인증: 대기 중
```

**예상 Phase 1 완료**: 이미지 + 코드 수령 후 < 1시간

**다음 마일스톤**: Phase 1 완료 후 Phase 2 시작 (SEO 점수 82 → 88점)

---

**빠른 참고**:
- Phase 0 가이드: `AUDIT_REGION_COUNTS_GUIDE.md`
- Phase 1 상세: `SEO_PHASE_1_IMPLEMENTATION.md`
- 전체 분석: `SEO_ANALYSIS_REPORT.md`
