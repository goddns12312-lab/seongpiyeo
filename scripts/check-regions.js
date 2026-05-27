#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'output', 'all-listings.json');
const listings = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

// 지역별 그룹화
const byRegion = {};
listings.forEach(l => {
  if (!byRegion[l.region]) byRegion[l.region] = [];
  byRegion[l.region].push(l);
});

console.log('\n📊 지역별 매물 현황\n');
console.log('지역\t\t매물수\t샘플');
console.log('─'.repeat(70));

Object.entries(byRegion)
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([region, items]) => {
    const sample = items[0]?.title?.slice(0, 40) || '(없음)';
    console.log(`${region}\t\t${items.length}개\t${sample}`);
  });

console.log('─'.repeat(70));
console.log(`\n✅ 총 ${listings.length}개 매물\n`);
