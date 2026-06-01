#!/usr/bin/env node

const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { REGIONS, getRegionByName, getListPageUrl } = require('./region-config');

// CLI 옵션 파싱
const args = process.argv.slice(2);
let targetRegion = null;
let allRegions = false;
let limit = null;
let newOnly = false;

for (const arg of args) {
  if (arg.startsWith('--region=')) {
    targetRegion = arg.split('=')[1];
  } else if (arg === '--all-regions') {
    allRegions = true;
  } else if (arg.startsWith('--limit=')) {
    limit = parseInt(arg.split('=')[1]) || null;
  } else if (arg === '--new-only') {
    newOnly = true;
  }
}

// 환경변수 로드
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// 인증 정보
const authPath = path.join(process.cwd(), 'auth_state.json');
if (!fs.existsSync(authPath)) {
  console.error('\n❌ auth_state.json을 찾을 수 없습니다');
  console.error('먼저 다음을 실행하세요: node scripts/capture-auth.js\n');
  process.exit(1);
}

const storageState = JSON.parse(fs.readFileSync(authPath, 'utf-8'));

// 이미지 URL 추적 (중복 감지용)
const imageUrlStats = {};

// ===== 신규글 감지 함수들 =====

const crawlerStateFile = path.join(process.cwd(), 'scripts', 'crawler-state.json');

function loadCrawlerState() {
  try {
    if (fs.existsSync(crawlerStateFile)) {
      return JSON.parse(fs.readFileSync(crawlerStateFile, 'utf-8'));
    }
  } catch (e) {
    console.error('❌ crawler-state.json 로드 실패:', e.message);
  }
  return {};
}

