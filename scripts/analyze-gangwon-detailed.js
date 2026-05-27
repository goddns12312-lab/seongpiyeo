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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function analyzeGangwon() {
  const browser = await chromium.launch();

  // 인증 로드
  const authPath = path.join(process.cwd(), 'auth_state.json');
  if (!fs.existsSync(authPath)) {
    console.error('❌ auth_state.json이 없습니다. 먼저 다음 명령어를 실행하세요:');
    console.error('   node scripts/capture-auth.js\n');
    process.exit(1);
  }
  const authState = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
  const context = await browser.newContext({ storageState: authState });

  const region = REGIONS.find(r => r.name === '강원도');
  const allListings = [];

  console.log('\n🔍 강원도 전체 게시글 상세 분석\n');

  for (let pageNum = region.lastPage; pageNum >= 1; pageNum--) {
    const url = getListPageUrl(region, pageNum);
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const titleCount = await page.locator('li.tit a.title_link').count();

      console.log(`📄 강원도 - ${pageNum}/${region.lastPage} 페이지 (${titleCount}개 게시글)\n`);

      for (let i = 0; i < titleCount; i++) {
        try {
          // 목록 페이지에서 제목 읽기 (click 전)
          const titleLocator = page.locator('li.tit a.title_link').nth(i);
          const title = await titleLocator.innerText();

          // 상세페이지 접근
          await titleLocator.click();
          await page.waitForTimeout(2500);

          const detailUrl = page.url();
          const idxMatch = detailUrl.match(/idx=(\d+)/);
          const idx = idxMatch ? idxMatch[1] : null;

          if (!idx) {
            console.log(`  ❌ [${i+1}/${titleCount}] idx 추출 실패`);
            allListings.push({
              page: pageNum,
              index: i,
              title: title.trim(),
              idx: null,
              imageUrls: [],
              skipReason: 'idx 추출 실패',
              dbSaved: false
            });
          } else {
            // 상세 페이지에서 이미지 추출
            const detailData = await page.evaluate(() => {
              const boardTxtArea = document.querySelector('.board_txt_area.fr-view');
              if (!boardTxtArea) {
                return {
                  imageUrls: [],
                  imageCount: 0,
                  description: '',
                  boardTxtAreaExists: false,
                  images: []
                };
              }

              // .board_txt_area.fr-view 내부의 img.fr-dii._img_light_gallery 찾기
              const images = Array.from(boardTxtArea.querySelectorAll('img.fr-dii._img_light_gallery'));

              const imageUrls = images
                .map(img => img.src || img.getAttribute('data-src'))
                .filter(src => src && src.includes('cdn.imweb.me/upload/'))
                .filter((src, idx, arr) => arr.indexOf(src) === idx);

              const description = boardTxtArea.innerText || '';

              return {
                imageUrls,
                imageCount: imageUrls.length,
                description,
                boardTxtAreaExists: true,
                images: images.map((img, idx) => ({
                  idx,
                  src: img.src || img.getAttribute('data-src'),
                  alt: img.alt,
                  className: img.className
                }))
              };
            });

            // DB에서 해당 idx 조회
            const { data: dbListing } = await supabase
              .from('listings')
              .select('id, title, status, main_image_url')
              .eq('idx', idx)
              .single();

            const skipReason = detailData.imageCount === 0 ? '이미지 없음' : null;

            console.log(`  [${i+1}/${titleCount}] idx=${idx} | 이미지=${detailData.imageCount}개 | DB=${dbListing ? '✅ ' + dbListing.status : '❌ 없음'}`);
            console.log(`           제목: ${title.trim().substring(0, 50)}`);

            if (detailData.imageCount === 0) {
              console.log(`           ⚠️  이미지 없음`);
              if (dbListing) {
                console.log(`           📌 DB에 ${dbListing.status} 상태로 저장됨`);
              }
            }

            console.log('');

            allListings.push({
              page: pageNum,
              index: i,
              title: title.trim(),
              idx,
              imageUrls: detailData.imageUrls,
              imageCount: detailData.imageCount,
              skipReason,
              dbSaved: !!dbListing,
              dbStatus: dbListing?.status,
              sourceUrl: detailUrl
            });
          }

          // 목록으로 돌아가기
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        } catch (err) {
          console.error(`  ❌ 오류 (${i+1}/${titleCount}): ${err.message}\n`);
        }
      }
    } catch (err) {
      console.error(`⚠️  페이지 ${pageNum} 로드 오류: ${err.message}`);
    } finally {
      await page.close();
    }
  }

  await context.close();
  await browser.close();

  // 분석 결과
  console.log('\n══════════════════════════════════════════════════════');
  console.log('📊 분석 결과\n');

  const withImages = allListings.filter(l => l.imageCount > 0);
  const withoutImages = allListings.filter(l => l.imageCount === 0);
  const savedInDB = allListings.filter(l => l.dbSaved);
  const notSavedInDB = allListings.filter(l => !l.dbSaved);

  console.log(`📈 통계:`);
  console.log(`  총 게시글: ${allListings.length}개`);
  console.log(`  이미지 있음: ${withImages.length}개`);
  console.log(`  이미지 없음: ${withoutImages.length}개`);
  console.log(`  DB 저장: ${savedInDB.length}개`);
  console.log(`  DB 미저장: ${notSavedInDB.length}개\n`);

  if (withoutImages.length > 0) {
    console.log(`⚠️  이미지 없는 게시글 (${withoutImages.length}개):\n`);
    withoutImages.forEach((l, i) => {
      console.log(`  ${i + 1}. idx=${l.idx} | ${l.title.substring(0, 50)}`);
      if (l.dbSaved) {
        console.log(`     📌 DB에 ${l.dbStatus} 상태로 저장됨 ← 삭제 또는 hidden 필요`);
      }
      console.log('');
    });
  }

  if (notSavedInDB.length > 0) {
    console.log(`❌ DB 미저장 게시글 (${notSavedInDB.length}개):\n`);
    notSavedInDB.forEach((l, i) => {
      console.log(`  ${i + 1}. idx=${l.idx} | 이미지=${l.imageCount}개 | ${l.title.substring(0, 50)}`);
      if (l.skipReason) {
        console.log(`     사유: ${l.skipReason}`);
      }
      console.log('');
    });
  }

  // JSON 저장
  const reportPath = path.join(process.cwd(), 'scripts/output/gangwon-analysis.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    region: '강원도',
    summary: {
      totalListings: allListings.length,
      withImages: withImages.length,
      withoutImages: withoutImages.length,
      savedInDB: savedInDB.length,
      notSavedInDB: notSavedInDB.length
    },
    listings: allListings,
    issues: {
      imagesWithoutDbSave: withoutImages.filter(l => !l.dbSaved),
      imagesWithDbSave: withoutImages.filter(l => l.dbSaved),
      noImagesWithDbSave: withoutImages.filter(l => l.dbSaved)
    }
  }, null, 2));

  console.log(`\n✅ 결과를 scripts/output/gangwon-analysis.json에 저장했습니다\n`);
  console.log('══════════════════════════════════════════════════════\n');
}

analyzeGangwon().catch(console.error);
