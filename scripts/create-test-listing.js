#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

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
    https.get(url, { timeout: 5000 }, (res) => {
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

async function main() {
  try {
    console.log('📝 테스트 매물 생성 중...\n');

    // 1. 매물 생성
    const { data: listing, error: insertError } = await supabase
      .from('listings')
      .insert([
        {
          idx: '171322689',
          title: '원주관설동 성인PC방',
          region: '강원도',
          location: '원주시 관설동',
          area_sqm: 18,
          floor: '1층',
          deposit: 2000,
          premium_price: 2000,
          monthly_rent: 120,
          facilities: 'PC 7대, 에어컨 1대',
          contact: '010-5879-3568',
          available_date: '항상',
          business_license: '있음',
          administrative_record: '없음',
          status: 'active',
          price_type: 'lease',
          price: 120,
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.log('❌ 매물 생성 실패:', insertError.message);
      return;
    }

    console.log('✅ 매물 생성 완료');
    console.log('   ID:', listing.id);
    console.log('   제목:', listing.title);
    console.log('   지역:', listing.region + ' ' + listing.location);

    // 2. 샘플 이미지 추가 (온라인 이미지 사용)
    console.log('\n📸 샘플 이미지 추가 중...');

    // 임시로 사용할 온라인 이미지 URL들
    // (다양한 PC방 이미지를 사용할 수 없으므로, 스크래퍼가 실제 이미지를 가져올 때까지 임시 사용)

    // 대신 간단한 테스트 이미지 생성
    const testImages = [
      '테스트 이미지 1',
      '테스트 이미지 2',
      '테스트 이미지 3',
    ];

    const imageUrls = [];
    for (let i = 0; i < testImages.length; i++) {
      try {
        const filename = `test-${listing.id}-${i + 1}.jpg`;

        // 더미 이미지 버퍼 생성 (실제 이미지 대신 텍스트)
        const dummyBuffer = Buffer.from(`Test image ${i + 1}`);

        const { error: uploadError } = await supabase
          .storage
          .from('listings')
          .upload(`images-all/${filename}`, dummyBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase
            .storage
            .from('listings')
            .getPublicUrl(`images-all/${filename}`);
          imageUrls.push(publicUrl);
          console.log(`   ✅ 이미지 ${i + 1} 업로드 완료`);
        }
      } catch (e) {
        console.log(`   ❌ 이미지 ${i + 1} 실패:`, e.message);
      }
    }

    // 3. listing_images 추가
    if (imageUrls.length > 0) {
      const imagesToInsert = imageUrls.map((url, idx) => ({
        listing_id: listing.id,
        url: url,
        is_primary: idx === 0,
        order_num: idx
      }));

      const { error: imageInsertError } = await supabase
        .from('listing_images')
        .insert(imagesToInsert);

      if (imageInsertError) {
        console.log('❌ 이미지 정보 저장 실패:', imageInsertError.message);
        return;
      }

      console.log(`\n✅ ${imageUrls.length}개 이미지 연결 완료`);
    }

    console.log('\n✅ 테스트 매물 완성!');
    console.log('\n🌐 이제 브라우저에서 확인하세요:');
    console.log(`   http://localhost:3001/listings/${listing.id}`);
    console.log('\n✨ 이미지가 제대로 표시되는지 확인한 후');
    console.log('   scrape-slow.js를 실행하세요');

  } catch (e) {
    console.error('❌ 오류:', e.message);
  }
}

main();
