#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const REGIONS = [
  { name: '서울', boardPath: '40', maxPage: 8 },
  { name: '경기도', boardPath: '93', maxPage: 27 },
  { name: '강원도', boardPath: '92', maxPage: 2 },
  { name: '인천', boardPath: '91', maxPage: 9 },
  { name: '충청북도', boardPath: '90', maxPage: 9 },
  { name: '충청남도', boardPath: '89', maxPage: 9 },
  { name: '경상북도', boardPath: '88', maxPage: 9 },
  { name: '경상남도', boardPath: '87', maxPage: 9 },
  { name: '전라북도', boardPath: '86', maxPage: 2 },
  { name: '전라남도', boardPath: '85', maxPage: 4 },
  { name: '제주도', boardPath: '84', maxPage: 1 },
];

// 상세정보 추출 함수 (모든 12개 항목 + description)
async function extractPostDetails(page) {
  return await page.evaluate(() => {
    const bodyText = document.body.innerText;
    const items = {};

    // 항목 매핑 (12개 모두)
    const itemMapping = {
      '매물업종': 'business_type',
      '매물위치': 'location',
      '실평수': 'area',
      '해당층': 'floor',
      '보증금': 'deposit',
      '희망권리금': 'premium',
      '월세': 'monthly_rent',
      '시설집기': 'facilities',
      '입주가능일': 'move_in_date',
      '사업자': 'business_license',
      '영업허가증': 'business_license',
      '행정처분': 'administrative_record',
      '연락처': 'contact'
    };

    // 각 번호별 항목과 값 추출 (N. 항목명 : 값 형식)
    for (let itemNum = 1; itemNum <= 12; itemNum++) {
      const nextNum = itemNum + 1;
      // 패턴: "N. 항목명 : 값"에서 값을 추출
      const basePattern = `${itemNum}\\.\\s*([^:：]*?)[:：]\\s*`;
      const fullPattern = new RegExp(basePattern + '(.*?)(?=' + nextNum + '\\.|$)', 's');
      const match = bodyText.match(fullPattern);

      if (match && match[2]) {
        const itemName = match[1].trim();
        let itemValue = match[2].trim();

        // 항목값의 끝에서 다음 항목 번호가 보이면 제거
        itemValue = itemValue.replace(/\s*\d+\.\s*$/, '').trim();

        // 개행 처리 - 첫 줄만 사용
        itemValue = itemValue.split(/[\n\r]/)[0].trim();

        // 항목명 매핑
        let mappedKey = null;
        for (const [key, value] of Object.entries(itemMapping)) {
          if (itemName.includes(key)) {
            mappedKey = value;
            break;
          }
        }

        if (mappedKey && itemValue) {
          items[mappedKey] = itemValue;
        }
      }
    }

    // 설명글 추출 (12번 항목 이후의 텍스트)
    const descMatch = bodyText.match(/12\.\s*[^:：]*?[:：]\s*([\s\S]*?)$/);
    if (descMatch && descMatch[1]) {
      const fullDesc = descMatch[1].trim();
      // 연락처 이후의 설명글만 추출
      const lines = fullDesc.split('\n');
      const descLines = [];
      let foundContact = false;

      for (const line of lines) {
        if (line.match(/\d{2,3}-\d{3,4}-\d{4}/)) {
          foundContact = true;
          continue;
        }
        if (foundContact && line.trim()) {
          descLines.push(line.trim());
        }
      }

      if (descLines.length > 0) {
        items['description'] = descLines.join(' ');
      }
    }

    // 이미지 추출: 게시글 본문 영역만 (배너 제외)
    // imweb 상세페이지의 본문 영역 선택
    let contentArea = document.querySelector('.content-area') ||
                      document.querySelector('.view-content-area') ||
                      document.querySelector('#contents') ||
                      document.querySelector('.post-view-content') ||
                      document.body;

    const images = Array.from(contentArea.querySelectorAll('img[src*="cdn.imweb"]'))
      .map(img => img.getAttribute('src'))
      .filter((src, idx, arr) => arr.indexOf(src) === idx);

    return { items, images };
  });
}

