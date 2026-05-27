#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function scrapeDetailPages() {
  const browser = await chromium.launch({ headless: true });

  // 기존 인증 세션 로드
  let storageState = null;
  const authPath = path.join(__dirname, 'playwright-auth.json');
  if (fs.existsSync(authPath)) {
    storageState = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
    console.log('✅ 인증 세션 로드됨\n');
  }

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    storageState: storageState
  });

  const page = await context.newPage();

  try {
    // 목록 페이지에서 게시글 정보 추출
    const listUrl = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=1';

    console.log('📄 목록 페이지에서 게시글 정보 추출 중...\n');
    await page.goto(listUrl, { waitUntil: 'networkidle', timeout: 30000 });

    const postData = await page.evaluate(() => {
      const posts = [];
      const wraps = document.querySelectorAll('span.post_link_wrap');

      wraps.forEach(wrap => {
        try {
          // 제목
          const titleEl = wrap.querySelector('a.title_link');
          const title = titleEl?.querySelector('span')?.textContent?.trim();

          if (!title || title.includes('공지')) return;

          // 이미지
          const img = wrap.querySelector('img.board_thumb');
          const imageUrl = img?.getAttribute('src');

          // 설명
          const desc = wrap.querySelector('small')?.textContent?.trim();

          // onclick에서 idx 추출
          const onclick = titleEl?.getAttribute('onclick');
          let postIdx = null;

          if (onclick && onclick.includes('&idx=')) {
            const match = onclick.match(/&idx=(\d+)/);
            if (match) postIdx = match[1];
          }

          posts.push({
            title,
            imageUrl: imageUrl || null,
            description: desc || null,
            postIdx: postIdx,
            onclick: onclick?.slice(0, 100)
          });
        } catch (e) {}
      });

      return posts;
    });

    console.log(`발견된 게시글: ${postData.length}개\n`);
    postData.slice(0, 3).forEach((post, i) => {
      console.log(`[${i+1}] ${post.title}`);
      console.log(`    idx: ${post.postIdx}`);
      console.log(`    desc: ${post.description?.slice(0, 50) || '(없음)'}...`);
      console.log();
    });

    // 게시글 상세 정보를 얻기 위해 작은 iframe 또는 모달이 있는지 확인
    console.log('🔍 페이지 구조 분석\n');
    const pageInfo = await page.evaluate(() => {
      return {
        hasIframe: !!document.querySelector('iframe'),
        hasModal: !!document.querySelector('.modal'),
        hasDialog: !!document.querySelector('dialog'),
        bodyText: document.body.innerText.slice(0, 200)
      };
    });

    console.log('페이지 구조:');
    console.log(JSON.stringify(pageInfo, null, 2));

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

scrapeDetailPages().catch(console.error);
