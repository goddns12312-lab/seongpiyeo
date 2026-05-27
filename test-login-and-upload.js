#!/usr/bin/env node

/**
 * 실제 로그인 → 쿠키 확인 → 이미지 업로드 통합 테스트
 */

const { chromium } = require('playwright');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const BASE_URL = 'http://localhost:3002';

console.log('[실제 플로우 테스트] ╔════════════════════════════════════════╗');
console.log('[실제 플로우 테스트] ║   실제 로그인 → 쿠키 → 업로드 테스트   ║');
console.log('[실제 플로우 테스트] ╚════════════════════════════════════════╝\n');

// 테스트용 계정
const TEST_USERNAME = 'testuser123';
const TEST_PASSWORD = 'TestPassword123!';

async function runTest() {
  let browser;

  try {
    console.log('[1단계] 브라우저 시작...\n');
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // 콘솔 로그 캡처
    const consoleLogs = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[Login]') || text.includes('[Auth]') || text.includes('[API]') || text.includes('[jobs/new]')) {
        consoleLogs.push(text);
        console.log('[콘솔]', text);
      }
    });

    // 1단계: 로그인 페이지로 이동
    console.log('[2단계] 로그인 페이지로 이동...\n');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 10000 });
    console.log('✓ 로그인 페이지 로드\n');

    // 2단계: 로그인 (기존 계정 사용)
    console.log('[3단계] 로그인 시도...\n');
    console.log('  아이디:', TEST_USERNAME);

    // 로그인 폼 채우기
    const idInput = await page.locator('input[placeholder*="아이디"]').first();
    const pwInput = await page.locator('input[type="password"]').first();

    if (await idInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await idInput.fill(TEST_USERNAME);
      await pwInput.fill(TEST_PASSWORD);
      console.log('✓ 로그인 정보 입력\n');

      // 로그인 버튼 클릭
      const loginBtn = await page.locator('button:has-text("로그인")').first();
      await loginBtn.click();

      console.log('✓ 로그인 버튼 클릭\n');

      // 메인 페이지로 리다이렉트 대기
      try {
        await page.waitForURL(/\/$/, { timeout: 5000 });
        console.log('✓ 로그인 성공 - 메인 페이지로 이동\n');
      } catch {
        console.log('⚠️  페이지 리다이렉트 미감지\n');
      }
    } else {
      console.log('⚠️  로그인 폼을 찾을 수 없음. 기존 세션 사용...\n');
    }

    // 3단계: /api/debug-auth로 쿠키 확인
    console.log('[4단계] 쿠키 상태 확인 (/api/debug-auth)...\n');

    const debugResponse = await page.goto(`${BASE_URL}/api/debug-auth`, {
      waitUntil: 'networkidle',
      timeout: 5000,
    });

    if (debugResponse.ok()) {
      const debugData = await page.evaluate(() => {
        try {
          return JSON.parse(document.body.textContent);
        } catch {
          return null;
        }
      });

      if (debugData) {
        console.log('✓ Debug API 응답:');
        console.log('  쿠키 개수:', Object.keys(debugData.cookies).length);
        console.log('  pc_bang_session 존재:', debugData.pcBangSession.exists);
        console.log('  현재 쿠키:', Object.keys(debugData.cookies).join(', ') || '(없음)');

        if (!debugData.pcBangSession.exists) {
          console.log('\n❌ pc_bang_session 쿠키가 없습니다!\n');
        } else {
          console.log('\n✓ pc_bang_session 쿠키가 있습니다!\n');
        }
      }
    }

    // 4단계: 브라우저 쿠키 직접 확인
    console.log('[5단계] 브라우저 쿠키 직접 확인...\n');

    const browserCookies = await page.context().cookies();
    console.log('✓ 브라우저 쿠키 목록:');
    browserCookies.forEach((cookie) => {
      console.log(`  - ${cookie.name}: ${cookie.value.substring(0, 50)}...`);
    });

    const pcBangCookie = browserCookies.find((c) => c.name === 'pc_bang_session');
    if (pcBangCookie) {
      console.log('\n✓✓ pc_bang_session 쿠키 확인됨!\n');
    } else {
      console.log('\n❌ pc_bang_session 쿠키가 없습니다!\n');
    }

    // 5단계: /jobs/new로 이동 (쿠키 복구 시도)
    console.log('[6단계] /jobs/new로 이동 (쿠키 복구)...\n');

    await page.goto(`${BASE_URL}/jobs/new`, { waitUntil: 'networkidle', timeout: 10000 });
    console.log('✓ /jobs/new 페이지 로드\n');

    // 쿠키 복구 후 다시 확인
    console.log('[7단계] 쿠키 복구 후 재확인...\n');

    const cookiesAfter = await page.context().cookies();
    const pcBangAfter = cookiesAfter.find((c) => c.name === 'pc_bang_session');

    if (pcBangAfter) {
      console.log('✓ pc_bang_session 쿠키 발견!');
      try {
        const session = JSON.parse(decodeURIComponent(pcBangAfter.value));
        console.log('  사용자 ID:', session.id);
        console.log('  Username:', session.username);
        console.log('  Nickname:', session.nickname);
      } catch {
        console.log('  (파싱 실패)');
      }
    } else {
      console.log('⚠️  여전히 pc_bang_session 쿠키가 없습니다');
    }

    // 최종 결과
    console.log('\n[실제 플로우 테스트] ╔════════════════════════════════════════╗');
    console.log('[실제 플로우 테스트] ║         테스트 결과 요약            ║');
    console.log('[실제 플로우 테스트] ╚════════════════════════════════════════╝\n');

    if (pcBangAfter) {
      console.log('✅ pc_bang_session 쿠키가 있습니다!');
      console.log('   이제 이미지 업로드를 시도할 수 있습니다.\n');
    } else {
      console.log('❌ pc_bang_session 쿠키가 없습니다.');
      console.log('   로그인 또는 쿠키 복구 로직 확인이 필요합니다.\n');
    }
  } catch (err) {
    console.error('\n❌ 테스트 실패:', err.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

runTest();
