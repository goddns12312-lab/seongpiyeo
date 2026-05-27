#!/usr/bin/env node

const { chromium } = require('playwright');

async function diagnoseGyeonggi() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  try {
    console.log('🔍 경기도 페이지별 진단 시작...\n');

    // 테스트할 페이지들 (0개로 나온 페이지와 매물이 있는 페이지)
    const testPages = [27, 26, 25, 20, 15, 10, 7, 6, 5, 1];
    const boardPath = '93';

    for (const pageNum of testPages) {
      const url = `https://www.xn--3e0b036btifksj.com/${boardPath}/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=${pageNum}`;

      console.log(`📄 페이지 ${pageNum} 확인 중...`);

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1000);

        // 스크롤
        const pageHeight = await page.evaluate(() => document.body.scrollHeight);
        for (let i = 0; i < pageHeight; i += 500) {
          await page.evaluate(scrollY => window.scrollBy(0, scrollY), 500);
          await page.waitForTimeout(50);
        }

        const result = await page.evaluate(() => {
          const wraps = document.querySelectorAll('span.post_link_wrap');
          const items = [];
          wraps.forEach(wrap => {
            const link = wrap.querySelector('a.title_link._fade_link');
            if (link) {
              const spans = link.querySelectorAll('span:not(.icons)');
              let title = '';
              spans.forEach(span => {
                const text = span.textContent?.trim();
                if (text && text.length > 0 && !text.includes('공지')) {
                  title = text;
                }
              });
              if (title) items.push(title.slice(0, 50));
            }
          });
          return items;
        });

        console.log(`  ✅ ${result.length}개 발견`);
        if (result.length > 0) {
          result.slice(0, 2).forEach(title => {
            console.log(`     - ${title}`);
          });
        }
      } catch (err) {
        console.log(`  ❌ 오류: ${err.message}`);
      }

      console.log();
    }

  } catch (error) {
    console.error('❌ 심각한 오류:', error.message);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

diagnoseGyeonggi().catch(console.error);
