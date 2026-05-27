const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function reparsePostContent() {
  console.log('🔍 게시글 콘텐츠 재파싱\n');

  const browser = await chromium.launch({ headless: true });
  const authFile = path.join(__dirname, 'playwright-auth.json');

  const storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
  const context = await browser.newContext({ storageState });
  const page = await context.newPage();

  try {
    // 2개 게시글 비교
    const posts = [
      { id: 'p20230501948641a7bc92f', title: '중곡동' },
      { id: 'p20230410358600eb6c03b', title: '구의동' }
    ];

    const results = [];

    for (const post of posts) {
      console.log('='.repeat(80));
      console.log(`📖 게시글: ${post.title} (${post.id})`);
      console.log('='.repeat(80) + '\n');

      const url = `https://www.xn--3e0b036btifksj.com/40/?mode=view&id=${post.id}`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      const postData = await page.evaluate(() => {
        const content = document.body.innerText;
        const lines = content.split('\n');

        // 모든 데이터 추출 (필터링 없음)
        const allText = content;

        // 12항목 패턴 찾기 (첫 번째 세트만)
        const dataPattern = /1\.\s*매물업종\s*[:：]\s*(.+?)(?=2\.|$)/s;
        const match = content.match(/1\.\s*매물업종[\s\S]*?(?=글쓰기|Previous|Next|$)/);

        // 실제 콘텐츠가 있는 섹션 찾기
        let mainContent = '';
        let inContent = false;
        let contentLines = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();

          // 게시글 본문 시작 찾기
          if (line === '성인PC방' || line.includes('매물업종')) {
            inContent = true;
          }

          if (inContent) {
            contentLines.push(line);

            // 본문 끝 찾기
            if (line.includes('글쓰기') || line.includes('Previous') || i > lines.length - 10) {
              break;
            }
          }
        }

        // 12항목 데이터만 추출
        const itemsText = contentLines.join('\n');
        const items = {};
        const itemNames = [
          '매물업종', '매물위치', '실평수', '해당층',
          '보증금', '희망권리금', '월세', '시설집기',
          '입주가능일', '사업자', '행정처분', '연락처'
        ];

        itemNames.forEach(itemName => {
          const regex = new RegExp(`${itemName}[\\s\\S]*?(?=${itemNames[itemNames.indexOf(itemName) + 1] || '글쓰기'})`);
          const match = itemsText.match(regex);
          if (match) {
            items[itemName] = match[0].substring(0, 200);
          }
        });

        return {
          contentLength: content.length,
          totalLines: lines.length,
          contentLines: contentLines.length,
          allText: content.substring(0, 500),
          contentSection: contentLines.slice(0, 30).join('\n'),
          items,
          hasRealData: Object.keys(items).length > 0
        };
      });

      console.log(`📊 추출 결과:`);
      console.log(`   총 문자: ${postData.contentLength}자`);
      console.log(`   총 줄: ${postData.totalLines}개`);
      console.log(`   콘텐츠 줄: ${postData.contentLines}개`);
      console.log(`   12항목 발견: ${Object.keys(postData.items).length}개`);
      console.log(`   실제 데이터: ${postData.hasRealData ? '✅ 있음' : '❌ 없음'}\n`);

      console.log(`📝 첫 30줄 콘텐츠:`);
      console.log(postData.contentSection.substring(0, 800));
      console.log('\n');

      if (Object.keys(postData.items).length > 0) {
        console.log(`💾 추출된 12항목:`);
        Object.entries(postData.items).slice(0, 6).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
        console.log('');
      }

      results.push({
        postId: post.id,
        title: post.title,
        ...postData
      });

      await page.waitForTimeout(500);
    }

    // 결과 비교
    console.log('='.repeat(80));
    console.log('🔄 두 게시글 콘텐츠 비교');
    console.log('='.repeat(80) + '\n');

    if (results.length === 2) {
      const [post1, post2] = results;

      console.log(`게시글 1 (${post1.title}):`);
      console.log(`  - 문자: ${post1.contentLength}자`);
      console.log(`  - 12항목: ${Object.keys(post1.items).length}개`);

      console.log(`\n게시글 2 (${post2.title}):`);
      console.log(`  - 문자: ${post2.contentLength}자`);
      console.log(`  - 12항목: ${Object.keys(post2.items).length}개`);

      // 실제 데이터 비교
      const items1 = Object.values(post1.items).join('|');
      const items2 = Object.values(post2.items).join('|');

      if (items1 === items2) {
        console.log(`\n⚠️  두 게시글 데이터가 동일함 (템플릿만 표시)`);
      } else {
        console.log(`\n✅ 두 게시글 데이터가 다름 (고유 콘텐츠 있음)`);
        console.log(`\n게시글 1 위치: ${post1.items['매물위치']}`);
        console.log(`게시글 2 위치: ${post2.items['매물위치']}`);
      }
    }

    // 파일 저장
    fs.writeFileSync(
      path.join(__dirname, 'reparse-result.json'),
      JSON.stringify(results, null, 2)
    );

    console.log(`\n✅ reparse-result.json 저장 완료\n`);

  } catch (error) {
    console.error(`\n❌ 오류: ${error.message}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

reparsePostContent().catch(err => {
  console.error('❌ 치명적 오류:', err.message);
  process.exit(1);
});
