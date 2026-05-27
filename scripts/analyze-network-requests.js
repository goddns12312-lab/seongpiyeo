const { chromium } = require('playwright');
const fs = require('fs');

async function analyzeNetworkRequests() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 네트워크 요청 추적
  const networkRequests = [];
  const networkResponses = [];

  page.on('request', request => {
    const req = {
      url: request.url(),
      method: request.method(),
      postData: request.postData(),
      headers: request.headers()
    };
    networkRequests.push(req);
  });

  page.on('response', response => {
    const resp = {
      url: response.url(),
      status: response.status(),
      contentType: response.headers()['content-type'] || ''
    };
    networkResponses.push(resp);
  });

  const detailUrl = 'https://www.xn--3e0b036btifksj.com/40/?mode=view&id=p20230501948641a7bc92f';

  console.log('📡 상세 페이지 네트워크 요청 분석 중...\n');
  console.log(`URL: ${detailUrl}\n`);

  await page.goto(detailUrl, { waitUntil: 'networkidle', timeout: 30000 });

  // 의심스러운 API 호출 찾기
  const apiRequests = networkRequests.filter(r => 
    r.url.includes('/api/') || 
    r.url.includes('/ajax/') ||
    r.url.includes('.json') ||
    r.method === 'POST'
  );

  const iframeRequests = networkRequests.filter(r => 
    r.url.includes('iframe')
  );

  const imageRequests = networkRequests.filter(r => 
    r.url.includes('cdn.imweb.me') && 
    (r.url.includes('.jpg') || r.url.includes('.png') || r.url.includes('.gif'))
  );

  console.log(`📊 요청 통계:`);
  console.log(`  총 요청: ${networkRequests.length}개`);
  console.log(`  API/AJAX 요청: ${apiRequests.length}개`);
  console.log(`  iframe 요청: ${iframeRequests.length}개`);
  console.log(`  이미지 요청: ${imageRequests.length}개\n`);

  if (apiRequests.length > 0) {
    console.log(`🔗 API/AJAX 요청 목록:`);
    apiRequests.slice(0, 10).forEach((req, i) => {
      console.log(`  ${i + 1}. ${req.url.substring(0, 100)}`);
      if (req.postData) {
        console.log(`     POST: ${req.postData.substring(0, 100)}`);
      }
    });
  }

  // iframe 확인
  const iframes = await page.$$('iframe');
  console.log(`\n🖼️ iframe 분석:`);
  console.log(`  총 iframe: ${iframes.length}개`);

  if (iframes.length > 0) {
    for (let i = 0; i < Math.min(3, iframes.length); i++) {
      const src = await iframes[i].getAttribute('src');
      const id = await iframes[i].getAttribute('id');
      console.log(`  ${i + 1}. ID: ${id}, SRC: ${src}`);
    }
  }

  // Lazy-load 이미지 확인
  const lazyImages = await page.$$('img[data-src], img[loading="lazy"]');
  console.log(`\n⏳ Lazy-load 이미지: ${lazyImages.length}개`);

  // 특정 POST ID로 만든 요청이 있는지 확인
  const postIdRequests = networkRequests.filter(r => 
    r.url.includes('p20230501948641a7bc92f') || 
    r.url.includes('p2023051542519cd642c53') ||
    r.url.includes('p20230519efa1fc4a837d9') ||
    r.url.includes('p20230410358600eb6c03b')
  );

  console.log(`\n🔑 Post ID별 요청: ${postIdRequests.length}개`);
  postIdRequests.forEach((req, i) => {
    console.log(`  ${i + 1}. ${req.url.substring(0, 100)}`);
  });

  // 결과 저장
  fs.writeFileSync(
    'c:/Users/B/Desktop/aass/scripts/network-analysis.json',
    JSON.stringify({
      totalRequests: networkRequests.length,
      apiRequests: apiRequests.slice(0, 20),
      iframeRequests,
      imageRequests: imageRequests.slice(0, 10),
      postIdRequests
    }, null, 2),
    'utf-8'
  );

  console.log('\n✅ network-analysis.json 저장됨');

  await browser.close();
}

analyzeNetworkRequests().catch(err => {
  console.error('오류:', err.message);
  process.exit(1);
});
