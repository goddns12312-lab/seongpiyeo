import { SITE_CONFIG } from './site';
import { createCanonicalUrl, createCanonicalUrlWithSegment } from './url-utils';

/**
 * SEO 메타데이터 생성 함수 모음
 * 모든 페이지에서 일관된 메타데이터를 생성하기 위한 중앙집중식 관리
 */

export interface SEOMetadataOptions {
  title: string;
  description: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  noindex?: boolean;
  alternates?: {
    canonical?: string;
  };
  openGraph?: {
    title?: string;
    description?: string;
    url?: string;
    type?: string;
    images?: Array<{ url: string; width: number; height: number; alt: string }>;
    locale?: string;
    siteName?: string;
  };
  twitter?: {
    card?: string;
    title?: string;
    description?: string;
    images?: string[];
  };
}

/**
 * 매물(Listing) 메타데이터 생성
 */
export function buildListingMetadata(listing: any): SEOMetadataOptions {
  const { title, region, district, price, status, id } = listing;

  // status가 active가 아니면 noindex
  const isIndexable = status === 'active';

  const location = district ? `${region} ${district}` : region;
  const priceText = `${price?.toLocaleString() || '상담'}만원`;

  // 키워드 포함 타이틀: 지역 + PC방 + 매매 + 제목
  const seoTitle = `${location} 성인피씨 매매 - ${title} | ${priceText}`;
  const seoDescription = `${location} 성인피씨 매물: ${title}. 권리금 ${price}만원. 안전하고 투명한 성인PC 거래 플랫폼 ${SITE_CONFIG.businessName}`.slice(0, 160);

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: [
      '성인피씨',
      '성인피시',
      '성인피씨창업',
      '성인pc',
      `${region} PC방`,
      `${region} 성인피씨`,
      title,
      'PC방 매매',
      'PC방 창업',
    ],
    ogTitle: seoTitle,
    ogDescription: seoDescription,
    ogImage: listing.main_image_url || listing.thumbnail_url || `${SITE_CONFIG.url}/og-listings.png`,
    canonicalUrl: createCanonicalUrl(`/listings/${id}`),
    noindex: !isIndexable,
    alternates: {
      canonical: createCanonicalUrl(`/listings/${id}`),
    },
  };
}

/**
 * 지역별 매물 목록 메타데이터 생성
 */
export function buildRegionListingMetadata(region: string, count: number): SEOMetadataOptions {
  const noindex = count === 0;

  // 키워드 포함: 지역 + 성인PC + 매매 + 개수
  const seoTitle = `${region} 성인피씨 매매·창업 매물 ${count}개 | 성인pc 거래정보`;
  const seoDescription = `${region} 성인피씨 ${count}개 매물. 권리금·보증금·월세 정보와 함께 성인피시 매매, 임대, 양도양수 정보를 ${SITE_CONFIG.businessName}에서 확인하세요.`.slice(0, 160);

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: [
      '성인피씨',
      '성인피시',
      '성인피씨창업',
      '성인pc',
      `${region} 성인피씨`,
      `${region} PC방 매매`,
      `${region} PC방 창업`,
      'PC방 매매',
    ],
    ogTitle: seoTitle,
    ogDescription: seoDescription,
    ogImage: `${SITE_CONFIG.url}/og-listings.png`,
    canonicalUrl: createCanonicalUrlWithSegment('/listings/region', region),
    noindex,
    alternates: {
      canonical: createCanonicalUrlWithSegment('/listings/region', region),
    },
  };
}

/**
 * 커뮤니티 게시글 메타데이터 생성
 */
export function buildPostMetadata(post: any): SEOMetadataOptions {
  const { title, content, id, category, status } = post;

  const isIndexable = status === 'active';
  const contentPreview = content?.slice(0, 160) || '';

  // 키워드 포함: 제목 + PC방 + 카테고리 + 커뮤니티
  const seoTitle = `${title} | PC방 ${category || '커뮤니티'} | 성인피씨 정보`;
  const seoDescription = contentPreview || title;

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: [
      '성인피씨',
      '성인피시',
      '성인피씨창업',
      '성인pc',
      title,
      'PC방',
      'PC방 창업',
      'PC방 정보',
      category,
    ],
    ogTitle: seoTitle,
    ogDescription: seoDescription,
    canonicalUrl: createCanonicalUrl(`/community/${id}`),
    noindex: !isIndexable,
    alternates: {
      canonical: createCanonicalUrl(`/community/${id}`),
    },
  };
}

/**
 * 매물 목록 메타데이터 생성
 */
