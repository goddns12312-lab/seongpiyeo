#!/usr/bin/env node

const { chromium } = require('playwright');
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
    protocol.get(url, { timeout: 5000 }, (res) => {
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
  const browser = await chromium.launch({ headless: true });
  const authPath = path.join(__dirname, 'playwright-auth.json');

  try {
    console.log('🚀 게시물에서 이미지와 설명글 크롤링\n');

    const storageState = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();

    // 서울 페이지 1
    const listUrl = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=1';
    console.log('📄 게시물 목록 로드...');
    await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // 첫 게시물 추출 (li.tit > a.title_link)
    const firstPost = await page.evaluate(() => {
      const titleLink = document.querySelector('li.tit a.title_link');
      if (!titleLink) return null;

      const liCard = titleLink.closest('li');
      if (!liCard) return null;

      // 제목과 내용 추출
      const fullText = titleLink.innerText;
      const lines = fullText.split('\n');
      const title = lines[0]?.trim();
      const content = fullText;

      // 같은 li 내의 이미지들 찾기
      let images = Array.from(liCard.querySelectorAll('img'))
        .map(img => ({
          src: img.src,
          alt: img.alt
        }))
        .filter(img => img.src && img.src.includes('cdn.imweb.me/upload/'));

      // 이미지가 없으면 썸네일 찾기
      if (images.length === 0) {
        images = Array.from(liCard.querySelectorAll('img'))
          .map(img => ({
            src: img.src,
            alt: img.alt
          }))
          .filter(img => img.src && img.src.includes('cdn.imweb.me/thumbnail/'))
          .slice(0, 9);
      }

      return { title, content, images };
    });

    if (!firstPost) {
      console.log('❌ 게시물을 찾을 수 없습니다');
      return;
    }

    console.log(`📝 게시물: ${firstPost.title}\n`);
    console.log('📋 설명글:');
    console.log(firstPost.content.substring(0, 800));
    console.log('\n');

    // 게시물의 이미지들
    const thumbnailImages = firstPost.images;

    console.log(`📸 발견된 이미지: ${thumbnailImages.length}개`);
    thumbnailImages.forEach((img, idx) => {
      console.log(`  [${idx + 1}] ${img.src.substring(0, 80)}...`);
    });
    console.log('');

    // 12개 항목 정보 파싱
    const details = parseListingDetails(firstPost.content);
    console.log('📋 추출된 정보:');
    Object.entries(details).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('');

    // DB 업데이트
    console.log('💾 DB 업데이트 중...');
    const { data: listings } = await supabase
      .from('listings')
      .select('id')
      .limit(1);

    if (!listings || listings.length === 0) {
      console.log('❌ 테스트 매물을 찾을 수 없습니다');
      return;
    }

    const listingId = listings[0].id;

    // 이미지 다운로드 및 업로드
    if (thumbnailImages.length > 0) {
      console.log(`\n🖼️  이미지 처리 중...\n`);

      // 기존 이미지 삭제
      await supabase
        .from('listing_images')
        .delete()
        .eq('listing_id', listingId);

      const uploadedUrls = [];

      for (let idx = 0; idx < thumbnailImages.length; idx++) {
        try {
          console.log(`  ⏳ 이미지 ${idx + 1}/${thumbnailImages.length} 다운로드 중...`);
          const imageBuffer = await downloadImage(thumbnailImages[idx].src);
          const filename = `listing-test-${idx + 1}-${Date.now()}.jpg`;

          const { error: uploadError } = await supabase
            .storage
            .from('listings')
            .upload(`images-all/${filename}`, imageBuffer, {
              contentType: 'image/jpeg',
              upsert: true
            });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase
              .storage
              .from('listings')
              .getPublicUrl(`images-all/${filename}`);
            uploadedUrls.push(publicUrl);
            console.log(`  ✅ 업로드 완료`);
          }
        } catch (e) {
          console.log(`  ❌ 실패: ${e.message}`);
        }
      }

      // listing_images 저장
      if (uploadedUrls.length > 0) {
        const imagesToInsert = uploadedUrls.map((url, imgIdx) => ({
          listing_id: listingId,
          url: url,
          is_primary: imgIdx === 0,
          order_num: imgIdx
        }));

        await supabase.from('listing_images').insert(imagesToInsert);
        console.log(`\n✅ ${uploadedUrls.length}개 이미지 저장 완료\n`);
      }
    }

    // 설명글 저장
    await supabase
      .from('listings')
      .update({
        description: firstPost.content,
        location: details['매물위치'] || '',
        area_sqm: parseInt(details['실평수']) || 0,
        floor: details['해당층'] || '',
        deposit: parseInt(details['보증금']?.replace(/[^0-9]/g, '') || 0),
        premium_price: parseInt(details['희망권리금']?.replace(/[^0-9]/g, '') || 0),
        monthly_rent: parseInt(details['월세']?.replace(/[^0-9]/g, '') || 0),
        facilities: details['시설집기'] || '',
        contact: details['연락처'] || '',
        available_date: details['입주가능일'] || '',
        business_license: details['사업자영업허가증'] || '',
        administrative_record: details['행정처분여부'] || ''
      })
      .eq('id', listingId);

    console.log('✅ 테스트 완료!\n');
    console.log('🌐 브라우저에서 확인하세요:');
    console.log(`   http://localhost:3001/listings/${listingId}\n`);

    await page.close();
    await context.close();

  } finally {
    await browser.close();
  }
}

function parseListingDetails(text) {
  const details = {
    '매물업종': '',
    '매물위치': '',
    '실평수': '',
    '해당층': '',
    '보증금': '',
    '희망권리금': '',
    '월세': '',
    '시설집기': '',
    '입주가능일': '',
    '사업자영업허가증': '',
    '행정처분여부': '',
    '연락처': ''
  };

  const fieldOrder = [
    '매물업종', '매물위치', '실평수', '해당층', '보증금',
    '희망권리금', '월세', '시설집기', '입주가능일',
    '사업자영업허가증', '행정처분여부', '연락처'
  ];

  // 숫자.로 시작하는 부분으로 나누기
  // "1. 매물업종 : 값2. 매물위치" → ["", "매물업종 : 값", "매물위치"]
  const items = text.split(/\d+\.\s*/);

  for (let i = 1; i < items.length && i <= fieldOrder.length; i++) {
    const item = items[i];
    if (!item) continue;

    // 콜론으로 구분하여 값 추출
    const colonIndex = item.indexOf(':');
    if (colonIndex > -1) {
      let value = item.substring(colonIndex + 1).trim();
      // 다음 숫자 항목이 시작되기 전까지의 문자만 추출
      value = value.split(/\d+\.|\s*$/).at(0)?.trim() || value;
      details[fieldOrder[i - 1]] = value;
    }
  }

  return details;
}

main().catch(console.error);
