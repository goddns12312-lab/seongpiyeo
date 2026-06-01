#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔐 웹사이트에 로그인해주세요...');
  console.log('목표 사이트: https://www.xn--3e0b036btifksj.com');

  await page.goto('https://www.xn--3e0b036btifksj.com', { waitUntil: 'networkidle' });

  console.log('✅ 로그인 완료하면 브라우저를 닫아주세요...\n');

  // 사용자가 닫을 때까지 대기
  await context.waitForEvent('close');

  // 세션 저장
  const storageState = await context.storageState();
  const outputPath = path.join(__dirname, 'auth_state.json');

  fs.writeFileSync(outputPath, JSON.stringify(storageState, null, 2));
  console.log(`✅ 인증 세션 저장됨: ${outputPath}`);

  await browser.close();
  process.exit(0);
})();
