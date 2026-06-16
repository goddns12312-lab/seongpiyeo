import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatPrice, formatDate } from '@/lib/utils';
import { SITE_CONFIG } from '@/lib/site';
import { ImageGallery } from '@/components/listings/ImageGallery';
import { ListingActions } from '@/components/listings/ListingActions';
import { LikeButton } from '@/components/listings/LikeButton';
import ListingCommentSection from '@/components/listings/ListingCommentSection';
import { ReportButton } from '@/components/community/ReportButton';
import { buildListingProductSchema, buildBreadcrumbSchema } from '@/lib/seo-schema';
import { buildListingSeoTitle, buildListingSeoDescription } from '@/lib/seo-metadata';
import { getOgImageUrl } from '@/lib/seo-assets';
import { RelatedListings } from '@/components/listings/RelatedListings';
import { ListingRegionNav } from '@/components/listings/ListingRegionNav';
import { ListingBodySummary } from '@/components/listings/ListingBodySummary';
import { createPublicClient } from '@/lib/supabase/public';
import {
  getListingById,
  buildDisplayImages,
  pickRelatedListings,
  getCachedRegionCounts,
  getCachedSidebarBanners,
  RELATED_LISTING_SELECT,
} from '@/lib/listing-queries';

export const revalidate = 120;

interface Props {
  params: Promise<{ id: string }>;
}

function buildKeywords(listing: Record<string, unknown>, location: string): string {
  const region = String(listing.region || '');
  const district = listing.district as string | undefined;
  const base = [
    '성인피씨',
    '성인피시',
    '성인피씨창업',
    '성인pc',
    `${location} 성인피씨`,
    `${location} 성인PC`,
    `${location} PC방`,
    `${region} PC방 매물`,
    '성인PC 매매',
    '성인피씨 창업',
    '성인피시방 매물',
    'PC방 양도양수',
    'PC방 매매',
  ];
  if (district) base.push(`${district} PC방`, `${district} 성인PC`);
  return base.join(', ');
}

