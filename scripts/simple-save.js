#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function saveListings() {
  try {
    console.log('📂 백업 파일 읽기...\n');

    const jsonPath = path.join(__dirname, 'output', 'listings.json');
    const listings = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    console.log(`📊 ${listings.length}개 매물 저장 시작...\n`);

    let saved = 0;
    let failed = 0;

    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];

      try {
        if ((i + 1) % 100 === 0) {
          console.log(`[${i + 1}/${listings.length}] 진행 중...`);
        }

        // 가격 결정: premium > monthly_rent > deposit > 0
        const price = listing.premium || listing.monthly_rent || listing.deposit || 0;
        const priceType = listing.monthly_rent ? 'lease' : 'sale';

        const listingData = {
          title: listing.title,
          description: listing.description || listing.title,
          price_type: priceType,
          price: price,
          deposit: listing.deposit || null,
          monthly_rent: listing.monthly_rent || null,
          premium_price: listing.premium || null,
          region: listing.region, // 원본 region 그대로 사용
          address: listing.location || null,
          thumbnail_url: null, // 이미지는 나중에
          main_image_url: null,
          status: 'active',
          view_count: 0,
          idx: listing.idx,
          source_url: listing.source_url,
          created_at: listing.crawled_at || new Date().toISOString(),
        };

        const { error } = await supabase
          .from('listings')
          .insert([listingData]);

        if (error) {
          if (failed === 0) {
            console.log(`  첫 에러: ${error.message}`);
          }
          failed++;
          continue;
        }

        saved++;

      } catch (err) {
        failed++;
      }
    }

    console.log(`\n✅ 완료:`);
    console.log(`  저장: ${saved}개`);
    console.log(`  실패: ${failed}개`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

saveListings();
