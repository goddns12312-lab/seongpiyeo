/**
 * 로그인 페이지 분석
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function analyze() {
  let browser;
  let page;

  try {
    console.log('로그인 페이지 분석 시작');

    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();

    const url = 'https://www.xn--3e0b036btifksj.com/user/login';
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    const html = await page.content();
    fs.writeFileSync(
      path.join(__dirname, 'login-page.html'),
      html,
      'utf-8'
    );
    console.log('HTML 저장됨: scripts/login-page.html');

    // 모든 input 찾기
    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input')).map((inp, idx) => ({
        idx,
        type: inp.getAttribute('type'),
        name: inp.getAttribute('name'),
        id: inp.getAttribute('id'),
        placeholder: inp.getAttribute('placeholder'),
      }));
    });

    console.log('\n=== 발견된 입력 필드 ===');
    inputs.forEach(inp => {
      console.log(`${inp.idx}: type=${inp.type}, name=${inp.name}, id=${inp.id}, placeholder=${inp.placeholder}`);
    });

    // 모든 버튼 찾기
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button, input[type="submit"], a[onclick*="login"]')).map((btn, idx) => ({
        idx,
        type: btn.tagName,
        text: btn.textContent?.trim().substring(0, 50),
        id: btn.getAttribute('id'),
        class: btn.getAttribute('class')?.substring(0, 50),
        onclick: btn.getAttribute('onclick')?.substring(0, 50),
      }));
    });

    console.log('\n=== 발견된 버튼 ===');
    buttons.forEach(btn => {
      console.log(`${btn.idx}: ${btn.type} text="${btn.text}" id="${btn.id}"`);
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
