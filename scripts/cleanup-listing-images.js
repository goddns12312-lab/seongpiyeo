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

async function cleanupListings() {
  console.log('🧹 Listing Images 정리 시작\n');

  const { data: listings } = await supabase
    .from('listings')
    .select('id, title')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (!listings || listings.length === 0) {
    console.log('❌ 활성 매물이 없습니다');
    process.exit(1);
  }

  let totalDeleted = 0;
  let totalKept = 0;
  let updatedListings = 0;

  for (const listing of listings) {
    const { data: images } = await supabase
      .from('listing_images')
      .select('*')
      .eq('listing_id', listing.id)
      .order('order_num');

    if (!images || images.length === 0) continue;

    const toDelete = [];
    const toKeep = [];

    // 이미지 분류
    for (const img of images) {
      if (shouldRemoveByUrl(img.url)) {
        toDelete.push(img.id);
      } else {
        toKeep.push(img);
      }
    }

    // 삭제 처리
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('listing_images')
        .delete()
        .in('id', toDelete);

      if (deleteError) {
        console.error(`❌ ${listing.title} - 삭제 실패: ${deleteError.message}`);
      } else {
        console.log(`\n✅ ${listing.title.substring(0, 30)}`);
        console.log(`   🗑️  ${toDelete.length}개 이미지 삭제됨`);
        totalDeleted += toDelete.length;
        updatedListings++;
      }
    }

    totalKept += toKeep.length;

    // 경고: 유지된 이미지가 3개 미만
    if (toKeep.length > 0 && toKeep.length < 3) {
      console.log(`   ⚠️  경고: 유지된 이미지가 ${toKeep.length}개만 있습니다`);
    }

    // main_image_url과 thumbnail_url 업데이트
    if (toKeep.length > 0) {
      const firstImage = toKeep[0];
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          thumbnail_url: firstImage.url,
          main_image_url: firstImage.url
        })
        .eq('id', listing.id);

      if (updateError) {
        console.error(`   ❌ URL 업데이트 실패: ${updateError.message}`);
      } else {
        console.log(`   🖼️  main_image_url, thumbnail_url 업데이트됨`);
      }
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 정리 완료');
  console.log('='.repeat(70));
  console.log(`✅ 유지된 이미지: ${totalKept}개`);
  console.log(`🗑️  삭제된 이미지: ${totalDeleted}개`);
  console.log(`수정된 매물: ${updatedListings}개`);

  if (updatedListings > 0) {
    console.log('\n💡 다음 단계:');
    console.log('1. 브라우저 캐시 삭제 (Ctrl+Shift+Del)');
    console.log('2. npm run dev 재실행');
    console.log('3. 상세 페이지에서 이미지 확인');
  }

  process.exit(0);
}

cleanupListings().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
