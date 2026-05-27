#!/usr/bin/env node

const { chromium } = require('playwright');

async function diagnoseDetailed() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  try {
    const url = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=8';

    console.log('🔍 상세 진단 시작 (페이지 8)...\n');

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('✅ 페이지 로드 완료\n');

    const pageContent = await page.evaluate(() => {
      // 1. ul.list 아래의 모든 항목 찾기
      const listContainer = document.querySelector('ul.list');
      if (!listContainer) {
        return { error: 'ul.list를 찾을 수 없음' };
      }

      // 2. 모든 li 항목
      const allLis = listContainer.querySelectorAll('li.tit');
      console.log(`📌 발견된 li.tit 개수: ${allLis.length}`);

      // 3. 각 li의 구조 분석
      const items = [];
      allLis.forEach((li, idx) => {
        const titleLink = li.querySelector('a.title_link');
        if (!titleLink) return;

        const spans = titleLink.querySelectorAll('span');
        const title = Array.from(spans)
          .map(s => s.textContent.trim())
          .filter(t => t.length > 0 && !t.includes('\n'))
          .join(' ');

        const hasNotice = titleLink.querySelector('em.sticker.notice');
        const onclick = titleLink.getAttribute('onclick') || '';

        items.push({
          index: idx,
          title: title.slice(0, 100),
          hasNotice: !!hasNotice,
          onclikExists: onclick.length > 0,
          onclickSnippet: onclick.slice(0, 100)
        });
      });

      return {
        totalLiItems: allLis.length,
        items: items
      };
    });

    console.log(JSON.stringify(pageContent, null, 2));

    // 4. 직접 시각적으로 첫 번째 항목 체크
    console.log('\n🔍 첫 번째 li 항목의 전체 HTML:\n');
    const firstLiHtml = await page.locator('ul.list li.tit').first().evaluate(el => el.outerHTML);
    console.log(firstLiHtml.slice(0, 2000));

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

diagnoseDetailed().catch(console.error);
