/**
 * PC천국 포럼 게시글 크롤러 (API 로그인)
 * - API로 로그인 후 세션 유지
 * - 게시글 상세 페이지의 모든 이미지 추출
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'scraper-posts-api-login.log');
const CONFIG = {
  headless: true,
  timeout: 30000,
  email: 'ap05020@nate.com',
  password: 'whdgus0603',
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

    // 먼저 사이트 방문 (쿠키 설정)
    log('사이트 초기 방문...');
    await page.goto('https://www.xn--3e0b036btifksj.com/', { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });

    // 게시판 접속
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

              const img = elem.querySelector('img.board_thumb');
              if (!img) return;

              let thumbnailUrl = img.getAttribute('src') || '';
              if (!thumbnailUrl) return;

              if (thumbnailUrl && !thumbnailUrl.startsWith('http')) {
                thumbnailUrl = 'https://www.xn--3e0b036btifksj.com' + (thumbnailUrl.startsWith('/') ? '' : '/') + thumbnailUrl;
              }

              const description = elem.querySelector('small.body_font_color_50')?.textContent?.trim() || '';

              // 게시글 ID 추출
              const likeBtn = elem.querySelector('[id^="like_btn_"]');
              const postId = likeBtn?.id?.replace('like_btn_', '') || '';

              if (title && title.length > 3 && description.length > 10 && postId) {
                items.push({
                  title: title,
                  description: description,
                  thumbnailUrl: thumbnailUrl,
                  postId: postId,
                  sourceId: `post_${Date.now()}_${idx}`,
                });
              }
            } catch (e) {}
          });

          return items;
        });

        log(`페이지 ${pageNum}: ${posts.length}개 게시글 발견 (이미지 있는 것만)`);

        posts.forEach((post, idx) => {
          log(`${idx + 1}. ${post.title}`);
          log(`   게시글 ID: ${post.postId}`);
        });

        // 각 게시글의 상세 페이지 접근
        for (let i = 0; i < posts.length; i++) {
          const post = posts[i];
          try {
            log(`  상세 페이지 로드: ${post.title}`);

            // 게시글 ID를 사용해서 상세 페이지 접근
            const detailUrl = `https://www.xn--3e0b036btifksj.com/40/?mode=view&id=${post.postId}`;

            await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });

            // 게시글 본문의 모든 이미지 추출 (로고/아이콘 제외)
            const images = await page.evaluate(() => {
              const imageSet = new Set();

              Array.from(document.querySelectorAll('img')).forEach(img => {
                const src = img.src || '';
                if (!src.includes('cdn.imweb.me')) return;
                if (src.includes('vendor-cdn')) return;

                // 제외할 요소들의 부모 확인
                let parent = img.parentElement;
                let isHeader = false;
                for (let i = 0; i < 5; i++) {
                  if (parent?.dataset?.widgetType === 'inline_logo' ||
                      parent?.dataset?.widgetType === 'inline_login_btn' ||
                      parent?.dataset?.widgetType === 'inline_menu' ||
                      src.includes('logo') || src.includes('icon') || src.includes('default_profile')) {
                    isHeader = true;
                    break;
                  }
                  parent = parent?.parentElement;
                }

                if (!isHeader) {
                  imageSet.add(src);
                }
              });

              return Array.from(imageSet).slice(0, 20);
            });

            // 게시글 전체 텍스트
            const pageText = await page.evaluate(() => {
              return document.body.innerText || document.body.textContent || '';
            });

            post.images = images;
            post.pageText = pageText;

            log(`    ✓ 이미지 ${images.length}개 발견`);

            if (images.length > 0) {
              images.slice(0, 4).forEach((url, j) => {
                log(`      ${j + 1}. ${url.substring(0, 60)}...`);
              });
              if (images.length > 4) {
                log(`      ... 외 ${images.length - 4}개`);
              }
            }

          } catch (e) {
            log(`    ⚠ 상세 페이지 오류: ${e.message}`, 'WARN');
            post.images = [];
            post.pageText = '';
          }
        }

        allPosts.push(...posts);
        await new Promise(resolve => setTimeout(resolve, 800));

      } catch (pageError) {
        log(`페이지 ${pageNum} 오류: ${pageError.message}`, 'WARN');
      }
    }

    log(`\n총 ${allPosts.length}개 게시글 발견`);

    // Supabase에 저장
    if (allPosts.length > 0) {
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

        // 이미지 URL 맵 저장
        const imageMap = {};
        allPosts.forEach(post => {
          imageMap[post.title] = post.images || [];
        });
        fs.writeFileSync(
          path.join(__dirname, 'image-map.json'),
          JSON.stringify(imageMap, null, 2),
          'utf-8'
        );

        let imported = 0, skipped = 0;

        for (const post of allPosts) {
          try {
            const { data, error } = await supabase
              .from('posts')
              .insert([{
                title: post.title,
                content: post.description,
                category: 'free',
                view_count: 0,
                status: 'active',
              }])
              .select();

            if (error) {
              log(`✗ 게시글 저장 실패: ${post.title}`, 'WARN');
              skipped++;
              continue;
            }

            imported++;
            log(`✓ 저장됨: ${post.title} (이미지: ${post.images?.length || 0}개)`);

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
