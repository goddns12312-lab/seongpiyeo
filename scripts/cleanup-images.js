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

async function cleanupImages() {
  console.log('🧹 이미지 정리 시작\n');

  // 제외할 이미지 URL 패턴
  const excludePatterns = [
    'logo',
    'banner',
    'ad',
    'thumb',
    'icon',
    'common',
    'org_image',
    'profile',
    'avatar',
    'default',
    '피씨',
    'pccheongguk',
    'picci'
  ];

  const isExcludedImage = (url) => {
    const lowerUrl = url.toLowerCase();
    return excludePatterns.some(pattern => lowerUrl.includes(pattern.toLowerCase()));
  };

  try {
    // 모든 listing_images 조회
    const { data: allImages, error: fetchError } = await supabase
      .from('listing_images')
      .select('id, listing_id, url, is_primary, order_num')
      .order('listing_id');

    if (fetchError) throw fetchError;

    console.log(`총 ${allImages.length}개 이미지 발견\n`);

    // listing_id별로 그룹화
    const imagesByListing = {};
    allImages.forEach(img => {
      if (!imagesByListing[img.listing_id]) {
        imagesByListing[img.listing_id] = [];
      }
      imagesByListing[img.listing_id].push(img);
    });

    let totalDeleted = 0;
    let totalKept = 0;

    // 각 매물별로 처리
    for (const [listingId, images] of Object.entries(imagesByListing)) {
      console.log(`\n📦 Listing ${listingId.substring(0, 8)}...`);
      console.log(`   현재 이미지: ${images.length}개`);

      const toDelete = [];
      const toKeep = [];

      images.forEach((img, idx) => {
        const isExcluded = isExcludedImage(img.url);

        if (isExcluded) {
          toDelete.push(img.id);
          console.log(`   ❌ 제외: ${img.url.substring(img.url.lastIndexOf('/') + 1)}`);
        } else {
          toKeep.push(img);
          console.log(`   ✅ 유지: ${img.url.substring(img.url.lastIndexOf('/') + 1)}`);
        }
      });

      // 실제 이미지가 3개 미만이면 경고
      if (toKeep.length < 3) {
        console.log(`   ⚠️  경고: 실제 PC방 사진이 ${toKeep.length}개만 있습니다`);
      }

      // 제외 이미지 삭제
      if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('listing_images')
          .delete()
          .in('id', toDelete);

        if (deleteError) {
          console.error(`   ❌ 삭제 실패: ${deleteError.message}`);
        } else {
          console.log(`   🗑️  ${toDelete.length}개 이미지 삭제됨`);
          totalDeleted += toDelete.length;
        }
      }

      totalKept += toKeep.length;

      // thumbnail_url 업데이트 (첫 번째 유효한 이미지로)
      if (toKeep.length > 0) {
        const firstImage = toKeep[0];
        const { error: updateError } = await supabase
          .from('listings')
          .update({ thumbnail_url: firstImage.url })
          .eq('id', listingId);

        if (updateError) {
          console.error(`   ❌ thumbnail_url 업데이트 실패: ${updateError.message}`);
        } else {
          console.log(`   🖼️  thumbnail_url 업데이트됨`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 정리 완료');
    console.log('='.repeat(60));
    console.log(`✅ 유지된 이미지: ${totalKept}개`);
    console.log(`🗑️  삭제된 이미지: ${totalDeleted}개`);
    console.log('\n다음: node scripts/auto-scraper.js --test 1');

  } catch (err) {
    console.error('❌ 오류:', err.message);
    process.exit(1);
  }
}

cleanupImages();
