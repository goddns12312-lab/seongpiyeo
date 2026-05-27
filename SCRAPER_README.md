# 자동화 스크래퍼 사용 가이드

완전 자동화된 PC천국 게시글 스크래퍼입니다. 게시판 전체 순회, 12항목 추출, 이미지 다운로드를 자동으로 수행합니다.

---

## 📋 요구사항

### 사전 준비
```bash
# 1. 로그인 세션 저장 (처음 한 번만)
node scripts/manual-login-capture.js

# 그러면 scripts/playwright-auth.json이 생성됨
```

### 설치된 의존성
- `playwright`: 브라우저 자동화
- `axios`: HTTP 요청 (이미지 다운로드)
- `csv-writer`: CSV 생성

---

## 🚀 사용 방법

### 1️⃣ 테스트 모드 (5개 게시글 스크래핑)
```bash
node scripts/auto-scraper.js --test 5
```

**결과:**
- 게시판 **첫 2페이지**만 순회
- 그 중 **5개 게시글**만 상세페이지 방문
- 약 **30초 소요**
- 결과물 확인: `scripts/output/listings.json`

### 2️⃣ 전체 실행 (전체 게시글 수집)
```bash
node scripts/auto-scraper.js
```

**특징:**
- 게시판 **모든 페이지** 순회 (수백 개 게시글)
- 각 게시글 상세페이지 방문
- 자동 딜레이 (1.5~3초 랜덤) → 서버 부하 방지
- 실패 시 자동 재시도 (최대 3회)
- **기존 항목 스킵** (중복 방지)
- 진행상황 실시간 로그

### 3️⃣ 기존 항목 덮어쓰기
```bash
node scripts/auto-scraper.js --update
```

**용도:**
- 이전 스크래핑 결과를 새 데이터로 갱신
- 모든 게시글 다시 스크래핑

---

## 📊 출력 구조

```
scripts/output/
├── listings.json           # Supabase용 최종 JSON (UTF-8)
│   └─ 필드: idx, title, detail_url, category, location,
│            size, floor, deposit, premium, monthly_rent,
│            facilities, move_in_date, business_type, reason,
│            contact, images, crawled_at
│
├── listings.csv            # CSV 버전 (Excel/Google Sheets 호환)
│
├── scraped_ids.json        # 중복 방지 인덱스 (자동 생성)
│
└── images/
    ├── 171322689/
    │   ├── 1.jpg
    │   ├── 2.jpg
    │   └── ... (최대 10개)
    │
    ├── 171321284/
    │   └── ...
    │
    └── ... (게시글별 폴더)
```

---

## 📋 필드 설명

| 필드 | 설명 | 예시 |
|------|------|------|
| `idx` | 게시글 고유 ID | `171322689` |
| `title` | 게시글 제목 | `강서구화곡동 N` |
| `detail_url` | 상세페이지 URL (bmode=view&idx 형식) | `https://...&bmode=view&idx=171322689` |
| `category` | 매물 종류 | `성인PC방` |
| `location` | 위치 | `화곡동` |
| `size` | 평수 | `18` |
| `floor` | 층수 | `1` |
| `deposit` | 보증금 | `2000` |
| `premium` | 권리금 | `2000` |
| `monthly_rent` | 월세 | `120` |
| `facilities` | 시설 | `PC7대,에어컨1대...` |
| `move_in_date` | 입주 가능일 | `항상` |
| `business_type` | 사업자 | `있음` |
| `reason` | 행정처분 | `없음` |
| `contact` | 연락처 | `010 5879 3568` |
| `images` | 이미지 경로 배열 | `["scripts/output/images/171322689/1.jpg", ...]` |
| `crawled_at` | 크롤링 시간 | `2026-05-17T20:57:25.251Z` |

---

## ⚙️ 설정 (auto-scraper.js 내)

```javascript
const CONFIG = {
  delayMin: 1500,          // 최소 딜레이 (ms)
  delayMax: 3000,          // 최대 딜레이 (ms)
  retryCount: 3,           // 실패 시 재시도 횟수
  retryDelay: 1000,        // 재시도 대기 시간 (ms)
};
```

