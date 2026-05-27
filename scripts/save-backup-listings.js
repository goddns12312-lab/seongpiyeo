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

async function uploadImage(localPath, remoteFolder) {
  try {
    if (!fs.existsSync(localPath)) {
      return null;
    }

    const fileName = path.basename(localPath);
    const remotePath = `${remoteFolder}/${fileName}`;

    // Check if image already exists
    const { data: existing } = await supabase.storage
      .from('listings')
      .list(remoteFolder);

    if (existing?.some(f => f.name === fileName)) {
      const { data } = supabase.storage
        .from('listings')
        .getPublicUrl(remotePath);
      return data.publicUrl;
    }

    // Upload image
    const fileBuffer = fs.readFileSync(localPath);
    const { error: uploadError } = await supabase.storage
      .from('listings')
      .upload(remotePath, fileBuffer, { upsert: false });

    if (uploadError) {
      return null;
    }

    const { data } = supabase.storage
      .from('listings')
      .getPublicUrl(remotePath);
    return data.publicUrl;
  } catch (err) {
    return null;
  }
}

async function saveListings() {
  try {
    console.log('📂 백업 파일 읽기...\n');

    const jsonPath = path.join(__dirname, 'output', 'listings.json');
    const listings = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    console.log(`📊 ${listings.length}개 매물 저장 시작...\n`);

    let saved = 0;
    const now = new Date();

    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];

      try {
        console.log(`[${i + 1}/${listings.length}] ${listing.title.substring(0, 40)}`);

        // Upload images
        let thumbnailUrl = null;
        let mainImageUrl = null;

        if (listing.images && listing.images.length > 0) {
          for (let imgIdx = 0; imgIdx < listing.images.length; imgIdx++) {
            const imagePath = listing.images[imgIdx];
            const imageUrl = await uploadImage(imagePath, `listings/${listing.idx}`);

            if (imageUrl) {
              if (imgIdx === 0) {
                thumbnailUrl = imageUrl;
                mainImageUrl = imageUrl;
              }
            }
          }
        }

        // Prepare listing data - use proper price fields
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
          region: listing.region,
          district: listing.location ? listing.location.split(' ')[0] : null,
          address: listing.location || null,
          area_sqm: listing.size ? parseInt(listing.size) : null,
          thumbnail_url: thumbnailUrl,
          main_image_url: mainImageUrl,
          status: 'active',
          view_count: 0,
          idx: listing.idx,
          source_url: listing.source_url,
          source_name: listing.source_name || 'pcbangkingdom',
          contact: listing.contact || null,
          created_at: listing.crawled_at || new Date(now.getTime() - i * 60000).toISOString(),
        };

        const { error } = await supabase
          .from('listings')
          .insert([listingData]);

        if (error) {
          console.log(`  ❌ 저장 실패: ${error.message}`);
          continue;
        }

        saved++;
        console.log(`  ✅ 저장됨`);

        if ((i + 1) % 50 === 0) {
          console.log(`⏱️  잠시 대기...\n`);
          await sleep(1000);
        }

      } catch (err) {
        console.log(`  ❌ 에러: ${err.message}`);
      }
    }

    console.log(`\n✅ 완료: ${saved}/${listings.length}개 저장됨`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

saveListings();
