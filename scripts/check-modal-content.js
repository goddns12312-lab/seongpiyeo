#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const authPath = path.join(__dirname, 'playwright-auth.json');

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    console.log('🔍 모달 콘텐츠 상세 확인\n');

    const storageState = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();

    // 목록 페이지 로드
    const listUrl = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=1';
    await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // 게시글 클릭
    await page.click('li.tit a.title_link');

    // 다양한 시간 대기 후 모달 확인
    for (let wait = 1000; wait <= 5000; wait += 1000) {
      await page.waitForTimeout(wait);

      const modalInfo = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"]');
        if (!modal) return { found: false };

        const html = modal.innerHTML;
        const text = modal.innerText;
        const allText = modal.textContent;

        return {
          found: true,
          hasLoginForm: text.includes('로그인') || html.includes('login'),
          hasContent: text.length > 200,
          firstChars: text.substring(0, 200),
          htmlSnippet: html.substring(0, 300)
        };
      });

      if (modalInfo.found) {
        console.log(`⏱️  대기: ${wait}ms 후 모달 발견\n`);
        console.log('📋 모달 상태:');
        console.log('  로그인 폼 포함:', modalInfo.hasLoginForm);
        console.log('  콘텐츠 있음:', modalInfo.hasContent);
        console.log('\n📝 모달 텍스트 (처음 200자):');
        console.log(modalInfo.firstChars);
        console.log('\n💻 HTML 스니펫:');
        console.log(modalInfo.htmlSnippet);
        console.log('\n');
        break;
      } else {
        console.log(`⏳ ${wait}ms 대기 중 모달 없음`);
      }
    }

    await page.close();
    await context.close();

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
