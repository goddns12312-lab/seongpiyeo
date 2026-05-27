const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

async function analyzeHarAndJs() {
  console.log('📋 HAR 파일 분석\n');

  // 1️⃣ HAR 파일 로드
  const harPath = path.join(__dirname, 'network-capture.har');
  let harContent;

  try {
    harContent = JSON.parse(fs.readFileSync(harPath, 'utf-8'));
  } catch (error) {
    console.log(`❌ HAR 파일 파싱 오류: ${error.message}`);
    process.exit(1);
  }

  const entries = harContent.log.entries || [];
  console.log(`✅ HAR 파일 로드 완료: ${entries.length}개 항목\n`);

  // 2️⃣ API 엔드포인트 분석
  console.log('='.repeat(80));
  console.log('1️⃣ 모든 API/XHR 요청');
  console.log('='.repeat(80) + '\n');

  const xhrRequests = [];
  const apiEndpoints = new Set();

  entries.forEach((entry, idx) => {
    const request = entry.request;
    const response = entry.response;

    if (request.url.includes('ajax') || request.url.includes('/api') ||
        request.method === 'POST' || request.method === 'GET') {

      // 게시판 관련 URL만 필터링
      if (!request.url.includes('google') && !request.url.includes('youtube')) {
        const url = request.url;
        const method = request.method;
        const postData = request.postData?.text || '';

        xhrRequests.push({
          url,
          method,
          postData: postData.substring(0, 150)
        });

        // API 엔드포인트 추출
        if (url.includes('/ajax/') || url.includes('/api/')) {
          const endpoint = url.split('?')[0];
          apiEndpoints.add(endpoint);
        }
      }
    }
  });

  // 중복 제거 및 정렬
  const uniqueRequests = Array.from(new Map(
    xhrRequests.map(req => [req.url.split('?')[0], req])
  ).values()).sort((a, b) => a.url.localeCompare(b.url));

  console.log(`발견된 API 엔드포인트: ${apiEndpoints.size}개\n`);
  Array.from(apiEndpoints).forEach(endpoint => {
    console.log(`✓ ${endpoint}`);
  });

  console.log(`\n발견된 XHR/Ajax 요청: ${uniqueRequests.length}개\n`);
  uniqueRequests.forEach((req, idx) => {
    console.log(`${idx + 1}. ${req.method} ${req.url.substring(0, 100)}`);
    if (req.postData) {
      console.log(`   데이터: ${req.postData}`);
    }
  });

  // 3️⃣ JavaScript 파일 추출 및 분석
  console.log('\n' + '='.repeat(80));
  console.log('2️⃣ JavaScript 파일 분석');
  console.log('='.repeat(80) + '\n');

  const jsFiles = [];
  const keywords = ['board', 'post', 'article', 'detail', 'view', 'comment',
                   'file', 'image', 'attachment', 'upload', 'get_post',
                   'getBoard', 'board_code', 'idx', 'post_id', 'api'];

  entries.forEach(entry => {
    const request = entry.request;
    const response = entry.response;

    if ((request.url.includes('.js') || response.content?.mimeType === 'application/javascript') &&
        !request.url.includes('google') && !request.url.includes('youtube')) {

      jsFiles.push({
        url: request.url,
        size: response.content?.size || 0,
        mimeType: response.content?.mimeType,
        content: response.content?.text || ''
      });
    }
  });

  console.log(`발견된 JS 파일: ${jsFiles.length}개\n`);

  // 각 JS 파일에서 키워드 검색
  const keywordMatches = {};
  let totalKeywordCount = 0;

  jsFiles.forEach(jsFile => {
    const fileName = jsFile.url.split('/').pop() || 'unknown.js';
    console.log(`📄 ${fileName} (${(jsFile.size / 1024).toFixed(2)} KB)`);

    let fileMatches = 0;
    const foundKeywords = [];

    keywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = (jsFile.content.match(regex) || []).length;
      if (matches > 0) {
        foundKeywords.push(`${keyword}:${matches}`);
        fileMatches += matches;
        totalKeywordCount += matches;
      }
    });

    if (foundKeywords.length > 0) {
      console.log(`   🔑 키워드 발견: ${foundKeywords.join(', ')}`);
    }

    // API 엔드포인트 패턴 찾기
    const apiPattern = /(['"`])(\/(api|ajax)\/[a-zA-Z0-9_\/\-\.]+)\1/g;
    const apiMatches = jsFile.content.match(apiPattern) || [];
    if (apiMatches.length > 0) {
      console.log(`   🔗 API 경로: ${apiMatches.slice(0, 3).join(', ')}`);
    }

    console.log('');
  });

  console.log(`\n총 키워드 매칭: ${totalKeywordCount}개\n`);

  // 4️⃣ 게시글 ID 관련 특정 검색
  console.log('='.repeat(80));
  console.log('3️⃣ 게시글 ID/idx 관련 패턴 검색');
  console.log('='.repeat(80) + '\n');

  const postIdPatterns = [
    /post_?id/gi,
    /board_?id/gi,
    /article_?id/gi,
    /idx/gi,
    /contentId/gi,
    /articleId/gi,
    /mode=view/gi,
    /\?id=/gi,
    /get_post|getPost/gi
  ];

  jsFiles.forEach(jsFile => {
    const fileName = jsFile.url.split('/').pop() || 'unknown.js';
    let foundPatterns = [];

    postIdPatterns.forEach(pattern => {
      const matches = (jsFile.content.match(pattern) || []).length;
      if (matches > 0) {
        foundPatterns.push(`${pattern.source}:${matches}`);
      }
    });

    if (foundPatterns.length > 0) {
      console.log(`📄 ${fileName}`);
      console.log(`   패턴: ${foundPatterns.join(', ')}\n`);
    }
  });

  // 5️⃣ 결과 저장
  console.log('='.repeat(80));
  console.log('💾 분석 결과 저장');
  console.log('='.repeat(80) + '\n');

  const analysis = {
    totalEntries: entries.length,
    apiEndpoints: Array.from(apiEndpoints),
    xhrRequests: uniqueRequests,
    jsFiles: jsFiles.map(f => ({
      url: f.url,
      size: f.size,
      contentLength: f.content.length
    })),
    summary: {
      totalJs: jsFiles.length,
      totalKeywordMatches: totalKeywordCount,
      findingDate: new Date().toISOString()
    }
  };

  fs.writeFileSync(
    path.join(__dirname, 'har-analysis.json'),
    JSON.stringify(analysis, null, 2)
  );

  console.log(`✅ har-analysis.json 저장 완료\n`);

  // 최종 결론
  console.log('='.repeat(80));
  console.log('📊 최종 분석');
  console.log('='.repeat(80) + '\n');

  const gamePostApis = uniqueRequests.filter(r =>
    r.url.includes('post') || r.url.includes('board') || r.url.includes('article') ||
    r.url.includes('detail') || r.url.includes('view')
  );

  if (gamePostApis.length > 0) {
    console.log(`✅ 게시글 관련 API 발견: ${gamePostApis.length}개\n`);
    gamePostApis.forEach(api => {
      console.log(`   - ${api.url}`);
    });
  } else {
    console.log(`⚠️  게시글 데이터 로드 전용 API를 찾지 못했습니다.`);
    console.log(`\n가능성:`);
    console.log(`   1. API가 숨겨진 JavaScript 번들 내에 있음`);
    console.log(`   2. 페이지 렌더링 시 모든 데이터가 HTML에 포함됨`);
    console.log(`   3. 클라이언트에서 클릭/상호작용 후 API 호출\n`);
  }

}

analyzeHarAndJs().catch(err => {
  console.error('❌ 오류:', err.message);
  console.error(err.stack);
  process.exit(1);
});
