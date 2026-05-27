#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const MISSING_REGIONS = [
  { name: '충북', boardUrl: 'https://www.xn--3e0b036btifksj.com/90/', pages: 9 },
  { name: '충남', boardUrl: 'https://www.xn--3e0b036btifksj.com/89/', pages: 9 },
  { name: '경북', boardUrl: 'https://www.xn--3e0b036btifksj.com/88/', pages: 9 }
];

function log(...args) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]`, ...args);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function crawlRegion(region) {
  return new Promise((resolve) => {
    log(`\n📍 ${region.name} 재크롤링...`);

    // run-scraper.js 사용 (더 정확함)
    const child = spawn('node', [
      path.join(__dirname, 'run-scraper.js'),
      '--adapter', 'pcbangkingdom',
      `--start-page=${region.pages}`,
      '--update'
    ], {
      env: { ...process.env, BOARD_URL: region.boardUrl }
    });

    child.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    child.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    child.on('close', (code) => {
      if (code === 0) {
        log(`✅ ${region.name} 완료`);
      } else {
        log(`⚠️  ${region.name} 진행 중...`);
      }
      resolve();
    });
  });
}

async function main() {
  log('════════════════════════════════════════════════════════════════════════════════');
  log('🔄 누락된 3개 지역 재크롤링');
  log('════════════════════════════════════════════════════════════════════════════════');

  for (const region of MISSING_REGIONS) {
    await crawlRegion(region);
    await sleep(2000);
  }

  log('\n✅ 재크롤링 완료!');
  process.exit(0);
}

main();
