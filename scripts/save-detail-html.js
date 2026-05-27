const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function save() {
  let browser, page;
  try {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();

    const detailUrl = 'https://www.xn--3e0b036btifksj.com/40/?mode=view&id=p20230501948641a7bc92f';
    await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const html = await page.content();
    fs.writeFileSync(
      path.join(__dirname, 'post-detail-page.html'),
      html,
      'utf-8'
    );
    console.log('✓ HTML 저장됨: scripts/post-detail-page.html');

  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

save();
