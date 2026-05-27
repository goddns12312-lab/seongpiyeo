/**
 * 해당 페이지의 항목 개수 확인
 */

const { chromium } = require('playwright');

async function count() {
  let browser;
  let page;

  try {
    console.log('페이지 분석 시작...');

    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();

    const url = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=8';
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // 항목 개수 세기
    const counts = await page.evaluate(() => {
      const items = {
        links: document.querySelectorAll('a[href*="/detail"]').length,
        tableRows: document.querySelectorAll('table tbody tr').length,
        divs: document.querySelectorAll('[class*="post"], [class*="item"]').length,
        allAnchors: document.querySelectorAll('a').length,
      };
      return items;
    });

    console.log('\n=== 페이지 8의 항목 개수 ===');
    console.log(`상세 링크 (a[href*="/detail"]): ${counts.links}개`);
    console.log(`테이블 행: ${counts.tableRows}개`);
    console.log(`Post/Item 클래스: ${counts.divs}개`);
    console.log(`전체 링크: ${counts.allAnchors}개`);

    // 페이지 제목
    const title = await page.title();
    console.log(`\n페이지 제목: ${title}`);

  } catch (error) {
    console.error(`오류: ${error.message}`);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
    process.exit(0);
  }
}

count();
