import { scrapePC천국, importListingsToDatabase } from '@/lib/scrapers/pccheongguk';
import { revalidatePath } from 'next/cache';

const REGIONS = [
  '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종',
  '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
];

export async function POST(request: Request) {
  try {
    const { startPage = 1, endPage = 8, regions = [] } = await request.json().catch(() => ({}));

    // 여러 페이지 크롤링
    const allListings = [];
    const regionsToScrape = Array.isArray(regions) && regions.length > 0 ? regions : REGIONS;

    console.log(`🔍 크롤링 시작: ${regionsToScrape.join(', ')} (페이지 ${startPage}-${endPage})`);

    for (const region of regionsToScrape) {
      for (let p = startPage; p <= endPage; p++) {
        console.log(`📍 ${region} 페이지 ${p} 크롤링...`);
        try {
          const listings = await scrapePC천국(p, region);
          allListings.push(...listings);
          // 페이지 간 딜레이
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (pageError) {
          console.error(`페이지 ${p} 크롤링 실패:`, pageError);
        }
      }
    }

    console.log(`✅ 총 ${allListings.length}개 매물 수집됨`);

    // 데이터베이스에 저장
    const result = await importListingsToDatabase(allListings);

    // 캐시 무효화
    revalidatePath('/');
    revalidatePath('/listings');
    revalidatePath('/admin');

    // 추출된 매물 상세 정보 출력
    const listingDetails = allListings.slice(0, 5).map(l => ({
      title: l.title,
      region: l.region,
      price: l.price,
      hasImage: !!l.image_url,
      imageUrl: l.image_url || 'null',
      sourceUrl: l.source_url,
    }));

    return Response.json({
      success: true,
      scraped: allListings.length,
      imported: result.imported,
      skipped: result.skipped,
      message: `${result.imported}개 매물 추가됨, ${result.skipped}개 중복 제외`,
      details: listingDetails,
    });
  } catch (error) {
    console.error('Scraper error:', error);
    return Response.json(
      { error: String(error), success: false },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    message: 'POST 요청으로 크롤링 시작: { startPage: 1, endPage: 8, regions: ["서울", "경기"] }',
  });
}
