#!/usr/bin/env node

/**
 * /api/jobs/create 엔드포인트 완전 테스트
 * 이미지 업로드 → API 공고 등록 → 데이터베이스 확인
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
console.log('║  /api/jobs/create 엔드포인트 완전 테스트                  ║');
console.log('║  이미지 업로드 → 공고 등록 → 데이터 저장                ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function test() {
  let browser;
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const results = {
    userCreation: false,
    login: false,
    imageUpload: false,
    jobCreate: false,
    databaseVerify: false,
  };

  try {
    // 1. 사용자 생성
    console.log('👤 [1] 테스트 사용자 생성\n');
    const username = 'jobapi_' + Date.now();
    const password = 'JobAPI123!@#';
    const hash = await bcrypt.hash(password, 10);

    const { data: user, error: userErr } = await supabase
      .from('profiles')
      .insert({
        username,
        password_hash: hash,
        nickname: 'JobAPITest',
        role: 'user',
      })
      .select('id')
      .single();

    if (userErr) throw userErr;
    results.userCreation = true;

    console.log('   ✅ 사용자 생성 완료');
    console.log('      Username:', username);
    console.log('      UserID:', user.id.substring(0, 12) + '...\n');

    // 2. 브라우저 로그인
    console.log('🔐 [2] 브라우저 로그인\n');
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

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
      throw new Error('Cookie not set after login');
    }

    results.login = true;
    console.log('   ✅ 로그인 성공 및 쿠키 설정\n');

    // 3. 이미지 업로드
    console.log('🖼️  [3] 이미지 업로드\n');

    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

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

    if (uploadRes.status !== 200) {
      throw new Error(`Image upload failed: ${uploadRes.status}`);
    }

    const uploadResult = JSON.parse(uploadRes.data);
    results.imageUpload = true;

    console.log('   ✅ 이미지 업로드 완료');
    console.log('      URL:', uploadResult.url.substring(0, 60) + '...\n');

    // 4. API를 통해 공고 등록
    console.log('📝 [4] API 공고 등록\n');

    const jobPayload = {
      category: 'recruitment',
      slug: 'test-job-' + Date.now(),
      title: 'PC방 직원 모집 (테스트)',
      company_name: '테스트PC방',
      description: '안정적인 아르바이트 기회입니다. 주5일, 시급 10000원',
      region: '서울',
      employment_type: '아르바이트',
      salary: '10000원',
      contact: '010-1234-5678',
      images: [
        {
          url: uploadResult.url,
          order: 0,
          is_primary: true,
        },
      ],
      status: 'active',
      view_count: 0,
    };

    console.log('   요청 정보:');
    console.log('   - Title:', jobPayload.title);
    console.log('   - Region:', jobPayload.region);
    console.log('   - Images:', jobPayload.images.length, '개\n');

    const jobRes = await new Promise((resolve) => {
      const body = JSON.stringify(jobPayload);
      const req = http.request({
        hostname: 'localhost',
        port: 3002,
        path: '/api/jobs/create',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
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

    console.log('   API 응답 상태:', jobRes.status);

    if (jobRes.status !== 200) {
      const errorData = JSON.parse(jobRes.data);
      throw new Error(`Job creation failed: ${jobRes.status} - ${errorData.error}`);
    }

    const jobResult = JSON.parse(jobRes.data);
    results.jobCreate = true;

    console.log('   ✅ 공고 등록 완료');
    console.log('      JobID:', jobResult.jobId.substring(0, 12) + '...');
    console.log('      Message:', jobResult.message, '\n');

    // 5. 데이터베이스에서 확인
    console.log('💾 [5] 데이터베이스 확인\n');

    const { data: jobData, error: selectErr } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobResult.jobId)
      .single();

    if (selectErr) {
      throw new Error(`Database query failed: ${selectErr.message}`);
    }

    results.databaseVerify = true;

    console.log('   ✅ 데이터베이스에서 확인됨');
    console.log('      Title:', jobData.title);
    console.log('      Region:', jobData.region);
    console.log('      Status:', jobData.status);
    console.log('      Images:', JSON.stringify(jobData.images).substring(0, 60) + '...\n');

    // 최종 결과
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  최종 검증 결과                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const allPass = Object.values(results).every(v => v);

    console.log('📋 검증 항목:');
    console.log('   ' + (results.userCreation ? '✅' : '❌') + ' 사용자 생성');
    console.log('   ' + (results.login ? '✅' : '❌') + ' 로그인 및 쿠키');
    console.log('   ' + (results.imageUpload ? '✅' : '❌') + ' 이미지 업로드');
    console.log('   ' + (results.jobCreate ? '✅' : '❌') + ' 공고 등록 API');
    console.log('   ' + (results.databaseVerify ? '✅' : '❌') + ' 데이터베이스 저장\n');

    if (allPass) {
      console.log('🎉 최종 결과: ✅ 모든 항목 통과!\n');
      console.log('   → /jobs/new 페이지 완전 기능 검증 완료\n');
    } else {
      console.log('⚠️  일부 항목 미통과\n');
      process.exit(1);
    }

  } catch (err) {
    console.error('\n❌ 테스트 실패:', err.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

test();
