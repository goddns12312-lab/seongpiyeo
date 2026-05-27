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
    // 기존 데이터 삭제 (source_url이 https://www.xn--3e0b036btifksj.com/으로 시작하는 것들)
    console.log('🗑️  기존 데이터 정리 중...');
    const { data: existingListings } = await supabase
      .from('listings')
      .select('id')
      .ilike('source_url', 'https://www.xn--3e0b036btifksj.com/%');

    if (existingListings && existingListings.length > 0) {
      for (const item of existingListings) {
        await supabase
          .from('listings')
          .delete()
          .eq('id', item.id);
      }
      console.log(`  정리 완료: ${existingListings.length}개`);
    }

    // JSON 파일 읽기
    const jsonPath = path.join(__dirname, 'output', 'final-listings.json');
    const listings = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    console.log(`\n📊 ${listings.length}개 매물 저장 시작...\n`);

    const now = new Date();

    // 지역별로 그룹화
    const byRegion = {};
    listings.forEach(l => {
      if (!byRegion[l.region]) byRegion[l.region] = [];
      byRegion[l.region].push(l);
    });

    let totalImported = 0;

    // 각 지역별로 역순으로 처리 (최신 순서)
    for (const [region, regionListings] of Object.entries(byRegion)) {
      console.log(`📍 [${region}] ${regionListings.length}개 처리...`);

      for (let idx = 0; idx < regionListings.length; idx++) {
        const listing = regionListings[idx];

        try {
          // 각 매물마다 다른 created_at 설정 (역순)
          // 처음 것(인덱스 0)이 가장 최신, 마지막 것이 가장 오래된 것
          const minutesBack = regionListings.length - 1 - idx;
          const createdAt = new Date(now.getTime() - minutesBack * 60000);

          const source_url = `https://www.xn--3e0b036btifksj.com/${region}/${idx}`;

          const { error } = await supabase
            .from('listings')
            .insert([
              {
                title: listing.title,
                description: `PC천국에서 수집한 매물`,
                price_type: 'sale',
                price: 1000,
                region: listing.region,
                source_url: source_url,
                thumbnail_url: listing.imageUrl || null,
                main_image_url: listing.imageUrl || null,
                status: 'active',
                view_count: 0,
                created_at: createdAt.toISOString(),
              },
            ]);

          if (error) {
            console.error(`  ❌ 저장 실패:`, error.message);
            continue;
          }

          totalImported++;

          if ((totalImported) % 20 === 0) {
            console.log(`  ✅ ${totalImported}개 저장됨`);
          }

        } catch (err) {
          console.error(`  ❌ 처리 중 에러:`, err.message);
        }
      }
    }

    console.log(`\n✅ 완료: ${totalImported}개 저장됨`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

saveListings();
