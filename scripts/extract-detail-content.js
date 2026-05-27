const { chromium } = require('playwright');
const fs = require('fs');

async function extractDetailContent() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const detailUrl = 'https://www.xn--3e0b036btifksj.com/40/?mode=view&id=p20230501948641a7bc92f';

  console.log('📖 상세 페이지 정확한 내용 추출 중...\n');
  await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

  const detailContent = await page.evaluate(() => {
    // 모든 텍스트
    const allText = document.body.innerText || '';

    // "로그인 필요" 관련 메시지
    const loginMessages = Array.from(document.querySelectorAll('*'))
      .filter(el => {
        const text = el.innerText || '';
        return text.includes('로그인') || text.includes('가입') || text.includes('권한') || text.includes('제한');
      })
      .map(el => ({
        tag: el.tagName,
        class: el.className,
        text: el.innerText?.substring(0, 100)
      }))
      .slice(0, 5);

    // 게시글 본문 영역 찾기
    const mainContent = document.querySelector('main, article, [role="main"], .content, .post-content');
    const mainText = mainContent?.innerText || '';

    // 12항목 데이터 추출
    const lines = allText.split('\n');
    const itemLines = lines.filter(line => 
      line.includes('매물업종') || 
      line.includes('매물위치') || 
      line.includes('실평수') ||
      line.includes('해당층') ||
      line.includes('보증금') ||
      line.includes('희망권리금') ||
      line.includes('월세')
    );

    // 이미지 src들
    const images = Array.from(document.querySelectorAll('img'))
      .map(img => img.src || '')
      .filter(src => src.includes('cdn.imweb.me'));

    return {
      fullTextLength: allText.length,
      mainContentLength: mainText.length,
      loginMessages,
      itemLines: itemLines.slice(0, 10),
      textLines: allText.split('\n').slice(0, 30),
      imageUrls: images.slice(0, 10),
      imageCount: images.length
    };
  });

  console.log(`📊 상세 페이지 내용 통계:`);
  console.log(`  전체 텍스트: ${detailContent.fullTextLength}자`);
  console.log(`  본문 영역: ${detailContent.mainContentLength}자`);
  console.log(`  이미지: ${detailContent.imageCount}개\n`);

  console.log(`🔐 로그인 관련 메시지:`);
  if (detailContent.loginMessages.length > 0) {
    detailContent.loginMessages.forEach((msg, i) => {
      console.log(`  ${i + 1}. [${msg.tag}] ${msg.text}`);
    });
  } else {
    console.log(`  없음 (로그인 불필요)`);
  }

  console.log(`\n📝 12항목 데이터 라인:`);
  if (detailContent.itemLines.length > 0) {
    detailContent.itemLines.forEach((line, i) => {
      console.log(`  ${i + 1}. ${line.substring(0, 80)}`);
    });
  } else {
    console.log(`  없음`);
  }

  console.log(`\n📄 텍스트 처음 30줄:`);
  detailContent.textLines.forEach((line, i) => {
    if (line.trim()) {
      console.log(`  ${i + 1}. ${line.substring(0, 80)}`);
    }
  });

  console.log(`\n🖼️ 이미지 URL (처음 5개):`);
  detailContent.imageUrls.slice(0, 5).forEach((url, i) => {
    console.log(`  ${i + 1}. ${url.substring(0, 80)}...`);
  });

  // 파일로 저장
  fs.writeFileSync(
    'c:/Users/B/Desktop/aass/scripts/detail-page-content.json',
    JSON.stringify(detailContent, null, 2),
    'utf-8'
  );

  console.log(`\n✅ detail-page-content.json 저장됨`);

  await browser.close();
}

extractDetailContent().catch(err => {
  console.error('오류:', err.message);
  process.exit(1);
});
