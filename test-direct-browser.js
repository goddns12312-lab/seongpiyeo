#!/usr/bin/env node

const { chromium } = require('playwright');

const tests = [
  { name: '2. /listings 목록', url: 'http://localhost:3002/listings' },
  { name: '3. /listings/{id} 상세', url: 'http://localhost:3002/listings/9a975940-fca0-4b71-8304-55f0e1b04f8e' },
  { name: '4. /listings/region/서울', url: 'http://localhost:3002/listings/region/서울' },
  { name: '5. /jobs 목록', url: 'http://localhost:3002/jobs' },
  { name: '6. /jobs/new', url: 'http://localhost:3002/jobs/new' },
  { name: '7. /jobs/{slug} 상세', url: 'http://localhost:3002/jobs/test-job-1779825910601' },
  { name: '9. 로그인', url: 'http://localhost:3002/login' },
];

async function runTests() {
  console.log('\n🔍 직접 브라우저 테스트\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (const test of tests) {
    console.log(`\n📍 ${test.name}: ${test.url}`);

    try {
      const response = await page.goto(test.url, { waitUntil: 'networkidle', timeout: 10000 });
      const status = response?.status();
      console.log(`   상태: ${status}`);

      // 페이지 제목 확인
      const title = await page.title();
      console.log(`   제목: "${title}"`);

      // 특정 요소 확인
      let elementCheck = {};

      if (test.name.includes('listings') && !test.name.includes('region')) {
        // 매물 목록 - 카드 확인
        const cardCount = await page.locator('[class*="rounded-lg"]').count();
        elementCheck['카드'] = cardCount > 0;
        console.log(`   카드 수: ${cardCount}`);
      }

      if (test.name.includes('region')) {
        // 지역별 매물 - 지역 텍스트 + 카드
        const hasRegion = (await page.textContent('body')).includes('서울');
        const hasCards = await page.locator('[class*="rounded-lg"]').count() > 0;
        elementCheck['지역'] = hasRegion;
        elementCheck['카드'] = hasCards;
        console.log(`   지역표시: ${hasRegion}, 카드: ${hasCards}`);
      }

      if (test.name.includes('{id}')) {
        // 상세페이지 - 제목 + 가격정보
        const hasTitle = await page.locator('h1').count() > 0;
        const hasPrice = (await page.textContent('body')).includes('만원');
        elementCheck['제목'] = hasTitle;
        elementCheck['가격'] = hasPrice;
        console.log(`   제목: ${hasTitle}, 가격: ${hasPrice}`);
      }

      if (test.name.includes('jobs') && !test.name.includes('new') && !test.name.includes('{slug}')) {
        // 공고 목록 - 공고 카드
        const cardCount = await page.locator('a[href*="/jobs/"]').count();
        elementCheck['카드링크'] = cardCount > 0;
        console.log(`   공고링크 수: ${cardCount}`);
      }

      if (test.name.includes('/jobs/new')) {
        // 공고 등록 폼 - 입력 필드
        const inputCount = await page.locator('input, textarea').count();
        elementCheck['입력필드'] = inputCount > 0;
        console.log(`   입력필드 수: ${inputCount}`);
      }

      if (test.name.includes('{slug}')) {
        // 공고 상세 - 제목
        const titleText = await page.locator('h1').first().textContent();
        elementCheck['제목'] = titleText && titleText.length > 0;
        console.log(`   제목: "${titleText}"`);
      }

      if (test.name.includes('로그인')) {
        // 로그인 폼 - 비밀번호 필드
        const hasPassword = await page.locator('input[type="password"]').count() > 0;
        const hasRegisterLink = await page.locator('a[href*="/register"]').count() > 0;
        elementCheck['비밀번호'] = hasPassword;
        elementCheck['회원가입링크'] = hasRegisterLink;
        console.log(`   비밀번호필드: ${hasPassword}, 회원가입링크: ${hasRegisterLink}`);
      }

      // 결과 정리
      const allGood = Object.values(elementCheck).every(v => v);
      console.log(`   ✅ 상태: ${allGood ? '정상' : '문제있음'}`);
      if (!allGood) {
        Object.entries(elementCheck).forEach(([key, value]) => {
          if (!value) console.log(`     ❌ ${key} 없음`);
        });
      }

    } catch (err) {
      console.log(`   ❌ 오류: ${err.message.split('\n')[0]}`);
    }
  }

  await browser.close();
}

runTests();
