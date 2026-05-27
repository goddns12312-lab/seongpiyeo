const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'https://www.xn--3e0b036btifksj.com';

async function scrapeByClicking() {
  const browser = await chromium.launch({ headless: false }); // 화면 보기
  const page = await browser.newPage();

  console.log('📄 게시판 목록 페이지로 이동 중...\n');
  const boardUrl = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=8';
  await page.goto(boardUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // 게시글 목록 추출
  const posts = await page.evaluate(() => {
    const items = [];
    document.querySelectorAll('ul.list').forEach((elem, idx) => {
      const titleSpan = elem.querySelector('li.tit span');
      const title = titleSpan?.textContent?.trim();
      const postId = elem.querySelector('[id^="like_btn_"]')?.id?.replace('like_btn_', '') || '';
      
      if (title && postId) {
        items.push({ title, postId, index: idx });
      }
    });
    return items;
  });

  console.log(`발견된 게시글: ${posts.length}개\n`);

  const results = [];

  // 각 게시글을 클릭해서 진입
  for (let i = 0; i < Math.min(2, posts.length); i++) {
    const post = posts[i];
    
    console.log(`\n📖 게시글 ${i + 1}/${Math.min(2, posts.length)} - ${post.title}`);
    console.log(`🔗 클릭으로 진입 중...`);

    try {
      // 목록 페이지로 돌아가기
      await page.goto(boardUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // 해당 게시글의 제목 링크 클릭
      const titleLinks = await page.$$('a.title_link');
      if (titleLinks.length > i) {
        await titleLinks[i].click();
        await page.waitForNavigation({ timeout: 10000 }).catch(() => {});
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 현재 URL 확인
        const currentUrl = page.url();
        console.log(`✓ 현재 URL: ${currentUrl}`);

        // 상세 페이지 내용 추출
        const details = await page.evaluate(() => {
          const content = document.body.innerText || '';
          const title = document.querySelector('h1, .page-title, [class*="title"]')?.textContent?.trim() || '';
          
          const images = Array.from(document.querySelectorAll('img'))
            .map(img => img.src || '')
            .filter(src => src && src.includes('cdn.imweb.me') && !src.includes('vendor-cdn'))
            .filter((url, idx, arr) => arr.indexOf(url) === idx);

          return {
            title,
            contentLength: content.length,
            content: content.substring(0, 500),
            images
          };
        });

        console.log(`✓ 제목: ${details.title}`);
        console.log(`✓ 본문 길이: ${details.contentLength}자`);
        console.log(`✓ 이미지: ${details.images.length}개`);

        if (details.images.length > 0) {
          console.log(`  이미지들:`);
          details.images.slice(0, 5).forEach((img, j) => {
            console.log(`    ${j + 1}. ${img.substring(0, 70)}...`);
          });
        }

        results.push({
          ...post,
          url: currentUrl,
          details
        });

      }
    } catch (error) {
      console.log(`❌ 오류: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  fs.writeFileSync(
    'c:/Users/B/Desktop/aass/scripts/posts-by-clicking.json',
    JSON.stringify(results, null, 2),
    'utf-8'
  );

  console.log(`\n\n✅ posts-by-clicking.json 저장됨`);
  
  await browser.close();
}

scrapeByClicking().catch(err => {
  console.error('오류:', err.message);
  process.exit(1);
});
