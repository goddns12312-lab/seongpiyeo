const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function deepNetworkAnalysis() {
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
  const networkRequests = [];
  const xhrRequests = [];

  // 네트워크 요청 추적
  page.on('request', request => {
    const url = request.url();
    const method = request.method();

    networkRequests.push({
      url,
      method,
      resourceType: request.resourceType(),
      timestamp: new Date().toISOString()
    });

    if (request.resourceType() === 'xhr' || request.resourceType() === 'fetch') {
      xhrRequests.push({
        url,
        method,
        postData: request.postData(),
        headers: Object.fromEntries(
          Object.entries(request.headers()).filter(([k]) =>
            ['content-type', 'accept', 'referer'].includes(k.toLowerCase())
          )
        )
      });
    }
  });

  try {
    // 2개 게시글 비교 분석
    const posts = [
      'p20230501948641a7bc92f',  // 중곡동
      'p20230410358600eb6c03b'   // 구의동
    ];

    const results = {};

    for (const postId of posts) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📖 분석: ${postId}`);
      console.log('='.repeat(80));

      networkRequests.length = 0;
      xhrRequests.length = 0;

      const url = `https://www.xn--3e0b036btifksj.com/40/?mode=view&id=${postId}`;
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      console.log(`\n✅ 페이지 로드 완료`);
      console.log(`   총 네트워크 요청: ${networkRequests.length}개`);
      console.log(`   XHR/Fetch 요청: ${xhrRequests.length}개`);

      // XHR 요청 출력
      if (xhrRequests.length > 0) {
        console.log(`\n📡 XHR/Fetch 요청들:`);
        xhrRequests.slice(0, 10).forEach((req, idx) => {
          console.log(`\n${idx + 1}. ${req.url}`);
          if (req.postData) {
            console.log(`   POST: ${req.postData.substring(0, 100)}`);
          }
        });
      }

      // Script 태그 내부 데이터 추출
      const scriptData = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script'));
        const results = {
          jsonScripts: [],
          windowVariables: [],
          inlineData: []
        };

        // 1. JSON script 태그
        scripts.forEach(script => {
          if (script.type === 'application/json' || script.type === 'application/ld+json' || script.type === 'text/javascript') {
            const content = script.textContent.trim();
            if (content.startsWith('{') || content.startsWith('[')) {
              try {
                const data = JSON.parse(content);
                results.jsonScripts.push({
                  type: script.type,
                  size: content.length,
                  keys: Object.keys(data).slice(0, 10),
                  hasImages: JSON.stringify(data).includes('image') || JSON.stringify(data).includes('src')
                });
              } catch (e) {}
            }
          }
        });

        // 2. Window 변수 (게시글 관련)
        const windowKeys = Object.keys(window).filter(key =>
          key.includes('post') || key.includes('article') || key.includes('board') ||
          key.includes('data') || key.includes('content') || key.includes('image')
        );

        windowKeys.slice(0, 20).forEach(key => {
          try {
            const value = window[key];
            if (typeof value === 'object' && value !== null) {
              const keyCount = Object.keys(value).length;
              results.windowVariables.push({
                key,
                type: typeof value,
                hasData: keyCount > 0,
                keyCount
              });
            }
          } catch (e) {
            // 접근 불가능한 변수 무시
          }
        });

        // 3. Inline data attributes
        Array.from(document.querySelectorAll('*')).slice(0, 50).forEach(el => {
          const attrs = {};
          for (let attr of el.attributes) {
            if (attr.name.startsWith('data-')) {
              attrs[attr.name] = attr.value.substring(0, 100);
            }
          }
          if (Object.keys(attrs).length > 0) {
            results.inlineData.push({
              element: el.tagName,
              class: el.className.substring(0, 50),
              attrs
            });
          }
        });

        return results;
      });

      console.log(`\n📄 Script 데이터:`);
      console.log(`   JSON Scripts: ${scriptData.jsonScripts.length}개`);
      if (scriptData.jsonScripts.length > 0) {
        console.log(`   예시:`, scriptData.jsonScripts.slice(0, 3));
      }
      console.log(`   Window Variables: ${scriptData.windowVariables.length}개`);
      console.log(`   Inline Data: ${scriptData.inlineData.length}개`);

      // iframe 확인
      const iframeData = await page.evaluate(() => {
        const iframes = Array.from(document.querySelectorAll('iframe'));
        return {
          count: iframes.length,
          frames: iframes.map(f => ({
            src: f.src,
            id: f.id,
            name: f.name
          }))
        };
      });

      console.log(`\n🖼️ iframe: ${iframeData.count}개`);
      if (iframeData.frames.length > 0) {
        iframeData.frames.forEach((f, idx) => {
          console.log(`   ${idx + 1}. src: ${f.src?.substring(0, 80)}`);
        });
      }

      // 동적으로 로드되는 이미지 확인
      const dynamicImages = await page.evaluate(() => {
        const images = {
          srcSet: [],
          dataSrc: [],
          backgroundImage: [],
          srcChanges: [],
          imageElements: []
        };

        // srcset 이미지
        Array.from(document.querySelectorAll('[srcset]')).forEach(el => {
          images.srcSet.push({
            tag: el.tagName,
            srcset: el.getAttribute('srcset')?.substring(0, 150)
          });
        });

        // data-src (lazy load)
        Array.from(document.querySelectorAll('[data-src]')).forEach(el => {
          const src = el.getAttribute('data-src');
          if (src && src.includes('cdn')) {
            images.dataSrc.push({
              tag: el.tagName,
              dataSrc: src
            });
          }
        });

        // background-image URL
        Array.from(document.querySelectorAll('[style*="background-image"]')).forEach(el => {
          const match = el.getAttribute('style')?.match(/url\(['"]?([^'")\s]+)['"]?\)/);
          if (match?.[1]) {
            images.backgroundImage.push({
              tag: el.tagName,
              class: el.className.substring(0, 50),
              url: match[1]
            });
          }
        });

        // 모든 img 태그와 그들의 src 변화 가능성
        Array.from(document.querySelectorAll('img')).forEach(img => {
          if (img.src && img.src.includes('cdn')) {
            images.imageElements.push({
              src: img.src,
              dataSrc: img.getAttribute('data-src'),
              loaded: img.complete,
              class: img.className.substring(0, 50)
            });
          }
        });

        return images;
      });

      console.log(`\n🖼️ 동적 이미지 로드:`);
      console.log(`   srcset: ${dynamicImages.srcSet.length}개`);
      console.log(`   data-src: ${dynamicImages.dataSrc.length}개`);
      console.log(`   background-image: ${dynamicImages.backgroundImage.length}개`);
      console.log(`   img 요소: ${dynamicImages.imageElements.length}개`);

      // 페이지 전체 텍스트에서 URL 추출
      const allUrls = await page.evaluate(() => {
        const text = document.body.innerText;
        const urls = text.match(/https?:\/\/[^\s"'<>]+/g) || [];
        return urls.filter(url => url.includes('cdn.imweb.me')).slice(0, 20);
      });

      console.log(`\n🔗 페이지 텍스트에서 발견된 CDN URL: ${allUrls.length}개`);
      if (allUrls.length > 0) {
        allUrls.forEach(url => {
          console.log(`   - ${url.substring(0, 100)}`);
        });
      }

      // 결과 저장
      results[postId] = {
        xhrRequests: xhrRequests.slice(0, 10),
        scriptData,
        iframeData,
        dynamicImages,
        allUrls
      };

      await page.waitForTimeout(1000);
    }

    // 두 게시글 비교
    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`🔍 게시글 간 비교`);
    console.log('='.repeat(80));

    const postIds = Object.keys(results);
    if (postIds.length === 2) {
      const [post1, post2] = postIds;
      const xhrUrls1 = results[post1].xhrRequests.map(r => r.url);
      const xhrUrls2 = results[post2].xhrRequests.map(r => r.url);

      const diffXhr = xhrUrls1.filter(url => !xhrUrls2.includes(url));
      console.log(`\n📡 게시글별로 다른 XHR 요청:`);
      if (diffXhr.length > 0) {
        diffXhr.forEach(url => console.log(`   - ${url}`));
      } else {
        console.log(`   (모두 동일)`);
      }

      // 이미지 URL 비교
      const urls1 = results[post1].allUrls.sort();
      const urls2 = results[post2].allUrls.sort();
      const diffImages = urls1.filter(url => !urls2.includes(url));

      console.log(`\n🖼️ 게시글별로 다른 CDN 이미지:`);
      if (diffImages.length > 0) {
        diffImages.forEach(url => console.log(`   - ${url}`));
      } else {
        console.log(`   (모두 동일 - 게시글별 고유 이미지 없음)`);
      }
    }

    // 상세 결과 파일 저장
    fs.writeFileSync(
      'deep-network-analysis.json',
      JSON.stringify(results, null, 2)
    );

    console.log(`\n✅ 상세 분석 결과: deep-network-analysis.json`);

  } catch (error) {
    console.error(`\n❌ 오류: ${error.message}`);
    console.error(error.stack);
  } finally {
    await context.close();
    await browser.close();
  }
}

deepNetworkAnalysis().catch(err => {
  console.error('❌ 치명적 오류:', err.message);
  process.exit(1);
});
