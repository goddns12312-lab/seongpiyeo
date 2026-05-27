#!/usr/bin/env node

const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { REGIONS, getListPageUrl } = require('./region-config');

// 환경변수 로드
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
});

// 인자 파싱
const args = process.argv.slice(2);
const targetRegion = args.find(a => a.startsWith('--region='))?.split('=')[1];
const isDetailed = args.includes('--detailed');
const skipCrawl = args.includes('--skip-crawl');

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function countListingsOnSite(region, browser, context) {
  const results = [];
  let totalCount = 0;
  let consecutiveEmptyPages = 0;

  for (let pageNum = region.lastPage; pageNum >= 1; pageNum--) {
    const url = getListPageUrl(region, pageNum);
    const page = context ? await context.newPage() : await browser.newPage();

    try {
      // 개선: waitUntil을 'load'로 변경, 타임아웃 30초로 증가
      await page.goto(url, { waitUntil: 'load', timeout: 30000 });

      // 추가 대기: 동적 콘텐츠 로드 완료 확인
      await page.waitForSelector('li.tit a.title_link', { timeout: 5000 }).catch(() => null);

      const titleLinks = await page.locator('li.tit a.title_link').all();
      const pageCount = titleLinks.length;

      results.push({ page: pageNum, count: pageCount });
      totalCount += pageCount;

      console.log(`  ${region.name} - ${pageNum}/${region.lastPage} 페이지: ${pageCount}개`);

      // 연속 0개 페이지 추적 (페이지네이션 끝 감지)
      if (pageCount === 0) {
        consecutiveEmptyPages++;
        // 3페이지 연속 0개면 끝으로 판단
        if (consecutiveEmptyPages >= 3) {
          console.log(`  ${region.name} - 3페이지 연속 0개 감지, 순회 종료`);
          break;
        }
      } else {
        consecutiveEmptyPages = 0;
      }

      // 서버 보호: 딜레이 증가 (1~2초)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    } catch (err) {
      console.error(`  ⚠️  ${region.name} - ${pageNum}/${region.lastPage} 페이지 오류: ${err.message}`);
      consecutiveEmptyPages++;
    } finally {
      await page.close();
    }
  }

  return { pageResults: results, totalCount };
}

async function collectDetailedInfo(region, browser, context) {
  const listings = [];
  let consecutiveEmptyPages = 0;

  for (let pageNum = region.lastPage; pageNum >= 1; pageNum--) {
    const url = getListPageUrl(region, pageNum);
    const page = context ? await context.newPage() : await browser.newPage();

    try {
      // 개선: waitUntil을 'load'로 변경, 타임아웃 30초로 증가
      await page.goto(url, { waitUntil: 'load', timeout: 30000 });

      // 추가 대기: 동적 콘텐츠 로드 완료 확인
      await page.waitForSelector('li.tit a.title_link', { timeout: 5000 }).catch(() => null);

      const titleCount = await page.locator('li.tit a.title_link').count();

      // 0개 페이지 추적
      if (titleCount === 0) {
        consecutiveEmptyPages++;
        if (consecutiveEmptyPages >= 3) {
          console.log(`  ${region.name} - 3페이지 연속 0개 감지, 순회 종료`);
          break;
        }
      } else {
        consecutiveEmptyPages = 0;
      }

      for (let i = 0; i < titleCount; i++) {
        try {
          // 매번 새로 로드 (stale element 방지)
          const titleEl = page.locator('li.tit a.title_link').nth(i);
          const title = await titleEl.innerText();

          // 상세페이지 접근
          await titleEl.click();
          await page.waitForTimeout(2000);

          const detailUrl = page.url();
          const idxMatch = detailUrl.match(/idx=(\d+)/);
          const idx = idxMatch ? idxMatch[1] : null;

          if (!idx) {
            listings.push({
              pageNum,
              index: i,
              title: title.trim(),
              idx: null,
              imageCount: 0,
              sourceUrl: detailUrl,
              skipReason: 'idx 추출 실패'
            });
          } else {
            // 이미지 확인
            const imageData = await page.evaluate(() => {
              const boardTxtArea = document.querySelector('.board_txt_area.fr-view');
              if (!boardTxtArea) return { imageCount: 0, source: 'none' };

              const images = Array.from(boardTxtArea.querySelectorAll('img.fr-dii._img_light_gallery'))
                .map(img => img.src || img.getAttribute('data-src'))
                .filter(src => src && src.includes('cdn.imweb.me/upload/'))
                .filter((src, idx, arr) => arr.indexOf(src) === idx);

              return { imageCount: images.length, source: images.length > 0 ? 'board_txt_area' : 'none' };
            });

            listings.push({
              pageNum,
              index: i,
              title: title.trim(),
              idx,
              imageCount: imageData.imageCount,
              sourceUrl: detailUrl,
              skipReason: imageData.imageCount === 0 ? '이미지 없음' : null
            });
          }

          // 목록으로 돌아가기
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        } catch (err) {
          console.error(`    오류 (${region.name} p${pageNum} #${i}): ${err.message}`);
        }
      }
    } catch (err) {
      console.error(`  ⚠️  ${region.name} - ${pageNum}/${region.lastPage} 페이지 로드 오류: ${err.message}`);
    } finally {
      await page.close();
    }
  }

  return listings;
}

