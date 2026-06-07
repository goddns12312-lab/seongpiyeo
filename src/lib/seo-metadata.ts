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

  const seoTitle = `${regionText}성인피씨 성인피시 성인pc 매물 | 창업 정보`;
  const seoDescription = `${regionText ? `${region} 지역의 ` : '전국'}성인피씨 성인피시 성인pc 매물 거래 정보 | PC방 창업, 매매, 임대 정보 한눈에 | 성피요 매물 검색`.slice(0, 160);

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

/**
 * ============================================================
 * 통합 제목 생성 함수 (generateMetadata에서 활용)
 * ============================================================
 */

import { autoFixTitleByType, ContentMetadata } from './seo-title-auto-fix';

/**
 * 제목 길이에 따라 자동 보정된 SEO 제목 생성
 * generateMetadata 함수에서 제목 생성 시 이 함수를 먼저 호출
 *
 * @example
 * const metadata = {
 *   type: 'listing',
 *   title: '급매', // 3자
 *   region: '서울',
 *   priceType: 'monthly'
 * };
 * const seoTitle = buildOptimizedTitle(metadata);
 * // 결과: "급매 | 서울 성인PC 임대 | 성피요"
 */
export function buildOptimizedTitle(
  metadata: ContentMetadata,
  businessName: string = SITE_CONFIG.businessName
): string {
  const result = autoFixTitleByType(metadata, businessName);
  return result.fixed;
}

/**
 * Listings 상세페이지용 최적화 제목 생성
 */
export function buildOptimizedListingTitle(listing: any, businessName: string = SITE_CONFIG.businessName): string {
  const metadata: ContentMetadata = {
    type: 'listing',
    title: listing.title,
    region: listing.region,
    priceType: listing.monthly_rent ? 'monthly' : 'sale',
  };
  return buildOptimizedTitle(metadata, businessName);
}

/**
 * Jobs 상세페이지용 최적화 제목 생성
 */
export function buildOptimizedJobTitle(job: any, businessName: string = SITE_CONFIG.businessName): string {
  const metadata: ContentMetadata = {
    type: 'job',
    title: job.title,
    region: job.region,
    employmentType: job.employment_type,
  };
  return buildOptimizedTitle(metadata, businessName);
}

/**
 * Secondhand 상세페이지용 최적화 제목 생성
 */
export function buildOptimizedSecondhandTitle(item: any, businessName: string = SITE_CONFIG.businessName): string {
  const metadata: ContentMetadata = {
    type: 'secondhand',
    title: item.title,
    region: item.region,
  };
  return buildOptimizedTitle(metadata, businessName);
}

/**
 * ============================================================
 * Listings 상세페이지 SEO 최적화 함수 (TOP 1-3)
 * ============================================================
 */

function extractTitleKeyword(originalTitle: string): string {
  if (!originalTitle) return '';
  const title = originalTitle.toLowerCase();
  const excludeWords = ['팝니다', '정리', '팔아요', '팔게요', '거래중', '판매', '매매', '취급', '운영', '입니다', '입니까'];
  const keyword = originalTitle
    .split(' ')
    .filter(word => !excludeWords.some(exclude => word.includes(exclude)))
    .slice(0, 3)
    .join(' ')
    .trim();
  return keyword && keyword.length > 1 ? keyword : '';
}

/**
 * Listings 상세페이지 SEO Title 생성
 * 지역(district/location 필수) + 성인PC 매물 + 가격 + 핵심키워드 + 브랜드
 *
 * @example
 * const listing = {
 *   region: '서울', district: '답십리', title: '동대문구 독점',
 *   premium_price: 1100, monthly_rent: 80
 * }
 * buildListingSeoTitle(listing)
 * // "서울 답십리 성인PC | 권리금 1100만·월세 80만 | 독점 | 성피요"
 */
export function buildListingSeoTitle(listing: any, businessName: string = SITE_CONFIG.businessName): string {
  const { region, district, location, premium_price, deposit, monthly_rent, title: originalTitle } = listing;

  // 지역 정보 (district 우선, 없으면 location, 모두 없으면 region만)
  const locationPart = district || location || '';
  const fullLocation = locationPart ? `${region} ${locationPart}` : region;

  // 가격 정보 (최대 2개) - 띄어쓰기 추가
  const priceParts: string[] = [];
  if (premium_price) priceParts.push(`권리금 ${premium_price}만`);
  if (deposit && !premium_price) priceParts.push(`보증금 ${deposit}만`);
  if (monthly_rent && priceParts.length < 2) priceParts.push(`월세 ${monthly_rent}만`);
  const priceInfo = priceParts.length > 0 ? ` | ${priceParts.join(' · ')}` : '';

  // 완성된 제목 (성인PC 매물로 더 명확하게)
  // ⚠️ 브랜드명은 layout.tsx의 title.template에서 추가되므로 여기서는 제거
  let title = `${fullLocation} 성인PC 매물${priceInfo}`;

  // 60자 제한: 너무 길면 "매물" 제거
  if (title.length > 60) {
    title = `${fullLocation} 성인PC${priceInfo}`;
  }

  // 여전히 길면 가격을 1개만 유지
  if (title.length > 60 && priceParts.length > 1) {
    const shortPriceInfo = ` | ${priceParts[0]}`;
    title = `${fullLocation} 성인PC${shortPriceInfo}`;
  }

  // 마지막 수단: 가격 제거
  if (title.length > 60) {
    title = `${fullLocation} 성인PC`;
  }

  return title;
}

