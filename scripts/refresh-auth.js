#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function main() {
  const browser = await chromium.launch({ headless: false }); // 헤드풀 모드로 사용자가 로그인 가능

  try {
    console.log('🔐 웹사이트 인증 세션 갱신\n');

    const authPath = path.join(__dirname, 'playwright-auth.json');

    // 기존 세션 로드 시도
    let storageState = null;
    if (fs.existsSync(authPath)) {
      try {
        storageState = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
        console.log('✅ 기존 세션 로드됨');
      } catch (e) {
        console.log('⚠️  기존 세션 파싱 실패, 새로 생성합니다');
      }
    }

    const context = storageState
      ? await browser.newContext({ storageState })
      : await browser.newContext();

    const page = await context.newPage();

    // 메인 페이지 접속
    console.log('\n📄 피씨천국 접속 중...');
    await page.goto('https://www.xn--3e0b036btifksj.com/40/', { waitUntil: 'domcontentloaded', timeout: 15000 });

    console.log('현재 URL:', page.url());

    // 로그인 상태 확인
    const isLoggedIn = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      // 페이지에서 "로그아웃" 텍스트가 있으면 로그인된 상태
      return bodyText.includes('로그아웃') && !bodyText.includes('로그인상태유지');
    });

    if (isLoggedIn) {
      console.log('✅ 이미 로그인된 상태입니다\n');
    } else {
      console.log('⚠️  로그인 필요합니다');
      console.log('    브라우저에서 수동으로 로그인하신 후');
      console.log('    Enter 키를 누르세요...\n');

      // 사용자가 로그인할 때까지 대기
      await new Promise(resolve => {
        process.stdin.once('data', resolve);
      });

      console.log('로그인 완료됨\n');
    }

    // 세션 상태 저장
    console.log('💾 세션 저장 중...');
    const newStorageState = await context.storageState();
    fs.writeFileSync(authPath, JSON.stringify(newStorageState, null, 2));
    console.log(`✅ 저장됨: ${authPath}\n`);

    // 인증 확인
    console.log('🔍 인증 확인 중...');
    await page.goto('https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=1', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    // 게시글 접근 시도
    await page.click('li.tit a.title_link');
    await page.waitForTimeout(2000);

    const modalText = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]');
      return modal?.innerText?.substring(0, 100) || 'modal not found';
    });

    if (modalText.includes('로그인')) {
      console.log('❌ 여전히 로그인 필요 (세션 만료됨)');
      console.log('\n💡 해결 방법:');
      console.log('1. 브라우저 개발자 도구에서 Application > Cookies 확인');
      console.log('2. 세션 쿠키가 유효한지 확인');
      console.log('3. 수동으로 다시 로그인 후 playwright-auth.json 갱신');
    } else {
      console.log('✅ 인증 성공! 이제 크롤링할 수 있습니다');
    }

    await page.close();
    await context.close();

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
