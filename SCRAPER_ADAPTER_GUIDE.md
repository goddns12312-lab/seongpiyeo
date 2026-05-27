# 🔌 Scraper Adapter 추가 가이드

새로운 PC방 매물 사이트를 데이터 소스로 추가하기 위한 단계별 가이드입니다.

---

## 📋 개요

어댑터 패턴으로 설계되어 있으므로, 각 사이트는 자신의 DOM 구조에만 집중하면 됩니다.
공통 인프라(이미지 다운로드, Supabase 임포트, 체크포인트 등)는 모두 공유됩니다.

---

## 🚀 새 사이트 추가 (3단계)

### 1단계: 어댑터 클래스 작성

**파일:** `scripts/adapters/newsite-adapter.js` (예: `scripts/adapters/pcbangnet-adapter.js`)

```javascript
const fs = require('fs');
const path = require('path');
const BaseAdapter = require('./base-adapter');

class NewSiteAdapter extends BaseAdapter {
  static sourceName = 'newsite';  // 고유 식별자
  static displayName = '뉴사이트';  // 사용자 표시용 이름

  constructor() {
    super();
    this.boardUrl = 'https://newsite.example.com/listings/';
    this.baseUrl = 'https://newsite.example.com';
    this.authFile = path.join(__dirname, '..', 'auth-newsite.json');  // 선택사항
  }

  // 필수 메서드 1: 세션 초기화
  async setup(browser) {
    // 쿠키 로드, Playwright 컨텍스트 생성 등
    try {
      const storageState = JSON.parse(
        fs.readFileSync(this.authFile, 'utf-8')
      );
      const context = await browser.newContext({ storageState });
      const page = await context.newPage();
      return page;
    } catch (error) {
      throw new Error(`뉴사이트 인증 실패: ${error.message}`);
    }
  }

  // 필수 메서드 2: 페이지네이션 네비게이션
  async navigateToPage(page, pageNum) {
    const url = `${this.boardUrl}?page=${pageNum}`;  // 사이트에 맞게 조정
    await page.goto(url, { waitUntil: 'networkidle' });
  }

  // 필수 메서드 3: 목록 페이지에서 링크 추출
  async getPostLinks(page, pageNum) {
    return await page.evaluate(() => {
      const links = [];
      
      // 사이트 특정 선택자 사용
      document.querySelectorAll('.listing-item a').forEach(link => {
        const href = link.getAttribute('href');
        const idx = href?.match(/id=(\d+)/)?.[1];
        
        if (idx && href) {
          links.push({
            idx: idx,
            title: link.innerText?.trim() || '',
            href: href
          });
        }
      });

      return links;
    });
  }

  // 필수 메서드 4: 상세 URL 생성
  buildDetailUrl(postInfo) {
    if (postInfo.href.startsWith('http')) {
      return postInfo.href;
    }
    return this.baseUrl + (postInfo.href.startsWith('/') ? postInfo.href : '/' + postInfo.href);
  }

  // 필수 메서드 5: 상세페이지에서 데이터 추출
  async extractDetails(page) {
    const rawData = await page.evaluate(() => {
      return {
        // 각 필드는 사이트의 DOM에서 추출
        location: document.querySelector('.location')?.innerText || '',
        size: document.querySelector('.area')?.innerText || '',
        floor: document.querySelector('.floor')?.innerText || '',
        deposit: document.querySelector('[data-deposit]')?.innerText || null,
        premium_price: document.querySelector('[data-premium]')?.innerText || null,
        monthly_rent: document.querySelector('[data-monthly]')?.innerText || null,
        facilities: document.querySelector('.facilities')?.innerText || '',
        description: document.querySelector('.content')?.innerText || '',
        contact: document.querySelector('.phone')?.innerText || null,
        imageUrls: Array.from(document.querySelectorAll('img.listing-photo')).map(
          img => img.src
        ),
        move_in_date: document.querySelector('.available')?.innerText || '',
        business_license: document.querySelector('.license')?.innerText || '',
        administrative_record: document.querySelector('.record')?.innerText || ''
      };
    });

    // 필요시 정규화/정제
    return {
      ...rawData,
      deposit: this._parsePrice(rawData.deposit),
      premium_price: this._parsePrice(rawData.premium_price),
      monthly_rent: this._parsePrice(rawData.monthly_rent),
      contact: this._normalizePhone(rawData.contact)
    };
  }

  // 선택사항: 유틸리티 메서드
  _parsePrice(price) {
    if (!price) return null;
    const num = parseInt(String(price).replace(/[^\d]/g, ''));
    return isNaN(num) ? null : num;
  }

  _normalizePhone(phone) {
    if (!phone) return null;
    const cleaned = String(phone).replace(/[^\d]/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('010')) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  }
}

module.exports = NewSiteAdapter;
```

**체크리스트:**
- [ ] DOM 선택자 확인 (브라우저 DevTools에서)
- [ ] 이미지 URL 필터링 (사이트 CDN 도메인 확인)
- [ ] 페이지네이션 패턴 파악
- [ ] 인증 필요 여부 확인

### 2단계: 어댑터 레지스트리에 등록

**파일:** `scripts/adapters/index.js`

```javascript
const PcbangkingdomAdapter = require('./pcbangkingdom-adapter');
const NewSiteAdapter = require('./newsite-adapter');  // ← 추가

const ADAPTERS = {
  [PcbangkingdomAdapter.sourceName]: PcbangkingdomAdapter,
  [NewSiteAdapter.sourceName]: NewSiteAdapter  // ← 추가
};

// ... 나머지는 동일
```

### 3단계: 실행 및 테스트

