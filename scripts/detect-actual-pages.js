#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('\n🔍 피씨천국 실제 페이지 수 감지 중...\n');

  try {
    const browser = await chromium.launch({ headless: true });

    let storageState = undefined;
    if (fs.existsSync(path.join(__dirname, 'playwright-auth.json'))) {
      storageState = JSON.parse(fs.readFileSync(path.join(__dirname, 'playwright-auth.json'), 'utf-8'));
    }

    const context = await browser.newContext({ storageState });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);

    await page.goto('https://www.xn--3e0b036btifksj.com/40/', { waitUntil: 'networkidle' });

    // 방법 1: 페이지 링크에서 p= 파라미터 추출
    const pageLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="?p="]'));
      return links.map(link => {
        const match = link.href.match(/[?&]p=(\d+)/);
        return match ? parseInt(match[1]) : null;
      }).filter(n => n && n > 0);
    });

    // 방법 2: 텍스트에서 페이지 숫자 찾기
    const bodyText = await page.evaluate(() => document.body.innerText);
    const pageNumbers = [];
    const regex = /(?:페이지|page|<|>|\|)\s*(\d{1,3})\s*(?:페이지|page|<|>|\|)/gi;
    let match;
    while ((match = regex.exec(bodyText)) !== null) {
      const num = parseInt(match[1]);
      if (num > 0 && num < 1000) pageNumbers.push(num);
    }

    const allPages = [...new Set([...pageLinks, ...pageNumbers])].sort((a, b) => a - b);

    console.log('📄 감지된 페이지:');
    console.log('  페이지 링크에서:', pageLinks.sort((a, b) => a - b));
    console.log('  텍스트에서:', pageNumbers.sort((a, b) => a - b));
    console.log('\n✅ 모든 페이지:', allPages);
    console.log(`\n🎯 마지막 페이지: ${Math.max(...allPages)}`);
    console.log(`📊 총 페이지 수: ${allPages.length}개`);

    await browser.close();
  } catch (error) {
    console.error('❌ 오류:', error.message);
    process.exit(1);
  }
})();
