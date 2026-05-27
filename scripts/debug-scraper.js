/**
 * 디버그 스크래퍼 - 페이지 구조 분석용
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function debug() {
  let browser;
  let page;

  try {
    console.log('디버그 시작: PC천국 페이지 분석');

    browser = await chromium.launch({ headless: false }); // 브라우저 보임
    page = await browser.newPage();

    const url = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=1';

    console.log(`페이지 접속: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

    // 페이지 제목
    const title = await page.title();
    console.log(`페이지 제목: ${title}`);

    // 페이지 HTML 저장
    const html = await page.content();
    fs.writeFileSync(
      path.join(__dirname, 'debug-page.html'),
      html,
      'utf-8'
    );
    console.log('HTML 저장됨: scripts/debug-page.html');

    // 모든 링크 찾기
    const allLinks = await page.locator('a').count();
    console.log(`총 링크 개수: ${allLinks}`);

    // detail 링크 찾기
    const detailLinks = await page.locator('a[href*="/detail"]').count();
    console.log(`detail 링크: ${detailLinks}`개);

    if (detailLinks > 0) {
      const firstLink = await page.locator('a[href*="/detail"]').first().innerText();
      console.log(`첫 번째 링크 텍스트: ${firstLink}`);
    }

    // 모든 테이블 찾기
    const tables = await page.locator('table').count();
    console.log(`테이블 개수: ${tables}`);

    // div 구조 확인
    const divs = await page.locator('div').count();
    console.log(`div 개수: ${divs}`);

    // 페이지 스크린샷 저장
    await page.screenshot({
      path: path.join(__dirname, 'debug-page.png'),
      fullPage: true,
    });
    console.log('스크린샷 저장됨: scripts/debug-page.png');

    // 다양한 셀렉터 테스트
    const selectors = [
      'a[href*="/detail"]',
      'a[href*="detail"]',
      'tr td a',
      '.list-item a',
      '[class*="post"] a',
      'table a',
    ];

    console.log('\n셀렉터 테스트 결과:');
    for (const selector of selectors) {
      try {
        const count = await page.locator(selector).count();
        console.log(`  ${selector}: ${count}개`);
      } catch (e) {
        console.log(`  ${selector}: 오류`);
      }
    }

  } catch (error) {
    console.error(`오류: ${error.message}`);
  } finally {
    // 60초 후 자동 종료
    console.log('\n60초 후 종료됩니다...');
    setTimeout(async () => {
      if (page) await page.close();
      if (browser) await browser.close();
      console.log('종료됨');
      process.exit(0);
    }, 60000);
  }
}

debug();
