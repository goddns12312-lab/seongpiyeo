#!/usr/bin/env node

const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const REGIONS = [
  { name: '서울', boardPath: '40' },
  { name: '경기', boardPath: '93' },
  { name: '강원', boardPath: '92' },
  { name: '인천', boardPath: '91' },
  { name: '충북', boardPath: '90' },
  { name: '충남', boardPath: '89' },
  { name: '경북', boardPath: '88' },
  { name: '경남', boardPath: '87' },
  { name: '전북', boardPath: '86' },
  { name: '전남', boardPath: '85' },
  { name: '제주', boardPath: '84' },
];

async function scrapeRegion(browser, region, existingUrls) {
  let newListings = [];

  const url = `https://www.xn--3e0b036btifksj.com/${region.boardPath}/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=1`;

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const listings = await page.evaluate(() => {
      const items = [];
      const links = document.querySelectorAll('a.title_link._fade_link');

      links.forEach((link) => {
        const title = link.querySelector('span')?.textContent?.trim();
        const onclick = link.getAttribute('onclick');

        let imageUrl = null;
        const parentLi = link.closest('li');
        if (parentLi) {
          const siblingImg = parentLi.parentElement?.querySelector('img.board_thumb');
          if (siblingImg) {
            imageUrl = siblingImg.getAttribute('src');
          }
        }

        if (title && title.length > 0 && onclick && !title.includes('공지')) {
          let decodedUrl = null;
          const urlMatch = onclick.match(/openLogin\('([^']+)'/);
          if (urlMatch) {
            try {
              decodedUrl = decodeURIComponent(atob(urlMatch[1]));
            } catch (e) {}
          }

          items.push({
            title,
            imageUrl: imageUrl || null,
            decodedUrl: decodedUrl || null
          });
        }
      });

      return items;
    });

    for (const listing of listings) {
      const detailUrl = listing.decodedUrl || `https://www.xn--3e0b036btifksj.com/${region.boardPath}/?bmode=view&idx=${listing.idx}`;

      // Skip if already exists
      if (existingUrls.has(detailUrl)) {
        continue;
      }

      newListings.push({
        title: listing.title,
        imageUrl: listing.imageUrl,
        detailUrl: detailUrl,
        region: region.name
      });
    }

    await page.close();
    await context.close();

  } catch (error) {
    console.error(`❌ [${region.name}] 오류:`, error.message);
  }

  return newListings;
}

async function autoScrape() {
  const browser = await chromium.launch({ headless: true });

  try {
    console.log('🚀 자동 스크래퍼 시작\n');

    // Get existing URLs
    console.log('🔍 기존 매물 확인 중...');
    const { data: existing } = await supabase
      .from('listings')
      .select('source_url');

    const existingUrls = new Set(existing?.map(l => l.source_url) || []);
    console.log(`✅ 기존 매물: ${existingUrls.size}개\n`);

    let totalNewListings = 0;
    const now = new Date();

    for (const region of REGIONS) {
      const newListings = await scrapeRegion(browser, region, existingUrls);

      if (newListings.length > 0) {
        console.log(`\n📍 [${region.name}] 신규 ${newListings.length}개 발견`);

        // Add new listings to database
        for (let idx = 0; idx < newListings.length; idx++) {
          const listing = newListings[idx];

          // Create unique source_url using title+region hash
          const hash = crypto
            .createHash('md5')
            .update(`${listing.title}|${listing.region}`)
            .digest('hex');
          const sourceUrl = `https://pcbang.local/${hash}`;

          // Timestamp: first item is newest
          const minutesBack = newListings.length - 1 - idx;
          const createdAt = new Date(now.getTime() - minutesBack * 60000);

          const { error } = await supabase
            .from('listings')
            .insert([{
              title: listing.title,
              description: listing.title,
              price_type: 'sale',
              price: 1000,
              region: listing.region,
              source_url: sourceUrl,
              thumbnail_url: listing.imageUrl,
              main_image_url: listing.imageUrl,
              status: 'active',
              view_count: 0,
              created_at: createdAt.toISOString(),
            }]);

          if (!error) {
            totalNewListings++;
          }
        }
      }

      // Rate limiting
      await new Promise(r => setTimeout(r, 7000 + Math.random() * 2000));
    }

    console.log(`\n✅ 완료: 신규 ${totalNewListings}개 추가됨`);

  } finally {
    await browser.close();
  }
}

autoScrape().catch(console.error);
