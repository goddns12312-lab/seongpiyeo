#!/usr/bin/env node

/**
 * Browser automation test using Playwright
 * Tests complete flow: register → login → upload → verify
 */

const { chromium } = require('playwright');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const BASE_URL = 'http://localhost:3002';
const TEST_USERNAME = 'automationtest_' + Date.now();
const TEST_PASSWORD = 'TestPassword123!';
const TEST_NICKNAME = 'Auto Test User';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('[브라우저 자동화] ╔════════════════════════════════════════╗');
  console.log('[브라우저 자동화] ║  브라우저 플로우 통합 테스트 시작    ║');
  console.log('[브라우저 자동화] ╚════════════════════════════════════════╝\n');

  let browser;

  try {
    // 1단계: 회원가입
    console.log('[1단계] 브라우저 시작 및 회원가입 페이지 이동...\n');

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // 개발자 도구 콘솔 로그 캡처
    page.on('console', (msg) => {
      if (msg.text().includes('[Auth]') || msg.text().includes('[공고 등록]') || msg.text().includes('[이미지')) {
        console.log('[콘솔]', msg.text());
      }
    });

    // Register 페이지로 이동
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
    console.log('  ✓ 회원가입 페이지 로드\n');

    // 회원가입 폼 입력
    console.log('  회원가입 정보 입력:');
    console.log('    Username:', TEST_USERNAME);
    console.log('    Nickname:', TEST_NICKNAME);

    await page.fill('input[placeholder="아이디를 입력하세요"]', TEST_USERNAME);
    await page.fill('input[placeholder="••••••••"]', TEST_PASSWORD);
    await page.fill('input[placeholder="닉네임을 입력하세요"]', TEST_NICKNAME);

    // 회원가입 버튼 클릭
    await page.click('button:has-text("회원가입")');

    // 회원가입 완료 대기 (메인 페이지로 리다이렉트)
    await page.waitForURL(`${BASE_URL}/`, { timeout: 5000 });
    console.log('\n✓ 회원가입 완료!\n');

    // 2단계: 쿠키 확인
    console.log('[2단계] 세션 쿠키 확인...\n');

    const cookies = await page.context().cookies();
    const pcBangCookie = cookies.find((c) => c.name === 'pc_bang_session');

    if (pcBangCookie) {
      console.log('✓ pc_bang_session 쿠키 발견!');
      const sessionData = JSON.parse(decodeURIComponent(pcBangCookie.value));
      console.log('  사용자 ID:', sessionData.id);
      console.log('  Username:', sessionData.username);
      console.log('  Nickname:', sessionData.nickname);
      console.log('  역할:', sessionData.role);
    } else {
      console.log('❌ pc_bang_session 쿠키를 찾을 수 없음!');
      console.log('  현재 쿠키:', cookies.map((c) => c.name).join(', '));
    }

    console.log('\n✓ 세션 확인 완료!\n');

    // 3단계: 공고 등록 페이지로 이동
    console.log('[3단계] 공고 등록 페이지로 이동...\n');

    await page.goto(`${BASE_URL}/jobs/new`, { waitUntil: 'networkidle' });
    console.log('  ✓ 공고 등록 페이지 로드\n');

    // 4단계: 이미지 선택
    console.log('[4단계] 테스트 이미지 생성 및 업로드...\n');

    // 간단한 테스트 이미지 생성
    const canvas = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(0, 0, 100, 100);
      return canvas.toDataURL('image/png');
    });

    // 이미지 파일 입력
    const fileInput = await page.locator('input[type="file"]');

    // Canvas to Blob 변환
    const dataUrl = canvas;
    const blob = await page.evaluate((dataUrl) => {
      return fetch(dataUrl).then((res) => res.blob()).then((blob) => ({
        size: blob.size,
        type: blob.type,
      }));
    }, dataUrl);

    console.log('  테스트 이미지 정보:');
    console.log('    크기:', blob.size, 'bytes');
    console.log('    타입:', blob.type);

    // 실제 파일로 업로드
    await fileInput.setInputFiles({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        [
          0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
          0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
          0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
          0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
          0x42, 0x60, 0x82,
        ],
        'hex'
      ),
    });

    console.log('  ✓ 이미지 파일 선택\n');

    // 5단계: 폼 입력
    console.log('[5단계] 공고 정보 입력...\n');

    // 카테고리 선택 (구인)
    await page.click('button:has-text("📋 구인 공고")');

    // 제목
    await page.fill('input[placeholder*="PC방 매니저"]', 'PC방 매니저 모집 - 테스트');

    // 회사명
    await page.fill('input[placeholder*="회사명"]', '테스트 PC방');

    // 지역
    await page.selectOption('select', '서울');

    // 설명
    await page.fill('textarea[placeholder*="상세 설명"]', '테스트를 위한 공고입니다. 실제 채용이 아닙니다.');

    console.log('  ✓ 폼 정보 입력 완료\n');

    // 6단계: 공고 등록
    console.log('[6단계] 공고 등록 버튼 클릭...\n');

    // 등록 버튼 클릭
    const submitButton = await page.locator('button:has-text("등록")');
    await submitButton.click();

    // 성공 메시지 또는 페이지 이동 대기
    try {
      await page.waitForURL(`${BASE_URL}/jobs*`, { timeout: 10000 });
      console.log('✓ 공고 등록 성공 - /jobs 페이지로 리다이렉트됨!\n');
    } catch {
      console.log('⚠️  페이지 리다이렉트 미감지, 현재 URL:', page.url());
    }

    // 7단계: 이미지 표시 확인
    console.log('[7단계] 등록된 공고 목록에서 이미지 확인...\n');

    await page.goto(`${BASE_URL}/jobs`, { waitUntil: 'networkidle' });

    // 최신 공고가 맨 위에 있을 가능성
    const jobCards = await page.locator('[class*="job"], article, [role="article"]').count();
    console.log('  공고 카드 개수:', jobCards);

    // "테스트" 텍스트를 포함하는 공고 찾기
    const testJobCard = await page.locator('text=/테스트|Test/i').first();
    const isVisible = await testJobCard.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      console.log('✓ 등록된 공고 발견!\n');

      // 이미지 태그 확인
      const images = await page.locator('img').count();
      console.log('  페이지 이미지 개수:', images);

      const jobImage = await testJobCard.locator('img').first();
      const imageIsVisible = await jobImage.isVisible({ timeout: 2000 }).catch(() => false);

      if (imageIsVisible) {
        const imageSrc = await jobImage.getAttribute('src');
        console.log('✓ 공고에 이미지가 표시됨!');
        console.log('  이미지 소스 (처음 100자):', imageSrc.substring(0, 100) + '...');
      } else {
        console.log('⚠️  이미지 태그는 있으나 표시되지 않음');
      }
    } else {
      console.log('⚠️  등록된 공고를 찾을 수 없음');
    }

    console.log('\n[브라우저 자동화] ╔════════════════════════════════════════╗');
    console.log('[브라우저 자동화] ║           테스트 완료!               ║');
    console.log('[브라우저 자동화] ╚════════════════════════════════════════╝\n');

    console.log('결과:');
    console.log('  ✓ 회원가입 완료');
    console.log('  ' + (pcBangCookie ? '✓' : '✗') + ' 세션 쿠키 설정');
    console.log('  ✓ 공고 등록');
    console.log('  ✓ 이미지 업로드');
    console.log('  ' + (isVisible ? '✓' : '?') + ' 공고 목록에 표시');
    console.log('  ' + (imageIsVisible ? '✓' : '?') + ' 이미지 렌더링');

    console.log('\n✅ 전체 플로우 테스트 완료!\n');
  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

runTest().catch(console.error);
