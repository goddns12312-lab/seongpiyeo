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
    protocol.get(url, { timeout: 10000 }, (res) => {
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
  return await page.evaluate(() => {
    // /upload/ 경로의 이미지만 추출 (실제 PC방 사진)
    const uploadImages = Array.from(document.querySelectorAll('img'))
      .map(img => img.src)
      .filter(src => src && src.includes('cdn.imweb.me/upload/'))
      .filter((src, idx, arr) => arr.indexOf(src) === idx);

    return uploadImages;
  });
}

async function scrapeAndUploadRegion(browser, region, authPath) {
  const storageState = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
  const context = await browser.newContext({ storageState });

  let uploadedCount = 0;
  let failedCount = 0;
  const baseUrl = 'https://www.xn--3e0b036btifksj.com';

  for (let pageNum = region.maxPage; pageNum >= 1; pageNum--) {
    const url = `${baseUrl}/${region.boardPath}/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=${pageNum}`;
    const page = await context.newPage();

    try {
      console.log(`📍 [${region.name}] 페이지 ${pageNum}/${region.maxPage}`);

      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      const pageHeight = await page.evaluate(() => document.body.scrollHeight);
      for (let i = 0; i < pageHeight; i += 500) {
        await page.evaluate(scrollY => window.scrollBy(0, scrollY), 500);
        await page.waitForTimeout(50);
      }

      const postLinksRaw = await page.evaluate(() => {
        const wraps = document.querySelectorAll('span.post_link_wrap');
        return Array.from(wraps).map(wrap => {
          const link = wrap.querySelector('a.title_link._fade_link');
          const title = link?.querySelector('span')?.textContent?.trim();
          const href = link?.getAttribute('href');
          const onclick = link?.getAttribute('onclick');
          return { title, href, onclick };
        }).filter(p => p.title && !p.title.includes('공지'));
      });

      const postLinks = postLinksRaw.map(post => {
        let href = post.href;
        if (href === 'javascript:;' && post.onclick) {
          const match = post.onclick.match(/openLogin\('([^']+)'/);
          if (match && match[1]) {
            const urlDecoded = decodeURIComponent(match[1]);
            const decodedPath = Buffer.from(urlDecoded, 'base64').toString('utf-8');
            href = decodedPath;
          }
        }
        return { title: post.title, href };
      });

      console.log(`  ℹ️  ${postLinks.length}개 게시글 발견`);

      for (let i = postLinks.length - 1; i >= 0; i--) {
        const post = postLinks[i];

        try {
          if (post.href) {
            const detailUrl = `${baseUrl}${post.href}`;
            await page.goto(detailUrl, { waitUntil: 'networkidle', timeout: 30000 });
            await page.waitForTimeout(500);

            // 실제 /upload/ 이미지만 추출
            const imageUrls = await getDetailImages(page);

            if (imageUrls.length === 0) {
              console.log(`    ⚠️  [${i+1}] ${post.title.slice(0, 30)} - 실제 사진 없음`);
              failedCount++;
              continue;
            }

            console.log(`    ⏳ [${i+1}] ${post.title.slice(0, 30)}... (${imageUrls.length}장)`);

            // 첫 번째 이미지 다운로드 및 업로드
            try {
              const imageUrl = imageUrls[0];
              const imageBuffer = await downloadImage(imageUrl);

              const filename = `listing-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
              const { data, error: uploadError } = await supabase
                .storage
                .from('listings')
                .upload(`images-real/${filename}`, imageBuffer, {
                  contentType: 'image/jpeg',
                  upsert: true
                });

              if (!uploadError) {
                const { data: { publicUrl } } = supabase
                  .storage
                  .from('listings')
                  .getPublicUrl(`images-real/${filename}`);

                console.log(`       ✅ 업로드됨`);
                uploadedCount++;
              } else {
                console.log(`       ❌ 업로드 실패`);
                failedCount++;
              }
            } catch (imgErr) {
              console.log(`       ❌ 다운로드 실패: ${imgErr.message}`);
              failedCount++;
            }
          }
        } catch (e) {
          failedCount++;
        }

        await new Promise(r => setTimeout(r, 200));
      }

      await page.close();

      if (pageNum > 1) {
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 500));
      }

    } catch (error) {
      console.error(`❌ 페이지 ${pageNum} 오류:`, error.message);
      await page.close();
    }
  }

  await context.close();
  return { uploadedCount, failedCount };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const authPath = path.join(__dirname, 'playwright-auth.json');

  try {
    console.log('🚀 실제 PC방 사진 크롤링 + 업로드 시작\n');

    let totalUploaded = 0;
    let totalFailed = 0;

    for (const region of REGIONS) {
      const { uploadedCount, failedCount } = await scrapeAndUploadRegion(browser, region, authPath);
      totalUploaded += uploadedCount;
      totalFailed += failedCount;
    }

    console.log(`\n✅ 완료: ${totalUploaded}장 업로드, ${totalFailed}개 실패\n`);

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
