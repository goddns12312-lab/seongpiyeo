const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function findPostContent() {
  const browser = await chromium.launch({ headless: true });
  const authFile = path.join(__dirname, 'playwright-auth.json');

  if (!fs.existsSync(authFile)) {
    console.log('❌ playwright-auth.json을 찾을 수 없습니다.');
    await browser.close();
    process.exit(1);
  }

  const page = await browser.newPage();
  const storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));

  if (storageState.cookies && storageState.cookies.length > 0) {
    await page.context().addCookies(storageState.cookies);
  }

  if (storageState.origins && storageState.origins.length > 0) {
    for (const origin of storageState.origins) {
      if (origin.localStorage && origin.localStorage.length > 0) {
        await page.addInitScript((items) => {
          items.forEach(item => {
            localStorage.setItem(item.name, item.value);
          });
        }, origin.localStorage);
      }
    }
  }

  const context = page.context();

  try {
    // 한 게시글만 자세히 분석
    const postId = 'p20230501948641a7bc92f';
    const url = `https://www.xn--3e0b036btifksj.com/40/?mode=view&id=${postId}`;

    console.log(`📖 분석: ${postId}`);
    console.log(`URL: ${url}\n`);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // 페이지 구조 분석
    const structure = await page.evaluate(() => {
      const allDivs = Array.from(document.querySelectorAll('div[id^="w"], div[id^="s"]'));

      const sections = [];
      allDivs.slice(0, 30).forEach((div, idx) => {
        const id = div.id;
        const text = div.innerText?.substring(0, 100) || '';
        const imgCount = div.querySelectorAll('img').length;
        const children = div.children.length;

        sections.push({
          idx,
          id,
          text: text.replace(/\n/g, '|'),
          imgCount,
          children,
          className: div.className.substring(0, 100)
        });
      });

      // 게시글 제목 찾기
      const possibleTitles = Array.from(document.querySelectorAll('h1, h2, h3, [class*="title"]')).slice(0, 10).map(el => ({
        tag: el.tagName,
        text: el.innerText?.substring(0, 80),
        className: el.className.substring(0, 50)
      }));

      // 게시글 본문 찾기
      const possibleContent = Array.from(document.querySelectorAll('[class*="content"], [class*="body"], [class*="post"], article')).slice(0, 10).map(el => ({
        tag: el.tagName,
        text: el.innerText?.substring(0, 100).replace(/\n/g, '|'),
        className: el.className.substring(0, 50),
        imgCount: el.querySelectorAll('img').length
      }));

      return {
        totalDivs: allDivs.length,
        sections,
        possibleTitles,
        possibleContent
      };
    });

    console.log('📊 페이지 섹션:');
    console.log(JSON.stringify(structure, null, 2));

    // 페이지 텍스트 분석
    const textAnalysis = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const lines = bodyText.split('\n');

      // 현재 게시글 제목 찾기 (URL의 postId로부터)
      // 게시글 본문 시작 지점 찾기
      let currentPostContent = '';
      let inCurrentPost = false;
      let lineCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // "성인PC방" 제목이 나오면 게시글 시작
        if (!inCurrentPost && line === '성인PC방') {
          inCurrentPost = true;
          currentPostContent = line + '\n';
          continue;
        }

        if (inCurrentPost) {
          currentPostContent += line + '\n';
          lineCount++;

          // 게시글 본문의 끝을 판단 (다음 게시글 또는 구분선)
          if (lineCount > 50 || (lineCount > 20 && (line.includes('다음') || line.includes('Previous') || line === '글쓰기'))) {
            break;
          }
        }
      }

      return {
        currentPostContent: currentPostContent.substring(0, 500),
        totalLines: lines.length,
        firstLines: lines.slice(0, 50).join('\n').substring(0, 1000)
      };
    });

    console.log('\n📝 텍스트 분석:');
    console.log('현재 게시글 콘텐츠:');
    console.log(textAnalysis.currentPostContent);
    console.log('\n\n첫 50줄:');
    console.log(textAnalysis.firstLines);

  } catch (error) {
    console.error(`❌ 오류: ${error.message}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

findPostContent().catch(err => {
  console.error('❌ 치명적 오류:', err.message);
  process.exit(1);
});
