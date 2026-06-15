import { unstable_cache } from 'next/cache';
import { REGIONS } from '@/types';
import { createPublicClient } from '@/lib/supabase/public';

/** 목록 카드에 필요한 컬럼만 (description 등 대용량 필드 제외) */
export const LISTING_LIST_SELECT =
  'id, idx, title, price_type, deposit, monthly_rent, premium_price, region, district, area_sqm, pc_count, floor, available_date, main_image_url, thumbnail_url, view_count, created_at, status';

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
