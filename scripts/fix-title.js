#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const LISTING_ID = '2d306619-5854-4438-aa4d-c68d5d856e5b';

async function fixTitle() {
  console.log('🔧 Title 수정 프로세스 시작\n');

  try {
    // Step 1: DB에서 조회
    console.log('📍 Step 1: Supabase에서 해당 row 조회');
    const { data: listing, error } = await supabase
      .from('listings')
      .select('id, idx, title, description, source_url')
      .eq('id', LISTING_ID)
      .single();

    if (error) throw error;

    console.log(`   ✅ 조회 완료\n`);
    console.log(`   idx: ${listing.idx}`);
    console.log(`   title: ${listing.title}`);
    console.log(`   description (처음 100자): ${listing.description.substring(0, 100)}...`);
    console.log(`   source_url: ${listing.source_url || '(없음)'}\n`);

    // Step 2: 원본 페이지 접속
    console.log('📍 Step 2: 원본 상세페이지 재접속');

    const detailUrl = `https://www.xn--3e0b036btifksj.com/40/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&bmode=view&idx=${listing.idx}&t=board`;
    console.log(`   URL: ${detailUrl}\n`);

    let browser;
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(detailUrl, { waitUntil: 'networkidle' });
    console.log('   ✅ 페이지 로드 완료\n');

    // Step 3: 실제 제목 추출
    console.log('📍 Step 3: 실제 게시글 제목 추출');

    const titleData = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const lines = bodyText.split('\n');

      // "1. 매물업종"이 시작되기 직전의 텍스트를 찾음
      let titleLine = null;
      let itemStartIndex = -1;

      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();

        // "1. 매물업종" 찾기
        if (trimmed.match(/^1\.\s*매물업종\s*[:：]/)) {
          itemStartIndex = i;
          break;
        }
      }

      if (itemStartIndex > 0) {
        // 1번 항목 직전의 줄들을 역순으로 검색
        // 빈 줄들을 무시하고 가장 가까운 비어있지 않은 줄 찾기
        for (let i = itemStartIndex - 1; i >= 0; i--) {
          const line = lines[i].trim();
          if (line && line.length > 0 && line.length < 150) {
            // "루피****" 같은 닉네임, "[성인판매]" 같은 태그는 제외
            if (!line.match(/^\[/) && !line.includes('판매') && !line.match(/^\*+$/) && line.length > 3) {
              titleLine = line;
              break;
            }
          }
        }
      }

      return {
        found: !!titleLine,
        title: titleLine || '제목 없음',
        method: 'itemStartIndex'
      };
    });

    const actualTitle = titleData.title;
    console.log(`   추출된 실제 제목: "${actualTitle}"`);
    console.log(`   추출 방식: ${titleData.method}\n`);

    // Step 4-5: 제목 검증 및 정리
    console.log('📍 Step 4-5: 제목 검증 및 정리');

    let cleanedTitle = actualTitle;

    // "1. 매물업종"이 포함되어 있으면 그 앞까지만
    if (cleanedTitle.includes('1.') && cleanedTitle.includes('매물업종')) {
      cleanedTitle = cleanedTitle.split('1.')[0].trim();
    }

    // 뒤의 " N" suffix 제거
    cleanedTitle = cleanedTitle.replace(/\s+N\s*$/, '').trim();

    console.log(`   정리된 제목: "${cleanedTitle}"`);
    console.log(`   기존 제목: "${listing.title}"`);
    console.log(`   변경 필요: ${cleanedTitle !== listing.title ? 'YES' : 'NO'}\n`);

    // Step 6: Supabase 업데이트
    if (cleanedTitle !== listing.title) {
      console.log('📍 Step 6: Supabase 업데이트');
      const { error: updateError } = await supabase
        .from('listings')
        .update({ title: cleanedTitle })
        .eq('id', LISTING_ID);

      if (updateError) throw updateError;

      console.log(`   ✅ 업데이트 완료: "${cleanedTitle}"\n`);
    } else {
      console.log('📍 Step 6: 이미 올바른 제목입니다\n');
    }

    await context.close();
    await browser.close();

    // Step 7: 로직 수정 제안
    console.log('📍 Step 7: 로직 개선');
    console.log(`   현재: getPostLinks()에서 title 추출할 때 link.innerText 전체 사용`);
    console.log(`   문제: link 요소에 여러 줄이 포함되어 있음`);
    console.log(`   해결: 첫 번째 줄만 추출하도록 수정 필요\n`);

    console.log('✅ Title 수정 완료!');

  } catch (error) {
    console.error(`\n❌ 오류: ${error.message}`);
    process.exit(1);
  }
}

fixTitle();
