#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { createObjectCsvWriter } = require('csv-writer');
const { getAdapter, listAdapters } = require('./adapters');

// ============================================================================
// CONFIG & SETUP
// ============================================================================

const OUTPUT_DIR = path.join(__dirname, 'output');
const CONFIG = {
  outputDir: OUTPUT_DIR,
  imagesDir: path.join(OUTPUT_DIR, 'images'),
  listingsFile: path.join(OUTPUT_DIR, 'listings.json'),
  csvFile: path.join(OUTPUT_DIR, 'listings.csv'),
  idsFile: path.join(OUTPUT_DIR, 'scraped_ids.json'),
  checkpointFile: path.join(OUTPUT_DIR, 'checkpoint.json'),
  successLogFile: path.join(OUTPUT_DIR, 'success.log'),
  skippedLogFile: path.join(OUTPUT_DIR, 'skipped.log'),
  failedLogFile: path.join(OUTPUT_DIR, 'failed.log'),
  delayMin: 300,
  delayMax: 800,
  retryCount: 3,
  retryDelay: 1000
};

// Ensure output directory
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

// ============================================================================
// UTILITIES
// ============================================================================

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

function extractPageNumberFromUrl(url) {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    // 여러 파라미터명 시도: p, page, paged, pagenum 등
    for (const paramName of ['p', 'page', 'paged', 'pagenum']) {
      const value = params.get(paramName);
      if (value) {
        const pageNum = parseInt(value);
        if (!isNaN(pageNum) && pageNum > 0) {
          return pageNum;
        }
      }
    }

    // 상대경로면 현재 마지막 부분에서 추출 시도
    const pathMatch = url.match(/[?&](p|page)=(\d+)/);
    if (pathMatch) {
      return parseInt(pathMatch[2]);
    }
  } catch (error) {
    log(`⚠️  URL 파싱 실패: ${error.message}`);
  }

  return null;
}

function extractRegionFromLocation(location) {
  if (!location) return '서울';

  const REGIONS = {
    '서울': ['서울', '강서', '강남', '강동', '강북', '마포', '서초', '구로', '영등포'],
    '경기': ['경기', '수원', '성남', '안양', '부천', '용인', '시흥', '안산', '화성'],
    '인천': ['인천'],
    '부산': ['부산'],
    '대구': ['대구'],
    '광주': ['광주'],
    '대전': ['대전'],
    '울산': ['울산'],
    '세종': ['세종'],
    '강원': ['강원'],
    '충북': ['충북'],
    '충남': ['충남'],
    '전북': ['전북'],
    '전남': ['전남'],
    '경북': ['경북'],
    '경남': ['경남'],
    '제주': ['제주']
  };

  const lowerLocation = location.toLowerCase();
  for (const [region, keywords] of Object.entries(REGIONS)) {
    if (keywords.some(k => lowerLocation.includes(k.toLowerCase()))) {
      return region;
    }
  }
  return '서울';
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

function upsertListing(listing) {
  try {
    let listings = [];
    if (fs.existsSync(CONFIG.listingsFile)) {
      try {
        const data = fs.readFileSync(CONFIG.listingsFile, 'utf-8');
        if (data.trim()) listings = JSON.parse(data);
      } catch (error) {
        log(`⚠️  기존 listings 읽기 실패: ${error.message}`);
        listings = [];
      }
    }

    const existingIndex = listings.findIndex(l => l.idx === listing.idx);
    if (existingIndex !== -1) {
      listings[existingIndex] = listing;
    } else {
      listings.push(listing);
    }

    fs.writeFileSync(CONFIG.listingsFile, JSON.stringify(listings, null, 2));
    return true;
  } catch (error) {
    log(`❌ Listing 저장 오류 (idx=${listing.idx}): ${error.message}`);
    return false;
  }
}

async function downloadImages(imageUrls, idx) {
  const idxDir = path.join(CONFIG.imagesDir, idx);
  if (!fs.existsSync(idxDir)) {
    fs.mkdirSync(idxDir, { recursive: true });
  }

  // 모든 이미지를 병렬로 다운로드 (순차 대신)
  const maxImages = Math.min(imageUrls.length, 10);
  const downloadPromises = [];

  for (let i = 0; i < maxImages; i++) {
    const imageUrl = imageUrls[i];
    const filename = `${i + 1}.jpg`;
    const filepath = path.join(idxDir, filename);

    downloadPromises.push(
      (async () => {
        try {
          const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 10000 });
          fs.writeFileSync(filepath, response.data);
          return `scripts/output/images/${idx}/${filename}`;
        } catch (error) {
          log(`  ⚠️  이미지 다운로드 실패 [${i + 1}]: ${error.message}`);
          return null;
        }
      })()
    );
  }

  const results = await Promise.all(downloadPromises);
  return results.filter(r => r !== null);
}

