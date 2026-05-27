#!/usr/bin/env node

/**
 * Complete integration test for image upload flow
 * Tests: session creation → cookie sending → API upload → Storage verification
 */

const fs = require('fs');
const http = require('http');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

// Environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEST_PORT = 3002;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ 환경 변수 누락: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('[TEST] ╔════════════════════════════════════════╗');
console.log('[TEST] ║  이미지 업로드 완전 통합 테스트 시작   ║');
console.log('[TEST] ╚════════════════════════════════════════╝\n');

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// 1픽셀 PNG 이미지
const pngBuffer = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
  0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
]);

let testUserId = null;
let testResults = {
  setupComplete: false,
  debugAuthWorking: false,
  noCookiesBefore: false,
  apiUploadSuccess: false,
  storageFileCreated: false,
  jobsTableSaved: false,
  jobsListDisplay: false,
};

async function getOrCreateTestUser() {
  console.log('[1단계] 테스트 사용자 확인...\n');

  try {
    // 기존 테스트 사용자 조회
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, username, nickname')
      .eq('username', 'testuser123')
      .single();

    if (existing) {
      console.log('✓ 기존 테스트 사용자 발견:', {
        userId: existing.id,
        username: existing.username,
        nickname: existing.nickname,
      });
      testUserId = existing.id;
      return;
    }

    // 새 테스트 사용자 생성
    const { data: newUser, error: insertError } = await supabase
      .from('profiles')
      .insert({
        username: 'testuser123',
        nickname: 'Test User',
        password_hash: 'test_hash_for_api_testing',
        role: 'user',
      })
      .select('id, username, nickname')
      .single();

    if (insertError) {
      console.error('❌ 사용자 생성 실패:', insertError.message);
      process.exit(1);
    }

    console.log('✓ 새 테스트 사용자 생성:', {
      userId: newUser.id,
      username: newUser.username,
      nickname: newUser.nickname,
    });
    testUserId = newUser.id;
  } catch (err) {
    console.error('❌ 사용자 확인 중 오류:', err.message);
    process.exit(1);
  }
}

function createSessionCookie(userId) {
  const session = {
    id: userId,
    username: 'testuser123',
    nickname: 'Test User',
    role: 'user',
  };

  const cookieValue = encodeURIComponent(JSON.stringify(session));
  console.log('\n[쿠키 생성] 세션 정보:');
  console.log('  ID:', userId);
  console.log('  Username: testuser123');
  console.log('  Nickname: Test User');
  console.log('  쿠키 값 (처음 50자):', cookieValue.substring(0, 50) + '...\n');

  return `pc_bang_session=${cookieValue}`;
}

function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, data });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function testDebugAuthEndpoint() {
  console.log('[2단계] /api/debug-auth로 쿠키 상태 확인...\n');

  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/debug-auth',
      method: 'GET',
    });

    if (response.status === 200) {
      const data = JSON.parse(response.data);
      console.log('✓ Debug API 응답 수신');
      console.log('  현재 쿠키 개수:', Object.keys(data.cookies).length);
      console.log('  pc_bang_session 존재:', data.pcBangSession.exists);

      testResults.debugAuthWorking = true;
      testResults.noCookiesBefore = !data.pcBangSession.exists;
    } else {
      console.log('⚠️  Debug API 상태:', response.status);
    }
  } catch (err) {
    console.error('❌ Debug API 요청 실패:', err.message);
  }
}

async function testImageUpload(sessionCookie) {
  console.log('\n[3단계] /api/upload-job-image로 이미지 업로드 테스트...\n');

  try {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const formData = [];

    formData.push(`--${boundary}`);
    formData.push('Content-Disposition: form-data; name="file"; filename="test.png"');
    formData.push('Content-Type: image/png');
    formData.push('');

    const bodyWithoutBinary = formData.join('\r\n');
    const bodyWithoutEnd = bodyWithoutBinary + '\r\n';

    const bodyParts = [
      Buffer.from(bodyWithoutEnd),
      pngBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ];
    const body = Buffer.concat(bodyParts);

    const response = await makeRequest(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/upload-job-image',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length,
          'Cookie': sessionCookie,
        },
      },
      body
    );

    console.log('  응답 상태:', response.status);

    if (response.status === 200) {
      const result = JSON.parse(response.data);
      console.log('✓ 이미지 업로드 성공!');
      console.log('  파일 경로:', result.path);
      console.log('  공개 URL:', result.url.substring(0, 80) + '...');

      testResults.apiUploadSuccess = true;
      return result;
    } else {
      const errorData = JSON.parse(response.data);
      console.error('❌ API 업로드 실패 (Status', response.status + ')');
      console.error('  Error:', errorData.error);
      if (errorData.details) {
        console.error('  Details:', errorData.details);
      }
      return null;
    }
  } catch (err) {
    console.error('❌ 업로드 요청 중 오류:', err.message);
    return null;
  }
}

