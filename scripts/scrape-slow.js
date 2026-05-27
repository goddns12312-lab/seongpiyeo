#!/usr/bin/env node

const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const REGIONS = [
  { name: '서울', boardPath: '40', maxPage: 8 },
  { name: '경기도', boardPath: '93', maxPage: 27 },
  { name: '강원도', boardPath: '92', maxPage: 2 },
  { name: '인천', boardPath: '91', maxPage: 9 },
  { name: '충청북도', boardPath: '90', maxPage: 9 },
  { name: '충청남도', boardPath: '89', maxPage: 9 },
  { name: '경상북도', boardPath: '88', maxPage: 9 },
  { name: '경상남도', boardPath: '87', maxPage: 9 },
  { name: '전라북도', boardPath: '86', maxPage: 2 },
  { name: '전라남도', boardPath: '85', maxPage: 4 },
  { name: '제주도', boardPath: '84', maxPage: 1 },
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

      await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

      const imageUrls = await getDetailImages(page);
      if (imageUrls.length === 0) {
        continue;
      }

      console.log(`    ✅ ${post.title.substring(0, 30)} (${imageUrls.length}장)`);

      // 순차 다운로드 & 업로드 (병렬 대신 순차)
      const uploadedUrls = [];
      for (let imgIdx = 0; imgIdx < Math.min(imageUrls.length, 9); imgIdx++) {
        try {
          const imageBuffer = await downloadImage(imageUrls[imgIdx]);
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
            uploadedUrls.push({ url: publicUrl, idx: imgIdx });
            results.uploaded++;
          }
        } catch (e) {}
      }

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
          results.updated++;
        }
      }

      results.failed += Math.max(0, imageUrls.length - uploadedUrls.length);

      // 다음 게시글 전에 3초 대기 (IP 차단 방지)
      if (idx < posts.length - 1) {
        await new Promise(r => setTimeout(r, 3000));
      }
    } catch (e) {
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
    for (let pageNum = region.maxPage; pageNum >= 1; pageNum--) {
      const url = `${baseUrl}/${region.boardPath}/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=${pageNum}`;

      try {
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

        if (postLinks.length > 0) {
          console.log(`  📄 페이지 ${pageNum}: ${postLinks.length}개`);
          const pageResults = await processPosts(page, postLinks, region, baseUrl);
          regionResults.uploaded += pageResults.uploaded;
          regionResults.failed += pageResults.failed;
          regionResults.updated += pageResults.updated;
        }
      } catch (e) {
        console.log(`  ⚠️  페이지 ${pageNum} 오류: ${e.message}`);
      }

      // 다음 페이지 전에 2초 대기
      if (pageNum > 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
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
      console.log(`📍 [${region.name}]`);
      const results = await scrapeRegion(browser, region, authPath);
      totalUploaded += results.uploaded;
      totalFailed += results.failed;
      totalUpdated += results.updated;
      console.log(`   ✅ ${results.updated}개 매물, ${results.uploaded}장\n`);

      // 다음 지역 전에 5초 대기
      await new Promise(r => setTimeout(r, 5000));
    }

    console.log(`✅ 완료: ${totalUploaded}장 업로드, ${totalUpdated}개 매물 업데이트\n`);

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
