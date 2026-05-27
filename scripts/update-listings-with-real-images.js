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

async function updateListingsWithRealImages() {
  try {
    console.log('📥 실제 사진으로 매물 업데이트 중...\n');

    // Storage에서 실제 사진 목록 가져오기
    const { data: imageFiles, error: listError } = await supabase
      .storage
      .from('listings')
      .list('images-real', { limit: 1000 });

    if (listError) {
      console.error('❌ 이미지 목록 조회 실패:', listError.message);
      return;
    }

    if (!imageFiles || imageFiles.length === 0) {
      console.log('⚠️  수집된 실제 사진이 없습니다.');
      return;
    }

    console.log(`✅ ${imageFiles.length}개의 실제 사진 발견\n`);

    // 모든 활성 매물 조회
    const { data: listings, error: selectError } = await supabase
      .from('listings')
      .select('id, title')
      .eq('status', 'active')
      .limit(1000);

    if (selectError) {
      console.error('❌ 매물 조회 실패:', selectError.message);
      return;
    }

    console.log(`📊 ${listings.length}개의 활성 매물 업데이트 시작\n`);

    let updated = 0;
    let skipped = 0;

    // 각 매물에 사진 할당 (순환)
    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];
      const imageFile = imageFiles[i % imageFiles.length];

      const publicUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listings/images-real/${imageFile.name}`;

      const { error: updateError } = await supabase
        .from('listings')
        .update({ main_image_url: publicUrl })
        .eq('id', listing.id);

      if (!updateError) {
        updated++;
        if ((i + 1) % 10 === 0) {
          console.log(`  ✅ [${i + 1}/${listings.length}] 업데이트됨`);
        }
      } else {
        skipped++;
        console.log(`  ❌ [${i + 1}] ${listing.title.slice(0, 30)} - 실패`);
      }
    }

    console.log(`\n✅ 완료: ${updated}개 매물 업데이트, ${skipped}개 스킵\n`);

  } catch (error) {
    console.error('❌ 오류:', error.message);
    process.exit(1);
  }
}

updateListingsWithRealImages();
