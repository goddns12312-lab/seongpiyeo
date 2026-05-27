#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const PcbangkingdomAdapter = require('./adapters/pcbangkingdom-adapter');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function fixAllTitles() {
  console.log('🔧 모든 매물의 title을 올바르게 수정\n');

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const adapter = new PcbangkingdomAdapter();

    // DB에서 모든 listings 조회
    console.log('📋 Supabase에서 모든 매물 조회...');
    const { data: allListings, error: fetchError } = await supabase
      .from('listings')
      .select('id, idx, title')
      .not('idx', 'is', null);

    if (fetchError) throw fetchError;

    console.log(`✅ 총 ${allListings.length}개 매물 조회됨\n`);

    // 목록 페이지에서 모든 링크 추출
    console.log('🔄 목록 페이지에서 올바른 제목 추출 중...');

    const page = await adapter.setup(browser);
    await adapter.navigateToPage(page, 1);
    const links = await adapter.getPostLinks(page, 1);

    console.log(`✅ ${links.length}개 링크에서 제목 추출 완료\n`);

    // idx → title 맵 생성
    const titleMap = new Map();
    links.forEach(link => {
      titleMap.set(link.idx, link.title);
    });

    // 업데이트할 항목들
    console.log('🔍 업데이트 필요한 항목 확인:');
    console.log('═'.repeat(80));

    let updateCount = 0;
    const updates = [];

    for (const listing of allListings) {
      if (titleMap.has(listing.idx)) {
        const correctTitle = titleMap.get(listing.idx);
        if (listing.title !== correctTitle) {
          console.log(`\nidx: ${listing.idx}`);
          console.log(`  현재: "${listing.title}"`);
          console.log(`  수정: "${correctTitle}"`);
          updates.push({ id: listing.id, newTitle: correctTitle });
          updateCount++;
        }
      }
    }

    console.log('\n═'.repeat(80));
    console.log(`\n업데이트 필요: ${updateCount}개\n`);

    if (updateCount === 0) {
      console.log('✅ 모든 제목이 이미 올바릅니다!');
      await page.context().close();
      await browser.close();
      return;
    }

    // 배치 업데이트
    console.log('💾 Supabase 업데이트 중...\n');

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('listings')
        .update({ title: update.newTitle })
        .eq('id', update.id);

      if (updateError) {
        console.log(`  ❌ ${update.id}: ${updateError.message}`);
      } else {
        console.log(`  ✅ ${update.id}: "${update.newTitle}"`);
      }
    }

    console.log(`\n✅ ${updateCount}개 제목 업데이트 완료!`);

    await page.context().close();
  } catch (error) {
    console.error(`\n❌ 오류: ${error.message}`);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

fixAllTitles();
