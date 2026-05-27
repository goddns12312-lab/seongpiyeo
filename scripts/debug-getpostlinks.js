#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { chromium } = require('playwright');
const PcbangkingdomAdapter = require('./adapters/pcbangkingdom-adapter');

async function debugGetPostLinks() {
  console.log('🔍 getPostLinks() 디버깅\n');

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const adapter = new PcbangkingdomAdapter();

    // Setup
    const page = await adapter.setup(browser);

    // Navigate to list page (page 1)
    await adapter.navigateToPage(page, 1);

    console.log('✅ 목록 페이지 로드 완료\n');

    // Get post links
    const links = await adapter.getPostLinks(page, 1);

    console.log(`📋 추출된 링크 수: ${links.length}\n`);

    // Display first 5 items
    console.log('첫 5개 항목:');
    console.log('═'.repeat(80));

    for (let i = 0; i < Math.min(5, links.length); i++) {
      const link = links[i];
      console.log(`\n[${i + 1}] idx: ${link.idx}`);
      console.log(`    title: "${link.title}"`);
      console.log(`    href: ${link.href.substring(0, 80)}...`);
    }

    console.log('\n═'.repeat(80));

    // Find idx 171322689
    const target = links.find(l => l.idx === '171322689');
    if (target) {
      console.log(`\n✅ idx=171322689 찾음:`);
      console.log(`   title: "${target.title}"`);
    } else {
      console.log(`\n❌ idx=171322689를 목록에서 찾지 못함`);
    }

    // Also check raw HTML structure
    console.log('\n🔍 목록 페이지의 raw link 요소 분석:');
    const linkData = await page.evaluate(() => {
      const firstLink = document.querySelector('.title_link._fade_link');
      if (!firstLink) return { found: false };

      return {
        found: true,
        innerText: firstLink.innerText,
        innerHTML: firstLink.innerHTML.substring(0, 200),
        textContent: firstLink.textContent
      };
    });

    if (linkData.found) {
      console.log(`   innerText: "${linkData.innerText.substring(0, 100)}..."`);
      console.log(`   textContent: "${linkData.textContent.substring(0, 100)}..."`);
      console.log(`   innerHTML: ${linkData.innerHTML}`);
    }

    await page.context().close();
  } catch (error) {
    console.error(`❌ 오류: ${error.message}`);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

debugGetPostLinks();
