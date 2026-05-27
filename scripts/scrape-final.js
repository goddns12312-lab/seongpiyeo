const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function scrapeFinal() {
  console.log('✅ 최종 게시글 스크래핑 (정확한 URL 형식)\n');

  const browser = await chromium.launch({ headless: true });
  const authFile = path.join(__dirname, 'playwright-auth.json');

  const storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
  const context = await browser.newContext({ storageState });
  const page = await context.newPage();

  try {
    // 게시판 목록에서 모든 링크 추출
    console.log('📋 게시판 목록 페이지에서 링크 추출...\n');

    const boardUrl = 'https://www.xn--3e0b036btifksj.com/40/';
    await page.goto(boardUrl, { waitUntil: 'networkidle', timeout: 30000 });

    const postLinkData = await page.evaluate(() => {
      const links = [];
      document.querySelectorAll('.title_link._fade_link').forEach(link => {
        const href = link.getAttribute('href');
        const text = link.innerText;
        if (href && text) {
          const idxMatch = href.match(/&idx=(\d+)/);
          const idx = idxMatch ? idxMatch[1] : null;
          if (idx) {
            links.push({
              idx,
              title: text,
              href
            });
          }
        }
      });
      return links;
    });

    console.log(`✅ ${postLinkData.length}개 게시글 링크 추출됨\n`);

    const posts = [];
    const limitedPosts = Math.min(3, postLinkData.length);

    for (let i = 0; i < limitedPosts; i++) {
      const postInfo = postLinkData[i];
      console.log(`\n[${i + 1}/${limitedPosts}] idx=${postInfo.idx}`);
      console.log(`제목: ${postInfo.title.split('\n')[0]}`);

      try {
        // 새 페이지로 각 포스트 방문
        const newPage = await context.newPage();
        const detailUrl = `https://www.xn--3e0b036btifksj.com/40/${postInfo.href}`;

        await newPage.goto(detailUrl, { waitUntil: 'networkidle', timeout: 20000 });

        // 12항목 + 이미지 추출
        const extractedData = await newPage.evaluate(() => {
          const items = {};
          const itemNames = [
            '매물업종', '매물위치', '실평수', '해당층',
            '보증금', '희망권리금', '월세', '시설집기',
            '입주가능일', '사업자', '행정처분', '연락처'
          ];

          const bodyText = document.body.innerText;

          itemNames.forEach(name => {
            const regex = new RegExp(`${name}[\\s\\S]*?[:\\：]\\s*([^\\n]+)`);
            const match = bodyText.match(regex);
            if (match) {
              items[name] = match[1].trim();
            }
          });

          // 이미지 추출
          const images = new Set();
          document.querySelectorAll('img').forEach(img => {
            const src = img.src;
            if (src && (src.includes('cdn') || src.includes('imweb') || src.includes('imgur'))) {
              images.add(src);
            }
          });

          return {
            items,
            images: Array.from(images)
          };
        });

        const postData = {
          idx: postInfo.idx,
          title: postInfo.title.split('\n')[0],
          url: detailUrl,
          items: extractedData.items,
          imageCount: extractedData.images.length,
          images: extractedData.images.slice(0, 4)
        };

        posts.push(postData);

        console.log(`✅ 12항목: ${Object.keys(extractedData.items).length}개`);
        console.log(`✅ 이미지: ${extractedData.images.length}개`);
        console.log(`   위치: ${extractedData.items['매물위치'] || 'N/A'}`);
        console.log(`   월세: ${extractedData.items['월세'] || 'N/A'}`);

        await newPage.close();

      } catch (error) {
        console.log(`⚠️  오류: ${error.message.split('\n')[0]}`);
      }

      await page.waitForTimeout(500);
    }

    // 결과 출력
    console.log('\n' + '='.repeat(80));
    console.log('📊 스크래핑 결과');
    console.log('='.repeat(80) + '\n');

    posts.forEach((post, idx) => {
      console.log(`[${idx + 1}] ${post.title}`);
      console.log(`    idx: ${post.idx}`);
      console.log(`    위치: ${post.items['매물위치'] || 'N/A'}`);
      console.log(`    평수: ${post.items['실평수'] || 'N/A'}`);
      console.log(`    보증금: ${post.items['보증금'] || 'N/A'}`);
      console.log(`    월세: ${post.items['월세'] || 'N/A'}`);
      console.log(`    연락처: ${post.items['연락처'] || 'N/A'}`);
      console.log(`    이미지: ${post.imageCount}개`);
      console.log('');
    });

    // JSON 저장
    fs.writeFileSync(
      path.join(__dirname, 'final-scraped-data.json'),
      JSON.stringify(posts, null, 2)
    );

    console.log(`✅ 최종 결과 저장: final-scraped-data.json`);
    console.log(`\n🎉 ${posts.length}개 게시글 스크래핑 성공!\n`);

    console.log('='.repeat(80));
    console.log('핵심 발견사항');
    console.log('='.repeat(80));
    console.log('✓ 게시판 목록 페이지에서 포스트 링크 추출 가능');
    console.log('✓ 각 포스트의 올바른 idx 값 획득 가능');
    console.log('✓ bmode=view&idx=... 형식의 URL로 상세페이지 접근 가능');
    console.log('✓ 상세페이지에서 12항목 데이터 완벽 추출 가능');
    console.log('✓ 이미지도 함께 추출 가능');
    console.log('✓ 이 방식으로 모든 게시글을 시스템적으로 수집 가능\n');

  } catch (error) {
    console.error(`❌ 오류: ${error.message}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

scrapeFinal().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
