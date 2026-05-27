#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const authPath = path.join(__dirname, 'playwright-auth.json');

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    console.log('📊 게시물 페이지 구조 분석 중...\n');

    const storageState = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();

    // 서울 페이지 1
    const listUrl = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=1';
    await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // 첫 게시글 링크 추출
    const firstPostHref = await page.evaluate(() => {
      const link = document.querySelector('a.title_link._fade_link');
      let href = link?.getAttribute('href');
      const onclick = link?.getAttribute('onclick');

      if (href === 'javascript:;' && onclick) {
        const match = onclick.match(/openLogin\('([^']+)'/);
        if (match && match[1]) {
          const urlDecoded = decodeURIComponent(match[1]);
          href = atob(urlDecoded);
        }
      }
      return href;
    });

    if (!firstPostHref) {
      console.log('❌ 게시글을 찾을 수 없습니다');
      return;
    }

    const detailUrl = 'https://www.xn--3e0b036btifksj.com' + firstPostHref;
    console.log('상세 페이지 URL:', detailUrl);
    console.log('로드 중...\n');

    await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // 페이지 구조 분석
    const analysis = await page.evaluate(() => {
      return {
        // 모든 이미지 분석
        allImages: Array.from(document.querySelectorAll('img')).map((img, idx) => ({
          idx,
          src: img.src,
          alt: img.alt,
          class: img.className,
          width: img.width,
          height: img.height,
          parentTag: img.parentElement?.tagName,
          parentClass: img.parentElement?.className
        })),

        // 텍스트 컨텐츠
        bodyText: document.body.innerText.substring(0, 2000),

        // 주요 컨테이너들
        containers: {
          mainContent: document.querySelector('main')?.className,
          contentDiv: document.querySelector('[class*="content"]')?.className,
          imageGallery: document.querySelector('[class*="gallery"]')?.className || document.querySelector('[class*="image"]')?.className,
        },

        // 테이블 데이터
        tables: Array.from(document.querySelectorAll('table')).map(table => ({
          rows: table.rows.length,
          content: Array.from(table.rows).map(row =>
            Array.from(row.cells).map(cell => cell.innerText)
          )
        }))
      };
    });

    // 결과 출력
    console.log('📸 이미지 목록 (' + analysis.allImages.length + '개):');
    analysis.allImages.forEach((img, i) => {
      if (img.src.includes('cdn.imweb.me')) {
        console.log(`  [${i}] ${img.src.substring(0, 80)}...`);
        console.log(`      크기: ${img.width}x${img.height}, 부모: ${img.parentTag} (${img.parentClass})`);
      }
    });

    console.log('\n📝 텍스트 샘플 (처음 500자):');
    console.log(analysis.bodyText.substring(0, 500));

    console.log('\n📋 테이블 데이터:');
    analysis.tables.forEach((table, idx) => {
      console.log(`  테이블 ${idx + 1}: ${table.rows}행`);
      table.content.forEach(row => {
        console.log(`    ${row.join(' | ')}`);
      });
    });

    await page.close();
    await context.close();

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
