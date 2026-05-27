/**
 * PC천국 자동 크롤러 - Playwright 직접 사용
 * Windows Task Scheduler에서 실행: node C:\Users\B\Desktop\aass\scripts\scraper.js
 */

const { chromium } = require('playwright');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'scraper.log');
const CONFIG = {
  headless: true,
  timeout: 30000,
  startPage: 1,
  endPage: 8,
  apiUrl: 'http://localhost:3001/api/scraper',
};

function log(message, level = 'INFO') {
  const timestamp = new Date().toLocaleString('ko-KR');
  const logLine = `[${timestamp}] [${level}] ${message}`;
  console.log(logLine);
  fs.appendFileSync(LOG_FILE, logLine + '\n', 'utf-8');
}

async function scrapeWithPlaywright() {
  let browser;
  let page;
  const allListings = [];

  try {
    log('Playwright 브라우저 시작 중...');
    browser = await chromium.launch({ headless: CONFIG.headless });
    page = await browser.newPage();

    // 주의: 로그인 기능은 모달로 구현되어 있어서 정적 크롤링으로 처리 중

    // 각 페이지 크롤링
    for (let pageNum = CONFIG.startPage; pageNum <= CONFIG.endPage; pageNum++) {
      try {
        log(`페이지 ${pageNum} 크롤링 중...`);

        const url = `https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=${pageNum}`;

        // 페이지 로드
        await page.goto(url, { waitUntil: 'networkidle', timeout: CONFIG.timeout });

        // 목록 페이지에서 매물 정보 추출
        const listings = await page.evaluate(() => {
          const items = [];
          let links = document.querySelectorAll('a[href*="/detail"]');

          if (links.length === 0) {
            links = document.querySelectorAll('table tbody tr td a');
          }

          links.forEach((link, idx) => {
            const title = link.textContent?.trim();
            const href = link.getAttribute('href');

            if (title && href && title.length > 3) {
              // 이미지 찾기 - 같은 행의 이미지
              let imageUrl = '';
              try {
                const row = link.closest('tr');
                if (row) {
                  const img = row.querySelector('img');
                  if (img) {
                    imageUrl = img.getAttribute('src') || img.getAttribute('data-src') || '';
                  }
                }
              } catch (e) {
                // 무시
              }

              items.push({
                title: title,
                url: href.startsWith('http') ? href : `https://www.xn--3e0b036btifksj.com${href}`,
                imageUrl: imageUrl,
                sourceId: href.match(/(\d+)/)?.[1] || `${Date.now()}-${idx}`,
              });
            }
          });

          return items;
        });

        log(`페이지 ${pageNum}: ${listings.length}개 항목 발견`);

        // 각 매물의 상세 페이지에서 정보 추출
        for (const listing of listings) {
          try {
            await page.goto(listing.url, { waitUntil: 'networkidle', timeout: CONFIG.timeout });

            const details = await page.evaluate(() => {
              const result = {
                price: 0,
                deposit: 0,
                monthly_rent: 0,
                region: '',
                district: '',
                area_sqm: 0,
                pc_count: 0,
                monthly_revenue: 0,
                monthly_profit: 0,
                imageUrls: [], // 이미지 URL 배열
              };

              const textContent = document.body.innerText;

              // 구조화된 데이터 추출 (소수점 이하)
              // 1. 매물업종 : ...
              // 2. 매물위치 : ...
              // 3. 실평수 : 18
              // 4. 해당층 : 1
              // 5. 보증금 : 2000 또는 2,000만원
              // 6. 희망권리금 : 2000 또는 무권리
              // 7. 월세 : 120
              // 8. 시설집기 : ...

              // 실평수 (평수 → 제곱미터)
              const areaMatch = textContent.match(/3\.\s*실평수\s*:\s*(\d+)/);
              if (areaMatch) {
                const pyeong = parseInt(areaMatch[1]);
                result.area_sqm = Math.round(pyeong * 3.305); // 평수를 제곱미터로 변환
              }

              // 보증금 (천만원 단위 → 원)
              const depositMatch = textContent.match(/5\.\s*보증금\s*:\s*([^6]*?)(?=6\.|$)/);
              if (depositMatch) {
                const depositStr = depositMatch[1].trim();
                let val = 0;
                if (depositStr.includes('만원')) {
                  val = parseInt(depositStr.replace(/[^0-9]/g, ''));
                } else if (depositStr) {
                  val = parseInt(depositStr);
                  // 숫자만 있으면 만원 단위로 가정
                }
                result.deposit = val * 10000;
              }

              // 희망권리금 (천만원 단위 → 원)
              const priceMatch = textContent.match(/6\.\s*희망권리금\s*:\s*([^7]*?)(?=7\.|$)/);
              if (priceMatch) {
                const priceStr = priceMatch[1].trim();
                if (priceStr.includes('무권리')) {
                  result.price = 0;
                } else if (priceStr.includes('만원')) {
                  const val = parseInt(priceStr.replace(/[^0-9]/g, ''));
                  result.price = val * 10000;
                } else if (priceStr) {
                  const val = parseInt(priceStr.replace(/[^0-9]/g, ''));
                  result.price = val * 10000; // 만원 단위로 가정
                }
              }

              // 월세 (만원 단위)
              const rentMatch = textContent.match(/7\.\s*월세\s*:\s*(\d+)/);
              if (rentMatch) result.monthly_rent = parseInt(rentMatch[1]);

              // 지역 추출 (위치에서)
              const locationMatch = textContent.match(/2\.\s*매물위치\s*:\s*([^3]*?)(?=3\.|$)/);
              if (locationMatch) {
                const location = locationMatch[1].trim();
                const regions = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
                for (const region of regions) {
                  if (location.includes(region)) {
                    result.region = region;
                    result.district = location; // 전체 위치를 district에 저장
                    break;
                  }
                }
              }

              // 이미지 추출 (cdn.imweb.me 호스팅 이미지들)
              const images = document.querySelectorAll('img[src*="imweb.me"], img[src*="cdn."]');
              images.forEach(img => {
                const src = img.getAttribute('src') || img.getAttribute('data-src');
                if (src && src.includes('imweb.me') && !src.includes('logo') && !src.includes('profile') && !src.includes('default')) {
                  result.imageUrls.push(src);
                }
              });
              // 중복 제거
              result.imageUrls = [...new Set(result.imageUrls)];

              return result;
            });

            listing.price = details.price;
            listing.deposit = details.deposit;
            listing.monthly_rent = details.monthly_rent;
            listing.region = details.region || '서울';
            listing.area_sqm = details.area_sqm;
            listing.pc_count = details.pc_count;
            listing.monthly_revenue = details.monthly_revenue;
            listing.monthly_profit = details.monthly_profit;
            listing.imageUrls = details.imageUrls || [];

          } catch (detailError) {
            log(`상세페이지 로드 실패 (${listing.url}): ${detailError.message}`, 'WARN');
          }
        }

        allListings.push(...listings);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 800));

      } catch (pageError) {
        log(`페이지 ${pageNum} 오류: ${pageError.message}`, 'WARN');
      }
    }

    log(`총 ${allListings.length}개 매물 발견`);

    // Supabase에 직접 저장
    if (allListings.length > 0) {
      log('Supabase 저장 중...');

      try {
        const fs = require('fs');
        const path = require('path');
        require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

        const { createClient } = require('@supabase/supabase-js');

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        log(`Debug: URL=${supabaseUrl ? '있음' : '없음'}, Key=${supabaseKey ? '있음' : '없음'}`, 'INFO');

        if (!supabaseUrl || !supabaseKey) {
          log('✗ Supabase 환경변수 없음', 'ERROR');
          log('  .env.local 파일 확인하세요', 'ERROR');
          return;
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        let imported = 0;
        let skipped = 0;

        for (const listing of allListings) {
          try {
            const { data, error } = await supabase
              .from('listings')
              .insert([
                {
                  title: listing.title || 'PC방 매물',
                  description: listing.description || `PC천국 매물 - ${listing.url}`,
                  price_type: listing.monthly_rent > 0 ? 'lease' : 'sale',
                  price: listing.price || 0,
                  deposit: listing.deposit || 0,
                  monthly_rent: listing.monthly_rent || 0,
                  region: listing.region || '서울',
                  area_sqm: listing.area_sqm || 0,
                  pc_count: listing.pc_count || 0,
                  monthly_revenue: listing.monthly_revenue || 0,
                  monthly_profit: listing.monthly_profit || 0,
                  status: 'active',
                  view_count: 0,
                },
              ])
              .select();

            if (error) {
              skipped++;
              continue;
            }

            if (data && data.length > 0 && listing.imageUrls && listing.imageUrls.length > 0) {
              const imagesToInsert = listing.imageUrls.map((url, idx) => ({
                listing_id: data[0].id,
                url: url,
                is_primary: idx === 0,
                order_num: idx,
              }));

              await supabase
                .from('listing_images')
                .insert(imagesToInsert);
            }

            imported++;
          } catch (err) {
            skipped++;
          }
        }

        log(`✓ 완료: ${imported}개 매물 추가됨, ${skipped}개 중복 제외`, 'SUCCESS');
        log(`  - 추가: ${imported}개, 중복 제외: ${skipped}개`, 'SUCCESS');
      } catch (dbError) {
        log(`✗ DB 저장 실패: ${dbError.message}`, 'ERROR');
      }
    } else {
      log('스크래핑된 매물이 없습니다', 'WARN');
    }

  } catch (error) {
    log(`✗ 치명적 오류: ${error.message}`, 'ERROR');
    process.exit(1);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
    log('크롤링 완료\n');
  }
}

// 실행
scrapeWithPlaywright().catch(err => {
  log(`예상치 못한 오류: ${err.message}`, 'ERROR');
  process.exit(1);
});
