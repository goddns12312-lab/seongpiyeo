import { notFound } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { unstable_noStore as noStore } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public';
import { LISTING_LIST_SELECT } from '@/lib/listing-queries';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { Button } from '@/components/ui/Button';
import { SITE_CONFIG } from '@/lib/site';
import { getListingPublicPath } from '@/lib/listing-url';
import { createFreshSeed, orderListingsFresh } from '@/lib/fresh-listing-order';

export const revalidate = 3600; // 1시간마다 재검증

interface Props {
  params: Promise<{ region: string; category: string }>;
}

const ITEMS_PER_PAGE = 20;

const PRICE_TYPE_LABELS: Record<string, string> = {
  lease: '임대',
  sale: '매매',
  transfer: '양도양수',
};

function buildRegionCategoryTitle(region: string, category: string, count: number): string {
  const categoryLabel = PRICE_TYPE_LABELS[category] || category;
  return `${region} 성인PC ${categoryLabel} 매물 ${count}개`;
}

function buildRegionCategorySeoText(region: string, category: string, count: number): string {
  const categoryLabel = PRICE_TYPE_LABELS[category] || category;
  return `${region} 지역 성인PC ${categoryLabel} 매물 ${count}개를 성피요에서 확인하세요. ` +
    `최신 매물과 조건을 비교할 수 있습니다.`;
}

export default async function ListingsRegionCategoryPage({ params }: Props) {
  noStore();

  const { region, category } = await params;
  const decodedRegion = decodeURIComponent(region);
  const decodedCategory = decodeURIComponent(category);

  const supabase = createPublicClient();

  const { data: allListings, count: totalCount } = await supabase
    .from('listings')
    .select(LISTING_LIST_SELECT, { count: 'exact' })
    .eq('status', 'active')
    .eq('region', decodedRegion)
    .eq('price_type', decodedCategory)
    .order('created_at', { ascending: false })
    .range(0, ITEMS_PER_PAGE - 1);

  const listingCount = totalCount || 0;

  // Thin Content 정책: 콘텐츠 0개면 404
  if (listingCount === 0) {
    notFound();
  }

  const listingsWithMeta =
    allListings?.map((listing) => ({
      ...listing,
      commentCount: 0,
      favoriteCount: 0,
    })) || [];

  const freshListings = orderListingsFresh(listingsWithMeta, {
    seed: createFreshSeed(),
    groupBy: (listing) => listing.district || listing.region || listing.price_type,
  });

  const categoryLabel = PRICE_TYPE_LABELS[decodedCategory] || decodedCategory;
  const title = buildRegionCategoryTitle(decodedRegion, decodedCategory, listingCount);
  const seoText = buildRegionCategorySeoText(decodedRegion, decodedCategory, listingCount);

  // CollectionPage JSON-LD Schema
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_CONFIG.url}/pc-bangs/${encodeURIComponent(decodedRegion)}/${encodeURIComponent(decodedCategory)}`,
    name: `${decodedRegion} 성인PC ${categoryLabel} 매물`,
    description: `${decodedRegion} 지역 성인PC ${categoryLabel} 매물`,
    url: `${SITE_CONFIG.url}/pc-bangs/${encodeURIComponent(decodedRegion)}/${encodeURIComponent(decodedCategory)}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: freshListings?.slice(0, 10).map((listing: any, idx: number) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${SITE_CONFIG.url}${getListingPublicPath(listing.region, listing.id)}`,
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
        item: `${SITE_CONFIG.url}/pc-bangs`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${decodedRegion} PC방 매물`,
        item: `${SITE_CONFIG.url}/pc-bangs/${encodeURIComponent(decodedRegion)}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: `${decodedRegion} 성인PC ${categoryLabel}`,
        item: `${SITE_CONFIG.url}/pc-bangs/${encodeURIComponent(decodedRegion)}/${encodeURIComponent(decodedCategory)}`,
      },
    ],
  };

  return (
    <div className="bg-bg-primary min-h-screen">
      <Script
        id="region-category-collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <Script
        id="region-category-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Header */}
      <section className="bg-gradient-to-br from-bg-secondary via-bg-primary to-bg-primary border-b border-border-light">
        <div className="max-w-full mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col gap-2 mb-4">
            <Link href={`/pc-bangs/${encodeURIComponent(decodedRegion)}`} className="text-gold hover:text-gold/80 text-sm">
              ← {decodedRegion} 전체 매물로
            </Link>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
            <div className="flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-text-primary mb-1">
                {title}
              </h1>
              <p className="text-text-secondary text-sm max-w-2xl">
                {seoText}
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <Link href="/pc-bangs/new">
                <Button variant="primary" size="sm">매물 등록</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Back Button */}
      <section className="max-w-full mx-auto px-4 lg:px-8 py-4">
        <Link href="/pc-bangs" className="text-gold hover:text-opacity-80 text-sm">
          ← 전체 매물로 돌아가기
        </Link>
      </section>

      {/* Listings Grid */}
      <section className="max-w-full mx-auto px-4 lg:px-8 py-6">
        {listingCount > 0 ? (
          <ListingGrid listings={freshListings as any} />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              현재 매물이 없습니다
            </h2>
            <p className="text-text-secondary mb-6">
              다른 지역의 매물을 확인하거나 새로운 매물을 등록해주세요.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/pc-bangs">
                <Button variant="primary">전국 매물 보기</Button>
              </Link>
              <Link href="/pc-bangs/new">
                <Button variant="secondary">새 매물 등록</Button>
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
