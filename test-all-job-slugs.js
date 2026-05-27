#!/usr/bin/env node

const { chromium } = require('playwright');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function test() {
  console.log('\n🔍 모든 공고 슬러그 확인\n');

  try {
    // Supabase에서 직접 쿼리
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    console.log('📊 Supabase에서 활성 공고 조회...\n');

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, slug, title, region, category, status')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ 조회 실패:', error.message);
      return;
    }

    console.log(`✅ ${jobs.length}개 공고 발견:\n`);

    jobs.forEach((job, idx) => {
      console.log(`${idx + 1}. slug: "${job.slug}"`);
      console.log(`   ID: ${job.id}`);
      console.log(`   제목: ${job.title}`);
      console.log(`   지역: ${job.region}`);
      console.log(`   카테고리: ${job.category}`);
      console.log();
    });

    // URL 테스트
    console.log('🔗 URL 테스트:\n');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    for (const job of jobs.slice(0, 3)) {
      const url = `http://localhost:3002/jobs/${encodeURIComponent(job.slug)}`;
      console.log(`테스트: ${url}`);
      try {
        const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 5000 });
        const status = response?.status() || 'unknown';
        console.log(`  상태: ${status}`);
      } catch (err) {
        console.log(`  오류: ${err.message}`);
      }
    }

    await browser.close();

  } catch (err) {
    console.error('❌ 오류:', err.message);
  }
}

test();
