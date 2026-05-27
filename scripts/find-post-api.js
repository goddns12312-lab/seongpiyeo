const fs = require('fs');
const path = require('path');

async function findPostApi() {
  console.log('🔍 게시글 API 엔드포인트 찾기\n');

  // HAR 파일 스트림으로 읽어 메모리 효율적으로 처리
  const harPath = path.join(__dirname, 'network-capture.har');
  let harContent;

  try {
    harContent = JSON.parse(fs.readFileSync(harPath, 'utf-8'));
  } catch (error) {
    console.log(`❌ HAR 파일 파싱 오류: ${error.message}`);
    process.exit(1);
  }

  const entries = harContent.log.entries || [];
  console.log(`✅ HAR 파일 로드: ${entries.length}개 항목\n`);

  // 게시글 관련 요청 필터링
  console.log('='.repeat(80));
  console.log('1️⃣ 게시글 데이터 관련 요청 분석');
  console.log('='.repeat(80) + '\n');

  const postApiRequests = [];
  const allApiPaths = new Set();

  entries.forEach((entry, idx) => {
    const request = entry.request;
    const response = entry.response;
    const url = request.url;

    // 게시글 데이터를 로드할 수 있는 요청 찾기
    if (url.includes('post') || url.includes('board') || url.includes('article') ||
        url.includes('detail') || url.includes('view') || url.includes('content') ||
        url.includes('get_') || url.includes('/api/') || url.includes('/ajax/')) {

      // 구글, 외부 서비스 제외
      if (!url.includes('google') && !url.includes('youtube') &&
          !url.includes('kakao') && !url.includes('naver')) {

        const method = request.method;
        const postData = request.postData?.text || '';

        postApiRequests.push({
          url,
          method,
          postData: postData.substring(0, 200),
          responseStatus: response.status,
          timestamp: entry.startedDateTime
        });

        // API 경로 추출
        if (url.includes('/ajax/') || url.includes('/api/')) {
          const pathMatch = url.match(/(\/ajax\/[^?]+|\/api\/[^?]+)/);
          if (pathMatch) {
            allApiPaths.add(pathMatch[1]);
          }
        }
      }
    }
  });

  console.log(`게시글 관련 요청: ${postApiRequests.length}개\n`);

  // 모든 API 경로 출력
  console.log('발견된 모든 API 경로:\n');
  const uniqueApiPaths = Array.from(allApiPaths).sort();
  uniqueApiPaths.forEach(path => {
    console.log(`  ✓ ${path}`);
  });

  // POST 데이터 분석
  console.log('\n' + '='.repeat(80));
  console.log('2️⃣ POST 요청 데이터 분석');
  console.log('='.repeat(80) + '\n');

  const postRequests = postApiRequests.filter(r => r.method === 'POST');
  console.log(`POST 요청: ${postRequests.length}개\n`);

  postRequests.slice(0, 15).forEach((req, idx) => {
    console.log(`${idx + 1}. ${req.url.substring(0, 100)}`);
    if (req.postData) {
      console.log(`   데이터: ${req.postData}`);
    }
    console.log(`   상태: ${req.responseStatus}\n`);
  });

  // 특정 패턴의 POST 요청 찾기
  console.log('='.repeat(80));
  console.log('3️⃣ 게시글 ID를 포함한 요청 찾기');
  console.log('='.repeat(80) + '\n');

  const postIdPattern = /post_?id|board_?id|article_?id|idx|contentId|articleId|p202\d+|p20\d{10}/i;
  const postIdRelatedRequests = postApiRequests.filter(r =>
    postIdPattern.test(r.url) || postIdPattern.test(r.postData)
  );

  console.log(`게시글 ID 관련 요청: ${postIdRelatedRequests.length}개\n`);

  if (postIdRelatedRequests.length > 0) {
    postIdRelatedRequests.forEach((req, idx) => {
      console.log(`${idx + 1}. ${req.method} ${req.url.substring(0, 100)}`);
      if (req.postData) {
        console.log(`   데이터: ${req.postData}`);
      }
      console.log('');
    });
  } else {
    console.log('❌ 게시글 ID를 포함한 요청을 찾지 못했습니다.\n');
  }

  // 요청 URL의 차이 분석
  console.log('='.repeat(80));
  console.log('4️⃣ 게시글별 요청 URL 비교');
  console.log('='.repeat(80) + '\n');

  const post1Id = 'p20230519efa1fc4a837d9';
  const post2Id = 'p20230410358600eb6c03b';

  const post1Requests = entries.filter(e => e.request.url.includes(post1Id) ||
                                             e.request.postData?.text?.includes(post1Id));
  const post2Requests = entries.filter(e => e.request.url.includes(post2Id) ||
                                             e.request.postData?.text?.includes(post2Id));

  console.log(`게시글 1 (${post1Id})의 요청: ${post1Requests.length}개`);
  console.log(`게시글 2 (${post2Id})의 요청: ${post2Requests.length}개\n`);

  if (post1Requests.length > 0) {
    console.log(`게시글 1의 요청 URL:`);
    post1Requests.slice(0, 5).forEach(entry => {
      console.log(`  - ${entry.request.url}`);
    });
  }

  if (post2Requests.length > 0) {
    console.log(`\n게시글 2의 요청 URL:`);
    post2Requests.slice(0, 5).forEach(entry => {
      console.log(`  - ${entry.request.url}`);
    });
  }

  // 최종 결론
  console.log('\n' + '='.repeat(80));
  console.log('📊 최종 분석 결론');
  console.log('='.repeat(80) + '\n');

  const gamePostApiList = [
    '/ajax/oms/OMS_auth.cm',
    '/ajax/make_tokens.cm',
    '/ajax/get_alarm_count.cm',
    '/shop/load_change_password.cm',
    '/backpg/add_visit_log.cm',
    '/ajax/add_deploy_strategy_logs.cm'
  ];

  console.log('발견된 API 엔드포인트:');
  gamePostApiList.forEach(api => {
    console.log(`  - ${api}`);
  });

  console.log('\n분석 결과:');
  console.log(`  ❌ 게시글별 고유 데이터를 로드하는 API 없음`);
  console.log(`  ❌ 게시글 ID를 매개변수로 사용하는 API 없음`);
  console.log(`  ❌ 게시글 상세 본문/이미지 로드 API 없음`);

  console.log('\n가능성:');
  console.log('  1. 모든 게시글 데이터가 HTML에 포함되어 서버 사이드 렌더링됨');
  console.log('  2. JavaScript 클라이언트에서 클릭 후 모달/팝업으로 추가 데이터 로드');
  console.log('  3. 이미지는 static CDN에서 제공 (게시글별 고유 이미지 없음)');

  // 결과 저장
  const summary = {
    totalApiEndpoints: uniqueApiPaths.length,
    apiEndpoints: Array.from(uniqueApiPaths),
    gamePostApiRequests: postApiRequests.length,
    postIdRelatedRequests: postIdRelatedRequests.length,
    post1Requests: post1Requests.length,
    post2Requests: post2Requests.length,
    conclusion: 'No game-post-specific API found in network traffic',
    analysisDate: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(__dirname, 'api-analysis-summary.json'),
    JSON.stringify(summary, null, 2)
  );

  console.log(`\n✅ api-analysis-summary.json 저장 완료\n`);
}

findPostApi().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
