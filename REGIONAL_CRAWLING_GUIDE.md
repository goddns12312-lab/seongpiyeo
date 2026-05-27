# 🌍 지역별 크롤링 시스템 사용 가이드

## 개요
개선된 크롤링 시스템으로 각 지역을 독립적으로 크롤링할 수 있습니다.
- **지역별 독립 실행** 가능
- **역순 크롤링** (최신 → 오래된 순서)
- **상세 페이지** 정확한 이미지 수집
- **중복 방지** 자동 검증

## 📍 지원 지역

| 지역 | 마지막 페이지 | 명령어 |
|------|:---:|---------|
| 서울 | 8p | `--region=서울` |
| 경기도 | 27p | `--region=경기도` |
| 강원도 | 2p | `--region=강원도` |
| 인천 | 9p | `--region=인천` |
| 충청북도 | 9p | `--region=충청북도` |
| 충청남도 | 9p | `--region=충청남도` |
| 경상북도 | 9p | `--region=경상북도` |
| 경상남도 | 9p | `--region=경상남도` |
| 전라북도 | 2p | `--region=전라북도` |
| 전라남도 | 4p | `--region=전라남도` |
| 제주도 | 1p | `--region=제주도` |

## 🚀 기본 사용법

### 1. 인증 (최초 또는 세션 만료 시)
```bash
node scripts/capture-auth.js
# 브라우저가 열리면 로그인 완료 → auth_state.json 저장
```

### 2. 전 지역 감사 (매물 수 검증)
```bash
# 빠른 모드 - 사이트 게시글 수 vs DB 저장 수 비교
node scripts/audit-region-counts.js

# 특정 지역만 감사
node scripts/audit-region-counts.js --region=강원도

# DB 오류만 분석 (사이트 방문 없음)
node scripts/audit-region-counts.js --skip-crawl

# 예상 결과:
#   사이트 총 게시글: 16개
#   DB 저장됨:       15개
#   차이:             1개 ⚠️
#   DB 오류: region 매핑 오류 0개, 중복 idx 0개
```

### 3. 단일 지역 크롤링
```bash
# 강원도의 모든 매물 수집
node scripts/crawl-regions.js --region=강원도

# 서울의 최대 50개만
node scripts/crawl-regions.js --region=서울 --limit=50

# 경기도의 최대 100개
node scripts/crawl-regions.js --region=경기도 --limit=100
```

### 3. 순차적 지역별 크롤링 (권장)
```bash
# 페이지가 적은 지역부터 시작
node scripts/crawl-regions.js --region=제주도
node scripts/crawl-regions.js --region=강원도
node scripts/crawl-regions.js --region=전라북도
node scripts/crawl-regions.js --region=전라남도
node scripts/crawl-regions.js --region=인천
node scripts/crawl-regions.js --region=충청북도
node scripts/crawl-regions.js --region=충청남도
node scripts/crawl-regions.js --region=경상북도
node scripts/crawl-regions.js --region=경상남도
node scripts/crawl-regions.js --region=서울
node scripts/crawl-regions.js --region=경기도
```

### 4. 배치 크롤링 스크립트
`crawl-all-regions.sh` (또는 .bat) 생성 후 실행:
```bash
#!/bin/bash
for region in "제주도" "강원도" "전라북도" "전라남도" "인천" "충청북도" "충청남도" "경상북도" "경상남도" "서울" "경기도"; do
  echo "🌍 $region 크롤링..."
  node scripts/crawl-regions.js --region=$region --limit=200
  echo "✅ $region 완료\n"
  sleep 5
done
```

## 🔍 크롤러 작동 원리

### 크롤링 흐름
```
1. 인증 로드 (auth_state.json)
   ↓
2. 지역별 페이지 순회 (역순: lastPage → 1)
   ↓
3. 각 페이지에서 게시글 목록 추출
   ↓
4. 각 게시글을 정확히 nth(index).click() 클릭
   ↓
5. 상세 페이지에서 다음 추출:
   - idx (URL에서)
   - title, description (본문)
   - images (.board_txt_area.fr-view 내부)
   - monthly_rent (설명 파싱)
   ↓
6. 이미지 Supabase Storage 업로드
   ↓
7. DB 저장 (idx 기준 upsert)
```

