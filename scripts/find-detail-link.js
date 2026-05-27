#!/usr/bin/env node

const { chromium } = require('playwright');

async function findDetailLink() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  try {
    const listUrl = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=1';

    console.log('🔍 게시글 상세 페이지 링크 찾기\n');
    await page.goto(listUrl, { waitUntil: 'networkidle', timeout: 30000 });

    const allLinks = await page.evaluate(() => {
      const results = [];

      // 모든 a 태그 찾기
      const allAnchors = Array.from(document.querySelectorAll('a'));

      allAnchors.forEach(a => {
        const href = a.getAttribute('href');
        const text = a.textContent?.trim().slice(0, 30);

        // 게시글 제목처럼 보이는 링크 찾기
        if (text && text.length > 5 && href && !href.includes('javascript')) {
          results.push({
            text,
            href: href.slice(0, 100)
          });
        }
      });

      return results;
    });

    console.log(`발견된 링크 ${allLinks.length}개\n`);
    allLinks.slice(0, 10).forEach((link, i) => {
      console.log(`[${i+1}] ${link.text}`);
      console.log(`     ${link.href}`);
    });

    // 페이지 HTML 일부 확인
    console.log('\n📄 페이지 구조 분석 (post_link_wrap):\n');
    const htmlSample = await page.locator('span.post_link_wrap').first().evaluate(el => {
      return el.outerHTML.slice(0, 800);
    });

    console.log(htmlSample);

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

findDetailLink().catch(console.error);
