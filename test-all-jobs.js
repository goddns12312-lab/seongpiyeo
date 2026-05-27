#!/usr/bin/env node

/**
 * 모든 공고 상세페이지 테스트
 */

const { chromium } = require('playwright');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const BASE_URL = 'http://localhost:3002';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function test() {
  let browser;

  console.log('\n🔍 모든 공고 상세페이지 테스트\n');

  try {
    // 1. 데이터베이스에서 모든 active jobs 조회
    console.log('1️⃣  Active jobs 조회...\n');
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, slug, title, status')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error || !jobs || jobs.length === 0) {
      console.log('❌ Jobs 조회 실패');
      return;
    }

    console.log(`✅ ${jobs.length}개의 active job 발견\n`);

    // 2. 각 job의 상세페이지 테스트
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    let passCount = 0;
    let failCount = 0;

    for (const job of jobs) {
      const url = `${BASE_URL}/jobs/${job.slug || job.id}`;

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 5000 });
        const content = await page.textContent('body');

        // Check for 404
        const is404 = content.includes('404') ||
                      content.includes('This page could not be found') ||
                      content.includes('NOTFOUND');

        if (is404) {
          console.log(`❌ ${job.slug || job.id}`);
          console.log(`   Title: ${job.title}`);
          console.log(`   URL: ${url}\n`);
          failCount++;
        } else {
          // Verify content
          const hasTitle = content.includes(job.title.substring(0, 20));
          if (hasTitle) {
            console.log(`✅ ${job.slug || job.id}`);
            passCount++;
          } else {
            console.log(`⚠️  ${job.slug || job.id} (콘텐츠 미확인)`);
            failCount++;
          }
        }
      } catch (err) {
        console.log(`❌ ${job.slug || job.id}`);
        console.log(`   Error: ${err.message}\n`);
        failCount++;
      }
    }

    await browser.close();

    console.log(`\n📊 결과:`);
    console.log(`✅ 성공: ${passCount}`);
    console.log(`❌ 실패: ${failCount}`);
    console.log(`📈 통과율: ${Math.round(passCount / (passCount + failCount) * 100)}%\n`);

    if (failCount === 0) {
      console.log('🎉 모든 공고 정상!\n');
    } else {
      console.log('⚠️  실패한 공고가 있습니다\n');
    }

  } catch (err) {
    console.error('❌ 테스트 실패:', err.message);
  }
}

test();