async function saveListingsCSV(listings) {
  if (listings.length === 0) return;

  try {
    const csvWriter = createObjectCsvWriter({
      path: CONFIG.csvFile,
      header: [
        { id: 'idx', title: 'idx' },
        { id: 'title', title: 'title' },
        { id: 'source_url', title: 'source_url' },
        { id: 'source_name', title: 'source_name' },
        { id: 'location', title: 'location' },
        { id: 'size', title: 'size' },
        { id: 'floor', title: 'floor' },
        { id: 'deposit', title: 'deposit' },
        { id: 'premium_price', title: 'premium_price' },
        { id: 'monthly_rent', title: 'monthly_rent' },
        { id: 'facilities', title: 'facilities' },
        { id: 'move_in_date', title: 'move_in_date' },
        { id: 'business_license', title: 'business_license' },
        { id: 'administrative_record', title: 'administrative_record' },
        { id: 'contact', title: 'contact' },
        { id: 'description', title: 'description' },
        { id: 'crawled_at', title: 'crawled_at' }
      ]
    });

    await csvWriter.writeRecords(listings);
    log(`✅ CSV 저장: ${listings.length}개`);
  } catch (error) {
    log('❌ CSV 저장 실패:', error.message);
  }
}

// ============================================================================
// MAIN RUNNER
// ============================================================================