export function buildListingsMetadata(region?: string, count?: number): SEOMetadataOptions {
  const regionText = region && region !== 'all' && region !== 'undefined' ? `${region} ` : '';

  const seoTitle = `${regionText}성인피씨 성인피시 성인pc 매물 | 창업 정보 | ${SITE_CONFIG.businessName}`;
  const seoDescription = `${regionText ? `${region} 지역의 ` : '전국'}성인피씨 성인피시 성인pc 매물 거래 정보 | PC방 창업, 매매, 임대 정보 한눈에 | ${SITE_CONFIG.businessName} 매물 검색`.slice(0, 160);

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: [
      '성인피씨',
      '성인피시',
      '성인피씨창업',
      '성인pc',
      `성인피씨${regionText ? region : '매물'}`,
      'PC방창업정보',
      '성인피시방',
    ],
    ogTitle: seoTitle,
    ogDescription: seoDescription,
    ogImage: `${SITE_CONFIG.url}/og-listings.png`,
    canonicalUrl: createCanonicalUrl('/listings'),
  };
}

/**
 * 중고장터 물품 메타데이터 생성
 */
export function buildSecondhandMetadata(item: any): SEOMetadataOptions {
  const { title, price, region, id, status } = item;

  const isIndexable = status === 'active';

  // 키워드 포함: 지역 + 중고 + 물품명 + 가격
  const seoTitle = `${region} 중고 성인피씨 물품 | ${title} | ${price?.toLocaleString() || '상담'}만원`;
  const seoDescription = `${region} 중고 물품: ${title}. ${price}만원에 판매 중. 성인피씨 중고 물품 거래 플랫폼 ${SITE_CONFIG.businessName}`.slice(0, 160);

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: [
      '성인피씨',
      '성인피시',
      '성인피씨창업',
      '성인pc',
      title,
      region,
      '중고장터',
      'PC방',
      '중고',
    ],
    ogTitle: seoTitle,
    ogDescription: seoDescription,
    canonicalUrl: createCanonicalUrl(`/secondhand/${id}`),
    noindex: !isIndexable,
  };
}

/**
 * 일자리 메타데이터 생성
 */
export function buildJobMetadata(job: any): SEOMetadataOptions {
  const { title, region, id } = job;

  // 키워드 포함: 지역 + PC방 + 구인 + 직급
  const seoTitle = `${region} 성인피씨 ${title} 구인 | 성인pc 구직정보`;
  const seoDescription = `성인피시 구인구직: ${title} in ${region}. ${SITE_CONFIG.businessName}에서 채용공고를 확인하세요.`.slice(0, 160);

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: [
      '성인피씨',
      '성인피시',
      '성인피씨창업',
      '성인pc',
      title,
      region,
      '구인',
      '구직',
      'PC방',
      '채용',
    ],
    ogTitle: seoTitle,
    ogDescription: seoDescription,
    canonicalUrl: createCanonicalUrl(`/jobs/${id}`),
  };
}

/**
 * 페이지형 메타데이터 생성 (가이드, FAQ, 공지 등)
 */
export function buildPageMetadata(
  pageName: 'guide' | 'faq' | 'notice',
  title: string,
  description: string
): SEOMetadataOptions {
  const pageConfig = {
    guide: {
      ogImage: `${SITE_CONFIG.url}/og-guide.png`,
      baseUrl: '/guide',
      keyword: 'PC방 창업 가이드',
    },
    faq: {
      ogImage: `${SITE_CONFIG.url}/og-faq.png`,
      baseUrl: '/faq',
      keyword: 'PC방 자주묻는질문',
    },
    notice: {
      ogImage: `${SITE_CONFIG.url}/og-notice.png`,
      baseUrl: '/notice',
      keyword: '성인PC 소식',
    },
  };

  const config = pageConfig[pageName];

  // 키워드 포함: 제목 + 페이지 타입 + PC방
  return {
    title: `${title} | ${config.keyword} | ${SITE_CONFIG.businessName}`,
    description,
    keywords: [
      '성인피씨',
      '성인피시',
      '성인피씨창업',
      '성인pc',
      title,
      config.keyword,
      'PC방',
      '성인PC',
    ],
    ogTitle: `${title} | ${config.keyword}`,
    ogDescription: description,
    ogImage: config.ogImage,
    canonicalUrl: createCanonicalUrl(config.baseUrl),
  };
}

/**
 * 기본 메타데이터에 robots 태그 추가
 */
export function addRobotsToMetadata(
  metadata: SEOMetadataOptions,
  options?: { noindex?: boolean; nofollow?: boolean; googlebot?: string }
) {
  return {
    ...metadata,
    robots: {
      index: !options?.noindex && !metadata.noindex,
      follow: !options?.nofollow,
      nocache: false,
      googleBot: options?.googlebot || 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
    },
  };
}

/**
 * OpenGraph 이미지 해결 (우선순위: 커스텀 > 기본 OG 이미지)
 */
export function resolveOgImage(
  customImage?: string,
  fallbackType: 'listing' | 'secondhand' | 'community' = 'listing'
): string {
  if (customImage) return customImage;

  const defaults = {
    listing: `${SITE_CONFIG.url}/og-listings.png`,
    secondhand: `${SITE_CONFIG.url}/og-secondhand.png`,
    community: `${SITE_CONFIG.url}/og-community.png`,
  };

  return defaults[fallbackType];
}
