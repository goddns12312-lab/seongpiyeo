#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function checkDetailPageContent() {
  const browser = await chromium.launch({ headless: true });
  const authPath = path.join(__dirname, 'playwright-auth.json');
  const storageState = fs.existsSync(authPath) ? JSON.parse(fs.readFileSync(authPath, 'utf-8')) : null;
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    storageState
  });
  const page = await context.newPage();

  try {
    // Get first listing URL from list page
    const listUrl = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=8';
    await page.goto(listUrl, { waitUntil: 'networkidle', timeout: 30000 });

    const detailUrl = await page.evaluate(() => {
      const link = document.querySelector('a.title_link._fade_link');
      return link?.getAttribute('href');
    });

    if (!detailUrl || detailUrl === 'javascript:;') {
      console.log('❌ Could not get detail URL');
      return;
    }

    const fullUrl = `https://www.xn--3e0b036btifksj.com${detailUrl}`;
    console.log('📄 Navigating to:', fullUrl.slice(0, 100) + '...\n');

    await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Get page content
    const content = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const lines = bodyText.split('\n');

      return {
        pageTitle: document.title,
        bodyLength: bodyText.length,
        h1: document.querySelector('h1')?.textContent?.trim(),
        h2: document.querySelector('h2')?.textContent?.trim(),
        h3: document.querySelector('h3')?.textContent?.trim(),
        firstLines: lines.slice(0, 50).map(l => l.trim()).filter(l => l),
        linesWith: {
          '보증금': lines.filter(l => l.includes('보증금')).slice(0, 3),
          '권리금': lines.filter(l => l.includes('권리금')).slice(0, 3),
          '월세': lines.filter(l => l.includes('월세')).slice(0, 3),
          'idx': lines.filter(l => l.match(/^\d+\./)).slice(0, 15)
        }
      };
    });

    console.log('Page Title:', content.pageTitle);
    console.log('Body Length:', content.bodyLength);
    console.log('H1:', content.h1);
    console.log('\nFirst 50 lines:');
    content.firstLines.forEach((line, i) => {
      console.log(`  ${line.slice(0, 100)}`);
    });

    console.log('\nLines matching 보증금:', content.linesWith['보증금']);
    console.log('\nLines matching 권리금:', content.linesWith['권리금']);
    console.log('\nLines matching 월세:', content.linesWith['월세']);
    console.log('\nLines starting with numbers:');
    content.linesWith['idx'].forEach(line => {
      console.log(`  ${line.slice(0, 100)}`);
    });

  } finally {
    await browser.close();
  }
}

checkDetailPageContent().catch(console.error);
