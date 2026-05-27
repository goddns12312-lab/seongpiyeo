#!/usr/bin/env node

const { chromium } = require('playwright');

async function debug() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('🔍 /secondhand/new 페이지 상세 검증\n');

    await page.goto('http://localhost:3002/secondhand/new', { waitUntil: 'networkidle', timeout: 10000 });

    const finalUrl = page.url();
    console.log(`최종 URL: ${finalUrl}`);

    const pageContent = await page.content();
    console.log(`페이지 크기: ${pageContent.length} bytes`);

    // Check for form elements
    const titleInput = await page.locator('input[name="title"]').count();
    const priceInput = await page.locator('input[name="price"]').count();
    const regionSelect = await page.locator('select[name="region"]').count();
    const imageInput = await page.locator('input[accept="image/*"]').count();

    console.log(`\n입력 요소 발견:`);
    console.log(`  - input[name="title"]: ${titleInput}`);
    console.log(`  - input[name="price"]: ${priceInput}`);
    console.log(`  - select[name="region"]: ${regionSelect}`);
    console.log(`  - input[accept="image/*"]: ${imageInput}`);

    // Check for login form elements
    const loginForm = await page.locator('form').count();
    const emailInput = await page.locator('input[type="email"], input[placeholder*="아이디"]').count();
    const passwordInput = await page.locator('input[type="password"]').count();

    console.log(`\n로그인 폼 요소 발견:`);
    console.log(`  - form: ${loginForm}`);
    console.log(`  - 이메일/ID 입력: ${emailInput}`);
    console.log(`  - 비밀번호 입력: ${passwordInput}`);

    // Get page title and main heading
    const title = await page.title();
    const h1Text = await page.locator('h1').first().textContent();
    const mainText = await page.locator('body').locator('text=로그인, 물품 올리기, 중고장터').textContent();

    console.log(`\n페이지 정보:`);
    console.log(`  - 제목: ${title}`);
    console.log(`  - H1: ${h1Text}`);

    console.log(`\n결론:`);
    if (finalUrl.includes('/login')) {
      console.log('✅ 로그인 페이지로 올바르게 리다이렉트됨');
    } else if (titleInput > 0) {
      console.log('✅ 등록 폼이 표시됨');
    } else {
      console.log('⚠️  페이지 상태 불명확');
    }

  } catch (err) {
    console.error('❌ 오류:', err.message);
  } finally {
    await browser.close();
  }
}

debug();
