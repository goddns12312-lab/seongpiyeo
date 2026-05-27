#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function saveListings() {
  try {
    const jsonPath = path.join(__dirname, 'output', 'final-listings.json');
    const listings = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    console.log(`\n📊 ${listings.length}개 매물 저장 시작...\n`);

    const now = new Date();
    let totalSaved = 0;

    // Group by region for timestamp ordering
    const byRegion = {};
    listings.forEach(l => {
      if (!byRegion[l.region]) byRegion[l.region] = [];
      byRegion[l.region].push(l);
    });

    // Process each region
    for (const [region, regionListings] of Object.entries(byRegion)) {
      console.log(`📍 [${region}] ${regionListings.length}개 처리...`);

      for (let idx = 0; idx < regionListings.length; idx++) {
        const listing = regionListings[idx];

        try {
          // Create timestamps: first item is newest, last item is oldest
          const minutesBack = regionListings.length - 1 - idx;
          const createdAt = new Date(now.getTime() - minutesBack * 60000);

          const listingData = {
            title: listing.title,
            description: listing.title, // Use title as description for now
            price_type: 'sale',
            price: 1000, // Default price
            region: listing.region,
            source_url: listing.detail_url || listing.source_url,
            thumbnail_url: listing.imageUrl || null,
            main_image_url: listing.imageUrl || null,
            status: 'active',
            view_count: 0,
            created_at: createdAt.toISOString(),
          };

          const { error } = await supabase
            .from('listings')
            .insert([listingData]);

          if (error) {
            console.error(`  ❌ 저장 실패: ${error.message}`);
            continue;
          }

          totalSaved++;

          if ((totalSaved) % 20 === 0) {
            console.log(`  ✅ ${totalSaved}개 저장됨`);
          }

        } catch (err) {
          console.error(`  ❌ 처리 중 에러:`, err.message);
        }
      }
    }

    console.log(`\n✅ 완료: ${totalSaved}개 저장됨`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

saveListings();
