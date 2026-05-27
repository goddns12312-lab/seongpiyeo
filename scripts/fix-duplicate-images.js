#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 환경변수 로드
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function fixDuplicateImages() {
  console.log('\n🖼️  중복 이미지 검사 및 정리 시작\n');

  try {
    // 1. 모든 이미지 조회
    const { data: allImages, error: fetchError } = await supabase
      .from('listing_images')
      .select('id, listing_id, url, order_num');

    if (fetchError) {
      console.error('❌ 이미지 조회 실패:', fetchError.message);
      process.exit(1);
    }

    console.log(`📊 총 이미지: ${allImages?.length}개\n`);

    // 2. URL별 중복 분석
    const urlMap = {};
    allImages?.forEach(img => {
      if (!urlMap[img.url]) {
        urlMap[img.url] = [];
      }
      urlMap[img.url].push(img);
    });

    const duplicateUrls = Object.entries(urlMap).filter(([url, imgs]) => imgs.length > 1);

    console.log(`🔍 분석 결과:`);
    console.log(`   고유 이미지 URL: ${Object.keys(urlMap).length}개`);
    console.log(`   중복 URL: ${duplicateUrls.length}개\n`);

    if (duplicateUrls.length === 0) {
      console.log('✅ 중복 이미지가 없습니다!\n');
      return;
    }

    // 3. 중복 URL별 매물 조회
    console.log(`📋 중복 이미지 목록:\n`);
    const problemListings = new Set();

    for (const [url, images] of duplicateUrls.slice(0, 10)) {
      const listingIds = [...new Set(images.map(img => img.listing_id))];

      // 해당 매물들 정보 조회
      const { data: listings } = await supabase
        .from('listings')
        .select('id, idx, title')
        .in('id', listingIds);

      console.log(`URL: ${url.substring(50, 100)}...`);
      console.log(`중복 매물: ${listingIds.length}개`);

      listings?.forEach(listing => {
        console.log(`  - idx=${listing.idx} | ${listing.title.substring(0, 40)}`);
        problemListings.add(listing.id);
      });
      console.log('');
    }

    // 4. 정리 옵션 제시
    console.log('\n⚠️  중복 이미지 정리 옵션:\n');
    console.log('옵션 1: 이미지가 중복되는 매물 중 더 최신 매물 삭제');
    console.log('   → 같은 이미지를 가진 매물은 하나만 유지\n');

    console.log('옵션 2: 이미지가 없는 매물 삭제');
    console.log('   → 같은 이미지 매물 중 title/description/contact 비교\n');

    console.log('옵션 3: 상세 검토 후 수동 정리');
    console.log('   → 각 매물을 확인하고 결정\n');

    // 5. 자동 정리: 같은 이미지 + 같은 설명 = 중복
    if (process.argv.includes('--clean')) {
      console.log('🗑️  자동 정리 시작 (같은 이미지 + 같은 설명 = 중복)\n');

      const { data: allListings } = await supabase
        .from('listings')
        .select('id, idx, title, description, main_image_url, created_at')
        .eq('status', 'active');

      const imageToListings = {};
      allListings?.forEach(listing => {
        if (listing.main_image_url) {
          if (!imageToListings[listing.main_image_url]) {
            imageToListings[listing.main_image_url] = [];
          }
          imageToListings[listing.main_image_url].push(listing);
        }
      });

      let totalDeleted = 0;

      for (const [imageUrl, listings] of Object.entries(imageToListings)) {
        if (listings.length <= 1) continue;

        // 같은 이미지를 가진 매물들이 같은 설명을 가지는지 확인
        const firstDesc = listings[0].description;
        const allSameDesc = listings.every(l => l.description === firstDesc);

        if (allSameDesc && listings.length > 1) {
          // 최신 것만 유지하고 나머지 삭제
          const sorted = listings.sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
          );

          const toDelete = sorted.slice(1);

          for (const listing of toDelete) {
            // listing_images 삭제
            await supabase
              .from('listing_images')
              .delete()
              .eq('listing_id', listing.id);

            // listing 삭제
            const { error } = await supabase
              .from('listings')
              .delete()
              .eq('id', listing.id);

            if (!error) {
              console.log(`✅ 삭제: idx=${listing.idx} | ${listing.title.substring(0, 40)}`);
              totalDeleted++;
            }
          }
        }
      }

      console.log(`\n✨ 정리 완료: ${totalDeleted}개 매물 삭제됨\n`);

      // 최종 통계
      const { count: remainingCount } = await supabase
        .from('listings')
        .select('id', { count: 'exact' })
        .eq('status', 'active');

      console.log(`📊 결과:`);
      console.log(`   남은 매물: ${remainingCount}개\n`);
    } else {
      console.log('💡 자동 정리를 실행하려면:\n');
      console.log('   node scripts/fix-duplicate-images.js --clean\n');
    }

  } catch (error) {
    console.error('\n❌ 오류:', error.message);
    process.exit(1);
  }
}

fixDuplicateImages();
