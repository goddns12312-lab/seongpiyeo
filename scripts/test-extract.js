#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Copy of extractPostDetails from scrape-with-details.js
async function extractPostDetails(page) {
  return await page.evaluate(() => {
    const bodyText = document.body.innerText;
    const lines = bodyText.split('\n');
    const items = {};
    const debugInfo = [];

    // 1~12번 항목 추출 (정확한 번호 기반 파싱)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      for (let itemNum = 1; itemNum <= 12; itemNum++) {
        const numPattern = `${itemNum}\\.\\s*`;
        const regex = new RegExp(`^${numPattern}`);
        if (regex.test(line)) {
          // 항목명과 값 추출
          const colonIdx = line.indexOf(':');
          const colonIdx2 = line.indexOf('：');
          const splitIdx = colonIdx > -1 ? colonIdx : colonIdx2;

          if (splitIdx > -1) {
            // BUG FIX: Use regex match length, not pattern string length
            const matchResult = line.match(regex);
            const patternEndIdx = matchResult[0].length;
            const itemName = line.substring(patternEndIdx, splitIdx).trim();
            const itemValue = line.substring(splitIdx + 1).trim();

            debugInfo.push({
              itemNum,
              line: line.slice(0, 50),
              itemName,
              itemValue
            });

            const itemMapping = {
              '보증금': 'deposit',
              '희망권리금': 'premium',
              '월세': 'monthly_rent',
              '매물위치': 'location'
            };

            const matchedKey = Object.keys(itemMapping).find(k => itemName.includes(k));
            if (matchedKey) {
              items[itemMapping[matchedKey]] = itemValue;
            }
          }
          break;
        }
      }
    }

    // 이미지 추출
    const images = Array.from(document.querySelectorAll('img[src*="cdn.imweb"]'))
      .map(img => img.getAttribute('src'))
      .filter((src, idx, arr) => arr.indexOf(src) === idx);

    return { items, images, bodyText, debugInfo };
  });
}

async function testExtract() {
  const browser = await chromium.launch({ headless: true });
  const authPath = path.join(__dirname, 'playwright-auth.json');
  const storageState = fs.existsSync(authPath) ? JSON.parse(fs.readFileSync(authPath, 'utf-8')) : null;
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    storageState
  });
  const page = await context.newPage();

  try {
    const listUrl = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=8';
    await page.goto(listUrl, { waitUntil: 'networkidle', timeout: 30000 });

    const detailUrl = await page.evaluate(() => {
      const link = document.querySelector('a.title_link._fade_link');
      return link?.getAttribute('href');
    });

    const fullUrl = `https://www.xn--3e0b036btifksj.com${detailUrl}`;
    await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });

    console.log('📄 Testing extractPostDetails with BUG FIX...\n');
    const result = await extractPostDetails(page);

    console.log('Debug info for items 5-7:');
    result.debugInfo.filter(d => d.itemNum >= 5 && d.itemNum <= 7).forEach(info => {
      console.log(`  Item ${info.itemNum}: name="${info.itemName}" value="${info.itemValue}"`);
    });

    console.log('\n✅ Extracted items:');
    console.log(JSON.stringify(result.items, null, 2));

  } finally {
    await browser.close();
  }
}

testExtract().catch(console.error);