async function runScraperWithAdapter(adapterName, options = {}) {
  let { testLimit, update, maxPages, startPage, region } = options;
  const AdapterClass = getAdapter(adapterName);
  const adapter = new AdapterClass(region);

  log(`\n${'='.repeat(80)}`);
  log(`🚀 ${adapter.constructor.displayName} 스크래퍼 시작`);
  log(`${'='.repeat(80)}\n`);

  let browser = null;
  let page = null;
  const allPostLinks = [];
  const processedIdx = new Set();
  let scrapedIds = update ? new Set() : loadExistingIds();
  let scrapedListings = update ? [] : loadExistingListings();

  try {
    // 1. 체크포인트 로드
    const checkpoint = loadCheckpoint();
    if (checkpoint.size > 0) {
      log(`✅ 체크포인트 로드: ${checkpoint.size}개`);
      processedIdx.clear();
      checkpoint.forEach(id => processedIdx.add(id));
    }

    // 2. 브라우저 시작 및 어댑터 초기화
    browser = await chromium.launch({ headless: true });
    page = await adapter.setup(browser);
    log(`✅ 어댑터 초기화 완료\n`);

    // 3. 마지막 페이지 감지 (지정 안 된 경우)
    if (!startPage) {
      log('📍 마지막 페이지 자동 감지 중...');
      if (adapter.detectLastPage) {
        startPage = await adapter.detectLastPage(page);
        log(`✅ 감지된 마지막 페이지: ${startPage}\n`);
      } else {
        log('❌ 오류: --start-page 옵션이 필요합니다');
        log('\n사용법: node scripts/run-scraper.js --adapter pcbangkingdom --start-page 74\n');
        process.exit(1);
      }
    }

    log(`📋 페이지 역순 순회 시작 (${startPage} → 1)`);
    log(`   마지막 페이지: ${startPage}\n`);

    for (let pageNum = startPage; pageNum >= 1; pageNum--) {
      await adapter.navigateToPage(page, pageNum);
      const postLinks = await adapter.getPostLinks(page, pageNum);

      if (postLinks.length === 0) {
        log(`  ⏭️  페이지 ${pageNum}: 스킵 (게시글 없음)`);
        continue;
      }

      // 같은 페이지 내의 게시글도 역순으로 처리 (오래된 것부터)
      const reversedLinks = [...postLinks].reverse();

      log(`  ✅ 페이지 ${pageNum}: ${reversedLinks.length}개 (역순)`);
      allPostLinks.push(...reversedLinks);

      if (testLimit && allPostLinks.length >= testLimit * 2) break;

      await sleep(getRandomDelay());
    }

    log(`\n📊 총 수집: ${allPostLinks.length}개 게시글\n`);

    // 4. 상세페이지 스크래핑
    const uniqueIdxs = [...new Set(allPostLinks.map(p => p.idx))];
    log(`📍 고유 매물: ${uniqueIdxs.length}개\n`);

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;
    let processCount = 0;
    const startTime = new Date(); // 스크래핑 시작 시간
    let itemOffset = 0; // 각 매물마다 1초씩 증가

    for (const postInfo of allPostLinks) {
      if (testLimit && processCount >= testLimit) break;
      if (processedIdx.has(postInfo.idx)) continue;

      processCount++;
      const displayIdx = `[${processCount}/${Math.min(testLimit || allPostLinks.length, allPostLinks.length)}]`;

      // Skip 확인
      if (adapter.shouldSkip(postInfo, scrapedIds)) {
        skipCount++;
        log(`${displayIdx} ⏭️  스킵 (이미 수집): ${postInfo.idx}`);
        processedIdx.add(postInfo.idx);
        continue;
      }

      log(`${displayIdx} 🔍 상세: idx=${postInfo.idx} | ${postInfo.title.substring(0, 40)}`);

      try {
        // 상세페이지 이동 (재시도)
        let detailUrl = adapter.buildDetailUrl(postInfo);
        let pageLoaded = false;

        for (let retry = 0; retry < CONFIG.retryCount; retry++) {
          try {
            await page.goto(detailUrl, { waitUntil: 'networkidle', timeout: 15000 });
            pageLoaded = true;
            break;
          } catch (error) {
            if (retry < CONFIG.retryCount - 1) {
              await sleep(CONFIG.retryDelay * Math.pow(2, retry));
            }
          }
        }

        if (!pageLoaded) {
          throw new Error('상세페이지 로드 실패');
        }

        // 데이터 추출
        const details = await adapter.extractDetails(page);
        const downloadedImages = await downloadImages(details.imageUrls, postInfo.idx);

        // 상태 결정
        let status = 'success';
        if (downloadedImages.length === 0) {
          status = 'no_images';
          log(`  ⚠️  이미지 없음`);
        }

        // 각 매물마다 1초씩 증가하는 timestamp (끝페이지의 오래된 매물이 먼저, 첫페이지의 최신 매물이 나중)
        const crawledTime = new Date(startTime.getTime() + itemOffset * 1000);

        // 데이터 조합 (공통 스키마)
        const listing = {
          idx: postInfo.idx,
          title: postInfo.title.replace(/\s+N\s*$/, ''),
          detail_url: detailUrl,
          source_url: detailUrl,
          source_name: adapter.constructor.sourceName,
          category: '',
          location: details.location,
          region: extractRegionFromLocation(details.location),
          size: details.size,
          floor: details.floor,
          deposit: details.deposit,
          premium: details.premium_price,
          monthly_rent: details.monthly_rent,
          facilities: details.facilities,
          move_in_date: details.move_in_date,
          business_license: details.business_license,
          administrative_record: details.administrative_record,
          contact: details.contact,
          images: downloadedImages,
          description: details.description,
          status: status,
          crawled_at: crawledTime.toISOString()
        };

        itemOffset++; // 다음 매물은 1초 뒤로

        // 저장
        upsertListing(listing);
        scrapedIds.add(postInfo.idx);
        processedIdx.add(postInfo.idx);

        if (status === 'success') {
          successCount++;
          log(`  ✅ 저장 완료 (${downloadedImages.length}개 이미지)`);
        } else {
          log(`  ⚠️  저장 완료 (이미지 없음)`);
        }

        // 체크포인트 저장 (10개마다)
        if (processCount % 10 === 0) {
          saveCheckpoint(processedIdx);
        }

      } catch (error) {
        failCount++;
        log(`  ❌ 실패: ${error.message}`);
        processedIdx.add(postInfo.idx);
      }

      await sleep(getRandomDelay());
    }

    // 5. 최종 저장 및 정리
    log(`\n${'='.repeat(80)}`);
    log('📊 최종 통계');
    log(`${'='.repeat(80)}`);
    log(`✅ 성공 (이미지 있음): ${successCount}개`);
    log(`⚠️  사진 없음: ${allPostLinks.length - successCount - skipCount - failCount}개`);
    log(`⏭️  이미 수집: ${skipCount}개`);
    log(`❌ 실패: ${failCount}개`);
    log(`📁 총 저장: ${scrapedIds.size}개\n`);

    // 최종 파일 저장
    saveIds(scrapedIds);

    const finalListings = loadExistingListings();
    await saveListingsCSV(finalListings);

    log(`📁 저장 위치:`);
    log(`   - JSON: ${CONFIG.listingsFile}`);
    log(`   - CSV: ${CONFIG.csvFile}`);
    log(`   - 로그: success.log, failed.log, skipped.log`);

    if (finalListings.length > 0) {
      const withImages = finalListings.filter(l => l.images && l.images.length > 0).length;
      log(`\n✅ 최종: ${finalListings.length}개 매물 중 ${withImages}개 이미지 포함`);
    }

  } catch (error) {
    log(`\n❌ 스크래퍼 오류: ${error.message}`);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
    saveCheckpoint(processedIdx);
  }
}

