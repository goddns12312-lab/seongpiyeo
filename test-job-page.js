#!/usr/bin/env node

const { chromium } = require('playwright');

async function test() {
  console.log('\n🔍 공고 상세페이지 렌더링 테스트\n');

  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('📍 접속: /jobs/test-job-1779825910601');
    await page.goto('http://localhost:3002/jobs/test-job-1779825910601', { waitUntil: 'networkidle', timeout: 10000 });

    // 페이지 정보
    const title = await page.locator('h1').first().textContent();
    const content = await page.textContent('body');
    const hasContactButton = await page.locator('button').filter({ hasText: /문의|전화/ }).count() > 0;
    const hasStickyCard = await page.locator('text=/공고 정보/').count() > 0;
    const hasGallery = await page.locator('img').count() > 2;

    console.log(`\n제목: "${title}"`);
    console.log(`공고 정보 카드: ${hasStickyCard ? '✅' : '❌'}`);
    console.log(`문의 버튼: ${hasContactButton ? '✅' : '❌'}`);
    console.log(`이미지 갤러리: ${hasGallery ? '✅' : '❌'}`);

    // 에러 확인
    if (content.includes('Server Error') || content.includes('500')) {
      console.log('\n⚠️  에러 감지:');
      const errorLines = content.split('\n').filter(l =>
        l.toLowerCase().includes('error') && l.trim().length > 0
      ).slice(0, 5);
      errorLines.forEach(line => console.log(`  ${line.trim()}`));
    }

    await browser.close();
  } catch (err) {
    console.error('❌ 오류:', err.message);
  }
}

test();
