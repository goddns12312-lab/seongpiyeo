#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function saveListings() {
  try {
    // JSON 파일 읽기
    const jsonPath = path.join(__dirname, 'output', 'final-listings.json');
    const listings = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    console.log(`📊 ${listings.length}개 매물 저장 시작...\n`);

    let imported = 0;
    let skipped = 0;

    for (let idx = 0; idx < listings.length; idx++) {
      const listing = listings[idx];

      try {
        // source_url이 같은 매물이 있는지 확인
        const source_url = `https://www.xn--3e0b036btifksj.com/${listing.region}/${idx}`;

        const { data: existing } = await supabase
          .from('listings')
          .select('id')
          .eq('source_url', source_url)
          .limit(1);

        if (existing && existing.length > 0) {
          skipped++;
          continue;
        }

        // 새 매물 저장
        const { error } = await supabase
          .from('listings')
          .insert([
            {
              title: listing.title,
              description: `PC천국에서 수집한 매물`,
              price_type: 'sale',
              price: 1000, // 기본값
              region: listing.region,
              source_url: source_url,
              thumbnail_url: listing.imageUrl || null,
              main_image_url: listing.imageUrl || null,
              status: 'active',
              view_count: 0,
            },
          ]);

        if (error) {
          console.error(`❌ [${idx + 1}/${listings.length}] 저장 실패:`, error.message);
          continue;
        }

        imported++;
        if ((idx + 1) % 10 === 0) {
          console.log(`✅ [${idx + 1}/${listings.length}] ${listing.title.substring(0, 30)}`);
        }

      } catch (err) {
        console.error(`❌ 처리 중 에러:`, err.message);
      }
    }

    console.log(`\n📊 완료:`);
    console.log(`  ✅ 추가: ${imported}개`);
    console.log(`  ⏭️  중복 제외: ${skipped}개`);
    console.log(`  📋 총: ${listings.length}개`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

saveListings();
