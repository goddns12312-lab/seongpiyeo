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

// Supabase 초기화
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// 이미지 다운로드
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

// 상세정보 + 이미지 URL 추출
async function extractPostDetails(page) {
  return await page.evaluate(() => {
    const bodyText = document.body.innerText;
    const items = {};

    const itemMapping = {
      '매물업종': 'business_type',
      '매물위치': 'location',
      '실평수': 'area',
      '해당층': 'floor',
      '보증금': 'deposit',
      '희망권리금': 'premium',
      '월세': 'monthly_rent',
      '시설집기': 'facilities',
      '입주가능일': 'move_in_date',
      '사업자': 'business_license',
      '영업허가증': 'business_license',
      '행정처분': 'administrative_record',
      '연락처': 'contact'
    };

    for (let itemNum = 1; itemNum <= 12; itemNum++) {
      const nextNum = itemNum + 1;
      const basePattern = `${itemNum}\\.\\s*([^:：]*?)[:：]\\s*`;
      const fullPattern = new RegExp(basePattern + '(.*?)(?=' + nextNum + '\\.|$)', 's');
      const match = bodyText.match(fullPattern);

      if (match && match[2]) {
        const itemName = match[1].trim();
        let itemValue = match[2].trim();
        itemValue = itemValue.replace(/\s*\d+\.\s*$/, '').trim();
        itemValue = itemValue.split(/[\n\r]/)[0].trim();

        let mappedKey = null;
        for (const [key, value] of Object.entries(itemMapping)) {
          if (itemName.includes(key)) {
            mappedKey = value;
            break;
          }
        }

        if (mappedKey && itemValue) {
          items[mappedKey] = itemValue;
        }
      }
    }

    // 설명글 추출
    const descMatch = bodyText.match(/12\.\s*[^:：]*?[:：]\s*([\s\S]*?)$/);
    if (descMatch && descMatch[1]) {
      const fullDesc = descMatch[1].trim();
      const lines = fullDesc.split('\n');
      const descLines = [];
      let foundContact = false;

      for (const line of lines) {
        if (line.match(/\d{2,3}-\d{3,4}-\d{4}/)) {
          foundContact = true;
          continue;
        }
        if (foundContact && line.trim()) {
          descLines.push(line.trim());
        }
      }

      if (descLines.length > 0) {
        items['description'] = descLines.join(' ');
      }
    }

    // 이미지 URL 추출 (게시글 본문만)
    let contentArea = document.querySelector('.content-area') ||
                      document.querySelector('.view-content-area') ||
                      document.querySelector('#contents') ||
                      document.querySelector('.post-view-content') ||
                      document.body;

    const images = Array.from(contentArea.querySelectorAll('img[src*="cdn.imweb"]'))
      .map(img => img.getAttribute('src'))
      .filter((src, idx, arr) => arr.indexOf(src) === idx);

    return { items, images };
  });
}

async function scrapeAndUploadRegion(browser, region) {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  let uploadedCount = 0;
  let failedCount = 0;

  for (let pageNum = region.maxPage; pageNum >= 1; pageNum--) {
    const url = `https://www.xn--3e0b036btifksj.com/${region.boardPath}/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=${pageNum}`;
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
        let idx = null;

        if (href === 'javascript:;' && post.onclick) {
          const match = post.onclick.match(/openLogin\('([^']+)'/);
          if (match && match[1]) {
            const urlDecoded = decodeURIComponent(match[1]);
            const decodedPath = Buffer.from(urlDecoded, 'base64').toString('utf-8');
            href = decodedPath;
          }
        }

        if (href && href.includes('&idx=')) {
          const match = href.match(/&idx=(\d+)/);
          if (match) idx = match[1];
        }

        return { title: post.title, href, idx };
      });

      console.log(`  ℹ️  ${postLinks.length}개 게시글 발견`);

      // 역순으로 처리 (아래→위)
      for (let i = postLinks.length - 1; i >= 0; i--) {
        const post = postLinks[i];

        try {
          if (post.href) {
            const detailUrl = `https://www.xn--3e0b036btifksj.com${post.href}`;
            await page.goto(detailUrl, { waitUntil: 'networkidle', timeout: 30000 });
            await page.waitForTimeout(1000);

            const details = await extractPostDetails(page);

            // 이미지 다운로드 & 업로드
            let mainImageUrl = null;
            if (details.images && details.images.length > 0) {
              try {
                const imageUrl = details.images[0];
                const imageBuffer = await downloadImage(imageUrl);

                // Supabase에 업로드
                const filename = `listing-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
                const { error: uploadError } = await supabase
                  .storage
                  .from('listings')
                  .upload(`images/${filename}`, imageBuffer, {
                    contentType: 'image/jpeg',
                    upsert: true
                  });

                if (!uploadError) {
                  const { data } = supabase
                    .storage
                    .from('listings')
                    .getPublicUrl(`images/${filename}`);
                  mainImageUrl = data.publicUrl;
                }
              } catch (imgErr) {
                // 이미지 다운로드 실패해도 계속 진행
              }
            }

            // DB에 저장
            const { error: insertError } = await supabase
              .from('listings')
              .upsert({
                title: post.title,
                region: region.name,
                idx: post.idx,
                ...details.items,
                main_image_url: mainImageUrl,
                status: 'active'
              });

            if (!insertError) {
              uploadedCount++;
              console.log(`    ✅ [${i+1}] ${post.title.slice(0, 30)}`);
            } else {
              failedCount++;
              console.log(`    ❌ [${i+1}] DB 저장 실패: ${insertError.message}`);
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

  try {
    console.log('🚀 완전 크롤링 + 업로드 시작\n');

    let totalUploaded = 0;
    let totalFailed = 0;

    for (const region of REGIONS) {
      const { uploadedCount, failedCount } = await scrapeAndUploadRegion(browser, region);
      totalUploaded += uploadedCount;
      totalFailed += failedCount;
    }

    console.log(`\n✅ 완료: ${totalUploaded}개 매물 업로드, ${totalFailed}개 실패\n`);

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
