/**
 * 이미지가 없는 매물에 기본 이미지 추가
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// PC천국 매물 대표 이미지들 (각 지역별 또는 일반)
const DEFAULT_IMAGES = [
  'https://cdn.imweb.me/upload/S2019122064395b58816bc/afa6a1457c619.png', // PC천국 기본 로고
];

async function addImages() {
  try {
    console.log('이미지 없는 매물 확인 중...');

    // 1. 이미지 없는 매물 찾기
    const { data: listings } = await supabase
      .from('listings')
      .select('id, title')
      .order('created_at', { ascending: false });

    console.log(`총 매물: ${listings?.length}`);

    // 2. 각 매물마다 이미지 확인
    let addedCount = 0;
    for (const listing of listings || []) {
      const { data: images } = await supabase
        .from('listing_images')
        .select('id')
        .eq('listing_id', listing.id);

      if (!images || images.length === 0) {
        // 3. 이미지 추가
        const { error } = await supabase
          .from('listing_images')
          .insert([
            {
              listing_id: listing.id,
              url: DEFAULT_IMAGES[0],
              is_primary: true,
              order_num: 0,
            },
          ]);

        if (!error) {
          addedCount++;
          console.log(`✓ ${listing.title}에 기본 이미지 추가`);
        } else {
          console.log(`✗ ${listing.title}: ${error.message}`);
        }
      }
    }

    console.log(`\n완료: ${addedCount}개 매물에 기본 이미지 추가됨`);
    process.exit(0);
  } catch (err) {
    console.log('❌ 오류:', err.message);
    process.exit(1);
  }
}

addImages();
