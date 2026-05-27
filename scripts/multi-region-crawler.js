#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const playwright = require('playwright');

// 사용자가 제공한 지역별 링크
const REGIONS = [
  {
    name: '서울',
    boardUrl: 'https://www.xn--3e0b036btifksj.com/40/',
    page: 8
  },
  {
    name: '경기',
    boardUrl: 'https://www.xn--3e0b036btifksj.com/93/',
    page: 27
  },
  {
    name: '강원',
    boardUrl: 'https://www.xn--3e0b036btifksj.com/92/',
    page: 2
  },
  {
    name: '인천',
    boardUrl: 'https://www.xn--3e0b036btifksj.com/91/',
    page: 9
  },
  {
    name: '충북',
    boardUrl: 'https://www.xn--3e0b036btifksj.com/90/',
    page: 9
  },
  {
    name: '충남',
    boardUrl: 'https://www.xn--3e0b036btifksj.com/89/',
    page: 9
  },
  {
    name: '경북',
    boardUrl: 'https://www.xn--3e0b036btifksj.com/88/',
    page: 9
  },
  {
    name: '경남',
    boardUrl: 'https://www.xn--3e0b036btifksj.com/87/',
    page: 9
  },
  {
    name: '전북',
    boardUrl: 'https://www.xn--3e0b036btifksj.com/86/',
    page: 2
  },
  {
    name: '전남',
    boardUrl: 'https://www.xn--3e0b036btifksj.com/85/',
    page: 5
  },
  {
    name: '제주',
    boardUrl: 'https://www.xn--3e0b036btifksj.com/84/',
    page: 1
  }
];

const OUTPUT_DIR = path.join(__dirname, 'output');
const allListings = [];
let totalCount = 0;

function log(...args) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]`, ...args);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function crawlRegion(browser, region) {
  log(`\n📍 ${region.name} 크롤링...`);

  const authPath = path.join(__dirname, 'playwright-auth.json');
  let context;

  if (fs.existsSync(authPath)) {
    const storageState = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
    context = await browser.newContext({ storageState });
  } else {
    context = await browser.newContext();
  }

  const page = await context.newPage();

  try {
    let regionListings = [];
    const seenIdx = new Set();

    for (let pageNum = region.page; pageNum >= 1; pageNum--) {
      const url = `${region.boardUrl}?page=${pageNum}`;

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await sleep(500);

        const links = await page.evaluate(() => {
          const linkElements = document.querySelectorAll('.title_link._fade_link');
          return Array.from(linkElements).map(a => ({
            href: a.getAttribute('href'),
            text: a.textContent
          }));
        });

        log(`  페이지 ${pageNum}: ${links.length}개 링크`);

        for (const link of links) {
          if (!link.href) continue;
          const idxMatch = link.href.match(/idx=(\d+)/);
          if (!idxMatch) continue;

          const idx = idxMatch[1];
          if (!seenIdx.has(idx)) {
            seenIdx.add(idx);
            regionListings.push({ idx, title: link.text.substring(0, 100) });
          }
        }
      } catch (err) {
        log(`  ⚠️  페이지 ${pageNum} 오류: ${err.message}`);
        continue;
      }

      await sleep(300);
    }

    log(`  ✅ ${region.name}: ${seenIdx.size}개 고유 매물`);
    totalCount += seenIdx.size;
    return seenIdx.size;

  } catch (error) {
    log(`  ❌ ${region.name} 크롤링 실패: ${error.message}`);
    return 0;
  } finally {
    await page.close();
    await context.close();
  }
}

async function main() {
  log('════════════════════════════════════════════════════════════════════════════════');
  log('🌍 전국 지역별 매물 카운팅');
  log('════════════════════════════════════════════════════════════════════════════════');

  let browser;

  try {
    browser = await playwright.chromium.launch({ headless: true });

    for (const region of REGIONS) {
      await crawlRegion(browser, region);
      await sleep(2000);
    }

    log('\n════════════════════════════════════════════════════════════════════════════════');
    log('📊 최종 결과');
    log('════════════════════════════════════════════════════════════════════════════════');
    log(`총 매물: ${totalCount}개\n`);

    for (const region of REGIONS) {
      log(`  ${region.name.padEnd(5)}: ${region.page}페이지`);
    }

    process.exit(0);

  } catch (error) {
    log(`❌ 오류: ${error.message}`);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

main();
