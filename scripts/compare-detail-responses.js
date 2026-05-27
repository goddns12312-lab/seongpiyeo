const { chromium } = require('playwright');
const fs = require('fs');
const crypto = require('crypto');

function hashContent(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

async function compareDetailResponses() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const postIds = [
    'p20230519efa1fc4a837d9',
    'p2023051542519cd642c53',
    'p20230501948641a7bc92f',
    'p20230410358600eb6c03b'
  ];

  const baseUrl = 'https://www.xn--3e0b036btifksj.com/40/';
  const results = [];

  console.log('🔍 상세 페이지별 응답 비교 중...\n');

  for (let i = 0; i < postIds.length; i++) {
    const postId = postIds[i];
    const detailUrl = `${baseUrl}?mode=view&id=${postId}`;

    console.log(`📄 게시글 ${i + 1}/${postIds.length}: ${postId}`);

    try {
      await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // 페이지 소스 분석
      const pageContent = await page.evaluate(() => {
        return {
          // HTML 전체 크기
          htmlLength: document.documentElement.outerHTML.length,
          
          // 본문 텍스트만 추출
          bodyText: document.body.innerText || '',
          
          // 페이지 제목
          pageTitle: document.title,
          
          // h1, h2 제목들
          headings: Array.from(document.querySelectorAll('h1, h2, h3'))
            .map(el => el.textContent.trim())
            .slice(0, 5),
          
          // meta 태그에서 정보 추출
          metaTags: {
            'og:title': document.querySelector('meta[property="og:title"]')?.content,
            'og:description': document.querySelector('meta[property="og:description"]')?.content,
            'description': document.querySelector('meta[name="description"]')?.content
          },
          
          // 이미지 count
          imageCount: document.querySelectorAll('img').length,
          
          // data-* 속성 있는 요소들
          dataElements: Array.from(document.querySelectorAll('[data-post-id], [data-article-id], [data-id]'))
            .map(el => ({
              tag: el.tagName,
              attributes: el.dataset
            }))
            .slice(0, 5),
          
          // 스크립트에 숨은 JSON 데이터
          scriptJsonData: []
        };
      });

      // 숨은 JSON 데이터 찾기
      const scriptJsonData = await page.evaluate(() => {
        const data = [];
        document.querySelectorAll('script[type="application/json"], script[type="application/ld+json"]').forEach((script, idx) => {
          try {
            const parsed = JSON.parse(script.textContent);
            data.push({
              index: idx,
              type: script.type,
              keys: Object.keys(parsed).slice(0, 10)
            });
          } catch (e) {}
        });
        return data;
      });
      
      pageContent.scriptJsonData = scriptJsonData;

      // HTML 크기 해시
      const htmlHash = await page.evaluate(() => {
        const html = document.documentElement.outerHTML;
        let hash = 0;
        for (let i = 0; i < html.length; i++) {
          hash = ((hash << 5) - hash) + html.charCodeAt(i);
          hash |= 0;
        }
        return hash.toString();
      });

      results.push({
        postId,
        url: detailUrl,
        htmlSize: pageContent.htmlLength,
        htmlHash,
        bodyTextLength: pageContent.bodyText.length,
        bodyTextSample: pageContent.bodyText.substring(0, 200),
        pageTitle: pageContent.pageTitle,
        headings: pageContent.headings,
        metaTags: pageContent.metaTags,
        imageCount: pageContent.imageCount,
        dataElements: pageContent.dataElements,
        scriptJsonData
      });

      console.log(`  HTML 크기: ${pageContent.htmlLength}`);
      console.log(`  본문 길이: ${pageContent.bodyText.length}`);
      console.log(`  제목: ${pageContent.pageTitle}`);
      console.log(`  이미지: ${pageContent.imageCount}개\n`);

    } catch (error) {
      console.log(`  ❌ 오류: ${error.message}\n`);
      results.push({
        postId,
        url: detailUrl,
        error: error.message
      });
    }
  }

  // 분석
  console.log('\n' + '='.repeat(80));
  console.log('📊 분석 결과:');
  console.log('='.repeat(80));

  const htmlSizes = results.filter(r => r.htmlSize).map(r => r.htmlSize);
  const bodyLengths = results.filter(r => r.bodyTextLength).map(r => r.bodyTextLength);
  const imageCounts = results.filter(r => r.imageCount).map(r => r.imageCount);

  console.log(`\nHTML 크기 일관성:`);
  console.log(`  최소: ${Math.min(...htmlSizes)}`);
  console.log(`  최대: ${Math.max(...htmlSizes)}`);
  console.log(`  모두 같음: ${new Set(htmlSizes).size === 1 ? '✓ YES (동일한 페이지)' : '✗ NO (서로 다른 페이지)'}`);

  console.log(`\n본문 텍스트 길이 일관성:`);
  console.log(`  최소: ${Math.min(...bodyLengths)}`);
  console.log(`  최대: ${Math.max(...bodyLengths)}`);
  console.log(`  모두 같음: ${new Set(bodyLengths).size === 1 ? '✓ YES (동일한 내용)' : '✗ NO (서로 다른 내용)'}`);

  console.log(`\n이미지 개수 일관성:`);
  console.log(`  최소: ${Math.min(...imageCounts)}`);
  console.log(`  최대: ${Math.max(...imageCounts)}`);
  console.log(`  모두 같음: ${new Set(imageCounts).size === 1 ? '✓ YES (동일한 이미지)' : '✗ NO (서로 다른 이미지)'}`);

  // JSON 저장
  fs.writeFileSync(
    'c:/Users/B/Desktop/aass/scripts/detail-responses-comparison.json',
    JSON.stringify(results, null, 2),
    'utf-8'
  );

  console.log('\n✅ detail-responses-comparison.json 저장됨');

  await browser.close();
}

compareDetailResponses().catch(err => {
  console.error('오류:', err.message);
  process.exit(1);
});
