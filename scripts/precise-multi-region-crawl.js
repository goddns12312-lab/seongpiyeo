#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// 사용자가 제공한 정확한 지역별 링크 정보
const REGIONS = [
  { name: '서울', boardUrl: 'https://www.xn--3e0b036btifksj.com/40/', pages: 8 },
  { name: '경기', boardUrl: 'https://www.xn--3e0b036btifksj.com/93/', pages: 27 },
  { name: '강원', boardUrl: 'https://www.xn--3e0b036btifksj.com/92/', pages: 2 },
  { name: '인천', boardUrl: 'https://www.xn--3e0b036btifksj.com/91/', pages: 9 },
  { name: '충북', boardUrl: 'https://www.xn--3e0b036btifksj.com/90/', pages: 9 },
  { name: '충남', boardUrl: 'https://www.xn--3e0b036btifksj.com/89/', pages: 9 },
  { name: '경북', boardUrl: 'https://www.xn--3e0b036btifksj.com/88/', pages: 9 },
  { name: '경남', boardUrl: 'https://www.xn--3e0b036btifksj.com/87/', pages: 9 },
  { name: '전북', boardUrl: 'https://www.xn--3e0b036btifksj.com/86/', pages: 2 },
  { name: '전남', boardUrl: 'https://www.xn--3e0b036btifksj.com/85/', pages: 5 },
  { name: '제주', boardUrl: 'https://www.xn--3e0b036btifksj.com/84/', pages: 1 }
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
    log(`\n📍 ${region.name} 크롤링 (${region.pages}페이지)...`);

    const env = { ...process.env, BOARD_URL: region.boardUrl };

    const child = spawn('node', [
      path.join(__dirname, 'run-scraper.js'),
      '--adapter', 'pcbangkingdom',
      `--start-page=${region.pages}`,
      '--update'
    ], { env, stdio: 'inherit' });

    child.on('close', (code) => {
      if (code === 0) {
        log(`✅ ${region.name} 완료`);
      } else {
        log(`❌ ${region.name} 실패`);
      }
      resolve(code === 0);
    });
  });
}

async function main() {
  log('════════════════════════════════════════════════════════════════════════════════');
  log('🌍 전국 지역별 정확 크롤링');
  log('════════════════════════════════════════════════════════════════════════════════');
  log(`\n총 ${REGIONS.length}개 지역 순차 크롤링\n`);

  let successCount = 0;

  for (let i = 0; i < REGIONS.length; i++) {
    const region = REGIONS[i];
    const success = await crawlRegion(region);
    if (success) successCount++;

    if (i < REGIONS.length - 1) {
      log(`⏱️  3초 대기...`);
      await sleep(3000);
    }
  }

  log('\n════════════════════════════════════════════════════════════════════════════════');
  log('🎉 모든 지역 크롤링 완료');
  log('════════════════════════════════════════════════════════════════════════════════');
  log(`\n✅ 성공: ${successCount}/${REGIONS.length}개 지역`);
  log(`\n다음 단계:`);
  log(`  1. Supabase SQL 실행:`);
  log(`     ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_business_license_check;`);
  log(`  2. 임포트 실행:`);
  log(`     node scripts/import-validated.js\n`);

  process.exit(successCount === REGIONS.length ? 0 : 1);
}

main();
