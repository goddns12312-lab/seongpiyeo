const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function analyze() {
  let browser, page;
  try {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();

    const url = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=8';
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // 첫번째 게시글(이미지 있는)의 상세 HTML 저장
    const firstPostHtml = await page.evaluate(() => {
      const postElements = document.querySelectorAll('ul.list');
      let found = null;
      
      postElements.forEach(elem => {
        const img = elem.querySelector('img.board_thumb');
        if (img && !found) {
          found = elem.outerHTML;
        }
      });
      
      return found;
    });

    if (firstPostHtml) {
      fs.writeFileSync(
        path.join(__dirname, 'first-post-html.txt'),
        firstPostHtml,
        'utf-8'
      );
      console.log('✓ 첫번째 게시글 HTML 저장됨');
      console.log(`크기: ${firstPostHtml.length}자`);
      
      // 구조 분석
      const structure = {
        hasImg: firstPostHtml.includes('<img'),
        hasBoardThumb: firstPostHtml.includes('board_thumb'),
        hasDataAttrs: firstPostHtml.includes('data-'),
        images: (firstPostHtml.match(/src="[^"]*"/g) || []).slice(0, 5),
      };
      
      console.log('\n구조 분석:');
      console.log(JSON.stringify(structure, null, 2));
    }

  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

analyze();
