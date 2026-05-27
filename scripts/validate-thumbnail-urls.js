#!/usr/bin/env node

const path = require('path');
const https = require('https');
const sharp = require('sharp');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = Buffer.alloc(0);
      res.on('data', chunk => { data = Buffer.concat([data, chunk]); });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function classifyImage(url) {
  try {
    const buffer = await downloadImage(url);
    const metadata = await sharp(buffer).metadata();
    const ratio = metadata.width / metadata.height;
    const area = metadata.width * metadata.height;

    if (ratio > 2.5 && metadata.height < 500) return 'banner';
    if (area < 50000) return 'logo';
    if (ratio > 0.8 && ratio < 1.2 && metadata.width > 100 && metadata.width < 500) return 'logo';
    if ((ratio > 1.2 && ratio < 2.0) || (ratio > 0.5 && ratio < 1.0)) return 'real';
    return 'other';
  } catch (err) {
    return 'error';
  }
}

async function main() {
  console.log('✔️  thumbnail_url / main_image_url 검증 시작\n');

  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, thumbnail_url, main_image_url')
    .order('created_at', { ascending: false });

  if (!listings || listings.length === 0) {
    console.log('❌ 매물이 없습니다');
    process.exit(1);
  }

  let needsUpdate = 0;

  for (const listing of listings) {
    const fileName = listing.title.substring(0, 40);
    console.log(`\n📦 ${fileName} (${listing.id.substring(0, 8)}...)`);

    let thumbnailOk = false;
    let mainImageOk = false;

    // thumbnail_url 검증
    if (listing.thumbnail_url) {
      const category = await classifyImage(listing.thumbnail_url);
      if (category === 'real') {
        console.log(`   ✅ thumbnail_url: 실제 사진`);
        thumbnailOk = true;
      } else {
        console.log(`   ❌ thumbnail_url: ${category} (재설정 필요)`);
      }
    } else {
      console.log(`   ❌ thumbnail_url: 없음 (재설정 필요)`);
    }

    // main_image_url 검증
    if (listing.main_image_url) {
      const category = await classifyImage(listing.main_image_url);
      if (category === 'real') {
        console.log(`   ✅ main_image_url: 실제 사진`);
        mainImageOk = true;
      } else {
        console.log(`   ❌ main_image_url: ${category} (재설정 필요)`);
      }
    } else {
      console.log(`   ❌ main_image_url: 없음 (재설정 필요)`);
    }

    if (!thumbnailOk || !mainImageOk) {
      // 첫 번째 실제 사진 찾기
      const { data: images } = await supabase
        .from('listing_images')
        .select('url')
        .eq('listing_id', listing.id)
        .order('order_num')
        .limit(1);

      if (images && images.length > 0) {
        const firstImage = images[0];
        const category = await classifyImage(firstImage.url);

        if (category === 'real') {
          console.log(`   💡 업데이트 필요: ${firstImage.url.split('/').pop()}`);
          needsUpdate++;
        } else {
          console.log(`   ⚠️  첫 이미지도 ${category}입니다`);
        }
      } else {
        console.log(`   ⚠️  이미지가 없습니다`);
      }
    }
  }

  console.log('\n' + '='.repeat(70));
  if (needsUpdate > 0) {
    console.log(`⚠️  업데이트 필요한 매물: ${needsUpdate}개`);
    console.log('\n✅ 다음 단계: node scripts/fix-thumbnail-urls.js');
  } else {
    console.log('✅ 모든 thumbnail_url과 main_image_url이 정상입니다!');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
