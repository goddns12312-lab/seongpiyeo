const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const EMAIL = 'ap05020@nate.com';
const PASSWORD = 'whdgus0603';

async function setupLoginSession() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const baseUrl = 'https://www.xn--3e0b036btifksj.com';

  console.log('🔐 로그인 세션 설정 중...\n');

  // 1. 메인 페이지 접속
  console.log('1️⃣ 메인 페이지 접속 중...');
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);

  // 2. 로그인 버튼 찾기
  console.log('2️⃣ 로그인 폼 분석 중...\n');

  // 로그인 버튼 클릭 (헤더의 로그인)
  const loginButtonSelectors = [
    'a:has-text("로그인")',
    'button:has-text("로그인")',
    '[class*="login"] a',
    '[class*="login"] button'
  ];

  let found = false;
  for (const selector of loginButtonSelectors) {
    try {
      const el = await page.$(selector);
      if (el) {
        console.log(`  📍 로그인 버튼 찾음: ${selector}`);
        await el.click();
        await page.waitForTimeout(2000);
        found = true;
        break;
      }
    } catch (e) {}
  }

  if (!found) {
    console.log('  ℹ️ 로그인 폼이 이미 표시되어 있음\n');
  } else {
    console.log('  ✓ 로그인 모달/페이지 열림\n');
  }

  // 3. 로그인 입력 필드 찾기 및 입력
  console.log('3️⃣ 로그인 자격증명 입력 중...');

  // 이메일 입력
  const emailSelectors = [
    'input[type="email"]',
    'input[name="email"]',
    'input[placeholder*="이메일"]',
    'input[placeholder*="email"]'
  ];

  let emailInput = null;
  for (const selector of emailSelectors) {
    emailInput = await page.$(selector).catch(() => null);
    if (emailInput) {
      console.log(`  📍 이메일 입력필드: ${selector}`);
      await emailInput.fill(EMAIL);
      await page.waitForTimeout(300);
      console.log(`  ✓ 이메일 입력 완료`);
      break;
    }
  }

  // 비밀번호 입력
  const passwordInput = await page.$('input[type="password"]');
  if (passwordInput) {
    console.log(`  📍 비밀번호 입력필드 찾음`);
    await passwordInput.fill(PASSWORD);
    await page.waitForTimeout(300);
    console.log(`  ✓ 비밀번호 입력 완료\n`);
  } else {
    console.log(`  ✗ 비밀번호 입력필드를 찾을 수 없음\n`);
  }

  // 4. 로그인 제출
  console.log('4️⃣ 로그인 실행 중...');
  
  const submitSelectors = [
    'button[type="submit"]',
    'input[type="submit"]',
    'button:has-text("로그인")',
    'button:contains("로그인")'
  ];

  let submitted = false;
  for (const selector of submitSelectors) {
    const btn = await page.$(selector).catch(() => null);
    if (btn) {
      console.log(`  📍 제출 버튼: ${selector}`);
      await btn.click();
      submitted = true;
      break;
    }
  }

  if (submitted) {
    // 로그인 완료 대기
    try {
      await page.waitForNavigation({ timeout: 10000 }).catch(() => {});
    } catch (e) {}
    await page.waitForTimeout(3000);
    console.log(`  ✓ 로그인 실행됨\n`);
  } else {
    console.log(`  ⚠️ 제출 버튼을 찾을 수 없음\n`);
  }

  // 5. 로그인 성공 검증
  console.log('5️⃣ 로그인 성공 검증 중...');

  const loginStatus = await page.evaluate(() => {
    const currentUrl = window.location.href;
    const pageContent = document.body.innerText || '';
    
    // 로그아웃 버튼 또는 사용자 프로필 확인
    const hasLogoutElements = pageContent.includes('로그아웃');
    const hasProfileElements = pageContent.includes('마이페이지') || pageContent.includes('내 정보');
    
    // 로그인 폼 확인
    const hasLoginForm = !!document.querySelector('input[type="password"]');

    return {
      currentUrl,
      hasLogoutElements,
      hasProfileElements,
      hasLoginForm,
      isLoginPage: currentUrl.includes('login'),
      isLoggedIn: !hasLoginForm && (hasLogoutElements || !currentUrl.includes('login')),
      contentLength: pageContent.length
    };
  });

  console.log(`  현재 URL: ${loginStatus.currentUrl.substring(0, 80)}`);
  console.log(`  로그아웃 텍스트: ${loginStatus.hasLogoutElements ? '✓' : '✗'}`);
  console.log(`  프로필 텍스트: ${loginStatus.hasProfileElements ? '✓' : '✗'}`);
  console.log(`  로그인 폼 남음: ${loginStatus.hasLoginForm ? '✓ (실패)' : '✗'}`);
  console.log(`  로그인 성공: ${loginStatus.isLoggedIn ? '✅ YES' : '❌ NO'}\n`);

  // 6. 쿠키 정보 수집
  console.log('6️⃣ 세션 정보 수집 중...');

  const cookies = await page.context().cookies();
  
  const storageData = await page.evaluate(() => {
    return {
      localStorage: Object.keys(localStorage),
      sessionStorage: Object.keys(sessionStorage)
    };
  });

  console.log(`  쿠키: ${cookies.length}개`);
  console.log(`  localStorage 키: ${storageData.localStorage.length}개`);
  console.log(`  sessionStorage 키: ${storageData.sessionStorage.length}개\n`);

  // 중요 쿠키 확인
  const importantCookies = cookies.filter(c => 
    c.name.toLowerCase().includes('session') || 
    c.name.toLowerCase().includes('auth') || 
    c.name.toLowerCase().includes('token') ||
    c.name.toLowerCase().includes('user')
  );

  if (importantCookies.length > 0) {
    console.log(`  중요 쿠키:`);
    importantCookies.forEach(c => {
      console.log(`    - ${c.name}: ${c.value.substring(0, 50)}...`);
    });
  }

  // 7. 세션 저장
  const sessionData = {
    timestamp: new Date().toISOString(),
    loginStatus,
    cookieCount: cookies.length,
    localStorageKeyCount: storageData.localStorage.length,
    sessionStorageKeyCount: storageData.sessionStorage.length,
    cookies: cookies.slice(0, 30)
  };

  fs.writeFileSync(
    path.join(__dirname, 'login-session-data.json'),
    JSON.stringify(sessionData, null, 2),
    'utf-8'
  );

  console.log('\n7️⃣ 로그인된 상태로 상세 페이지 접근 중...');

  if (loginStatus.isLoggedIn) {
    const detailUrl = 'https://www.xn--3e0b036btifksj.com/40/?mode=view&id=p20230501948641a7bc92f';
    await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const detailInfo = await page.evaluate(() => {
      const content = document.body.innerText || '';
      const has12Items = content.includes('매물업종') && content.includes('매물위치');
      const hasLoginMsg = content.includes('로그인이 필요');
      const images = Array.from(document.querySelectorAll('img')).filter(img => 
        img.src && img.src.includes('cdn.imweb.me')
      ).length;

      return {
        contentLength: content.length,
        has12Items,
        hasLoginMsg,
        imageCount: images,
        contentPreview: content.substring(0, 200)
      };
    });

    console.log(`  ✓ 상세 페이지 로드됨`);
    console.log(`  본문 길이: ${detailInfo.contentLength}자`);
    console.log(`  12항목 데이터: ${detailInfo.has12Items ? '✓' : '✗'}`);
    console.log(`  로그인 필요 메시지: ${detailInfo.hasLoginMsg ? '✓ (여전히 필요)' : '✗ (제거됨)'}`);
    console.log(`  이미지: ${detailInfo.imageCount}개\n`);
  }

  // 8. Playwright 인증 상태 저장
  console.log('8️⃣ Playwright 인증 상태 저장 중...');
  const storageState = await page.context().storageState();
  fs.writeFileSync(
    path.join(__dirname, 'playwright-auth.json'),
    JSON.stringify(storageState, null, 2),
    'utf-8'
  );
  console.log('  ✓ playwright-auth.json 저장됨\n');

  console.log('='.repeat(80));
  console.log('📝 상태: 로그인 세션 생성 완료');
  console.log('🎯 다음: 다른 스크립트에서 이 세션 재사용 가능');
  console.log('⏸️ 브라우저를 닫으려면 Enter를 누르세요...\n');

  // 대기
  await new Promise(resolve => setTimeout(resolve, 3000));
  await browser.close();
}

setupLoginSession().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
