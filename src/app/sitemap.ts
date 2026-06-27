import { MetadataRoute } from 'next';
import { createPublicClient } from '@/lib/supabase/public';
import { SITE_CONFIG } from '@/lib/site';
import { REGIONS } from '@/types';
import { COMMUNITY_CATEGORIES } from '@/lib/community-categories';
import { getListingCanonicalUrl } from '@/lib/listing-url';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();

  // 모든 활성 매물 조회 (price_type 포함)
  const { data: listings } = await supabase
    .from('listings')
    .select('id, region, price_type, updated_at')
    .eq('status', 'active');

  // 커뮤니티 글 (exchange 제외 → /community/{id})
  const { data: posts } = await supabase
    .from('posts')
    .select('id, updated_at, category')
    .eq('status', 'active')
    .neq('category', 'exchange');

  // 모든 활성 구인공고 조회 (soft delete 제외)
  const { data: jobs } = await supabase
    .from('jobs')
    .select('slug, updated_at, region')
    .eq('status', 'active')
    .is('deleted_at', null);

  // 모든 활성 중고물품 조회
  const { data: secondhand } = await supabase
    .from('secondhand_items')
    .select('id, updated_at, region')
    .eq('status', 'active');

  // 모든 활성 환전정보 글 조회
  const { data: exchangeInfoPosts } = await supabase
    .from('posts')
    .select('id, updated_at')
    .eq('category', 'exchange')
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
      url: getListingCanonicalUrl(SITE_CONFIG.url, listing.region, listing.id),
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

  // PC방 매물 카테고리 페이지
  const listingCategoryEntries = [
    { name: 'rent', priority: 0.75 },
    { name: 'sale', priority: 0.75 },
    { name: 'transfer', priority: 0.7 },
  ].map(cat => ({
    url: `${SITE_CONFIG.url}/pc-bangs/${cat.name}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: cat.priority,
  }));

  // Jobs 카테고리 페이지
  const jobCategoryEntries = [
    { name: 'recruitment', priority: 0.75 },
    { name: 'job_seeker', priority: 0.75 },
  ].map(cat => ({
    url: `${SITE_CONFIG.url}/jobs/category/${cat.name}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: cat.priority,
  }));

  // Secondhand 카테고리 페이지
  const secondhandCategoryEntries = [
    { name: 'equipment', priority: 0.7 },
    { name: 'furniture', priority: 0.7 },
    { name: 'supplies', priority: 0.7 },
    { name: 'other', priority: 0.65 },
  ].map(cat => ({
    url: `${SITE_CONFIG.url}/secondhand/category/${cat.name}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: cat.priority,
  }));

  // 커뮤니티 카테고리 페이지
  const communityCategoryEntries = Object.keys(COMMUNITY_CATEGORIES).map((category) => ({
    url: `${SITE_CONFIG.url}/community/category/${category}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.65,
  }));

  // 지역별 매물 페이지 (5개 이상 매물이 있는 지역만 - Thin Content 정책)
  const regionListingCounts = new Map<string, number>();
  listings?.forEach((listing: any) => {
    if (listing.region) {
      regionListingCounts.set(listing.region, (regionListingCounts.get(listing.region) || 0) + 1);
    }
  });

  const listingsRegionEntries = REGIONS.filter((region) => {
    const count = regionListingCounts.get(region) || 0;
    return count >= 5; // 5개 이상만 포함
  }).map((region) => ({
    url: `${SITE_CONFIG.url}/pc-bangs/${encodeURIComponent(region)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }));

  // 지역+카테고리 매물 페이지 (5개 이상 매물이 있는 조합만 - Thin Content 정책)
  const regionCategoryListingCounts = new Map<string, Map<string, number>>();
  listings?.forEach((listing: any) => {
    if (listing.region && listing.price_type) {
      const regionMap = regionCategoryListingCounts.get(listing.region) || new Map<string, number>();
      regionMap.set(listing.price_type, (regionMap.get(listing.price_type) || 0) + 1);
      regionCategoryListingCounts.set(listing.region, regionMap);
    }
  });

  const listingsRegionCategoryEntries: MetadataRoute.Sitemap = [];
  regionCategoryListingCounts.forEach((categoryMap, region) => {
    categoryMap.forEach((count, category) => {
      if (count >= 5) { // 5개 이상만 포함
        listingsRegionCategoryEntries.push({
          url: `${SITE_CONFIG.url}/pc-bangs/${encodeURIComponent(region)}/${encodeURIComponent(category)}`,
          lastModified: new Date(),
          changeFrequency: 'daily' as const,
          priority: 0.8,
        });
      }
    });
  });

  // 지역별 공고 페이지 (5개 이상 공고가 있는 지역만)
  const regionJobCounts = new Map<string, number>();
  jobs?.forEach((job: any) => {
    if (job.region) {
      regionJobCounts.set(job.region, (regionJobCounts.get(job.region) || 0) + 1);
    }
  });

  const jobsRegionEntries = REGIONS.filter((region) => {
    const count = regionJobCounts.get(region) || 0;
    return count >= 5;
  }).map((region) => ({
    url: `${SITE_CONFIG.url}/jobs/region/${encodeURIComponent(region)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // 지역별 중고물품 페이지 (5개 이상 상품이 있는 지역만)
  const regionSecondhandCounts = new Map<string, number>();
  secondhand?.forEach((item: any) => {
    if (item.region) {
      regionSecondhandCounts.set(item.region, (regionSecondhandCounts.get(item.region) || 0) + 1);
    }
  });

  const secondhandRegionEntries = REGIONS.filter((region) => {
    const count = regionSecondhandCounts.get(region) || 0;
    return count >= 5;
  }).map((region) => ({
    url: `${SITE_CONFIG.url}/secondhand/region/${encodeURIComponent(region)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.75,
  }));

  return [
    {
      url: SITE_CONFIG.url,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${SITE_CONFIG.url}/pc-bangs`,
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
    {
      url: `${SITE_CONFIG.url}/support`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${SITE_CONFIG.url}/community/recruitment`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.65,
    },
    // 지역별 페이지 (5개 이상 콘텐츠만 포함)
    ...listingsRegionEntries,
    ...jobsRegionEntries,
    ...secondhandRegionEntries,
    // 지역+카테고리 조합 페이지 (listings만, 5개 이상 콘텐츠만 포함)
    ...listingsRegionCategoryEntries,
    // 콘텐츠 상세 페이지
    ...listingEntries,
    ...postEntries,
    ...jobEntries,
    ...secondhandEntries,
    ...exchangeInfoEntries,
    // 카테고리 페이지
    ...listingCategoryEntries,
    ...jobCategoryEntries,
    ...secondhandCategoryEntries,
    ...communityCategoryEntries,
  ];
}
