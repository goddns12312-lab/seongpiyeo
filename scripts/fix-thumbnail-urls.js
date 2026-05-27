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

async function findFirstRealImage(listingId) {
  const { data: images } = await supabase
    .from('listing_images')
    .select('url, order_num')
    .eq('listing_id', listingId)
    .order('order_num');

  if (!images || images.length === 0) return null;

  for (const img of images) {
    const category = await classifyImage(img.url);
    if (category === 'real') {
      return img.url;
    }
  }

  return null;
}

async function main() {
  console.log('🔧 thumbnail_url / main_image_url 수정 시작\n');

  const { data: listings } = await supabase
    .from('listings')
    .select('id, title')
    .order('created_at', { ascending: false });

  if (!listings || listings.length === 0) {
    console.log('❌ 매물이 없습니다');
    process.exit(1);
  }

  let updated = 0;
  let noImages = 0;

  for (const listing of listings) {
    const fileName = listing.title.substring(0, 40);
    console.log(`\n📦 ${fileName} (${listing.id.substring(0, 8)}...)`);

    const realImageUrl = await findFirstRealImage(listing.id);

    if (!realImageUrl) {
      console.log(`   ⚠️  실제 사진 없음 - 스킵`);
      noImages++;
      continue;
    }

    // main_image_url과 thumbnail_url 동시 업데이트
    const { error } = await supabase
      .from('listings')
      .update({
        main_image_url: realImageUrl,
        thumbnail_url: realImageUrl
      })
      .eq('id', listing.id);

    if (error) {
      console.error(`   ❌ 오류: ${error.message}`);
    } else {
      const imgName = realImageUrl.split('/').pop();
      console.log(`   ✅ 업데이트 완료: ${imgName}`);
      updated++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 수정 완료');
  console.log('='.repeat(70));
  console.log(`✅ 업데이트된 매물: ${updated}개`);
  console.log(`⚠️  실제 사진 없음: ${noImages}개`);
  console.log('\n💡 다음 단계:');
  console.log('1. npm run dev (dev server 재실행)');
  console.log('2. 브라우저 캐시 삭제 (Ctrl+Shift+Del)');
  console.log('3. localhost:3001/listings 목록 페이지 확인');
  console.log('4. 목록 카드 대표 이미지가 모두 실제 사진인지 확인');

  process.exit(0);
}

main().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
