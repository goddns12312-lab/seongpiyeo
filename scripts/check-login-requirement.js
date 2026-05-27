const { chromium } = require('playwright');

async function checkLoginRequirement() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('🔐 로그인 필요 여부 확인 중...\n');

  // 1. 목록 페이지 접근
  console.log('1️⃣ 목록 페이지 접근 (로그인 없음)');
  const boardUrl = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=8';
  await page.goto(boardUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

  const boardPageInfo = await page.evaluate(() => {
    return {
      canSeePostList: !!document.querySelector('ul.list'),
      postCount: document.querySelectorAll('ul.list').length,
      canClickTitle: !!document.querySelector('a.title_link')
    };
  });

  console.log(`  ✓ 게시글 목록 보임: ${boardPageInfo.canSeePostList ? 'YES' : 'NO'}`);
  console.log(`  ✓ 보이는 게시글: ${boardPageInfo.postCount}개`);
  console.log(`  ✓ 제목 클릭 가능: ${boardPageInfo.canClickTitle ? 'YES' : 'NO'}`);

  // 2. 상세 페이지 접근 (직접 URL)
  console.log('\n2️⃣ 상세 페이지 접근 (URL 직접 입력, 로그인 없음)');
  const detailUrl = 'https://www.xn--3e0b036btifksj.com/40/?mode=view&id=p20230501948641a7bc92f';
  await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

  const detailPageInfo = await page.evaluate(() => {
    const title = document.querySelector('h1, .page-title, [class*="title"]')?.textContent?.trim() || '';
    const content = document.body.innerText || '';
    const hasImages = document.querySelectorAll('img[src*="cdn.imweb.me"]').length > 0;
    const hasLoginPrompt = !!document.querySelector('.login-required, .require-login, [class*="login"]');
    const hasRestrictedMsg = content.includes('로그인') || content.includes('가입') || content.includes('권한');

    return {
      pageTitle: title,
      contentLength: content.length,
      hasImages,
      hasLoginPrompt,
      hasRestrictedMsg,
      contentSample: content.substring(0, 300)
    };
  });

  console.log(`  제목: ${detailPageInfo.pageTitle || '없음'}`);
  console.log(`  본문 길이: ${detailPageInfo.contentLength}자`);
  console.log(`  이미지 있음: ${detailPageInfo.hasImages ? 'YES' : 'NO'}`);
  console.log(`  로그인 프롬프트: ${detailPageInfo.hasLoginPrompt ? 'YES' : 'NO'}`);
  console.log(`  로그인 필요 메시지: ${detailPageInfo.hasRestrictedMsg ? 'YES' : 'NO'}`);

  // 3. 목록에서 제목 클릭으로 진입
  console.log('\n3️⃣ 목록 페이지에서 제목 클릭으로 상세 진입');
  await page.goto(boardUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

  const titleLink = await page.$('a.title_link');
  if (titleLink) {
    const href = await titleLink.getAttribute('href');
    const onclick = await titleLink.getAttribute('onclick');
    
    console.log(`  제목 링크 href: ${href || '없음'}`);
    console.log(`  제목 링크 onclick: ${onclick ? '있음' : '없음'}`);
    
    // onclick 클릭 시뮬레이션
    if (onclick) {
      console.log(`  📝 onclick 내용: ${onclick.substring(0, 100)}...`);
    }
  }

  // 4. 실제 게시글 상세 정보 접근 가능 여부
  console.log('\n4️⃣ 게시글 상세 정보 접근 가능 여부');
  await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

  const contentAccess = await page.evaluate(() => {
    // 게시글 특정 정보 찾기
    const allText = document.body.innerText || '';
    
    // 매물업종, 매물위치 등 12항목 정보 찾기
    const has12ItemInfo = allText.includes('매물업종') && allText.includes('매물위치');
    
    // 댓글 영역
    const hasComments = !!document.querySelector('[class*="comment"], [class*="reply"], [id*="comment"]');
    
    // 저자 정보
    const hasAuthor = allText.includes('이상') || allText.includes('작성자') || allText.includes('글쓴이');

    return {
      has12ItemInfo,
      hasComments,
      hasAuthor,
      textPreview: allText.substring(0, 200)
    };
  });

  console.log(`  12항목 정보 접근: ${contentAccess.has12ItemInfo ? 'YES' : 'NO'}`);
  console.log(`  댓글 영역 접근: ${contentAccess.hasComments ? 'YES' : 'NO'}`);
  console.log(`  저자 정보 접근: ${contentAccess.hasAuthor ? 'YES' : 'NO'}`);

  console.log('\n' + '='.repeat(80));
  console.log('📋 결론:');
  console.log('='.repeat(80));

  if (detailPageInfo.hasRestrictedMsg) {
    console.log('❌ 로그인 필요: 상세 페이지 접근에 로그인 필요');
  } else if (boardPageInfo.canSeePostList && !contentAccess.has12ItemInfo) {
    console.log('❓ 부분 접근: 목록은 보이지만 상세 내용은 제한됨');
  } else if (!boardPageInfo.canSeePostList) {
    console.log('🔒 전체 제한: 목록도 볼 수 없음');
  } else {
    console.log('✅ 로그인 불필요: 모든 정보 접근 가능');
  }

  await browser.close();
}

checkLoginRequirement().catch(err => {
  console.error('오류:', err.message);
  process.exit(1);
});
