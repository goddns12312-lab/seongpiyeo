#!/usr/bin/env node

/**
 * 공고 카드 클릭 → 상세페이지 이동 테스트
 * 기존 공고를 이용하여 카드 클릭 및 상세페이지 로드 검증
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3002';

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  공고 카드 클릭 → 상세페이지 이동 테스트                  ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function test() {
  let browser;
  const results = {
    listPageLoads: false,
    cardsVisible: false,
    firstCardClickable: false,
    detailPageLoads: false,
    detailPageHasContent: false,
  };

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Step 1: Load /jobs list page
    console.log('📋 [1] /jobs 목록 페이지 로드\n');
    await page.goto(`${BASE_URL}/jobs`, { waitUntil: 'networkidle' });
    const listUrl = page.url();
    console.log(`   URL: ${listUrl}`);
    results.listPageLoads = true;
    console.log('   ✅ 목록 페이지 로드 완료\n');

    // Step 2: Find job cards
    console.log('🔍 [2] 공고 카드 찾기\n');
    const cardCount = await page.locator('[class*="hover:border-gold"]').count();
    console.log(`   카드 개수: ${cardCount}`);

    if (cardCount > 0) {
      results.cardsVisible = true;
      console.log('   ✅ 공고 카드 발견\n');

      // Step 3: Click first card
      console.log('🖱️  [3] 첫 번째 카드 클릭\n');
      const firstCard = page.locator('[class*="hover:border-gold"]').first();

      // Get the link href
      const parentLink = firstCard.locator('..').locator('a').first();
      const href = await parentLink.getAttribute('href');
      console.log(`   카드 링크: ${href}`);

      // Click the card
      await firstCard.click();
      await page.waitForTimeout(2000);

      const detailUrl = page.url();
      console.log(`   이동된 URL: ${detailUrl}`);

      // Check if navigation successful
      if (detailUrl.includes('/jobs/') && detailUrl !== listUrl) {
        results.firstCardClickable = true;
        console.log('   ✅ 상세페이지로 이동\n');

        // Step 4: Verify detail page content
        console.log('📄 [4] 상세페이지 콘텐츠 검증\n');

        const pageContent = await page.textContent('body');

        // Check for key elements
        const hasTitle = await page.locator('h1').count() > 0;
        const hasImages = await page.locator('img').count() > 2;
        const hasContact = pageContent.includes('연락처') || pageContent.includes('010');

        console.log(`   H1 제목: ${hasTitle ? '✅' : '❌'}`);
        console.log(`   이미지: ${hasImages ? `✅ (${await page.locator('img').count()}개)` : '❌'}`);
        console.log(`   연락처: ${hasContact ? '✅' : '❌'}`);

        if (hasTitle && hasImages) {
          results.detailPageHasContent = true;
          console.log('\n   ✅ 상세페이지 콘텐츠 정상\n');
        }

        results.detailPageLoads = true;

        // Step 5: Refresh and verify persistence
        console.log('🔄 [5] 페이지 새로고침\n');
        await page.reload({ waitUntil: 'networkidle' });
        const reloadUrl = page.url();
        console.log(`   새로고침 후 URL: ${reloadUrl}`);

        if (reloadUrl === detailUrl) {
          console.log('   ✅ 페이지 유지됨\n');
        } else {
          console.log('   ❌ 페이지 변경됨\n');
        }
      } else {
        console.log('   ❌ 상세페이지로 이동하지 않음\n');
      }
    } else {
      console.log('   ❌ 공고 카드를 찾을 수 없음\n');
    }

    // Final summary
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  최종 검증 결과                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📋 검증 항목:');
    console.log(`   ${results.listPageLoads ? '✅' : '❌'} 목록 페이지 로드`);
    console.log(`   ${results.cardsVisible ? '✅' : '❌'} 카드 표시`);
    console.log(`   ${results.firstCardClickable ? '✅' : '❌'} 카드 클릭`);
    console.log(`   ${results.detailPageLoads ? '✅' : '❌'} 상세페이지 로드`);
    console.log(`   ${results.detailPageHasContent ? '✅' : '❌'} 콘텐츠 표시\n`);

    const allPass = Object.values(results).every(v => v);
    if (allPass) {
      console.log('🎉 최종 결과: ✅ 모든 항목 통과!\n');
      console.log('   → /jobs에서 카드 클릭 후 상세페이지가 정상 작동합니다\n');
    } else {
      console.log('⚠️  일부 항목 미통과\n');
    }

  } catch (err) {
    console.error('\n❌ 테스트 실패:', err.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

test();
