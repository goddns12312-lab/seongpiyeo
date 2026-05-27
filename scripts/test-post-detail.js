const { chromium } = require('playwright');

async function test() {
  let browser, page;
  try {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();

    // 게시글 ID로 상세 페이지 시도
    const postId = 'p20230501948641a7bc92f';
    const urls = [
      `https://www.xn--3e0b036btifksj.com/40/?mode=view&id=${postId}`,
      `https://www.xn--3e0b036btifksj.com/40/?id=${postId}`,
      `https://www.xn--3e0b036btifksj.com/40/view/?id=${postId}`,
    ];

    for (const url of urls) {
      try {
        console.log(`시도: ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        const content = await page.evaluate(() => {
          return {
            url: window.location.href,
            title: document.body.textContent.substring(0, 100),
            hasContent: document.body.textContent.length > 100,
          };
        });

        console.log(`✓ 로드됨: ${content.url}`);
        if (content.hasContent) {
          console.log('✓ 컨텐츠 있음');
          break;
        }
      } catch (e) {
        console.log(`✗ 실패: ${e.message}`);
      }
    }

  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

test();