/**
 * Listings 상세페이지 SEO Description 생성 (120~160자)
 * 목표: 100% 고유성 + 데이터 기반 + 120~160자 달성
 */
export function buildListingSeoDescription(listing: any): string {
  const { region, district, location, premium_price, deposit, monthly_rent, area_sqm, pc_count } = listing;

  const locationPart = district ? `${region} ${district}` : location ? `${region} ${location}` : region;

  // 핵심 가격 (중복 최소화)
  let priceInfo = '';
  if (premium_price && monthly_rent) {
    priceInfo = `권리금 ${premium_price}만원, 월세 ${monthly_rent}만원`;
  } else if (premium_price && deposit) {
    priceInfo = `권리금 ${premium_price}만원, 보증금 ${deposit}만원`;
  } else if (premium_price) {
    priceInfo = `권리금 ${premium_price}만원`;
  } else if (monthly_rent) {
    priceInfo = `월세 ${monthly_rent}만원`;
  }

  // 데이터 기반 특성화된 설명
  let desc = '';

  // 가격 + 규모 조합
  if (pc_count && area_sqm) {
    desc = `${locationPart} 성인PC. ${priceInfo}. ${area_sqm}평 규모에 PC ${pc_count}대. 체계적으로 운영할 수 있는 환경이 갖춰져 있습니다.`;
  } else if (pc_count) {
    const scale = pc_count >= 20 ? '중대형' : '중규모';
    desc = `${locationPart} 성인PC. ${priceInfo}. PC ${pc_count}대 규모의 ${scale} 점포. 안정적인 사업 운영이 가능합니다.`;
  } else if (area_sqm) {
    desc = `${locationPart} 성인PC. ${priceInfo}. ${area_sqm}평 규모. 충분한 공간에서 사업을 시작할 수 있습니다.`;
  } else if ((premium_price || 0) + (deposit || 0) >= 3000) {
    desc = `${locationPart} 성인PC. ${priceInfo}. 프리미엄 상권의 수익성 높은 매물. 성장 잠재력이 큰 점포입니다.`;
  } else if (premium_price && premium_price < 500) {
    desc = `${locationPart} 성인PC. ${priceInfo}. 저가 진입 조건으로 작은 자본금으로도 창업할 수 있습니다.`;
  } else {
    desc = `${locationPart} 성인PC 거래 중. ${priceInfo}. 투명한 거래 절차와 함께 맞춤형 컨설팅을 받을 수 있습니다.`;
  }

  // 상권 정보 추가로 길이 확대
  const remainingChars = 160 - desc.length;
  if (remainingChars > 35) {
    if (district) {
      desc += ` ${district} 상권의 성인PC 사업 정보를 성피요에서 확인해보세요.`;
    } else {
      desc += ` ${region} 지역 성인PC 매물과 사업 정보를 성피요에서 확인해보세요.`;
    }
  } else if (remainingChars > 20) {
    desc += ` 상세 정보는 성피요에서 확인하세요.`;
  } else if (remainingChars > 10) {
    desc += ` 성피요에서 확인.`;
  }

  return desc.length > 160 ? desc.slice(0, 157) + '...' : desc;
}

/**
 * Listings 이미지 Alt Text 생성
 * 형식: {지역} {district/location} 성인PC 매물 이미지 - 권리금 {amount}, {면적}평
 *
 * @example
 * const listing = {
 *   region: '서울', district: '강남구', premium_price: 1500, area_sqm: 20
 * }
 * buildListingImageAlt(listing) // "서울 강남구 성인PC 매물 이미지 - 권리금 1500만원, 20평"
 */
export function buildListingImageAlt(listing: any): string {
  const { region, district, location, premium_price, area_sqm } = listing;

  // 지역 정보
  const locationPart = district ? `${region} ${district}` : location ? `${region} ${location}` : region;
  let alt = `${locationPart} 성인PC 매물 이미지`;

  // 추가 정보
  const details: string[] = [];
  if (premium_price) details.push(`권리금 ${premium_price}만원`);
  if (area_sqm) details.push(`${area_sqm}평`);

  if (details.length > 0) {
    alt += ` - ${details.join(', ')}`;
  }

  return alt;
}
