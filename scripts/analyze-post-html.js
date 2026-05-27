const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function analyzePostHTML() {
  const browser = await chromium.launch({ headless: true });
  const authFile = path.join(__dirname, 'playwright-auth.json');

  if (!fs.existsSync(authFile)) {
    console.log('❌ playwright-auth.json을 찾을 수 없습니다.');
    await browser.close();
    process.exit(1);
  }

  const page = await browser.newPage();
  const storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));

  // 쿠키 복원
  if (storageState.cookies && storageState.cookies.length > 0) {
    await page.context().addCookies(storageState.cookies);
  }

  // localStorage/sessionStorage 복원
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
    // 테스트용 2개 게시글 분석
    const testPostIds = [
      'p20230501948641a7bc92f',
      'p2019041559d61768e7b6b'
    ];

    for (const postId of testPostIds) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📖 분석: ${postId}`);
      console.log('='.repeat(80));

      const detailUrl = `https://www.xn--3e0b036btifksj.com/40/?mode=view&id=${postId}`;
      await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // 전체 HTML 구조 분석
      const htmlAnalysis = await page.evaluate(() => {
        // 1. 모든 이미지 요소 찾기
        const allImages = Array.from(document.querySelectorAll('img'));
        const imageUrls = allImages.map((img, idx) => ({
          idx,
          src: img.src,
          dataSrc: img.getAttribute('data-src'),
          alt: img.alt,
          className: img.className,
          id: img.id,
          parentTag: img.parentElement?.tagName,
          parentClass: img.parentElement?.className
        })).filter(img => img.src || img.dataSrc);

        // 2. 게시글 본문 영역 찾기
        const contentDivs = Array.from(document.querySelectorAll('div[class*="content"], div[class*="body"], div[class*="post"], article')).slice(0, 5);
        const contentInfo = contentDivs.map((div, idx) => ({
          idx,
          className: div.className,
          id: div.id,
          childrenCount: div.children.length,
          hasImages: div.querySelectorAll('img').length,
          textLength: div.innerText?.length || 0
        }));

        // 3. 게시글 제목/본문 요소
        const title = document.querySelector('h1, h2, [class*="title"]');
        const titleInfo = {
          text: title?.innerText?.substring(0, 50) || '',
          tagName: title?.tagName || 'none',
          className: title?.className || ''
        };

        // 4. 이미지가 많은 div 찾기 (본문일 가능성)
        const allDivs = Array.from(document.querySelectorAll('div'));
        const divsWithImages = allDivs
          .map((div, idx) => ({
            idx,
            className: div.className.substring(0, 100),
            imageCount: div.querySelectorAll('img').length,
            divIndex: allDivs.indexOf(div)
          }))
          .filter(d => d.imageCount >= 3)
          .sort((a, b) => b.imageCount - a.imageCount)
          .slice(0, 5);

        // 5. 모든 data-src 속성 찾기 (lazy-load)
        const lazyImages = Array.from(document.querySelectorAll('[data-src]')).map(el => ({
          dataSrc: el.getAttribute('data-src'),
          tag: el.tagName,
          className: el.className
        }));

        // 6. background-image 스타일
        const bgImages = Array.from(document.querySelectorAll('[style*="background"]')).slice(0, 5).map(el => ({
          style: el.getAttribute('style').substring(0, 150),
          tag: el.tagName,
          className: el.className
        }));

        // 7. script 타입 JSON 데이터
        const scriptJSON = [];
        Array.from(document.querySelectorAll('script')).forEach(script => {
          if (script.type === 'application/json' || script.type === 'application/ld+json') {
            try {
              const data = JSON.parse(script.textContent);
              scriptJSON.push({
                type: script.type,
                hasImage: !!data.image,
                imageCount: Array.isArray(data.image) ? data.image.length : (data.image ? 1 : 0)
              });
            } catch (e) {}
          }
        });

        return {
          totalImages: imageUrls.length,
          imageDetails: imageUrls.slice(0, 20),
          title: titleInfo,
          contentDivs: contentInfo,
          divsWithImages,
          lazyImages: lazyImages.slice(0, 10),
          bgImages,
          scriptJSON,
          pageTitle: document.title,
          bodyHtmlLength: document.body.innerHTML.length
        };
      });

      // 12항목 데이터 추출 영역 분석
      const dataAnalysis = await page.evaluate(() => {
        const allText = document.body.innerText || '';
        const lines = allText.split('\n');

        // 12항목이 포함된 줄들
        const dataLines = lines.filter((line, idx) => {
          const hasKeywords = [
            '매물업종', '매물위치', '실평수', '해당층',
            '보증금', '희망권리금', '월세', '시설집기',
            '입주가능일', '사업자', '행정처분', '연락처'
          ].some(kw => line.includes(kw));

          if (hasKeywords) {
            return { line, idx };
          }
          return false;
        }).filter(x => x !== false);

        return {
          totalLines: lines.length,
          dataLinesCount: dataLines.length,
          dataLines: dataLines.slice(0, 20)
        };
      });

      console.log('\n📊 HTML 구조 분석:');
      console.log(JSON.stringify(htmlAnalysis, null, 2));

      console.log('\n📋 12항목 데이터 위치:');
      console.log(JSON.stringify(dataAnalysis, null, 2));

      // HTML 샘플 저장
      const htmlSample = await page.evaluate(() => {
        // 이미지가 가장 많은 영역 찾기
        const allDivs = Array.from(document.querySelectorAll('div'));
        let maxImgDiv = null;
        let maxImgCount = 0;

        allDivs.forEach(div => {
          const imgCount = div.querySelectorAll('img').length;
          if (imgCount > maxImgCount && div.innerText?.length > 100) {
            maxImgCount = imgCount;
            maxImgDiv = div;
          }
        });

        return {
          maxImageDiv: maxImgDiv ? {
            className: maxImgDiv.className,
            id: maxImgDiv.id,
            imageCount: maxImgDiv.querySelectorAll('img').length,
            html: maxImgDiv.innerHTML.substring(0, 2000)
          } : null,
          pageHtml: document.documentElement.outerHTML.substring(0, 3000)
        };
      });

      // 상세 HTML 저장
      fs.writeFileSync(
        `analyze-${postId}.json`,
        JSON.stringify({
          postId,
          url: detailUrl,
          htmlAnalysis,
          dataAnalysis,
          htmlSample
        }, null, 2)
      );

      console.log(`\n✅ 분석 완료: analyze-${postId}.json`);
    }

  } catch (error) {
    console.error(`❌ 오류: ${error.message}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

analyzePostHTML().catch(err => {
  console.error('❌ 치명적 오류:', err.message);
  process.exit(1);
});
