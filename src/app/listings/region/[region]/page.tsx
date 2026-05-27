import { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { createClient } from '@/lib/supabase/server';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { Button } from '@/components/ui/Button';
import { REGIONS } from '@/types';
import { SITE_CONFIG } from '@/lib/site';

export const revalidate = 0;

interface Props {
  params: Promise<{ region: string }>;
  searchParams: Promise<{ page?: string; search?: string }>;
}

const ITEMS_PER_PAGE = 20;

function buildRegionTitle(region: string, count: number): string {
  return `${region} 성인PC방 매매·양도양수 매물 ${count}개`;
}

function buildRegionDescription(region: string, count: number): string {
  return `${region} 성인PC방 ${count}개 매물. 권리금·보증금·월세 정보와 함께 PC방 매매, 임대, 양도양수 정보를 성피요에서 확인하세요.`.slice(0, 160);
}

function buildRegionKeywords(region: string): string {
  return [
    `${region} 성인PC방`,
    `${region} PC방 매매`,
    `${region} 성인피씨`,
    `${region} PC방 창업`,
    `${region} 성인PC방 양도양수`,
    `${region} PC방 임대`,
    `${region} 성인피시방`,
    '성인PC 매매',
    '성인PC방 창업',
    '성피요',
  ].join(', ');
}

function buildRegionSeoText(region: string, count: number): string {
  return `${region} 지역 성인PC방 매물 ${count}개를 성피요에서 확인하세요. ` +
    `${region} PC방 매매, 임대, 양도양수 매물의 권리금·보증금·월세 정보를 투명하게 공개합니다. ` +
    `안전하고 신뢰할 수 있는 성인PC 거래 플랫폼입니다.`;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { region } = await params;
  const { search } = await searchParams;
  const decodedRegion = decodeURIComponent(region);
  const supabase = await createClient();

  // 검색 결과 페이지는 noindex 처리
  if (search) {
    return {
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const { count } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('region', decodedRegion)
    .eq('status', 'active');

  const listingCount = count || 0;

  // 매물이 없는 지역은 noindex 처리
  if (listingCount === 0) {
    return {
      title: `${decodedRegion} PC방 매물 | 성피요`,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = buildRegionTitle(decodedRegion, listingCount);
  const description = buildRegionDescription(decodedRegion, listingCount);
  const keywords = buildRegionKeywords(decodedRegion);

  return {
    title,
    description,
    keywords,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/listings/region/${encodeURIComponent(decodedRegion)}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_CONFIG.url}/listings/region/${encodeURIComponent(decodedRegion)}`,
      siteName: SITE_CONFIG.businessName,
      images: [
        {
          url: `${SITE_CONFIG.url}/og-listings.png`,
          width: 1200,
          height: 630,
          alt: `${decodedRegion} PC방 매물 - 성피요`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_CONFIG.url}/og-listings.png`],
    },
  };
}

export async function generateStaticParams() {
  return REGIONS.map((region) => ({
    region: encodeURIComponent(region),
  }));
}

export default async function RegionListingsPage({ params, searchParams }: Props) {
  const { region } = await params;
  const { page, search } = await searchParams;
  const decodedRegion = decodeURIComponent(region);
  const currentPage = Math.max(1, parseInt(page || '1', 10));
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const supabase = await createClient();

  // 전체 개수 조회 (count 전용)
  let countQ = supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('region', decodedRegion);

  if (search) {
    countQ = countQ.ilike('title', `%${search}%`);
  }

  const { count: totalCount } = await countQ;

  // 매물 조회를 위한 쿼리 빌더
  const buildQuery = () => {
    let q = supabase
      .from('listings')
      .select('id, title, price_type, price, region, district, area_sqm, pc_count, deposit, premium_price, monthly_rent, monthly_revenue, monthly_profit, view_count, created_at, thumbnail_url, main_image_url, status, listing_images(id, url, order_num)')
      .eq('status', 'active')
      .eq('region', decodedRegion);

    if (search) {
      q = q.ilike('title', `%${search}%`);
    }

    q = q.order('created_at', { ascending: false });
    return q;
  };

  // 페이지네이션 적용 데이터 조회
  const dataQuery = buildQuery();
  const { data: allListings } = await dataQuery.range(offset, offset + ITEMS_PER_PAGE - 1);

  // 각 listing의 댓글 개수와 좋아요 개수 조회
  const listingIds = allListings?.map(l => l.id) || [];

  let commentCounts: Record<string, number> = {};
  let favoriteCounts: Record<string, number> = {};

  if (listingIds.length > 0) {
    // 댓글 개수
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

  const listingCount = totalCount || 0;
  const totalPages = Math.ceil((totalCount || 0) / ITEMS_PER_PAGE);
  const filteredListings = listingsWithMeta;

  // CollectionPage JSON-LD Schema
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_CONFIG.url}/listings/region/${region}`,
    name: `${decodedRegion} PC방 매물`,
    description: `${decodedRegion} 지역 성인PC방 매물`,
    url: `${SITE_CONFIG.url}/listings/region/${region}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: filteredListings?.slice(0, 10).map((listing: any, idx: number) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${SITE_CONFIG.url}/listings/${listing.id}`,
        name: listing.title,
        description: `${listing.region} ${listing.district || ''} - ${listing.price}만원`,
      })) || [],
    },
  };

  // BreadcrumbList JSON-LD Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: '홈',
        item: SITE_CONFIG.url,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '성인PC 매물',
        item: `${SITE_CONFIG.url}/listings`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${decodedRegion} PC방 매물`,
        item: `${SITE_CONFIG.url}/listings/region/${encodeURIComponent(decodedRegion)}`,
      },
    ],
  };

  // LocalBusiness JSON-LD Schema
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `${decodedRegion} PC방 매물 - ${SITE_CONFIG.businessName}`,
    description: `${decodedRegion} 지역의 성인 PC방 매물 ${listingCount}개`,
    url: `${SITE_CONFIG.url}/listings/region/${encodeURIComponent(decodedRegion)}`,
    telephone: SITE_CONFIG.phone,
    image: `${SITE_CONFIG.url}/423432.png`,
    areaServed: decodedRegion,
    priceRange: '**',
  };

  return (
    <div className="bg-bg-primary min-h-screen">
      <Script
        id="region-collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <Script
        id="region-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="region-local-business-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      {/* Header */}
      <section className="bg-gradient-to-br from-bg-secondary via-bg-primary to-bg-primary border-b border-border-light">
        <div className="max-w-full mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
            <div className="flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-text-primary mb-1">
                {decodedRegion} PC방 매매·양도양수 매물
              </h1>
              {!search && (
                <p className="text-text-secondary text-sm max-w-2xl">
                  {buildRegionSeoText(decodedRegion, listingCount)}
                </p>
              )}
              {search && (
                <p className="text-sm text-text-secondary font-light">
                  "{search}" 검색 결과 {listingCount}개
                </p>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <form className="flex gap-2" action={`/listings/region/${region}`} method="GET">
                <input
                  type="text"
                  name="search"
                  defaultValue={search || ''}
                  placeholder="지역 내 검색..."
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

      {/* Back Button */}
      <section className="max-w-full mx-auto px-4 lg:px-8 py-4">
        <Link href="/listings" className="text-gold hover:text-opacity-80 text-sm">
          ← 전체 매물로 돌아가기
        </Link>
      </section>

      {/* Listings Grid */}
      <section className="max-w-full mx-auto px-4 lg:px-8 py-6">
        {listingCount > 0 ? (
          <ListingGrid listings={filteredListings as any} />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              {search ? '검색 결과가 없습니다' : `${decodedRegion} PC방 창업 정보`}
            </h2>
            <p className="text-text-secondary mb-6">
              {search
                ? `"${search}"에 해당하는 매물이 없습니다.`
                : '현재 등록된 매물이 없습니다. 전국 매물을 확인하거나 새 매물을 등록해주세요.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/listings">
                <Button variant="primary">전국 매물 보기</Button>
              </Link>
              <Link href="/listings/new">
                <Button variant="secondary">새 매물 등록</Button>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Pagination */}
      {totalPages > 1 && listingCount > 0 && (
        <section className="max-w-full mx-auto px-4 lg:px-8 py-8">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {currentPage > 1 && (
              <Link
                href={`/listings/region/${region}?${search ? `search=${encodeURIComponent(search)}&` : ''}page=${currentPage - 1}`}
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
                    href={`/listings/region/${region}?${search ? `search=${encodeURIComponent(search)}&` : ''}page=${pageNum}`}
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
                href={`/listings/region/${region}?${search ? `search=${encodeURIComponent(search)}&` : ''}page=${currentPage + 1}`}
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
