/**
 * PC천국 커뮤니티 게시글 크롤러 (수정됨)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'scraper-posts.log');
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

        // 게시글 목록 추출 (올바른 셀렉터 사용)
        const posts = await page.evaluate(() => {
          const items = [];

          // ul.list 내의 각 게시글 찾기
          const postElements = document.querySelectorAll('ul.list');

          postElements.forEach((elem, idx) => {
            try {
              // 제목 추출 (li.tit > a > span)
              const titleSpan = elem.querySelector('li.tit span');
              const title = titleSpan?.textContent?.trim();

              // 작성자 추출 (li.author)
              const author = elem.querySelector('li.author')?.textContent?.trim() || '';

              // 날짜 추출 (li.time)
              const date = elem.querySelector('li.time')?.textContent?.trim() || new Date().toISOString().split('T')[0];

              // 조회수 추출 (li.views 안의 숫자)
              const viewText = elem.querySelector('li.views')?.textContent || '0';
              const viewCount = parseInt(viewText.replace(/[^0-9]/g, '')) || 0;

              // 댓글 수 추출 (span.comment-count > span)
              const commentCount = parseInt(elem.querySelector('span.comment-count span')?.textContent || '0') || 0;

              // 이미지 추출 (img.board_thumb) - lazy loading 대응
              const img = elem.querySelector('img.board_thumb');
              let imageUrl = img?.getAttribute('src') || img?.getAttribute('data-src') || img?.getAttribute('data-img') || '';

              // 상대 경로면 절대 경로로 변환
              if (imageUrl && !imageUrl.startsWith('http')) {
                imageUrl = 'https://www.xn--3e0b036btifksj.com' + (imageUrl.startsWith('/') ? '' : '/') + imageUrl;
              }

              // 설명/내용 추출 (small.body_font_color_50)
              const description = elem.querySelector('small.body_font_color_50')?.textContent?.trim() || '';

              if (title && title.length > 3) {
                items.push({
                  title: title,
                  author: author,
                  date: date,
                  viewCount: viewCount,
                  commentCount: commentCount,
                  imageUrl: imageUrl,
                  description: description,
                  sourceId: `post_${Date.now()}_${idx}`,
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
        log(`   - 작성자: ${post.author}`);
        log(`   - 날짜: ${post.date}`);
        log(`   - 조회: ${post.viewCount}, 댓글: ${post.commentCount}`);
        if (post.imageUrl) {
          log(`   - 이미지: ${post.imageUrl}`);
        } else {
          log(`   - 이미지: (없음)`);
        }
        if (post.description) log(`   - 설명: ${post.description.substring(0, 50)}...`);
      });

      // Supabase에 저장
      log('Supabase 저장 중...');

      try {
        const dotenv = require('dotenv');
        dotenv.config({ path: path.join(__dirname, '../.env.local') });

        const { createClient } = require('@supabase/supabase-js');

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          log('✗ Supabase 환경변수 없음', 'ERROR');
          return;
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        let imported = 0;
        let skipped = 0;

        // 이미지 URL 맵 저장 (임시 파일)
        const imageMap = {};
        allPosts.forEach(post => {
          if (post.imageUrl) {
            imageMap[post.title] = post.imageUrl;
          }
        });

        fs.writeFileSync(
          path.join(__dirname, 'image-map.json'),
          JSON.stringify(imageMap, null, 2),
          'utf-8'
        );

        for (const post of allPosts) {
          try {
            const { data, error } = await supabase
              .from('posts')
              .insert([
                {
                  title: post.title,
                  content: post.description,
                  category: 'free',
                  view_count: post.viewCount,
                  status: 'active',
                },
              ])
              .select();

            if (error) {
              log(`✗ 게시글 저장 실패: ${post.title} - ${error.message}`, 'WARN');
              skipped++;
              continue;
            }

            imported++;
            if (post.imageUrl) {
              log(`✓ 저장됨: ${post.title} (이미지: 포함)`);
            } else {
              log(`✓ 저장됨: ${post.title}`);
            }

          } catch (err) {
            log(`✗ 오류: ${err.message}`, 'WARN');
            skipped++;
          }
        }

        log(`✓ 완료: ${imported}개 게시글 추가됨, ${skipped}개 실패`, 'SUCCESS');
      } catch (dbError) {
        log(`✗ DB 저장 실패: ${dbError.message}`, 'ERROR');
      }
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
