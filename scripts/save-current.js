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

async function saveListings() {
  try {
    const jsonPath = path.join(__dirname, 'output', 'final-listings.json');
    const listings = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    console.log(`\n📊 ${listings.length}개 매물 저장 중...\n`);

    const now = new Date();
    let saved = 0;

    // 지역별 그룹화
    const byRegion = {};
    listings.forEach(l => {
      if (!byRegion[l.region]) byRegion[l.region] = [];
      byRegion[l.region].push(l);
    });

    // 지역별 처리
    for (const [region, regionListings] of Object.entries(byRegion)) {
      console.log(`📍 [${region}] ${regionListings.length}개 저장`);

      for (let idx = 0; idx < regionListings.length; idx++) {
        const listing = regionListings[idx];

        // 타임스탬프: 첫 번째 항목이 최신
        const minutesBack = regionListings.length - 1 - idx;
        const createdAt = new Date(now.getTime() - minutesBack * 60000);

        const { error } = await supabase
          .from('listings')
          .insert([{
            title: listing.title,
            description: listing.title,
            price_type: 'sale',
            price: 1000,
            region: listing.region,
            source_url: `https://pcbang.local/${listing.region}/${idx}`,
            thumbnail_url: listing.imageUrl || null,
            main_image_url: listing.imageUrl || null,
            status: 'active',
            view_count: 0,
            created_at: createdAt.toISOString(),
          }]);

        if (!error) {
          saved++;
        }
      }
    }

    console.log(`\n✅ 완료: ${saved}개 저장됨`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

saveListings();
