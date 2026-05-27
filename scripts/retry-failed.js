#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  baseUrl: 'https://www.xn--3e0b036btifksj.com',
  boardUrl: 'https://www.xn--3e0b036btifksj.com/40/',
  authFile: path.join(__dirname, 'playwright-auth.json'),
  listingsFile: path.join(__dirname, 'output', 'listings.json'),
  failedLogFile: path.join(__dirname, 'output', 'failed.log'),
  retryLogFile: path.join(__dirname, 'output', 'retry.log'),
  delayMin: 1500,
  delayMax: 3000,
  retryCount: 3,
  retryDelay: 1000
};

function log(...args) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]`, ...args);
}

function getRandomDelay() {
  return Math.floor(Math.random() * (CONFIG.delayMax - CONFIG.delayMin + 1)) + CONFIG.delayMin;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseFailedLog() {
  if (!fs.existsSync(CONFIG.failedLogFile)) {
    log('❌ failed.log이 없습니다');
    return [];
  }

  const failedLog = fs.readFileSync(CONFIG.failedLogFile, 'utf-8');
  const lines = failedLog.split('\n').filter(l => l.trim());

  // 재시도 가능한 것 (네트워크 오류)만 추출
  const retryableItems = [];
  lines.forEach(line => {
    if (line.includes('page_load_failed') || line.includes('timeout')) {
      const idxMatch = line.match(/idx=(\d+)/);
      if (idxMatch) {
        retryableItems.push({
          idx: idxMatch[1],
          line: line
        });
      }
    }
  });

  return retryableItems;
}

async function retryFailedItems() {
  log('═'.repeat(80));
  log('🔄 실패한 항목 재시도 시작');
  log('═'.repeat(80));

  const retryableItems = parseFailedLog();

  if (retryableItems.length === 0) {
    log('✅ 재시도할 항목이 없습니다');
    return;
  }

  log(`\n📋 재시도 대상: ${retryableItems.length}개\n`);

  // listings.json에서 재시도 대상 매물의 URL 찾기
  let listings = [];
  try {
    listings = JSON.parse(fs.readFileSync(CONFIG.listingsFile, 'utf-8'));
  } catch (err) {
    log(`❌ listings.json 로드 실패: ${err.message}`);
    return;
  }

  const listingsByIdx = new Map();
  listings.forEach(l => listingsByIdx.set(l.idx, l));

  // 재시도할 URL 수집
  const urlsToRetry = [];
  retryableItems.forEach(item => {
    const listing = listingsByIdx.get(item.idx);
    if (listing && listing.detail_url) {
      urlsToRetry.push({
        idx: item.idx,
        title: listing.title,
        url: listing.detail_url
      });
    }
  });

  log(`\n🔗 재시도 가능 URL: ${urlsToRetry.length}개\n`);

  if (!fs.existsSync(CONFIG.authFile)) {
    log('❌ playwright-auth.json을 찾을 수 없습니다');
    return;
  }

  const browser = await chromium.launch({ headless: true });

  try {
    const storageState = JSON.parse(fs.readFileSync(CONFIG.authFile, 'utf-8'));
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();

    let successCount = 0;
    let failCount = 0;
    const retryLog = fs.createWriteStream(CONFIG.retryLogFile, { flags: 'a' });

    for (let i = 0; i < urlsToRetry.length; i++) {
      const item = urlsToRetry[i];
      log(`[${i + 1}/${urlsToRetry.length}] ${item.title.substring(0, 50)}`);

      try {
        await page.goto(item.url, { waitUntil: 'networkidle', timeout: 20000 });
        log(`  ✅ 성공: idx=${item.idx}`);
        retryLog.write(`${new Date().toISOString()} | SUCCESS | idx=${item.idx} | ${item.title}\n`);
        successCount++;
      } catch (error) {
        log(`  ❌ 실패: ${error.message}`);
        retryLog.write(`${new Date().toISOString()} | FAILED | idx=${item.idx} | ${error.message}\n`);
        failCount++;
      }

      if (i < urlsToRetry.length - 1) {
        await sleep(getRandomDelay());
      }
    }

    retryLog.end();

    log('\n' + '═'.repeat(80));
    log('📊 재시도 결과:');
    log('═'.repeat(80));
    log(`✅ 성공: ${successCount}개`);
    log(`❌ 실패: ${failCount}개`);
    log(`📁 로그: ${CONFIG.retryLogFile}`);

    await context.close();

  } catch (error) {
    log(`❌ 오류: ${error.message}`);
  } finally {
    await browser.close();
  }
}

retryFailedItems().catch(err => {
  log(`❌ 오류: ${err.message}`);
  process.exit(1);
});
