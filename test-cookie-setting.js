#!/usr/bin/env node

/**
 * document.cookie 설정 가능 여부 직접 테스트
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3002';

console.log('[쿠키 설정 테스트] ╔════════════════════════════════════════╗');
console.log('[쿠키 설정 테스트] ║  document.cookie 작동 여부 직접 테스트 ║');
console.log('[쿠키 설정 테스트] ╚════════════════════════════════════════╝\n');

async function runTest() {
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('[1단계] localhost:3002로 이동...\n');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // 2단계: localStorage에 세션 저장
    console.log('[2단계] localStorage에 테스트 세션 저장...\n');

    await page.evaluate(() => {
      const session = {
        id: 'test-user-id-12345',
        username: 'testuser',
        nickname: 'Test User',
        role: 'user',
      };
      localStorage.setItem('pc_bang_session', JSON.stringify(session));
      console.log('[JS] ✓ localStorage에 저장됨');
    });

    // localStorage 확인
    const lsData = await page.evaluate(() => {
      return localStorage.getItem('pc_bang_session');
    });

    console.log('✓ localStorage 확인:');
    console.log('  데이터 있음:', !!lsData);
    if (lsData) {
      const parsed = JSON.parse(lsData);
      console.log('  userId:', parsed.id);
    }
    console.log();

    // 3단계: document.cookie로 쿠키 설정
    console.log('[3단계] document.cookie로 쿠키 설정 시도...\n');

    const cookieSet = await page.evaluate(() => {
      try {
        const session = {
          id: 'test-user-id-12345',
          username: 'testuser',
          nickname: 'Test User',
          role: 'user',
        };
        const cookieValue = encodeURIComponent(JSON.stringify(session));
        const cookieString = `pc_bang_session=${cookieValue}; max-age=${7*24*60*60}; path=/; SameSite=Lax`;

        console.log('[JS] 설정할 쿠키:', cookieString.substring(0, 100) + '...');
        document.cookie = cookieString;
        console.log('[JS] ✓ document.cookie 설정 완료');

        return true;
      } catch (err) {
        console.log('[JS] ❌ 쿠키 설정 실패:', err.message);
        return false;
      }
    });

    console.log('✓ 쿠키 설정 결과:', cookieSet ? '성공' : '실패');
    console.log();

    // 4단계: 브라우저에서 쿠키 확인
    console.log('[4단계] 브라우저 쿠키 확인...\n');

    const cookies = await page.context().cookies();
    console.log('✓ 브라우저 쿠키 개수:', cookies.length);
    cookies.forEach((cookie) => {
      console.log(`  - ${cookie.name}: ${cookie.value.substring(0, 50)}...`);
    });

    const pcBangCookie = cookies.find((c) => c.name === 'pc_bang_session');
    if (pcBangCookie) {
      console.log('\n✓✓ pc_bang_session 쿠키 발견!');
    } else {
      console.log('\n❌ pc_bang_session 쿠키 없음');
    }
    console.log();

    // 5단계: JavaScript에서 document.cookie 읽기
    console.log('[5단계] JavaScript에서 document.cookie 읽기...\n');

    const jsReadCookie = await page.evaluate(() => {
      return document.cookie;
    });

    console.log('✓ document.cookie 값:');
    if (jsReadCookie) {
      console.log('  ', jsReadCookie);
    } else {
      console.log('   (빈상태)');
    }
    console.log();

    // 6단계: API 요청으로 쿠키 전송 확인
    console.log('[6단계] API 요청으로 쿠키 전송 테스트...\n');

    const apiResponse = await page.evaluate(async () => {
      try {
        const res = await fetch('http://localhost:3002/api/debug-auth', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await res.json();
        return data;
      } catch (err) {
        return { error: err.message };
      }
    });

    console.log('✓ API /debug-auth 응답:');
    console.log('  쿠키 개수:', apiResponse.cookies ? Object.keys(apiResponse.cookies).length : '조회 실패');
    console.log('  pc_bang_session 감지:', apiResponse.pcBangSession ? apiResponse.pcBangSession.exists : '조회 실패');
    console.log();

    // 최종 분석
    console.log('[최종 분석] ╔════════════════════════════════════════╗');
    console.log('[최종 분석] ║         문제 원인 파악              ║');
    console.log('[최종 분석] ╚════════════════════════════════════════╝\n');

    if (cookieSet && !pcBangCookie) {
      console.log('❌ 문제: document.cookie로 설정했지만 브라우저에 저장되지 않음');
      console.log('   원인: SameSite 정책이 브라우저에서 차단할 수 있음');
      console.log('   해결: SameSite=None; Secure 추가 필요 (HTTPS)\n');
    } else if (!cookieSet) {
      console.log('❌ 문제: document.cookie 설정 자체가 실패');
      console.log('   원인: JavaScript 예외 발생\n');
    } else if (pcBangCookie && apiResponse.pcBangSession && !apiResponse.pcBangSession.exists) {
      console.log('⚠️  문제: 브라우저 쿠키는 있지만 API에서 감지 안 됨');
      console.log('   원인: credentials: include가 작동하지 않음\n');
    } else if (pcBangCookie && apiResponse.pcBangSession && apiResponse.pcBangSession.exists) {
      console.log('✅ 모든 테스트 통과!');
      console.log('   쿠키 설정 → 브라우저 저장 → API 전송 모두 작동\n');
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
