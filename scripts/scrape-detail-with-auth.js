const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.xn--3e0b036btifksj.com';
const LOG_FILE = path.join(__dirname, 'scrape-detail-with-auth.log');

function log(message, level = 'INFO') {
  const timestamp = new Date().toLocaleString('ko-KR');
  const logLine = `[${timestamp}] [${level}] ${message}`;
  console.log(logLine);
  fs.appendFileSync(LOG_FILE, logLine + '\n', 'utf-8');
}

async function scrapeDetailWithAuth() {
  const browser = await chromium.launch({ headless: true });
  const authFile = path.join(__dirname, 'playwright-auth.json');

  if (!fs.existsSync(authFile)) {
    log('❌ playwright-auth.json을 찾을 수 없습니다. 먼저 로그인하세요.', 'ERROR');
    await browser.close();
    process.exit(1);
  }

  log('🔐 저장된 세션으로 Playwright 초기화 중...');

  const storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));

  // 새로운 Playwright API 방식
  const page = await browser.newPage();

  // 쿠키 복원
  if (storageState.cookies && storageState.cookies.length > 0) {
    await page.context().addCookies(storageState.cookies);
    log(`   ✓ ${storageState.cookies.length}개의 쿠키 로드됨`);
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
      if (origin.sessionStorage && origin.sessionStorage.length > 0) {
        await page.addInitScript((items) => {
          items.forEach(item => {
            sessionStorage.setItem(item.name, item.value);
          });
        }, origin.sessionStorage);
      }
    }
    log(`   ✓ 로컬 스토리지 복원됨`);
  }

  const context = page.context();

  try {
    // 1. 게시판 목록에서 게시글 ID 추출
    log('1️⃣ 게시판 목록 접근');
    const boardUrl = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=8';
    await page.goto(boardUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const posts = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('ul.list').forEach((elem, idx) => {
        try {
          const titleSpan = elem.querySelector('li.tit span');
          const title = titleSpan?.textContent?.trim();
          const likeBtn = elem.querySelector('[id^="like_btn_"]');
          const postId = likeBtn?.id?.replace('like_btn_', '') || '';
          const summary = elem.querySelector('small.body_font_color_50')?.textContent?.trim() || '';

          if (title && postId) {
            items.push({ title, postId, summary });
          }
        } catch (e) {}
      });
      return items;
    });

    log(`✅ 발견된 게시글: ${posts.length}개`);

    // 2. 각 게시글의 상세 페이지 크롤링
    const results = [];

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const detailUrl = `${BASE_URL}/40/?mode=view&id=${post.postId}`;

      log(`\n📖 게시글 ${i + 1}/${posts.length}: ${post.title}`);
      log(`   상세 URL: ${detailUrl}`);

      try {
        await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // 상세 페이지 내용 추출
        const details = await page.evaluate(() => {
          // 메인 게시글 콘텐츠 영역만 찾기
          // 이미지가 가장 많이 있는 영역을 본문으로 판단
          let mainContentDiv = null;
          let maxImageCount = 0;

          Array.from(document.querySelectorAll('div')).forEach(div => {
            const imgCount = div.querySelectorAll('img.org_image, img.board_thumb').length;
            const textLength = div.innerText?.length || 0;

            // 본문으로 보이는 영역: org_image 또는 board_thumb 이미지를 가지면서 텍스트도 있는 div
            if (imgCount > 0 && textLength > 200 && imgCount > maxImageCount) {
              maxImageCount = imgCount;
              mainContentDiv = div;
            }
          });

          // 메인 콘텐츠에서만 데이터 추출
          const contentArea = mainContentDiv || document.body;
          const contentText = contentArea.innerText || '';

          // 12항목 데이터 추출 (첫 번째 매물업종부터 연락처까지만)
          const lines = contentText.split('\n');
          let content12Items = '';
          let foundStart = false;
          let itemCount = 0;

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // 매물업종으로 시작하는 섹션 찾기
            if (line.includes('매물업종') && !foundStart) {
              foundStart = true;
            }

            if (foundStart) {
              content12Items += line + '\n';

              // 12항목 관련 데이터 카운트
              if (line.includes('매물업종') || line.includes('매물위치') ||
                  line.includes('실평수') || line.includes('해당층') ||
                  line.includes('보증금') || line.includes('희망권리금') ||
                  line.includes('월세') || line.includes('시설집기') ||
                  line.includes('입주가능일') || line.includes('사업자') ||
                  line.includes('행정처분') || line.includes('연락처')) {
                itemCount++;
              }

              // 12항목 이후 관련없는 내용이 나오면 멈추기
              if (foundStart && itemCount >= 12 && line.trim() === '') {
                break;
              }
            }
          }

          // 실제 게시글 이미지만 추출
          const imageSet = new Set();

          // 1. org_image 클래스 (게시글 이미지)
          Array.from(contentArea.querySelectorAll('img.org_image')).forEach(img => {
            const src = img.src || '';
            if (src && src.includes('cdn.imweb.me')) {
              imageSet.add(src);
            }
          });

          // 2. board_thumb 클래스 (게시글 썸네일)
          Array.from(contentArea.querySelectorAll('img.board_thumb')).forEach(img => {
            const src = img.src || '';
            if (src && src.includes('cdn.imweb.me')) {
              imageSet.add(src);
            }
          });

          // 폴백: 위에서 이미지를 못 찾았으면 메인 콘텐츠의 모든 이미지 추출
          if (imageSet.size === 0) {
            Array.from(contentArea.querySelectorAll('img')).forEach(img => {
              const src = img.src || '';
              if (src && src.includes('cdn.imweb.me') &&
                  !src.includes('vendor-cdn') &&
                  !src.includes('logo') &&
                  !src.includes('profile') &&
                  !src.includes('icon')) {
                imageSet.add(src);
              }
            });
          }

          return {
            contentLength: contentText.length,
            content12Items: content12Items.trim() || '12항목 데이터 없음',
            imageUrls: Array.from(imageSet)
              .filter(url => !url.includes('vendor-cdn') && !url.includes('logo') && !url.includes('icon'))
              .slice(0, 20),
            debugInfo: {
              hasMainContent: mainContentDiv !== null,
              maxImageCount,
              contentAreaLength: contentText.length
            }
          };
        });

        log(`   ✓ 본문: ${details.contentLength}자`);
        log(`   ✓ 12항목 데이터: ${details.content12Items.split('\n').length}줄`);
        log(`   ✓ 이미지: ${details.imageUrls.length}개`);

        if (details.imageUrls.length > 0) {
          log(`\n   📷 이미지 URL (처음 3개):`);
          details.imageUrls.slice(0, 3).forEach((url, j) => {
            log(`      ${j + 1}. ${url.substring(0, 80)}...`);
          });
        }

        results.push({
          title: post.title,
          postId: post.postId,
          url: detailUrl,
          contentLength: details.contentLength,
          content12Items: details.content12Items,
          imageCount: details.imageUrls.length,
          imageUrls: details.imageUrls,
          debugInfo: details.debugInfo
        });

      } catch (error) {
        log(`   ❌ 오류: ${error.message}`, 'WARN');
        results.push({
          title: post.title,
          postId: post.postId,
          url: detailUrl,
          error: error.message
        });
      }

      await page.waitForTimeout(500);
    }

    // 3. 결과 저장
    log('\n' + '='.repeat(80));
    log('📊 크롤링 완료');
    log('='.repeat(80));

    const resultFile = path.join(__dirname, 'scrape-detail-result.json');
    fs.writeFileSync(resultFile, JSON.stringify(results, null, 2), 'utf-8');

    log(`✅ 결과 저장: ${resultFile}`);
    log(`   총 ${results.length}개 게시글 처리`);

    const successCount = results.filter(r => !r.error).length;
    log(`   성공: ${successCount}개, 실패: ${results.length - successCount}개`);

    // 4. 샘플 출력
    log('\n💾 저장된 데이터 샘플:');
    if (results.length > 0) {
      const sample = results[0];
      log(`\n   제목: ${sample.title}`);
      log(`   본문 길이: ${sample.contentLength}자`);
      log(`   이미지: ${sample.imageCount}개`);
      if (sample.content12Items && sample.content12Items !== '12항목 데이터 없음') {
        log(`\n   12항목 데이터 (처음 300자):`);
        log(`   ${sample.content12Items.substring(0, 300)}...`);
      }
    }

    log('\n✨ 상세 이미지 크롤링이 완료되었습니다!');
    log('   다음: 모든 페이지(8→1)를 처리하는 최종 크롤러를 실행할 수 있습니다.');

  } catch (error) {
    log(`❌ 치명적 오류: ${error.message}`, 'ERROR');
    process.exit(1);
  } finally {
    await context.close();
    await browser.close();
  }
}

scrapeDetailWithAuth().catch(err => {
  log(`❌ 예상치 못한 오류: ${err.message}`, 'ERROR');
  process.exit(1);
});
