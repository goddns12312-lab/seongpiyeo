import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { REGIONS } from '@/types';
import { createPublicClient } from '@/lib/supabase/public';

/** 목록 카드에 필요한 컬럼만 (description 등 대용량 필드 제외) */
export const LISTING_LIST_SELECT =
  'id, idx, title, price_type, deposit, monthly_rent, premium_price, region, district, area_sqm, pc_count, floor, available_date, main_image_url, thumbnail_url, view_count, created_at, status';

/** SEO 타이틀용 active 매물·허브 카운트 (캐시 2분) */
export const getSeoHubCounts = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const [listings, jobs, posts, secondhand, exchange] = await Promise.all([
      supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .is('deleted_at', null),
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .neq('category', 'exchange'),
      supabase.from('secondhand_items').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('category', 'exchange'),
    ]);

    return {
      listings: listings.count || 0,
      jobs: jobs.count || 0,
      posts: posts.count || 0,
      secondhand: secondhand.count || 0,
      exchange: exchange.count || 0,
    };
  },
  ['seo-hub-counts'],
  { revalidate: 120 }
);

export const getActiveListingCount = cache(async (): Promise<number> => {
  const { listings } = await getSeoHubCounts();
  return listings;
});

export const getRegionListingCount = cache(async (region: string): Promise<number> => {
  const supabase = createPublicClient();
  const { count } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('region', region)
    .eq('status', 'active');

  return count || 0;
});

export const LISTING_DETAIL_SELECT =
  'id, title, region, district, description, monthly_rent, deposit, premium_price, main_image_url, thumbnail_url, area_sqm, pc_count, view_count, created_at, updated_at, status, user_id, price_type, price, contact, floor, available_date, facilities, idx, monthly_revenue, monthly_profit, address, location, administrative_record, area, business_license, move_in_date';

export const RELATED_LISTING_SELECT =
  'id, title, region, district, monthly_rent, deposit, premium_price, main_image_url, created_at';

export type ListingImageRow = {
  id: string;
  url: string;
  order_num: number;
  listing_id: string;
};

export type ListingDetailRow = Record<string, unknown> & {
  id: string;
  title: string;
  region: string;
  district?: string | null;
  status: string;
  user_id?: string | null;
  main_image_url?: string | null;
  thumbnail_url?: string | null;
  listing_images?: ListingImageRow[];
};

function aggregateRegionCounts(rows: { region: string | null }[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const region of REGIONS) {
    counts[region] = 0;
  }
  for (const row of rows) {
    if (row.region) {
      counts[row.region] = (counts[row.region] || 0) + 1;
    }
  }
  return counts;
}

/** 요청당 1회 — generateMetadata + 페이지 본문 중복 조회 방지 */
export const getListingById = cache(async (id: string): Promise<ListingDetailRow | null> => {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('listings')
    .select(`${LISTING_DETAIL_SELECT}, listing_images(id, url, order_num, listing_id)`)
    .eq('id', id)
    .single();

  return data as ListingDetailRow | null;
});

export function buildDisplayImages(
  listing: Pick<ListingDetailRow, 'main_image_url' | 'thumbnail_url'>,
  listingId: string,
  images: ListingImageRow[] = []
): ListingImageRow[] {
  let displayImages = [...images].sort((a, b) => a.order_num - b.order_num);

  const mainUrl = listing.main_image_url;
  if (mainUrl && !mainUrl.includes('placeholder') && !displayImages.some((img) => img.url === mainUrl)) {
    displayImages = [
      { id: 'main', url: mainUrl, order_num: 0, listing_id: listingId },
      ...displayImages,
    ];
  }

  if (
    displayImages.length === 0 &&
    listing.thumbnail_url &&
    !listing.thumbnail_url.includes('placeholder')
  ) {
    displayImages = [
      { id: 'thumb', url: listing.thumbnail_url, order_num: 0, listing_id: listingId },
    ];
  }

  return displayImages;
}

export function pickRelatedListings<T extends { id: string; district?: string | null }>(
  candidates: T[] | null,
  currentId: string,
  district?: string | null,
  limit = 6
): T[] {
  const others = (candidates || []).filter((item) => item.id !== currentId);
  if (!district) {
    return others.slice(0, limit);
  }

  const sameDistrict = others.filter((item) => item.district === district);
  const rest = others.filter((item) => item.district !== district);
  return [...sameDistrict, ...rest].slice(0, limit);
}

export const getCachedRegionCounts = unstable_cache(
  async (): Promise<Record<string, number>> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('listings')
      .select('region')
      .eq('status', 'active');

    return aggregateRegionCounts(data || []);
  },
  ['listing-region-counts'],
  { revalidate: 120 }
);

/** SEO 내부링크용 — 매물 수 상위 지역 (sitemap thin content 정책과 동일: 5건 이상) */
export async function getTopListingRegions(
  limit = 5,
  minCount = 5
): Promise<Array<{ region: string; count: number }>> {
  const counts = await getCachedRegionCounts();
  return Object.entries(counts)
    .filter(([, count]) => count >= minCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([region, count]) => ({ region, count }));
}

export const getCachedSidebarBanners = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('banners')
      .select('id, image_url, link_url, title')
      .in('position', ['sidebar', 'listing-detail-sidebar'])
      .eq('is_active', true)
      .order('order_num', { ascending: true });

    return data || [];
  },
  ['sidebar-banners'],
  { revalidate: 300 }
);
