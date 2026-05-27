const { chromium } = require('playwright');
const fs = require('fs');

async function extractFromList() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const boardUrl = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=8';
  
  console.log('📄 목록 페이지에서 모든 정보 추출 중...\n');
  await page.goto(boardUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

  const posts = await page.evaluate(() => {
    const items = [];

    document.querySelectorAll('ul.list').forEach((elem, idx) => {
      try {
        // 제목
        const titleSpan = elem.querySelector('li.tit span');
        const title = titleSpan?.textContent?.trim() || '';

        // Post ID
        const likeBtn = elem.querySelector('[id^="like_btn_"]');
        const postId = likeBtn?.id?.replace('like_btn_', '') || '';

        // 요약/본문 (small 태그)
        const summary = elem.querySelector('small.body_font_color_50')?.textContent?.trim() || '';

        // 썸네일 이미지
        const thumbImg = elem.querySelector('img.board_thumb');
        const thumbnailUrl = thumbImg?.getAttribute('src') || '';

        // 작성자
        const author = elem.querySelector('li.author')?.textContent?.trim() || '';

        // 날짜
        const timeElem = elem.querySelector('li.time');
        const datetime = timeElem?.getAttribute('title') || timeElem?.textContent?.trim() || '';

        // 조회수
        const views = elem.querySelector('li.views')?.textContent?.match(/\d+/)?.[0] || '0';

        // 댓글 수
        const comments = elem.querySelector('.comment-count span')?.textContent?.trim() || '0';

        // 좋아요
        const likes = elem.querySelector('[id^="like_count_"]')?.textContent?.trim() || '0';

        if (title && postId) {
          items.push({
            title,
            postId,
            detailUrl: `https://www.xn--3e0b036btifksj.com/40/?mode=view&id=${postId}`,
            thumbnailUrl,
            summary,
            author,
            datetime,
            views,
            comments,
            likes
          });
        }
      } catch (e) {
        console.error(`파싱 오류:`, e.message);
      }
    });

    return items;
  });

  console.log(`✅ 추출된 게시글: ${posts.length}개\n`);

  posts.forEach((post, i) => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📌 게시글 ${i + 1}`);
    console.log(`${'='.repeat(80)}`);
    console.log(`제목: ${post.title}`);
    console.log(`Post ID: ${post.postId}`);
    console.log(`상세URL: ${post.detailUrl}`);
    console.log(`\n📝 요약/본문:`);
    console.log(post.summary);
    console.log(`\n🖼️ 썸네일: ${post.thumbnailUrl}`);
    console.log(`👤 작성자: ${post.author}`);
    console.log(`📅 날짜: ${post.datetime}`);
    console.log(`👀 조회수: ${post.views}`);
    console.log(`💬 댓글: ${post.comments}`);
    console.log(`❤️ 좋아요: ${post.likes}`);
  });

  // JSON 저장
  fs.writeFileSync(
    'c:/Users/B/Desktop/aass/scripts/posts-list-full.json',
    JSON.stringify(posts, null, 2),
    'utf-8'
  );

  console.log(`\n\n✅ posts-list-full.json 저장됨`);

  await browser.close();
}

extractFromList().catch(err => {
  console.error('오류:', err.message);
  process.exit(1);
});
