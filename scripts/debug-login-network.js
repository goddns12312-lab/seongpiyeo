const { chromium } = require('playwright');
const fs = require('fs');

async function debugLoginNetwork() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('🔍 로그인 요청 디버깅\n');

  // 네트워크 요청 추적
  const networkData = [];

  page.on('request', request => {
    const url = request.url();
    if (url.includes('login') || url.includes('member') || url.includes('auth')) {
      networkData.push({
        type: 'request',
        url,
        method: request.method(),
        postData: request.postData(),
        headers: Object.fromEntries(
          Object.entries(request.headers()).filter(([k]) =>
            ['content-type', 'referer', 'origin'].includes(k.toLowerCase())
          )
        )
      });
    }
  });

  page.on('response', response => {
    const url = response.url();
    if (url.includes('login') || url.includes('member') || url.includes('auth')) {
      networkData.push({
        type: 'response',
        url,
        status: response.status(),
        contentType: response.headers()['content-type'] || ''
      });
    }
  });

  // 로그인 페이지 접속
  console.log('1️⃣ 로그인 페이지 분석\n');
  await page.goto('https://www.xn--3e0b036btifksj.com/login', { waitUntil: 'networkidle' });

  // 폼 데이터 분석
  const formData = await page.evaluate(() => {
    const form = document.querySelector('form');
    if (!form) return null;

    return {
      formId: form.id,
      formName: form.name,
      formAction: form.action,
      formMethod: form.method,
      inputs: Array.from(form.querySelectorAll('input, select, textarea')).map(inp => ({
        type: inp.type,
        name: inp.name,
        id: inp.id,
        value: inp.value,
        placeholder: inp.placeholder,
        required: inp.required,
        className: inp.className
      })),
      buttons: Array.from(form.querySelectorAll('button, input[type="submit"]')).map(btn => ({
        type: btn.type,
        name: btn.name,
        text: btn.textContent?.trim() || btn.value,
        className: btn.className
      }))
    };
  });

  console.log('📋 폼 데이터:');
  if (formData) {
    console.log(`  Action: ${formData.formAction}`);
    console.log(`  Method: ${formData.formMethod}`);
    console.log('\n  입력필드:');
    formData.inputs.forEach(inp => {
      console.log(`    [${inp.type}] ${inp.name || inp.id || '이름없음'}`);
      console.log(`      플레이스홀더: ${inp.placeholder || '없음'}`);
      console.log(`      값: ${inp.value || '비어있음'}`);
      if (inp.type === 'hidden') {
        console.log(`      (CSRF/토큰 입력필드) ✓`);
      }
    });
    console.log('\n  버튼:');
    formData.buttons.forEach(btn => {
      console.log(`    [${btn.type}] ${btn.text}`);
    });
  } else {
    console.log('  폼을 찾을 수 없음');
  }

  // 로그인 전 storage 상태
  console.log('\n2️⃣ 로그인 전 Storage 상태');
  const storageBefore = await page.evaluate(() => {
    return {
      cookies: document.cookie,
      localStorageKeys: Object.keys(localStorage),
      sessionStorageKeys: Object.keys(sessionStorage)
    };
  });

  console.log(`  쿠키: ${storageBefore.cookies.split(';').length}개`);
  console.log(`  localStorage 키: ${storageBefore.localStorageKeys.length}개`);
  console.log(`  sessionStorage 키: ${storageBefore.sessionStorageKeys.length}개`);

  // 로그인 시도
  console.log('\n3️⃣ 로그인 시도');
  const emailInput = await page.$('input[type="email"], input[name="email"]');
  const passwordInput = await page.$('input[type="password"]');

  if (emailInput && passwordInput) {
    await emailInput.fill('ap05020@nate.com');
    await passwordInput.fill('whdgus0603');
    console.log('  ✓ 자격증명 입력 완료');

    // 제출 버튼 정보
    const submitBtn = await page.$('button[type="submit"], input[type="submit"]');
    if (submitBtn) {
      const btnInfo = await submitBtn.evaluate(el => ({
        tagName: el.tagName,
        type: el.type,
        name: el.name,
        value: el.value,
        text: el.textContent?.trim() || el.value,
        onclick: el.getAttribute('onclick'),
        className: el.className
      }));
      console.log(`  제출 버튼: <${btnInfo.tagName}> "${btnInfo.text}"`);

      if (btnInfo.onclick) {
        console.log(`  onclick: ${btnInfo.onclick.substring(0, 100)}`);
      }

      // 버튼 클릭
      await submitBtn.click();
      console.log('  ✓ 버튼 클릭됨');
    }

    // 네트워크 요청 완료 대기
    await page.waitForTimeout(3000);
  }

  // 로그인 후 상태
  console.log('\n4️⃣ 로그인 후 상태');
  const currentUrl = page.url();
  const pageContent = await page.evaluate(() => ({
    url: window.location.href,
    title: document.title,
    hasLogoutButton: !!Array.from(document.querySelectorAll('*')).find(el =>
      el.textContent?.includes('로그아웃')
    ),
    hasErrorMessage: !!Array.from(document.querySelectorAll('*')).find(el =>
      el.textContent?.includes('실패') || el.textContent?.includes('오류') || el.textContent?.includes('로그인하지 못')
    ),
    errorText: Array.from(document.querySelectorAll('[class*="error"], [class*="alert"], .message')).map(el =>
      el.textContent?.trim()
    ).filter(t => t && t.length < 200)
  }));

  console.log(`  URL: ${pageContent.url}`);
  console.log(`  제목: ${pageContent.title}`);
  console.log(`  로그아웃 버튼: ${pageContent.hasLogoutButton ? '✓' : '✗'}`);
  console.log(`  에러 메시지: ${pageContent.hasErrorMessage ? '✓' : '✗'}`);

  if (pageContent.errorText.length > 0) {
    console.log('\n  에러 텍스트:');
    pageContent.errorText.forEach(txt => {
      console.log(`    - "${txt}"`);
    });
  }

  // 로그인 후 storage 상태
  console.log('\n5️⃣ 로그인 후 Storage 변화');
  const storageAfter = await page.evaluate(() => {
    return {
      cookies: document.cookie,
      localStorageKeys: Object.keys(localStorage),
      sessionStorageKeys: Object.keys(sessionStorage)
    };
  });

  const cookies = await page.context().cookies();
  const sessionCookies = cookies.filter(c =>
    c.name.toLowerCase().includes('session') ||
    c.name.toLowerCase().includes('sid') ||
    c.name.toLowerCase().includes('auth') ||
    c.name.toLowerCase().includes('token')
  );

  console.log(`  총 쿠키: ${cookies.length}개`);
  if (sessionCookies.length > 0) {
    console.log(`  세션 관련 쿠키: ${sessionCookies.length}개`);
    sessionCookies.forEach(c => {
      console.log(`    - ${c.name}: ${c.value.substring(0, 50)}...`);
    });
  } else {
    console.log(`  세션 관련 쿠키: 없음`);
  }

  console.log(`  localStorage 변화: ${storageBefore.localStorageKeys.length} -> ${storageAfter.localStorageKeys.length}`);
  console.log(`  sessionStorage 변화: ${storageBefore.sessionStorageKeys.length} -> ${storageAfter.sessionStorageKeys.length}`);

  // 네트워크 요청 기록
  console.log('\n6️⃣ 네트워크 요청 기록');
  const loginRequests = networkData.filter(d => d.type === 'request' && d.method === 'POST');

  if (loginRequests.length > 0) {
    console.log(`  POST 요청: ${loginRequests.length}개`);
    loginRequests.forEach((req, i) => {
      console.log(`\n  ${i + 1}. ${req.url}`);
      console.log(`     Method: ${req.method}`);
      if (req.postData) {
        console.log(`     데이터: ${req.postData.substring(0, 200)}`);
      }
    });
  } else {
    console.log(`  POST 요청: 없음 (아마도 JavaScript로 처리)`);
  }

  // 파일 저장
  fs.writeFileSync(
    'c:/Users/B/Desktop/aass/scripts/login-debug.json',
    JSON.stringify({
      formData,
      networkData: networkData.slice(0, 20),
      loginRequests,
      pageContent,
      cookies: cookies.slice(0, 20)
    }, null, 2)
  );

  console.log('\n✅ login-debug.json 저장됨');

  await browser.close();
}

debugLoginNetwork().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
