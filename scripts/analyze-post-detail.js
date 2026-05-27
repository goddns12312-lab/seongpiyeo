const { chromium } = require('playwright');

async function analyze() {
  let browser;
  let page;

  try {
    console.log('게시글 상세 페이지 분석 중...');

    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();

    // 게시글 목록에서 첫번째 게시글의 링크를 찾아야 함
    // 먼저 목록 페이지에서 첫 게시글 URL 추출
    const listUrl = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=8';
    await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // 첫 게시글의 링크 찾기
    const firstPostUrl = await page.evaluate(() => {
      const link = document.querySelector('ul.list li.tit a');
      return link?.getAttribute('href');
    });

    console.log('첫 게시글 URL:', firstPostUrl);

    if (firstPostUrl) {
      const detailUrl = 'https://www.xn--3e0b036btifksj.com' + firstPostUrl;
      console.log('상세 페이지 URL:', detailUrl);
      
      await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

      // 상세 페이지 분석
      const info = await page.evaluate(() => {
        return {
          title: document.querySelector('h1, .title, .post_title')?.textContent?.trim(),
          content: document.querySelector('.post_content, .content, .body, main')?.textContent?.trim()?.substring(0, 500),
          images: Array.from(document.querySelectorAll('img:not(.ad):not(.banner):not(.logo)')).map(img => ({
            src: img.src || img.dataset.src,
            alt: img.alt
          })).slice(0, 10),
          selectors: {
            h1: document.querySelectorAll('h1').length,
            '.post_content': document.querySelectorAll('.post_content').length,
            '.content': document.querySelectorAll('.content').length,
            'img': document.querySelectorAll('img').length,
          }
        };
      });

      console.log('\n=== 상세 페이지 정보 ===');
      console.log('제목:', info.title);
      console.log('\n내용 일부:');
      console.log(info.content);
      console.log('\n이미지 개수:', info.images.length);
      if (info.images.length > 0) {
        console.log('이미지 URLs:');
        info.images.forEach((img, idx) => {
          console.log(`  ${idx + 1}. ${img.src?.substring(0, 80)}...`);
        });
      }
      console.log('\nSelectors:', info.selectors);

      // HTML 저장
      const fs = require('fs');
      const path = require('path');
      const html = await page.content();
      fs.writeFileSync(
        path.join(__dirname, 'post-detail-page.html'),
        html,
        'utf-8'
      );
      console.log('\n✓ HTML 저장됨: scripts/post-detail-page.html');
    }

  } catch (error) {
    console.error('오류:', error.message);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

analyze();
