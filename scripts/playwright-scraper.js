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

async function scrapeRegion(browser, region, pageNum = 1) {
  const url = `https://www.xn--3e0b036btifksj.com/${region.boardPath}/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=${pageNum}`;
  console.log(`\n📍 [${region.name}] ${url}`);

  const page = await browser.newPage();

  // User-Agent 설정 (실제 브라우저처럼)
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000); // JavaScript 실행 대기

    // 모든 링크 추출
    const listings = await page.evaluate(() => {
      const items = [];
      const rows = document.querySelectorAll('tbody tr'); // 테이블 행들

      rows.forEach((row, idx) => {
        const titleCell = row.querySelector('td:nth-child(2)'); // 제목 셀
        const linkElem = titleCell?.querySelector('a');

        if (!linkElem) return;

        const title = linkElem.textContent?.trim() || '';
        const onclick = linkElem.getAttribute('onclick');
        const dataIdx = linkElem.getAttribute('data-idx');

        // onclick에서 idx 추출: onclick="goPage('40/index.php?bmode=view&idx=171322689')"
        let extractedIdx = null;
        if (onclick) {
          const match = onclick.match(/idx=(\d+)/);
          if (match) extractedIdx = match[1];
        } else if (dataIdx) {
          extractedIdx = dataIdx;
        }

        if (title && extractedIdx) {
          items.push({ title, idx: extractedIdx });
        }
      });

      return items;
    });

    console.log(`  Found ${listings.length} listings on page ${pageNum}`);
    listings.slice(0, 3).forEach(l => {
      console.log(`    - ${l.title.substring(0, 30)} (idx: ${l.idx})`);
    });

    return listings;
  } catch (error) {
    console.error(`❌ Error scraping ${region.name}:`, error.message);
    return [];
  } finally {
    await page.close();
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    console.log('🚀 PC천국 Playwright 스크래퍼 시작');

    const allListings = [];

    for (const region of REGIONS) {
      const listings = await scrapeRegion(browser, region, 1);
      allListings.push(...listings.map(l => ({ ...l, region: region.name })));

      // 각 지역 간 큰 딜레이 (차단 방지)
      const delay = 5000 + Math.random() * 3000; // 5-8초 랜덤 딜레이
      console.log(`⏱️  ${(delay/1000).toFixed(1)}초 대기 중...`);
      await new Promise(r => setTimeout(r, delay));
    }

    console.log(`\n✅ 총 ${allListings.length}개 매물 수집됨`);

    // 결과 저장
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    fs.writeFileSync(
      path.join(outputDir, 'playwright-listings.json'),
      JSON.stringify(allListings, null, 2)
    );

    console.log('📄 결과 저장: scripts/output/playwright-listings.json');

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
