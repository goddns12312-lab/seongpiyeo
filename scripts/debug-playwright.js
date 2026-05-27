#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function debug() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const url = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=1';
    console.log('Navigating to:', url);

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // 페이지의 HTML 구조 출력
    const html = await page.content();

    // 처음 5000자만 출력
    console.log('\n=== PAGE HTML (first 5000 chars) ===\n');
    console.log(html.substring(0, 5000));

    // 모든 <a> 태그 추출
    const allLinks = await page.locator('a').all();
    console.log(`\n\n=== FOUND ${allLinks.length} <a> TAGS ===\n`);

    const linkData = await page.evaluate(() => {
      const links = [];
      document.querySelectorAll('a').forEach((a, idx) => {
        if (idx < 20) {
          links.push({
            idx,
            textContent: a.textContent.substring(0, 50),
            href: a.href,
            onclick: a.onclick?.toString().substring(0, 100),
            className: a.className,
            id: a.id,
            getAttribute_onclick: a.getAttribute('onclick')?.substring(0, 100)
          });
        }
      });
      return links;
    });

    console.log(JSON.stringify(linkData, null, 2));

    // 파일에 저장
    const outputDir = path.join(__dirname, 'debug-output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    fs.writeFileSync(
      path.join(outputDir, 'page-html.txt'),
      html
    );

    fs.writeFileSync(
      path.join(outputDir, 'links-analysis.json'),
      JSON.stringify(linkData, null, 2)
    );

    console.log('\n✅ Debug complete!');
    console.log('📄 Results saved to: scripts/debug-output/');

  } finally {
    await browser.close();
  }
}

debug().catch(console.error);
