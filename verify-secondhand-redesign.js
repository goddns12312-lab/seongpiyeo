#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('\n📸 중고장터 리디자인 검증 시작\n');

  try {
    const page = await browser.newPage();

    // 1. 목록 페이지 검증
    console.log('1️⃣  목록 페이지 (/secondhand) 검증');
    await page.goto('http://localhost:3002/secondhand', { waitUntil: 'networkidle', timeout: 10000 });
    await page.screenshot({ path: `${screenshotDir}/01-list-page.png` });

    // 히어로 영역 확인
    const heroTitle = await page.locator('text=/PC방 중고거래/').count();
    const heroDesc = await page.locator('text=/중고 물품을 거래하는/').count();
    const addButton = await page.locator('button:has-text("물품 올리기")').count();

    console.log(`   ✅ 히어로 영역: ${heroTitle > 0 && heroDesc > 0 ? '성공' : '실패'}`);
    console.log(`   ✅ 물품 올리기 버튼: ${addButton > 0 ? '성공' : '실패'}`);

    // 검색/필터 영역 확인
    const searchInput = await page.locator('input[placeholder*="검색"]').count();
    const regionSelect = await page.locator('select').count();
    const sortButtons = await page.locator('button:has-text("최신순"), button:has-text("낮은가격순"), button:has-text("높은가격순")').count();

    console.log(`   ✅ 검색창: ${searchInput > 0 ? '성공' : '실패'}`);
    console.log(`   ✅ 지역 필터: ${regionSelect > 0 ? '성공' : '실패'}`);
    console.log(`   ✅ 정렬 버튼: ${sortButtons >= 2 ? '성공' : '실패'}`);

    // 카드 그리드 확인
    const cards = await page.locator('a[href*="/secondhand/"] div[class*="rounded-xl"]').count();
    console.log(`   ✅ 물품 카드: ${cards > 0 ? `${cards}개 발견` : '없음'}`);

    // 첫 번째 카드 클릭해서 상세 페이지로 이동
    if (cards > 0) {
      console.log('\n2️⃣  상세 페이지 (/secondhand/[id]) 검증');
      const firstLink = await page.locator('a[href*="/secondhand/"]').first();
      const href = await firstLink.getAttribute('href');

      if (href && !href.includes('/new')) {
        await page.goto(`http://localhost:3002${href}`, { waitUntil: 'networkidle', timeout: 10000 });
        await page.screenshot({ path: `${screenshotDir}/02-detail-page.png` });

        // 제목 확인
        const title = await page.locator('h1').count();
        console.log(`   ✅ 제목 (h1): ${title > 0 ? '성공' : '실패'}`);

        // 2열 레이아웃 확인 (좌측 콘텐츠 + 우측 sticky)
        const leftContent = await page.locator('h2:has-text("상품 설명")').count();
        const sidebarSticky = await page.locator('[class*="sticky"]').count();
        const priceCard = await page.locator('text=/만원/').count();

        console.log(`   ✅ 좌측 콘텐츠: ${leftContent > 0 ? '성공' : '실패'}`);
        console.log(`   ✅ 우측 sticky 카드: ${sidebarSticky > 0 ? '성공' : '실패'}`);
        console.log(`   ✅ 가격 정보: ${priceCard > 0 ? '성공' : '실패'}`);

        // 이미지 갤러리 확인
        const gallery = await page.locator('[class*="aspect-video"]').count();
        console.log(`   ✅ 이미지 갤러리: ${gallery > 0 ? '성공' : '실패'}`);

        // 액션 버튼 확인
        const contactBtn = await page.locator('button:has-text("판매자에게 문의")').count();
        const backBtn = await page.locator('button:has-text("목록으로")').count();
        console.log(`   ✅ 문의하기 버튼: ${contactBtn > 0 ? '성공' : '실패'}`);
        console.log(`   ✅ 목록으로 버튼: ${backBtn > 0 ? '성공' : '실패'}`);
      }
    }

    // 3. 등록 페이지 검증
    console.log('\n3️⃣  등록 페이지 (/secondhand/new) 검증');
    await page.goto('http://localhost:3002/secondhand/new', { waitUntil: 'networkidle', timeout: 10000 });
    await page.screenshot({ path: `${screenshotDir}/03-new-page.png` });

    const formTitle = await page.locator('input[name="title"]').count();
    const formPrice = await page.locator('input[name="price"]').count();
    const formRegion = await page.locator('select[name="region"]').count();
    const imageInput = await page.locator('input[accept="image/*"]').count();

    console.log(`   ✅ 제목 입력: ${formTitle > 0 ? '성공' : '실패'}`);
    console.log(`   ✅ 가격 입력: ${formPrice > 0 ? '성공' : '실패'}`);
    console.log(`   ✅ 지역 선택: ${formRegion > 0 ? '성공' : '실패'}`);
    console.log(`   ✅ 이미지 업로드: ${imageInput > 0 ? '성공' : '실패'}`);

    console.log('\n✅ 모든 검증 완료!\n');
    console.log(`📁 스크린샷: ${screenshotDir}\n`);

  } catch (err) {
    console.error('❌ 검증 실패:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

verify();
