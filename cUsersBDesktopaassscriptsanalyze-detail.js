/**
 * 상세 페이지 분석 - 한 개 매물 상세 페이지 구조 확인
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function analyze() {
  let browser;
  let page;

  try {
    console.log('분석 시작: 상세 페이지 구조');

    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();

    // 첫 번째 매물 링크 추출 (목록 페이지)
    const listUrl = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=1';
    await page.goto(listUrl, { waitUntil: 'networkidle', timeout: 30000 });

    const firstLink = await page.evaluate(() => {
      const link = document.querySelector('a[href*="/detail"]') || document.querySelector('table tbody tr td a');
      if (link) {
        return {
          href: link.getAttribute('href'),
          title: link.textContent?.trim()
        };
      }
      return null;
    });

    if (!firstLink) {
      console.log('목록에서 링크를 찾을 수 없음');
      return;
    }

    const detailUrl = firstLink.href.startsWith('http') ? firstLink.href : `https://www.xn--3e0b036btifksj.com${firstLink.href}`;
    console.log(`\n첫 번째 매물: ${firstLink.title}`);
    console.log(`상세 URL: ${detailUrl}\n`);

    // 상세 페이지 접속
    await page.goto(detailUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // HTML 저장
    const html = await page.content();
    fs.writeFileSync(
      path.join(__dirname, 'detail-page.html'),
      html,
      'utf-8'
    );
    console.log('HTML 저장됨: scripts/detail-page.html');

    // 텍스트 컨텐트
    const textContent = await page.textContent('body');
    console.log('\n=== 페이지 전체 텍스트 (처음 1000자) ===');
    console.log(textContent.substring(0, 1000));

    // 일반적인 필드 찾기
    const fields = {
      '권리금': null,
      '월세': null,
      '보증금': null,
      '면적': null,
      'PC개': null,
      '층': null,
      '가격': null,
      '이익': null,
      '매출': null,
    };

    for (const field of Object.keys(fields)) {
      const regex = new RegExp(`${field}[\s:]*([\d,]+)`, 'i');
      const match = textContent.match(regex);
      if (match) {
        fields[field] = match[1];
        console.log(`\n✓ ${field} 찾음: ${match[0]}`);
      }
    }

    // 모든 text 노드 찾기
    const allText = await page.evaluate(() => {
      const texts = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent.trim();
        if (text && text.length > 5 && text.length < 100) {
          texts.push(text);
        }
      }
      return texts.slice(0, 100);
    });

    console.log('\n=== 발견된 텍스트 노드 (처음 100개) ===');
    allText.forEach((text, idx) => {
      if (text.includes('원') || text.includes('개') || text.match(/\d/)) {
        console.log(`${idx}: ${text}`);
      }
    });

  } catch (error) {
    console.error(`오류: ${error.message}`);
  } finally {
    console.log('\n\n60초 후 종료됩니다...');
    setTimeout(async () => {
      if (page) await page.close();
      if (browser) await browser.close();
      console.log('종료됨');
      process.exit(0);
    }, 60000);
  }
}

analyze();
