#!/usr/bin/env node

/**
 * Verify that uploaded images are rendered on /jobs page
 */

const http = require('http');

console.log('[최종 검증] /jobs 페이지에서 이미지 렌더링 확인...\n');

const req = http.get('http://localhost:3002/jobs', (res) => {
  let html = '';

  res.on('data', (chunk) => {
    html += chunk;
  });

  res.on('end', () => {
    console.log('✓ /jobs 페이지 로드 (Status', res.statusCode + ')\n');

    // 이미지 태그 개수
    const imgMatches = html.match(/<img[^>]*>/g) || [];
    console.log('페이지 이미지 태그 개수:', imgMatches.length);

    if (imgMatches.length > 0) {
      console.log('✓ 이미지 태그 발견!\n');
      console.log('첫 번째 이미지 태그:');
      console.log(imgMatches[0]);
    } else {
      console.log('⚠️  이미지 태그를 찾을 수 없음\n');
    }

    // lduahvskmxsrvamgieek.supabase.co (Storage URL) 확인
    const storageUrlMatches = html.match(/https:\/\/lduahvskmxsrvamgieek\.supabase\.co[^"']*jobs[^"']*/g) || [];
    console.log('\nSupabase Storage 이미지 URL 개수:', storageUrlMatches.length);

    if (storageUrlMatches.length > 0) {
      console.log('✓ Storage 이미지 URL 발견!\n');
      console.log('첫 번째 URL (처음 100자):');
      console.log(storageUrlMatches[0].substring(0, 100) + '...');
    }

    // jobs 테이블 데이터 확인
    const hasJobsData = html.includes('"jobs"') || html.includes('job') || html.includes('매니저');
    console.log('\n공고 데이터 포함:', hasJobsData ? '예' : '아니오');

    console.log('\n[최종 검증] ╔════════════════════════════════════════╗');
    console.log('[최종 검증] ║           검증 완료              ║');
    console.log('[최종 검증] ╚════════════════════════════════════════╝\n');

    if (imgMatches.length > 0 && storageUrlMatches.length > 0) {
      console.log('✅ /jobs 페이지에서 이미지가 정상 렌더링됩니다!');
    } else {
      console.log('⚠️  이미지 렌더링 확인 필요');
    }
  });
});

req.on('error', (err) => {
  console.error('❌ 요청 실패:', err.message);
});
