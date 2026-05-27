/**
 * PC천국 포럼 게시글 크롤러 (완전판)
 * - 이미지가 있는 게시글만 크롤링
 * - 상세 페이지에서 전체 내용 + 모든 이미지 추출
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'scraper-posts-full.log');
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

        // 이미지가 있는 게시글만 필터링
        const posts = await page.evaluate(() => {
          const items = [];
          const postElements = document.querySelectorAll('ul.list');

          postElements.forEach((elem, idx) => {
            try {
              const titleSpan = elem.querySelector('li.tit span');
              const title = titleSpan?.textContent?.trim();

              const img = elem.querySelector('img.board_thumb');
              if (!img) return;

              const likeBtn = elem.querySelector('[id^="like_btn_"]');
              const postId = likeBtn?.id?.replace('like_btn_', '') || '';

              if (title && title.length > 3 && postId) {
                items.push({ title, postId });
              }
            } catch (e) {}
          });

          return items;
        });

        log(`페이지 ${pageNum}: ${posts.length}개 게시글 발견 (이미지 있는 것만)`);

        // 각 게시글의 상세 내용 크롤링
        for (const post of posts) {
          try {
            const detailUrl = `https://www.xn--3e0b036btifksj.com/40/?mode=view&id=${post.postId}`;
            log(`  상세 페이지 로드 중: ${post.title}`);
            await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });

            const details = await page.evaluate(() => {
              // 게시글의 모든 텍스트 추출
              let content = document.body.innerText || document.body.textContent || '';

              // 네비게이션, 메뉴 등 불필요한 텍스트 제거
              const lines = content.split('\n')
                .filter(line => line.trim().length > 0)
                .join('\n');

              // 이미지 추출
              const allImages = Array.from(document.querySelectorAll('img'));
              const images = allImages
                .filter(img => {
                  const src = img.src || '';
                  return src.includes('cdn.imweb.me') &&
                         !src.includes('vendor-cdn') &&
                         src.length > 20;
                })
                .map(img => img.src)
                .filter((url, idx, arr) => arr.indexOf(url) === idx);

              return {
                title: document.body.textContent.substring(0, 100),
                content: lines,
                imageUrls: images.slice(0, 10),
              };
            });

            post.title = details.title;
            post.content = details.content;
            post.imageUrls = details.imageUrls;

            log(`    ✓ 이미지: ${details.imageUrls.length}개`);
            details.imageUrls.forEach((url, i) => {
              log(`      ${i + 1}. ${url.substring(0, 60)}...`);
            });

            allPosts.push(post);

          } catch (detailError) {
            log(`    ✗ 상세 페이지 오류: ${detailError.message}`, 'WARN');
          }
        }

        await new Promise(resolve => setTimeout(resolve, 800));

      } catch (pageError) {
        log(`페이지 ${pageNum} 오류: ${pageError.message}`, 'WARN');
      }
    }

    log(`총 ${allPosts.length}개 게시글 발견 (이미지 있는 것만)`);

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
          imageMap[post.title] = post.imageUrls || [];
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
                content: post.content,
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
            log(`✓ 저장됨: ${post.title}`);

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
