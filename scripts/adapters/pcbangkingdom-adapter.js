const fs = require('fs');
const path = require('path');
const BaseAdapter = require('./base-adapter');

class PcbangkingdomAdapter extends BaseAdapter {
  static sourceName = 'pcbangkingdom';
  static displayName = '피씨천국';

  constructor(region = null) {
    super();
    // 환경 변수에서 boardUrl을 받거나 기본값 사용
    this.baseUrl = 'https://www.xn--3e0b036btifksj.com';
    this.boardUrl = process.env.BOARD_URL || `${this.baseUrl}/40/`;
    this.region = region; // 지역 필터 (null이면 전체)
    this.authFile = path.join(__dirname, '..', 'playwright-auth.json');
  }

  // 1. setup(browser) - 저장된 세션으로 컨텍스트 생성
  async setup(browser) {
    try {
      if (!fs.existsSync(this.authFile)) {
        throw new Error(`인증 파일 없음: ${this.authFile}`);
      }

      const storageState = JSON.parse(fs.readFileSync(this.authFile, 'utf-8'));
      const context = await browser.newContext({ storageState });
      const page = await context.newPage();
      return page;
    } catch (error) {
      throw new Error(`피씨천국 세션 로드 실패: ${error.message}`);
    }
  }

  // 2. navigateToPage(page, pageNum) - 페이지네이션
  async navigateToPage(page, pageNum) {
    let url = `${this.boardUrl}?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=${pageNum}`;
    // 지역 필터 추가
    if (this.region) {
      url += `&region=${encodeURIComponent(this.region)}`;
    }
    await page.goto(url, { waitUntil: 'networkidle' });
  }

  // 3. getPostLinks(page, pageNum) - 목록 링크 추출
  async getPostLinks(page, pageNum) {
    return await page.evaluate(() => {
      const links = [];
      document.querySelectorAll('.title_link._fade_link').forEach(link => {
        const href = link.getAttribute('href');
        let text = link.innerText?.trim() || '';

        // Title에서 "1. 매물업종" 이후의 description 내용 제거
        // title은 첫 줄 또는 "1."이 나타나기 전까지만
        const lines = text.split('\n');
        let cleanTitle = lines[0] || '';

        // 줄 내에 "1. 매물업종" 같은 패턴이 있으면 그 전까지만
        const itemMatch = cleanTitle.match(/^(.+?)(?:\d+\.\s*매물업종|$)/);
        if (itemMatch) {
          cleanTitle = itemMatch[1].trim();
        }

        // " N" suffix 제거 (목록에서 자주 보임)
        cleanTitle = cleanTitle.replace(/\s+N\s*$/, '').trim();

        // href에서 idx 추출
        const idxMatch = href?.match(/[?&]idx=(\d+)/);
        if (idxMatch && href?.includes('bmode=view')) {
          links.push({
            idx: idxMatch[1],
            title: cleanTitle,
            href: href
          });
        }
      });

      return links;
    });
  }

  // 4. buildDetailUrl(postInfo) - 상세페이지 URL 생성
  buildDetailUrl(postInfo) {
    if (postInfo.href.startsWith('http')) {
      return postInfo.href;
    }
    // href가 상대경로면 baseUrl과 결합
    return this.baseUrl + (postInfo.href.startsWith('/') ? postInfo.href : '/' + postInfo.href);
  }

  // 5. extractDetails(page) - 상세페이지 파싱
  async extractDetails(page) {
    const rawData = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const lines = bodyText.split('\n');
      const items = {};
      let firstItemIndex = -1;
      let lastItemIndex = -1;

      // 12항목 파싱
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        for (let itemNum = 1; itemNum <= 12; itemNum++) {
          const numPattern = `${itemNum}\\.\\s*`;
          if (line.match(new RegExp(`^${numPattern}`))) {
            if (firstItemIndex === -1) {
              firstItemIndex = i;
            }

            const colonIdx = line.indexOf(':');
            const colonIdx2 = line.indexOf('：');
            const splitIdx = colonIdx > -1 ? colonIdx : colonIdx2;

            if (splitIdx > -1) {
              // 정규식에 실제로 매칭된 텍스트의 길이로 구함 (numPattern 문자열 길이 아님)
              const match = line.match(new RegExp(`^${numPattern}`));
              const actualPrefixLength = match ? match[0].length : 0;
              let itemName = line.substring(actualPrefixLength, splitIdx).trim();
              let itemValue = line.substring(splitIdx + 1).trim();

              const itemMapping = {
                '매물업종': 'category',
                '매물위치': 'location',
                '실평수': 'size',
                '해당층': 'floor',
                '보증금': 'deposit',
                '희망권리금': 'premium',
                '월세': 'monthly_rent',
                '시설집기': 'facilities',
                '입주가능일': 'move_in_date',
                '사업자&영업허가증 여부': 'business_license',
                '행정처분여부': 'administrative_record',
                '연락처': 'contact'
              };

              const matchedKey = Object.keys(itemMapping).find(k => itemName.includes(k));
              if (matchedKey) {
                const key = itemMapping[matchedKey];
                items[matchedKey] = itemValue;
                lastItemIndex = i;
              }
            }
            break;
          }
        }
      }