**조정 가능:**
- 서버가 빠르면 `delayMin/Max` 줄이기
- 서버가 느리면 늘리기
- 안정성 중시면 `retryCount` 늘리기

---

## 🔍 로그 해석

```
[timestamp] ✅ robots.txt 확인: 스크래핑 허용됨
→ 사이트가 스크래핑을 허용함

[timestamp] 📍 발견된 게시글: 10개
→ 한 페이지에서 10개 게시글 발견

[timestamp] ✅ 성공: 12항목=12개, 이미지=10개
→ 12항목 모두 추출됨, 이미지 10개 다운로드

[timestamp] 🔄 스킵 (이미 스크래핑됨): idx=171322689
→ 이전에 수집한 게시글 (중복 방지)

[timestamp] ❌ 로드 실패 (시도 1/3): timeout
→ 서버 오류 발생, 자동 재시도 중
```

---

## 💡 팁

### 1. 중복 데이터 초기화
```bash
# 기존 결과물 삭제 후 처음부터 시작
rm scripts/output/listings.json scripts/output/scraped_ids.json
node scripts/auto-scraper.js
```

### 2. 특정 범위만 다시 수집
```bash
# --test 플래그로 제한할 수 있음
node scripts/auto-scraper.js --test 20  # 20개만
```

### 3. 이미지 없이 데이터만 수집
```
# auto-scraper.js 수정:
// downloadImages() 호출 제거하고
const downloadedImages = [];  // 빈 배열로 설정
```

### 4. CSV를 Google Sheets에 업로드
```
1. Google Sheets 열기
2. 파일 → 가져오기 → 파일 업로드
3. scripts/output/listings.csv 선택
4. 가져오기
```

---

## 🐛 트러블슈팅

### 문제: "playwright-auth.json을 찾을 수 없습니다"
```bash
# 해결: 먼저 로그인 세션 저장
node scripts/manual-login-capture.js
```

### 문제: 이미지가 다운로드 안 됨
```
→ 네트워크 불안정
→ CDN 오류
→ 건너뛰어짐 (스크래핑은 계속)
→ 수동 다운로드 필요 (URL에서 직접)
```

### 문제: 로그인 쿠키 만료됨
```
playwright-auth.json 쿠키 만료 기간: 2026-05-26

해결: 다시 로그인
node scripts/manual-login-capture.js
```

### 문제: 매우 느림 (페이지 로드 > 5초)
```
원인 1: 네트워크 느림
원인 2: 서버 응답 느림
원인 3: 너무 많은 게시글

해결:
1. WiFi 확인
2. --test로 작은 범위부터 시작
3. delayMin/Max 조정
```

---

## 📈 성능

**테스트 결과 (--test 5):**
- 게시판 순회: ~10초
- 상세페이지 스크래핑: ~15초
- 이미지 다운로드: ~5초
- **총 소요시간: ~30초**

**전체 실행 (예상):**
- 게시글 300개 기준: **~20-30분**
- 이미지 다운로드 포함

---

## 🔐 보안

- **robots.txt 확인**: 자동으로 확인 후 진행
- **속도 제한**: 1.5~3초 랜덤 딜레이
- **재시도**: exponential backoff (1초 → 2초 → 3초)
- **세션**: playwright-auth.json에 암호화된 쿠키 저장

---

## 📝 다음 단계

### 1. Supabase에 데이터 업로드
```bash
# scripts/supabase-upload.js 생성 필요
# CSV를 Supabase의 'listings' 테이블로 import
```

### 2. 이미지를 Supabase Storage에 업로드
```bash
# scripts/images/ 폴더를 Supabase Storage에 동기화
```

### 3. Next.js 플랫폼에 연동
```bash
# listings 테이블에서 데이터 조회
# Supabase Storage에서 이미지 표시
```

---

## 📞 참고

- **문제 발생 시**: 로그 메시지 확인 → 트러블슈팅 섹션 참고
- **커스터마이징**: `auto-scraper.js` 파일의 `CONFIG` 섹션 수정
- **한 번에 전체 수집**: `node scripts/auto-scraper.js` 실행 (시간 소요)

---

**마지막 업데이트**: 2026-05-18  
**스크래퍼 버전**: 1.0.0
