#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function checkLinks() {
  const browser = await chromium.launch({ headless: true });
  const authPath = path.join(__dirname, 'playwright-auth.json');
  const storageState = fs.existsSync(authPath) ? JSON.parse(fs.readFileSync(authPath, 'utf-8')) : null;
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    storageState
  });
  const page = await context.newPage();

  try {
    for (let pageNum of [1, 2, 8]) {
      await page.goto(`https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=${pageNum}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      const links = await page.evaluate(() => {
        const wrap = document.querySelector('span.post_link_wrap');
        const link = wrap?.querySelector('a.title_link._fade_link');
        return {
          href: link?.getAttribute('href'),
          onclick: link?.getAttribute('onclick'),
          title: link?.querySelector('span')?.textContent?.trim()
        };
      });

      console.log(`Page ${pageNum}:`);
      console.log(`  title: ${links.title}`);
      console.log(`  href: ${links.href?.slice(0, 80) || '(null)'}`);
      console.log(`  onclick: ${links.onclick ? '(yes)' : '(no)'}`);
    }
  } finally {
    await browser.close();
  }
}

checkLinks().catch(console.error);