async function verifyStorageFile(filePath) {
  console.log('\n[4단계] Supabase Storage 파일 확인...\n');

  try {
    const { data, error } = await supabase.storage.from('jobs').list(testUserId);

    if (error) {
      console.error('❌ 파일 목록 조회 실패:', error.message);
      return false;
    }

    const fileName = filePath.split('/')[1];
    const fileExists = data && data.some((f) => f.name === fileName);

    if (fileExists) {
      console.log('✓ 저장소에 파일 생성 확인됨!');
      console.log('  폴더:', testUserId);
      console.log('  파일:', fileName);
      console.log('  폴더 내 전체 파일:', data.length);

      testResults.storageFileCreated = true;
      return true;
    } else {
      console.error('❌ 저장소에서 파일을 찾을 수 없음');
      console.log('  예상 폴더:', testUserId);
      console.log('  예상 파일:', fileName);
      console.log('  실제 파일:', data.map((f) => f.name).join(', '));
      return false;
    }
  } catch (err) {
    console.error('❌ 저장소 확인 중 오류:', err.message);
    return false;
  }
}

async function run() {
  try {
    // 1단계: 테스트 사용자 준비
    await getOrCreateTestUser();
    testResults.setupComplete = true;

    // 2단계: Debug API 확인
    await testDebugAuthEndpoint();

    // 3단계: 이미지 업로드
    const sessionCookie = createSessionCookie(testUserId);
    const uploadResult = await testImageUpload(sessionCookie);

    if (!uploadResult) {
      console.error('\n❌ 업로드 실패. 나머지 테스트 건너뜀.');
    } else {
      // 4단계: Storage 파일 확인
      await verifyStorageFile(uploadResult.path);
    }

    // 최종 결과
    console.log('\n[TEST] ╔════════════════════════════════════════╗');
    console.log('[TEST] ║           테스트 결과 요약             ║');
    console.log('[TEST] ╚════════════════════════════════════════╝\n');

    console.log('설정:');
    console.log('  ✓ 테스트 사용자:', testResults.setupComplete ? '완료' : '실패');
    console.log('  ' + (testResults.debugAuthWorking ? '✓' : '✗') + ' Debug API 작동:', testResults.debugAuthWorking);
    console.log('  ' + (testResults.noCookiesBefore ? '✓' : '✗') + ' 초기 쿠키 상태:', testResults.noCookiesBefore ? '비어있음 (예상)' : '있음');

    console.log('\nAPI 테스트:');
    console.log('  ' + (testResults.apiUploadSuccess ? '✓' : '✗') + ' /api/upload-job-image 상태: 200 OK');
    console.log('  ' + (testResults.storageFileCreated ? '✓' : '✗') + ' Storage 파일 생성:', testResults.storageFileCreated ? '성공' : '실패');

    const allPassed =
      testResults.setupComplete &&
      testResults.debugAuthWorking &&
      testResults.apiUploadSuccess &&
      testResults.storageFileCreated;

    console.log('\n' + (allPassed ? '✅ 모든 테스트 통과!' : '❌ 일부 테스트 실패'));
    console.log('다음 단계:');
    if (allPassed) {
      console.log('  1. http://localhost:3002/register 에서 회원가입');
      console.log('  2. http://localhost:3002/jobs/new 에서 공고 등록');
      console.log('  3. 이미지 선택 후 업로드');
      console.log('  4. http://localhost:3002/jobs 에서 이미지 표시 확인');
    } else {
      console.log('  위의 실패한 항목을 확인하고 수정이 필요합니다.');
    }
  } catch (err) {
    console.error('\n❌ 테스트 중 예상치 못한 오류:', err);
  }
}

run();
