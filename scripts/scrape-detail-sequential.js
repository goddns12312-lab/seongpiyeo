const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.xn--3e0b036btifksj.com';

async function scrapeDetailSequential() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 목록 페이지에서 게시글 추출
  console.log('📄 게시판 목록 페이지 분석 중...\n');
  const boardUrl = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=8';
  await page.goto(boardUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

  const posts = await page.evaluate(() => {
    const items = [];
    document.querySelectorAll('ul.list').forEach((elem, idx) => {
      try {
        const titleSpan = elem.querySelector('li.tit span');
        const title = titleSpan?.textContent?.trim();
        const likeBtn = elem.querySelector('[id^="like_btn_"]');
        const postId = likeBtn?.id?.replace('like_btn_', '') || '';
        const summary = elem.querySelector('small.body_font_color_50')?.textContent?.trim() || '';
        
        if (title && postId) {
          items.push({ title, postId, summary });
        }
      } catch (e) {}
    });
    return items;
  });

  console.log(`✅ 발견된 게시글: ${posts.length}개\n`);

  // 각 게시글의 상세 페이지 접속
  const results = [];

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const detailUrl = `${BASE_URL}/40/?mode=view&id=${post.postId}`;
    
    console.log(`\n📖 게시글 ${i + 1}/${posts.length} 접속 중...`);
    console.log(`제목: ${post.title}`);
    console.log(`URL: ${detailUrl}`);

    try {
      await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // 상세 페이지 정보 추출
      const details = await page.evaluate(() => {
        // 제목
        const pageTitle = document.querySelector('h1, .page-title, [class*="title"]')?.textContent?.trim() 
          || document.title.replace(' - 피씨천국', '').trim();

        // 본문 텍스트 (모든 텍스트 콘텐츠)
        const contentDiv = document.querySelector('[doz_type="inside"], .content, main, article, [class*="view"]');
        const bodyText = contentDiv?.innerText || document.body.innerText || '';

        // 모든 이미지 추출
        const images = Array.from(document.querySelectorAll('img'))
          .map(img => ({
            src: img.src || '',
            alt: img.alt || '',
            className: img.className || ''
          }))
          .filter(img => img.src && img.src.includes('cdn.imweb.me'))
          .filter(img => !img.src.includes('vendor-cdn') && !img.className.includes('logo'));

        return {
          pageTitle,
          bodyText: bodyText.substring(0, 1000), // 처음 1000자
          fullBodyLength: bodyText.length,
          imageCount: images.length,
          images: images.slice(0, 20) // 최대 20개
        };
      });

      results.push({
        ...post,
        url: detailUrl,
        details
      });

      console.log(`✓ 제목: ${details.pageTitle}`);
      console.log(`✓ 본문 길이: ${details.fullBodyLength}자`);
      console.log(`✓ 이미지: ${details.imageCount}개`);
      
      if (details.images.length > 0) {
        console.log(`  이미지 URL (처음 3개):`);
        details.images.slice(0, 3).forEach((img, j) => {
          console.log(`    ${j + 1}. ${img.src.substring(0, 70)}...`);
        });
      }

      await new Promise(resolve => setTimeout(resolve, 800)); // 간격

    } catch (error) {
      console.log(`❌ 오류: ${error.message}`);
      results.push({
        ...post,
        url: detailUrl,
        error: error.message
      });
    }
  }

  // 결과 저장
  fs.writeFileSync(
    'c:/Users/B/Desktop/aass/scripts/posts-details-collected.json',
    JSON.stringify(results, null, 2),
    'utf-8'
  );

  console.log(`\n\n========== 수집 완료 ==========`);
  console.log(`✅ 총 ${results.length}개 게시글 수집됨`);
  console.log(`📁 posts-details-collected.json 저장됨`);

  await browser.close();
}

scrapeDetailSequential().catch(err => {
  console.error('오류:', err.message);
  process.exit(1);
});
