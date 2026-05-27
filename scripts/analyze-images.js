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

// 이미지 다운로드
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = Buffer.alloc(0);
      res.on('data', chunk => { data = Buffer.concat([data, chunk]); });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// 이미지 분석
async function analyzeImage(url) {
  try {
    const buffer = await downloadImage(url);
    const metadata = await sharp(buffer).metadata();

    const ratio = metadata.width / metadata.height;
    const area = metadata.width * metadata.height;

    // 분류 기준
    let category = '일반';
    let reason = '';

    // 배너형: 가로로 매우 김 (1200x300, 800x200 등)
    if (ratio > 2.5 && metadata.height < 500) {
      category = '배너';
      reason = `매우 긴 가로 비율: ${metadata.width}x${metadata.height} (${ratio.toFixed(1)}:1)`;
    }
    // 로고/아이콘: 매우 작음
    else if (area < 50000) {
      category = '로고/아이콘';
      reason = `작은 크기: ${metadata.width}x${metadata.height}`;
    }
    // 정사각형: 로고일 가능성
    else if (ratio > 0.8 && ratio < 1.2 && metadata.width > 200 && metadata.width < 800) {
      category = '의심(정사각형)';
      reason = `정사각형 비율: ${metadata.width}x${metadata.height}`;
    }
    // 실제 사진: 일반적인 비율 (4:3, 16:9 등)
    else if ((ratio > 1.2 && ratio < 2.0) || (ratio > 0.5 && ratio < 1.0)) {
      category = '실제 사진';
      reason = `일반 사진 비율: ${metadata.width}x${metadata.height} (${ratio.toFixed(2)}:1)`;
    }
    // 기타
    else {
      category = '기타';
      reason = `비율: ${ratio.toFixed(2)}:1, 크기: ${metadata.width}x${metadata.height}`;
    }

    return { width: metadata.width, height: metadata.height, ratio, category, reason };
  } catch (err) {
    return { error: err.message };
  }
}

async function main() {
  console.log('🖼️  이미지 분석 시작\n');

  const { data: listings } = await supabase
    .from('listings')
    .select('id, title')
    .order('created_at', { ascending: false });

  if (!listings || listings.length === 0) {
    console.log('❌ 매물이 없습니다');
    process.exit(1);
  }

  for (const listing of listings) {
    const { data: images } = await supabase
      .from('listing_images')
      .select('id, url, order_num')
      .eq('listing_id', listing.id)
      .order('order_num');

    if (!images || images.length === 0) continue;

    const fileName = listing.title.substring(0, 40);
    console.log(`\n📦 ${fileName} (${listing.id.substring(0, 8)}...)`);
    console.log(`   총 ${images.length}개 이미지 분석 중...`);

    let banners = 0;
    let logos = 0;
    let realPhotos = 0;
    const removeIds = [];
    const details = [];

    for (let i = 0; i < Math.min(images.length, 10); i++) {
      const img = images[i];
      const analysis = await analyzeImage(img.url);

      if (analysis.error) {
        console.log(`   ⚠️  [${i + 1}] 분석 실패: ${analysis.error}`);
        continue;
      }

      const icon = analysis.category === '배너' ? '❌' :
                  analysis.category === '로고/아이콘' ? '❌' :
                  analysis.category === '실제 사진' ? '✅' :
                  '⚠️';

      console.log(`   ${icon} [${i + 1}] ${analysis.category.padEnd(15)} - ${analysis.reason}`);

      if (analysis.category === '배너' || analysis.category === '로고/아이콘') {
        removeIds.push(img.id);
        if (analysis.category === '배너') banners++;
        else logos++;
      } else if (analysis.category === '실제 사진') {
        realPhotos++;
      }

      details.push({ id: img.id, category: analysis.category });
    }

    console.log(`   → 배너: ${banners}개, 로고: ${logos}개, 실제 사진: ${realPhotos}개`);

    if (removeIds.length > 0) {
      console.log(`   💡 제거 권장: ${removeIds.length}개`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ 분석 완료');
  console.log('='.repeat(70));
}

main().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
