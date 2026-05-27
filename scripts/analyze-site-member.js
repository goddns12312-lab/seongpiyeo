const { chromium } = require('playwright');
const fs = require('fs');

async function analyzeSiteMember() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const boardUrl = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=8';
  
  console.log('🔍 목록 페이지에서 SITE_MEMBER 함수 분석 중...\n');
  await page.goto(boardUrl, { waitUntil: 'networkidle', timeout: 30000 });

  const siteMemberInfo = await page.evaluate(() => {
    // SITE_MEMBER 객체 확인
    const hasSiteMember = typeof SITE_MEMBER !== 'undefined';
    const openLoginType = typeof SITE_MEMBER?.openLogin;
    
    // openLogin 함수의 소스코드 추출
    const openLoginSource = SITE_MEMBER?.openLogin?.toString() || 'NOT FOUND';
    
    // 전역 객체에서 로그인/세션 관련 정보
    const userInfo = window.USER_INFO || window.user || window.userData || null;
    const sessionInfo = window.SESSION || window.session || null;
    const tokenInfo = window.TOKEN || window.token || null;
    
    // 쿠키 목록
    const cookies = document.cookie ? document.cookie.split(';').map(c => c.trim()) : [];
    
    // localStorage 확인
    const localStorageKeys = Object.keys(localStorage);
    const localStorageData = {};
    localStorageKeys.forEach(key => {
      try {
        localStorageData[key] = localStorage.getItem(key);
      } catch (e) {}
    });

    return {
      hasSiteMember,
      openLoginType,
      openLoginSource: openLoginSource.substring(0, 500),
      userInfo,
      sessionInfo,
      tokenInfo,
      cookies,
      localStorageKeys,
      localStorageData
    };
  });

  console.log('📋 SITE_MEMBER 분석 결과:\n');
  console.log(`SITE_MEMBER 존재: ${siteMemberInfo.hasSiteMember}`);
  console.log(`openLogin 타입: ${siteMemberInfo.openLoginType}\n`);
  
  console.log('📜 openLogin 함수 소스 (처음 500자):\n');
  console.log(siteMemberInfo.openLoginSource);
  console.log('\n');

  console.log('🔐 전역 변수 확인:');
  console.log(`USER_INFO: ${siteMemberInfo.userInfo ? '있음' : '없음'}`);
  console.log(`SESSION: ${siteMemberInfo.sessionInfo ? '있음' : '없음'}`);
  console.log(`TOKEN: ${siteMemberInfo.tokenInfo ? '있음' : '없음'}`);
  
  console.log('\n🍪 쿠키 목록:');
  siteMemberInfo.cookies.forEach(c => console.log(`  ${c}`));
  
  console.log('\n💾 localStorage 키:');
  siteMemberInfo.localStorageKeys.forEach(k => console.log(`  ${k}`));

  // 결과 저장
  fs.writeFileSync(
    'c:/Users/B/Desktop/aass/scripts/site-member-analysis.json',
    JSON.stringify(siteMemberInfo, null, 2),
    'utf-8'
  );

  console.log('\n✅ site-member-analysis.json 저장됨');

  await browser.close();
}

analyzeSiteMember().catch(err => {
  console.error('오류:', err.message);
  process.exit(1);
});
