#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function analyze() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const url = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=1';
    console.log('📍 Analyzing:', url);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // 테이블의 모든 행 분석
    const tableData = await page.evaluate(() => {
      const rows = [];
      const tableRows = document.querySelectorAll('tbody tr');

      tableRows.forEach((tr, rowIdx) => {
        if (rowIdx > 20) return; // 처음 20개만

        const cells = tr.querySelectorAll('td');
        const titleCell = cells[1]; // 2번째 셀이 제목
        const linkElem = titleCell?.querySelector('a');

        if (!linkElem) return;

        const title = linkElem.textContent.trim().substring(0, 50);
        const onclick = linkElem.getAttribute('onclick');
        let idx = null;

        // onclick에서 idx 추출
        if (onclick) {
          const match = onclick.match(/idx['\"]?\s*[:,=]\s*['\"]?(\d+)/i);
          if (match) idx = match[1];
        }

        rows.push({
          rowIdx,
          title,
          onclick: onclick?.substring(0, 100) || 'none',
          idx
        });
      });

      return rows;
    });

    console.log('\n=== TABLE ROWS ANALYSIS ===\n');
    console.log(JSON.stringify(tableData, null, 2));

    // 파일 저장
    const outputDir = path.join(__dirname, 'debug-output');
    fs.writeFileSync(
      path.join(outputDir, 'table-analysis.json'),
      JSON.stringify(tableData, null, 2)
    );

    console.log('\n✅ Analysis complete!');
    console.log('📄 Saved to: scripts/debug-output/table-analysis.json');

  } finally {
    await browser.close();
  }
}

analyze().catch(console.error);
