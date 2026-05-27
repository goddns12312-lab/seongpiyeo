import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@/lib/supabase/server';

interface ScrapedListing {
  title: string;
  description: string;
  price_type: 'sale' | 'lease';
  price: number;
  deposit?: number;
  monthly_rent?: number;
  region: string;
  district?: string;
  address?: string;
  area_sqm?: number;
  floor?: number;
  image_url?: string;
  source_url: string;
  source_id: string;
}

const BOARD_REGIONS = [
  { name: '서울', boardPath: '40' },
  { name: '경기', boardPath: '93' },
  { name: '강원', boardPath: '92' },
  { name: '인천', boardPath: '91' },
  { name: '충북', boardPath: '90' },
  { name: '충남', boardPath: '89' },
  { name: '경북', boardPath: '88' },
  { name: '경남', boardPath: '87' },
  { name: '전북', boardPath: '86' },
  { name: '전남', boardPath: '85' },
  { name: '제주', boardPath: '84' },
];

const REGION_MAP: { [key: string]: string } = {
  '서울': '서울',
  '경기': '경기',
  '인천': '인천',
  '부산': '부산',
  '대구': '대구',
  '광주': '광주',
  '대전': '대전',
  '울산': '울산',
  '세종': '세종',
  '강원': '강원',
  '충북': '충북',
  '충남': '충남',
  '전북': '전북',
  '전남': '전남',
  '경북': '경북',
  '경남': '경남',
  '제주': '제주',
};

function extractRegionFromLocation(text: string): string | null {
  for (const region of Object.values(REGION_MAP)) {
    if (text.includes(region)) {
      return region;
    }
  }
  return null;
}

export async function scrapePC천국(pageNum: number = 1, region: string | null = null): Promise<ScrapedListing[]> {
  const listings: ScrapedListing[] = [];

  try {
    // 특정 지역만 크롤링하거나 모든 지역 크롤링
    const regionsToScrape = region
      ? BOARD_REGIONS.filter(r => r.name === region)
      : BOARD_REGIONS;

    for (const boardRegion of regionsToScrape) {
      const url = `https://www.xn--3e0b036btifksj.com/${boardRegion.boardPath}/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=${pageNum}`;

      console.log(`\n📍 [${boardRegion.name}] 크롤링: ${url}`);
      const regionListings = await scrapeBoard(url, pageNum, boardRegion.name);
      listings.push(...regionListings);
    }

    console.log(`Page ${pageNum}: Successfully found ${listings.length} listings`);
    return listings;
  } catch (error) {
    console.error(`Scraping failed for page ${pageNum}:`, error);
    return [];
  }
}

async function scrapeBoard(url: string, pageNum: number, regionName: string): Promise<ScrapedListing[]> {
  const listings: ScrapedListing[] = [];

  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer': 'https://www.xn--3e0b036btifksj.com/',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(data);

    console.log(`\n📄 Page ${pageNum}: HTML length = ${data.length} bytes`);

    // 목록에서 모든 링크 찾기 - 정확한 선택자 사용
    let allLinks = $('a.title_link._fade_link');
    console.log(`  Found ${allLinks.length} links with .title_link._fade_link selector`);

    if (allLinks.length === 0) {
      // 다른 셀렉터 시도
      allLinks = $('a[href*="bmode=view"]');
      console.log(`  Found ${allLinks.length} links with bmode=view selector`);
    }

    // 모든 링크 출력 (디버깅 - 항상)
    const allAnchors = $('a');
    console.log(`  Total anchors found = ${allAnchors.length}`);
    allAnchors.slice(0, 15).each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().slice(0, 40);
      const classes = $(el).attr('class');
      console.log(`    Link ${i}: class="${classes}" href="${href}" text="${text}"`);
    });

    console.log(`  ✅ Total found: ${allLinks.length} links\n`);

    const processedUrls = new Set<string>();

    allLinks.each((i, elem) => {
      const titleElem = $(elem);
      const title = titleElem.text().trim();
      const detailUrl = titleElem.attr('href');

      if (!title || !detailUrl || processedUrls.has(detailUrl)) return;

      processedUrls.add(detailUrl);

      // 상대 URL이면 절대 URL로 변환
      const fullDetailUrl = detailUrl.startsWith('http')
        ? detailUrl
        : `https://www.xn--3e0b036btifksj.com${detailUrl}`;

      const sourceId = detailUrl.match(/(\d+)/)?.[1] || `${Date.now()}-${i}`;

      // 썸네일 이미지 추출 - 부모 행의 이미지
      let imageUrl = null;
      const row = titleElem.closest('tr');
      if (row.length > 0) {
        const img = row.find('img').first();
        imageUrl = img.attr('src') || img.attr('data-src');
      }

      console.log(`Item ${i}: "${title}"`);

      listings.push({
        title: title || 'PC방 매물',
        source_url: fullDetailUrl,
        source_id: sourceId,
        image_url: imageUrl || '',
        description: '외부 사이트에서 가져온 매물',
        price_type: 'sale',
        price: 1000, // 임시 기본값 (상세페이지에서 업데이트 필요)
        region: extractRegionFromLocation(title) || '서울',
      } as ScrapedListing);
    });

    console.log(`Page ${pageNum}: Successfully found ${listings.length} listings`);
    return listings;
  } catch (error) {
    console.error(`Scraping failed for page ${pageNum}:`, error);
    return [];
  }
}

