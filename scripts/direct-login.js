const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const EMAIL = 'ap05020@nate.com';
const PASSWORD = 'whdgus0603';

async function directLogin() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🔐 직접 로그인 시도\n');

  // 다양한 로그인 경로 시도
  const loginUrls = [
    'https://www.xn--3e0b036btifksj.com/member/login',
    'https://www.xn--3e0b036btifksj.com/login',
    'https://www.xn--3e0b036btifksj.com/shop/login.cm',
    'https://www.xn--3e0b036btifksj.com/member',
  ];

  let loginPageFound = false;

  for (const url of loginUrls) {
    console.log(`시도: ${url}`);
    try {
      const response = await page.goto(url, { 
        waitUntil: 'domcontentloaded', 
        timeout: 15000 
      });

      if (response && response.status() === 200) {
        const hasLoginForm = await page.$('input[type="password"], input[type="email"]').catch(() => null);
        
        if (hasLoginForm) {
          console.log(`✓ 로그인 폼 찾음!\n`);
          loginPageFound = true;
          break;
        }
      }
    } catch (e) {
      console.log(`  (실패)\n`);
    }
  }

  if (!loginPageFound) {
    console.log('\n❌ 로그인 페이지를 찾을 수 없습니다');
    console.log('📸 현재 페이지 스크린샷...\n');

    await page.goto('https://www.xn--3e0b036btifksj.com', { waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: 'c:/Users/B/Desktop/aass/scripts/current-page.png' });
    
    console.log('현재 페이지 소스 저장...');
    const html = await page.content();
    fs.writeFileSync('c:/Users/B/Desktop/aass/scripts/current-page.html', html);

    console.log('\n💡 수동으로 로그인하려면:');
    console.log(`이메일: ${EMAIL}`);
    console.log(`비밀번호: ${PASSWORD}\n`);

    console.log('브라우저가 열려있습니다. 수동으로 로그인하세요.');
    console.log('로그인 후 Enter를 누르세요...\n');

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('> ', async (answer) => {
      rl.close();

      // 로그인 후 상태 확인
      const isLoggedIn = await page.evaluate(() => {
        const content = document.body.innerText || '';
        return content.includes('로그아웃') || content.includes('마이페이지');
      });

      if (isLoggedIn) {
        console.log('✅ 로그인 성공!');

        // 쿠키 저장
        const storageState = await page.context().storageState();
        fs.writeFileSync(
          path.join(__dirname, 'playwright-auth.json'),
          JSON.stringify(storageState, null, 2)
        );
        console.log('✓ playwright-auth.json 저장됨');
      } else {
        console.log('❌ 로그인 실패');
      }

      await browser.close();
      process.exit(0);
    });
    return;
  }

  // 자동 로그인
  console.log('1️⃣ 자격증명 입력 중...');

  // 이메일 입력
  const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="이메일"]');
  if (emailInput) {
    await emailInput.fill(EMAIL);
    console.log('  ✓ 이메일 입력');
  }

  // 비밀번호 입력
  const passwordInput = await page.$('input[type="password"]');
  if (passwordInput) {
    await passwordInput.fill(PASSWORD);
    console.log('  ✓ 비밀번호 입력');
  }

  // 제출
  console.log('\n2️⃣ 로그인 제출 중...');
  const submitBtn = await page.$('button[type="submit"], input[type="submit"]');
  if (submitBtn) {
    await submitBtn.click();
    console.log('  ✓ 제출됨');

    try {
      await page.waitForNavigation({ timeout: 10000 }).catch(() => {});
    } catch (e) {}
    await page.waitForTimeout(2000);
  }

  // 상태 확인
  console.log('\n3️⃣ 로그인 검증');
  const isLoggedIn = await page.evaluate(() => {
    const content = document.body.innerText || '';
    const url = window.location.href;
    return {
      content,
      hasLogout: content.includes('로그아웃'),
      hasMypage: content.includes('마이페이지'),
      url
    };
  });

  console.log(`  URL: ${isLoggedIn.url}`);
  console.log(`  로그아웃 버튼: ${isLoggedIn.hasLogout ? '✓' : '✗'}`);
  console.log(`  로그인 성공: ${isLoggedIn.hasLogout || isLoggedIn.hasMypage ? '✅ YES' : '❌ NO'}\n`);

  // 쿠키 저장
  if (isLoggedIn.hasLogout || isLoggedIn.hasMypage) {
    console.log('4️⃣ 세션 저장');
    const storageState = await page.context().storageState();
    fs.writeFileSync(
      path.join(__dirname, 'playwright-auth.json'),
      JSON.stringify(storageState, null, 2)
    );
    console.log('  ✓ playwright-auth.json 저장됨\n');

    console.log('✅ 로그인 완료!\n');
  }

  await new Promise(resolve => setTimeout(resolve, 2000));
  await browser.close();
}

directLogin().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