      // Description 추출 (12항목 + 자유글 포함)
      let description = '';
      if (firstItemIndex > -1) {
        const descLines = [];
        let cutoffIndex = lines.length;

        // 1단계: "매장 사진이 있으면 꼭" 공지문 찾기 (우선순위 높음)
        for (let i = firstItemIndex; i < lines.length; i++) {
          const trimmedLine = lines[i].trim();
          if (trimmedLine.includes('매장 사진이 있으면 꼭')) {
            cutoffIndex = i;
            break;
          }
        }

        // 2단계: 다음 게시글의 시작(1. 매물업종) 찾기 (공지문이 없으면)
        if (cutoffIndex === lines.length) {
          for (let i = lastItemIndex + 1; i < lines.length; i++) {
            const trimmedLine = lines[i].trim();
            // 다음 게시글의 "1. 매물업종" 찾기
            if (i > lastItemIndex + 3 && trimmedLine.match(/^1\.\s*매물업종\s*[:：]/)) {
              cutoffIndex = i;
              break;
            }
          }
        }

        // 3단계: footer 제외하기 (Copyright, PC방 사고 팔았? 등)
        if (cutoffIndex === lines.length) {
          for (let i = lastItemIndex + 1; i < lines.length; i++) {
            const trimmedLine = lines[i].trim();
            if (trimmedLine.includes('Copyright') ||
                trimmedLine.includes('PC방 사고') ||
                trimmedLine.includes('글쓰기') ||
                trimmedLine.includes('목록')) {
              cutoffIndex = i;
              break;
            }
          }
        }

        // 4단계: firstItemIndex부터 cutoffIndex 직전까지 포함 (12항목 + 자유글만)
        for (let i = firstItemIndex; i < cutoffIndex; i++) {
          descLines.push(lines[i]);
        }

        description = descLines.join('\n').trimEnd();
      }

      // 이미지 추출 (CDN URL만)
      const images = [];
      const contentSelectors = [
        'article',
        '[class*="article"]',
        '[class*="content"]',
        '[class*="board_view"]',
        '[class*="post_content"]',
        '[class*="detail"]',
        '[class*="editor"]'
      ];

      const excludeSelectors = [
        'header',
        'nav',
        'footer',
        '[class*="navigation"]',
        '[class*="sidebar"]',
        '[class*="ads"]'
      ];

      let contentContainer = null;
      for (const selector of contentSelectors) {
        const el = document.querySelector(selector);
        if (el && el.querySelectorAll('img').length > 0) {
          contentContainer = el;
          break;
        }
      }

      if (contentContainer) {
        contentContainer.querySelectorAll('img').forEach(img => {
          const src = img.src;

          // CDN 필터
          if (!src.includes('cdn.imweb.me') && !src.includes('imweb.me')) return;
          if (src.includes('cdn-optimized') || src.includes('common/img')) return;
          if (img.width && img.width < 150) return;

          // 제외영역 확인
          const inExcludedArea = Array.from(
            document.querySelectorAll(excludeSelectors.join(','))
          ).some(el => el.contains(img));
          if (inExcludedArea) return;

          // 크기 확인 (클릭가능 여부)
          const rect = img.getBoundingClientRect();
          if (rect.width < 150 || rect.height < 150) return;

          images.push(src);
        });
      }

      return { items, description, images };
    });

    // 필드 추출 및 정규화
    const deposit = this._parsePrice(rawData.items['보증금']);
    const premium = this._parsePrice(rawData.items['희망권리금']);
    const monthly_rent = this._parsePrice(rawData.items['월세']);
    let contact = this._normalizePhone(rawData.items['연락처']);

    // contact가 없으면 description에서 추출
    if (!contact && rawData.description) {
      const contactMatch = rawData.description.match(/12\.\s*연락처\s*[:：]\s*([^\n]+)/);
      if (contactMatch) {
        contact = this._normalizePhone(contactMatch[1].trim());
      }
    }

    return {
      location: rawData.items['매물위치'] || '',
      size: rawData.items['실평수'] || '',
      floor: rawData.items['해당층'] || '',
      deposit: deposit,
      premium_price: premium,
      monthly_rent: monthly_rent,
      facilities: rawData.items['시설집기'] || '',
      description: rawData.description || '',
      contact: contact,
      imageUrls: rawData.images || [],
      move_in_date: rawData.items['입주가능일'] || '',
      business_license: rawData.items['사업자&영업허가증 여부'] || '',
      administrative_record: rawData.items['행정처분여부'] || ''
    };
  }

  // 유틸리티 함수들
  _normalizePhone(phone) {
    if (!phone) return null;
    const cleaned = String(phone).replace(/[^\d]/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('010')) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }

  _parsePrice(price) {
    if (price === null || price === undefined) return null;
    const num = parseInt(String(price).replace(/[^\d]/g, ''));
    return isNaN(num) ? null : num;
  }

  // 페이지네이션 감지 (마지막 페이지 자동 추출)
  async detectLastPage(page) {
    try {
      const url = this.boardUrl;
      await page.goto(url, { waitUntil: 'networkidle' });

      const pageNumbers = await page.evaluate(() => {
        const pages = [];

        // 방법 1: span.page 또는 a.page 찾기
        const pageElements = document.querySelectorAll('[class*="page"]');
        for (const el of pageElements) {
          const text = el.textContent.trim();
          const num = parseInt(text);
          if (!isNaN(num) && num > 0 && num < 10000) {
            pages.push(num);
          }
        }

        // 방법 2: href에서 page 파라미터 추출
        const links = document.querySelectorAll('a[href*="page="]');
        for (const link of links) {
          const match = link.href.match(/[?&]page=(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > 0) pages.push(num);
          }
        }

        return [...new Set(pages)].sort((a, b) => a - b);
      });

      if (pageNumbers.length === 0) {
        return 1; // 기본값
      }

      const lastPage = Math.max(...pageNumbers);
      return lastPage;
    } catch (error) {
      console.error(`⚠️  페이지 감지 실패: ${error.message}, 기본값 1 사용`);
      return 1;
    }
  }
}

module.exports = PcbangkingdomAdapter;
