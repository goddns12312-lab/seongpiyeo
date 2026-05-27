/**
 * 로그인 페이지 찾기
 */

const { chromium } = require('playwright');

async function find() {
  let browser;
  let page;

  try {
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();

    console.log('메인 페이지 접속');
    await page.goto('https://www.xn--3e0b036btifksj.com/', { waitUntil: 'networkidle', timeout: 30000 });

    // 모든 링크 찾기 (로그인 관련)
    const loginLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a, button')).map(el => ({
        href: el.getAttribute('href'),
        text: el.textContent?.trim().substring(0, 30),
      })).filter(el =>
        (el.text && (el.text.includes('로그인') || el.text.includes('회원') || el.text.includes('사용자'))) ||
        (el.href && el.href.includes('login'))
      );
    });

    console.log('\n=== 로그인 관련 링크 ===');
    loginLinks.forEach((link, idx) => {
      console.log(`${idx}: href="${link.href}" text="${link.text}"`);
    });

    // 모든 a 태그의 href 출력 (로그인 포함)
    const allLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href]')).map(a => a.getAttribute('href')).filter((href, idx, arr) => arr.indexOf(href) === idx).slice(0, 30);
    });

    console.log('\n=== 모든 고유 링크 (처음 30개) ===');
    allLinks.forEach(link => {
      console.log(link);
    });

  } catch (error) {
    console.error(`오류: ${error.message}`);
  } finally {
    setTimeout(async () => {
      if (page) await page.close();
      if (browser) await browser.close();
      process.exit(0);
    }, 60000);
  }
}

find();
