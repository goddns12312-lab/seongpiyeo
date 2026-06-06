import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatPrice, formatDate } from '@/lib/utils';
import { SITE_CONFIG } from '@/lib/site';
import { Listing } from '@/types';
import { ImageGallery } from '@/components/listings/ImageGallery';
import { ListingActions } from '@/components/listings/ListingActions';
import { LikeButton } from '@/components/listings/LikeButton';
import ListingCommentSection from '@/components/listings/ListingCommentSection';
import { buildListingProductSchema, buildBreadcrumbSchema } from '@/lib/seo-schema';
import { buildOptimizedListingTitle, buildListingSeoTitle, buildListingSeoDescription } from '@/lib/seo-metadata';
import { RelatedListings } from '@/components/listings/RelatedListings';
import { AdjacentRegions } from '@/components/listings/AdjacentRegions';
import { REGIONS } from '@/types';

interface Props {
  params: Promise<{ id: string }>;
}

// SEO 헬퍼 함수들
function buildPriceDescription(listing: any): string {
  const parts: string[] = [];
  if (listing.premium_price) parts.push(`권리금 ${listing.premium_price.toLocaleString()}만원`);
  if (listing.deposit) parts.push(`보증금 ${listing.deposit.toLocaleString()}만원`);
  if (listing.monthly_rent) parts.push(`월세 ${listing.monthly_rent.toLocaleString()}만원`);
  return parts.join(', ');
}

function buildSpecDescription(listing: any): string {
  const parts: string[] = [];
  if (listing.area_sqm) parts.push(`${listing.area_sqm}평`);
  if (listing.pc_count) parts.push(`PC ${listing.pc_count}대`);
  return parts.join(' ');
}

function buildKeywords(listing: any, location: string): string {
  const base = [
    '성인피씨',
    '성인피시',
    '성인피씨창업',
    '성인pc',
    `${location} 성인피씨`,
    `${location} 성인PC`,
    `${location} PC방`,
    `${listing.region} PC방 매물`,
    '성인PC 매매',
    '성인피씨 창업',
    '성인피시방 매물',
    'PC방 양도양수',
    'PC방 매매',
  ];
  if (listing.district) base.push(`${listing.district} PC방`, `${listing.district} 성인PC`);
  return base.join(', ');
}

