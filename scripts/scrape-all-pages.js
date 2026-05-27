#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const REGIONS = [
  { name: '서울', boardPath: '40', maxPage: 8 },
  { name: '경기도', boardPath: '93', maxPage: 27 },
  { name: '강원도', boardPath: '92', maxPage: 2 },
  { name: '인천', boardPath: '91', maxPage: 9 },
  { name: '충청북도', boardPath: '90', maxPage: 9 },
  { name: '충청남도', boardPath: '89', maxPage: 9 },
  { name: '경상북도', boardPath: '88', maxPage: 9 },
  { name: '경상남도', boardPath: '87', maxPage: 9 },
  { name: '전라북도', boardPath: '86', maxPage: 2 },
  { name: '전라남도', boardPath: '85', maxPage: 4 },
  { name: '제주도', boardPath: '84', maxPage: 1 },
];

async function scrapeRegion(browser, region) {
  const allListings = [];

  // Context는 지역별로 한 번만 생성 (세션 유지)
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  // 마지막 페이지부터 1까지 역순으로 크롤링
  for (let pageNum = region.maxPage; pageNum >= 1; pageNum--) {
    const url = `https://www.xn--3e0b036btifksj.com/${region.boardPath}/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=${pageNum}`;

    const page = await context.newPage();

    try {
      console.log(`📍 [${region.name}] 페이지 ${pageNum}/${region.maxPage} 크롤링...`);

      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // 스크롤로 모든 콘텐츠 로드
      const pageHeight = await page.evaluate(() => document.body.scrollHeight);
      for (let i = 0; i < pageHeight; i += 500) {
        await page.evaluate(scrollY => window.scrollBy(0, scrollY), 500);
        await page.waitForTimeout(50);
      }

      const listings = await page.evaluate(() => {
        const items = [];
        // span.post_link_wrap 기반으로 각 게시글 추출
        const postWraps = document.querySelectorAll('span.post_link_wrap');

        postWraps.forEach((wrap) => {
          const link = wrap.querySelector('a.title_link._fade_link');
          if (!link) return;

          const onclick = link.getAttribute('onclick');
          if (!onclick) return;

          // span 태그들에서 제목 추출 (공지 태그는 제외)
          const spans = link.querySelectorAll('span:not(.icons)');
          let title = '';
          spans.forEach(span => {
            const text = span.textContent?.trim();
            if (text && text.length > 0 && !text.includes('공지')) {
              title = text;
            }
          });

          // 이미지 추출
          let imageUrl = null;
          const img = wrap.querySelector('img');
          if (img) {
            imageUrl = img.getAttribute('src');
          }

          // 설명 추출 (small 태그)
          let description = '';
          const small = wrap.querySelector('small');
          if (small) {
            description = small.textContent?.trim() || '';
          }

          if (title && title.length > 0) {
            let decodedUrl = null;
            const urlMatch = onclick.match(/openLogin\('([^']+)'/);
            if (urlMatch) {
              try {
                decodedUrl = decodeURIComponent(atob(urlMatch[1]));
              } catch (e) {}
            }

            items.push({
              title,
              imageUrl: imageUrl || null,
              decodedUrl: decodedUrl || null,
              description: description || null
            });
          }
        });

        return items;
      });

      console.log(`  ✅ ${listings.length}개 발견`);
      allListings.push(...listings.map(l => ({ ...l, region: region.name })));

      await page.close();

      // 페이지 간 딜레이 최소화
      if (pageNum > 1) {
        const delay = 500 + Math.random() * 500;
        await new Promise(r => setTimeout(r, delay));
      }

    } catch (error) {
      console.error(`❌ 페이지 ${pageNum} 오류:`, error.message);
      await page.close();
    }
  }

  await context.close();
  return allListings;
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    console.log('🚀 지역별 전체 매물 크롤링 시작\n');

    const allListings = [];

    for (const region of REGIONS) {
      const listings = await scrapeRegion(browser, region);
      allListings.push(...listings);
      console.log(`\n📊 [${region.name}] 완료: ${listings.length}개\n`);

      // 지역 간 딜레이 최소화
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 500));
    }

    console.log(`\n✅ 총 ${allListings.length}개 매물 수집됨`);

    // 결과 저장
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    fs.writeFileSync(
      path.join(outputDir, 'all-listings.json'),
      JSON.stringify(allListings, null, 2)
    );

    console.log('📄 저장: scripts/output/all-listings.json');

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
