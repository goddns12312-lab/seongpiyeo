const { chromium } = require('playwright');

async function find() {
  let browser, page;
  try {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();

    // 네비게이션 감시
    page.on('response', response => {
      console.log(`응답: ${response.status()} - ${response.url()}`);
    });

    const url = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=8';
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    console.log('\n게시글 클릭 시도 중...');

    // 첫 번째 게시글 제목 클릭
    await page.click('a.title_link');

    // 네비게이션 완료 대기
    await page.waitForNavigation({ timeout: 5000 }).catch(() => console.log('네비게이션 없음'));

    const finalUrl = page.url();
    console.log('\n최종 URL:', finalUrl);
    
    // 페이지 제목
    const title = await page.title();
    console.log('페이지 제목:', title);

    // HTML 저장
    const fs = require('fs');
    const path = require('path');
    const html = await page.content();
    fs.writeFileSync(
      path.join(__dirname, 'real-post-detail.html'),
      html,
      'utf-8'
    );
    console.log('\n✓ HTML 저장됨: scripts/real-post-detail.html');

  } catch (e) {
    console.log('오류:', e.message);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

find();
