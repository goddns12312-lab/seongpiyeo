#!/usr/bin/env node

/**
 * 실제 Supabase 사용자로 로그인 테스트
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { chromium } = require('playwright');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const BASE_URL = 'http://localhost:3002';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('[실제 로그인 테스트] ╔════════════════════════════════════════╗');
console.log('[실제 로그인 테스트] ║  Supabase 실제 사용자로 로그인 테스트  ║');
console.log('[실제 로그인 테스트] ╚════════════════════════════════════════╝\n');

async function runTest() {
  let browser;

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 1단계: 테스트 사용자 생성
    console.log('[1단계] Supabase에 테스트 사용자 생성...\n');

    const testUsername = 'reallogin_' + Date.now();
    const testPassword = 'TestPassword123!';
    const testNickname = 'RealLoginTest_' + Date.now();

    const { data: user, error: createError } = await supabase
      .from('profiles')
      .insert({
        username: testUsername,
        password_hash: 'dummy_hash_for_testing',
        nickname: testNickname,
        role: 'user',
      })
      .select('*')
      .single();

    if (createError) {
      console.error('❌ 사용자 생성 실패:', createError.message);
      process.exit(1);
    }

    console.log('✓ 테스트 사용자 생성 완료:');
    console.log('  Username:', testUsername);
    console.log('  Nickname:', testNickname);
    console.log('  비밀번호 (임시):', testPassword, '\n');

    // 2단계: 브라우저로 로그인
    console.log('[2단계] 브라우저로 로그인 시도...\n');

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // 콘솔 로그 캡처
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[Login]') || text.includes('[loginUser]') || text.includes('[Auth]')) {
        console.log('[콘솔]', text);
      }
    });

    // 로그인 페이지로 이동
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    console.log('✓ 로그인 페이지 로드\n');

    // 실제로는 API를 직접 호출하는 것이 더 빠름
    // JavaScript에서 직접 loginUser 함수를 호출
    console.log('[3단계] JavaScript에서 loginUser 함수 호출...\n');

    const loginResult = await page.evaluate(
      async ({ username, password }) => {
        // loginUser 함수 실행 (전역에 있다고 가정)
        try {
          // /jobs/new나 다른 곳에서 import된 loginUser를 직접 호출할 수 없으므로
          // 이는 작동하지 않습니다. 대신 API를 직접 호출해야 합니다.

          // 다만 우리가 할 수 있는 것: 콘솔에 무슨 일이 일어나는지 확인하기
          console.log('[JS] loginUser 호출 불가 (import 문제)');
          return { success: false, reason: 'function_not_accessible' };
        } catch (err) {
          return { success: false, reason: err.message };
        }
      },
      { username: testUsername, password: testPassword }
    );

    console.log('⚠️  JavaScript에서 직접 호출 불가. 폼으로 시도합니다.\n');

    // 폼을 통한 로그인
    console.log('[3단계 수정] 로그인 폼으로 시도...\n');

    const idInput = await page.locator('input[placeholder*="아이디"]').first();
    const pwInput = await page.locator('input[type="password"]').first();

    if (await idInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✓ 로그인 폼 발견');
      await idInput.fill(testUsername);
      await pwInput.fill(testPassword);
      console.log('✓ 입력: ' + testUsername + ' / ****\n');

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
      console.log('❌ 로그인 폼을 찾을 수 없음\n');
    }

    // 4단계: 쿠키 확인
    console.log('[4단계] 쿠키 상태 확인...\n');

    const cookies = await page.context().cookies();
    const pcBangCookie = cookies.find((c) => c.name === 'pc_bang_session');

    if (pcBangCookie) {
      console.log('✓ pc_bang_session 쿠키 발견!');
      try {
        const session = JSON.parse(decodeURIComponent(pcBangCookie.value));
        console.log('  사용자 ID:', session.id);
        console.log('  Username:', session.username);
      } catch {
        console.log('  (파싱 실패)');
      }
    } else {
      console.log('❌ pc_bang_session 쿠키 없음');
    }
    console.log();

    // 최종 결과
    console.log('[최종] 로그인 및 쿠키 설정: ' + (pcBangCookie ? '✅ 성공' : '❌ 실패'));
  } catch (err) {
    console.error('\n❌ 테스트 실패:', err.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

runTest();
