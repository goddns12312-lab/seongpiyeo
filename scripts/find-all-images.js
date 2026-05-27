const { chromium } = require('playwright');

async function findImages() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const boardUrl = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=8';
  await page.goto(boardUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

  const postId = await page.evaluate(() => {
    return document.querySelector('[id^="like_btn_"]')?.id.replace('like_btn_', '') || '';
  });

  console.log(`첫 번째 게시글 ID: ${postId}\n`);

  const detailUrl = `https://www.xn--3e0b036btifksj.com/40/?mode=view&id=${postId}`;
  await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // 모든 img 태그 찾기
  const allImages = await page.evaluate(() => {
    const images = [];
    document.querySelectorAll('img').forEach((img, idx) => {
      const src = img.src || '';
      if (src.includes('cdn.imweb.me') && !src.includes('vendor-cdn')) {
        // 부모 요소의 data-widget-type 확인
        let parent = img.parentElement;
        let widgetType = 'unknown';
        for (let i = 0; i < 5; i++) {
          if (parent?.dataset?.widgetType) {
            widgetType = parent.dataset.widgetType;
            break;
          }
          parent = parent?.parentElement;
        }
        images.push({ src, widgetType, idx });
      }
    });
    return images;
  });

  console.log(`총 ${allImages.length}개 이미지 발견:\n`);
  allImages.forEach(({ src, widgetType }, i) => {
    console.log(`${i + 1}. [${widgetType}]`);
    console.log(`   ${src}\n`);
  });

  await browser.close();
}

findImages().catch(err => console.error('오류:', err.message));
