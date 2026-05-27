import { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { createClient } from '@/lib/supabase/server';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { Button } from '@/components/ui/Button';
import { REGIONS } from '@/types';
import { RegionFilter } from '@/components/listings/RegionFilter';

// 매물 목록 캐시 비활성화 (항상 최신 데이터)
export const revalidate = 0;

export async function generateMetadata(
  { searchParams }: Props,
  parent: any
): Promise<Metadata> {
  const { region } = await searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const regionTitle = region && region !== 'all' && region !== 'undefined'
    ? `${region} PC방 매물 | `
    : '';

  return {
    title: `${regionTitle}성인PC 성인피씨 성인피시 매물 | 창업 정보 | 성피요`,
    description: `${regionTitle ? `${region} 지역의 ` : '전국'}성인PC 성인피씨 성인피시 매물 거래 정보 | PC방 창업, 매매, 임대 정보 한눈에 | 성피요 매물 검색`,
    keywords: [`성인PC${regionTitle ? `${region}` : '매물'}`, '성인피씨', '성인피시', 'PC방창업정보', '성인피시방', '피시창업', 'PC방매매', '성인PC거래', '매물거래'],
    authors: [{ name: '성피요' }],
    robots: {
      index: true,
      follow: true,
      nocache: false,
    },
    alternates: {
      canonical: `${baseUrl}/listings${region && region !== 'all' && region !== 'undefined' ? `/region/${encodeURIComponent(region)}` : ''}`,
    },
    openGraph: {
      title: `${regionTitle}성인PC 성인피씨 성인피시 매물 | 성피요`,
      description: `${regionTitle ? `${region} 지역의 ` : '전국'}성인PC 성인피씨 성인피시 매물 거래 정보 - 매매/임대/창업정보`,
      type: 'website',
      url: `${baseUrl}/listings${region && region !== 'all' && region !== 'undefined' ? `?region=${encodeURIComponent(region)}` : ''}`,
      locale: 'ko_KR',
      siteName: '성피요',
      images: [
        {
          url: `${baseUrl}/og-listings.png`,
          width: 1200,
          height: 630,
          alt: `${regionTitle}성피요 매물 목록`,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${regionTitle}성인PC 성인피씨 성인피시 매물 | 성피요`,
      description: `${regionTitle ? `${region} 지역의 ` : '전국'}성인PC 성인피씨 성인피시 매물 거래 정보`,
      images: [`${baseUrl}/twitter-listings.png`],
    },
  };
}

interface Props {
  searchParams: Promise<{ region?: string; page?: string; search?: string }>;
}

const ITEMS_PER_PAGE = 20;

export default async function ListingsPage({ searchParams }: Props) {
  const { region, page, search } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || '1', 10));
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const supabase = await createClient();

  // 전체 개수 조회 (count 전용)
  let countQ = supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');

  if (search) {
    countQ = countQ.ilike('title', `%${search}%`);
  }
  if (region && region !== 'all' && region !== 'undefined') {
    countQ = countQ.eq('region', region);
  }

  const { count: totalCount } = await countQ;

  // 매물 조회를 위한 쿼리 빌더
  const buildQuery = () => {
    let q = supabase
      .from('listings')
      .select('id, title, price_type, price, region, district, area_sqm, pc_count, deposit, premium_price, monthly_rent, monthly_revenue, monthly_profit, view_count, created_at, thumbnail_url, main_image_url, status, listing_images(id, url, order_num)')
      .eq('status', 'active');

    if (search) {
      q = q.ilike('title', `%${search}%`);
    }

    if (region && region !== 'all' && region !== 'undefined') {
      q = q.eq('region', region);
    }

    // ✅ 정렬을 마지막에 명시적으로 적용 (모든 필터 후)
    q = q.order('created_at', { ascending: false });

    return q;
  };

  console.log('[Listings Page Debug]', {
    search,
    region,
    page: currentPage,
    totalCount,
    offset,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  // 페이지네이션 적용 데이터 조회
  const dataQuery = buildQuery();
  const { data: allListings } = await dataQuery.range(offset, offset + ITEMS_PER_PAGE - 1);

  // ✅ 서버에서 반환된 데이터 로깅 (첫 5개만)
  if (allListings && allListings.length > 0) {
    console.log('\n[Listings Query Result] 첫 5개:');
    allListings.slice(0, 5).forEach((l, i) => {
      console.log(`${i + 1}. idx=${l.idx} | title=${l.title.substring(0, 30)} | created_at=${l.created_at}`);
    });
  }

  // 각 listing의 댓글 개수와 좋아요 개수 조회
  const listingIds = allListings?.map(l => l.id) || [];

  let commentCounts: Record<string, number> = {};
  let favoriteCounts: Record<string, number> = {};

  if (listingIds.length > 0) {
    // 댓글 개수 (RLS의 .in() 호환성 문제로 전체 조회 후 필터링)
    const { data: allComments } = await supabase
      .from('listing_comments')
      .select('listing_id')
      .eq('status', 'active');

    allComments?.forEach(c => {
      if (listingIds.includes(c.listing_id)) {
        commentCounts[c.listing_id] = (commentCounts[c.listing_id] || 0) + 1;
      }
    });

    // 좋아요 개수
    const { data: allFavorites } = await supabase
      .from('favorites')
      .select('listing_id');

    allFavorites?.forEach(f => {
      if (listingIds.includes(f.listing_id)) {
        favoriteCounts[f.listing_id] = (favoriteCounts[f.listing_id] || 0) + 1;
      }
    });
  }

  // 리스팅에 메타데이터 추가
  const listingsWithMeta = allListings?.map(listing => ({
    ...listing,
    commentCount: commentCounts[listing.id] || 0,
    favoriteCount: favoriteCounts[listing.id] || 0
  })) || [];

  // 전체 지역별 개수 조회 (페이지네이션 전)
  const { data: allRegionListings } = await supabase
    .from('listings')
    .select('id, region')
    .eq('status', 'active');

  const regionCounts: Record<string, number> = {};
  REGIONS.forEach((r) => {
    regionCounts[r] = allRegionListings?.filter((l) => l.region === r).length || 0;
  });

  const filteredListings = listingsWithMeta || [];
  const totalPages = Math.ceil((totalCount || 0) / ITEMS_PER_PAGE);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${baseUrl}/listings`,
    name: 'PC방 매물 | 성인PC 성인피씨 매물 거래',
    description: '전국 성인PC 성인피씨 성인피시 매물 거래 정보. PC방 창업, 매매, 임대 정보.',
    url: `${baseUrl}/listings`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: filteredListings.slice(0, 10).map((listing, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${baseUrl}/listings/${listing.id}`,
        name: listing.title,
        description: `${listing.region} ${listing.district || ''} - ${listing.price}만원`,
      })),
    },
  };

  return (
    <div className="bg-bg-primary min-h-screen">
      <Script
        id="collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionSchema),
        }}
      />
      {/* Header */}
      <section className="bg-gradient-to-br from-bg-secondary via-bg-primary to-bg-primary border-b border-border-light">
        <div className="max-w-full mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
            <div className="flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-text-primary mb-1">
                PC방 매물
              </h1>
              <p className="text-sm text-text-secondary font-light">
                전체 {totalCount || 0}개 매물
                {region && region !== 'all' && region !== 'undefined' && (
                  <span className="ml-2 text-gold-light font-semibold">({region} {filteredListings.length}개 표시 중)</span>
                )}
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <form className="flex gap-2">
                <input
                  type="text"
                  name="search"
                  defaultValue={search || ''}
                  placeholder="매물 검색..."
                  className="px-3 py-2 bg-bg-tertiary border border-border-light rounded text-text-primary placeholder-text-muted focus:outline-none focus:border-gold text-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gold text-bg-primary rounded text-sm font-semibold hover:bg-gold-light transition"
                >
                  검색
                </button>
              </form>
              <Link href="/listings/new">
                <Button variant="primary" size="sm">매물 등록</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="bg-gradient-to-r from-bg-secondary to-bg-tertiary sticky top-16 z-40 border-b border-border-accent backdrop-blur-sm bg-opacity-95">
        <div className="max-w-full mx-auto px-4 lg:px-8 py-2">
          <h3 className="text-text-primary font-semibold text-xs mb-1.5 uppercase tracking-widest opacity-75">지역</h3>
          <RegionFilter selectedRegion={region || 'all'} regionCounts={regionCounts} />
        </div>
      </section>

      {/* Listings Grid */}
      <section className="max-w-full mx-auto px-4 lg:px-8 py-6">
        <ListingGrid listings={filteredListings} />
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <section className="max-w-full mx-auto px-4 lg:px-8 py-8">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {currentPage > 1 && (
              <Link
                href={`/listings?${search ? `search=${encodeURIComponent(search)}&` : ''}${region && region !== 'all' && region !== 'undefined' ? `region=${encodeURIComponent(region)}&` : ''}page=${currentPage - 1}`}
              >
                <button className="px-4 py-2 bg-bg-secondary border border-border-light text-text-primary rounded hover:bg-bg-tertiary transition">
                  이전
                </button>
              </Link>
            )}

            <div className="flex gap-1 flex-wrap justify-center">
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                const pageNum = currentPage > 5 ? currentPage - 5 + i : i + 1;
                return pageNum <= totalPages ? (
                  <Link
                    key={pageNum}
                    href={`/listings?${search ? `search=${encodeURIComponent(search)}&` : ''}${region && region !== 'all' && region !== 'undefined' ? `region=${encodeURIComponent(region)}&` : ''}page=${pageNum}`}
                  >
                    <button
                      className={`px-3 py-2 rounded transition ${
                        currentPage === pageNum
                          ? 'bg-gold text-bg-primary font-semibold'
                          : 'bg-bg-secondary border border-border-light text-text-primary hover:bg-bg-tertiary'
                      }`}
                    >
                      {pageNum}
                    </button>
                  </Link>
                ) : null;
              })}
            </div>

            {currentPage < totalPages && (
              <Link
                href={`/listings?${search ? `search=${encodeURIComponent(search)}&` : ''}${region && region !== 'all' && region !== 'undefined' ? `region=${encodeURIComponent(region)}&` : ''}page=${currentPage + 1}`}
              >
                <button className="px-4 py-2 bg-bg-secondary border border-border-light text-text-primary rounded hover:bg-bg-tertiary transition">
                  다음
                </button>
              </Link>
            )}
          </div>

          <div className="text-center mt-4 text-text-secondary text-sm">
            {currentPage} / {totalPages} 페이지
          </div>
        </section>
      )}
    </div>
  );
}
