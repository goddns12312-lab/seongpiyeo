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

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 테스트 사용자 생성
    const username = 'formtest_' + Date.now();
    const password = 'FormTest123!';
    const hash = await bcrypt.hash(password, 10);

    console.log('[직접 제출 테스트] 테스트 사용자 생성:', username);
    const { data: user } = await supabase.from('profiles').insert({
      username, password_hash: hash, nickname: 'FormTest', role: 'user'
    }).select('id').single();

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // 모든 콘솔 로그 캡처
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[') || text.includes('Error')) {
        console.log('[JS]', text);
      }
    });

    // 로그인 페이지 방문
    console.log('\n[1] 로그인 페이지 방문...');
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle' });

    // form 요소 찾기
    console.log('[2] Form 요소 찾기...');
    const form = await page.locator('form').first();
    const formExists = await form.isVisible().catch(() => false);
    console.log('   form 발견:', formExists);

    // 입력 필드 찾기
    const idField = await page.locator('input[placeholder*="아이디"]').first();
    const pwField = await page.locator('input[type="password"]').first();
    const idVisible = await idField.isVisible().catch(() => false);
    const pwVisible = await pwField.isVisible().catch(() => false);

    console.log('   ID 입력 필드:', idVisible);
    console.log('   PW 입력 필드:', pwVisible);

    if (!idVisible || !pwVisible) {
      console.error('❌ 입력 필드를 찾을 수 없음');
      process.exit(1);
    }

    // 값 입력
    console.log('\n[3] 로그인 정보 입력...');
    await idField.fill(username);
    await pwField.fill(password);

    // 입력값 확인
    const idValue = await idField.inputValue();
    const pwValue = await pwField.inputValue();
    console.log('   ID 입력값:', idValue === username ? '✓' : '✗');
    console.log('   PW 입력값:', pwValue === password ? '✓' : '✗');

    // Form 직접 제출
    console.log('\n[4] Form 직접 제출 (evaluate)...');
    const submitResult = await page.evaluate(() => {
      const form = document.querySelector('form');
      if (!form) {
        console.log('[JS] Form을 찾을 수 없음');
        return false;
      }
      console.log('[JS] Form 제출 중...');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      return true;
    });
    console.log('   Form 제출:', submitResult ? '✓' : '✗');

    // 응답 대기
    console.log('[5] 응답 대기 중...');
    await page.waitForTimeout(3000);

    // 현재 URL 확인
    const currentUrl = page.url();
    console.log('   현재 URL:', currentUrl);

    // 쿠키 확인
    console.log('\n[6] 쿠키 확인...');
    const cookies = await page.context().cookies();
    console.log('   쿠키 개수:', cookies.length);
    const pcBangCookie = cookies.find(c => c.name === 'pc_bang_session');
    console.log('   pc_bang_session:', pcBangCookie ? '✓ 설정됨' : '✗ 없음');

    // localStorage 확인
    console.log('\n[7] localStorage 확인...');
    const lsSession = await page.evaluate(() => localStorage.getItem('pc_bang_session'));
    console.log('   pc_bang_session:', lsSession ? '✓ 설정됨' : '✗ 없음');

  } catch (err) {
    console.error('\n❌ 테스트 실패:', err.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

test();