async function getDBStats(regionName) {
  try {
    const { data: allListings, count } = await supabase
      .from('listings')
      .select('id, idx, region, main_image_url, status, created_at', { count: 'exact' })
      .eq('region', regionName);

    const { data: imagesCount } = await supabase
      .from('listing_images')
      .select('listing_id')
      .in('listing_id', allListings?.map(l => l.id) || []);

    const listingsWithImages = new Set(imagesCount?.map(img => img.listing_id) || []);

    return {
      count: count || 0,
      listings: allListings || [],
      idxSet: new Set(allListings?.filter(l => l.idx).map(l => l.idx) || []),
      listingsWithImages,
      allListings
    };
  } catch (err) {
    console.error(`DB 조회 오류 (${regionName}): ${err.message}`);
    return { count: 0, listings: [], idxSet: new Set(), listingsWithImages: new Set(), allListings: [] };
  }
}

async function analyzeDB() {
  console.log('\n📊 DB 오류 분석\n');

  try {
    const { data: allListings } = await supabase.from('listings').select('id, idx, region, status');
    const validRegions = REGIONS.map(r => r.name);

    const mappingErrors = allListings.filter(l => !validRegions.includes(l.region));
    const duplicateIdxGroups = {};
    allListings.forEach(l => {
      if (l.idx) {
        if (!duplicateIdxGroups[l.idx]) duplicateIdxGroups[l.idx] = [];
        duplicateIdxGroups[l.idx].push(l.id);
      }
    });
    const duplicates = Object.entries(duplicateIdxGroups).filter(([_, ids]) => ids.length > 1);

    // 이미지 없는 매물
    const { data: listingsWithoutImages } = await supabase
      .from('listings')
      .select('id')
      .eq('status', 'active');

    const { data: allImages } = await supabase.from('listing_images').select('listing_id');
    const listingsWithImageSet = new Set(allImages?.map(img => img.listing_id) || []);
    const noImageCount = listingsWithoutImages?.filter(l => !listingsWithImageSet.has(l.id)).length || 0;

    // Status 분포
    const statusCounts = {};
    allListings.forEach(l => {
      statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    });

    console.log('  region 매핑 오류:', mappingErrors.length, '개');
    if (mappingErrors.length > 0) {
      mappingErrors.slice(0, 5).forEach(l => {
        console.log(`    - region="${l.region}" (idx=${l.idx})`);
      });
      if (mappingErrors.length > 5) console.log(`    ... 외 ${mappingErrors.length - 5}개`);
    }

    console.log('  중복 idx:', duplicates.length, '개');
    if (duplicates.length > 0) {
      duplicates.slice(0, 3).forEach(([idx, ids]) => {
        console.log(`    - idx=${idx}: ${ids.length}개 row`);
      });
      if (duplicates.length > 3) console.log(`    ... 외 ${duplicates.length - 3}개`);
    }

    console.log('  이미지 없는 매물:', noImageCount, '개');
    console.log('  status 분포:');
    Object.entries(statusCounts).forEach(([status, c]) => {
      console.log(`    - ${status}: ${c}개`);
    });
  } catch (err) {
    console.error('DB 오류 분석 실패:', err.message);
  }
}

