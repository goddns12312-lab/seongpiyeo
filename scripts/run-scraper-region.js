#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const playwright = require('playwright');
const BaseAdapter = require('./adapters/base-adapter');

const regionName = process.argv[2] || '서울';
const boardUrl = process.argv[3] || 'https://www.xn--3e0b036btifksj.com/40/';

const CONFIG = {
  boardUrl,
  regionName,
  maxImages: 5,
  delayMin: 300,
  delayMax: 800
};

function log(...args) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]`, ...args);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomDelay() {
  return Math.floor(Math.random() * (CONFIG.delayMax - CONFIG.delayMin + 1)) + CONFIG.delayMin;
}

class RegionAdapter extends BaseAdapter {
  constructor(regionName, boardUrl) {
    super();
    this.regionName = regionName;
    this.boardUrl = boardUrl;
  }

  static get sourceName() {
    return 'pcbangkingdom';
  }

  async setup(browser) {
    const authPath = path.join(__dirname, 'playwright-auth.json');
    if (fs.existsSync(authPath)) {
      const storageState = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
      return await browser.newContext({ storageState });
    }
    return await browser.newContext();
  }

  async navigateToPage(page, pageNum) {
    const url = `${this.boardUrl}?page=${pageNum}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  }

  async getPostLinks(page) {
    return await page.evaluate(() => {
      const links = document.querySelectorAll('.title_link._fade_link');
      return Array.from(links).map(link => ({
        href: link.getAttribute('href'),
        title: link.textContent.trim()
      }));
    });
  }

  buildDetailUrl(postInfo) {
    if (!postInfo.href) return null;
    if (postInfo.href.startsWith('http')) return postInfo.href;
    return this.boardUrl + postInfo.href;
  }

  async extractDetails(page) {
    return await page.evaluate(() => {
      const text = document.body.innerText;

      const details = {
        location: '',
        size: '',
        floor: '',
        deposit: null,
        premium_price: null,
        monthly_rent: null,
        facilities: '',
        description: text,
        contact: null,
        imageUrls: [],
        move_in_date: '',
        business_license: '',
        administrative_record: ''
      };

      // 기본 추출 로직
      const locationMatch = text.match(/매물위치\s*[:：]\s*([^\n]+)/);
      if (locationMatch) details.location = locationMatch[1].trim();

      const sizeMatch = text.match(/실평수\s*[:：]\s*([^\n]+)/);
      if (sizeMatch) details.size = sizeMatch[1].trim().replace(/[^0-9]/g, '');

      const floorMatch = text.match(/해당층\s*[:：]\s*([^\n]+)/);
      if (floorMatch) details.floor = floorMatch[1].trim();

      const depositMatch = text.match(/보증금\s*[:：]\s*([^\n]+)/);
      if (depositMatch) {
        const depStr = depositMatch[1].trim();
        const num = depStr.match(/\d+/);
        if (num) details.deposit = parseInt(num[0]);
      }

      const premiumMatch = text.match(/희망권리금\s*[:：]\s*([^\n]+)/);
      if (premiumMatch) {
        const premStr = premiumMatch[1].trim();
        const num = premStr.match(/\d+/);
        if (num) details.premium_price = parseInt(num[0]);
      }

      const rentMatch = text.match(/월세\s*[:：]\s*([^\n]+)/);
      if (rentMatch) {
        const rentStr = rentMatch[1].trim();
        const num = rentStr.match(/\d+/);
        if (num) details.monthly_rent = parseInt(num[0]);
      }

      const facilitiesMatch = text.match(/시설집기\s*[:：]\s*([^\n]+)/);
      if (facilitiesMatch) details.facilities = facilitiesMatch[1].trim();

      const moveMatch = text.match(/입주가능일\s*[:：]\s*([^\n]+)/);
      if (moveMatch) details.move_in_date = moveMatch[1].trim();

      const licenseMatch = text.match(/사업자&영업허가증\s*[:：]\s*([^\n]+)/);
      if (licenseMatch) details.business_license = licenseMatch[1].trim();

      const recordMatch = text.match(/행정처분여부\s*[:：]\s*([^\n]+)/);
      if (recordMatch) details.administrative_record = recordMatch[1].trim();

      // 이미지 추출
      const images = document.querySelectorAll('img[src*="cdn.imweb.me"]');
      details.imageUrls = Array.from(images)
        .map(img => img.src)
        .filter(src => src && src.includes('cdn.imweb.me'))
        .slice(0, 5);

      return details;
    });
  }
}

async function main() {
  log(`\n🚀 ${CONFIG.regionName} 지역 크롤러 시작`);
  log(`보드 URL: ${CONFIG.boardUrl}`);

  let browser;
  try {
    browser = await playwright.chromium.launch({ headless: true });
    const adapter = new RegionAdapter(CONFIG.regionName, CONFIG.boardUrl);
    const context = await adapter.setup(browser);
    const page = await context.newPage();

    // 마지막 페이지 감지
    log(`📍 마지막 페이지 감지 중...`);
    await adapter.navigateToPage(page, 1);
    await sleep(1000);

    const lastPageNum = await page.evaluate(() => {
      const pagination = document.querySelector('.pagination');
      if (pagination) {
        const links = pagination.querySelectorAll('a');
        const pageNumbers = Array.from(links)
          .map(a => {
            const match = a.href.match(/[?&]page=(\d+)/);
            return match ? parseInt(match[1]) : null;
          })
          .filter(n => n);
        return Math.max(...pageNumbers, 1);
      }
      return 1;
    });

    log(`✅ 마지막 페이지: ${lastPageNum}`);

    // 크롤링
    let totalItems = 0;
    const seenIdx = new Set();

    for (let pageNum = lastPageNum; pageNum >= 1; pageNum--) {
      log(`\n📄 페이지 ${pageNum} 크롤링...`);

      await adapter.navigateToPage(page, pageNum);
      await sleep(getRandomDelay());

      const links = await adapter.getPostLinks(page);
      log(`  링크 ${links.length}개 발견`);

      for (const link of links) {
        const idxMatch = link.href.match(/idx=(\d+)/);
        if (!idxMatch) continue;

        const idx = idxMatch[1];
        if (seenIdx.has(idx)) continue;
        seenIdx.add(idx);

        totalItems++;
      }
    }

    log(`\n✅ ${CONFIG.regionName} 크롤링 완료: ${totalItems}개 항목`);

    await page.close();
    await context.close();
    process.exit(0);

  } catch (error) {
    log(`❌ 오류: ${error.message}`);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

main();
