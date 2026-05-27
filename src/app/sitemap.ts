import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { SITE_CONFIG } from '@/lib/site';
import { REGIONS } from '@/types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // 모든 활성 매물 조회
  const { data: listings } = await supabase
    .from('listings')
    .select('id, region, updated_at')
    .eq('status', 'active');

  // 모든 활성 커뮤니티 글 조회
  const { data: posts } = await supabase
    .from('posts')
    .select('id, updated_at')
    .eq('status', 'active');

  // 매물이 있는 지역만 필터링
  const activeRegionSet = new Set<string>();
  listings?.forEach((listing: any) => {
    if (listing.region) {
      activeRegionSet.add(listing.region);
    }
  });

  // 매물 상세 페이지
  const listingEntries =
    listings?.map((listing: any) => ({
      url: `${SITE_CONFIG.url}/listings/${listing.id}`,
      lastModified: new Date(listing.updated_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })) || [];

  // 커뮤니티 상세 페이지
  const postEntries =
    posts?.map((post: any) => ({
      url: `${SITE_CONFIG.url}/community/${post.id}`,
      lastModified: new Date(post.updated_at || new Date()),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })) || [];

  // 지역별 매물 페이지 (매물이 있는 지역만)
  const regionEntries = REGIONS.filter((region) => activeRegionSet.has(region)).map((region) => ({
    url: `${SITE_CONFIG.url}/listings/region/${encodeURIComponent(region)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }));

  return [
    {
      url: SITE_CONFIG.url,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${SITE_CONFIG.url}/listings`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${SITE_CONFIG.url}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    ...regionEntries,
    ...listingEntries,
    ...postEntries,
  ];
}
