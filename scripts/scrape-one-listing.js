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
        .filter(src => src && src.includes('cdn.imweb.me/upload/'))
        .filter((src, idx, arr) => arr.indexOf(src) === idx);
      return uploadImages;
    });
  } catch (e) {
    return [];
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const authPath = path.join(__dirname, 'playwright-auth.json');

  try {
    console.log('🚀 원주관설동 매물 크롤링 시작\n');

    const storageState = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();

    // 강원도 페이지 2 접속
    const url = 'https://www.xn--3e0b036btifksj.com/92/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=2';

    console.log('📄 강원도 페이지 2 로드...');
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

    // "원주관설동" 찾기
    const targetPost = postLinks.find(p => p.title.includes('원주') || p.title.includes('관설'));
    if (!targetPost) {
      console.log('❌ 원주관설동 매물을 찾을 수 없습니다');
      return;
    }

    console.log(`🎯 찾음: ${targetPost.title}`);

    // 상세 페이지 접속
    const detailUrl = 'https://www.xn--3e0b036btifksj.com' + targetPost.href;
    console.log('🔍 상세 페이지 로드 중...\n');
    await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // 이미지 추출
    const imageUrls = await getDetailImages(page);
    console.log(`📸 ${imageUrls.length}개 이미지 발견\n`);

    if (imageUrls.length === 0) {
      console.log('❌ 이미지가 없습니다');
      return;
    }

    // idx 추출
    const idxMatch = targetPost.href.match(/idx=(\d+)/);
    const idx = idxMatch ? idxMatch[1] : `title-${Date.now()}`;

    console.log(`📌 idx: ${idx}\n`);

    // 이미지 다운로드 및 업로드
    const uploadedUrls = [];
    for (let imgIdx = 0; imgIdx < Math.min(imageUrls.length, 9); imgIdx++) {
      try {
        console.log(`⏳ 이미지 ${imgIdx + 1}/${Math.min(imageUrls.length, 9)} 다운로드 중...`);
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
          console.log(`✅ 업로드 완료\n`);
        } else {
          console.log(`❌ 업로드 실패\n`);
        }
      } catch (e) {
        console.log(`❌ 오류: ${e.message}\n`);
      }
    }

    // 기존 이미지 삭제 후 새 이미지 추가
    if (uploadedUrls.length > 0) {
      console.log('🔄 기존 이미지 삭제 중...');

      // 테스트 매물 ID로 기존 이미지 삭제
      const { data: listing } = await supabase
        .from('listings')
        .select('id')
        .eq('idx', idx)
        .single();

      if (listing) {
        await supabase
          .from('listing_images')
          .delete()
          .eq('listing_id', listing.id);

        const imagesToInsert = uploadedUrls.map((item, imgIdx) => ({
          listing_id: listing.id,
          url: item.url,
          is_primary: imgIdx === 0,
          order_num: imgIdx
        }));

        await supabase.from('listing_images').insert(imagesToInsert);
        console.log(`✅ ${uploadedUrls.length}개 이미지 저장 완료\n`);
      }
    }

    console.log('✅ 완료!\n');
    console.log('🌐 브라우저에서 확인하세요:');
    console.log('   http://localhost:3001/listings/a9996682-69af-4b56-ae41-f86226171312');

    await page.close();
    await context.close();

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
