#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

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
    log(`\n📍 ${region.name} 크롤링 시작...`);

    const child = spawn('node', [
      path.join(__dirname, 'run-scraper-region.js'),
      region.name,
      region.boardUrl
    ]);

    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });

    child.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    child.on('close', (code) => {
      if (code === 0) {
        log(`✅ ${region.name} 완료`);
      } else {
        log(`❌ ${region.name} 실패 (code: ${code})`);
      }
      resolve(code === 0);
    });
  });
}

async function main() {
  log('════════════════════════════════════════════════════════════════════════════════');
  log('🌍 전국 지역별 PC방 매물 크롤링');
  log('════════════════════════════════════════════════════════════════════════════════');
  log(`총 ${REGIONS.length}개 지역`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < REGIONS.length; i++) {
    const region = REGIONS[i];
    const success = await crawlRegion(region);

    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    if (i < REGIONS.length - 1) {
      log(`⏱️  다음 지역까지 2초 대기...`);
      await sleep(2000);
    }
  }

  log('\n════════════════════════════════════════════════════════════════════════════════');
  log('🎉 모든 지역 크롤링 완료');
  log('════════════════════════════════════════════════════════════════════════════════');
  log(`\n📊 결과:`);
  log(`   ✅ 성공: ${successCount}개 지역`);
  log(`   ❌ 실패: ${failCount}개 지역`);
  log(`\n📋 다음 단계:`);
  log(`   node scripts/import-validated.js`);

  process.exit(failCount > 0 ? 1 : 0);
}

main();
