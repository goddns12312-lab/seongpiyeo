#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { chromium } = require('playwright');

const IDX = '171322689';
const DETAIL_URL = `https://www.xn--3e0b036btifksj.com/40/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&bmode=view&idx=${IDX}&t=board`;
const AUTH_FILE = path.join(__dirname, 'playwright-auth.json');

async function debugDescription() {
  console.log('📍 Step 1: idx 확인');
  console.log(`   idx: ${IDX}`);

  console.log('\n📍 Step 2: 원본 상세페이지 접속');
  console.log(`   URL: ${DETAIL_URL}`);

  let browser;
  try {
    browser = await chromium.launch({ headless: true });

    // 저장된 세션 로드
    if (!fs.existsSync(AUTH_FILE)) {
      throw new Error(`인증 파일 없음: ${AUTH_FILE}`);
    }

    const storageState = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();

    // 페이지 접속
    await page.goto(DETAIL_URL, { waitUntil: 'networkidle', timeout: 30000 });

    console.log('   ✅ 페이지 로드 완료');

    // Step 3: 전체 innerText 캡처
    console.log('\n📍 Step 3: 본문 컨테이너의 전체 innerText 캡처');

    const fullText = await page.evaluate(() => document.body.innerText);
    const debugPath = path.join(__dirname, 'output', 'debug_fulltext.txt');
    fs.writeFileSync(debugPath, fullText, 'utf-8');
    console.log(`   ✅ 저장 완료: ${debugPath}`);
    console.log(`   전체 길이: ${fullText.length} 글자\n`);

    // Step 4: 분석
    console.log('📍 Step 4: 저장된 텍스트 분석');

    const lines = fullText.split('\n');

    // 1~12번 항목 확인
    const itemPattern = /^(\d+)\.\s*(.+?)(?:\s*[:：]|$)/;
    let foundItems = new Set();
    let itemStartIndex = -1;
    let itemEndIndex = -1;
    let hasItemText = '';

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      const match = trimmed.match(itemPattern);
      if (match) {
        const itemNum = parseInt(match[1]);
        if (itemNum >= 1 && itemNum <= 12) {
          foundItems.add(itemNum);
          if (itemStartIndex === -1) itemStartIndex = i;
          itemEndIndex = i;
          hasItemText += `   Line ${i}: [${itemNum}번] ${trimmed.substring(0, 80)}\n`;
        }
      }
    }

    console.log(`   발견된 항목: ${Array.from(foundItems).sort((a,b) => a-b).join(', ')}`);
    if (foundItems.size < 12) {
      console.log(`   ⚠️  누락된 항목: ${Array.from({length: 12}, (_, i) => i+1).filter(n => !foundItems.has(n)).join(', ')}`);
    }
    console.log('\n   발견된 항목 상세:');
    console.log(hasItemText);

    // "매장 사진이 있으면 꼭" 찾기
    console.log('   사이트 공지문 확인:');
    let hasNotice = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('매장 사진이 있으면 꼭')) {
        console.log(`   ✅ "매장 사진이 있으면 꼭" 발견 (Line ${i})`);
        hasNotice = true;
        break;
      }
    }
    if (!hasNotice) {
      console.log('   ❌ "매장 사진이 있으면 꼭" 미발견');
    }

    // 12번 항목 이후 자유글 찾기
    console.log('\n   12번 항목 이후 컨텐츠 확인:');
    if (itemEndIndex >= 0) {
      let freeformStartIndex = -1;
      for (let i = itemEndIndex + 1; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed && !trimmed.match(/^\d+\.\s*/)) {
          // 숫자로 시작하지 않는 줄 찾기
          freeformStartIndex = i;
          break;
        }
      }

      if (freeformStartIndex >= 0) {
        console.log(`   ✅ 자유글 발견 (Line ${freeformStartIndex}부터):`);
        for (let i = freeformStartIndex; i < Math.min(freeformStartIndex + 10, lines.length); i++) {
          if (lines[i].trim()) {
            console.log(`      Line ${i}: ${lines[i].substring(0, 100)}`);
          }
        }
      } else {
        console.log('   ❌ 12번 항목 이후 자유글 미발견');
      }
    }

    // Step 5: 현재 DB의 description과 비교
    console.log('\n📍 Step 5: DB 저장값과 비교');
    const listings = JSON.parse(fs.readFileSync(path.join(__dirname, 'output', 'listings.json'), 'utf-8'));
    const currentListing = listings.find(l => l.idx === IDX);

    if (currentListing) {
      const dbDesc = currentListing.description;
      const dbLines = dbDesc.split('\n');

      console.log(`   DB description 길이: ${dbDesc.length} 글자`);
      console.log(`   원본 innerText 길이: ${fullText.length} 글자`);
      console.log(`   차이: ${fullText.length - dbDesc.length} 글자`);

      console.log('\n   DB에 저장된 마지막 10줄:');
      for (let i = Math.max(0, dbLines.length - 10); i < dbLines.length; i++) {
        const line = dbLines[i];
        if (line.trim()) {
          console.log(`      Line ${i}: ${line.substring(0, 100)}`);
        }
      }

      console.log('\n   원본에서 가져온 마지막 10줄 (항목 이후):');
      for (let i = Math.max(0, itemEndIndex, lines.length - 10); i < lines.length; i++) {
        const line = lines[i];
        if (line.trim()) {
          console.log(`      Line ${i}: ${line.substring(0, 100)}`);
        }
      }
    } else {
      console.log(`   ❌ idx=${IDX} 항목을 DB에서 찾을 수 없음`);
    }

    console.log('\n✅ 디버그 완료. 다음 파일 확인:');
    console.log(`   - ${debugPath} (전체 innerText)`);

    await context.close();
  } catch (error) {
    console.error(`❌ 오류: ${error.message}`);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

debugDescription();
