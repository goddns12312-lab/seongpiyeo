#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// .env.local 로드
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) process.env[key.trim()] = value.trim();
  });
}

const CRAWL_LOGIN_URL = process.env.CRAWL_LOGIN_URL || 'https://www.xn--3e0b036btifksj.com/';

async function main() {
  const browser = await chromium.launch({ headless: false });

  try {
    console.log('\n🔐 로그인 세션 캡처\n');
    console.log('📍 대상 사이트:');
    console.log(`   ${CRAWL_LOGIN_URL}\n`);
    console.log('📋 진행 방법:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. 브라우저 창이 열립니다');
    console.log('2. 로그인하세요');
    console.log('3. 로그인 완료 후 이 창으로 돌아와 Enter를 누르세요');
    console.log('4. 세션이 저장됩니다');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    // 로그인 페이지 이동
    console.log('📄 로그인 페이지 로드 중...');
    await page.goto(CRAWL_LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });

    console.log('✅ 브라우저 창이 열렸습니다.\n');
    console.log('⏳ 로그인을 진행하세요...');
    console.log('   (2FA, 캡차 등 모든 인증을 완료하세요)\n');
    console.log('완료 후 여기서 Enter를 누르세요 → ');

    // 사용자 입력 대기
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

    console.log('\n');
    console.log('📌 세션 저장 중...');

    // storage_state 캡처
    const authPath = path.join(process.cwd(), 'auth_state.json');
    const storageState = await context.storageState();
    fs.writeFileSync(authPath, JSON.stringify(storageState, null, 2));

    console.log(`✅ 저장 완료: ${authPath}\n`);
    console.log('다음 단계:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. node scripts/test-auth.js → 세션 테스트');
    console.log('2. node scripts/crawl-detail-page.js → 크롤링 시작');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await page.close();
    await context.close();

  } catch (error) {
    console.error('\n❌ 오류:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
