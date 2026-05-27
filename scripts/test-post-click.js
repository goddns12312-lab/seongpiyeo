const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testPostClick() {
  console.log('🔍 게시글 클릭 테스트 - 상세 콘텐츠 로드 확인\n');

  const browser = await chromium.launch({ headless: false });
  const authFile = path.join(__dirname, 'playwright-auth.json');

  const storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
  const context = await browser.newContext({ storageState });
  const page = await context.newPage();

  try {
    // 1️⃣ 게시판 목록 페이지 방문
    console.log('='.repeat(80));
    console.log('1️⃣ 게시판 목록 페이지 로드');
    console.log('='.repeat(80) + '\n');

    const boardUrl = 'https://www.xn--3e0b036btifksj.com/40/';
    await page.goto(boardUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // 첫 번째 게시글 찾기
    const firstPost = await page.locator('.title_link._fade_link').first();
    const postTitle = await firstPost.innerText();
    const postLink = await firstPost.getAttribute('href');

    console.log(`첫 번째 게시글:`);
    console.log(`  제목: ${postTitle.substring(0, 100)}`);
    console.log(`  링크: ${postLink}\n`);

    // 2️⃣ 게시글 클릭
    console.log('='.repeat(80));
    console.log('2️⃣ 게시글 클릭 후 콘텐츠 확인');
    console.log('='.repeat(80) + '\n');

    // 클릭 전 콘텐츠
    const contentBefore = await page.locator('body').innerText();
    console.log(`클릭 전 body 텍스트 길이: ${contentBefore.length}자`);

    // 게시글 클릭
    await firstPost.click();
    console.log(`⏳ 2초 대기 중...`);
    await page.waitForTimeout(2000);

    // 클릭 후 콘텐츠
    const contentAfter = await page.locator('body').innerText();
    console.log(`클릭 후 body 텍스트 길이: ${contentAfter.length}자`);

    if (contentAfter.length !== contentBefore.length) {
      console.log(`✅ 콘텐츠 변경됨 (${contentAfter.length - contentBefore.length}자 증가/감소)`);
    } else {
      console.log(`❌ 콘텐츠 변경 없음 (동일한 페이지)`);
    }

    // 현재 URL 확인
    const currentUrl = page.url();
    console.log(`\n현재 URL: ${currentUrl}`);

    // 3️⃣ 모달 또는 팝업 확인
    console.log('\n' + '='.repeat(80));
    console.log('3️⃣ 모달/팝업 콘텐츠 확인');
    console.log('='.repeat(80) + '\n');

    const modals = await page.locator('[class*="modal"], [class*="popup"], [class*="overlay"], [role="dialog"]').all();
    console.log(`모달/팝업 요소: ${modals.length}개`);

    const visibleModals = [];
    for (const modal of modals) {
      const visible = await modal.isVisible();
      if (visible) {
        const text = await modal.innerText();
        visibleModals.push({
          text: text.substring(0, 100),
          visible
        });
      }
    }

    console.log(`표시된 모달: ${visibleModals.length}개`);
    visibleModals.forEach((m, idx) => {
      console.log(`  ${idx + 1}. "${m.text}..."`);
    });

    // 4️⃣ 새로운 12항목 데이터 확인
    console.log('\n' + '='.repeat(80));
    console.log('4️⃣ 12항목 데이터 확인');
    console.log('='.repeat(80) + '\n');

    const itemsInfo = await page.evaluate(() => {
      const items = {};
      const itemNames = [
        '매물업종', '매물위치', '실평수', '해당층',
        '보증금', '희망권리금', '월세', '시설집기',
        '입주가능일', '사업자', '행정처분', '연락처'
      ];

      itemNames.forEach(itemName => {
        const regex = new RegExp(`${itemName}[\\s\\S]*?[:\\：]\\s*([^\\n]+)`);
        const match = document.body.innerText.match(regex);
        if (match) {
          items[itemName] = match[1].trim();
        }
      });

      return {
        foundItems: Object.keys(items).length,
        items
      };
    });

    console.log(`발견된 12항목: ${itemsInfo.foundItems}개`);
    Object.entries(itemsInfo.items).forEach(([key, val]) => {
      console.log(`  ${key}: ${val}`);
    });

    // 스크린샷
    await page.screenshot({ path: path.join(__dirname, 'post-click-result.png') });
    console.log(`\n📸 스크린샷 저장: post-click-result.png`);

    // 결과 저장
    const result = {
      timestamp: new Date().toISOString(),
      firstPost: {
        title: postTitle,
        link: postLink
      },
      contentChange: {
        before: contentBefore.length,
        after: contentAfter.length,
        changed: contentAfter.length !== contentBefore.length
      },
      urlAfterClick: currentUrl,
      visibleModals: visibleModals.length,
      itemsFound: itemsInfo.foundItems,
      items: itemsInfo.items
    };

    fs.writeFileSync(
      path.join(__dirname, 'post-click-result.json'),
      JSON.stringify(result, null, 2)
    );

    console.log(`\n✅ 테스트 결과 저장: post-click-result.json`);

  } catch (error) {
    console.error(`\n❌ 오류: ${error.message}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

testPostClick().catch(err => {
  console.error('❌ 치명적 오류:', err.message);
  process.exit(1);
});
