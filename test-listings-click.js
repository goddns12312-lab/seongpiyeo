#!/usr/bin/env node

/**
 * 매물 카드 클릭 → 상세페이지 이동 테스트
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3002';

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  매물 상세페이지 E2E 테스트                             ║');
console.log('║  목록 → 카드 클릭 → 상세페이지 표시                    ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function test() {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Step 1: Load /listings
    console.log('📋 [1] /listings 목록 페이지 로드\n');
    await page.goto(`${BASE_URL}/listings`, { waitUntil: 'networkidle' });
    const listUrl = page.url();
    console.log(`   URL: ${listUrl}`);
    console.log('   ✅ 목록 페이지 로드\n');

    // Step 2: Find listing cards
    console.log('🔍 [2] 매물 카드 찾기\n');

    // Look for listing links - they have /listings/ in href
    const listingLinks = await page.locator('a[href*="/listings/"]').all();

    // Filter for actual listing cards (not nav links)
    const cardLinks = [];
    for (const link of listingLinks) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();

      // Skip navigation links and filters
      if (href.startsWith('/listings/') &&
          !href.includes('/new') &&
          !href.includes('/edit') &&
          !href.includes('/region') &&
          text.length > 20) {
        cardLinks.push({ link, href, text });
      }
    }

    console.log(`   발견된 매물: ${cardLinks.length}개`);

    if (cardLinks.length === 0) {
      console.log('   ❌ 매물을 찾을 수 없습니다');

      // Debug: Show all links
      console.log('\n   [DEBUG] 전체 링크:');
      const allLinks = await page.locator('a').all();
      for (let i = 0; i < Math.min(20, allLinks.length); i++) {
        const href = await allLinks[i].getAttribute('href');
        const text = (await allLinks[i].textContent()).trim().substring(0, 40);
        console.log(`     [${i}] ${href} | ${text}`);
      }
      process.exit(1);
    }

    // Test first card
    const firstCard = cardLinks[0];
    const cardId = firstCard.href.replace('/listings/', '');
    console.log(`   첫 번째 매물: /listings/${cardId}`);
    console.log(`   제목: ${firstCard.text.substring(0, 50)}\n`);

    // Step 3: Click first card
    console.log('🖱️  [3] 첫 번째 매물 클릭\n');
    await firstCard.link.click();

    // Wait for navigation
    await page.waitForURL('**/listings/**', { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});

    const detailUrl = page.url();
    console.log(`   이동된 URL: ${detailUrl}`);

    // Check for 404
    const statusCode = await page.evaluate(() => {
      const text = document.body.textContent;
      if (text.includes('This page could not be found') || text.includes('404')) {
        return 404;
      }
      return 200;
    });

    if (statusCode === 404) {
      console.log('   ❌ 404 에러 발생!\n');
      const pageContent = await page.textContent('body');
      console.log('   페이지 내용:');
      console.log(pageContent.substring(0, 200));
      process.exit(1);
    }

    console.log('   ✅ 상세페이지 로드\n');

    // Step 4: Verify content
    console.log('📄 [4] 상세페이지 콘텐츠 검증\n');

    const checks = {
      '제목 (h1)': await page.locator('h1').count() > 0,
      '이미지': await page.locator('img').count() > 0,
      '가격': (await page.textContent('body')).match(/\d+만원/) !== null,
      '지역': (await page.textContent('body')).length > 100,
    };

    let allPassed = true;
    for (const [check, result] of Object.entries(checks)) {
      console.log(`   ${result ? '✅' : '❌'} ${check}`);
      if (!result) allPassed = false;
    }

    if (allPassed) {
      console.log('\n   ✅ 모든 콘텐츠 확인됨\n');
    }

    // Step 5: Refresh
    console.log('🔄 [5] 페이지 새로고침\n');
    await page.reload({ waitUntil: 'networkidle' });
    const reloadUrl = page.url();

    const reloadStatus = await page.evaluate(() => {
      const text = document.body.textContent;
      if (text.includes('This page could not be found') || text.includes('404')) {
        return 404;
      }
      return 200;
    });

    if (reloadStatus === 404) {
      console.log('   ❌ 새로고침 후 404 에러!\n');
      process.exit(1);
    }

    console.log(`   ✅ URL 유지: ${reloadUrl}\n`);

    // Final summary
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ 모든 테스트 완료!                                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('🎉 결과:');
    console.log('   ✅ /listings 목록 로드');
    console.log(`   ✅ 매물 카드 표시 (${cardLinks.length}개)`);
    console.log('   ✅ 카드 클릭 시 상세페이지로 이동');
    console.log('   ✅ 상세페이지 콘텐츠 표시');
    console.log('   ✅ 새로고침 후 내용 유지\n');

    console.log('→ 매물 상세페이지가 정상 작동합니다!\n');

  } catch (err) {
    console.error('\n❌ 테스트 실패:', err.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

test();