async function scrapeRegion(browser, region) {
  const allListings = [];

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  for (let pageNum = region.maxPage; pageNum >= 1; pageNum--) {
    const url = `https://www.xn--3e0b036btifksj.com/${region.boardPath}/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=${pageNum}`;

    const page = await context.newPage();

    try {
      console.log(`📍 [${region.name}] 페이지 ${pageNum}/${region.maxPage} 크롤링...`);

      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // 스크롤로 모든 콘텐츠 로드
      const pageHeight = await page.evaluate(() => document.body.scrollHeight);
      for (let i = 0; i < pageHeight; i += 500) {
        await page.evaluate(scrollY => window.scrollBy(0, scrollY), 500);
        await page.waitForTimeout(50);
      }

      // 목록에서 게시글 링크 추출
      const postLinksRaw = await page.evaluate(() => {
        const wraps = document.querySelectorAll('span.post_link_wrap');
        return Array.from(wraps).map(wrap => {
          const link = wrap.querySelector('a.title_link._fade_link');
          const title = link?.querySelector('span')?.textContent?.trim();
          const href = link?.getAttribute('href');
          const onclick = link?.getAttribute('onclick');

          return { title, href, onclick };
        }).filter(p => p.title && !p.title.includes('공지'));
      });

      // 게시글 링크 후처리 (onclick에서 URL 디코딩)
      const postLinks = postLinksRaw.map(post => {
        let href = post.href;
        let idx = null;

        // href가 javascript:;이면 onclick에서 추출
        if (href === 'javascript:;' && post.onclick) {
          const match = post.onclick.match(/openLogin\('([^']+)'/);
          if (match && match[1]) {
            const urlDecoded = decodeURIComponent(match[1]);
            const decodedPath = Buffer.from(urlDecoded, 'base64').toString('utf-8');
            href = decodedPath;
          }
        }

        // idx 추출 (href에서)
        if (href && href.includes('&idx=')) {
          const match = href.match(/&idx=(\d+)/);
          if (match) idx = match[1];
        }

        return { title: post.title, href, idx };
      });

      console.log(`  ℹ️  ${postLinks.length}개 게시글 발견`);

      // 각 게시글의 상세정보 추출 (역순: 아래→위)
      let successCount = 0;
      for (let i = postLinks.length - 1; i >= 0; i--) {
        const post = postLinks[i];

        try {
          // href를 이용한 상세 페이지 이동
          if (post.href) {
            const detailUrl = `https://www.xn--3e0b036btifksj.com${post.href}`;

            // 상세 페이지로 이동
            await page.goto(detailUrl, { waitUntil: 'networkidle', timeout: 30000 });

            // 추가 대기로 JavaScript 렌더링 완료 확인
            await page.waitForTimeout(1000);

            // 상세정보 추출
            const details = await extractPostDetails(page);

            allListings.push({
              title: post.title,
              region: region.name,
              idx: post.idx,
              ...details.items,
              images: details.images
            });

            successCount++;

            console.log(`    ✅ [${i+1}] ${post.title.slice(0, 30)} 상세정보 추출`);
          }
        } catch (e) {
          console.log(`    ⚠️  [${i+1}] 상세정보 추출 실패:`, e.message);
        }
      }

      console.log(`  ✅ ${successCount}개 상세정보 추출\n`);

      await page.close();

      // 페이지 간 딜레이
      if (pageNum > 1) {
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 500));
      }

    } catch (error) {
      console.error(`❌ 페이지 ${pageNum} 오류:`, error.message);
      await page.close();
    }
  }

  await context.close();
  return allListings;
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    console.log('🚀 상세정보 기반 크롤링 시작\n');

    const allListings = [];

    // 모든 지역 크롤링
    for (const region of REGIONS) {
      const listings = await scrapeRegion(browser, region);
      allListings.push(...listings);
    }

    console.log(`✅ 총 ${allListings.length}개 매물 상세정보 추출됨\n`);

    // 결과 저장
    const outputPath = path.join(__dirname, 'output', 'detailed-listings.json');
    fs.writeFileSync(outputPath, JSON.stringify(allListings, null, 2));
    console.log('📄 저장:', outputPath);

    // 샘플 출력
    if (allListings.length > 0) {
      console.log('\n📊 샘플 데이터:');
      console.log(JSON.stringify(allListings[0], null, 2));
    }

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