export async function importListingsToDatabase(listings: ScrapedListing[]) {
  const supabase = await createClient();
  let imported = 0;
  let skipped = 0;

  console.log(`📊 [Import] 시작: ${listings.length}개 매물 처리`);

  for (let idx = 0; idx < listings.length; idx++) {
    const listing = listings[idx];
    try {
      console.log(`[${idx + 1}/${listings.length}] 처리 중: "${listing.title}" (${listing.region}, 가격: ${listing.price})`);

      // 중복 확인 (source_url 기반)
      const { data: existing, error: checkError } = await supabase
        .from('listings')
        .select('id')
        .eq('source_url', listing.source_url);

      if (checkError) {
        console.error(`  ⚠️  중복 확인 실패:`, checkError);
        continue;
      }

      if (existing && existing.length > 0) {
        console.log(`  ⏭️  중복 제외 (source_url: ${listing.source_url})`);
        skipped++;
        continue;
      }

      // 새 매물 등록
      console.log(`  💾 DB에 저장 중...`);
      const { data: inserted, error } = await supabase
        .from('listings')
        .insert([
          {
            title: listing.title,
            description: listing.description || `PC천국에서 가져온 매물`,
            price_type: listing.price_type,
            price: listing.price,
            deposit: listing.deposit || null,
            monthly_rent: listing.monthly_rent || null,
            region: listing.region,
            district: listing.district || null,
            address: listing.address || null,
            area_sqm: listing.area_sqm || null,
            floor: listing.floor || null,
            source_url: listing.source_url,
            thumbnail_url: listing.image_url || null,
            main_image_url: listing.image_url || null,
            status: 'active',
            view_count: 0,
          },
        ])
        .select();

      if (error) {
        console.error(`  ❌ 저장 실패:`, error);
        continue;
      }

      console.log(`  ✅ 저장 완료`);

      // 이미지 추가
      if (listing.image_url && inserted && inserted.length > 0) {
        try {
          const { error: imgError } = await supabase
            .from('listing_images')
            .insert([
              {
                listing_id: inserted[0].id,
                url: listing.image_url,
                is_primary: true,
                order_num: 0,
              },
            ]);

          if (imgError) {
            console.error(`  ⚠️  이미지 저장 실패:`, imgError);
          } else {
            console.log(`  🖼️  이미지 저장 완료`);
          }
        } catch (imgErr) {
          console.error(`  ⚠️  이미지 처리 에러:`, imgErr);
        }
      }

      imported++;
    } catch (err) {
      console.error(`  ❌ 처리 중 에러:`, err);
    }
  }

  console.log(`\n📊 [Import 완료] 추가: ${imported}개, 중복: ${skipped}개, 총: ${listings.length}개`);
  return { imported, skipped, total: listings.length };
}
