/**
 * 게시글 영역 HTML 구조 분석
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function analyze() {
  let browser;
  let page;

  try {
    console.log('게시글 구조 분석 시작...');

    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();

    const url = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=8';
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // 페이지 HTML 저장
    const html = await page.content();
    fs.writeFileSync(
      path.join(__dirname, 'posts-page.html'),
      html,
      'utf-8'
    );
    console.log('HTML 저장됨: scripts/posts-page.html');

    // 게시글 관련 정보 추출
    const postInfo = await page.evaluate(() => {
      const result = {
        totalElements: 0,
        postContainers: [],
        selectors: {},
      };

      // 다양한 셀렉터로 시도
      const selectors = {
        'div[class*="post"]': document.querySelectorAll('div[class*="post"]').length,
        'div[class*="item"]': document.querySelectorAll('div[class*="item"]').length,
        'li[class*="post"]': document.querySelectorAll('li[class*="post"]').length,
        'tr[class*="post"]': document.querySelectorAll('tr[class*="post"]').length,
        'article': document.querySelectorAll('article').length,
        'div.board': document.querySelectorAll('div.board').length,
        'div.list': document.querySelectorAll('div.list').length,
      };

      result.selectors = selectors;

      // 텍스트로 게시글 찾기 (조회수, 댓글 수 포함)
      const textElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent || '';
        return (text.includes('조회수') || text.includes('조회')) &&
               (text.includes('2023') || text.includes('2024') || text.includes('2025') || text.includes('2026'));
      });

      console.log(`텍스트 기반 게시글 후보: ${textElements.length}`);
      result.textBasedCount = textElements.length;

      return result;
    });

    console.log('\n=== 셀렉터별 요소 개수 ===');
    Object.entries(postInfo.selectors).forEach(([selector, count]) => {
      console.log(`${selector}: ${count}개`);
    });

    console.log(`\n텍스트 기반 게시글: ${postInfo.textBasedCount}개`);

  } catch (error) {
    console.error(`오류: ${error.message}`);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
    process.exit(0);
  }
}

analyze();
