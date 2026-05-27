const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function captureHarFixed() {
  const browser = await chromium.launch({ headless: true });
  const authFile = path.join(__dirname, 'playwright-auth.json');

  if (!fs.existsSync(authFile)) {
    console.log('❌ playwright-auth.json을 찾을 수 없습니다.');
    await browser.close();
    process.exit(1);
  }

  const storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));

  // HAR 파일로 모든 요청 기록
  const context = await browser.newContext({
    storageState,
    recordHar: { path: 'network-capture.har' }
  });

  const page = await context.newPage();

  console.log('📡 네트워크 캡처 시작...\n');

  const allRequests = {
    board_list: [],
    post_detail_1: [],
    post_detail_2: []
  };

  page.on('request', request => {
    const info = {
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      postData: request.postData(),
      timestamp: new Date().toISOString()
    };

    if (request.resourceType() === 'xhr' || request.resourceType() === 'fetch') {
      console.log(`📤 ${request.method()}: ${request.url().substring(0, 100)}`);
      if (info.postData) {
        console.log(`   데이터: ${info.postData.substring(0, 80)}`);
      }
    }
  });

  try {
    // 1️⃣ 게시판 목록 페이지
    console.log('='.repeat(80));
    console.log('1️⃣ 게시판 목록 페이지 로드');
    console.log('='.repeat(80) + '\n');

    const boardUrl = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=8';
    await page.goto(boardUrl, { waitUntil: 'networkidle', timeout: 30000 });

    console.log(`\n✅ 게시판 목록 로드 완료`);
    console.log(`   URL: ${page.url()}\n`);

    // 게시글 정보 추출
    const posts = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('ul.list').forEach((elem) => {
        try {
          const titleSpan = elem.querySelector('li.tit span');
          const title = titleSpan?.textContent?.trim();
          const likeBtn = elem.querySelector('[id^="like_btn_"]');
          const postId = likeBtn?.id?.replace('like_btn_', '') || '';

          if (title && postId) {
            // 링크 찾기
            const links = Array.from(elem.querySelectorAll('a'));
            const detailLink = links.find(a => a.href.includes('mode=view'));

            items.push({
              title,
              postId,
              detailLink: detailLink?.href || null
            });
          }
        } catch (e) {}
      });
      return items;
    });

    console.log(`발견된 게시글: ${posts.length}개\n`);
    posts.slice(0, 5).forEach((post, idx) => {
      console.log(`${idx + 1}. ${post.title}`);
      console.log(`   ID: ${post.postId}`);
      console.log(`   URL: ${post.detailLink}\n`);
    });

    if (posts.length === 0) {
      console.log('❌ 게시글을 찾을 수 없습니다. 페이지 구조 확인 필요.');
      await page.evaluate(() => {
        console.log('페이지 HTML 샘플:');
        console.log(document.body.innerHTML.substring(0, 500));
      });
      await context.close();
      await browser.close();
      process.exit(1);
    }

    // 2️⃣ 첫 번째 게시글 상세 페이지
    await page.waitForTimeout(1000);

    console.log('='.repeat(80));
    console.log('2️⃣ 첫 번째 게시글 상세 페이지 로드');
    console.log('='.repeat(80) + '\n');

    const firstPostUrl = `https://www.xn--3e0b036btifksj.com/40/?mode=view&id=${posts[0].postId}`;
    const firstPostId = posts[0].postId;

    console.log(`게시글: ${posts[0].title}`);
    console.log(`ID: ${firstPostId}`);
    console.log(`URL: ${firstPostUrl}\n`);

    await page.goto(firstPostUrl, { waitUntil: 'networkidle', timeout: 30000 });

    console.log(`\n✅ 상세 페이지 로드 완료\n`);
    await page.waitForTimeout(2000);

    // 3️⃣ 두 번째 게시글 상세 페이지
    await page.waitForTimeout(1000);

    console.log('='.repeat(80));
    console.log('3️⃣ 두 번째 게시글 상세 페이지 로드 (API 비교용)');
    console.log('='.repeat(80) + '\n');

    const secondPostId = 'p20230410358600eb6c03b';
    const secondPostUrl = `https://www.xn--3e0b036btifksj.com/40/?mode=view&id=${secondPostId}`;

    console.log(`ID: ${secondPostId}`);
    console.log(`URL: ${secondPostUrl}\n`);

    await page.goto(secondPostUrl, { waitUntil: 'networkidle', timeout: 30000 });

    console.log(`\n✅ 두 번째 게시글 로드 완료\n`);
    await page.waitForTimeout(2000);

    // 4️⃣ HAR 파일 정보
    console.log('='.repeat(80));
    console.log('📊 캡처 완료');
    console.log('='.repeat(80) + '\n');

    console.log(`✅ network-capture.har 파일 생성됨`);
    console.log(`   → HAR 파일에는 모든 네트워크 요청/응답이 기록됩니다.\n`);

    // HAR 파일 크기 확인
    await page.waitForTimeout(1000);

  } catch (error) {
    console.error(`\n❌ 오류: ${error.message}`);
    console.error(error.stack);
  } finally {
    // HAR 파일이 자동으로 저장됨
    await context.close();
    await browser.close();

    // HAR 파일 확인
    const harPath = path.join(__dirname, 'network-capture.har');
    if (fs.existsSync(harPath)) {
      const stats = fs.statSync(harPath);
      console.log(`\n📁 HAR 파일 정보:`);
      console.log(`   경로: ${harPath}`);
      console.log(`   크기: ${(stats.size / 1024).toFixed(2)} KB`);
    }
  }
}

captureHarFixed().catch(err => {
  console.error('❌ 치명적 오류:', err.message);
  process.exit(1);
});
