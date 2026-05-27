#!/usr/bin/env node

const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const REGIONS = [
  { name: '강원도', boardPath: '92', maxPage: 2 },
];

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

async function processPosts(page, posts, region, baseUrl) {
  const results = { uploaded: 0, failed: 0, updated: 0 };

  for (let idx = 0; idx < posts.length; idx++) {
    const post = posts[idx];
    try {
      if (!post.href) continue;

      let postIdx = null;
      const idxMatch = post.href.match(/idx=(\d+)/);
      if (idxMatch) {
        postIdx = idxMatch[1];
      } else {
        postIdx = `title-${Date.now()}-${Math.random()}`;
      }

      const detailUrl = `${baseUrl}${post.href}`;
      console.log(`    🔍 [${idx+1}] ${post.title.substring(0, 30)} 상세 조회 중...`);

      await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

      const imageUrls = await getDetailImages(page);
      if (imageUrls.length === 0) {
        console.log(`    ⚠️  사진 없음`);
        continue;
      }

      console.log(`    ✅ ${imageUrls.length}장 발견`);

      // 병렬로 이미지 다운로드 & 업로드
      const uploadPromises = imageUrls.slice(0, 9).map(async (imgUrl, imgIdx) => {
        try {
          console.log(`      ⏳ 이미지 ${imgIdx + 1}/${imageUrls.length} 다운로드 중...`);
          const imageBuffer = await downloadImage(imgUrl);
          const filename = `listing-${postIdx}-${imgIdx + 1}-${Date.now()}.jpg`;

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
            console.log(`      ✅ 이미지 ${imgIdx + 1} 업로드 완료`);
            return { url: publicUrl, idx: imgIdx };
          } else {
            console.log(`      ❌ 이미지 ${imgIdx + 1} 업로드 실패`);
          }
        } catch (e) {
          console.log(`      ❌ 이미지 ${imgIdx + 1} 오류: ${e.message}`);
        }
        return null;
      });

      const uploadResults = await Promise.all(uploadPromises);
      const uploadedUrls = uploadResults.filter(Boolean).sort((a, b) => a.idx - b.idx);

      if (uploadedUrls.length > 0) {
        let listing = null;

        if (/^\d+$/.test(postIdx)) {
          const { data } = await supabase
            .from('listings')
            .select('id')
            .eq('idx', postIdx)
            .single();
          listing = data;
        } else {
          const { data: listings } = await supabase
            .from('listings')
            .select('id, title')
            .ilike('title', `%${post.title.substring(0, 15)}%`)
            .limit(1);
          listing = listings?.[0] || null;
        }

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
          console.log(`    ✅ DB 저장 완료 (${uploadedUrls.length}장)`);
          results.uploaded += uploadedUrls.length;
          results.updated++;
        } else {
          console.log(`    ⚠️  매물 찾기 실패`);
        }
      }

      results.failed += Math.max(0, imageUrls.length - uploadedUrls.length);

      // 다음 게시글 전에 5초 대기 (IP 차단 방지)
      if (idx < posts.length - 1) {
        console.log(`    ⏸️  다음 요청 전 5초 대기...`);
        await new Promise(r => setTimeout(r, 5000));
      }
    } catch (e) {
      console.log(`    ❌ 오류: ${e.message}`);
      results.failed++;
    }
  }

  return results;
}

async function scrapeRegion(browser, region, authPath) {
  const storageState = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
  const context = await browser.newContext({ storageState });
  const page = await context.newPage();

  let regionResults = { uploaded: 0, failed: 0, updated: 0 };
  const baseUrl = 'https://www.xn--3e0b036btifksj.com';

  try {
    // 첫 페이지만 테스트
    const pageNum = region.maxPage;
    const url = `${baseUrl}/${region.boardPath}/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=${pageNum}`;

    console.log(`  📄 페이지 ${pageNum} 로드 중...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

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

    console.log(`  📝 ${postLinks.length}개 게시글 발견\n`);

    if (postLinks.length > 0) {
      // 첫 게시글만 테스트
      const testPost = postLinks[0];
      console.log(`  테스트: ${testPost.title}`);
      const pageResults = await processPosts(page, [testPost], region, baseUrl);
      regionResults.uploaded += pageResults.uploaded;
      regionResults.failed += pageResults.failed;
      regionResults.updated += pageResults.updated;
    }
  } finally {
    await page.close();
    await context.close();
  }

  return regionResults;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const authPath = path.join(__dirname, 'playwright-auth.json');

  try {
    console.log('🚀 느린 크롤링 시작 (IP 차단 방지)\n');

    let totalUploaded = 0;
    let totalFailed = 0;
    let totalUpdated = 0;

    for (const region of REGIONS) {
      console.log(`📍 [${region.name}] 처리 중...\n`);
      const results = await scrapeRegion(browser, region, authPath);
      totalUploaded += results.uploaded;
      totalFailed += results.failed;
      totalUpdated += results.updated;
      console.log(`\n   ✅ 완료: ${results.updated}개 매물, ${results.uploaded}장 업로드\n`);
    }

    console.log(`\n✅ 전체 완료: ${totalUploaded}장 업로드, ${totalUpdated}개 매물 업데이트\n`);

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
