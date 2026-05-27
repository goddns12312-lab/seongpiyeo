#!/usr/bin/env node

const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

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
    https.get(url, { timeout: 10000 }, (res) => {
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

async function scrapeRegion(region) {
  const browser = await chromium.launch({ headless: true });
  const authPath = path.join(__dirname, 'playwright-auth.json');
  const storageState = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
  const context = await browser.newContext({ storageState });

  let processed = 0;
  const baseUrl = 'https://www.xn--3e0b036btifksj.com';

  for (let pageNum = region.maxPage; pageNum >= 1; pageNum--) {
    const url = `${baseUrl}/${region.boardPath}/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=${pageNum}`;
    const page = await context.newPage();

    try {
      console.log(`📍 [${region.name}] 페이지 ${pageNum}/${region.maxPage}`);

      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      const postLinks = await page.evaluate(() => {
        const wraps = document.querySelectorAll('span.post_link_wrap');
        return Array.from(wraps).map(wrap => {
          const link = wrap.querySelector('a.title_link._fade_link');
          const title = link?.querySelector('span')?.textContent?.trim();
          const href = link?.getAttribute('href');
          const onclick = link?.getAttribute('onclick');
          return { title, href, onclick };
        }).filter(p => p.title && !p.title.includes('공지'));
      });

      console.log(`  ℹ️  ${postLinks.length}개 게시글 발견`);

      for (let i = postLinks.length - 1; i >= 0; i--) {
        const post = postLinks[i];

        try {
          if (post.href === 'javascript:;' && post.onclick) {
            const match = post.onclick.match(/openLogin\('([^']+)'/);
            if (match && match[1]) {
              const urlDecoded = decodeURIComponent(match[1]);
              const decodedPath = Buffer.from(urlDecoded, 'base64').toString('utf-8');
              post.href = decodedPath;
            }
          }

          const detailUrl = `${baseUrl}${post.href}`;
          await page.goto(detailUrl, { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForTimeout(300);

          // 이미지 폴더별로 그룹화
          const imageGroups = await page.evaluate(() => {
            const allImages = Array.from(document.querySelectorAll('img'))
              .map(img => img.src)
              .filter(src => src && src.includes('/upload/') && !src.includes('captcha'));

            // 폴더명으로 그룹화 (S2019122064395b58816bc 등)
            const groups = {};
            allImages.forEach(src => {
              const match = src.match(/\/upload\/([A-Z0-9]+)\//);
              if (match) {
                const folder = match[1];
                if (!groups[folder]) groups[folder] = [];
                groups[folder].push(src);
              }
            });

            return groups;
          });

          const folderNames = Object.keys(imageGroups);
          if (folderNames.length === 0) {
            console.log(`    ⚠️  [${i+1}] ${post.title.slice(0, 25)} - 이미지 없음`);
            continue;
          }

          // 가장 많은 이미지의 폴더 선택 (메인 폴더)
          const mainFolder = folderNames.reduce((a, b) =>
            imageGroups[a].length > imageGroups[b].length ? a : b
          );
          const imageUrls = imageGroups[mainFolder];

          console.log(`    ⏳ [${i+1}] ${post.title.slice(0, 25)}... (${imageUrls.length}장)`);

          // 첫 번째 이미지만 다운로드
          let mainImageUrl = null;
          try {
            const imageBuffer = await downloadImage(imageUrls[0]);
            const filename = `listing-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

            const { error: uploadError } = await supabase
              .storage
              .from('listings')
              .upload(`images-correct/${filename}`, imageBuffer, {
                contentType: 'image/jpeg',
                upsert: true
              });

            if (!uploadError) {
              const { data: { publicUrl } } = supabase
                .storage
                .from('listings')
                .getPublicUrl(`images-correct/${filename}`);
              mainImageUrl = publicUrl;
              console.log(`       ✅ 업로드됨`);
              processed++;
            }
          } catch (imgErr) {
            console.log(`       ❌ 실패: ${imgErr.message}`);
          }
        } catch (e) {
          // skip
        }

        await new Promise(r => setTimeout(r, 100));
      }

      await page.close();

    } catch (error) {
      console.error(`❌ 페이지 오류:`, error.message);
      await page.close();
    }
  }

  await browser.close();
  return processed;
}

(async () => {
  console.log('🚀 폴더별 정확한 이미지 수집 시작\n');

  const REGION = { name: '강원도', boardPath: '92', maxPage: 2 }; // 2페이지만 테스트

  const processed = await scrapeRegion(REGION);
  console.log(`\n✅ 완료: ${processed}개 매물 수집\n`);
})().catch(console.error);
