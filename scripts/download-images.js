#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function uploadListingImages() {
  try {
    console.log('📥 매물 이미지 다운로드 및 업로드 시작\n');

    // 데이터베이스에서 모든 매물 조회 (모든 status)
    const { data: listings, error: selectError } = await supabase
      .from('listings')
      .select('id, title, main_image_url')
      .limit(1000);

    if (selectError) {
      console.error('❌ 조회 실패:', selectError.message);
      return;
    }

    if (!listings || listings.length === 0) {
      console.log('✅ 모든 매물에 이미지가 있습니다\n');
      return;
    }

    console.log(`📊 ${listings.length}개 매물 이미지 다운로드 필요\n`);

    // detailed-listings.json 로드 (원본 URL 참고)
    const detailedPath = path.join(__dirname, 'output', 'detailed-listings.json');
    const detailedListings = JSON.parse(fs.readFileSync(detailedPath, 'utf-8'));

    const urlMap = {};
    detailedListings.forEach(listing => {
      if (listing.images && listing.images.length > 0) {
        urlMap[listing.title] = listing.images;
      }
    });

    let uploaded = 0;
    let failed = 0;

    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];
      const imageUrls = urlMap[listing.title];

      if (!imageUrls || imageUrls.length === 0) {
        console.log(`  ⚠️  [${i+1}] ${listing.title.slice(0, 30)} - 이미지 없음`);
        failed++;
        continue;
      }

      try {
        // 첫 번째 이미지만 다운로드
        const imageUrl = imageUrls[0];
        console.log(`  ⏳ [${i+1}] ${listing.title.slice(0, 30)}...`);

        let imageBuffer;
        try {
          imageBuffer = await downloadImage(imageUrl);
        } catch (downloadErr) {
          console.log(`     ❌ 다운로드 실패: ${downloadErr.message}`);
          failed++;
          continue;
        }

        // Supabase Storage에 업로드
        const filename = `listing-${listing.id}-0.jpg`;
        console.log(`     📤 업로드 중: ${filename}`);

        const { data, error: uploadError } = await supabase
          .storage
          .from('listings')
          .upload(`images/${listing.id}/${filename}`, imageBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          console.log(`     ❌ 업로드 실패: ${uploadError.message} (URL: ${imageUrl.slice(0, 50)}...)`);
          failed++;
          continue;
        }

        // Storage URL 생성
        const { data: { publicUrl } } = supabase
          .storage
          .from('listings')
          .getPublicUrl(`images/${listing.id}/${filename}`);

        console.log(`     🔗 URL: ${publicUrl.slice(0, 60)}...`);

        // 데이터베이스 업데이트
        const { error: updateError } = await supabase
          .from('listings')
          .update({ main_image_url: publicUrl })
          .eq('id', listing.id);

        if (updateError) {
          console.log(`     ❌ DB 업데이트 실패: ${updateError.message}`);
          failed++;
        } else {
          uploaded++;
          console.log(`     ✅ 완료`);
        }

        if ((uploaded + failed) % 50 === 0) {
          console.log(`  📊 ${uploaded + failed}개 처리됨 (성공: ${uploaded}, 실패: ${failed})\n`);
        }

      } catch (e) {
        console.log(`     ❌ 예외 에러: ${e.message}`);
        failed++;
      }

      // Rate limiting
      await new Promise(r => setTimeout(r, 200));
    }

    console.log(`\n✅ 완료: ${uploaded}개 이미지 업로드됨, ${failed}개 실패\n`);

  } catch (error) {
    console.error('❌ 오류:', error.message);
    process.exit(1);
  }
}

uploadListingImages();
