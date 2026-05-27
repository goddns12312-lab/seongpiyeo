#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function main() {
  const browser = await chromium.launch({ headless: false });

  try {
    console.log('\n🔐 피씨천국 로그인 세션 생성\n');
    console.log('📖 진행 방법:');
    console.log('1. 브라우저 창이 열립니다');
    console.log('2. 피씨천국에 로그인하세요');
    console.log('3. 로그인 완료 후 Enter 키를 누르세요\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    // 웹사이트 접속
    console.log('📄 피씨천국 로드 중...\n');
    await page.goto('https://www.xn--3e0b036btifksj.com/', { waitUntil: 'domcontentloaded', timeout: 15000 });

    console.log('✅ 브라우저가 열렸습니다. 로그인하세요.');
    console.log('   로그인 완료 후 이 창으로 돌아와 Enter를 누르세요\n');

    // Enter 키 대기
    await new Promise(resolve => {
      process.stdin.once('data', () => {
        console.log('\n✅ Enter 감지됨\n');
        resolve();
      });
    });

    // 로그인 상태 확인
    console.log('🔍 로그인 상태 확인 중...');
    await page.waitForTimeout(2000);

    const pageContent = await page.content();
    const isLoggedIn = pageContent.includes('로그아웃') && !pageContent.includes('로그인상태유지');

    if (isLoggedIn) {
      console.log('✅ 로그인 성공!\n');
    } else {
      console.log('⚠️  로그인 상태 불명확\n');
    }

    // 세션 저장
    console.log('💾 세션 저장 중...');
    const authPath = path.join(__dirname, 'playwright-auth.json');
    const storageState = await context.storageState();
    fs.writeFileSync(authPath, JSON.stringify(storageState, null, 2));
    console.log(`✅ 저장 완료: ${authPath}\n`);

    // 세션 테스트
    console.log('🧪 세션 테스트 중...');
    await page.goto('https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=1', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    await page.click('li.tit a.title_link');
    await page.waitForTimeout(3000);

    const modalContent = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return '';
      return modal.innerText.substring(0, 100);
    });

    if (modalContent.includes('로그인')) {
      console.log('❌ 여전히 로그인 필요 (세션 미작동)\n');
    } else if (modalContent.length > 20) {
      console.log('✅ 세션 작동 확인! 크롤링 가능합니다\n');
    } else {
      console.log('⚠️  모달 상태 불명확\n');
    }

    await page.close();
    await context.close();

    console.log('🎉 완료! 이제 크롤링을 시작할 수 있습니다\n');

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
