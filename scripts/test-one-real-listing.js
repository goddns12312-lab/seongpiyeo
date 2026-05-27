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

async function getDetailImages(page) {
  try {
    return await page.evaluate(() => {
      const uploadImages = Array.from(document.querySelectorAll('img'))
        .map(img => img.src)
        .filter(src => {
          // cdn.imweb.me/upload/ 포함
          if (!src || !src.includes('cdn.imweb.me/upload/')) return false;

          // 명확한 배너/광고 경로 제외
          if (src.includes('/banner/')) return false;
          if (src.includes('/ad/')) return false;
          if (src.includes('/promo/')) return false;
          if (src.includes('/promotion/')) return false;
          if (src.includes('/thumbnail/')) return false;

          // 300x200 이상의 이미지만 (배너보다 큰 실제 사진)
          // 하지만 너무 엄격하지 않게

          return true;
        })
        .filter((src, idx, arr) => arr.indexOf(src) === idx);
      return uploadImages;
    });
  } catch (e) {
    return [];
  }
}

async function getListingDetails(page) {
  try {
    return await page.evaluate(() => {
      const bodyText = document.body.innerText;

      // 12개 항목 추출
      const details = {
        location: '',
        size: '',
        floor: '',
        deposit: '',
        premium: '',
        monthly_rent: '',
        facilities: '',
        move_in_date: '',
        business_type: '',
        reason: '',
        contact: '',
        description: ''
      };

      // 정규식으로 각 항목 추출 시도
      const lines = bodyText.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('위치') || line.includes('주소')) details.location = lines[i + 1]?.trim() || '';
        if (line.includes('평수') || line.includes('면적')) details.size = lines[i + 1]?.trim() || '';
        if (line.includes('층') || line.includes('층수')) details.floor = lines[i + 1]?.trim() || '';
        if (line.includes('보증금')) details.deposit = lines[i + 1]?.trim() || '';
        if (line.includes('권리금')) details.premium = lines[i + 1]?.trim() || '';
        if (line.includes('월세')) details.monthly_rent = lines[i + 1]?.trim() || '';
        if (line.includes('시설')) details.facilities = lines[i + 1]?.trim() || '';
        if (line.includes('입주')) details.move_in_date = lines[i + 1]?.trim() || '';
        if (line.includes('영업허가') || line.includes('사업자')) details.business_type = lines[i + 1]?.trim() || '';
        if (line.includes('행정처분')) details.reason = lines[i + 1]?.trim() || '';
        if (line.includes('연락처') || line.includes('전화')) details.contact = lines[i + 1]?.trim() || '';
      }

      return details;
    });
  } catch (e) {
    return {};
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const authPath = path.join(__dirname, 'playwright-auth.json');

  try {
    console.log('🚀 실제 매물 테스트 시작\n');

    const storageState = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();

    // 서울 페이지 1 접속
    const url = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=1';

    console.log('📄 서울 페이지 1 로드 중...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // 게시글 찾기
    const postLinks = await page.evaluate(() => {
      const wraps = document.querySelectorAll('span.post_link_wrap');
      return Array.from(wraps).map(wrap => {
        const link = wrap.querySelector('a.title_link._fade_link');
        const title = link?.querySelector('span')?.textContent?.trim();
        let href = link?.getAttribute('href');
        const onclick = link?.getAttribute('onclick');

        if (href === 'javascript:;' && onclick) {
          const match = onclick.match(/openLogin\('([^']+)'/);
          if (match && match[1]) {
            const urlDecoded = decodeURIComponent(match[1]);
            const decodedPath = atob(urlDecoded);
            href = decodedPath;
          }
        }
        return { title, href };
      }).filter(p => p.title && !p.title.includes('공지'));
    });

    console.log(`📝 ${postLinks.length}개 게시글 발견\n`);

    if (postLinks.length === 0) {
      console.log('❌ 게시글이 없습니다');
      return;
    }

    // 첫 번째 게시글 선택
    const targetPost = postLinks[0];
    console.log(`🎯 선택: ${targetPost.title}\n`);

    // 상세 페이지 접속
    const detailUrl = 'https://www.xn--3e0b036btifksj.com' + targetPost.href;
    console.log('🔍 상세 페이지 로드 중...\n');
    await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // 이미지 추출
    const imageUrls = await getDetailImages(page);
    console.log(`📸 ${imageUrls.length}개 이미지 발견`);

    // idx 추출
    const idxMatch = targetPost.href.match(/idx=(\d+)/);
    const idx = idxMatch ? idxMatch[1] : `test-${Date.now()}`;
    console.log(`📌 idx: ${idx}\n`);

    // 12개 정보 추출
    const details = await getListingDetails(page);
    console.log('📋 매물 정보:');
    console.log('   위치:', details.location || '정보 없음');
    console.log('   평수:', details.size || '정보 없음');
    console.log('   층:', details.floor || '정보 없음');
    console.log('   보증금:', details.deposit || '정보 없음');
    console.log('   권리금:', details.premium || '정보 없음');
    console.log('   월세:', details.monthly_rent || '정보 없음');
    console.log('   시설:', details.facilities || '정보 없음');
    console.log('   입주:', details.move_in_date || '정보 없음');
    console.log('   영업허가:', details.business_type || '정보 없음');
    console.log('   행정처분:', details.reason || '정보 없음');
    console.log('   연락처:', details.contact || '정보 없음\n');

    // DB에 저장
    console.log('💾 DB에 저장 중...\n');

    const { data: listing, error: insertError } = await supabase
      .from('listings')
      .insert([
        {
          idx: idx,
          title: targetPost.title,
          region: '서울',
          location: details.location || '정보 없음',
          area_sqm: parseInt(details.size) || 0,
          floor: details.floor || '',
          deposit: parseInt(details.deposit?.replace(/[^0-9]/g, '') || 0),
          premium_price: parseInt(details.premium?.replace(/[^0-9]/g, '') || 0),
          monthly_rent: parseInt(details.monthly_rent?.replace(/[^0-9]/g, '') || 0),
          facilities: details.facilities || '',
          contact: details.contact || '',
          available_date: details.move_in_date || '',
          business_license: details.business_type || '',
          administrative_record: details.reason || '',
          status: 'active',
          price_type: 'lease',
          price: parseInt(details.monthly_rent?.replace(/[^0-9]/g, '') || 0),
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.log('❌ 저장 실패:', insertError.message);
      return;
    }

    console.log('✅ 매물 저장 완료\n');

    // 이미지 다운로드 및 업로드
    if (imageUrls.length > 0) {
      console.log(`🖼️  ${imageUrls.length}개 이미지 처리 중...\n`);

      const uploadedUrls = [];
      for (let imgIdx = 0; imgIdx < Math.min(imageUrls.length, 9); imgIdx++) {
        try {
          console.log(`   ⏳ 이미지 ${imgIdx + 1}/${Math.min(imageUrls.length, 9)} 다운로드...`);
          const imageBuffer = await downloadImage(imageUrls[imgIdx]);
          const filename = `listing-${idx}-${imgIdx + 1}-${Date.now()}.jpg`;

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
            uploadedUrls.push({ url: publicUrl, idx: imgIdx });
            console.log(`   ✅ 업로드 완료`);
          }
        } catch (e) {
          console.log(`   ❌ 실패: ${e.message}`);
        }
      }

      // listing_images 저장
      if (uploadedUrls.length > 0) {
        const imagesToInsert = uploadedUrls.map((item, imgIdx) => ({
          listing_id: listing.id,
          url: item.url,
          is_primary: imgIdx === 0,
          order_num: imgIdx
        }));

        await supabase.from('listing_images').insert(imagesToInsert);
        console.log(`\n✅ ${uploadedUrls.length}개 이미지 저장 완료\n`);
      }
    }

    console.log('✅ 테스트 완료!\n');
    console.log('🌐 브라우저에서 확인하세요:');
    console.log(`   http://localhost:3001/listings/${listing.id}\n`);
    console.log('확인 항목:');
    console.log('   ✓ 모든 이미지가 정상 표시되나?');
    console.log('   ✓ 이미지 개수가 올바르게 표시되나? (예: 3 / 5)');
    console.log('   ✓ 12개 매물 정보가 모두 보이나?');
    console.log('   ✓ 이미지 네비게이션 버튼이 작동하나?\n');

    await page.close();
    await context.close();

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
