#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ 환경변수 오류');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// 제거할 URL 패턴
const removePatterns = [
  'logo', 'banner', 'ad', 'ads', 'thumb', 'icon', 'common',
  'org_image', 'jackpot', 'casino', 'pccheongguk', 'picci',
  '피씨천국', 'static', 'assets', '/c/', '광고', '배너'
];

function shouldRemoveByUrl(url) {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return removePatterns.some(pattern => lowerUrl.includes(pattern.toLowerCase()));
}

async function analyzeListings() {
  console.log('🔍 Listing Images 진단 시작\n');

  const { data: listings, error: listingsError } = await supabase
    .from('listings')
    .select('id, title, thumbnail_url')
    .order('created_at', { ascending: false });

  if (listingsError) {
    console.error('❌ 매물 조회 오류:', listingsError.message);
    process.exit(1);
  }

  if (!listings || listings.length === 0) {
    console.log('❌ 매물이 없습니다');
    process.exit(1);
  }

  console.log(`총 매물: ${listings.length}개\n`);

  let totalImages = 0;
  let toRemove = 0;
  let toKeep = 0;

  for (const listing of listings) {
    const { data: images, error: imgError } = await supabase
      .from('listing_images')
      .select('id, url, order_num')
      .eq('listing_id', listing.id)
      .order('order_num');

    if (imgError) {
      console.error(`❌ ${listing.title} - 이미지 조회 오류: ${imgError.message}`);
      continue;
    }

    if (!images || images.length === 0) {
      console.log(`⚠️  ${listing.title.substring(0, 30)} - 이미지 없음`);
      continue;
    }

    const fileName = listing.title.substring(0, 30);
    console.log(`\n📦 ${fileName} (ID: ${listing.id.substring(0, 8)}...)`);
    console.log(`   현재 이미지: ${images.length}개`);

    let removeCount = 0;
    let keepCount = 0;
    let firstKeepUrl = null;

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const imgFileName = img.url.split('/').pop();

      if (shouldRemoveByUrl(img.url)) {
        console.log(`   ❌ [${i + 1}] ${imgFileName}`);
        removeCount++;
        toRemove++;
      } else {
        console.log(`   ✅ [${i + 1}] ${imgFileName}`);
        if (!firstKeepUrl) firstKeepUrl = img.url;
        keepCount++;
        toKeep++;
      }
    }

    totalImages += images.length;

    console.log(`   → 유지: ${keepCount}개, 제거: ${removeCount}개`);

    if (keepCount > 0 && keepCount < 3) {
      console.log(`   ⚠️  경고: 유지된 이미지가 ${keepCount}개만 있습니다`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 진단 결과');
  console.log('='.repeat(70));
  console.log(`총 이미지: ${totalImages}개`);
  console.log(`제거 대상: ${toRemove}개`);
  console.log(`유지: ${toKeep}개`);
  if (totalImages > 0) {
    console.log(`제거 비율: ${((toRemove / totalImages) * 100).toFixed(1)}%`);
  }

  if (toRemove > 0) {
    console.log('\n✅ 다음 단계: node scripts/cleanup-listing-images.js');
  } else {
    console.log('\n✅ 정리된 상태입니다. 추가 작업 불필요.');
  }

  process.exit(0);
}

analyzeListings().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
