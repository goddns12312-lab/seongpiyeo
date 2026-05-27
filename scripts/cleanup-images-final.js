#!/usr/bin/env node

const path = require('path');
const https = require('https');
const sharp = require('sharp');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = Buffer.alloc(0);
      res.on('data', chunk => { data = Buffer.concat([data, chunk]); });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function classifyImage(url) {
  try {
    const buffer = await downloadImage(url);
    const metadata = await sharp(buffer).metadata();
    const ratio = metadata.width / metadata.height;
    const area = metadata.width * metadata.height;

    // 배너: 매우 가로로 김
    if (ratio > 2.5 && metadata.height < 500) return 'banner';
    // 로고: 매우 작음 또는 정사각형
    if (area < 50000) return 'logo';
    if (ratio > 0.8 && ratio < 1.2 && metadata.width > 100 && metadata.width < 500) return 'logo';
    // 실제 사진: 일반 비율
    if ((ratio > 1.2 && ratio < 2.0) || (ratio > 0.5 && ratio < 1.0)) return 'real';
    // 기타
    return 'other';
  } catch (err) {
    return 'error';
  }
}

async function cleanupListing(listing) {
  const { data: images } = await supabase
    .from('listing_images')
    .select('id, url, order_num')
    .eq('listing_id', listing.id)
    .order('order_num');

  if (!images || images.length === 0) return { removed: 0, kept: 0 };

  const classified = [];

  // 모든 이미지 분류
  for (const img of images) {
    const category = await classifyImage(img.url);
    classified.push({ id: img.id, url: img.url, category });
  }

  // 제거할 ID 찾기
  const removeIds = classified
    .filter(img => img.category === 'banner' || img.category === 'logo')
    .map(img => img.id);

  const keepImages = classified.filter(img => img.category !== 'banner' && img.category !== 'logo');

  // DB에서 제거
  if (removeIds.length > 0) {
    await supabase
      .from('listing_images')
      .delete()
      .in('id', removeIds);
  }

  // main_image_url, thumbnail_url 업데이트
  if (keepImages.length > 0) {
    const firstImage = keepImages[0];
    await supabase
      .from('listings')
      .update({
        thumbnail_url: firstImage.url,
        main_image_url: firstImage.url
      })
      .eq('id', listing.id);
  }

  return { removed: removeIds.length, kept: keepImages.length };
}

async function main() {
  console.log('🧹 이미지 최종 정리 시작\n');

  const { data: listings } = await supabase
    .from('listings')
    .select('id, title')
    .order('created_at', { ascending: false });

  if (!listings || listings.length === 0) {
    console.log('❌ 매물이 없습니다');
    process.exit(1);
  }

  let totalRemoved = 0;
  let totalKept = 0;

  for (const listing of listings) {
    const fileName = listing.title.substring(0, 40);
    console.log(`\n📦 ${fileName} (${listing.id.substring(0, 8)}...)`);
    console.log(`   정리 중...`);

    try {
      const { removed, kept } = await cleanupListing(listing);
      totalRemoved += removed;
      totalKept += kept;

      if (removed > 0 || kept > 0) {
        console.log(`   ✅ 완료 - 제거: ${removed}개, 유지: ${kept}개`);
        if (kept < 3) {
          console.log(`   ⚠️  경고: 유지된 이미지가 ${kept}개만 있습니다`);
        }
      } else {
        console.log(`   ℹ️  이미지 없음`);
      }
    } catch (err) {
      console.error(`   ❌ 오류: ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 정리 완료');
  console.log('='.repeat(70));
  console.log(`🗑️  제거된 이미지: ${totalRemoved}개`);
  console.log(`✅ 유지된 이미지: ${totalKept}개`);
  console.log('\n💡 다음 단계:');
  console.log('1. npm run dev (dev server 재실행)');
  console.log('2. 브라우저 캐시 삭제 (Ctrl+Shift+Del)');
  console.log('3. localhost:3001 새로고침');
  console.log('4. 상세 페이지에서 이미지 확인');

  process.exit(0);
}

main().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
