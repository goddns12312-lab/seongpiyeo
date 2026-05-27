#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const authPath = path.join(__dirname, 'playwright-auth.json');

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    const storageState = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();

    const listUrl = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=1';
    console.log('페이지 로드 중...');
    await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // HTML 일부 저장
    const html = await page.content();
    fs.writeFileSync('page-structure.html', html);
    console.log('✅ page-structure.html 저장됨');

    // 주요 요소들 찾기
    const structure = await page.evaluate(() => {
      return {
        bodyHTML: document.body.innerHTML.substring(0, 2000),
        mainContent: document.querySelector('main')?.innerHTML.substring(0, 500),
        allLis: document.querySelectorAll('li').length,
        titleLinks: document.querySelectorAll('a.title_link').length,
        titleLinksSample: Array.from(document.querySelectorAll('a.title_link')).slice(0, 3).map(el => ({
          text: el.innerText,
          href: el.getAttribute('href'),
          parent: el.parentElement?.tagName + (el.parentElement?.className ? ` .${el.parentElement.className}` : '')
        }))
      };
    });

    console.log('\n📊 페이지 구조:');
    console.log('  LI 요소:', structure.allLis, '개');
    console.log('  title_link 요소:', structure.titleLinks, '개');
    console.log('\n📝 title_link 샘플:');
    structure.titleLinksSample.forEach((link, idx) => {
      console.log(`  [${idx}] ${link.text.substring(0, 50)}`);
      console.log(`       부모: ${link.parent}`);
    });

    console.log('\n💾 전체 HTML을 page-structure.html에 저장했습니다');
    console.log('    해당 파일을 브라우저에서 열어서 구조를 확인하세요');

    await page.close();
    await context.close();

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
