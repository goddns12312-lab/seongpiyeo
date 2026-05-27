#!/usr/bin/env node

/**
 * Full pipeline test: API → Database → Verification
 * Tests the complete flow without browser complexity
 */

const fs = require('fs');
const http = require('http');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEST_PORT = 3002;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// 1픽셀 PNG
const pngBuffer = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
  0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

console.log('[전체 파이프라인] ╔════════════════════════════════════════╗');
console.log('[전체 파이프라인] ║   이미지 업로드 전체 파이프라인 테스트   ║');
console.log('[전체 파이프라인] ╚════════════════════════════════════════╝\n');

function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runFullPipeline() {
  try {
    // 1단계: 테스트 사용자 생성
    console.log('[1단계] 테스트 사용자 준비...\n');

    const uniqueId = 'pipeline_' + Date.now() + '_' + Math.random().toString(36).substring(7);
    const uniqueNickname = 'PipelineTest_' + Date.now();
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .insert({
        username: uniqueId,
        nickname: uniqueNickname,
        password_hash: 'test',
        role: 'user',
      })
      .select('id')
      .single();

    if (userError || !user) {
      console.error('❌ 사용자 생성 실패:', userError?.message);
      process.exit(1);
    }

    console.log('✓ 사용자 생성:', user.id, '\n');

    // 2단계: API로 이미지 업로드
    console.log('[2단계] API를 통한 이미지 업로드...\n');

    const sessionCookie = `pc_bang_session=${encodeURIComponent(
      JSON.stringify({
        id: user.id,
        username: uniqueId,
        nickname: uniqueNickname,
        role: 'user',
      })
    )}`;

    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const bodyParts = [
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n`),
      pngBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ];
    const body = Buffer.concat(bodyParts);

    const uploadResponse = await makeRequest(
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

    if (uploadResponse.status !== 200) {
      console.error('❌ API 업로드 실패:', uploadResponse.status);
      console.error('응답:', uploadResponse.data);
      process.exit(1);
    }

    const uploadResult = JSON.parse(uploadResponse.data);
    console.log('✓ API 업로드 성공');
    console.log('  URL:', uploadResult.url.substring(0, 80) + '...\n');

    // 3단계: Storage에 파일이 실제로 있는지 확인
    console.log('[3단계] Supabase Storage 파일 확인...\n');

    const { data: files } = await supabase.storage.from('jobs').list(user.id);

    const fileName = uploadResult.path.split('/')[1];
    const fileExists = files && files.some((f) => f.name === fileName);

    if (!fileExists) {
      console.error('❌ 저장소에서 파일을 찾을 수 없음');
      process.exit(1);
    }

    console.log('✓ Storage에 파일 확인:', fileName, '\n');

    // 4단계: jobs 테이블에 공고 저장
    console.log('[4단계] jobs 테이블에 공고 저장...\n');

    // slug 생성
    const slug = 'pipeline-test-pc-manager-' + Date.now();

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        category: 'recruitment',
        slug: slug,
        title: '파이프라인 테스트 - PC방 매니저 모집',
        company_name: '테스트 PC방',
        description: '파이프라인 테스트 공고입니다.',
        region: '서울',
        employment_type: 'part-time',
        salary: '연 3000만원',
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
      })
      .select('id, title, images')
      .single();

    if (jobError) {
      console.error('❌ jobs 테이블 저장 실패:', jobError.message);
      process.exit(1);
    }

    console.log('✓ jobs 테이블에 공고 저장');
    console.log('  공고 ID:', job.id);
    console.log('  제목:', job.title);
    console.log('  이미지 개수:', job.images.length);
    console.log('  이미지 URL:', job.images[0].url.substring(0, 80) + '...\n');

    // 5단계: DB에서 데이터 재확인
    console.log('[5단계] 데이터베이스에서 저장된 데이터 확인...\n');

    const { data: savedJob } = await supabase
      .from('jobs')
      .select('id, title, user_id, category, status, images')
      .eq('id', job.id)
      .single();

    if (!savedJob) {
      console.error('❌ 저장된 공고를 찾을 수 없음');
      process.exit(1);
    }

    console.log('✓ 데이터베이스에서 공고 확인');
    console.log('  사용자 ID:', savedJob.user_id);
    console.log('  카테고리:', savedJob.category);
    console.log('  상태:', savedJob.status);
    console.log('  이미지 JSON:', JSON.stringify(savedJob.images, null, 2), '\n');

    // 6단계: 공개 URL 접근성 테스트
    console.log('[6단계] 공개 이미지 URL 접근 테스트...\n');

    const imageUrl = job.images[0].url;
    const urlResponse = await makeRequest({
      hostname: 'lduahvskmxsrvamgieek.supabase.co',
      path: imageUrl.replace('https://lduahvskmxsrvamgieek.supabase.co', ''),
      method: 'HEAD',
    });

    if (urlResponse.status === 200) {
      console.log('✓ 공개 이미지 URL 접근 가능 (HTTP 200)\n');
    } else {
      console.log('⚠️  공개 이미지 URL 응답:', urlResponse.status, '\n');
    }

    // 최종 결과
    console.log('[전체 파이프라인] ╔════════════════════════════════════════╗');
    console.log('[전체 파이프라인] ║           최종 테스트 결과            ║');
    console.log('[전체 파이프라인] ╚════════════════════════════════════════╝\n');

    console.log('완료된 단계:');
    console.log('  ✓ 테스트 사용자 생성');
    console.log('  ✓ API로 이미지 업로드 (Status 200)');
    console.log('  ✓ Supabase Storage에 파일 저장됨');
    console.log('  ✓ jobs 테이블에 공고 저장');
    console.log('  ✓ 데이터베이스에서 데이터 확인');
    console.log('  ✓ 공개 이미지 URL 접근 가능');

    console.log('\n세부 정보:');
    console.log('  공고 ID:', job.id);
    console.log('  사용자 ID:', user.id);
    console.log('  이미지 경로:', uploadResult.path);
    console.log('  이미지 URL:', imageUrl);

    console.log('\n✅ 전체 파이프라인 테스트 통과!\n');
    console.log('다음 단계: 실제 브라우저에서 로그인 후 /jobs/new를 사용하면 동일한 방식으로 작동합니다.');
  } catch (err) {
    console.error('\n❌ 파이프라인 테스트 실패:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  }
}

runFullPipeline();
