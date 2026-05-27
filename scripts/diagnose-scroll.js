#!/usr/bin/env node

const { chromium } = require('playwright');

async function diagnoseWithScroll() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  try {
    const url = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=8';

    console.log('🔍 스크롤을 통한 상세 진단 (페이지 8)...\n');

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // 페이지 전체 높이 확인
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    console.log(`📏 페이지 전체 높이: ${pageHeight}px\n`);

    // 스크롤하며 콘텐츠 로드
    console.log('📜 페이지 전체 스크롤 중...');
    for (let i = 0; i < pageHeight; i += 500) {
      await page.evaluate(scrollY => window.scrollBy(0, scrollY), 500);
      await page.waitForTimeout(100);
    }
    console.log('✅ 스크롤 완료\n');

    // 모든 span.post_link_wrap 찾기
    const postWraps = await page.evaluate(() => {
      const wraps = document.querySelectorAll('span.post_link_wrap');
      return {
        count: wraps.length,
        elements: Array.from(wraps).map((wrap, idx) => {
          const titleLink = wrap.querySelector('a.title_link');
          const title = titleLink?.querySelector('span')?.textContent?.trim().slice(0, 50) || '(없음)';
          const small = wrap.querySelector('small');
          const desc = small?.textContent?.slice(0, 100) || '';
          const img = wrap.querySelector('img');
          const imgSrc = img?.getAttribute('src') || '(없음)';

          return {
            index: idx,
            title,
            hasDescription: !!small,
            descriptionSnippet: desc,
            hasImage: !!img,
            imageSrc: imgSrc.slice(0, 80)
          };
        })
      };
    });

    console.log(`📊 발견된 post_link_wrap 개수: ${postWraps.count}\n`);
    console.log(JSON.stringify(postWraps, null, 2));

    // 모든 a.title_link._fade_link 다시 확인
    const titleLinks = await page.evaluate(() => {
      const links = document.querySelectorAll('a.title_link._fade_link');
      return {
        count: links.length,
        items: Array.from(links).slice(0, 5).map(link => ({
          text: link.textContent?.trim().slice(0, 50),
          onclick: link.getAttribute('onclick')?.slice(0, 80)
        }))
      };
    });

    console.log(`\n📎 a.title_link._fade_link 개수: ${titleLinks.count}`);
    console.log(JSON.stringify(titleLinks, null, 2));

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

diagnoseWithScroll().catch(console.error);
