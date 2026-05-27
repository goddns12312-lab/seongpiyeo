const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testDetailPages() {
  let browser, page;

  try {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();

    const boardUrl = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=8';
    await page.goto(boardUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // 게시글 ID 추출
    const postIds = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[id^="like_btn_"]'))
        .slice(0, 2)
        .map(btn => btn.id.replace('like_btn_', ''));
    });

    console.log(`발견된 게시글 ID: ${postIds.join(', ')}\n`);

    // 각 게시글의 상세 페이지 접근
    for (let i = 0; i < postIds.length; i++) {
      const postId = postIds[i];
      const detailUrl = `https://www.xn--3e0b036btifksj.com/40/?mode=view&id=${postId}`;
      
      console.log(`\n=== 게시글 ${i + 1} (ID: ${postId}) ===`);
      console.log(`URL: ${detailUrl}`);

      await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      const images = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('[data-widget-type="image"] img'))
          .map(img => img.src || '')
          .filter(src => src && src.includes('cdn.imweb.me'))
          .filter((url, idx, arr) => arr.indexOf(url) === idx);
      });

      console.log(`발견된 이미지 (${images.length}개):`);
      images.forEach((img, j) => {
        console.log(`  ${j + 1}. ${img}`);
      });

      // HTML 파일로 저장 (비교용)
      const html = await page.content();
      fs.writeFileSync(
        path.join(__dirname, `detail-page-${i + 1}-${postId}.html`),
        html,
        'utf-8'
      );
      console.log(`  → detail-page-${i + 1}-${postId}.html 저장됨`);
    }

  } finally {
    if (browser) await browser.close();
  }
}

testDetailPages().catch(err => {
  console.error('오류:', err.message);
  process.exit(1);
});
