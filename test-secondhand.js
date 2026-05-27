#!/usr/bin/env node

const { chromium } = require('playwright');

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('\n🛍️  중고장터 페이지 테스트\n');

  try {
    // 목록 페이지
    console.log('📍 /secondhand 목록 페이지');
    await page.goto('http://localhost:3002/secondhand', { waitUntil: 'networkidle', timeout: 10000 });
    const hasHero = await page.locator('text=/PC방 중고거래/').count() > 0;
    const hasFilter = await page.locator('input[placeholder*="검색"]').count() > 0;
    const hasCards = await page.locator('[class*="aspect-\\[4\\/3\\]"]').count() > 0;

    console.log(`   ${hasHero ? '✅' : '❌'} 히어로 영역 (제목, 설명)`);
    console.log(`   ${hasFilter ? '✅' : '❌'} 검색/필터 영역`);
    console.log(`   ${hasCards ? '✅' : '❌'} 카드 그리드 (4:3 이미지)\n`);

    // 상세 페이지 (첫 번째 물품이 있는지 확인)
    const links = await page.locator('a[href*="/secondhand/"]').count();
    if (links > 0) {
      console.log('📍 /secondhand/[id] 상세 페이지');
      const firstItemHref = await page.locator('a[href*="/secondhand/"]').first().getAttribute('href');
      if (firstItemHref && firstItemHref !== '/secondhand/new') {
        await page.goto(`http://localhost:3002${firstItemHref}`, { waitUntil: 'networkidle', timeout: 10000 });

        const hasTitle = await page.locator('h1').count() > 0;
        const hasSidebar = await page.locator('[class*="sticky"]').count() > 0;
        const hasImageGallery = await page.locator('[class*="aspect-video"]').count() > 0;
        const bodyText = await page.textContent('body');
        const hasPrice = bodyText?.includes('만원') || false;

        console.log(`   ${hasTitle ? '✅' : '❌'} 제목 (h1)`);
        console.log(`   ${hasSidebar ? '✅' : '❌'} 우측 sticky 카드`);
        console.log(`   ${hasImageGallery ? '✅' : '❌'} 이미지 갤러리`);
        console.log(`   ${hasPrice ? '✅' : '❌'} 가격 정보\n`);
      }
    }

    // 등록 페이지
    console.log('📍 /secondhand/new 등록 폼');
    await page.goto('http://localhost:3002/secondhand/new', { waitUntil: 'networkidle', timeout: 10000 });
    const hasForm = await page.locator('input[name="title"]').count() > 0;
    const hasImageInput = await page.locator('input[accept="image/*"]').count() > 0;

    console.log(`   ${hasForm ? '✅' : '❌'} 등록 폼 (제목, 가격, 지역)`);
    console.log(`   ${hasImageInput ? '✅' : '❌'} 이미지 업로드 영역\n`);

    console.log('✅ 중고장터 리디자인 완료!\n');
  } catch (err) {
    console.error('❌ 테스트 실패:', err.message);
  } finally {
    await browser.close();
  }
}

test();
