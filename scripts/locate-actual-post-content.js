const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function locateActualPostContent() {
  console.log('🔍 실제 게시글 콘텐츠 위치 파악\n');

  const browser = await chromium.launch({ headless: false }); // headless: false to see what's happening
  const authFile = path.join(__dirname, 'playwright-auth.json');

  const storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
  const context = await browser.newContext({ storageState });
  const page = await context.newPage();

  try {
    const postId = 'p20230501948641a7bc92f';
    const url = `https://www.xn--3e0b036btifksj.com/40/?mode=view&id=${postId}`;

    console.log(`게시글 URL: ${url}\n`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // 1️⃣ 전체 HTML 구조 분석
    console.log('='.repeat(80));
    console.log('1️⃣ HTML 구조 분석');
    console.log('='.repeat(80) + '\n');

    const htmlStructure = await page.evaluate(() => {
      // 주요 컨테이너 찾기
      const containers = {
        divs: document.querySelectorAll('div[id], div[class*="content"], div[class*="detail"], div[class*="post"], div[class*="article"], div[class*="board"]').length,
        main: document.querySelector('main') ? 'found' : 'not found',
        article: document.querySelector('article') ? 'found' : 'not found',
        sections: document.querySelectorAll('section').length,
        tables: document.querySelectorAll('table').length,
        forms: document.querySelectorAll('form').length
      };

      // 텍스트 길이별 div 찾기
      const divsByText = [];
      document.querySelectorAll('div').forEach(div => {
        const text = div.innerText?.trim();
        if (text && text.length > 100 && text.length < 1000) {
          divsByText.push({
            class: div.className,
            id: div.id,
            textLength: text.length,
            preview: text.substring(0, 100)
          });
        }
      });

      // 매물업종 텍스트 포함하는 요소 찾기
      const postDataElements = [];
      document.querySelectorAll('*').forEach(el => {
        const text = el.innerText?.trim();
        if (text && (text.includes('매물업종') || text.includes('보증금') || text.includes('월세'))) {
          postDataElements.push({
            tag: el.tagName,
            class: el.className,
            id: el.id,
            textLength: text.length,
            preview: text.substring(0, 150)
          });
        }
      });

      return {
        containers,
        divsByText: divsByText.slice(0, 10),
        postDataElements
      };
    });

    console.log('📊 주요 컨테이너:');
    Object.entries(htmlStructure.containers).forEach(([key, val]) => {
      console.log(`   ${key}: ${val}`);
    });

    console.log('\n📝 텍스트 길이별 div (100-1000자):');
    htmlStructure.divsByText.forEach((div, idx) => {
      console.log(`   ${idx + 1}. class="${div.class}" id="${div.id}" (${div.textLength}자)`);
      console.log(`      → "${div.preview}..."`);
    });

    console.log('\n🎯 매물 데이터 포함 요소:');
    if (htmlStructure.postDataElements.length > 0) {
      htmlStructure.postDataElements.forEach((el, idx) => {
        console.log(`   ${idx + 1}. <${el.tag}> class="${el.class}" (${el.textLength}자)`);
        console.log(`      → "${el.preview}..."`);
      });
    } else {
      console.log('   ❌ 찾을 수 없음');
    }

    // 2️⃣ 동적 콘텐츠 로드 대기
    console.log('\n' + '='.repeat(80));
    console.log('2️⃣ 동적 콘텐츠 로드 대기');
    console.log('='.repeat(80) + '\n');

    console.log('⏳ 3초 대기 중...');
    await page.waitForTimeout(3000);

    const postDataAfterWait = await page.evaluate(() => {
      const elements = [];
      document.querySelectorAll('*').forEach(el => {
        const text = el.innerText?.trim();
        if (text && text.includes('매물업종')) {
          elements.push({
            tag: el.tagName,
            class: el.className,
            textLength: text.length
          });
        }
      });
      return elements;
    });

    console.log(`✅ 대기 후 매물업종 요소: ${postDataAfterWait.length}개`);

    // 3️⃣ 모든 텍스트 노드 검사
    console.log('\n' + '='.repeat(80));
    console.log('3️⃣ 전체 DOM 텍스트 검색');
    console.log('='.repeat(80) + '\n');

    const allText = await page.evaluate(() => {
      return {
        bodyText: document.body.innerText.length,
        bodyHtml: document.body.innerHTML.length,
        includes: {
          매물업종: document.body.innerText.includes('매물업종'),
          보증금: document.body.innerText.includes('보증금'),
          월세: document.body.innerText.includes('월세'),
          이미지: document.body.innerText.includes('이미지'),
          사진: document.body.innerText.includes('사진'),
          권리금: document.body.innerText.includes('권리금')
        }
      };
    });

    console.log(`📋 Body 텍스트: ${allText.bodyText}자`);
    console.log(`📋 Body HTML: ${allText.bodyHtml}자\n`);
    console.log('포함 여부:');
    Object.entries(allText.includes).forEach(([key, val]) => {
      console.log(`   ${key}: ${val ? '✅' : '❌'}`);
    });

    // 4️⃣ 게시글 제목 찾기
    console.log('\n' + '='.repeat(80));
    console.log('4️⃣ 게시글 제목 및 상태 확인');
    console.log('='.repeat(80) + '\n');

    const postTitle = await page.evaluate(() => {
      // 여러 선택자로 제목 찾기
      const selectors = [
        'h1', 'h2', 'h3',
        '[class*="title"]',
        '[class*="post-title"]',
        '[class*="subject"]',
        '[class*="heading"]'
      ];

      let titleEl = null;
      for (const selector of selectors) {
        const els = document.querySelectorAll(selector);
        for (const el of els) {
          if (el.innerText && el.innerText.length > 5 && el.innerText.length < 200) {
            titleEl = el;
            break;
          }
        }
        if (titleEl) break;
      }

      if (titleEl) {
        return {
          title: titleEl.innerText,
          tag: titleEl.tagName,
          class: titleEl.className
        };
      }

      return null;
    });

    if (postTitle) {
      console.log(`✅ 제목 발견:`);
      console.log(`   텍스트: "${postTitle.title}"`);
      console.log(`   태그: <${postTitle.tag}>`);
      console.log(`   클래스: "${postTitle.class}"`);
    } else {
      console.log('❌ 제목을 찾을 수 없습니다');
    }

    // 5️⃣ 스크린샷 및 전체 콘텐츠 저장
    console.log('\n' + '='.repeat(80));
    console.log('5️⃣ 전체 페이지 분석');
    console.log('='.repeat(80) + '\n');

    const screenshot = await page.screenshot({ path: path.join(__dirname, 'post-detail-page.png') });
    console.log(`📸 스크린샷 저장: post-detail-page.png\n`);

    const fullContent = await page.content();
    fs.writeFileSync(
      path.join(__dirname, 'post-detail-fullpage.html'),
      fullContent
    );
    console.log(`💾 전체 HTML 저장: post-detail-fullpage.html (${fullContent.length}자)\n`);

    // 6️⃣ 숨겨진 콘텐츠 확인
    console.log('='.repeat(80));
    console.log('6️⃣ 숨겨진 콘텐츠 확인');
    console.log('='.repeat(80) + '\n');

    const hiddenElements = await page.evaluate(() => {
      const hidden = {
        displayNone: [],
        visibility: [],
        opacity0: [],
        hidden: [],
        dataAttribute: []
      };

      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el);
        const text = el.innerText?.substring(0, 50);

        if (style.display === 'none' && text) {
          hidden.displayNone.push(text);
        }
        if (style.visibility === 'hidden' && text) {
          hidden.visibility.push(text);
        }
        if (style.opacity === '0' && text) {
          hidden.opacity0.push(text);
        }
        if (el.hasAttribute('hidden') && text) {
          hidden.hidden.push(text);
        }
        if (el.getAttribute('data-post-content') && text) {
          hidden.dataAttribute.push({ attr: 'data-post-content', text });
        }
      });

      return hidden;
    });

    console.log('🔍 display: none:', hiddenElements.displayNone.length, '개');
    if (hiddenElements.displayNone.length > 0) {
      hiddenElements.displayNone.slice(0, 3).forEach(text => {
        console.log(`   → "${text}..."`);
      });
    }

    console.log('🔍 visibility: hidden:', hiddenElements.visibility.length, '개');
    console.log('🔍 opacity: 0:', hiddenElements.opacity0.length, '개');
    console.log('🔍 hidden attr:', hiddenElements.hidden.length, '개');
    console.log('🔍 data-post-content:', hiddenElements.dataAttribute.length, '개');

    // 결과 저장
    const analysis = {
      postId,
      timestamp: new Date().toISOString(),
      htmlStructure,
      postTitle,
      textMetrics: allText,
      hiddenElements: {
        count: Object.values(hiddenElements).reduce((a, b) => a + b.length, 0),
        details: hiddenElements
      },
      conclusion: allText.includes.매물업종 ? 'POST_DATA_IN_DOM' : 'POST_DATA_NOT_FOUND'
    };

    fs.writeFileSync(
      path.join(__dirname, 'locate-content-analysis.json'),
      JSON.stringify(analysis, null, 2)
    );

    console.log(`\n✅ 분석 결과 저장: locate-content-analysis.json`);
    console.log(`\n📌 결론: ${analysis.conclusion}`);

  } catch (error) {
    console.error(`\n❌ 오류: ${error.message}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

locateActualPostContent().catch(err => {
  console.error('❌ 치명적 오류:', err.message);
  process.exit(1);
});