```bash
# 등록된 어댑터 목록 확인
node scripts/run-scraper.js --list-adapters

# 테스트 실행 (3개 항목)
node scripts/run-scraper.js --adapter newsite --test 3

# 전체 실행
node scripts/run-scraper.js --adapter newsite

# 기존 항목 재수집 (덮어쓰기)
node scripts/run-scraper.js --adapter newsite --update
```

---

## 🧪 디버깅 팁

### 선택자 찾기
```javascript
// 브라우저 콘솔에서 테스트
document.querySelectorAll('.listing-item').length  // 몇 개 있는지 확인
document.querySelector('.location')?.innerText    // 필드 값 확인
```

### 이미지 필터링 확인
```javascript
// 추출된 이미지 URL 확인
const images = Array.from(document.querySelectorAll('img')).map(i => i.src);
images.filter(url => url.includes('cdn.'));  // CDN URL만 필터링
```

### 페이지네이션 패턴
- 쿼리 파라미터: `?page=N`, `?p=N`, `?offset=N`
- 경로 세그먼트: `/listings/page/2`
- 더보기 버튼: 동적 로딩 (AJAX)

---

## 📊 출력 필드 필수 정보

각 어댑터의 `extractDetails()`는 다음 필드를 반환해야 합니다:

| 필드 | 타입 | 설명 |
|------|------|------|
| `location` | string | 지역명 (예: "화곡동") |
| `size` | string | 면적 (예: "18") |
| `floor` | string | 층수 (예: "1") |
| `deposit` | number\|null | 보증금 (만원 단위) |
| `premium_price` | number\|null | 권리금 (만원 단위) |
| `monthly_rent` | number\|null | 월세 (만원 단위) |
| `facilities` | string | 시설 목록 (쉼표 구분) |
| `description` | string | 전체 설명 텍스트 |
| `contact` | string\|null | 연락처 |
| `imageUrls` | string[] | CDN 이미지 URL 배열 |
| `move_in_date` | string | 입주가능일 |
| `business_license` | string | 영업허가 여부 |
| `administrative_record` | string | 행정처분 여부 |

⚠️ `imageUrls`는 **로컬 파일 경로가 아니라 CDN URL**이어야 합니다. 다운로드는 runner에서 자동 처리됩니다.

---

## 🔐 인증 필요한 경우

일부 사이트는 로그인이 필요할 수 있습니다:

### 1. 수동 로그인 세션 캡처

```bash
# 각 사이트별로 한 번만 실행
node scripts/manual-login-capture.js --site newsite
# → playwright-auth.json 또는 auth-newsite.json 생성
```

### 2. 어댑터에서 로드

```javascript
async setup(browser) {
  const storageState = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'auth-newsite.json'), 'utf-8')
  );
  const context = await browser.newContext({ storageState });
  // ...
}
```

---

## 📈 성능 최적화

- **딜레이:** `run-scraper.js`가 자동으로 1.5-3초 딜레이 적용
- **재시도:** 네트워크 오류 시 자동 3회 재시도
- **체크포인트:** 10개마다 자동 저장 (중단/재개 시 이력 보존)
- **이미지:** 최대 10개까지 다운로드, 실패한 것은 스킵

---

## 🐛 흔한 문제 해결

### "어댑터를 찾을 수 없음"
```
Unknown adapter: "newsite". Available: pcbangkingdom
```
→ `scripts/adapters/index.js`에 등록했는지 확인

### "모든 게시글을 스킵함"
```
⏭️ 스킵: 10개 (이미 수집)
```
→ `scripts/output/scraped_ids.json` 삭제 후 재시도
```bash
rm scripts/output/scraped_ids.json
node scripts/run-scraper.js --adapter newsite --test 3
```

### "이미지 다운로드 실패"
```
⚠️ 이미지 다운로드 실패: ECONNREFUSED
```
→ 사이트에서 hotlinking을 차단할 수 있음. 프록시 또는 헤더 설정 필요:
```javascript
const response = await axios.get(imageUrl, {
  headers: { 'User-Agent': 'Mozilla/5.0...' },
  responseType: 'arraybuffer',
  timeout: 10000
});
```

---

## 📝 체크리스트

새 어댑터 추가 시 확인:

- [ ] `scripts/adapters/newsite-adapter.js` 생성
- [ ] BaseAdapter 5개 필수 메서드 구현
- [ ] `scripts/adapters/index.js`에 등록
- [ ] `--list-adapters` 확인
- [ ] `--test 3` 테스트 실행
- [ ] `scripts/output/listings.json` 확인
- [ ] 이미지 다운로드 확인 (`scripts/output/images/`)
- [ ] `source_name` 필드 확인
- [ ] Supabase import 실행
- [ ] 관리자 페이지에서 pending 매물 확인

---

## 🎯 다음 대상 사이트 (추천 순서)

1. **피씨방넷** (pcbangnet.com) - 유사 구조
2. **벼룩시장** (당근마켓 PC방) - 커뮤니티 기반
3. **직거래 사이트** - 숨고, 오늘의집 등

---

## 📞 문제 발생 시

1. 브라우저 DevTools에서 선택자 테스트
2. `--test 1`로 단일 항목만 실행하여 디버깅
3. `scripts/output/failed.log` 확인
4. 페이지 구조 변경 시 선택자 업데이트

---

## ✨ 완료!

새 어댑터가 준비되면:
```bash
node scripts/run-scraper.js --adapter newsite --test 5
node scripts/import-validated.js
```

이후 관리자 페이지에서 `source_name: 'newsite'`인 매물들을 승인하면 공개됩니다! 🎉