function resolveOgImage(listing: any, baseUrl: string): string {
  return (listing as any).main_image_url
    || listing.thumbnail_url
    || listing.listing_images?.[0]?.url
    || `${baseUrl}/og-listings.png`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = SITE_CONFIG.url;
  const supabase = await createClient();

  // 1번 쿼리로 listing + listing_images 동시 조회
  const { data: listing } = await supabase
    .from('listings')
    .select('*, listing_images(url, order_num)')
    .eq('id', id)
    .single();

  // 매물 없음 → noindex
  if (!listing) {
    return {
      title: '매물을 찾을 수 없습니다',
      robots: { index: false, follow: false },
    };
  }

  // 비활성 매물 (sold, pending, hidden) → noindex
  if (listing.status !== 'active') {
    return {
      title: `${listing.title} | ${SITE_CONFIG.businessName}`,
      robots: { index: false, follow: false },
    };
  }

  // SEO 문구 자동 생성 (최적화 함수)
  const location = [listing.region, listing.district].filter(Boolean).join(' ');
  const priceDesc = buildPriceDescription(listing);
  const specs = buildSpecDescription(listing);

  // TOP 1-3: 최적화된 Title, Description 생성
  const title = buildListingSeoTitle(listing); // 60자 내외
  const description = buildListingSeoDescription(listing); // 120~160자

  const keywords = buildKeywords(listing, location);
  const ogImage = resolveOgImage(listing, baseUrl);

  return {
    title,
    description,
    keywords,
    authors: [{ name: SITE_CONFIG.businessName }],
    creator: SITE_CONFIG.businessName,
    publisher: SITE_CONFIG.businessName,
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: `${baseUrl}/listings/${id}`,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${baseUrl}/listings/${id}`,
      locale: 'ko_KR',
      siteName: SITE_CONFIG.businessName,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      publishedTime: listing.created_at,
      modifiedTime: listing.updated_at || listing.created_at,
      section: '성인PC 매물',
      tags: keywords.split(', ').slice(0, 5),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Get listing
  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single();

  if (!listing || listing.status !== 'active') {
    notFound();
  }

  // Get images
  const { data: images } = await supabase
    .from('listing_images')
    .select('*')
    .eq('listing_id', id)
    .order('order_num', { ascending: true });

  // listing_images에서 이미지 배열 사용 (최우선)
  let displayImages = images || [];

  // main_image_url이 유효하면 추가 (placeholder 제외)
  if ((listing as any).main_image_url &&
      !(listing as any).main_image_url.includes('placeholder') &&
      !displayImages.some(img => img.url === (listing as any).main_image_url)) {
    displayImages = [
      { id: 'main', url: (listing as any).main_image_url, order_num: 0, listing_id: id },
      ...displayImages
    ];
  }

  // listing_images도 없으면 thumbnail_url 사용
  if (displayImages.length === 0 && (listing as any).thumbnail_url &&
      !(listing as any).thumbnail_url.includes('placeholder')) {
    displayImages = [
      { id: 'thumb', url: (listing as any).thumbnail_url, order_num: 0, listing_id: id }
    ];
  }

  // DEBUG: 렌더링 직전 데이터 상태 확인
  console.log('[SERVER] Listing Detail Page - UUID:', id);
  console.log('[SERVER] premium_price:', (listing as any).premium_price);
  console.log('[SERVER] main_image_url:', (listing as any).main_image_url);
  console.log('[SERVER] displayImages count:', displayImages.length);
  console.log('[SERVER] displayImages[0]:', displayImages[0]?.url?.split('/').pop());
  console.log('[SERVER] displayImages full:', displayImages.map((i: any) => ({
    id: i.id,
    url: i.url?.split('/').pop(),
    order_num: i.order_num
  })));

  // Get seller info
  const { data: seller } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', listing.user_id)
    .single();

  // Get sidebar banners
  const { data: banners } = await supabase
    .from('banners')
    .select('*')
    .in('position', ['sidebar', 'listing-detail-sidebar'])
    .eq('is_active', true)
    .order('order_num', { ascending: true });

  // Get listing comments
  const { data: comments } = await supabase
    .from('listing_comments')
    .select('*')
    .eq('listing_id', id)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  // Get related listings: prefer district, fallback to region
  // Step 1: Try to get same district listings
  let relatedListings = [];

  if (listing.district) {
    const { data: districtListings } = await supabase
      .from('listings')
      .select('id, title, region, district, monthly_rent, deposit, premium_price, main_image_url, created_at')
      .eq('region', listing.region)
      .eq('district', listing.district)
      .eq('status', 'active')
      .neq('id', id)
      .order('created_at', { ascending: false })
      .limit(6);

    relatedListings = districtListings || [];

    // Step 2: If fewer than 3 district listings, add region listings (excluding district)
    if (relatedListings.length < 3) {
      const { data: regionListings } = await supabase
        .from('listings')
        .select('id, title, region, district, monthly_rent, deposit, premium_price, main_image_url, created_at')
        .eq('region', listing.region)
        .eq('status', 'active')
        .neq('id', id)
        .order('created_at', { ascending: false })
        .limit(6);

      const combined = [
        ...relatedListings,
        ...(regionListings?.filter(r => r.district !== listing.district) || [])
      ];
      relatedListings = combined.slice(0, 6);
    }
  } else {
    // No district: get same region listings
    const { data: regionListings } = await supabase
      .from('listings')
      .select('id, title, region, district, monthly_rent, deposit, premium_price, main_image_url, created_at')
      .eq('region', listing.region)
      .eq('status', 'active')
      .neq('id', id)
      .order('created_at', { ascending: false })
      .limit(6);

    relatedListings = regionListings || [];
  }

  // Get region listing counts (for adjacent regions widget)
  const { data: regionCounts } = await supabase
    .from('listings')
    .select('region')
    .eq('status', 'active');

  const regionListingCounts: Record<string, number> = {};
  REGIONS.forEach(region => {
    regionListingCounts[region] = 0;
  });
  regionCounts?.forEach(item => {
    if (item.region) {
      regionListingCounts[item.region] = (regionListingCounts[item.region] || 0) + 1;
    }
  });

  const currentRegionCount = regionListingCounts[listing.region] || 0;

  // Increment view count
  await supabase
    .from('listings')
    .update({ view_count: listing.view_count + 1 })
    .eq('id', id);

  // JSON-LD Product Schema (SEO 스키마 빌더 사용)
  const productSchema = buildListingProductSchema(listing);

  // Breadcrumb Schema (district 포함)
  const breadcrumbItems = [
    { name: '홈', url: SITE_CONFIG.url },
    { name: '매물 목록', url: `${SITE_CONFIG.url}/listings` },
    { name: listing.region, url: `${SITE_CONFIG.url}/listings?region=${encodeURIComponent(listing.region)}` },
  ];

  if (listing.district) {
    breadcrumbItems.push({
      name: listing.district,
      url: `${SITE_CONFIG.url}/listings?region=${encodeURIComponent(listing.region)}&district=${encodeURIComponent(listing.district)}`,
    });
  }

  breadcrumbItems.push({
    name: listing.title,
    url: `${SITE_CONFIG.url}/listings/${id}`,
  });

  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems);

  return (
    <div className="bg-bg-primary min-h-screen py-12">
      {/* JSON-LD Scripts */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="max-w-5xl mx-auto px-4">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex gap-2 text-sm text-text-secondary mb-6">
          <Link href="/" className="hover:text-gold">홈</Link>
          <span>/</span>
          <Link href="/listings" className="hover:text-gold">매물</Link>
          <span>/</span>
          <span>{listing.region}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Images */}
            {/* DEBUG: ImageGallery에 전달되는 images 배열 확인 */}
            {console.log('[DETAIL IMAGES - FINAL]', {
              uuid: listing.id,
              count: displayImages.length,
              images: displayImages.map((i: any) => ({
                id: i.id,
                order_num: i.order_num,
                filename: i.url?.split('/').pop()
              }))
            })}
            <ImageGallery images={displayImages} title={listing.title} listing={listing} />

            {/* Title Section */}
            <div className="mb-4">
              <div className="flex gap-2 mb-2 flex-wrap">
                <Badge variant="secondary">{listing.region}</Badge>
                {listing.district && <Badge variant="secondary">{listing.district}</Badge>}
              </div>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary break-words">{listing.title}</h1>
                <div className="flex gap-2 items-center flex-shrink-0">
                  <LikeButton listingId={listing.id} />
                  <ListingActions listingId={listing.id} userId={listing.user_id} />
                </div>
              </div>
            </div>

            {/* Price Details - Main Focus */}
            <div className="bg-bg-secondary border border-border-light rounded-lg p-6 mb-6">
              {/* 월세가 있으면 월세를 메인으로 표시, 없으면 권리금 표시 */}
              {listing.monthly_rent ? (
                // 월세 있음 - 월세를 메인으로
                <div className="space-y-4">
                  {/* 월세 - 메인 */}
                  <div className="pb-4 border-b border-border-light/30">
                    <p className="text-text-secondary text-sm uppercase tracking-widest mb-2 font-semibold">월세</p>
                    <p className="text-gold font-bold text-5xl">{formatPrice(listing.monthly_rent)}</p>
                  </div>

                  {/* 보증금 & 권리금 - 보조 정보 */}
                  <div className="grid grid-cols-2 gap-4">
                    {listing.deposit && (
                      <div>
                        <p className="text-text-secondary text-xs uppercase tracking-widest mb-2 font-semibold">보증금</p>
                        <p className="text-text-primary font-bold text-2xl">{formatPrice(listing.deposit)}</p>
                      </div>
                    )}
                    {(listing as any).premium_price > 0 && (
                      <div>
                        <p className="text-text-secondary text-xs uppercase tracking-widest mb-2 font-semibold">권리금</p>
                        <p className="text-text-primary font-bold text-2xl">{formatPrice((listing as any).premium_price)}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // 월세 없음 - 권리금을 메인으로 (또는 보증금)
                <div className="space-y-4">
                  {(listing as any).premium_price ? (
                    <div>
                      <p className="text-text-secondary text-sm uppercase tracking-widest mb-2 font-semibold">권리금</p>
                      <p className="text-gold font-bold text-5xl">{formatPrice((listing as any).premium_price)}</p>
                    </div>
                  ) : listing.deposit ? (
                    <div>
                      <p className="text-text-secondary text-sm uppercase tracking-widest mb-2 font-semibold">보증금</p>
                      <p className="text-gold font-bold text-5xl">{formatPrice(listing.deposit)}</p>
                    </div>
                  ) : null}

                  {/* 나머지 정보 */}
                  {((listing as any).premium_price || listing.deposit) && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-light/30">
                      {listing.deposit && (listing as any).premium_price && (
                        <>
                          <div>
                            <p className="text-text-secondary text-xs uppercase tracking-widest mb-2 font-semibold">보증금</p>
                            <p className="text-text-primary font-bold text-2xl">{formatPrice(listing.deposit)}</p>
                          </div>
                          <div>
                            <p className="text-text-secondary text-xs uppercase tracking-widest mb-2 font-semibold">권리금</p>
                            <p className="text-text-primary font-bold text-2xl">{formatPrice((listing as any).premium_price)}</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>


            {/* Meta Information */}
            <div className="flex justify-between items-center text-text-secondary text-sm mb-6">
              <p>조회 {listing.view_count + 1}</p>
              <p>{formatDate(listing.created_at)}</p>
            </div>

            {/* 설명 */}
            {listing.description && (
              <div className="bg-bg-secondary border border-border-light rounded-lg p-6 mb-8">
                <h2 className="text-text-primary font-semibold text-lg mb-4">💬 추가설명</h2>
                <div className="bg-bg-tertiary rounded p-4 overflow-x-auto">
                  <p className="text-text-primary text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {listing.description}
                  </p>
                </div>
              </div>
            )}

            {/* Related Listings Widget - Enhanced */}
            <RelatedListings
              listings={relatedListings}
              currentRegion={listing.region}
              currentDistrict={listing.district}
            />

            {/* Adjacent Regions Widget - Show when current region has <5 listings */}
            <AdjacentRegions
              currentRegion={listing.region}
              currentListingCount={currentRegionCount}
              regionListingCounts={regionListingCounts}
            />
          </div>

          {/* Sidebar */}
          <div>
            <div className="space-y-6">
              {/* Seller Info or Contact Info */}
              {seller ? (
                <div className="bg-bg-secondary border border-border-light rounded-lg p-6 mb-6">
                  <h3 className="text-text-primary font-semibold mb-4">판매자 정보</h3>

                  <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mb-3 mx-auto">
                    <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>

                  <p className="text-center text-text-primary font-semibold mb-2">{seller.nickname}</p>

                  {seller.phone && (
                    <p className="text-center text-gold text-sm mb-4">{seller.phone}</p>
                  )}

                  <a href={`tel:${seller.phone}`} className="w-full block">
                    <Button variant="primary" size="lg" className="w-full mb-2">
                      전화하기
                    </Button>
                  </a>
                </div>
              ) : (listing as any).contact ? (
                <div className="bg-bg-secondary border border-border-light rounded-lg p-6 mb-6">
                  <h3 className="text-text-primary font-semibold mb-4">연락처</h3>

                  <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mb-3 mx-auto">
                    <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 00-.86.5l-1.36 2.27a1 1 0 00.3 1.37A6.994 6.994 0 0021 20.07a1 1 0 001.37-.3l2.27-1.36a1 1 0 00.5-.86V10a2 2 0 00-2-2h-1.07a7 7 0 00-5.68 2.87l-.46.57a7 7 0 00-5.68-2.87H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>

                  <p className="text-center text-text-primary font-semibold mb-2">{(listing as any).contact}</p>

                  <a href={`tel:${(listing as any).contact?.replace(/[^0-9]/g, '')}`} className="w-full block">
                    <Button variant="primary" size="lg" className="w-full mb-2">
                      전화하기
                    </Button>
                  </a>
                </div>
              ) : null}

              {/* Sidebar Banners */}
              {banners && banners.length > 0 && (
                <div className="space-y-4">
                  {banners.map((banner) => (
                    <div key={banner.id} className="rounded-lg overflow-hidden border border-border-light hover:shadow-hover transition-shadow">
                      {banner.link_url ? (
                        <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="block">
                          <img
                            src={banner.image_url}
                            alt={banner.title}
                            className="w-full h-auto object-cover hover:opacity-90 transition-opacity"
                          />
                        </a>
                      ) : (
                        <img
                          src={banner.image_url}
                          alt={banner.title}
                          className="w-full h-auto object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Comments Section */}
              <ListingCommentSection listingId={id} initialComments={comments || []} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
