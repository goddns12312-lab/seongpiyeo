import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { REGIONS } from '@/types';
import RegionListingsPage, {
  generateMetadata as generateRegionMetadata,
} from '@/app/listings/region/[region]/page';
import ListingCategoryPage from '@/app/listings/category/[category]/page';
import { generateMetadata as generateCategoryMetadata } from '@/app/listings/category/[category]/layout';
import { getListingById } from '@/lib/listing-queries';
import { SITE_CONFIG } from '@/lib/site';
import { getListingCanonicalUrl, getListingPublicPath } from '@/lib/listing-url';

const LISTING_CATEGORIES = ['rent', 'sale', 'transfer'] as const;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; search?: string }>;
}

function isListingCategory(slug: string): boolean {
  return LISTING_CATEGORIES.includes(slug as (typeof LISTING_CATEGORIES)[number]);
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  if (isListingCategory(decodedSlug)) {
    return generateCategoryMetadata({
      params: Promise.resolve({ category: decodedSlug }),
    });
  }

  if (REGIONS.includes(decodedSlug)) {
    return generateRegionMetadata({
      params: Promise.resolve({ region: decodedSlug }),
      searchParams,
    });
  }

  const listing = await getListingById(decodedSlug);
  if (!listing) {
    return {
      title: '매물을 찾을 수 없습니다',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${listing.title} | ${listing.region || 'PC방 매물'}`,
    robots: { index: false, follow: true },
    alternates: {
      canonical: getListingCanonicalUrl(SITE_CONFIG.url, listing.region as string, decodedSlug),
    },
  };
}

export function generateStaticParams() {
  return [
    ...REGIONS.map((region) => ({ slug: region })),
    ...LISTING_CATEGORIES.map((category) => ({ slug: category })),
  ];
}

export default async function PcBangSlugPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  if (isListingCategory(decodedSlug)) {
    return ListingCategoryPage({
      params: Promise.resolve({ category: decodedSlug }),
    });
  }

  if (REGIONS.includes(decodedSlug)) {
    return RegionListingsPage({
      params: Promise.resolve({ region: decodedSlug }),
      searchParams,
    });
  }

  const listing = await getListingById(decodedSlug);
  if (!listing) {
    notFound();
  }

  permanentRedirect(getListingPublicPath(listing.region as string, decodedSlug));
}