// ============================================================================
// CLI
// ============================================================================

const args = process.argv.slice(2);
const adapterArg = args.find(a => a.startsWith('--adapter='))?.split('=')[1] || 'pcbangkingdom';
const testArg = args.find(a => a.startsWith('--test='))?.split('=')[1] || (args.includes('--test') ? '5' : null);
const updateArg = args.includes('--update');

// pagesArg 파싱 (--pages=1-8 또는 --pages 1-8)
let pagesArg = args.find(a => a.startsWith('--pages='))?.split('=')[1];
if (!pagesArg && args.includes('--pages')) {
  const pageIdx = args.indexOf('--pages');
  pagesArg = args[pageIdx + 1];
}

// regionArg 파싱 (--region=서울 또는 --region 서울)
let regionArg = args.find(a => a.startsWith('--region='))?.split('=')[1];
if (!regionArg && args.includes('--region')) {
  const regionIdx = args.indexOf('--region');
  regionArg = args[regionIdx + 1];
}

// startPage 또는 startUrl 중 하나 읽기
let startPageArg = args.find(a => a.startsWith('--start-page='))?.split('=')[1];
const startUrlArg = args.find(a => a.startsWith('--start-url='))?.split('=')[1];

// --start-url이 있으면 URL에서 pageNum 추출
if (startUrlArg) {
  const extractedPageNum = extractPageNumberFromUrl(startUrlArg);
  if (extractedPageNum) {
    startPageArg = extractedPageNum.toString();
    console.log(`✅ URL에서 추출: 페이지 ${extractedPageNum}`);
  } else {
    console.log(`❌ URL에서 페이지 번호를 추출할 수 없습니다: ${startUrlArg}`);
    process.exit(1);
  }
}

if (args.includes('--list-adapters')) {
  console.log('\n📍 Available Adapters:\n');
  listAdapters().forEach(a => {
    console.log(`  • ${a.name}: ${a.displayName}`);
  });
  console.log('');
  process.exit(0);
}

// Parse pages argument (format: "1-8" or "1")
let maxPages = null;
let startPage = startPageArg ? parseInt(startPageArg) : null;
if (pagesArg) {
  if (pagesArg.includes('-')) {
    const [start, end] = pagesArg.split('-').map(p => parseInt(p.trim()));
    startPage = start;
    maxPages = end - start + 1;
  } else {
    maxPages = parseInt(pagesArg);
  }
}

const options = {
  testLimit: testArg ? parseInt(testArg) : null,
  update: updateArg,
  maxPages: maxPages,
  startPage: startPage,
  region: regionArg || null
};

runScraperWithAdapter(adapterArg, options).catch(error => {
  console.error('Fatal:', error.message);
  process.exit(1);
});
