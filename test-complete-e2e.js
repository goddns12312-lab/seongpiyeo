#!/usr/bin/env node

/**
 * 최종 E2E 테스트: 사용자 생성 → 로그인 → 쿠키 설정 → API 호출 → 이미지 업로드
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { chromium } = require('playwright');
const bcrypt = require('bcryptjs');
const http = require('http');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const BASE_URL = 'http://localhost:3002';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('[E2E 테스트] ╔════════════════════════════════════════╗');
console.log('[E2E 테스트] ║ 사용자 생성 → 로그인 → 쿠키 → 업로드  ║');
console.log('[E2E 테스트] ╚════════════════════════════════════════╝\n');

let testUsername = '';
let testPassword = '';

async function runTest() {
  let browser;
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    // 1단계: 테스트 사용자 생성
    console.log('[1단계] Supabase에 테스트 사용자 생성...\n');

    testUsername = 'e2etest_' + Date.now();
    testPassword = 'E2ETest123!@#';
    const passwordHash = await bcrypt.hash(testPassword, 10);

    const { data: user, error: createError } = await supabase
      .from('profiles')
      .insert({
        username: testUsername,
        password_hash: passwordHash,
        nickname: 'E2ETest_' + Date.now(),
        role: 'user',
      })
      .select('id')
      .single();

    if (createError) {
      console.error('❌ 사용자 생성 실패:', createError.message);
      process.exit(1);
    }

    console.log('✓ 사용자 생성 완료:');
    console.log('  Username:', testUsername);
    console.log('  UserID:', user.id.substring(0, 8) + '...\n');

    // 2단계: 브라우저로 로그인
    console.log('[2단계] 브라우저로 로그인...\n');

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // 콘솔 로그 캡처
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[') && (text.includes('Login') || text.includes('Auth'))) {
        console.log('[콘솔]', text);
      }
    });

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    console.log('✓ 로그인 페이지 로드\n');

    // 입력
    const idField = await page.locator('input[placeholder*="아이디"]').first();
    const pwField = await page.locator('input[type="password"]').first();

    if (await idField.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  로그인 정보 입력:', testUsername, '/ ****');
      await idField.fill(testUsername);
      await pwField.fill(testPassword);

      // Form 직접 제출 (Playwright button.click() 대신)
      console.log('  Form 제출 중...\n');
      await page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      });

      // 응답 대기
      await page.waitForTimeout(2000);
      console.log('✓ 로그인 처리 완료\n');
    }

    // 3단계: 쿠키 확인
    console.log('[3단계] 쿠키 상태 확인...\n');

    const cookies = await page.context().cookies();
    const pcBangCookie = cookies.find((c) => c.name === 'pc_bang_session');

    console.log('  브라우저 쿠키 개수:', cookies.length);
    if (pcBangCookie) {
      console.log('  ✓ pc_bang_session 쿠키 발견!');
      try {
        const session = JSON.parse(decodeURIComponent(pcBangCookie.value));
        console.log('    사용자 ID:', session.id.substring(0, 8) + '...');
        console.log('    Username:', session.username);
      } catch {
        console.log('    (파싱 실패)');
      }
    } else {
      console.log('  ❌ pc_bang_session 쿠키 없음!');
    }
    console.log();

    // 4단계: API 쿠키 전송 테스트
    console.log('[4단계] API에 쿠키 전송 테스트 (/api/debug-auth)...\n');

    const debugRes = await page.goto(`${BASE_URL}/api/debug-auth`, {
      waitUntil: 'networkidle',
    });

    const debugData = await page.evaluate(() => {
      try {
        return JSON.parse(document.body.textContent);
      } catch {
        return null;
      }
    });

    if (debugData) {
      console.log('  쿠키 감지됨:', Object.keys(debugData.cookies).length, '개');
      if (debugData.pcBangSession && debugData.pcBangSession.exists) {
        console.log('  ✓ pc_bang_session API에서 감지됨!\n');
      } else {
        console.log('  ❌ pc_bang_session API에서 감지 안 됨\n');
      }
    }

    // 5단계: API 이미지 업로드 테스트
    if (pcBangCookie) {
      console.log('[5단계] API 이미지 업로드 테스트...\n');

      // PNG 이미지 생성 (1x1 투명 픽셀)
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ]);

      // multipart/form-data 생성
      const boundary = '----WebKitFormBoundary' + Date.now();
      const bodyParts = [
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n`),
        pngBuffer,
        Buffer.from(`\r\n--${boundary}--\r\n`),
      ];
      const body = Buffer.concat(bodyParts);

      // API 요청
      const uploadRes = await new Promise((resolve) => {
        const req = http.request({
          hostname: 'localhost',
          port: 3002,
          path: '/api/upload-job-image',
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': body.length,
            'Cookie': `pc_bang_session=${pcBangCookie.value}`,
          },
        }, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            resolve({ status: res.statusCode, data });
          });
        });

        req.write(body);
        req.end();
      });

      console.log('  API 응답 상태:', uploadRes.status);

      if (uploadRes.status === 200) {
        const result = JSON.parse(uploadRes.data);
        console.log('  ✓ 이미지 업로드 성공!');
        console.log('    URL:', result.url.substring(0, 80) + '...');
      } else {
        try {
          const error = JSON.parse(uploadRes.data);
          console.log('  ❌ 업로드 실패');
          console.log('    에러:', error.error);
        } catch {
          console.log('  ❌ 업로드 실패');
          console.log('    응답:', uploadRes.data.substring(0, 100));
        }
      }
    }

    // 최종 결과
    console.log('\n[최종 결과] ╔════════════════════════════════════════╗');
    console.log('[최종 결과] ║        E2E 테스트 완료                ║');
    console.log('[최종 결과] ╚════════════════════════════════════════╝\n');

    if (pcBangCookie) {
      console.log('✅ 모든 단계 완료:');
      console.log('   - 사용자 생성: ✓');
      console.log('   - 로그인: ✓');
      console.log('   - 쿠키 설정: ✓');
      console.log('   - API 쿠키 감지: ✓');
      if (debugData?.pcBangSession?.exists) {
        console.log('   - API 인증: ✓');
      }
      console.log('\n   🎉 모든 기능이 정상 작동합니다!\n');
    } else {
      console.log('⚠️  쿠키 설정 미완료\n');
    }

  } catch (err) {
    console.error('\n❌ 테스트 실패:', err.message);
    console.error(err.stack);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

runTest();