function saveCrawlerState(state) {
  try {
    fs.writeFileSync(crawlerStateFile, JSON.stringify(state, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('❌ crawler-state.json 저장 실패:', e.message);
    return false;
  }
}

async function getRegionLatestIdx(regionName) {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('idx, title')
      .eq('region', regionName)
      .eq('status', 'active')
      .order('idx', { ascending: false })
      .limit(1);

    if (error) {
      console.error(`❌ ${regionName} 최신 idx 조회 실패:`, error.message);
      return null;
    }

    if (data && data.length > 0) {
      return {
        idx: parseInt(data[0].idx),
        title: data[0].title
      };
    }
  } catch (e) {
    console.error(`❌ ${regionName} 조회 중 오류:`, e.message);
  }
  return null;
}

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, { timeout: 5000 }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function extractDetailContent(page) {
  return await page.evaluate(() => {
    let fullText = '';
    let images = [];
    let mainImage = null;
    let source = 'none';

    // 본문 추출 (board_txt_area.fr-view 우선)
    const boardTxtArea = document.querySelector('.board_txt_area.fr-view');
    if (boardTxtArea) {
      fullText = boardTxtArea.innerText || '';
      source = 'board_txt_area';

      // 본문 내부 이미지만 추출
      const imgElements = Array.from(boardTxtArea.querySelectorAll('img.fr-dii._img_light_gallery'));
      if (imgElements.length > 0) {
        images = imgElements
          .map(img => {
            const src = img.src || img.getAttribute('data-src');
            return src;
          })
          .filter(src => src && src.includes('cdn.imweb.me/upload/'))
          .filter((src, idx, arr) => arr.indexOf(src) === idx);

        // ✅ 본문 내부 첫 번째 이미지를 대표 이미지로 선택
        if (images.length > 0) {
          mainImage = images[0];
        }
      }
    }

    // 폴백: 본문이 없으면 전체 페이지 이미지 검사
    if (images.length === 0) {
      const fallbackImgs = Array.from(document.querySelectorAll('img.fr-dii._img_light_gallery'));
      images = fallbackImgs
        .map(img => img.src || img.getAttribute('data-src'))
        .filter(src => src && src.includes('cdn.imweb.me/upload/'))
        .filter((src, idx, arr) => arr.indexOf(src) === idx);
      if (images.length > 0) {
        source = 'page_images';
        mainImage = images[0];  // ✅ fallback 이미지도 첫 번째를 대표로 선택
      }
    }

    return { fullText, images, source, mainImage };
  });
}

function cleanTitle(title) {
  if (!title) return '';

  // 1. 공백 정규화 (연속 공백을 한 개로)
  let cleaned = title.replace(/\s+/g, ' ').trim();

  // 2. "공지" 제거 (앞에 붙어있으면 제거)
  cleaned = cleaned.replace(/^공지\s*/, '');

  return cleaned;
}

function isValidTitle(title) {
  if (!title || title.length === 0) return false;

  const cleaned = cleanTitle(title);
  if (cleaned.length === 0) return false;

  // 정보성 광고 패턴 감지 (공지/배너 등)
  const adPatterns = [
    /^1\.\s*매물업종/,          // 본문 형식 (1. 매물업종부터 시작)
    /^2\.\s*매물위치/,          // 본문 형식
    /^3\.\s*실평수/,            // 본문 형식
    /^골든벨/,                   // 특정 광고
    /먹튀|scam/i,               // 사기 경고
  ];

  for (const pattern of adPatterns) {
    if (pattern.test(cleaned)) {
      return false;
    }
  }

  return cleaned.length > 2;  // 최소 3자 이상
}

function parsePrice(priceStr) {
  if (!priceStr) return null;
  const numMatch = priceStr.trim().match(/(\d+)/);
  return numMatch ? parseInt(numMatch[1]) : null;
}

function parseMonthlyRent(text) {
  const match = text.match(/7\.\s*월세\s*[:：]\s*([^\n]+)/);
  if (match) {
    return parsePrice(match[1]);
  }
  return null;
}

function parseDeposit(text) {
  // 보증금: 형식 찾기
  const match = text.match(/보증금\s*[:：]\s*([^\n]+)/);
  if (match) {
    return parsePrice(match[1]);
  }
  return null;
}

function parsePremiumPrice(text) {
  // 권리금: 형식 찾기
  const match = text.match(/권리금\s*[:：]\s*([^\n]+)/);
  if (match) {
    return parsePrice(match[1]);
  }
  return null;
}

async function uploadImages(images, listingIdx) {
  const uploadedUrls = [];

  for (let i = 0; i < images.length; i++) {
    try {
      const imageUrl = images[i];
      const buffer = await downloadImage(imageUrl);

      const ext = imageUrl.split('.').pop() || 'jpg';
      const fileName = `${listingIdx}/${i + 1}.${ext}`;
      const filePath = `${listingIdx}/${i + 1}.${ext}`;  // ✅ listings/ 경로 제거

      const { error } = await supabase.storage.from('listings').upload(filePath, buffer, { upsert: true });

      if (error) {
        console.log(`        ⚠️  이미지 업로드 실패: ${error.message}`);
        continue;
      }

      // ✅ 전체 URL 구성 (getPublicUrl 결과 사용)
      const { data } = supabase.storage.from('listings').getPublicUrl(filePath);
      uploadedUrls.push(data.publicUrl);

      // 이미지 URL 통계 추적
      imageUrlStats[imageUrl] = (imageUrlStats[imageUrl] || 0) + 1;
    } catch (e) {
      console.log(`        ⚠️  이미지 처리 실패: ${e.message}`);
    }
  }

  return uploadedUrls;
}

async function saveListing(listingData) {
  const { idx, title, description, region, imageUrls, monthlyRent, deposit, premiumPrice, sourceUrl, createdAt } = listingData;

  const price = monthlyRent || 0;

  // Upsert 전 기존 매물 조회 (created_at 보존용)
  const { data: existingListings } = await supabase
    .from('listings')
    .select('id, created_at')
    .eq('idx', idx);

  const existingListing = existingListings && existingListings.length > 0 ? existingListings[0] : null;
  let listingId;
  let isNew = false;

  // 기본 record (created_at 제외)
  const baseRecord = {
    idx,
    title,
    description,
    region,
    price_type: 'lease',
    price,
    monthly_rent: monthlyRent,
    deposit,
    premium_price: premiumPrice,
    status: 'active',
    thumbnail_url: imageUrls.length > 0 ? imageUrls[0] : null,
    main_image_url: imageUrls.length > 0 ? imageUrls[0] : null,
    view_count: 0,
  };

  if (existingListing) {
    // ✅ Update 시: created_at도 함께 업데이트 (크롤링 순서 재정렬)
    const updateRecord = {
      ...baseRecord,
      created_at: createdAt || new Date().toISOString(),
    };
    const { error } = await supabase
      .from('listings')
      .update(updateRecord)
      .eq('idx', idx);

    if (error) {
      throw new Error(`업데이트 실패: ${error.message}`);
    }
    listingId = existingListing.id;
  } else {
    // ✅ Insert 시: created_at 포함 (크롤링 순서 기반 타임스탬프)
    const insertRecord = {
      ...baseRecord,
      created_at: createdAt || new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('listings')
      .insert([insertRecord])
      .select('id')
      .single();

    if (error) {
      throw new Error(`삽입 실패: ${error.message}`);
    }
    listingId = data.id;
    isNew = true;
  }

  // listing_images 저장
  if (imageUrls.length > 0) {
    await supabase
      .from('listing_images')
      .delete()
      .eq('listing_id', listingId);

    const imagesToInsert = imageUrls.map((url, idx) => ({
      listing_id: listingId,
      url,
      order_num: idx,
      is_primary: idx === 0,
    }));

    await supabase
      .from('listing_images')
      .insert(imagesToInsert);
  }

  return { listingId, isNew };
}

async function crawlRegionNewOnly(region, browser) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🌍 지역: ${region.name} (신규글만 수집)`);
  console.log(`${'='.repeat(70)}\n`);

  // DB에서 현재 지역의 최신 idx 조회
  const latestDbItem = await getRegionLatestIdx(region.name);

  if (latestDbItem) {
    console.log(`📍 현재 DB 최신: idx=${latestDbItem.idx}, title="${latestDbItem.title}"\n`);
  } else {
    console.log(`📍 DB에 저장된 매물 없음 (처음 크롤링)\n`);
  }

  let crawnedCount = 0;
  let skippedCount = 0;
  const lastIdxSeen = new Set();
  let breakPageLoop = false;

  // 크롤링 시작 시간 (신규 매물의 created_at 기준)
  const crawlStartTime = new Date();

  const context = await browser.newContext({ storageState });
  const page = await context.newPage();

  try {
    // ✅ 정순 페이지 순회 (1 → lastPage) - 1페이지부터 최신 항목 찾기
    for (let pageNum = 1; pageNum <= region.lastPage; pageNum++) {
      if (breakPageLoop) break;  // 기존 idx 발견 시 페이지 루프 종료

      console.log(`📄 ${region.name} - ${pageNum}/${region.lastPage} 페이지`);

      const listUrl = getListPageUrl(region, pageNum);
      await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1000);

      // 게시글 개수만 파악 (제목은 상세페이지에서 읽음)
      const postCount = await page.locator('li.tit a.title_link').count();
      const postList = [];

      for (let i = 0; i < postCount; i++) {
        postList.push({ idx: i });
      }

      if (postList.length === 0) {
        console.log('  ⚠️  게시글 없음\n');
        continue;
      }

      console.log(`  ✅ ${postList.length}개 게시글 발견\n`);

      // ✅ 순서 유지 - 원본 사이트와 동일
      for (let pageIndex = 0; pageIndex < postList.length; pageIndex++) {
        const post = postList[pageIndex];

        // limit 체크
        if (limit && crawnedCount >= limit) {
          console.log(`\n⏹️  limit 도달: ${limit}개\n`);
          breakPageLoop = true;
          break;
        }

        console.log(`    [${pageIndex + 1}/${postList.length}]`);

        try {
          // 정확히 nth(pageIndex)로 클릭
          const titleLinks = await page.locator('li.tit a.title_link');
          const linkCount = await titleLinks.count();

          if (pageIndex >= linkCount) {
            console.log(`      ⏭️  스킵: 링크 인덱스 범위 초과`);
            skippedCount++;
            continue;
          }

          // 클릭 후 페이지 로드 대기
          const titleLink = titleLinks.nth(pageIndex);
          await Promise.all([
            page.waitForNavigation({ timeout: 10000, waitUntil: 'domcontentloaded' }).catch(() => {}),
            titleLink.click(),
          ]);
          await page.waitForTimeout(1500);

          // idx 추출: HTML에서 JSON 형식으로 저장된 idx
          const listingIdx = await page.evaluate(() => {
            const html = document.body.innerHTML;
            const match = html.match(/"idx"\s*:\s*"?(\d+)"?/);
            return match ? match[1] : null;
          });

          if (!listingIdx) {
            console.log(`      ❌ idx 추출 실패 (URL: ${detailUrl})`);
            skippedCount++;
            await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
            continue;
          }

          // ✅ 신규글 감지: 이미 DB에 있는 idx를 발견했으면 이전 크롤링까지 완료된 것
          if (latestDbItem && parseInt(listingIdx) <= latestDbItem.idx) {
            console.log(`      ⏹️  기존 항목 발견: idx=${listingIdx} <= DB최신=${latestDbItem.idx}`);
            console.log(`      → 페이지 루프 종료 (이전 크롤링 범위 도달)\n`);
            breakPageLoop = true;
            break;
          }

          // 중복 idx 감지
          if (lastIdxSeen.has(listingIdx)) {
            console.log(`      ❌ 경고: 같은 idx 반복 (${listingIdx}) - 클릭 오류 가능`);
            skippedCount++;
            await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
            continue;
          }
          lastIdxSeen.add(listingIdx);

          // 상세 페이지에서 제목 추출 (.title 또는 h1)
          const titleFromDetail = await page.evaluate(() => {
            // 1. .title 요소 찾기
            let titleEl = document.querySelector('.title');
            if (titleEl) return titleEl.textContent?.trim();

            // 2. h1 태그 찾기
            titleEl = document.querySelector('h1');
            if (titleEl) return titleEl.textContent?.trim();

            return null;
          });

          // 제목 검증
          if (!titleFromDetail || !isValidTitle(titleFromDetail)) {
            console.log(`      ⏭️  스킵: 제목이 유효하지 않음`);
            console.log(`           "${titleFromDetail?.substring(0, 60) || 'null'}"`);
            skippedCount++;
            await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
            continue;
          }

          const titleFromList = cleanTitle(titleFromDetail);
          console.log(`           제목: ${titleFromList}`);

          // 상세 정보 추출
          const detailContent = await extractDetailContent(page);

          // 이미지 검증
          if (detailContent.images.length === 0) {
            console.log(`      ⏭️  스킵: 이미지 없음`);
            skippedCount++;
            await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
            continue;
          }

          // 본문 검증
          if (detailContent.fullText.length < 100) {
            console.log(`      ⏭️  스킵: 본문 부족 (${detailContent.fullText.length}자)`);
            skippedCount++;
            await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
            continue;
          }

          // 가격 정보 추출
          const monthlyRent = parseMonthlyRent(detailContent.fullText);
          const deposit = parseDeposit(detailContent.fullText);
          const premiumPrice = parsePremiumPrice(detailContent.fullText);

          // 이미지 업로드
          console.log(`      📤 이미지 업로드 중 (${detailContent.images.length}개)...`);
          const uploadedUrls = await uploadImages(detailContent.images, listingIdx);

          if (uploadedUrls.length === 0) {
            console.log(`      ⏭️  스킵: 이미지 업로드 실패`);
            skippedCount++;
            await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
            continue;
          }

          // ✅ 저장 전 상세 로그
          const mainImageUrl = uploadedUrls[0] || null;
          console.log(`      📋 저장 데이터:`);
          console.log(`         title: ${titleFromList}`);
          console.log(`         idx: ${listingIdx}`);
          console.log(`         source_url: ${detailUrl.substring(0, 80)}...`);
          console.log(`         main_image: ${mainImageUrl ? mainImageUrl.substring(mainImageUrl.lastIndexOf('/') - 10) : 'null'}`);
          console.log(`         images: ${uploadedUrls.length}개`);

          // ✅ 크롤링 순서대로 created_at 할당
          const createdAtTime = new Date(crawlStartTime.getTime() - (crawnedCount * 1000));

          // DB 저장
          const { listingId, isNew } = await saveListing({
            idx: listingIdx,
            title: titleFromList,
            description: detailContent.fullText,
            region: region.name,
            imageUrls: uploadedUrls,
            monthlyRent,
            deposit,
            premiumPrice,
            sourceUrl: detailUrl,
            createdAt: createdAtTime.toISOString(),
          });

          console.log(`      ✅ ${isNew ? '신규' : '업데이트'} 저장됨 (이미지 ${uploadedUrls.length}개, 월세 ${monthlyRent || '미정'}만원${deposit ? `, 보증금 ${deposit}` : ''}${premiumPrice ? `, 권리금 ${premiumPrice}` : ''})`);
          crawnedCount++;

        } catch (e) {
          console.log(`      ❌ 오류: ${e.message}`);
          skippedCount++;
        }

        // 목록으로 돌아가기
        await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(1000);
      }
    }

    // ✅ 신규글 크롤링 완료 후 crawler-state.json 업데이트
    if (crawnedCount > 0) {
      const crawlerState = loadCrawlerState();
      const firstNewIdx = crawnedCount > 0 ? lastIdxSeen.values().next().value : null;  // 첫 번째 크롤된 idx (가장 최신)

      if (firstNewIdx && crawlerState[region.name]) {
        // 가장 최신 idx를 업데이트 (실제로는 배열의 첫 번째 - 가장 새로운 것)
        const maxNewIdx = Math.max(...Array.from(lastIdxSeen).map(x => parseInt(x)));
        crawlerState[region.name].latestIdx = maxNewIdx;
        crawlerState[region.name].lastCrawledAt = new Date().toISOString();
        crawlerState[region.name].totalCount = (crawlerState[region.name].totalCount || 0) + crawnedCount;

        saveCrawlerState(crawlerState);
        console.log(`\n✅ ${region.name} 크롤러 상태 업데이트: latestIdx=${maxNewIdx}, totalCount=${crawlerState[region.name].totalCount}`);
      }
    }

    await context.close();

    // ✅ 이미지 중복 경고 (같은 main_image_url이 반복되는 경우)
    const duplicateImages = Object.entries(imageUrlStats).filter(([url, count]) => count > 1);
    if (duplicateImages.length > 0) {
      console.log(`\n⚠️  ${region.name} - 이미지 중복 감지:`);
      duplicateImages.slice(0, 10).forEach(([url, count]) => {
        console.log(`   URL: ...${url.substring(Math.max(0, url.length - 50))} | 사용 ${count}회`);
      });
      if (duplicateImages.length > 10) {
        console.log(`   ... 외 ${duplicateImages.length - 10}개 중복`);
      }
    }

    return { crawnedCount, skippedCount };

  } catch (error) {
    console.error(`\n❌ 오류 (${region.name}):`, error.message);
    await context.close();
    return { crawnedCount, skippedCount };
  }
}

async function crawlRegion(region, browser) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🌍 지역: ${region.name}`);
  console.log(`${'='.repeat(70)}\n`);

  let crawnedCount = 0;
  let skippedCount = 0;
  const lastIdxSeen = new Set();

  // 크롤링 시작 시간 (신규 매물의 created_at 기준)
  const crawlStartTime = new Date();
  let newListingIndex = 0;

  const context = await browser.newContext({ storageState });
  const page = await context.newPage();

  try {
    // ✅ 정순 페이지 순회 (1 → lastPage) - 원본 사이트 순서대로
    for (let pageNum = 1; pageNum <= region.lastPage; pageNum++) {
      console.log(`📄 ${region.name} - ${pageNum}/${region.lastPage} 페이지`);

      const listUrl = getListPageUrl(region, pageNum);
      await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1000);

      // 게시글 개수만 파악 (제목은 상세페이지에서 읽음)
      const postCount = await page.locator('li.tit a.title_link').count();
      const postList = [];

      for (let i = 0; i < postCount; i++) {
        postList.push({ idx: i });
      }

      if (postList.length === 0) {
        console.log('  ⚠️  게시글 없음\n');
        continue;
      }

      console.log(`  ✅ ${postList.length}개 게시글 발견\n`);

      // ✅ 순서 유지 - 원본 사이트와 동일 (postList.reverse() 제거)

      // 각 게시글 크롤링 (역순)
      for (let pageIndex = 0; pageIndex < postList.length; pageIndex++) {
        const post = postList[pageIndex];

        // limit 체크
        if (limit && crawnedCount >= limit) {
          console.log(`\n⏹️  limit 도달: ${limit}개\n`);
          await context.close();
          return { crawnedCount, skippedCount };
        }

        console.log(`    [${pageIndex + 1}/${postList.length}]`);

        try {
          // 정확히 nth(pageIndex)로 클릭
          const titleLinks = await page.locator('li.tit a.title_link');
          const linkCount = await titleLinks.count();

          if (pageIndex >= linkCount) {
            console.log(`      ⏭️  스킵: 링크 인덱스 범위 초과`);
            skippedCount++;
            continue;
          }

          // 클릭 후 페이지 로드 대기
          const titleLink = titleLinks.nth(pageIndex);
          await Promise.all([
            page.waitForNavigation({ timeout: 10000, waitUntil: 'domcontentloaded' }).catch(() => {}),
            titleLink.click(),
          ]);
          await page.waitForTimeout(1500);

          // idx 추출: HTML에서 JSON 형식으로 저장된 idx
          const listingIdx = await page.evaluate(() => {
            const html = document.body.innerHTML;
            const match = html.match(/"idx"\s*:\s*"?(\d+)"?/);
            return match ? match[1] : null;
          });

          if (!listingIdx) {
            console.log(`      ❌ idx 추출 실패 (URL: ${detailUrl})`);
            skippedCount++;
            await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
            continue;
          }

          // 중복 idx 감지
          if (lastIdxSeen.has(listingIdx)) {
            console.log(`      ❌ 경고: 같은 idx 반복 (${listingIdx}) - 클릭 오류 가능`);
            skippedCount++;
            await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
            continue;
          }
          lastIdxSeen.add(listingIdx);

          // 상세 페이지에서 제목 추출 (.title 또는 h1)
          const titleFromDetail = await page.evaluate(() => {
            // 1. .title 요소 찾기
            let titleEl = document.querySelector('.title');
            if (titleEl) return titleEl.textContent?.trim();

            // 2. h1 태그 찾기
            titleEl = document.querySelector('h1');
            if (titleEl) return titleEl.textContent?.trim();

            return null;
          });

          // 제목 검증
          if (!titleFromDetail || !isValidTitle(titleFromDetail)) {
            console.log(`      ⏭️  스킵: 제목이 유효하지 않음`);
            console.log(`           "${titleFromDetail?.substring(0, 60) || 'null'}"`);
            skippedCount++;
            await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
            continue;
          }

          const titleFromList = cleanTitle(titleFromDetail);
          console.log(`           제목: ${titleFromList}`);

          // 상세 정보 추출
          const detailContent = await extractDetailContent(page);

          // 이미지 검증
          if (detailContent.images.length === 0) {
            console.log(`      ⏭️  스킵: 이미지 없음`);
            skippedCount++;
            await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
            continue;
          }

          // 본문 검증
          if (detailContent.fullText.length < 100) {
            console.log(`      ⏭️  스킵: 본문 부족 (${detailContent.fullText.length}자)`);
            skippedCount++;
            await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
            continue;
          }

          // 가격 정보 추출
          const monthlyRent = parseMonthlyRent(detailContent.fullText);
          const deposit = parseDeposit(detailContent.fullText);
          const premiumPrice = parsePremiumPrice(detailContent.fullText);

          // 이미지 업로드
          console.log(`      📤 이미지 업로드 중 (${detailContent.images.length}개)...`);
          const uploadedUrls = await uploadImages(detailContent.images, listingIdx);

          if (uploadedUrls.length === 0) {
            console.log(`      ⏭️  스킵: 이미지 업로드 실패`);
            skippedCount++;
            await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
            continue;
          }

          // ✅ 저장 전 상세 로그
          const mainImageUrl = uploadedUrls[0] || null;
          console.log(`      📋 저장 데이터:`);
          console.log(`         title: ${titleFromList}`);
          console.log(`         idx: ${listingIdx}`);
          console.log(`         source_url: ${detailUrl.substring(0, 80)}...`);
          console.log(`         main_image: ${mainImageUrl ? mainImageUrl.substring(mainImageUrl.lastIndexOf('/') - 10) : 'null'}`);
          console.log(`         images: ${uploadedUrls.length}개`);

          // ✅ 크롤링 순서대로 created_at 할당 (모든 매물에 적용)
          // 첫 번째 크롤된 항목이 가장 최신 시간을 받아야 함 (맨 위 표시)
          // update든 insert든 모두 같은 규칙으로 created_at 설정
          const createdAtTime = new Date(crawlStartTime.getTime() - (crawnedCount * 1000));

          // DB 저장
          const { listingId, isNew } = await saveListing({
            idx: listingIdx,
            title: titleFromList,
            description: detailContent.fullText,
            region: region.name,
            imageUrls: uploadedUrls,
            monthlyRent,
            deposit,
            premiumPrice,
            sourceUrl: detailUrl,
            createdAt: createdAtTime.toISOString(),
          });

          console.log(`      ✅ ${isNew ? '신규' : '업데이트'} 저장됨 (이미지 ${uploadedUrls.length}개, 월세 ${monthlyRent || '미정'}만원${deposit ? `, 보증금 ${deposit}` : ''}${premiumPrice ? `, 권리금 ${premiumPrice}` : ''})`);
          crawnedCount++;

        } catch (e) {
          console.log(`      ❌ 오류: ${e.message}`);
          skippedCount++;
        }

        // 목록으로 돌아가기
        await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(1000);
      }
    }

    // ✅ 일반 크롤링 완료 후 crawler-state.json 업데이트 (기준선 설정용)
    if (crawnedCount > 0 && lastIdxSeen.size > 0) {
      const crawlerState = loadCrawlerState();

      if (crawlerState[region.name]) {
        // 크롤링된 모든 idx 중 최고값을 저장
        const maxNewIdx = Math.max(...Array.from(lastIdxSeen).map(x => parseInt(x)));
        crawlerState[region.name].latestIdx = maxNewIdx;
        crawlerState[region.name].lastCrawledAt = new Date().toISOString();
        crawlerState[region.name].totalCount = crawnedCount;

        saveCrawlerState(crawlerState);
        console.log(`\n✅ ${region.name} 크롤러 상태 업데이트: latestIdx=${maxNewIdx}, totalCount=${crawnedCount}`);
      }
    }

    await context.close();

    // ✅ 이미지 중복 경고 (같은 main_image_url이 반복되는 경우)
    const duplicateImages = Object.entries(imageUrlStats).filter(([url, count]) => count > 1);
    if (duplicateImages.length > 0) {
      console.log(`\n⚠️  ${region.name} - 이미지 중복 감지:`);
      duplicateImages.slice(0, 10).forEach(([url, count]) => {
        console.log(`   URL: ...${url.substring(Math.max(0, url.length - 50))} | 사용 ${count}회`);
      });
      if (duplicateImages.length > 10) {
        console.log(`   ... 외 ${duplicateImages.length - 10}개 중복`);
      }
    }

    return { crawnedCount, skippedCount };

  } catch (error) {
    console.error(`\n❌ 오류 (${region.name}):`, error.message);
    await context.close();
    return { crawnedCount, skippedCount };
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    console.log('\n🚀 지역별 크롤링 시작\n');
    console.log('📍 설정:');

    // 크롤링할 지역 결정
    let regions = [];
    if (allRegions) {
      regions = REGIONS;
      console.log(`   범위: 전체 지역 (${REGIONS.length}개)`);
    } else if (targetRegion) {
      const region = getRegionByName(targetRegion);
      if (!region) {
        console.error(`\n❌ 지역을 찾을 수 없습니다: ${targetRegion}\n`);
        console.error('사용 가능한 지역:');
        REGIONS.forEach(r => console.error(`  - ${r.name}`));
        console.error('');
        process.exit(1);
      }
      regions = [region];
      console.log(`   범위: ${targetRegion}`);
    } else {
      console.error('\n❌ 지역을 지정해야 합니다\n');
      console.error('사용법:');
      console.error('  node scripts/crawl-regions.js --region=서울');
      console.error('  node scripts/crawl-regions.js --region=경기도');
      console.error('  node scripts/crawl-regions.js --region=강원도');
      console.error('  node scripts/crawl-regions.js --region=서울 --limit=10\n');
      process.exit(1);
    }

    if (limit) {
      console.log(`   한계: ${limit}개 매물`);
    }
    if (newOnly) {
      console.log(`   모드: 신규글만 수집 (--new-only)`);
    }
    console.log();

    // 지역별 크롤링
    let totalCrawled = 0;
    let totalSkipped = 0;

    for (const region of regions) {
      let result;
      if (newOnly) {
        result = await crawlRegionNewOnly(region, browser);
      } else {
        result = await crawlRegion(region, browser);
      }
      totalCrawled += result.crawnedCount;
      totalSkipped += result.skippedCount;
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log('📊 최종 결과:');
    console.log(`   - 크롤링됨: ${totalCrawled}개`);
    console.log(`   - 스킵됨: ${totalSkipped}개`);
    console.log(`${'='.repeat(70)}\n`);

  } catch (error) {
    console.error('\n❌ 오류:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
