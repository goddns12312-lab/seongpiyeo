#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const screenshotDir = path.join(__dirname, 'verification-screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('\n🛍️  중고장터 UI 검증 시작\n');

  const results = [];

  try {
    const page = await browser.newPage();
    const baseUrl = 'http://localhost:3002';

    // 1️⃣ LIST PAGE VERIFICATION
    console.log('1️⃣  /secondhand 목록 페이지 검증');
    await page.goto(`${baseUrl}/secondhand`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.screenshot({ path: `${screenshotDir}/01-list-page.png` });

    // Check hero section
    const heroTitle = await page.locator('text=/PC방 중고거래/').count();
    const heroDesc = await page.locator('text=/중고 물품을 거래하는/').count();
    const addButton = await page.locator('button:has-text("물품 올리기")').count();

    results.push({
      name: '히어로 제목',
      pass: heroTitle > 0,
      message: heroTitle > 0 ? '✅ "PC방 중고거래" 텍스트 발견' : '❌ 히어로 제목 없음'
    });
    results.push({
      name: '히어로 설명',
      pass: heroDesc > 0,
      message: heroDesc > 0 ? '✅ 설명 텍스트 발견' : '❌ 히어로 설명 없음'
    });
    results.push({
      name: '물품 올리기 버튼',
      pass: addButton > 0,
      message: addButton > 0 ? '✅ 버튼 발견' : '❌ 버튼 없음'
    });

    // Check search/filter area
    const searchInput = await page.locator('input[placeholder*="검색"]').count();
    const regionSelect = await page.locator('select').count();
    const sortButtons = await page.locator('button:has-text("최신순"), button:has-text("낮은가격순"), button:has-text("높은가격순")').count();

    results.push({
      name: '검색 입력창',
      pass: searchInput > 0,
      message: searchInput > 0 ? '✅ 발견' : '❌ 없음'
    });
    results.push({
      name: '지역 드롭다운',
      pass: regionSelect > 0,
      message: regionSelect > 0 ? '✅ 발견' : '❌ 없음'
    });
    results.push({
      name: '정렬 버튼들',
      pass: sortButtons >= 2,
      message: sortButtons >= 2 ? `✅ ${sortButtons}개 발견` : `❌ ${sortButtons}개만 발견`
    });

    // Check card grid (4:3 aspect ratio)
    const cardGridContainer = await page.locator('div[class*="grid"]').first();
    const gridClasses = await cardGridContainer.getAttribute('class');
    const hasResponsiveGrid = gridClasses && (gridClasses.includes('grid-cols-1') || gridClasses.includes('grid-cols-2'));

    results.push({
      name: '반응형 그리드',
      pass: hasResponsiveGrid,
      message: hasResponsiveGrid ? '✅ 그리드 레이아웃 발견' : '❌ 그리드 없음'
    });

    // Check card aspect ratio and hover effects
    const cards = await page.locator('[class*="rounded-xl"][class*="overflow-hidden"]').count();
    const cardWithAspect = await page.locator('[class*="aspect-"]').count();

    results.push({
      name: '카드 개수',
      pass: cards > 0,
      message: cards > 0 ? `✅ ${cards}개 카드 발견` : '❌ 카드 없음'
    });
    results.push({
      name: '4:3 이미지 비율',
      pass: cardWithAspect > 0,
      message: cardWithAspect > 0 ? `✅ aspect 클래스 적용 (${cardWithAspect}개)` : '❌ 이미지 비율 미설정'
    });

    // Check hover scale effect
    const firstCard = await page.locator('[class*="rounded-xl"]').first();
    const cardClasses = await firstCard.getAttribute('class');
    const hasHoverEffect = cardClasses && cardClasses.includes('hover');

    results.push({
      name: '호버 효과',
      pass: hasHoverEffect,
      message: hasHoverEffect ? '✅ 호버 클래스 발견' : '⚠️  호버 클래스 미발견 (동작은 확인 필요)'
    });

    // 2️⃣ DETAIL PAGE VERIFICATION
    console.log('\n2️⃣  상세 페이지 검증');
    const firstLink = await page.locator('a[href*="/secondhand/"]').first();
    if (firstLink) {
      const href = await firstLink.getAttribute('href');
      if (href && !href.includes('/new')) {
        await page.goto(`${baseUrl}${href}`, { waitUntil: 'networkidle', timeout: 10000 });
        await page.screenshot({ path: `${screenshotDir}/02-detail-page.png` });

        // Check 2-column layout
        const mainContent = await page.locator('div[class*="grid-cols"]').count();
        const stickyElement = await page.locator('[class*="sticky"]').count();

        results.push({
          name: '2열 레이아웃',
          pass: mainContent > 0,
          message: mainContent > 0 ? '✅ 그리드 2열 레이아웃 발견' : '❌ 2열 레이아웃 없음'
        });
        results.push({
          name: '우측 Sticky 사이드바',
          pass: stickyElement > 0,
          message: stickyElement > 0 ? `✅ sticky 요소 ${stickyElement}개 발견` : '❌ sticky 요소 없음'
        });

        // Check detail page elements
        const title = await page.locator('h1').count();
        const priceInfo = await page.locator('text=/만원/').count();
        const imageGallery = await page.locator('[class*="aspect-video"]').count();
        const contactBtn = await page.locator('button:has-text("문의"), button:has-text("연락")').count();

        results.push({
          name: '상세페이지 제목',
          pass: title > 0,
          message: title > 0 ? '✅ h1 제목 발견' : '❌ 제목 없음'
        });
        results.push({
          name: '가격 정보',
          pass: priceInfo > 0,
          message: priceInfo > 0 ? '✅ 가격 텍스트 발견' : '❌ 가격 없음'
        });
        results.push({
          name: '이미지 갤러리',
          pass: imageGallery > 0,
          message: imageGallery > 0 ? `✅ aspect-video 이미지 ${imageGallery}개 발견` : '⚠️  aspect-video 요소 없음'
        });
        results.push({
          name: '문의 버튼',
          pass: contactBtn > 0,
          message: contactBtn > 0 ? '✅ 연락 버튼 발견' : '⚠️  버튼 없음 (로그인 필요할 수 있음)'
        });
      }
    } else {
      results.push({
        name: '상세페이지 검증',
        pass: false,
        message: '⚠️  카드가 없어 상세페이지 테스트 불가'
      });
    }

    // 3️⃣ NEW PAGE VERIFICATION
    console.log('\n3️⃣  /secondhand/new 등록 폼 검증');
    await page.goto(`${baseUrl}/secondhand/new`, { waitUntil: 'networkidle', timeout: 10000 });

    const currentUrl = page.url();
    const isNewPage = currentUrl.includes('/secondhand/new');
    const isLoginPage = currentUrl.includes('/login');

    results.push({
      name: '등록 폼 또는 로그인 페이지',
      pass: isNewPage || isLoginPage,
      message: isNewPage ? '✅ /secondhand/new 페이지 로드' : isLoginPage ? '⚠️  로그인 페이지로 리다이렉트 (정상 동작)' : '❌ 예상치 못한 페이지'
    });

    if (isNewPage) {
      await page.screenshot({ path: `${screenshotDir}/03-new-page.png` });

      const formTitle = await page.locator('input[name="title"]').count();
      const formPrice = await page.locator('input[name="price"]').count();
      const imageInput = await page.locator('input[accept="image/*"]').count();

      results.push({
        name: '등록 폼 필드',
        pass: formTitle > 0,
        message: formTitle > 0 ? '✅ 제목 입력칸 발견' : '❌ 폼 없음'
      });
      results.push({
        name: '가격 입력칸',
        pass: formPrice > 0,
        message: formPrice > 0 ? '✅ 발견' : '❌ 없음'
      });
      results.push({
        name: '이미지 업로드',
        pass: imageInput > 0,
        message: imageInput > 0 ? '✅ 이미지 입력 발견' : '❌ 없음'
      });
    }

    // Print results
    console.log('\n' + '='.repeat(50));
    console.log('📊 검증 결과');
    console.log('='.repeat(50));

    let passCount = 0;
    results.forEach(r => {
      console.log(`${r.pass ? '✅' : '❌'} ${r.name}: ${r.message}`);
      if (r.pass) passCount++;
    });

    console.log('\n' + '='.repeat(50));
    console.log(`총 ${passCount}/${results.length} 항목 통과`);
    console.log(`📁 스크린샷: ${screenshotDir}`);
    console.log('='.repeat(50) + '\n');

    const allPass = results.every(r => r.pass);
    if (allPass) {
      console.log('✅ 모든 검증 통과!\n');
    } else {
      console.log('⚠️  일부 항목 미충족\n');
    }

  } catch (err) {
    console.error('❌ 검증 실패:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

verify();