### 품질 검증
```
✓ 각 게시글마다 정확한 상세 페이지 접근 (nth(index) 사용)
✓ 이미지는 본문 내부만 (배너/로고 제외)
✓ 제목 + 설명 + 이미지 검증
✓ idx 중복 감지
✓ 제목/idx 전후 비교 (클릭 오류 감지)
```

## 📋 저장되는 데이터

### listings 테이블
```
- id: UUID (자동)
- idx: 게시글 원본 ID (중복 방지 키)
- title: 제목
- description: 설명글 전체
- region: 지역명
- monthly_rent: 월세 (만원)
- price: 가격 (월세 기준)
- price_type: 'lease' (임차)
- status: 'active' (즉시 공개)
- main_image_url: 대표 이미지 (첫 번째)
- thumbnail_url: 썸네일 (첫 번째)
- created_at: 저장 시간
```

### listing_images 테이블
```
- id: UUID
- listing_id: FK (listings)
- url: Supabase 이미지 공개 URL
- order_num: 순서 (0부터)
- is_primary: 대표 이미지 여부
```

## 🛡️ 중복 방지 메커니즘

### 자동 감지
1. **idx 기준**: 같은 idx는 update (중복 저장 안 함)
2. **클릭 검증**: 같은 idx가 반복되면 경고
3. **이미지 추적**: 3회 이상 반복되는 이미지 경고

### 기존 DB 정리
```bash
# 중복 이미지 분석
node scripts/fix-duplicate-images.js

# 자동 정리 (같은 이미지 + 같은 설명 = 중복)
node scripts/fix-duplicate-images.js --clean
```

## 📊 로그 출력 예시

```
🌍 지역: 강원도
📄 강원도 - 2/2 페이지
  ✅ 6개 게시글 발견

    [1/6] 원주관설동
      📤 이미지 업로드 중 (9개)...
      📋 저장 데이터:
         title: 원주관설동
         idx: 167339130
         source_url: https://www.xn--3e0b036btifksj.com/92/?...
         main_image_url: listings/167339130/1.jpg
         images: 9개
      ✅ 신규 저장됨 (이미지 9개, 월세 100만원)

📊 최종 결과:
   - 크롤링됨: 3개
   - 스킵됨: 0개
```

## ⚡ 성능 최적화

### 시간 소요 (추정)
- 제주도 (1p): ~2분
- 강원도 (2p): ~4분
- 인천 (9p): ~15분
- 경기도 (27p): ~45분
- **전국**: ~120분 (2시간)

### 권장 운영 방식
1. **첫 번시작**: 페이지 적은 지역부터 테스트
2. **일일 더라**: 새 매물 감지용 --limit=100
3. **주말 배치**: 전국 완전 크롤링 (야간)

## 🔧 트러블슈팅

### "auth_state.json 없음"
```bash
node scripts/capture-auth.js
# 브라우저 로그인 필수
```

### "idx 추출 실패"
```bash
# 페이지 로드 지연 문제
# waitForTimeout 값 증가: 3000 → 5000
# scripts/crawl-regions.js 수정 후 재시도
```

### "Browser closed"
```bash
# 메모리 부족 또는 Playwright 리소스 한계
# --limit 값 줄이기
node scripts/crawl-regions.js --region=경기도 --limit=50
```

### "이미지 0개"
```bash
# 사이트 구조 변경됨
# 선택자 확인: img.fr-dii._img_light_gallery
# 브라우저 개발자 도구로 확인 후 수정
```

## 📈 성공 지표

✅ 각 지역별 독립 실행 가능
✅ 역순 크롤링 (최신 우선)
✅ 각 매물마다 서로 다른 이미지
✅ 중복 매물 없음
✅ idx/이미지/설명 모두 고유함
✅ DB에 즉시 공개 (status='active')

---

**최근 테스트**: 강원도 3개 매물 수집 완료
- 167339130: 9개 이미지
- 166890973: 5개 이미지  
- 166847449: 1개 이미지

모두 다른 idx, 다른 이미지, 다른 월세 ✅
