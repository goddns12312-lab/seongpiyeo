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

  // 모든 활성 구인공고 조회 (soft delete 제외)
  const { data: jobs } = await supabase
    .from('jobs')
    .select('slug, updated_at')
    .eq('status', 'active')
    .is('deleted_at', null);

  // 모든 활성 중고물품 조회
  const { data: secondhand } = await supabase
    .from('secondhand_items')
    .select('id, updated_at')
    .eq('status', 'active');

  // 모든 활성 환전정보 글 조회
  const { data: exchangeInfoPosts } = await supabase
    .from('posts')
    .select('id, updated_at')
    .eq('category', 'exchange')
    .eq('status', 'published');

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

  // 구인공고 상세 페이지
  const jobEntries =
    jobs?.map((job: any) => ({
      url: `${SITE_CONFIG.url}/jobs/${encodeURIComponent(job.slug)}`,
      lastModified: new Date(job.updated_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    })) || [];

  // 중고물품 상세 페이지
  const secondhandEntries =
    secondhand?.map((item: any) => ({
      url: `${SITE_CONFIG.url}/secondhand/${item.id}`,
      lastModified: new Date(item.updated_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })) || [];

  // 환전정보 상세 페이지
  const exchangeInfoEntries =
    exchangeInfoPosts?.map((post: any) => ({
      url: `${SITE_CONFIG.url}/exchange-info/${post.id}`,
      lastModified: new Date(post.updated_at || new Date()),
      changeFrequency: 'monthly' as const,
      priority: 0.65,
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
    {
      url: `${SITE_CONFIG.url}/community`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${SITE_CONFIG.url}/exchange-info`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    {
      url: `${SITE_CONFIG.url}/notice`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${SITE_CONFIG.url}/guide`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${SITE_CONFIG.url}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${SITE_CONFIG.url}/secondhand`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    ...regionEntries,
    ...listingEntries,
    ...postEntries,
    ...jobEntries,
    ...secondhandEntries,
    ...exchangeInfoEntries,
  ];
}