async function main() {
  console.log('\n📊 전 지역 감사 시작\n');

  let browser = null;
  let context = null;

  if (!skipCrawl) {
    browser = await chromium.launch();

    // 인증 로드 (상세 모드에 필수)
    if (isDetailed) {
      const authPath = path.join(process.cwd(), 'auth_state.json');
      if (!fs.existsSync(authPath)) {
        console.error('❌ 상세 모드에는 auth_state.json이 필요합니다.');
        console.error('   먼저 다음 명령어를 실행하세요: node scripts/capture-auth.js\n');
        await browser.close();
        process.exit(1);
      }
      const authState = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
      context = await browser.newContext({ storageState: authState });
    }
  }

  const regionsToAudit = targetRegion ? REGIONS.filter(r => r.name === targetRegion) : REGIONS;

  const allResults = [];
  let totalSiteCount = 0;
  let totalDBCount = 0;

  for (const region of regionsToAudit) {
    console.log(`📍 ${region.name} (${region.lastPage} page)`);

    let siteStats = { totalCount: 0, pageResults: [] };
    let siteListings = [];

    if (!skipCrawl) {
      siteStats = await countListingsOnSite(region, browser, context);

      if (isDetailed) {
        console.log(`  상세 정보 수집 중...`);
        siteListings = await collectDetailedInfo(region, browser, context);
      }
    }

    const dbStats = await getDBStats(region.name);
    siteStats.totalCount = siteStats.totalCount || 0;

    totalSiteCount += siteStats.totalCount;
    totalDBCount += dbStats.count;

    const diff = siteStats.totalCount - dbStats.count;
    const interpretation = diff > 0
      ? `(이미지 없는 게시글 약 ${diff}개로 추정)`
      : diff < 0
      ? `(분석 필요)`
      : '(일치)';

    console.log(`  사이트 총 게시글:  ${siteStats.totalCount}개`);
    console.log(`  DB 저장 매물:     ${dbStats.count}개`);
    console.log(`  차이:             ${Math.abs(diff)}개 ${interpretation}\n`);

    if (isDetailed && siteListings.length > 0) {
      const listingsWithImages = siteListings.filter(l => l.imageCount > 0);
      const listingsWithoutImages = siteListings.filter(l => l.imageCount === 0);

      console.log(`\n  📊 상세 분석:`);
      console.log(`    사이트 전체 게시글:   ${siteListings.length}개`);
      console.log(`    이미지 있는 게시글:   ${listingsWithImages.length}개`);
      console.log(`    이미지 없는 게시글:   ${listingsWithoutImages.length}개 (저장 제외)`);
      console.log(`    DB 실제 저장:        ${dbStats.count}개\n`);

      // 불일치 분석 (이미지 있는데 DB에 없는 것)
      const notInDb = listingsWithImages
        .filter(l => l.idx && !dbStats.idxSet.has(l.idx))
        .sort((a, b) => parseInt(b.idx) - parseInt(a.idx));

      if (notInDb.length > 0) {
        console.log(`  ⚠️  이미지 있는데 DB에 없는 매물: ${notInDb.length}개 (재크롤 필요 가능)`);
        notInDb.slice(0, 5).forEach(l => {
          console.log(`    - idx=${l.idx} | ${l.title.substring(0, 40)}`);
        });
        if (notInDb.length > 5) {
          console.log(`    ... 외 ${notInDb.length - 5}개`);
        }
        console.log('');
      }

      if (listingsWithoutImages.length > 0) {
        console.log(`  ✅ 이미지 없어 저장 제외 (정상 동작):`);
        listingsWithoutImages.slice(0, 5).forEach(l => {
          console.log(`    - idx=${l.idx} | ${l.title.substring(0, 40)}`);
        });
        if (listingsWithoutImages.length > 5) {
          console.log(`    ... 외 ${listingsWithoutImages.length - 5}개`);
        }
      }
      console.log('');
    }

    allResults.push({
      region: region.name,
      siteCount: siteStats.totalCount,
      dbCount: dbStats.count,
      diff,
      detailed: isDetailed ? siteListings : null
    });
  }

  if (context) await context.close();
  if (browser) await browser.close();

  // 최종 요약
  console.log('\n══════════════════════════════════════════════════════');
  console.log('📊 최종 요약\n');
  console.log(`  사이트 총 게시글:    ${totalSiteCount}개`);
  console.log(`  DB 저장 매물:       ${totalDBCount}개`);
  console.log(`  이미지 없는 추정:    약 ${Math.max(0, totalSiteCount - totalDBCount)}개`);

  if (totalSiteCount > 0) {
    const savedPercent = ((totalDBCount / totalSiteCount) * 100).toFixed(1);
    console.log(`  저장률:             ${savedPercent}% (이미지 있는 것만)`);
    console.log(`\n  해석: 사이트 전체 ${totalSiteCount}개 게시글 중,`);
    console.log(`       약 ${totalDBCount}개는 이미지가 있어 저장됨`);
    console.log(`       약 ${Math.max(0, totalSiteCount - totalDBCount)}개는 이미지 없어 저장 제외 (정상)\n`);
  }

  // DB 오류 분석
  await analyzeDB();

  console.log('\n══════════════════════════════════════════════════════\n');
}

main().catch(console.error);
