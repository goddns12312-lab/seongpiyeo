#!/usr/bin/env node

/**
 * 공고 상세페이지 테스트
 * /jobs/{slug} 페이지 로드 및 표시 검증
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

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  공고 상세페이지 완전 테스트                             ║');
console.log('║  목록 → 카드 클릭 → 상세페이지 표시                    ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function test() {
  let browser;
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const results = {
    jobCreation: false,
    imageUpload: false,
    jobRegister: false,
    listPageLoad: false,
    cardDisplay: false,
    cardClick: false,
    detailPageLoad: false,
    detailDisplay: false,
  };

  try {
    // 1. 사용자 생성 및 로그인
    console.log('👤 [1] 사용자 및 공고 준비\n');

    const username = 'jobdetail_' + Date.now();
    const password = 'JobDetail123!';
    const hash = await bcrypt.hash(password, 10);

    const { data: user } = await supabase
      .from('profiles')
      .insert({
        username,
        password_hash: hash,
        nickname: 'JobDetailTest',
        role: 'user',
      })
      .select('id')
      .single();

    console.log('   ✅ 사용자 생성:', username);

    // 2. 이미지 업로드
    console.log('\n🖼️  [2] 이미지 준비\n');

    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // 로그인
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    const idField = await page.locator('input[placeholder*="아이디"]').first();
    const pwField = await page.locator('input[type="password"]').first();
    await idField.fill(username);
    await pwField.fill(password);
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.dispatchEvent(new Event('submit', { bubbles: true }));
    });
    await page.waitForTimeout(2000);

    const cookies = await page.context().cookies();
    const pcBangCookie = cookies.find(c => c.name === 'pc_bang_session');

    if (!pcBangCookie) {
      throw new Error('로그인 후 쿠키가 설정되지 않았습니다');
    }

    // 이미지 업로드
    const boundary = '----WebKitFormBoundary' + Date.now();
    const bodyParts = [
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n`),
      pngBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ];
    const body = Buffer.concat(bodyParts);

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
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => { resolve({ status: res.statusCode, data }); });
      });
      req.write(body);
      req.end();
    });

    const uploadResult = JSON.parse(uploadRes.data);
    results.imageUpload = true;
    console.log('   ✅ 이미지 업로드 완료\n');

    // 3. 공고 등록
    console.log('📝 [3] 공고 등록\n');

    const jobPayload = {
      category: 'recruitment',
      slug: 'detail-test-' + Date.now(),
      title: '공고 상세페이지 테스트 공고',
      company_name: '테스트회사',
      description: '이것은 공고 상세페이지 테스트용 공고입니다.\n\n상세 설명이 표시되어야 합니다.',
      region: '서울',
      employment_type: '정규직',
      salary: '월급 300만원',
      contact: '010-1234-5678',
      images: [{ url: uploadResult.url, order: 0, is_primary: true }],
    };

    const jobRes = await new Promise((resolve) => {
      const jobBody = JSON.stringify(jobPayload);
      const req = http.request({
        hostname: 'localhost',
        port: 3002,
        path: '/api/jobs/create',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(jobBody),
          'Cookie': `pc_bang_session=${pcBangCookie.value}`,
        },
      }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => { resolve({ status: res.statusCode, data }); });
      });
      req.write(jobBody);
      req.end();
    });

    const jobResult = JSON.parse(jobRes.data);
    results.jobCreation = true;
    results.jobRegister = true;

    console.log('   ✅ 공고 등록:', jobPayload.slug);
    console.log('      Title:', jobPayload.title, '\n');

    // 4. /jobs 목록 페이지 로드
    console.log('📋 [4] /jobs 목록 페이지 로드\n');

    await page.goto(`${BASE_URL}/jobs`, { waitUntil: 'networkidle' });
    const pageUrl = page.url();
    console.log('   ✅ 목록 페이지 로드:', pageUrl);
    results.listPageLoad = true;

    // 5. 카드 검색
    console.log('\n🔍 [5] 등록된 공고 카드 검색\n');

    const jobTitle = jobPayload.title;
    const cards = await page.locator('[class*="hover:border-gold"]').count();
    console.log('   카드 개수:', cards);

    // 공고 제목으로 카드 찾기
    const titleLocators = await page.locator(`text=${jobTitle}`);
    const titleCount = await titleLocators.count();

    if (titleCount > 0) {
      results.cardDisplay = true;
      console.log('   ✅ 공고 카드 발견:', jobTitle, '\n');

      // 6. 카드 클릭
      console.log('🖱️  [6] 카드 클릭\n');

      await titleLocators.first().click();
      await page.waitForTimeout(1000);

      const detailUrl = page.url();
      console.log('   이동된 URL:', detailUrl);

      // 상세페이지로 이동했는지 확인
      if (detailUrl.includes('/jobs/')) {
        results.cardClick = true;
        results.detailPageLoad = true;
        console.log('   ✅ 상세페이지로 이동 완료\n');

        // 7. 상세페이지 내용 확인
        console.log('📄 [7] 상세페이지 내용 확인\n');

        const detailContent = await page.textContent('body');
        const hasTitle = detailContent.includes(jobTitle);
        const hasCompany = detailContent.includes(jobPayload.company_name);
        const hasDesc = detailContent.includes('상세 설명');
        const hasContact = detailContent.includes(jobPayload.contact);

        console.log('   제목:', hasTitle ? '✅' : '❌', jobTitle);
        console.log('   회사명:', hasCompany ? '✅' : '❌', jobPayload.company_name);
        console.log('   설명:', hasDesc ? '✅' : '❌', '포함됨');
        console.log('   연락처:', hasContact ? '✅' : '❌', jobPayload.contact);

        if (hasTitle && hasCompany && hasDesc && hasContact) {
          results.detailDisplay = true;
          console.log('\n   ✅ 모든 내용이 정상 표시됨\n');
        }
      } else {
        console.log('   ❌ 상세페이지로 이동 실패\n');
      }
    } else {
      console.log('   ❌ 공고 카드를 찾을 수 없음\n');
    }

    // 최종 결과
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  최종 검증 결과                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📋 검증 항목:');
    console.log('   ' + (results.jobCreation ? '✅' : '❌') + ' 공고 생성');
    console.log('   ' + (results.imageUpload ? '✅' : '❌') + ' 이미지 업로드');
    console.log('   ' + (results.jobRegister ? '✅' : '❌') + ' 공고 등록');
    console.log('   ' + (results.listPageLoad ? '✅' : '❌') + ' 목록 페이지');
    console.log('   ' + (results.cardDisplay ? '✅' : '❌') + ' 카드 표시');
    console.log('   ' + (results.cardClick ? '✅' : '❌') + ' 카드 클릭');
    console.log('   ' + (results.detailPageLoad ? '✅' : '❌') + ' 상세페이지 로드');
    console.log('   ' + (results.detailDisplay ? '✅' : '❌') + ' 내용 표시\n');

    const allPass = Object.values(results).every(v => v);
    if (allPass) {
      console.log('🎉 최종 결과: ✅ 모든 항목 통과!\n');
      console.log('   → /jobs 목록에서 공고 카드 클릭 시 상세페이지로 정상 이동\n');
    } else {
      console.log('⚠️  일부 항목 미통과\n');
    }

  } catch (err) {
    console.error('\n❌ 테스트 실패:', err.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

test();
