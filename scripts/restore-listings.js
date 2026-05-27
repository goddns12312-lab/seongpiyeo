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
      console.log(`    ⚠️  이미지 파일 없음: ${localPath}`);
      return null;
    }

    const fileName = path.basename(localPath);
    const remotePath = `${remoteFolder}/${fileName}`;

    // Check if image already exists in storage
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
      console.log(`    ❌ 업로드 실패: ${fileName}`);
      return null;
    }

    const { data } = supabase.storage
      .from('listings')
      .getPublicUrl(remotePath);
    return data.publicUrl;
  } catch (err) {
    console.log(`    ❌ 이미지 처리 실패: ${err.message}`);
    return null;
  }
}

async function restoreListings() {
  try {
    console.log('📂 백업 파일 읽기...\n');

    const jsonPath = path.join(__dirname, 'output', 'listings.json');
    if (!fs.existsSync(jsonPath)) {
      console.error('❌ 백업 파일이 없습니다:', jsonPath);
      process.exit(1);
    }

    const backupListings = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    console.log(`📊 백업 매물: ${backupListings.length}개\n`);

    // Get all existing listings by source_url
    console.log('🔍 기존 데이터 확인 중...');
    const { data: existingListings, error: selectError } = await supabase
      .from('listings')
      .select('id, source_url, idx');

    if (selectError) {
      console.error('❌ DB 조회 실패:', selectError.message);
      process.exit(1);
    }

    const existingUrls = new Set(existingListings?.map(l => l.source_url) || []);
    const existingIdxs = new Set(existingListings?.map(l => l.idx) || []);
    console.log(`✅ 기존 매물: ${existingIdxs.size}개\n`);

    let skipped = 0;
    let restored = 0;
    let failed = 0;

    // Restore each listing
    for (let i = 0; i < backupListings.length; i++) {
      const listing = backupListings[i];

      // Skip if already exists (by source_url or idx)
      if (existingUrls.has(listing.source_url) || existingIdxs.has(listing.idx)) {
        skipped++;
        continue;
      }

      try {
        console.log(`[${i + 1}/${backupListings.length}] 복구: ${listing.title.substring(0, 40)}`);

        // Upload images
        let thumbnailUrl = null;
        let mainImageUrl = null;
        const imageUrls = [];

        if (listing.images && listing.images.length > 0) {
          console.log(`  📷 이미지 ${listing.images.length}개 업로드 중...`);

          for (let imgIdx = 0; imgIdx < listing.images.length; imgIdx++) {
            const imagePath = listing.images[imgIdx];
            const imageUrl = await uploadImage(
              imagePath,
              `listings/${listing.idx}`
            );

            if (imageUrl) {
              imageUrls.push(imageUrl);
              if (imgIdx === 0) {
                thumbnailUrl = imageUrl;
                mainImageUrl = imageUrl;
              }
            }
          }

          console.log(`  ✅ ${imageUrls.length}개 업로드됨`);
        }

        // Prepare listing data
        const listingData = {
          title: listing.title,
          description: listing.description || '',
          price_type: listing.monthly_rent ? 'lease' : 'sale',
          price: listing.premium || listing.monthly_rent || listing.deposit || 0,
          deposit: listing.deposit || null,
          monthly_rent: listing.monthly_rent || null,
          region: listing.region,
          district: listing.location?.split(' ')[1] || null,
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
          created_at: listing.crawled_at || new Date().toISOString(),
        };

        // Insert listing
        const { data: insertedListing, error: insertError } = await supabase
          .from('listings')
          .insert([listingData])
          .select('id');

        if (insertError) {
          console.log(`  ❌ DB 저장 실패: ${insertError.message}`);
          failed++;
          continue;
        }

        const listingId = insertedListing[0].id;

        // Insert images
        if (imageUrls.length > 0) {
          const imageRecords = imageUrls.map((url, idx) => ({
            listing_id: listingId,
            url: url,
            order_num: idx,
          }));

          const { error: imageError } = await supabase
            .from('listing_images')
            .insert(imageRecords);

          if (imageError) {
            console.log(`  ⚠️  이미지 레코드 저장 실패: ${imageError.message}`);
          }
        }

        restored++;
        console.log(`  ✅ 복구됨`);

        // Rate limiting
        if ((i + 1) % 10 === 0) {
          console.log(`⏱️  잠시 대기...\n`);
          await sleep(1000);
        }

      } catch (err) {
        console.log(`  ❌ 처리 중 에러: ${err.message}`);
        failed++;
      }
    }

    console.log(`\n✅ 복구 완료:`);
    console.log(`  ✅ 복구됨: ${restored}개`);
    console.log(`  ⏭️  중복 제외: ${skipped}개`);
    console.log(`  ❌ 실패: ${failed}개`);
    console.log(`  📋 총 백업: ${backupListings.length}개`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

restoreListings();
