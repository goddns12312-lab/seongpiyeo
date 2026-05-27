const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const EMAIL = 'ap05020@nate.com';
const PASSWORD = 'whdgus0603';

async function loginWithModal() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🔐 로그인 세션 설정 중...\n');

  // 1. 메인 페이지
  console.log('1️⃣ 메인 페이지 접속');
  await page.goto('https://www.xn--3e0b036btifksj.com', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // 2. 로그인 버튼 클릭
  console.log('2️⃣ 로그인 버튼 클릭');
  
  const loginBtn = await page.$('[class*="login_btn"] a, button:has-text("로그인"), a:has-text("로그인")');
  if (loginBtn) {
    await loginBtn.click();
    console.log('  ✓ 로그인 버튼 클릭됨');
  }

  // 3. 모달 로드 대기
  console.log('3️⃣ 로그인 모달 로드 대기');
  
  try {
    await page.waitForSelector('input[type="email"], input[name="email"], input[type="text"][placeholder*="이메일"]', { 
      timeout: 5000 
    });
    console.log('  ✓ 입력필드 감지됨');
  } catch (e) {
    console.log('  ⚠️ 입력필드 못 찾음, 계속 진행...');
  }

  // 4. 실제 로그인 페이지로 이동 (모달 대신 직접)
  console.log('\n4️⃣ 로그인 페이지로 직접 이동');
  await page.goto('https://www.xn--3e0b036btifksj.com/member/login', { 
    waitUntil: 'domcontentloaded', 
    timeout: 30000 
  }).catch(() => {
    console.log('  ℹ️ /member/login 경로 없음, 다른 경로 시도');
  });

  // 5. 혹시 모를 iframe 확인
  const iframes = await page.$$('iframe');
  console.log(`5️⃣ iframe 확인: ${iframes.length}개`);

  // 6. 모든 입력필드 재검사
  console.log('6️⃣ 입력필드 재검사');
  
  const allInputs = await page.$$('input');
  console.log(`  총 입력필드: ${allInputs.length}개`);

  // 이메일 입력필드 찾기
  let emailInput = null;
  for (const input of allInputs) {
    const type = await input.getAttribute('type');
    const name = await input.getAttribute('name');
    const placeholder = await input.getAttribute('placeholder');
    const id = await input.getAttribute('id');

    console.log(`  - [${type}] name="${name}", placeholder="${placeholder}", id="${id}"`);

    if (type === 'email' || name === 'email' || placeholder?.includes('이메일') || id?.includes('email')) {
      emailInput = input;
    }
  }

  if (emailInput) {
    console.log('\n7️⃣ 자격증명 입력');
    await emailInput.fill(EMAIL);
    console.log('  ✓ 이메일 입력 완료');

    // 비밀번호 입력
    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
      await passwordInput.fill(PASSWORD);
      console.log('  ✓ 비밀번호 입력 완료');

      // 제출
      const submitBtn = await page.$('button[type="submit"], input[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        console.log('  ✓ 로그인 제출');
        
        try {
          await page.waitForNavigation({ timeout: 10000 }).catch(() => {});
        } catch (e) {}
        await page.waitForTimeout(3000);
      }
    }
  } else {
    console.log('\n❌ 로그인 입력필드를 찾을 수 없습니다');
    console.log('   스크린샷을 저장합니다...');
    await page.screenshot({ path: 'login-page-screenshot.png' });
    console.log('   📸 login-page-screenshot.png 저장됨\n');
  }

  // 8. 상태 확인
  console.log('8️⃣ 상태 확인');
  const currentUrl = page.url();
  const content = await page.evaluate(() => document.body.innerText);

  console.log(`  URL: ${currentUrl}`);
  console.log(`  로그인 여부: ${content.includes('로그아웃') ? '✓' : '✗'}`);
  console.log(`  콘텐츠 길이: ${content.length}자\n`);

  // 9. 쿠키 저장
  console.log('9️⃣ 세션 저장');
  const cookies = await page.context().cookies();
  const storageState = await page.context().storageState();

  fs.writeFileSync(
    path.join(__dirname, 'playwright-auth.json'),
    JSON.stringify(storageState, null, 2)
  );

  console.log(`  ✓ playwright-auth.json 저장됨 (쿠키 ${cookies.length}개)`);

  console.log('\n' + '='.repeat(80));
  console.log('⏸️ 브라우저를 3초 후 종료합니다...\n');

  await new Promise(resolve => setTimeout(resolve, 3000));
  await browser.close();
}

loginWithModal().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
