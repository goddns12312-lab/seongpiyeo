/**
 * PC천국 포럼 게시글 크롤러 (v2: 상세 내용 + 원본 이미지)
 * - 이미지가 있는 게시글만 크롤링
 * - 상세 페이지에서 전체 내용 추출
 * - 원본 이미지 URL 추출
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'scraper-posts-v2.log');
const CONFIG = {
  headless: true,
  timeout: 30000,
  startPage: 8,
  endPage: 8,
  boardUrl: 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=',
};

function log(message, level = 'INFO') {
  const timestamp = new Date().toLocaleString('ko-KR');
  const logLine = `[${timestamp}] [${level}] ${message}`;
  console.log(logLine);
  fs.appendFileSync(LOG_FILE, logLine + '\n', 'utf-8');
}

async function scrapeWithPlaywright() {
  let browser, page;
  const allPosts = [];

  try {
    log('Playwright 브라우저 시작 중...');
    browser = await chromium.launch({ headless: CONFIG.headless });
    page = await browser.newPage();

    for (let pageNum = CONFIG.startPage; pageNum <= CONFIG.endPage; pageNum++) {
      try {
        log(`페이지 ${pageNum} 크롤링 중...`);

        const url = `${CONFIG.boardUrl}${pageNum}`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });

        // 게시글 목록 추출 (이미지가 있는 것만)
        const posts = await page.evaluate(() => {
          const items = [];
          const postElements = document.querySelectorAll('ul.list');

          postElements.forEach((elem, idx) => {
            try {
              const titleSpan = elem.querySelector('li.tit span');
              const title = titleSpan?.textContent?.trim();

              // 이미지 추출 - 없으면 스킵
              const img = elem.querySelector('img.board_thumb');
              if (!img) return; // 이미지 없으면 건너뛰기

              const likeBtn = elem.querySelector('[id^="like_btn_"]');
              const postId = likeBtn?.id?.replace('like_btn_', '') || '';

              if (title && title.length > 3 && postId) {
                items.push({
                  title: title,
                  postId: postId,
                  sourceId: `post_${Date.now()}_${idx}`,
                });
              }
            } catch (e) {
              // 무시
            }
          });

          return items;
        });

        log(`페이지 ${pageNum}: ${posts.length}개 게시글 발견 (이미지 있는 것만)`);

        // 각 게시글의 상세 내용 크롤링
        for (const post of posts) {
          try {
            const detailUrl = `https://www.xn--3e0b036btifksj.com/40/?mode=view&id=${post.postId}`;
            await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });

            const details = await page.evaluate(() => {
              // 제목
              const title = document.querySelector('h2, h3, .post_title')?.textContent?.trim() || 
                          document.body.textContent.substring(0, 100);

              // 이미지 추출 (원본)
              const images = Array.from(document.querySelectorAll('img:not(.ad):not(.banner)'))
                .filter(img => {
                  const src = img.src || '';
                  return src.includes('cdn.imweb') && !src.includes('vendor-cdn') && !src.includes('logo');
                })
                .map(img => img.src)
                .filter((url, idx, arr) => arr.indexOf(url) === idx); // 중복 제거

              // 전체 텍스트 컨텐츠
              const bodyText = document.body.textContent;
              
              return {
                title: title,
                content: bodyText,
                imageUrls: images,
              };
            });

            post.title = details.title;
            post.content = details.content;
            post.imageUrls = details.imageUrls;
            post.primaryImage = details.imageUrls[0] || null;

            log(`✓ 상세 페이지 로드됨: ${post.title}`);
            if (post.imageUrls.length > 0) {
              log(`  이미지 ${post.imageUrls.length}개 발견`);
            }

            allPosts.push(post);
          } catch (detailError) {
            log(`⚠ 상세 페이지 로드 실패: ${post.postId} - ${detailError.message}`, 'WARN');
          }
        }

        await new Promise(resolve => setTimeout(resolve, 800));

      } catch (pageError) {
        log(`페이지 ${pageNum} 오류: ${pageError.message}`, 'WARN');
      }
    }

    log(`총 ${allPosts.length}개 게시글 발견 (이미지 있는 것만)`);

    if (allPosts.length > 0) {
      log('=== 발견된 게시글 ===');
      allPosts.forEach((post, idx) => {
        log(`${idx + 1}. ${post.title.substring(0, 50)}`);
        log(`   - 게시글 ID: ${post.postId}`);
        log(`   - 이미지: ${post.imageUrls?.length || 0}개`);
        if (post.imageUrls && post.imageUrls.length > 0) {
          post.imageUrls.forEach((url, i) => {
            log(`     ${i + 1}. ${url.substring(0, 70)}...`);
          });
        }
      });
    }

  } catch (error) {
    log(`✗ 치명적 오류: ${error.message}`, 'ERROR');
    process.exit(1);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

scrapeWithPlaywright().catch(err => {
  log(`예상치 못한 오류: ${err.message}`, 'ERROR');
  process.exit(1);
});
