/**
 * PC천국 포럼 게시글 크롤러 (수정됨)
 * - 이미지가 있는 게시글만 크롤링
 * - 상세 페이지에서 게시글 본문의 board_thumb 이미지만 추출
 * - 목록 페이지에서 전체 내용 추출
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'scraper-posts-correct.log');
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

              const img = elem.querySelector('img.board_thumb');
              if (!img) return;

              let imageUrl = img.getAttribute('src') || '';
              if (!imageUrl || imageUrl.includes('placeholder')) return;

              if (imageUrl && !imageUrl.startsWith('http')) {
                imageUrl = 'https://www.xn--3e0b036btifksj.com' + (imageUrl.startsWith('/') ? '' : '/') + imageUrl;
              }

              const description = elem.querySelector('small.body_font_color_50')?.textContent?.trim() || '';

              if (title && title.length > 3 && description.length > 10) {
                items.push({
                  title: title,
                  description: description,
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
          log(`   내용 길이: ${post.description.length}자`);
        });

        allPosts.push(...posts);

        // 각 게시글의 상세 페이지에서 board_thumb 이미지만 추출
        const listUrl = url;
        for (const post of posts) {
          try {
            // 게시글 번호 찾기
            const postIdx = allPosts.indexOf(post);
            const likeButtons = await page.evaluate(() => {
              return Array.from(document.querySelectorAll('[id^="like_btn_"]'))
                .map(btn => btn.id.replace('like_btn_', ''));
            });

            if (likeButtons.length > postIdx) {
              const postId = likeButtons[postIdx];
              const detailUrl = `https://www.xn--3e0b036btifksj.com/40/?mode=view&id=${postId}`;

              log(`  상세 페이지에서 이미지 추출: ${post.title}`);
              await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });

              // board_thumb 클래스의 이미지만 추출 (게시글 본문 이미지)
              const images = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('img.board_thumb'))
                  .map(img => img.src || '')
                  .filter(src => src.includes('cdn.imweb.me') && src.length > 20);
              });

              post.images = images;
              log(`    ✓ 게시글 본문 이미지 ${images.length}개 발견`);

              if (images.length > 0) {
                images.slice(0, 5).forEach((url, i) => {
                  log(`      ${i + 1}. ${url.substring(0, 60)}...`);
                });
                if (images.length > 5) {
                  log(`      ... 외 ${images.length - 5}개`);
                }
              }

              // 목록 페이지로 돌아가기
              await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });
            }
          } catch (e) {
            log(`    ⚠ 이미지 추출 실패: ${e.message}`, 'WARN');
            post.images = [];
          }
        }

        await new Promise(resolve => setTimeout(resolve, 800));

      } catch (pageError) {
        log(`페이지 ${pageNum} 오류: ${pageError.message}`, 'WARN');
      }
    }

    log(`\n총 ${allPosts.length}개 게시글 발견 (이미지 있는 것만)`);

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
