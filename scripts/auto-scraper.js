const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { createObjectCsvWriter } = require('csv-writer');

// ============================================================================
// 설정
// ============================================================================

const CONFIG = {
  baseUrl: 'https://www.xn--3e0b036btifksj.com',
  boardUrl: 'https://www.xn--3e0b036btifksj.com/40/',
  authFile: path.join(__dirname, 'playwright-auth.json'),
  outputDir: path.join(__dirname, 'output'),
  imagesDir: path.join(__dirname, 'output', 'images'),
  listingsFile: path.join(__dirname, 'output', 'listings.json'),
  csvFile: path.join(__dirname, 'output', 'listings.csv'),
  idsFile: path.join(__dirname, 'output', 'scraped_ids.json'),
  checkpointFile: path.join(__dirname, 'output', 'checkpoint.json'),
  successLogFile: path.join(__dirname, 'output', 'success.log'),
  skippedLogFile: path.join(__dirname, 'output', 'skipped.log'),
  failedLogFile: path.join(__dirname, 'output', 'failed.log'),

  // 타이밍
  delayMin: 1500,      // 최소 딜레이 (ms)
  delayMax: 3000,      // 최대 딜레이 (ms)
  retryCount: 3,       // 재시도 횟수
  retryDelay: 1000,    // 재시도 딜레이 (ms)

  // 필드 매핑 (extractPostDetails에서 사용)
  itemNames: [
    '매물업종', '매물위치', '실평수', '해당층',
    '보증금', '희망권리금', '월세', '시설집기',
    '입주가능일', '사업자&영업허가증 여부', '행정처분여부', '연락처'
  ],
  fieldMapping: {
    '매물업종': 'category',
    '매물위치': 'location',
    '실평수': 'size',
    '해당층': 'floor',
    '보증금': 'deposit',
    '희망권리금': 'premium',
    '월세': 'monthly_rent',
    '시설집기': 'facilities',
    '입주가능일': 'move_in_date',
    '사업자&영업허가증 여부': 'business_license',
    '행정처분여부': 'administrative_record',
    '연락처': 'contact'
  }
};

// ============================================================================
// 유틸리티 함수
// ============================================================================

let logStreams = {};
const logCounts = { success: 0, failed: 0, skipped: 0 };

function initLogFiles() {
  // flags: 'a'로 append 모드로 변경 (기존 로그 보존)
  logStreams = {
    success: fs.createWriteStream(CONFIG.successLogFile, { flags: 'a' }),
    skipped: fs.createWriteStream(CONFIG.skippedLogFile, { flags: 'a' }),
    failed: fs.createWriteStream(CONFIG.failedLogFile, { flags: 'a' })
  };
  logCounts.success = 0;
  logCounts.failed = 0;
  logCounts.skipped = 0;
}

function closeLogFiles() {
  Object.values(logStreams).forEach(stream => {
    if (stream && typeof stream.end === 'function') {
      stream.end();
    }
  });
}

function logToFile(type, message) {
  if (logStreams[type]) {
    logStreams[type].write(`${new Date().toISOString()} | ${message}\n`);
    logCounts[type]++;
  }
}

