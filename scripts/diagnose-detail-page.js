#!/usr/bin/env node

const { chromium } = require('playwright');

async function diagnoseDetailPage() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  try {
    // 목록 페이지에서 실제 게시글 링크 찾기
    const listUrl = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=1';

    console.log('📄 목록 페이지에서 상세 링크 추출\n');
    await page.goto(listUrl, { waitUntil: 'networkidle', timeout: 30000 });

    const detailLink = await page.evaluate(() => {
      const wrap = document.querySelector('span.post_link_wrap');
      if (!wrap) return null;

      const link = wrap.querySelector('a.title_link._fade_link');
      if (!link) return null;

      // href 속성 확인
      const href = link.getAttribute('href');

      // onclick 속성 확인
      const onclick = link.getAttribute('onclick');

      return { href, onclick: onclick?.slice(0, 100) };
    });

    console.log('✅ 추출된 링크:');
    console.log(JSON.stringify(detailLink, null, 2));

    if (detailLink?.href && detailLink.href !== 'javascript:;') {
      const detailUrl = 'https://www.xn--3e0b036btifksj.com' + detailLink.href;
      console.log(`\n📍 상세 페이지 방문: ${detailUrl.slice(0, 100)}...\n`);

      await page.goto(detailUrl, { waitUntil: 'networkidle', timeout: 30000 });

      const detailInfo = await page.evaluate(() => {
        const info = {};

        // 제목
        info.title = document.querySelector('h1')?.textContent?.trim();

        // 이미지들
        const images = Array.from(document.querySelectorAll('img[src*="cdn.imweb"]'))
          .map(img => img.getAttribute('src'))
          .filter((src, idx, arr) => arr.indexOf(src) === idx);
        info.imageCount = images.length;
        info.imageSample = images[0];

        // 상세 정보 (테이블 또는 div)
        const detailText = document.body.innerText;
        const lines = detailText.split('\n').filter(l => l.includes('보증금') || l.includes('권리금') || l.includes('월세'));
        info.detailLines = lines.slice(0, 5);

        return info;
      });

      console.log('📊 상세 페이지 정보:');
      console.log(JSON.stringify(detailInfo, null, 2));
    }

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

diagnoseDetailPage().catch(console.error);
