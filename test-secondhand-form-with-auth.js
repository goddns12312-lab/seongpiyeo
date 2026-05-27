#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testSecondhandForm() {
  const browser = await chromium.launch({ headless: false }); // 브라우저 보기 가능
  const screenshotDir = path.join(__dirname, 'test-secondhand-screenshots');

  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const baseUrl = 'http://localhost:3002';

  try {
    const page = await browser.newPage();

    console.log('\n🔐 중고장터 등록 폼 테스트 (로그인 사용자 기준)\n');
    console.log('========================================');
    console.log('주의: 테스트 계정이 필요합니다.');
    console.log('아직 없으면 페이지에서 회원가입을 먼저 진행하세요.');
    console.log('========================================\n');

    // 1️⃣ 로그인 페이지
    console.log('1️⃣  로그인 페이지 접속');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `${screenshotDir}/01-login-page.png` });

    // 사용자 입력 대기
    console.log('\n📝 로그인 정보를 입력하세요:');
    console.log('   - 이메일 또는 ID');
    console.log('   - 비밀번호');
    console.log('\n💡 팁: 새 계정이 필요하면 "계정이 없으신가요?" 클릭 → 회원가입 진행\n');

    // 로그인 버튼이 활성화될 때까지 대기 (사용자가 입력할 때까지)
    await page.waitForFunction(() => {
      const btn = document.querySelector('button[type="submit"]');
      return btn && !btn.disabled;
    }, { timeout: 60000 });

    console.log('✅ 로그인 폼 입력 감지');

    // 로그인 버튼 대기 (자동 또는 수동 클릭)
    const loginBtn = page.locator('button:has-text("로그인")');
    await loginBtn.click();

    // 로그인 완료 대기 (메인 페이지 또는 대시보드로 이동)
    try {
      await page.waitForNavigation({ timeout: 15000 });
      console.log('✅ 로그인 완료, 페이지 전환됨');
    } catch {
      console.log('⚠️  페이지 전환 없음 (이미 로그인 상태일 수 있음)');
    }

    // 2️⃣ /secondhand/new 접속
    console.log('\n2️⃣  /secondhand/new 등록 페이지 접속');
    await page.goto(`${baseUrl}/secondhand/new`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `${screenshotDir}/02-form-page.png` });

    // 폼 요소 확인
    const titleInput = page.locator('input[name="title"]');
    const descInput = page.locator('textarea[name="description"]');
    const priceInput = page.locator('input[name="price"]');
    const regionSelect = page.locator('select[name="region"]');
    const imageInput = page.locator('input[accept="image/*"]');
    const submitBtn = page.locator('button[type="submit"]');

    const hasTitle = await titleInput.count() > 0;
    const hasDesc = await descInput.count() > 0;
    const hasPrice = await priceInput.count() > 0;
    const hasRegion = await regionSelect.count() > 0;
    const hasImage = await imageInput.count() > 0;
    const hasSubmit = await submitBtn.count() > 0;

    console.log('\n✅ 폼 요소 확인:');
    console.log(`   ${hasTitle ? '✅' : '❌'} 제목 입력`);
    console.log(`   ${hasDesc ? '✅' : '❌'} 설명 입력`);
    console.log(`   ${hasPrice ? '✅' : '❌'} 가격 입력`);
    console.log(`   ${hasRegion ? '✅' : '❌'} 지역 선택`);
    console.log(`   ${hasImage ? '✅' : '❌'} 이미지 업로드`);
    console.log(`   ${hasSubmit ? '✅' : '❌'} 등록하기 버튼`);

    if (!hasTitle || !hasPrice) {
      console.log('\n❌ 폼이 정상적으로 로드되지 않았습니다.');
      console.log('   → 로그인이 제대로 되었는지 확인하세요');
      console.log(`   → 현재 URL: ${page.url()}`);
      process.exit(1);
    }

    // 3️⃣ 폼 입력
    console.log('\n3️⃣  폼 데이터 입력');

    const testData = {
      title: '테스트 상품 - 중고 모니터',
      description: '상태 좋은 24인치 모니터입니다. 화면 밝기 조절 가능하고 색감도 자연스럽습니다.',
      price: '15',
      region: '서울'
    };

    await titleInput.fill(testData.title);
    await descInput.fill(testData.description);
    await priceInput.fill(testData.price);
    await regionSelect.selectOption(testData.region);

    console.log('   제목:', testData.title);
    console.log('   설명:', testData.description.substring(0, 30) + '...');
    console.log('   가격:', testData.price + '만원');
    console.log('   지역:', testData.region);

    await page.screenshot({ path: `${screenshotDir}/03-form-filled.png` });
    console.log('\n✅ 폼 입력 완료');

    // 4️⃣ 이미지 선택 (선택사항)
    console.log('\n4️⃣  이미지 선택 (선택사항)');
    console.log('   → 현재: 이미지 없이 진행합니다.');
    console.log('   → 실제 운영 시에는 이미지를 선택하세요.');

    // 5️⃣ 폼 제출
    console.log('\n5️⃣  폼 제출');
    const submitButton = page.locator('button:has-text("등록하기")');

    if (await submitButton.isDisabled()) {
      console.log('⚠️  등록하기 버튼이 비활성화됨');
      console.log('   → 필수 필드를 모두 입력하세요');
      process.exit(1);
    }

    await submitButton.click();
    console.log('✅ 등록 요청 전송됨');

    // 제출 후 페이지 전환 대기
    try {
      await page.waitForNavigation({ timeout: 10000 });
      const finalUrl = page.url();

      if (finalUrl.includes('/secondhand') && !finalUrl.includes('/new')) {
        console.log('\n✅ 등록 성공!');
        console.log(`   → 리다이렉트됨: ${finalUrl}`);
        await page.screenshot({ path: `${screenshotDir}/04-success.png` });
      } else {
        console.log('\n⚠️  예상치 못한 페이지로 이동');
        console.log(`   → URL: ${finalUrl}`);
      }
    } catch {
      const currentUrl = page.url();
      console.log('\n⚠️  페이지 전환 타임아웃');
      console.log(`   → 현재 URL: ${currentUrl}`);

      // 에러 메시지 확인
      const errorMsg = await page.locator('text=/오류|실패|에러/').first().textContent().catch(() => null);
      if (errorMsg) {
        console.log(`   → 에러 메시지: ${errorMsg}`);
      }
    }

    console.log('\n========================================');
    console.log('📸 스크린샷 저장 위치:');
    console.log(`   ${screenshotDir}`);
    console.log('========================================\n');

  } catch (err) {
    console.error('\n❌ 테스트 실패:', err.message);
    process.exit(1);
  } finally {
    // 브라우저 닫기 전 사용자에게 시간 제공
    console.log('💡 브라우저를 계속 확인하려면 기다리세요... (10초 후 자동 종료)');
    await new Promise(r => setTimeout(r, 10000));
    await browser.close();
  }
}

testSecondhandForm();
