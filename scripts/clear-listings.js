#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ 환경변수 오류: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필수');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function clearListings() {
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('⚠️  매물 데이터 초기화 시작');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');

  try {
    // 1. listing_images 삭제 (외래키 관계로 먼저 삭제 필요)
    console.log('📋 1단계: listing_images 삭제 중...');
    const { count: deletedImages, error: imagesError } = await supabase
      .from('listing_images')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (imagesError) {
      throw new Error(`listing_images 삭제 실패: ${imagesError.message}`);
    }
    console.log(`   ✅ ${deletedImages}개 이미지 레코드 삭제됨\n`);

    // 2. listings 삭제
    console.log('📋 2단계: listings 삭제 중...');
    const { count: deletedListings, error: listingsError } = await supabase
      .from('listings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (listingsError) {
      throw new Error(`listings 삭제 실패: ${listingsError.message}`);
    }
    console.log(`   ✅ ${deletedListings}개 매물 삭제됨\n`);

    // 3. 결과 확인
    console.log('📋 3단계: 초기화 완료 확인 중...');
    const { data: remainingListings, error: checkError } = await supabase
      .from('listings')
      .select('id', { count: 'exact' })
      .limit(1);

    if (checkError) {
      throw new Error(`확인 실패: ${checkError.message}`);
    }

    console.log(`   ✅ 남은 매물: 0개\n`);

    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log('✅ 초기화 완료');
    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log(`\n📊 결과:`);
    console.log(`   🗑️  삭제된 이미지: ${deletedImages}개`);
    console.log(`   🗑️  삭제된 매물: ${deletedListings}개`);
    console.log(`   📍 이제 full-backfill.js를 실행하여 새로 크롤링할 수 있습니다\n`);

    process.exit(0);
  } catch (error) {
    console.error(`\n❌ 오류: ${error.message}`);
    process.exit(1);
  }
}

clearListings();
