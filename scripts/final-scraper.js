#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

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

async function scrapeRegion(browser, region, maxPages = 5) {
  let allListings = [];

  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    const url = `https://www.xn--3e0b036btifksj.com/${region.boardPath}/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=${pageNum}`;
  console.log(`\n📍 [${region.name}] 크롤링...`);

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);

      // 매물 링크 추출
      const listings = await page.evaluate(() => {
      const items = [];
      const links = document.querySelectorAll('a.title_link._fade_link');

      links.forEach((link) => {
        const title = link.querySelector('span')?.textContent?.trim();
        const onclick = link.getAttribute('onclick');

        // 이미지 URL 추출 (같은 행의 이미지)
        let imageUrl = null;
        const row = link.closest('.list_text_title') || link.closest('li');
        if (row) {
          const parentLi = link.closest('li');
          if (parentLi) {
            const siblingImg = parentLi.parentElement?.querySelector('img.board_thumb');
            if (siblingImg) {
              imageUrl = siblingImg.getAttribute('src');
            }
          }
        }

        if (title && title.length > 0 && onclick && !title.includes('공지')) {
          // Base64 디코딩으로 URL 추출 시도
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

      console.log(`    페이지 ${pageNum}: ${listings.length}개`);
      allListings.push(...listings.map(l => ({ ...l, region: region.name })));

      await page.close();
      await context.close();

      // 페이지 간 딜레이
      if (pageNum < maxPages) {
        await new Promise(r => setTimeout(r, 2000));
      }

    } catch (error) {
      console.error(`❌ 페이지 ${pageNum} 오류:`, error.message);
    }
  }

  return allListings;
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    console.log('🚀 PC천국 최종 스크래퍼\n');

    const allListings = [];

    for (const region of REGIONS) {
      const listings = await scrapeRegion(browser, region, 1);
      allListings.push(...listings);

      const delay = 6000 + Math.random() * 3000;
      console.log(`⏱️  ${(delay / 1000).toFixed(1)}초 대기...`);
      await new Promise(r => setTimeout(r, delay));
    }

    console.log(`\n✅ 총 ${allListings.length}개 매물 수집됨`);

    // 결과 저장
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    fs.writeFileSync(
      path.join(outputDir, 'final-listings.json'),
      JSON.stringify(allListings, null, 2)
    );

    console.log('📄 저장: scripts/output/final-listings.json');

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
