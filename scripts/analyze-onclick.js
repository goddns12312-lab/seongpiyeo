const { chromium } = require('playwright');
const fs = require('fs');

// Base64 디코딩
function decodeBase64(str) {
  try {
    return Buffer.from(str, 'base64').toString('utf-8');
  } catch (e) {
    return str;
  }
}

// URL 디코딩
function decodeURL(str) {
  try {
    return decodeURIComponent(str);
  } catch (e) {
    return str;
  }
}

async function analyzeOnclick() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const boardUrl = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=8';
  
  console.log('📄 목록 페이지 분석 중...\n');
  await page.goto(boardUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

  const posts = await page.evaluate(() => {
    const items = [];
    const postElements = document.querySelectorAll('ul.list');

    postElements.forEach((elem, idx) => {
      try {
        // 제목
        const titleSpan = elem.querySelector('li.tit span');
        const title = titleSpan?.textContent?.trim();

        // onclick 속성에서 파라미터 추출
        const titleLink = elem.querySelector('a.title_link');
        const onclickAttr = titleLink?.getAttribute('onclick') || '';
        
        // 정규식으로 첫 번째 문자열 파라미터 추출
        const match = onclickAttr.match(/openLogin\('([^']+)'/);
        const encodedUrl = match ? match[1] : '';

        // Post ID (like_btn_xxx에서 추출)
        const likeBtn = elem.querySelector('[id^="like_btn_"]');
        const postId = likeBtn?.id?.replace('like_btn_', '') || '';

        // 요약
        const summary = elem.querySelector('small.body_font_color_50')?.textContent?.trim() || '';

        items.push({
          title,
          postId,
          onclickParam: encodedUrl,
          summary,
          index: idx
        });
      } catch (e) {
        console.error(`게시글 ${idx} 파싱 오류:`, e.message);
      }
    });

    return items;
  });

  console.log(`발견된 게시글: ${posts.length}개\n`);

  posts.forEach((post, i) => {
    console.log(`\n=== 게시글 ${i + 1} ===`);
    console.log(`📌 제목: ${post.title}`);
    console.log(`🔑 Post ID: ${post.postId}`);
    console.log(`📝 요약: ${post.summary.substring(0, 100)}...`);
    
    if (post.onclickParam) {
      console.log(`\n🔗 onclick 파라미터 분석:`);
      console.log(`  원본: ${post.onclickParam}`);
      
      // Base64 디코딩 시도
      const decoded = decodeBase64(post.onclickParam);
      console.log(`  Base64 디코드: ${decoded}`);
      
      // URL 디코딩
      const urlDecoded = decodeURL(decoded);
      console.log(`  URL 디코드: ${urlDecoded}`);
    }
  });

  // 파일로 저장
  fs.writeFileSync(
    'c:/Users/B/Desktop/aass/scripts/posts-list-parsed.json',
    JSON.stringify(posts, null, 2),
    'utf-8'
  );
  console.log(`\n✅ posts-list-parsed.json 저장됨`);

  await browser.close();
}

analyzeOnclick().catch(err => {
  console.error('오류:', err.message);
  process.exit(1);
});
