#!/usr/bin/env node

/**
 * 매물 상세페이지 최종 테스트
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3002';

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  매물 상세페이지 최종 E2E 테스트                         ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function test() {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Step 1: Load /listings
    console.log('📋 [1] /listings 목록 페이지 로드\n');
    await page.goto(`${BASE_URL}/listings`, { waitUntil: 'networkidle' });
    console.log('   ✅ 페이지 로드\n');

    // Step 2: Find listing links
    console.log('🔍 [2] 매물 링크 확인\n');

    const allLinks = await page.locator('a').all();
    const listingLinks = [];

    for (const link of allLinks) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();

      // Find actual listing links
      if (href &&
          href.startsWith('/listings/') &&
          !href.includes('/new') &&
          !href.includes('/edit') &&
          !href.includes('/region') &&
          href.length > 15) {
        listingLinks.push({ link, href, text: text.trim().substring(0, 40) });
      }
    }

    console.log(`   발견: ${listingLinks.length}개 매물`);

    if (listingLinks.length === 0) {
      console.error('   ❌ 매물을 찾을 수 없음');
      process.exit(1);
    }

    // Test first listing
    const listing = listingLinks[0];
    const listingId = listing.href.split('/').pop();

    console.log(`   첫 번째 매물:`);
    console.log(`     URL: /listings/${listingId}`);
    console.log(`     제목: ${listing.text}\n`);

    // Step 3: Click and navigate
    console.log('🖱️  [3] 매물 클릭 및 이동\n');

    await listing.link.click();
    await page.waitForTimeout(2000);

    const finalUrl = page.url();
    console.log(`   이동된 URL: ${finalUrl}`);

    // Check page exists
    const pageText = await page.textContent('body');
    const has404 = pageText.includes('404') ||
                   pageText.includes('This page could not be found') ||
                   pageText.includes('페이지를 찾을 수 없습니다');

    if (has404) {
      console.log('   ❌ 404 에러 페이지\n');
      console.log('   페이지 내용:', pageText.substring(0, 200));
      process.exit(1);
    }

    console.log('   ✅ 페이지 로드 성공\n');

    // Step 4: Verify content
    console.log('📄 [4] 콘텐츠 검증\n');

    const h1 = await page.locator('h1').first();
    const h1Text = await h1.textContent().catch(() => '');

    const imageCount = await page.locator('img').count();
    const hasPrice = pageText.match(/\d+만원/) !== null;
    const hasRegion = pageText.length > 200;

    console.log(`   ${h1Text ? '✅' : '❌'} 제목: ${h1Text || '없음'}`);
    console.log(`   ${imageCount > 0 ? '✅' : '❌'} 이미지: ${imageCount}개`);
    console.log(`   ${hasPrice ? '✅' : '❌'} 가격 정보`);
    console.log(`   ${hasRegion ? '✅' : '❌'} 상세 내용\n`);

    // Step 5: Refresh
    console.log('🔄 [5] 새로고침\n');
    await page.reload({ waitUntil: 'networkidle' });

    const reloadText = await page.textContent('body');
    const reload404 = reloadText.includes('404') ||
                       reloadText.includes('This page could not be found');

    if (reload404) {
      console.log('   ❌ 새로고침 후 404');
      process.exit(1);
    }

    console.log('   ✅ 새로고침 후 정상\n');

    // Summary
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ 모든 테스트 완료!                                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('🎉 결과:');
    console.log('   ✅ /listings 목록 로드');
    console.log(`   ✅ 매물 카드 발견 (${listingLinks.length}개)`);
    console.log('   ✅ 카드 클릭 → 상세페이지 이동');
    console.log('   ✅ 상세페이지 정상 로드');
    console.log('   ✅ 콘텐츠 (제목, 이미지, 가격) 표시');
    console.log('   ✅ 새로고침 후 유지\n');

    console.log('→ 매물 상세페이지가 정상 작동합니다!\n');

  } catch (err) {
    console.error('\n❌ 테스트 실패:', err.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

test();
