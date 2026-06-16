import { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { Button } from '@/components/ui/Button';
import { RegionFilter } from '@/components/listings/RegionFilter';
import { SITE_CONFIG } from '@/lib/site';
import { buildListingsMetadata, addRobotsToMetadata } from '@/lib/seo-metadata';
import { buildCollectionPageSchema } from '@/lib/seo-schema';
import { createCanonicalUrl } from '@/lib/url-utils';
import { getOgImageUrl } from '@/lib/seo-assets';
import { createPublicClient } from '@/lib/supabase/public';
import { getCachedRegionCounts, LISTING_LIST_SELECT } from '@/lib/listing-queries';

export const revalidate = 120;

export async function generateMetadata(
  { searchParams }: Props,
): Promise<Metadata> {
  const { region, page, search } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || '1', 10));
  const hasRegionFilter = region && region !== 'all' && region !== 'undefined';
  const hasFilters = !!hasRegionFilter || !!search || currentPage > 1;

  if (hasFilters) {
    return { robots: { index: false, follow: true } };
  }

  const baseMeta = buildListingsMetadata(region);
  const metaWithRobots = addRobotsToMetadata(baseMeta, {
    googlebot: 'index, follow, max-snippet:-1, max-image-preview:large',
  });
  const ogImage = getOgImageUrl();

  return {
    title: metaWithRobots.title,
    description: metaWithRobots.description,
    keywords: metaWithRobots.keywords,
    authors: [{ name: SITE_CONFIG.managerName }],
    robots: metaWithRobots.robots,
    alternates: {
      canonical: createCanonicalUrl('/listings'),
    },
    openGraph: {
      title: metaWithRobots.ogTitle,
      description: metaWithRobots.ogDescription,
      type: 'website',
      url: `${SITE_CONFIG.url}/listings`,
      locale: 'ko_KR',
      siteName: SITE_CONFIG.businessName,
      images: [
        {
          url: metaWithRobots.ogImage || ogImage,
          width: 1200,
          height: 630,
          alt: `${SITE_CONFIG.businessName} - PC방 매물 목록`,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaWithRobots.ogTitle,
      description: metaWithRobots.ogDescription,
      images: [metaWithRobots.ogImage || ogImage],
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

  const supabase = createPublicClient();

  let dataQuery = supabase
    .from('listings')
    .select(LISTING_LIST_SELECT, { count: 'exact' })
    .eq('status', 'active');

  if (search) {
    dataQuery = dataQuery.ilike('title', `%${search}%`);
  }
  if (region && region !== 'all' && region !== 'undefined') {
    dataQuery = dataQuery.eq('region', region);
  }

  dataQuery = dataQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1);

  const [{ data: allListings, count: totalCount, error: dataError }, regionCounts] =
    await Promise.all([dataQuery, getCachedRegionCounts()]);

  if (dataError) {
    console.error('[Listings Page ERROR]', dataError.message);
  }

  const listingsWithMeta =
    allListings?.map((listing) => ({
      ...listing,
      commentCount: 0,
      favoriteCount: 0,
    })) || [];

  const filteredListings = listingsWithMeta;
  const totalPages = Math.ceil((totalCount || 0) / ITEMS_PER_PAGE);

  const collectionItems = filteredListings.slice(0, 10).map((listing) => ({
    name: listing.title,
    url: `${SITE_CONFIG.url}/listings/${listing.id}`,
    description: `${listing.region} ${listing.district || ''}`,
  }));

  const collectionSchema = buildCollectionPageSchema(
    '성인PC 성인피씨 매물 거래',
    collectionItems,
    `${SITE_CONFIG.url}/listings`
  );

  return (
    <div className="page-shell">
      <Script
        id="collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionSchema),
        }}
      />

      <header className="page-hero">
        <div className="page-hero-inner-wide">
          <nav className="breadcrumb" aria-label="breadcrumb">
            <Link href="/">홈</Link>
            <span className="breadcrumb-sep">/</span>
            <span className="text-text-secondary">PC방 매물</span>
          </nav>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold text-text-primary tracking-tight mb-2">
                PC방 매물
              </h1>
              <p className="text-sm text-text-secondary">
                전체 {totalCount || 0}개 매물
                {region && region !== 'all' && region !== 'undefined' && (
                  <span className="ml-2 text-gold font-semibold">
                    ({region} {filteredListings.length}개 표시 중)
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <form className="flex gap-2">
                <input
                  type="text"
                  name="search"
                  defaultValue={search || ''}
                  placeholder="매물 검색..."
                  className="input-field !py-2 !w-48"
                />
                <button type="submit" className="pagination-btn !bg-gold !text-bg-primary !border-gold">
                  검색
                </button>
              </form>
              <Link href="/listings/new">
                <Button variant="primary" size="sm">
                  매물 등록
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="sticky top-16 z-40 border-b border-border-light bg-bg-secondary/90 backdrop-blur-md">
        <div className="page-container-wide py-3">
          <h2 className="text-text-muted font-semibold text-xs mb-2 uppercase tracking-widest">지역</h2>
          <RegionFilter selectedRegion={region || 'all'} regionCounts={regionCounts} />
        </div>
      </section>

      <section className="page-container-wide py-8">
        <ListingGrid listings={filteredListings} />
      </section>

      {totalPages > 1 && (
        <section className="page-container-wide py-8">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {currentPage > 1 && (
              <Link
                href={`/listings?${search ? `search=${encodeURIComponent(search)}&` : ''}${region && region !== 'all' && region !== 'undefined' ? `region=${encodeURIComponent(region)}&` : ''}page=${currentPage - 1}`}
              >
                <button className="pagination-btn">이전</button>
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
                      className={`px-3 py-2 rounded-xl text-sm transition ${
                        currentPage === pageNum ? 'pagination-btn-active' : 'pagination-btn'
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
                <button className="pagination-btn">다음</button>
              </Link>
            )}
          </div>

          <div className="text-center mt-4 text-text-muted text-sm">
            {currentPage} / {totalPages} 페이지
          </div>
        </section>
      )}
    </div>
  );
}