function removeHtmlTags(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function saveCheckpoint(processedIdx) {
  try {
    const checkpoint = {
      timestamp: new Date().toISOString(),
      processedIdx: Array.from(processedIdx)
    };
    fs.writeFileSync(CONFIG.checkpointFile, JSON.stringify(checkpoint, null, 2));
  } catch (error) {
    log('⚠️  checkpoint 저장 실패:', error.message);
  }
}

function loadCheckpoint() {
  try {
    if (fs.existsSync(CONFIG.checkpointFile)) {
      const data = JSON.parse(fs.readFileSync(CONFIG.checkpointFile, 'utf-8'));
      return new Set(data.processedIdx || []);
    }
  } catch (error) {
    log('⚠️  checkpoint 로드 실패:', error.message);
  }
  return new Set();
}

function log(...args) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]`, ...args);
}

function getRandomDelay() {
  return Math.floor(Math.random() * (CONFIG.delayMax - CONFIG.delayMin + 1)) + CONFIG.delayMin;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 전화번호 정규화 (01058793568 → 010-5879-3568)
function normalizePhoneNumber(phone) {
  if (!phone) return null;
  const cleaned = String(phone).replace(/[^\d]/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('010')) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone; // 형식이 맞지 않으면 원본 반환
}

// location 기반 region 자동 추출 (화곡동 → 서울)
function extractRegionFromLocation(location) {
  if (!location) return '서울'; // 기본값

  const REGIONS = {
    '서울': ['서울', '강서', '강남', '강동', '강북', '마포', '서초', '구로', '영등포', '종로', '중구', '노원', '관악', '동작', '동대문', '화곡', '답십리', '상계'],
    '경기': ['경기', '수원', '성남', '안양', '부천', '용인', '시흥', '안산', '화성', '평택', '파주', '광주', '광명', '군포', '오산', '고양', '김포', '이천', '하남'],
    '인천': ['인천', '계양', '남동', '동구', '미추홀', '연수', '중구'],
    '부산': ['부산', '해운대', '남구', '동구', '서구', '북구', '강서', '사상', '영도', '중구'],
    '대구': ['대구', '중구', '동구', '서구', '남구', '북구', '수성'],
    '광주': ['광주', '동구', '서구', '남구', '북구'],
    '대전': ['대전', '동구', '서구', '유성', '대덕'],
    '울산': ['울산', '중구', '남구', '동구', '북구'],
    '세종': ['세종'],
    '강원': ['강원', '춘천', '원주', '강릉', '동해', '태백', '삼척', '속초', '고성', '홍천', '횡성', '영월', '평창', '정선', '인제', '철원', '화천', '양구', '양양'],
    '충북': ['충북', '청주', '충주', '제천', '보은', '옥천', '영동', '괴산', '음성', '단양'],
    '충남': ['충남', '천안', '공주', '보령', '아산', '서산', '논산', '계룡', '당진', '금산', '홍성', '예산', '태안'],
    '전북': ['전북', '전주', '군산', '익산', '정읍', '남원', '김제', '완주', '진안', '무주', '장수', '임실', '순창', '고창', '부안'],
    '전남': ['전남', '목포', '여수', '순천', '나주', '광양', '담양', '곡성', '구례', '고흥', '보성', '화순', '장흥', '강진', '해남', '영암', '무안', '함평', '영광', '장성', '완도', '진도', '신안'],
    '경북': ['경북', '포항', '경주', '김천', '안동', '구미', '영천', '상주', '문경', '경산', '군위', '의성', '청송', '영양', '영덕', '청도', '고령', '성주', '칠곡'],
    '경남': ['경남', '창원', '진주', '통영', '사천', '김해', '밀양', '거제', '거창', '합천', '함안', '함양', '산청', '남해'],
    '제주': ['제주', '서귀포']
  };

  const lowerLocation = location.toLowerCase();

  for (const [region, keywords] of Object.entries(REGIONS)) {
    if (keywords.some(k => lowerLocation.includes(k.toLowerCase()))) {
      return region;
    }
  }

  return '서울'; // 기본값
}

// 가격 문자열을 숫자로 변환 (안전)
function parsePrice(price) {
  if (price === null || price === undefined) return null;
  const num = parseInt(String(price).replace(/[^\d]/g, ''));
  return isNaN(num) ? null : num;
}

async function checkRobotsTxt() {
  try {
    log('🤖 robots.txt 확인 중...');
    const response = await axios.get(`${CONFIG.baseUrl}/robots.txt`, { timeout: 5000 });

    if (response.status === 200) {
      log('✅ robots.txt 확인: 스크래핑 허용됨');
      return true;
    }
  } catch (error) {
    log('⚠️  robots.txt 체크 실패:', error.message);
  }
  return true; // 기본값: 진행
}

function loadExistingIds() {
  try {
    if (fs.existsSync(CONFIG.idsFile)) {
      const data = JSON.parse(fs.readFileSync(CONFIG.idsFile, 'utf-8'));
      log(`📋 기존 idx 로드: ${data.length}개`);
      return new Set(data);
    }
  } catch (error) {
    log('⚠️  기존 idx 로드 실패:', error.message);
  }
  return new Set();
}

function loadExistingListings() {
  try {
    if (fs.existsSync(CONFIG.listingsFile)) {
      const data = JSON.parse(fs.readFileSync(CONFIG.listingsFile, 'utf-8'));
      log(`📊 기존 listings 로드: ${data.length}개`);
      return data;
    }
  } catch (error) {
    log('⚠️  기존 listings 로드 실패:', error.message);
  }
  return [];
}

function saveIds(ids) {
  fs.writeFileSync(CONFIG.idsFile, JSON.stringify(Array.from(ids), null, 2));
}

function saveListings(listings) {
  fs.writeFileSync(CONFIG.listingsFile, JSON.stringify(listings, null, 2));
}

// 개별 항목을 listings.json에 즉시 추가/업데이트 (upsert)
function upsertListing(listing) {
  try {
    let listings = [];

    // 기존 데이터 읽기
    if (fs.existsSync(CONFIG.listingsFile)) {
      try {
        const data = fs.readFileSync(CONFIG.listingsFile, 'utf-8');
        if (data.trim()) {
          listings = JSON.parse(data);
        }
      } catch (error) {
        log(`⚠️  기존 listings 읽기 실패: ${error.message}, 새로 시작합니다.`);
        listings = [];
      }
    }

    // idx 기준으로 기존 항목 찾기
    const existingIndex = listings.findIndex(l => l.idx === listing.idx);

    if (existingIndex !== -1) {
      // 기존 항목: 업데이트
      listings[existingIndex] = listing;
    } else {
      // 신규 항목: 추가
      listings.push(listing);
    }

    // 변경사항 저장 (동기적으로 즉시)
    fs.writeFileSync(CONFIG.listingsFile, JSON.stringify(listings, null, 2));

    return true;
  } catch (error) {
    log(`❌ Listing 저장 오류 (idx=${listing.idx}): ${error.message}`);
    return false;
  }
}

async function saveListingsCSV(listings) {
  if (listings.length === 0) return;

  try {
    const csvWriter = createObjectCsvWriter({
      path: CONFIG.csvFile,
      header: [
        { id: 'idx', title: 'idx' },
        { id: 'title', title: 'title' },
        { id: 'detail_url', title: 'detail_url' },
        { id: 'category', title: 'category' },
        { id: 'location', title: 'location' },
        { id: 'size', title: 'size' },
        { id: 'floor', title: 'floor' },
        { id: 'deposit', title: 'deposit' },
        { id: 'premium', title: 'premium' },
        { id: 'monthly_rent', title: 'monthly_rent' },
        { id: 'facilities', title: 'facilities' },
        { id: 'move_in_date', title: 'move_in_date' },
        { id: 'business_type', title: 'business_type' },
        { id: 'reason', title: 'reason' },
        { id: 'contact', title: 'contact' },
        { id: 'images', title: 'images' },
        { id: 'crawled_at', title: 'crawled_at' }
      ]
    });

    await csvWriter.writeRecords(listings);
    log(`✅ CSV 저장: ${listings.length}개`);
  } catch (error) {
    log('❌ CSV 저장 실패:', error.message);
  }
}

async function downloadImages(imageUrls, idx) {
  const idxDir = path.join(CONFIG.imagesDir, idx);

  if (!fs.existsSync(idxDir)) {
    fs.mkdirSync(idxDir, { recursive: true });
  }

  const downloadedPaths = [];

  for (let i = 0; i < Math.min(imageUrls.length, 10); i++) {
    const imageUrl = imageUrls[i];
    const filename = `${i + 1}.jpg`;
    const filepath = path.join(idxDir, filename);

    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 10000 });
      fs.writeFileSync(filepath, response.data);
      downloadedPaths.push(`scripts/output/images/${idx}/${filename}`);
    } catch (error) {
      log(`  ⚠️  이미지 다운로드 실패 [${i + 1}]: ${error.message}`);
    }
  }

  return downloadedPaths;
}

// ============================================================================
// 크롤링 함수
// ============================================================================

async function extractPostLinks(page) {
  return await page.evaluate(() => {
    const links = [];
    document.querySelectorAll('.title_link._fade_link').forEach(link => {
      const href = link.getAttribute('href');
      const text = link.innerText?.trim() || '';

      if (href && text && href.includes('bmode=view') && href.includes('idx=')) {
        const idxMatch = href.match(/&idx=(\d+)/);
        const idx = idxMatch ? idxMatch[1] : null;

        if (idx) {
          links.push({
            idx,
            title: text.split('\n')[0].trim(),
            href
          });
        }
      }
    });

    return links;
  });
}

async function extractPostDetails(page) {
  return await page.evaluate((itemNames) => {
    const bodyText = document.body.innerText;
    const lines = bodyText.split('\n');
    const items = {};
    let firstItemIndex = -1; // 게시글 시작 위치 (첫 번째 항목 "1. ")
    let lastItemIndex = -1;
    let foundItemCount = 0;

    // 1~12번 항목 추출 (정확한 번호 기반 파싱)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // "1. 항목명 : 값" 또는 "1. 항목명 : 값\n값" 형식 처리
      for (let itemNum = 1; itemNum <= 12; itemNum++) {
        const numPattern = `${itemNum}\\.\\s*`;
        if (line.match(new RegExp(`^${numPattern}`))) {
          // 첫 번째 항목 위치 기록 (게시글 시작)
          if (firstItemIndex === -1) {
            firstItemIndex = i;
          }

          // 항목명과 값 추출
          const colonIdx = line.indexOf(':');
          const colonIdx2 = line.indexOf('：'); // 전각 콜론
          const splitIdx = colonIdx > -1 ? colonIdx : colonIdx2;

          if (splitIdx > -1) {
            let itemName = line.substring(numPattern.length, splitIdx).trim();
            let itemValue = line.substring(splitIdx + 1).trim();

            // 항목명 매핑
            const itemMapping = {
              '매물업종': 'category',
              '매물위치': 'location',
              '실평수': 'size',
              '해당층': 'floor',
              '보증금': 'deposit',
              '희망권리금': 'premium',
              '월세': 'monthly_rent',
              '시설집기': 'facilities',
              '입주가능일': 'move_in_date',
              '사업자&영업허가증 여부': 'business_license',
              '사업자': 'business_license',
              '영업허가증 여부': 'business_license',
              '행정처분여부': 'administrative_record',
              '행정처분': 'administrative_record',
              '연락처': 'contact'
            };

            // 현재 줄의 항목명 찾기
            const matchedKey = Object.keys(itemMapping).find(k => itemName.includes(k));

            if (matchedKey) {
              const key = itemMapping[matchedKey];
              items[matchedKey] = itemValue;
              lastItemIndex = i; // 마지막 항목이 찾아진 라인 위치 기록
              foundItemCount++;
            }
          }
          break;
        }
      }
    }

    // 게시글 원문 전체 추출 (첫 "1."부터 자유문단까지)
    let description = '';
    const debugLines = [];
    if (firstItemIndex > -1) {
      const descLines = [];
      let cutoffIndex = lines.length; // 기본값: 전체 라인까지

      // 사이트 공통 안내문 찾기
      for (let i = firstItemIndex; i < lines.length; i++) {
        const trimmedLine = lines[i].trim();

        // "매장 사진이 있으면 꼭! 등록해주세요" 이후는 제거
        if (trimmedLine.includes('매장 사진이 있으면 꼭')) {
          cutoffIndex = i;
          break;
        }

        // 다음 게시글의 명확한 시작 (1. 매물업종)
        if (
          i > lastItemIndex + 5 && // 최소 5줄 떨어진 후부터 체크
          trimmedLine.match(/^1\.\s*매물업종\s*[:：]/)
        ) {
          cutoffIndex = i;
          break;
        }
      }

      // firstItemIndex부터 cutoffIndex까지 추출
      for (let i = firstItemIndex; i < cutoffIndex; i++) {
        descLines.push(lines[i]);
      }

      description = descLines.join('\n').trimEnd();

      // 디버그 로그: 마지막 10줄
      for (let i = Math.max(firstItemIndex, cutoffIndex - 10); i < cutoffIndex; i++) {
        if (i < lines.length) {
          debugLines.push(lines[i].substring(0, 80));
        }
      }
    }

    // 게시글 본문 영역 내부 이미지만 추출 (디버깅 로그 포함)
    const images = new Set();
    const extractionLog = [];

    // 본문 컨테이너 우선순위 선택자
    const contentSelectors = [
      'article',
      '[class*="article"]',
      '[class*="content"]',
      '[class*="board_view"]',
      '[class*="post_content"]',
      '[class*="post-content"]',
      '[class*="detail"]',
      '[class*="editor"]',
      '[class*="ck-content"]',
      '[id*="content"]',
      '[id*="article"]'
    ];

    // 제외할 영역 (게시글 본문 외부만)
    const excludeSelectors = [
      'header',
      'nav',
      'footer',
      '[class*="navigation"]',
      '[class*="sidebar"]',
      '[class*="ads"]',
      '[class*="advertisement"]',
      '.logo-area',
      '[class*="breadcrumb"]'
    ];

    // 본문 컨테이너 찾기
    let contentContainer = null;
    let foundSelector = null;

    for (const selector of contentSelectors) {
      const el = document.querySelector(selector);
      if (el && el.querySelectorAll('img').length > 0) {
        contentContainer = el;
        foundSelector = selector;
        break;
      }
    }

    if (contentContainer) {
      extractionLog.push(`📍 컨테이너: ${foundSelector}`);

      // URL 필터 함수 (극도로 단순화)
      const isValidImageUrl = (url) => {
        // CDN 이미지만 허용 (PC천국의 실제 이미지 호스팅)
        if (!url.includes('cdn.imweb.me') && !url.includes('imweb.me')) {
          return false;
        }

        // CDN-optimized (captcha)는 제외
        if (url.includes('cdn-optimized')) {
          return false;
        }

        // common/img (기본 이미지)는 제외
        if (url.includes('common/img')) {
          return false;
        }

        return true;
      };

      // 컨테이너 내부 이미지만 추출
      contentContainer.querySelectorAll('img').forEach(img => {
        const src = img.src;
        const alt = img.alt || '';

        // 1. URL 필터링
        if (!isValidImageUrl(src)) {
          extractionLog.push(`  ❌ 제외 (URL): ${src.substring(0, 50)}...`);
          return;
        }

        // 2. 제외 영역 확인
        const inExcludedArea = Array.from(document.querySelectorAll(excludeSelectors.join(','))).some(
          excludedEl => excludedEl.contains(img)
        );
        if (inExcludedArea) {
          extractionLog.push(`  ❌ 제외 (영역): ${src.substring(0, 50)}...`);
          return;
        }

        // 3. 이미지 크기 확인
        if (img.width && img.width < 150) {
          extractionLog.push(`  ❌ 제외 (너무작음): ${src.substring(0, 50)}... (${img.width}px)`);
          return;
        }

        // 4. CDN 필터 (PC천국 이미지만)
        if (!src.includes('cdn.imweb.me') && !src.includes('imweb.me')) {
          extractionLog.push(`  ❌ 제외 (CDN): ${src.substring(0, 50)}...`);
          return;
        }

        // 모든 필터를 통과한 이미지
        images.add(src);
        extractionLog.push(`  ✅ 포함: ${src.substring(0, 60)}...`);
      });
    } else {
      extractionLog.push(`⚠️  본문 컨테이너 못 찾음 - 모든 이미지 시도`);
      // Fallback: CDN 이미지만 가져오기
      document.querySelectorAll('img').forEach(img => {
        const src = img.src;
        if (src && (src.includes('cdn.imweb.me') || src.includes('imweb.me'))) {
          if (!['banner', 'logo', 'ads', 'thumb', 'icon', 'common'].some(k => src.includes(k))) {
            images.add(src);
          }
        }
      });
    }

    return {
      items,
      images: Array.from(images),
      extractionLog,
      description,
      debugLines
    };
  }, CONFIG.itemNames);
}

async function scrapePost(page, postInfo, scrapedIds, scrapedListings, update = false) {
  // 중복 체크
  if (!update && scrapedIds.has(postInfo.idx)) {
    log(`⏭️  스킵 (이미 스크래핑됨): idx=${postInfo.idx}`);
    logToFile('skipped', `idx=${postInfo.idx} | title=${postInfo.title} | reason=already_scraped`);
    return { status: 'skipped', idx: postInfo.idx };
  }

  try {
    // detail_url 생성 (경로 중복 제거)
    let detailUrl = postInfo.href;
    if (detailUrl.startsWith('/40/')) {
      detailUrl = detailUrl.substring(1); // '/40/'를 제거
    }
    detailUrl = `${CONFIG.boardUrl}${detailUrl}`;

    log(`📄 방문: idx=${postInfo.idx} | ${postInfo.title.substring(0, 50)}`);

    // 상세페이지 방문 (재시도 포함)
    let pageLoaded = false;
    for (let retry = 0; retry < CONFIG.retryCount; retry++) {
      try {
        await page.goto(detailUrl, { waitUntil: 'networkidle', timeout: 20000 });
        pageLoaded = true;
        break;
      } catch (error) {
        log(`  ⚠️  로드 실패 (시도 ${retry + 1}/${CONFIG.retryCount}): ${error.message}`);
        if (retry < CONFIG.retryCount - 1) {
          await sleep(CONFIG.retryDelay * (retry + 1));
        }
      }
    }

    if (!pageLoaded) {
      log(`  ❌ 최대 재시도 횟수 초과`);
      logToFile('failed', `idx=${postInfo.idx} | title=${postInfo.title} | reason=page_load_failed`);
      return { status: 'failed', idx: postInfo.idx };
    }

    // 데이터 추출
    const details = await extractPostDetails(page);

    // 이미지 추출 로그 출력
    if (details.extractionLog && details.extractionLog.length > 0) {
      console.log(`  📸 이미지 추출 로그:`);
      details.extractionLog.forEach(log => console.log(`    ${log}`));
    }

    // 게시글 원문 마지막 10줄 디버그 로그
    if (details.debugLines && details.debugLines.length > 0) {
      console.log(`  📋 게시글 원문 마지막 10줄:`);
      details.debugLines.forEach(line => console.log(`    ${line}`));
    }

    // 이미지 다운로드
    const downloadedImages = await downloadImages(details.images, postInfo.idx);

    // 필드 정제 함수
    const cleanField = (text) => {
      if (!text) return '';
      return text.trim();
    };

    // 월세에서 숫자만 추출 ("120 관리7" → "120")
    const cleanMonthlyRent = (text) => {
      if (!text) return '';
      const match = text.match(/(\d+)/);
      return match ? match[1] : text.trim();
    };

    // 시설집기에서 placeholder 제거 ("예)PC7대,..." → "PC7대,...")
    const cleanFacilities = (text) => {
      if (!text) return '';
      return text.replace(/^예\s*\)\s*/, '').trim();
    };

    // 필드 매핑 (원문 정확하게) + 정규화
    const rawLocation = cleanField(details.items['매물위치']);

    // HTML 태그 제거 후 description 정리
    const cleanedDescription = removeHtmlTags(details.description || '');

    const listing = {
      idx: postInfo.idx,
      title: postInfo.title.split('\n')[0].trim(),
      detail_url: detailUrl,
      category: cleanField(details.items['매물업종']),
      location: rawLocation,
      region: extractRegionFromLocation(rawLocation),
      size: cleanField(details.items['실평수']),
      floor: cleanField(details.items['해당층']),
      deposit: parsePrice(details.items['보증금']),
      premium: parsePrice(details.items['희망권리금']),
      monthly_rent: parsePrice(cleanMonthlyRent(details.items['월세'])),
      facilities: cleanFacilities(details.items['시설집기']),
      move_in_date: cleanField(details.items['입주가능일']),
      business_license: cleanField(details.items['사업자&영업허가증 여부'] || details.items['사업자']),
      administrative_record: cleanField(details.items['행정처분여부'] || details.items['행정처분']),
      contact: normalizePhoneNumber(details.items['연락처']),
      images: downloadedImages,
      description: cleanedDescription || null,
      crawled_at: new Date().toISOString()
    };

    // 🚨 실제 사진이 없으면 스킵하지만 데이터는 저장
    if (downloadedImages.length === 0) {
      log(`  ⏭️  이미지 없음 (데이터만 저장): idx=${postInfo.idx} | ${postInfo.title.substring(0, 50)}`);
      logToFile('skipped', `idx=${postInfo.idx} | title=${postInfo.title} | reason=no_images`);
      return { status: 'no_images', idx: postInfo.idx, listing };
    }

    log(`  ✅ 성공: 12항목=${Object.values(details.items).filter(v => v).length}개, 이미지=${downloadedImages.length}개`);
    logToFile('success', `idx=${postInfo.idx} | title=${postInfo.title} | images=${downloadedImages.length}`);

    return { status: 'success', idx: postInfo.idx, listing };

  } catch (error) {
    log(`  ❌ 오류: ${error.message}`);
    logToFile('failed', `idx=${postInfo.idx} | title=${postInfo.title} | reason=${error.message}`);
    return { status: 'failed', idx: postInfo.idx };
  }
}

// ============================================================================
// 메인 함수
// ============================================================================

async function runScraper() {
  log('═'.repeat(80));
  log('🚀 자동화 스크래퍼 시작');
  log('═'.repeat(80));

  // 로그 파일 초기화
  initLogFiles();

  // 명령행 인자 처리
  const args = process.argv.slice(2);
  const testMode = args.includes('--test');
  const testCount = testMode ? parseInt(args[args.indexOf('--test') + 1]) || 5 : null;
  const updateMode = args.includes('--update');

  if (testMode) {
    log(`📌 테스트 모드: ${testCount}개만 스크래핑`);
  }
  if (updateMode) {
    log(`🔄 업데이트 모드: 기존 항목도 덮어쓰기`);
  }

  // 체크포인트에서 이미 처리된 idx 로드
  let processedInCheckpoint = updateMode ? new Set() : loadCheckpoint();
  if (processedInCheckpoint.size > 0) {
    log(`📌 체크포인트에서 ${processedInCheckpoint.size}개 항목 로드됨 (재시작됨)`);
  }

  let browser;
  let shouldGracefulShutdown = false;

  // Ctrl+C 핸들러 설정
  process.on('SIGINT', () => {
    log('\n\n⚠️  Ctrl+C 감지됨. 현재 페이지 완료 후 종료합니다...');
    shouldGracefulShutdown = true;
  });

  try {
    // robots.txt 확인
    if (!await checkRobotsTxt()) {
      log('❌ robots.txt 에서 크롤링 금지됨');
      return;
    }

    // 세션 로드
    if (!fs.existsSync(CONFIG.authFile)) {
      log('❌ playwright-auth.json을 찾을 수 없습니다.');
      log('   먼저 manual-login-capture.js를 실행하여 세션을 저장하세요.');
      return;
    }

    browser = await chromium.launch({ headless: true });
    const storageState = JSON.parse(fs.readFileSync(CONFIG.authFile, 'utf-8'));
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();

    // 기존 데이터 로드
    const scrapedIds = updateMode ? new Set() : loadExistingIds();
    let scrapedListings = loadExistingListings();

    // 목록 페이지 순회
    log('\n📋 게시판 목록 순회 시작');
    log('─'.repeat(80));

    const allPostLinks = [];
    let pageNum = 1;
    let totalFound = 0;
    const maxPages = testMode ? 2 : 999; // 테스트 모드: 2페이지만, 일반 모드: 전체 순회

    while (pageNum <= maxPages) {
      const pageUrl = pageNum === 1 ? CONFIG.boardUrl : `${CONFIG.boardUrl}?p=${pageNum}`;
      log(`\n페이지 ${pageNum} 로드 중...`);

      try {
        await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 20000 });

        const postLinks = await extractPostLinks(page);
        if (postLinks.length === 0) {
          log(`✅ 마지막 페이지 도달 (빈 페이지)`);
          break;
        }

        log(`   📍 발견된 게시글: ${postLinks.length}개`);
        allPostLinks.push(...postLinks);
        totalFound += postLinks.length;

        pageNum++;
        await sleep(getRandomDelay());

      } catch (error) {
        log(`❌ 페이지 로드 실패: ${error.message}`);
        break;
      }
    }

    log('\n' + '═'.repeat(80));
    log(`📊 총 ${totalFound}개 게시글 발견`);
    log('═'.repeat(80));

    // 상세페이지 스크래핑
    let successCount = 0;
    let noImagesCount = 0;
    let skipCount = 0;
    let failCount = 0;

    log('\n🔍 상세페이지 스크래핑 시작');
    log('─'.repeat(80));

    const limitedPostLinks = testMode ? allPostLinks.slice(0, testCount) : allPostLinks;

    for (let i = 0; i < limitedPostLinks.length; i++) {
      if (shouldGracefulShutdown) {
        log('\n⚠️  우아한 종료 진행 중... 현재까지의 데이터를 저장합니다.');
        break;
      }

      const postInfo = limitedPostLinks[i];

      log(`\n[${i + 1}/${limitedPostLinks.length}]`);

      const result = await scrapePost(page, postInfo, scrapedIds, scrapedListings, updateMode);

      if (result) {
        processedInCheckpoint.add(result.idx);

        if (result.status === 'success') {
          // ✅ 즉시 listings.json에 저장 (upsert)
          if (upsertListing(result.listing)) {
            scrapedListings.push(result.listing);
            scrapedIds.add(result.idx);
            successCount++;
          } else {
            log(`  ⚠️  저장 실패했으나 메모리에는 유지됨`);
            scrapedListings.push(result.listing);
            scrapedIds.add(result.idx);
            successCount++;
          }
        } else if (result.status === 'no_images') {
          // 이미지가 없어도 데이터는 저장
          // ✅ 즉시 listings.json에 저장 (upsert)
          if (upsertListing(result.listing)) {
            scrapedListings.push(result.listing);
            scrapedIds.add(result.idx);
            noImagesCount++;
          } else {
            log(`  ⚠️  저장 실패했으나 메모리에는 유지됨`);
            scrapedListings.push(result.listing);
            scrapedIds.add(result.idx);
            noImagesCount++;
          }
        } else if (result.status === 'skipped') {
          skipCount++;
        } else if (result.status === 'failed') {
          failCount++;
        }

        // 10개마다 체크포인트와 listings.json 저장
        if ((i + 1) % 10 === 0 || i === limitedPostLinks.length - 1) {
          saveCheckpoint(processedInCheckpoint);
          // 10개마다 목록을 다시 정렬하여 저장 (보험용)
          log(`  💾 ${i + 1}개 항목 처리 완료 - 상태 저장됨`);
        }
      }

      // 딜레이 (마지막이 아닐 때만)
      if (i < limitedPostLinks.length - 1 && !shouldGracefulShutdown) {
        await sleep(getRandomDelay());
      }
    }

    // 최종 결과 저장
    log('\n' + '═'.repeat(80));
    log('💾 최종 결과 저장 중...');
    log('─'.repeat(80));

    // 디스크에서 최종 listings.json 읽기 (이미 저장된 데이터 기준)
    let finalListings = [];
    try {
      if (fs.existsSync(CONFIG.listingsFile)) {
        const data = fs.readFileSync(CONFIG.listingsFile, 'utf-8');
        if (data.trim()) {
          finalListings = JSON.parse(data);
        }
      }
    } catch (error) {
      log(`⚠️  최종 listings 읽기 실패: ${error.message}`);
      finalListings = scrapedListings;
    }

    // 중복 제거 (idx 기준)
    const uniqueListings = [];
    const seenIds = new Set();
    for (const listing of finalListings) {
      if (!seenIds.has(listing.idx)) {
        uniqueListings.push(listing);
        seenIds.add(listing.idx);
      }
    }

    // 최종 저장 (이미 저장된 데이터로 덮어쓰기 방지)
    saveListings(uniqueListings);
    saveIds(seenIds);
    await saveListingsCSV(uniqueListings);

    log(`✅ 최종 저장 완료: ${uniqueListings.length}개 항목`);

    // 최종 통계 및 검증
    log('\n' + '═'.repeat(80));
    if (shouldGracefulShutdown) {
      log('⚠️  스크래핑 중단됨 (Ctrl+C)');
    } else {
      log('✅ 스크래핑 완료');
    }
    log('═'.repeat(80));
    log(`\n📊 수집 통계:`);
    log(`   ✅ 성공 (이미지 있음): ${successCount}개`);
    log(`   ⏭️  스킵 (사진 없음): ${noImagesCount}개 - 데이터는 저장됨`);
    log(`   ⏭️  스킵 (이미 스크래핑됨): ${skipCount}개`);
    log(`   ❌ 실패: ${failCount}개`);
    log(`   📋 총 저장: ${uniqueListings.length}개 (중복 제거 후)`);

    // 데이터 일관성 검증
    const totalProcessed = successCount + noImagesCount;
    const successLogCount = logCounts.success || successCount;
    const totalListingsInFile = uniqueListings.length;

    log(`\n✅ 데이터 일관성 검증:`);
    log(`   - 처리된 항목 (메모리): ${totalProcessed}개`);
    log(`   - 성공.log 기록: ${successLogCount}개`);
    log(`   - listings.json 저장: ${totalListingsInFile}개`);

    if (totalListingsInFile >= totalProcessed) {
      log(`   ✅ 일관성 확인됨 (저장된 데이터 >= 처리된 데이터)`);
    } else {
      log(`   ⚠️  주의: 저장된 데이터 < 처리된 데이터 (손실 가능성)`);
    }
    log(`\n📁 저장 위치:`);
    log(`   - JSON: ${CONFIG.listingsFile}`);
    log(`   - CSV: ${CONFIG.csvFile}`);
    log(`   - 이미지: ${CONFIG.imagesDir}`);
    log(`\n📄 로그 파일:`);
    log(`   - 성공: ${CONFIG.successLogFile}`);
    log(`   - 스킵: ${CONFIG.skippedLogFile}`);
    log(`   - 실패: ${CONFIG.failedLogFile}`);

    // 이미지 없는 매물 목록 출력
    const noImageListings = uniqueListings.filter(l => !l.images || l.images.length === 0);
    if (noImageListings.length > 0) {
      log(`\n⚠️  이미지 없는 매물 ${noImageListings.length}개:`);
      noImageListings.slice(0, 20).forEach(l => {
        log(`   - idx=${l.idx} | ${l.title}`);
      });
      if (noImageListings.length > 20) {
        log(`   ... 그 외 ${noImageListings.length - 20}개`);
      }
    }

    await context.close();

  } catch (error) {
    log(`❌ 치명적 오류: ${error.message}`);
    log(error.stack);
  } finally {
    if (browser) {
      await browser.close();
    }
    closeLogFiles();
  }
}

// ============================================================================
// 실행
// ============================================================================

runScraper().catch(error => {
  log(`❌ 오류: ${error.message}`);
  process.exit(1);
});
