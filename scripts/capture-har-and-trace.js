const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function captureHarAndTrace() {
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

  // 모든 요청/응답 로깅
  const allRequests = [];
  const allResponses = [];

  page.on('request', request => {
    const info = {
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      postData: request.postData(),
      timestamp: new Date().toISOString()
    };
    allRequests.push(info);

    if (request.resourceType() === 'xhr' || request.resourceType() === 'fetch') {
      console.log(`📤 XHR: ${request.method()} ${request.url().substring(0, 100)}`);
    }
  });

  page.on('response', response => {
    const info = {
      url: response.url(),
      status: response.status(),
      resourceType: response.request().resourceType(),
      timestamp: new Date().toISOString()
    };
    allResponses.push(info);

    if (response.request().resourceType() === 'xhr' || response.request().resourceType() === 'fetch') {
      console.log(`📥 Response: ${response.status()} ${response.url().substring(0, 100)}`);
    }
  });

  try {
    // 1️⃣ 게시판 목록 페이지
    console.log('\n\n='.repeat(80));
    console.log('1️⃣ 게시판 목록 페이지 로드');
    console.log('='.repeat(80));

    const boardUrl = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=8';
    await page.goto(boardUrl, { waitUntil: 'networkidle', timeout: 30000 });

    console.log(`✅ 게시판 목록 로드 완료`);
    console.log(`   URL: ${page.url()}`);

    await page.waitForTimeout(2000);

    // 2️⃣ 게시글 클릭
    console.log('\n' + '='.repeat(80));
    console.log('2️⃣ 게시글 클릭 및 상세 페이지 진입');
    console.log('='.repeat(80));

    // 목록에서 첫 번째 게시글 링크 찾기
    const postLinks = await page.evaluate(() => {
      const links = [];
      document.querySelectorAll('a[href*="mode=view&id="]').forEach((a, idx) => {
        if (idx < 5) {  // 첫 5개만
          links.push({
            href: a.href,
            text: a.innerText?.substring(0, 50),
            idx
          });
        }
      });
      return links;
    });

    console.log(`\n발견된 게시글 링크: ${postLinks.length}개`);
    postLinks.forEach((link, idx) => {
      console.log(`   ${idx + 1}. ${link.href.substring(0, 120)}`);
    });

    if (postLinks.length === 0) {
      console.log('❌ 게시글 링크를 찾을 수 없습니다.');
      await context.close();
      await browser.close();
      process.exit(1);
    }

    // 첫 번째 게시글 클릭
    const firstPostUrl = postLinks[0].href;
    const postId = new URL(firstPostUrl).searchParams.get('id');

    console.log(`\n클릭할 게시글: ${postId}`);
    console.log(`URL: ${firstPostUrl}`);

    allRequests.length = 0;
    allResponses.length = 0;

    const navigationPromise = page.waitForNavigation({ waitUntil: 'networkidle' });
    await page.click(`a[href="${firstPostUrl}"]`);
    await navigationPromise;

    console.log(`✅ 상세 페이지 진입 완료`);
    console.log(`   현재 URL: ${page.url()}`);

    await page.waitForTimeout(2000);

    // 3️⃣ 상세 페이지에서 추가 상호작용 감지
    console.log('\n' + '='.repeat(80));
    console.log('3️⃣ 상세 페이지 상호작용 테스트');
    console.log('='.repeat(80));

    // 이미지 클릭 시도
    const images = await page.$$eval('img', imgs => imgs.map((img, idx) => ({
      src: img.src,
      class: img.className,
      idx
    })).filter(img => img.src.includes('cdn')).slice(0, 3));

    console.log(`\n발견된 이미지: ${images.length}개`);

    if (images.length > 0) {
      console.log('\n이미지 클릭 시도...');

      allRequests.length = 0;
      allResponses.length = 0;

      const firstImageSelector = `img[src="${images[0].src}"]`;
      await page.click(firstImageSelector).catch(() => {
        console.log('   (클릭 불가)');
      });

      await page.waitForTimeout(1000);

      console.log(`   클릭 후 요청: ${allRequests.filter(r => r.resourceType === 'xhr' || r.resourceType === 'fetch').length}개`);
    }

    // 4️⃣ JavaScript 번들 파일 수집
    console.log('\n' + '='.repeat(80));
    console.log('4️⃣ JavaScript 파일 수집');
    console.log('='.repeat(80));

    const scripts = await page.evaluate(() => {
      const scriptUrls = [];
      document.querySelectorAll('script[src]').forEach(script => {
        const src = script.src;
        if (src) {
          scriptUrls.push({
            src,
            async: script.async,
            defer: script.defer,
            type: script.type
          });
        }
      });
      return scriptUrls;
    });

    console.log(`\n로드된 JS 파일: ${scripts.length}개`);
    scripts.slice(0, 15).forEach((script, idx) => {
      console.log(`   ${idx + 1}. ${script.src.substring(0, 120)}`);
    });

    // 5️⃣ 다른 게시글로 이동하여 비교
    console.log('\n' + '='.repeat(80));
    console.log('5️⃣ 다른 게시글 상세 페이지 로드 (API 비교용)');
    console.log('='.repeat(80));

    const secondPostId = 'p20230410358600eb6c03b';  // 고정된 ID
    const secondPostUrl = `https://www.xn--3e0b036btifksj.com/40/?mode=view&id=${secondPostId}`;

    allRequests.length = 0;
    allResponses.length = 0;

    console.log(`\n게시글 2 로드: ${secondPostId}`);

    await page.goto(secondPostUrl, { waitUntil: 'networkidle', timeout: 30000 });

    console.log(`✅ 게시글 2 로드 완료`);
    await page.waitForTimeout(2000);

    // 분석 완료
    console.log('\n' + '='.repeat(80));
    console.log('📊 분석 완료');
    console.log('='.repeat(80));

    console.log(`\n생성된 파일:`);
    console.log(`   ✅ network-capture.har - 전체 네트워크 캡처`);

  } catch (error) {
    console.error(`\n❌ 오류: ${error.message}`);
  } finally {
    // HAR 파일이 자동으로 저장됨
    await context.close();
    await browser.close();
  }
}

captureHarAndTrace().catch(err => {
  console.error('❌ 치명적 오류:', err.message);
  process.exit(1);
});
