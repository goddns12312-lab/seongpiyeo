const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function scrapeWithCorrectUrls() {
  console.log('🔍 정확한 URL 형식을 사용한 게시글 스크래핑\n');

  const browser = await chromium.launch({ headless: true });
  const authFile = path.join(__dirname, 'playwright-auth.json');

  const storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
  const context = await browser.newContext({ storageState });
  const page = await context.newPage();

  try {
    // 1️⃣ 게시판 목록 페이지 방문
    console.log('='.repeat(80));
    console.log('1️⃣ 게시판 목록 페이지 로드 및 게시글 링크 추출');
    console.log('='.repeat(80) + '\n');

    const boardUrl = 'https://www.xn--3e0b036btifksj.com/40/';
    await page.goto(boardUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // 모든 게시글 링크 추출
    const postLinks = await page.locator('.title_link._fade_link').all();
    console.log(`📋 발견된 게시글: ${postLinks.length}개\n`);

    const posts = [];

    // 처음 5개만 스크래핑 (테스트용)
    const limitedPosts = Math.min(5, postLinks.length);

    for (let i = 0; i < limitedPosts; i++) {
      const postLink = postLinks[i];
      const postTitle = await postLink.innerText();
      const href = await postLink.getAttribute('href');

      // URL에서 idx 값 추출
      const idxMatch = href.match(/&idx=(\d+)/);
      const idx = idxMatch ? idxMatch[1] : 'unknown';

      console.log(`${i + 1}. 게시글 처리 중...`);
      console.log(`   제목: ${postTitle.substring(0, 80)}`);
      console.log(`   idx: ${idx}`);

      // 각 게시글의 상세 페이지 방문
      const fullUrl = `${boardUrl}${href}`;
      await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });

      // 12항목 추출
      const items = await page.evaluate(() => {
        const result = {};
        const itemNames = [
          '매물업종', '매물위치', '실평수', '해당층',
          '보증금', '희망권리금', '월세', '시설집기',
          '입주가능일', '사업자', '행정처분', '연락처'
        ];

        const bodyText = document.body.innerText;

        itemNames.forEach(itemName => {
          const regex = new RegExp(`${itemName}[\\s\\S]*?[:\\：]\\s*([^\\n]+)`);
          const match = bodyText.match(regex);
          if (match) {
            result[itemName] = match[1].trim();
          }
        });

        return result;
      });

      // 이미지 추출
      const images = await page.evaluate(() => {
        const imgs = [];
        document.querySelectorAll('img').forEach(img => {
          const src = img.src;
          if (src && (src.includes('cdn') || src.includes('imweb'))) {
            imgs.push(src);
          }
        });
        return [...new Set(imgs)];
      });

      const postData = {
        idx,
        title: postTitle.split('\n')[0],
        items,
        imageCount: images.length,
        images: images.slice(0, 4), // 처음 4개만
        url: fullUrl
      };

      posts.push(postData);

      console.log(`   ✅ 12항목 추출: ${Object.keys(items).length}개`);
      console.log(`   ✅ 이미지 발견: ${images.length}개`);
      console.log('');

      // 작은 딜레이
      await page.waitForTimeout(500);
    }

    // 2️⃣ 결과 출력
    console.log('='.repeat(80));
    console.log('2️⃣ 추출된 데이터 요약');
    console.log('='.repeat(80) + '\n');

    posts.forEach((post, idx) => {
      console.log(`게시글 ${idx + 1}: ${post.title}`);
      console.log(`  idx: ${post.idx}`);
      console.log(`  12항목: ${Object.keys(post.items).length}개`);
      console.log(`  이미지: ${post.imageCount}개`);
      console.log(`  위치: ${post.items['매물위치'] || 'N/A'}`);
      console.log(`  월세: ${post.items['월세'] || 'N/A'}`);
      console.log('');
    });

    // 결과 저장
    fs.writeFileSync(
      path.join(__dirname, 'scraped-with-correct-urls.json'),
      JSON.stringify(posts, null, 2)
    );

    console.log(`✅ 결과 저장: scraped-with-correct-urls.json`);
    console.log(`\n📊 총 ${posts.length}개 게시글 스크래핑 완료`);

  } catch (error) {
    console.error(`\n❌ 오류: ${error.message}`);
    console.error(error.stack);
  } finally {
    await context.close();
    await browser.close();
  }
}

scrapeWithCorrectUrls().catch(err => {
  console.error('❌ 치명적 오류:', err.message);
  process.exit(1);
});
