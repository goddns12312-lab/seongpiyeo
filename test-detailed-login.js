#!/usr/bin/env node

const { chromium } = require('playwright');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE_URL = 'http://localhost:3002';

async function test() {
  let browser;
  const consoleLogs = [];
  const networkLogs = [];

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 테스트 사용자 생성
    const username = 'detailedtest_' + Date.now();
    const password = 'DetailedTest123!';
    const hash = await bcrypt.hash(password, 10);

    console.log('[디버그 로그인] 테스트 사용자 생성:', username);
    const { data: user } = await supabase.from('profiles').insert({
      username, password_hash: hash, nickname: 'DetailedTest', role: 'user'
    }).select('id').single();

    // 브라우저 시작
    browser = await chromium.launch({ headless: false }); // headless: false로 화면 볼 수 있게
    const page = await browser.newPage();

    // 모든 콘솔 로그 캡처
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(text);
      console.log('[JS 콘솔]', text);
    });

    // 모든 네트워크 요청 캡처
    page.on('response', (response) => {
      if (response.url().includes('login') || response.url().includes('auth') || response.url().includes('profiles')) {
        networkLogs.push({ url: response.url(), status: response.status() });
        console.log('[네트워크]', response.status(), response.url().split('?')[0]);
      }
    });

    // 로그인 페이지 방문
    console.log('\n[1단계] 로그인 페이지 방문...');
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle' });

    // 입력 필드 찾기
    const idField = await page.locator('input[placeholder*="아이디"]').first();
    const pwField = await page.locator('input[type="password"]').first();

    if (!await idField.isVisible()) {
      console.log('❌ 입력 필드를 찾을 수 없음');
      process.exit(1);
    }

    // 로그인 정보 입력
    console.log('\n[2단계] 로그인 정보 입력...');
    await idField.fill(username);
    await pwField.fill(password);

    // 로그인 버튼 클릭
    console.log('[3단계] 로그인 버튼 클릭...');
    const loginBtn = await page.locator('button:has-text("로그인")').first();
    await loginBtn.click();

    // 페이지 이동 대기
    await page.waitForTimeout(3000);

    // 쿠키 확인
    console.log('\n[4단계] 쿠키 확인...');
    const cookies = await page.context().cookies();
    console.log('브라우저 쿠키 개수:', cookies.length);
    cookies.forEach(c => {
      console.log('  -', c.name, ':', c.value.substring(0, 50) + (c.value.length > 50 ? '...' : ''));
    });

    const pcBangCookie = cookies.find(c => c.name === 'pc_bang_session');
    console.log('pc_bang_session 발견:', !!pcBangCookie);

    // localStorage 확인
    console.log('\n[5단계] localStorage 확인...');
    const lsSession = await page.evaluate(() => {
      return localStorage.getItem('pc_bang_session');
    });
    console.log('localStorage 세션:', !!lsSession);
    if (lsSession) {
      const parsed = JSON.parse(lsSession);
      console.log('  - username:', parsed.username);
      console.log('  - id:', parsed.id.substring(0, 8) + '...');
    }

    // document.cookie 확인
    console.log('\n[6단계] document.cookie 확인...');
    const docCookie = await page.evaluate(() => document.cookie);
    console.log('document.cookie:', docCookie || '(빈 상태)');

    // 최종 결과
    console.log('\n[최종 결과]');
    console.log('===============================');
    if (pcBangCookie) {
      console.log('✅ pc_bang_session 쿠키 설정 성공!');
    } else if (lsSession) {
      console.log('⚠️  localStorage는 있지만 쿠키는 없음');
      console.log('   → 로그인은 성공했지만 쿠키 설정에 문제 있음');
    } else {
      console.log('❌ 로그인 자체가 실패한 것으로 보임');
    }

    console.log('\n[콘솔 로그 요약]');
    const loginLogs = consoleLogs.filter(l => l.includes('[Login]') || l.includes('[로그인]'));
    loginLogs.forEach(log => console.log('  ' + log));

  } catch (err) {
    console.error('\n❌ 테스트 실패:', err.message);
    console.error(err.stack);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

test();
