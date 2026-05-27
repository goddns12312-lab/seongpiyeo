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

  let totalUploaded = 0;
  let totalFailed = 0;
  let listingUpdated = 0;
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

            // idx 추출 시도 (href에서)
            let idxMatch = post.href.match(/idx=(\d+)/);
            let idx = idxMatch ? idxMatch[1] : null;

            // idx가 없으면 제목으로 고유 ID 생성
            if (!idx) {
              idx = `title-${Date.now()}-${i}`;
            }

            await page.goto(detailUrl, { waitUntil: 'networkidle', timeout: 30000 });
            await page.waitForTimeout(500);

            // 실제 /upload/ 이미지 모두 추출
            const imageUrls = await getDetailImages(page);

            if (imageUrls.length === 0) {
              console.log(`    ⚠️  [${i+1}] ${post.title.slice(0, 30)} - 실제 사진 없음`);
              totalFailed++;
              continue;
            }

            console.log(`    ⏳ [${i+1}] ${post.title.slice(0, 30)}... (${imageUrls.length}장)`);

            // 모든 이미지 다운로드 및 업로드
            let uploadedCount = 0;
            const uploadedUrls = [];

            for (let imgIdx = 0; imgIdx < imageUrls.length; imgIdx++) {
              try {
                const imageUrl = imageUrls[imgIdx];
                const imageBuffer = await downloadImage(imageUrl);

                const filename = `listing-${idx}-${imgIdx + 1}-${Date.now()}.jpg`;
                const { data, error: uploadError } = await supabase
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
                  uploadedCount++;
                  totalUploaded++;
                } else {
                  console.log(`       ❌ 이미지 ${imgIdx + 1} 업로드 실패`);
                }
              } catch (imgErr) {
                console.log(`       ❌ 이미지 ${imgIdx + 1} 다운로드 실패: ${imgErr.message}`);
              }
            }

            // 데이터베이스에 listing_images 저장
            if (uploadedUrls.length > 0) {
              // idx로 listing 찾기 (숫자 idx인 경우)
              let listing = null;

              if (/^\d+$/.test(idx)) {
                // 숫자 idx면 데이터베이스에서 조회
                const { data } = await supabase
                  .from('listings')
                  .select('id')
                  .eq('idx', idx)
                  .single();
                listing = data;
              } else {
                // 제목 기반으로 가장 가까운 listing 찾기
                const { data: listings } = await supabase
                  .from('listings')
                  .select('id, title')
                  .ilike('title', `%${post.title.slice(0, 20)}%`)
                  .limit(1);
                listing = listings?.[0] || null;
              }

              if (listing) {
                // 기존 이미지 삭제
                await supabase
                  .from('listing_images')
                  .delete()
                  .eq('listing_id', listing.id);

                // 새 이미지 삽입
                const imagesToInsert = uploadedUrls.map((url, imgIdx) => ({
                  listing_id: listing.id,
                  url: url,
                  is_primary: imgIdx === 0,
                  order_num: imgIdx
                }));

                const { error: insertError } = await supabase
                  .from('listing_images')
                  .insert(imagesToInsert);

                if (!insertError) {
                  console.log(`       ✅ ${uploadedCount}장 업로드됨`);
                  listingUpdated++;
                } else {
                  console.log(`       ⚠️  업로드했으나 DB 저장 실패: ${insertError.message}`);
                }
              } else {
                console.log(`       ⚠️  매칭되는 매물 없음`);
              }
            } else {
              totalFailed++;
            }
          }
        } catch (e) {
          totalFailed++;
          console.log(`    ❌ [${i+1}] 처리 실패`);
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
  return { totalUploaded, totalFailed, listingUpdated };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const authPath = path.join(__dirname, 'playwright-auth.json');

  try {
    console.log('🚀 모든 이미지 크롤링 + 업로드 시작\n');

    let grandTotalUploaded = 0;
    let grandTotalFailed = 0;
    let grandListingUpdated = 0;

    // 테스트 모드: 강원도만 (커맨드 인자 확인)
    const isTestMode = process.argv.includes('--test');
    const regionsToProcess = isTestMode ? [REGIONS[2]] : REGIONS; // 강원도 (index 2)

    for (const region of regionsToProcess) {
      const { totalUploaded, totalFailed, listingUpdated } = await scrapeAndUploadRegion(browser, region, authPath);
      grandTotalUploaded += totalUploaded;
      grandTotalFailed += totalFailed;
      grandListingUpdated += listingUpdated;

      console.log(`\n✅ [${region.name}] 완료: ${totalUploaded}장 업로드, ${listingUpdated}개 매물 업데이트\n`);
    }

    console.log(`\n✅ 전체 완료: ${grandTotalUploaded}장 업로드, ${grandListingUpdated}개 매물 업데이트, ${grandTotalFailed}개 실패\n`);

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
