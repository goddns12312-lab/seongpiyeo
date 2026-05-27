#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const authPath = path.join(__dirname, 'playwright-auth.json');

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    console.log('🔍 상세 페이지 URL 및 구조 확인\n');

    const storageState = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();

    // 목록 페이지 로드
    const listUrl = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=1';
    console.log('📄 목록 페이지 URL:', listUrl);
    await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    console.log('현재 URL:', page.url());
    console.log('');

    // onclick 속성 확인
    const onclickInfo = await page.evaluate(() => {
      const titleLink = document.querySelector('li.tit a.title_link');
      if (!titleLink) return null;

      return {
        href: titleLink.getAttribute('href'),
        onclick: titleLink.getAttribute('onclick'),
        title: titleLink.innerText?.split('\n')[0]?.trim()
      };
    });

    console.log('첫 게시글 정보:');
    console.log('  제목:', onclickInfo.title);
    console.log('  href:', onclickInfo.href);
    console.log('  onclick:', onclickInfo.onclick?.substring(0, 100) + '...');
    console.log('');

    // 클릭하기 전 준비
    console.log('클릭 후 페이지 변화 확인...\n');

    // 링크 클릭
    await page.click('li.tit a.title_link');

    // 조금 기다리기
    await page.waitForTimeout(2000);

    console.log('클릭 후 URL:', page.url());
    console.log('');

    // 페이지 내용 확인
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        bodyLength: document.body.innerText.length,
        hasListings: document.body.innerText.includes('게시판 썸네일'),
        hasDetailContent: document.body.innerText.includes('매물업종'),
        h1Content: document.querySelector('h1')?.innerText,
        mainContent: document.querySelector('main')?.innerText?.substring(0, 200)
      };
    });

    console.log('페이지 내용:');
    console.log('  제목:', pageContent.title);
    console.log('  본문 길이:', pageContent.bodyLength);
    console.log('  목록 포함:', pageContent.hasListings);
    console.log('  상세 내용 포함:', pageContent.hasDetailContent);
    console.log('  H1 내용:', pageContent.h1Content);
    console.log('');

    // 모달 확인
    const modalInfo = await page.evaluate(() => {
      return {
        hasModal: !!document.querySelector('[role="dialog"]'),
        modalContent: document.querySelector('[role="dialog"]')?.innerText?.substring(0, 200),
        hasOverlay: !!document.querySelector('.modal-overlay, .overlay, [class*="modal"]')
      };
    });

    console.log('모달/팝업 확인:');
    console.log('  모달 있음:', modalInfo.hasModal);
    console.log('  오버레이 있음:', modalInfo.hasOverlay);

    await page.close();
    await context.close();

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
