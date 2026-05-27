#!/usr/bin/env node

/**
 * 공고 상세페이지 직접 테스트
 * 데이터베이스의 기존 공고로 상세페이지 검증
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { chromium } = require('playwright');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const BASE_URL = 'http://localhost:3002';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  공고 상세페이지 직접 테스트                             ║');
console.log('║  기존 공고 → 상세페이지 로드 및 표시 검증              ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function test() {
  let browser;
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    // 1. 활성 공고 조회
    console.log('🔍 [1] 활성 공고 조회\n');

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !jobs || jobs.length === 0) {
      console.error('   ❌ 활성 공고를 찾을 수 없습니다');
      console.error('      먼저 /jobs/new에서 공고를 등록하세요');
      process.exit(1);
    }

    const job = jobs[0];
    console.log('   ✅ 공고 찾음');
    console.log('      Title:', job.title);
    console.log('      Slug:', job.slug);
    console.log('      ViewCount:', job.view_count, '\n');

    // 2. 브라우저로 상세페이지 로드
    console.log('🌐 [2] 상세페이지 로드\n');

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const detailUrl = `${BASE_URL}/jobs/${job.slug || job.id}`;
    console.log('   URL:', detailUrl);

    await page.goto(detailUrl, { waitUntil: 'networkidle' });
    const pageUrl = page.url();
    console.log('   로드됨:', pageUrl);

    // 404 여부 확인
    const is404 = await page.evaluate(() => {
      return document.body.textContent.includes('NOTFOUND') ||
             document.body.textContent.includes('찾을 수 없습니다') ||
             document.body.textContent.includes('404');
    });

    if (is404) {
      console.error('   ❌ 상세페이지를 찾을 수 없습니다');
      const content = await page.textContent('body');
      console.error('   응답:', content.substring(0, 100));
      process.exit(1);
    }

    console.log('   ✅ 페이지 로드 성공\n');

    // 3. 페이지 내용 검증
    console.log('📄 [3] 페이지 내용 검증\n');

    const pageContent = await page.textContent('body');

    const checks = [
      { name: '제목', value: job.title, check: pageContent.includes(job.title) },
      { name: '설명', value: job.description.substring(0, 30), check: pageContent.includes(job.description.substring(0, 30)) },
      { name: '지역', value: job.region, check: pageContent.includes(job.region) },
      { name: '연락처', value: job.contact || 'N/A', check: job.contact ? pageContent.includes(job.contact) : true },
    ];

    checks.forEach(c => {
      console.log('   ' + (c.check ? '✅' : '❌') + ' ' + c.name + ': ' + c.value);
    });

    const allChecksPassed = checks.every(c => c.check);

    if (!allChecksPassed) {
      console.log('\n   ⚠️  일부 내용이 표시되지 않음\n');
    } else {
      console.log('\n   ✅ 모든 내용 확인됨\n');
    }

    // 4. 이미지 확인
    console.log('🖼️  [4] 이미지 표시 확인\n');

    const images = await page.locator('img').count();
    console.log('   이미지 개수:', images);

    if (images > 0) {
      console.log('   ✅ 이미지 표시됨\n');
    } else {
      console.log('   ⚠️  이미지가 없거나 로드 안 됨\n');
    }

    // 5. 조회수 증가 확인 (API 레벨)
    console.log('👁️  [5] 조회수 증가 확인\n');

    const { data: updatedJob } = await supabase
      .from('jobs')
      .select('view_count')
      .eq('id', job.id)
      .single();

    const newViewCount = updatedJob?.view_count || 0;
    const viewCountIncreased = newViewCount > job.view_count;

    console.log('   이전 조회수:', job.view_count);
    console.log('   새 조회수:', newViewCount);
    console.log('   ' + (viewCountIncreased ? '✅' : '⚠️ ') + ' 조회수 증가: ' + (viewCountIncreased ? '✓' : '△'));
    console.log();

    // 최종 결과
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  최종 검증 결과                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    if (allChecksPassed && !is404 && images > 0) {
      console.log('🎉 최종 결과: ✅ 모든 항목 통과!\n');
      console.log('   → /jobs/{slug} 상세페이지가 정상 작동합니다\n');
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
