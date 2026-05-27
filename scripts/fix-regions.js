#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function fixRegions() {
  try {
    console.log('📂 백업 파일 읽기...\n');

    const jsonPath = path.join(__dirname, 'output', 'listings.json');
    const listings = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    // idx를 key로 하는 맵 생성
    const idxMap = {};
    listings.forEach(l => {
      idxMap[l.idx] = {
        region: l.region,
        premium: l.premium,
        monthly_rent: l.monthly_rent,
        deposit: l.deposit,
        description: l.description,
      };
    });

    console.log(`🔄 ${Object.keys(idxMap).length}개 매물 정보 업데이트 중...\n`);

    // 데이터베이스의 모든 매물 조회
    let offset = 0;
    let updated = 0;
    let notFound = 0;

    while (true) {
      const { data: batch } = await supabase
        .from('listings')
        .select('id, idx')
        .range(offset, offset + 999);

      if (!batch || batch.length === 0) break;

      for (const item of batch) {
        if (idxMap[item.idx]) {
          const info = idxMap[item.idx];
          const price = info.premium || info.monthly_rent || info.deposit || 0;
          const priceType = info.monthly_rent ? 'lease' : 'sale';

          const { error } = await supabase
            .from('listings')
            .update({
              region: info.region,
              price: price,
              price_type: priceType,
              deposit: info.deposit,
              monthly_rent: info.monthly_rent,
              premium_price: info.premium,
              description: info.description,
            })
            .eq('id', item.id);

          if (!error) {
            updated++;
            if (updated % 100 === 0) {
              console.log(`  ✅ ${updated}개 업데이트됨`);
            }
          }
        } else {
          notFound++;
        }
      }

      offset += 1000;
    }

    console.log(`\n✅ 완료:`);
    console.log(`  업데이트: ${updated}개`);
    console.log(`  찾을 수 없음: ${notFound}개`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixRegions();