function resolveOgImage(listing: Record<string, unknown>): string {
  const images = listing.listing_images as { url: string }[] | undefined;
  return (
    (listing.main_image_url as string | undefined) ||
    (listing.thumbnail_url as string | undefined) ||
    images?.[0]?.url ||
    getOgImageUrl()
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = SITE_CONFIG.url;
  const listing = await getListingById(id);

  if (!listing) {
    return {
      title: '매물을 찾을 수 없습니다',
      robots: { index: false, follow: false },
    };
  }

  if (listing.status !== 'active') {
    return {
      title: `${listing.title} | ${SITE_CONFIG.businessName}`,
      robots: { index: false, follow: false },
    };
  }

  const location = [listing.region, listing.district].filter(Boolean).join(' ');
  const title = buildListingSeoTitle(listing);
  const description = buildListingSeoDescription(listing);
  const keywords = buildKeywords(listing, location);
  const ogImage = resolveOgImage(listing);

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
      title: `${title} | ${SITE_CONFIG.businessName}`,
      description,
      type: 'article',
      url: `${baseUrl}/listings/${id}`,
      locale: 'ko_KR',
      siteName: SITE_CONFIG.businessName,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      publishedTime: listing.created_at as string,
      modifiedTime: (listing.updated_at as string) || (listing.created_at as string),
      section: '성인PC 매물',
      tags: keywords.split(', ').slice(0, 5),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_CONFIG.businessName}`,
      description,
      images: [ogImage],
    },
  };
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;
  const listing = await getListingById(id);

  if (!listing || listing.status !== 'active') {
    notFound();
  }

  const displayImages = buildDisplayImages(listing, id, listing.listing_images || []);
  const supabase = createPublicClient();

  const sellerPromise = listing.user_id
    ? supabase.from('profiles').select('id, nickname, phone').eq('id', listing.user_id).single()
    : Promise.resolve({ data: null });

  const [sellerResult, banners, commentsResult, relatedResult, regionListingCounts] =
    await Promise.all([
      sellerPromise,
      getCachedSidebarBanners(),
      supabase
        .from('listing_comments')
        .select('id, listing_id, user_id, nickname, content, created_at, status')
        .eq('listing_id', id)
        .eq('status', 'active')
        .order('created_at', { ascending: true }),
      supabase
        .from('listings')
        .select(RELATED_LISTING_SELECT)
        .eq('region', listing.region)
        .eq('status', 'active')
        .neq('id', id)
        .order('created_at', { ascending: false })
        .limit(12),
      getCachedRegionCounts(),
    ]);

  const seller = sellerResult.data;
  const comments = commentsResult.data;
  const relatedListings = pickRelatedListings(
    relatedResult.data,
    id,
    listing.district,
    12
  );
  const productSchema = buildListingProductSchema(listing);
  const breadcrumbItems = [
    { name: '홈', url: SITE_CONFIG.url },
    { name: '매물 목록', url: `${SITE_CONFIG.url}/listings` },
    {
      name: listing.region,
      url: `${SITE_CONFIG.url}/listings/region/${encodeURIComponent(String(listing.region))}`,
    },
  ];

  if (listing.district) {
    breadcrumbItems.push({
      name: listing.district,
      url: `${SITE_CONFIG.url}/listings/region/${encodeURIComponent(String(listing.region))}`,
    });
  }

  breadcrumbItems.push({
    name: listing.title,
    url: `${SITE_CONFIG.url}/listings/${id}`,
  });

  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems);
  const premiumPrice = listing.premium_price as number | undefined;
  const contact = listing.contact as string | undefined;

  return (
    <div className="bg-bg-primary min-h-screen py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="max-w-5xl mx-auto px-4">
        <nav aria-label="Breadcrumb" className="flex gap-2 text-sm text-text-secondary mb-6 flex-wrap">
          <Link href="/" className="hover:text-gold">
            홈
          </Link>
          <span>/</span>
          <Link href="/listings" className="hover:text-gold">
            매물
          </Link>
          <span>/</span>
          <Link
            href={`/listings/region/${encodeURIComponent(String(listing.region))}`}
            className="hover:text-gold"
          >
            {listing.region}
          </Link>
          {listing.district ? (
            <>
              <span>/</span>
              <span>{listing.district}</span>
            </>
          ) : null}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ImageGallery images={displayImages} title={listing.title} listing={listing} />

            <div className="mb-4">
              <div className="flex gap-2 mb-2 flex-wrap">
                <Badge variant="secondary">{listing.region}</Badge>
                {listing.district && <Badge variant="secondary">{listing.district}</Badge>}
              </div>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary break-words">
                  {listing.title}
                </h1>
                <div className="flex gap-2 items-center flex-shrink-0 flex-wrap">
                  <LikeButton listingId={listing.id} />
                  <ReportButton targetId={listing.id} type="listing" />
                  <ListingActions listingId={listing.id} userId={listing.user_id as string | undefined} />
                </div>
              </div>
            </div>

            <div className="bg-bg-secondary border border-border-light rounded-lg p-6 mb-6">
              {listing.monthly_rent ? (
                <div className="space-y-4">
                  <div className="pb-4 border-b border-border-light/30">
                    <p className="text-text-secondary text-sm uppercase tracking-widest mb-2 font-semibold">
                      월세
                    </p>
                    <p className="text-gold font-bold text-5xl">
                      {formatPrice(listing.monthly_rent as number)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {listing.deposit ? (
                      <div>
                        <p className="text-text-secondary text-xs uppercase tracking-widest mb-2 font-semibold">
                          보증금
                        </p>
                        <p className="text-text-primary font-bold text-2xl">
                          {formatPrice(listing.deposit as number)}
                        </p>
                      </div>
                    ) : null}
                    {premiumPrice && premiumPrice > 0 ? (
                      <div>
                        <p className="text-text-secondary text-xs uppercase tracking-widest mb-2 font-semibold">
                          권리금
                        </p>
                        <p className="text-text-primary font-bold text-2xl">
                          {formatPrice(premiumPrice)}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {premiumPrice ? (
                    <div>
                      <p className="text-text-secondary text-sm uppercase tracking-widest mb-2 font-semibold">
                        권리금
                      </p>
                      <p className="text-gold font-bold text-5xl">{formatPrice(premiumPrice)}</p>
                    </div>
                  ) : listing.deposit ? (
                    <div>
                      <p className="text-text-secondary text-sm uppercase tracking-widest mb-2 font-semibold">
                        보증금
                      </p>
                      <p className="text-gold font-bold text-5xl">
                        {formatPrice(listing.deposit as number)}
                      </p>
                    </div>
                  ) : null}
                  {premiumPrice && listing.deposit ? (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-light/30">
                      <div>
                        <p className="text-text-secondary text-xs uppercase tracking-widest mb-2 font-semibold">
                          보증금
                        </p>
                        <p className="text-text-primary font-bold text-2xl">
                          {formatPrice(listing.deposit as number)}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-secondary text-xs uppercase tracking-widest mb-2 font-semibold">
                          권리금
                        </p>
                        <p className="text-text-primary font-bold text-2xl">
                          {formatPrice(premiumPrice)}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-text-secondary text-sm mb-6">
              <p>조회 {listing.view_count as number}</p>
              <p>{formatDate(listing.created_at as string)}</p>
            </div>

            <ListingBodySummary listing={listing} />

            {listing.description ? (
              <div className="bg-bg-secondary border border-border-light rounded-lg p-6 mb-8">
                <h2 className="text-text-primary font-semibold text-lg mb-4">💬 추가설명</h2>
                <div className="bg-bg-tertiary rounded p-4 overflow-x-auto">
                  <p className="text-text-primary text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {String(listing.description)}
                  </p>
                </div>
              </div>
            ) : null}

            <RelatedListings
              listings={relatedListings}
              currentRegion={listing.region}
              currentDistrict={listing.district ?? undefined}
            />

            <ListingRegionNav
              currentRegion={listing.region}
              regionListingCounts={regionListingCounts}
              premiumPrice={premiumPrice}
              monthlyRent={listing.monthly_rent as number | undefined}
            />
          </div>

          <div>
            <div className="space-y-6">
              {seller ? (
                <div className="bg-bg-secondary border border-border-light rounded-lg p-6 mb-6">
                  <h3 className="text-text-primary font-semibold mb-4">판매자 정보</h3>
                  <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mb-3 mx-auto">
                    <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <p className="text-center text-text-primary font-semibold mb-2">{seller.nickname}</p>
                  {seller.phone ? (
                    <p className="text-center text-gold text-sm mb-4">{seller.phone}</p>
                  ) : null}
                  <a href={`tel:${seller.phone}`} className="w-full block">
                    <Button variant="primary" size="lg" className="w-full mb-2">
                      전화하기
                    </Button>
                  </a>
                </div>
              ) : contact ? (
                <div className="bg-bg-secondary border border-border-light rounded-lg p-6 mb-6">
                  <h3 className="text-text-primary font-semibold mb-4">연락처</h3>
                  <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mb-3 mx-auto">
                    <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 00-.86.5l-1.36 2.27a1 1 0 00.3 1.37A6.994 6.994 0 0021 20.07a1 1 0 001.37-.3l2.27-1.36a1 1 0 00.5-.86V10a2 2 0 00-2-2h-1.07a7 7 0 00-5.68 2.87l-.46.57a7 7 0 00-5.68-2.87H5a2 2 0 00-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-center text-text-primary font-semibold mb-2">{contact}</p>
                  <a href={`tel:${contact.replace(/[^0-9]/g, '')}`} className="w-full block">
                    <Button variant="primary" size="lg" className="w-full mb-2">
                      전화하기
                    </Button>
                  </a>
                </div>
              ) : null}

              {banners.length > 0 ? (
                <div className="space-y-4">
                  {banners.map((banner) => (
                    <div
                      key={banner.id}
                      className="rounded-lg overflow-hidden border border-border-light hover:shadow-hover transition-shadow"
                    >
                      {banner.link_url ? (
                        <a
                          href={banner.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
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
              ) : null}

              <ListingCommentSection listingId={id} initialComments={comments || []} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
