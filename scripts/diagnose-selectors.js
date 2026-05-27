#!/usr/bin/env node

const { chromium } = require('playwright');

async function diagnoseSelectors() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  try {
    const url = 'https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=8';

    console.log('🔍 페이지 8 진단 시작...\n');
    console.log(`📄 URL: ${url}\n`);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const results = await page.evaluate(() => {
      const output = {};

      // 1. 원래 셀렉터 테스트
      output['a.title_link._fade_link'] = {
        count: document.querySelectorAll('a.title_link._fade_link').length,
        samples: Array.from(document.querySelectorAll('a.title_link._fade_link')).slice(0, 2).map(el => ({
          text: el.textContent?.trim().slice(0, 50),
          classes: el.className
        }))
      };

      // 2. a.title_link만
      output['a.title_link'] = {
        count: document.querySelectorAll('a.title_link').length,
        samples: Array.from(document.querySelectorAll('a.title_link')).slice(0, 2).map(el => ({
          text: el.textContent?.trim().slice(0, 50),
          classes: el.className
        }))
      };

      // 3. a[onclick*="openLogin"] 체크
      output['a[onclick*="openLogin"]'] = {
        count: document.querySelectorAll('a[onclick*="openLogin"]').length,
        samples: Array.from(document.querySelectorAll('a[onclick*="openLogin"]')).slice(0, 2).map(el => ({
          text: el.textContent?.trim().slice(0, 50),
          onclick: el.getAttribute('onclick')?.slice(0, 80)
        }))
      };

      // 4. li > a 패턴
      output['li a'] = {
        count: document.querySelectorAll('li a').length,
        samples: Array.from(document.querySelectorAll('li a')).slice(0, 2).map(el => ({
          text: el.textContent?.trim().slice(0, 50),
          classes: el.className
        }))
      };

      // 5. a[data-idx] 체크
      output['a[data-idx]'] = {
        count: document.querySelectorAll('a[data-idx]').length
      };

      // 6. document.body 구조 샘플
      const titleLinks = Array.from(document.querySelectorAll('a')).filter(a =>
        a.textContent && a.textContent.length > 3 && !a.textContent.includes('공지')
      );

      output['all_title_like_anchors'] = {
        count: titleLinks.length,
        samples: titleLinks.slice(0, 3).map(el => ({
          text: el.textContent?.trim().slice(0, 50),
          classes: el.className,
          href: el.getAttribute('href')?.slice(0, 100)
        }))
      };

      // 7. 페이지 전체 span 체크 (span > 텍스트 패턴)
      output['span_in_a'] = {
        count: document.querySelectorAll('a span').length,
        samples: Array.from(document.querySelectorAll('a span')).slice(0, 2).map(el => ({
          text: el.textContent?.trim().slice(0, 50),
          parent_classes: el.parentElement?.className
        }))
      };

      return output;
    });

    console.log('📊 셀렉터 진단 결과:\n');
    for (const [selector, data] of Object.entries(results)) {
      console.log(`✅ ${selector}`);
      console.log(`   개수: ${data.count}`);
      if (data.samples && data.samples.length > 0) {
        console.log(`   샘플:`);
        data.samples.forEach((sample, i) => {
          console.log(`     [${i + 1}] ${JSON.stringify(sample, null, 2).split('\n').join('\n       ')}`);
        });
      }
      console.log();
    }

    // 페이지 HTML 구조 샘플 출력
    console.log('\n📄 페이지 HTML 구조 (board_list 부분):\n');
    const htmlSample = await page.evaluate(() => {
      const boardList = document.querySelector('.board_list') || document.querySelector('ul.list') || document.querySelector('table.board');
      if (boardList) {
        return boardList.outerHTML.slice(0, 1000);
      }
      return '찾을 수 없음';
    });
    console.log(htmlSample);

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

diagnoseSelectors().catch(console.error);
