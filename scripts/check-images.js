/**
 * 저장된 이미지 확인
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    // 매물 개수
    const { data: listings } = await supabase
      .from('listings')
      .select('id, title')
      .limit(1);

    console.log('총 매물 수:', listings?.length);

    // 이미지 개수
    const { data: images } = await supabase
      .from('listing_images')
      .select('id, listing_id, url')
      .limit(10);

    console.log('\n저장된 이미지:');
    if (images && images.length > 0) {
      console.log(`✓ ${images.length}개 이미지 발견`);
      images.forEach((img, idx) => {
        console.log(`${idx + 1}. listing_id=${img.listing_id}, url=${img.url?.substring(0, 50)}...`);
      });
    } else {
      console.log('❌ 이미지가 없습니다!');
    }

    process.exit(0);
  } catch (err) {
    console.log('❌ 오류:', err.message);
    process.exit(1);
  }
}

check();
