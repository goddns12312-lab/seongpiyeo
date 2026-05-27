#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function diagnoseDetailContent() {
  const browser = await chromium.launch({ headless: true });

  let storageState = null;
  const authPath = path.join(__dirname, 'playwright-auth.json');
  if (fs.existsSync(authPath)) {
    storageState = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
  }

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    storageState: storageState
  });

  const page = await context.newPage();

  try {
    // 목록 페이지 방문
    const listUrl = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=1';

    console.log('📄 목록 페이지 방문\n');
    await page.goto(listUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // 첫 번째 게시글의 onclick 추출
    const postData = await page.evaluate(() => {
      const wrap = document.querySelector('span.post_link_wrap');
      if (!wrap) {
        return { error: 'post_link_wrap not found' };
      }

      const link = wrap.querySelector('a.title_link._fade_link');
      if (!link) {
        return { error: 'title_link not found', wrappHTML: wrap.outerHTML.slice(0, 300) };
      }

      const onclick = link.getAttribute('onclick');
      const title = link.querySelector('span')?.textContent?.trim();
      const href = link.getAttribute('href');

      return {
        title,
        onclick,
        href,
        linkHTML: link.outerHTML.slice(0, 300)
      };
    });

    if (!postData) {
      console.log('❌ 게시글을 찾을 수 없습니다');
      return;
    }

    if (postData.error) {
      console.log('❌ 오류:', postData.error);
      console.log('HTML:', postData.linkHTML || postData.wrappHTML);
      return;
    }

    console.log('첫 게시글:', postData.title);
    console.log('onclick:', postData.onclick ? postData.onclick.slice(0, 150) + '...' : '(없음)');
    console.log('href:', postData.href);
    console.log();

    if (!postData.onclick) {
      console.log('❌ onclick 속성이 없습니다');
      console.log('Link HTML:', postData.linkHTML);
      return;
    }

    // onclick에서 URL 추출
    const match = postData.onclick.match(/openLogin\('([^']+)'/);
    if (match && match[1]) {
      const urlDecoded = decodeURIComponent(match[1]);
      const decodedPath = Buffer.from(urlDecoded, 'base64').toString('utf-8');
      const detailUrl = `https://www.xn--3e0b036btifksj.com${decodedPath}`;

      console.log('추출된 상세페이지 URL:', detailUrl.slice(0, 100) + '...\n');

      // 상세 페이지 방문
      await page.goto(detailUrl, { waitUntil: 'networkidle', timeout: 30000 });

      // 페이지 내용 분석
      const pageContent = await page.evaluate(() => {
        return {
          title: document.title,
          bodyTextLength: document.body.innerText.length,
          firstLines: document.body.innerText.split('\n').slice(0, 30),
          h1: document.querySelector('h1')?.textContent?.trim(),
          h2: document.querySelector('h2')?.textContent?.trim(),
          h3: document.querySelector('h3')?.textContent?.trim(),
          tables: document.querySelectorAll('table').length,
          forms: document.querySelectorAll('form').length,
          divs: document.querySelectorAll('[class*="info"], [class*="detail"], [class*="item"]').length,
          htmlSample: document.body.innerHTML.slice(0, 500)
        };
      });

      console.log('📊 상세페이지 분석:');
      console.log('Page title:', pageContent.title);
      console.log('H1:', pageContent.h1);
      console.log('Tables:', pageContent.tables);
      console.log('Forms:', pageContent.forms);
      console.log('Info divs:', pageContent.divs);
      console.log('\nFirst 30 lines of body text:');
      pageContent.firstLines.forEach((line, i) => {
        if (line.trim()) console.log(`  ${i}: ${line.trim().slice(0, 80)}`);
      });
    }

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

diagnoseDetailContent().catch(console.error);
