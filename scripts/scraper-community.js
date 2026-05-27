/**
 * PC천국 커뮤니티 게시글 크롤러
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'scraper-community.log');
const CONFIG = {
  headless: true,
  timeout: 30000,
  startPage: 8,
  endPage: 8, // 테스트: 8페이지만
  boardUrl: 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=',
};

function log(message, level = 'INFO') {
  const timestamp = new Date().toLocaleString('ko-KR');
  const logLine = `[${timestamp}] [${level}] ${message}`;
  console.log(logLine);
  fs.appendFileSync(LOG_FILE, logLine + '\n', 'utf-8');
}

async function scrapeWithPlaywright() {
  let browser;
  let page;
  const allPosts = [];

  try {
    log('Playwright 브라우저 시작 중...');
    browser = await chromium.launch({ headless: CONFIG.headless });
    page = await browser.newPage();

    // 각 페이지 크롤링
    for (let pageNum = CONFIG.startPage; pageNum <= CONFIG.endPage; pageNum++) {
      try {
        log(`페이지 ${pageNum} 크롤링 중...`);

        const url = `${CONFIG.boardUrl}${pageNum}`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });

        // 게시글 목록 추출
        const posts = await page.evaluate(() => {
          const items = [];

          // 게시글 항목 찾기
          const postElements = document.querySelectorAll('[class*="post"], [class*="item"]');

          postElements.forEach((elem, idx) => {
            try {
              // 제목 찾기
              const titleElem = elem.querySelector('a, h3, .title, [class*="title"]');
              const title = titleElem?.textContent?.trim();
              const href = titleElem?.getAttribute('href') || titleElem?.parentElement?.getAttribute('href');

              if (title && title.length > 3) {
                // 추가 정보 추출
                const viewCount = elem.querySelector('[class*="view"], [class*="count"]')?.textContent || '0';
                const dateElem = elem.querySelector('[class*="date"], [class*="time"]');
                const date = dateElem?.textContent?.trim() || new Date().toISOString().split('T')[0];

                // 이미지 찾기
                const img = elem.querySelector('img');
                const imageUrl = img?.getAttribute('src') || img?.getAttribute('data-src') || '';

                items.push({
                  title: title,
                  href: href,
                  url: href?.startsWith('http') ? href : `https://www.xn--3e0b036btifksj.com${href}`,
                  viewCount: parseInt(viewCount) || 0,
                  date: date,
                  imageUrl: imageUrl,
                  sourceId: href?.match(/(\d+)/)?.[1] || `${Date.now()}-${idx}`,
                });
              }
            } catch (e) {
              // 무시
            }
          });

          return items;
        });

        log(`페이지 ${pageNum}: ${posts.length}개 게시글 발견`);
        allPosts.push(...posts);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 800));

      } catch (pageError) {
        log(`페이지 ${pageNum} 오류: ${pageError.message}`, 'WARN');
      }
    }

    log(`총 ${allPosts.length}개 게시글 발견`);

    // 발견된 게시글 출력
    if (allPosts.length > 0) {
      log('=== 발견된 게시글 ===');
      allPosts.forEach((post, idx) => {
        log(`${idx + 1}. ${post.title}`);
        log(`   - URL: ${post.url}`);
        log(`   - 조회: ${post.viewCount}, 날짜: ${post.date}`);
      });
    }

    log('크롤링 완료\n');

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
