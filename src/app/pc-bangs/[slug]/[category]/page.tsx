import type { Metadata } from 'next';
import { REGIONS } from '@/types';
import ListingDetailPage, {
  generateMetadata as generateListingMetadata,
} from '@/app/listings/[id]/page';
import RegionCategoryPage, {
  revalidate,
} from '@/app/listings/region/[region]/category/[category]/page';
import { generateMetadata as generateRegionCategoryMetadata } from '@/app/listings/region/[region]/category/[category]/layout';
import { createPublicClient } from '@/lib/supabase/public';

const REGION_CATEGORY_SEGMENTS = ['lease', 'sale', 'transfer'] as const;

interface Props {
  params: Promise<{ slug: string; category: string }>;
}

export { revalidate };

function isRegionCategorySegment(category: string): boolean {
  return REGION_CATEGORY_SEGMENTS.includes(category as (typeof REGION_CATEGORY_SEGMENTS)[number]);
}

export async function generateStaticParams() {
  const supabase = createPublicClient();
  const { data: listings } = await supabase
    .from('listings')
    .select('id, region')
    .eq('status', 'active');

  const regionCategoryParams = REGIONS.flatMap((region) =>
    REGION_CATEGORY_SEGMENTS.map((category) => ({
      slug: region,
      category,
    }))
  );

  const listingParams =
    listings?.map((listing) => ({
      slug: listing.region || 'all',
      category: listing.id,
    })) || [];

  return [...regionCategoryParams, ...listingParams];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, category } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const decodedCategory = decodeURIComponent(category);

  if (!isRegionCategorySegment(decodedCategory)) {
    return generateListingMetadata({
      params: Promise.resolve({ id: decodedCategory }),
    });
  }

  return generateRegionCategoryMetadata({
    params: Promise.resolve({ region: decodedSlug, category: decodedCategory }),
  });
}

export default async function PcBangRegionCategoryPage({ params }: Props) {
  const { slug, category } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const decodedCategory = decodeURIComponent(category);

  if (!isRegionCategorySegment(decodedCategory)) {
    return ListingDetailPage({
      params: Promise.resolve({ id: decodedCategory }),
    });
  }

  return RegionCategoryPage({
    params: Promise.resolve({ region: decodedSlug, category: decodedCategory }),
  });
}
