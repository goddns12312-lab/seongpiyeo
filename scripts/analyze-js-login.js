const { chromium } = require('playwright');
const fs = require('fs');

async function analyzeJsLogin() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('🔍 JavaScript 기반 로그인 분석\n');

  await page.goto('https://www.xn--3e0b036btifksj.com/login', { waitUntil: 'networkidle' });

  // 페이지의 모든 script 태그 분석
  const scripts = await page.evaluate(() => {
    const scriptElements = Array.from(document.querySelectorAll('script'));
    return {
      totalScripts: scriptElements.length,
      hasInlineScripts: scriptElements.some(s => !s.src),
      externalScripts: scriptElements.filter(s => s.src).map(s => ({
        src: s.src,
        async: s.async,
        defer: s.defer
      })).slice(0, 10)
    };
  });

  console.log('📜 Script 분석:');
  console.log(`   총 스크립트: ${scripts.totalScripts}개`);
  console.log(`   인라인 스크립트: ${scripts.hasInlineScripts ? '✓' : '✗'}`);

  // 로그인 관련 함수 찾기
  const globalObjects = await page.evaluate(() => {
    const obj = {
      hasLoginFunction: typeof login !== 'undefined',
      hasLoginModule: typeof LOGIN !== 'undefined',
      hasSiteMember: typeof SITE_MEMBER !== 'undefined',
      hasAjax: typeof jQuery !== 'undefined' && typeof jQuery.ajax !== 'undefined',
      hasFetch: typeof fetch !== 'undefined',
      globalKeys: []
    };

    // window의 주요 객체 찾기
    const loginRelated = Object.keys(window).filter(key =>
      key.toLowerCase().includes('login') ||
      key.toLowerCase().includes('auth') ||
      key.toLowerCase().includes('member')
    );

    obj.globalKeys = loginRelated;
    return obj;
  });

  console.log('\n🔧 전역 객체:');
  console.log(`   login 함수: ${globalObjects.hasLoginFunction ? '✓' : '✗'}`);
  console.log(`   LOGIN 객체: ${globalObjects.hasLoginModule ? '✓' : '✗'}`);
  console.log(`   SITE_MEMBER: ${globalObjects.hasSiteMember ? '✓' : '✗'}`);
  console.log(`   jQuery.ajax: ${globalObjects.hasAjax ? '✓' : '✗'}`);
  console.log(`   fetch: ${globalObjects.hasFetch ? '✓' : '✗'}`);

  if (globalObjects.globalKeys.length > 0) {
    console.log(`\n   로그인 관련 전역 변수:`);
    globalObjects.globalKeys.forEach(key => {
      console.log(`     - ${key}`);
    });
  }

  // iframe 확인
  const iframes = await page.$$('iframe');
  console.log(`\n🖼️  iframe: ${iframes.length}개`);

  const iframeDetails = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('iframe')).map(i => ({
      src: i.src,
      id: i.id,
      class: i.className,
      title: i.title
    }));
  });

  iframeDetails.forEach(ifr => {
    console.log(`   src: ${ifr.src || '없음'}`);
    console.log(`   id: ${ifr.id || '없음'}`);
  });

  // HTML 구조 저장
  const html = await page.content();
  fs.writeFileSync('c:/Users/B/Desktop/aass/scripts/login-page-structure.html', html);

  console.log('\n✅ login-page-structure.html 저장됨 (전체 HTML 검사용)\n');

  // 수동 로그인 시 네트워크 모니터링
  console.log('💡 다음 단계:');
  console.log('   1. login-page-structure.html을 브라우저에서 열어서 구조를 확인하세요');
  console.log('   2. 또는 다음 명령어로 수동 로그인 모드를 실행하세요:');
  console.log('   \n   node manual-login-capture.js\n');

  await browser.close();
}

analyzeJsLogin().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
