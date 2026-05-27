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
  if (key && value) env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function resetRegion(regionName) {
  console.log(`\n🗑️  ${regionName} 데이터 초기화\n`);

  try {
    // 해당 지역의 모든 listings 조회
    const { data: listings, error: selectError } = await supabase
      .from('listings')
      .select('id')
      .eq('region', regionName);

    if (selectError) {
      console.error('❌ 조회 실패:', selectError.message);
      process.exit(1);
    }

    if (!listings || listings.length === 0) {
      console.log(`⚠️  ${regionName}에 매물이 없습니다\n`);
      return;
    }

    console.log(`📊 삭제할 매물: ${listings.length}개\n`);

    // 각 listing에 대해 images 삭제 후 listing 삭제
    for (const listing of listings) {
      // listing_images 삭제
      await supabase
        .from('listing_images')
        .delete()
        .eq('listing_id', listing.id);

      // listing 삭제
      await supabase
        .from('listings')
        .delete()
        .eq('id', listing.id);

      console.log(`✅ 삭제됨`);
    }

    console.log(`\n✅ ${regionName} 초기화 완료 (${listings.length}개 삭제)\n`);

  } catch (err) {
    console.error('❌ 오류:', err.message);
    process.exit(1);
  }
}

const region = process.argv[2] || '강원도';
resetRegion(region);
