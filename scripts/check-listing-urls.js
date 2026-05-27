/**
 * 매물의 이미지 URL 확인
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
    // 매물 조회
    const { data: listings } = await supabase
      .from('listings')
      .select('*')
      .limit(5);

    console.log('매물 정보:');
    listings?.forEach((listing, idx) => {
      console.log(`\n${idx + 1}. ${listing.title}`);
      console.log(`   - ID: ${listing.id}`);
      console.log(`   - Price: ${listing.price}`);
      console.log(`   - Description: ${listing.description?.substring(0, 50)}...`);
    });

    process.exit(0);
  } catch (err) {
    console.log('❌ 오류:', err.message);
    process.exit(1);
  }
}

check();
