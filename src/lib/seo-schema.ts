import { SITE_CONFIG } from './site';

/**
 * JSON-LD 구조화된 데이터 생성 함수 모음
 * schema.org 표준을 준수하여 구글 검색 및 AI 검색 최적화
 */

/**
 * 웹사이트 기본 스키마
 */
export function buildWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.businessName,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/listings?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * 조직 스키마
 */
export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.businessName,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    telephone: SITE_CONFIG.phone,
    email: SITE_CONFIG.email,
    address: {
      '@type': 'PostalAddress',
      addressRegion: SITE_CONFIG.region,
      addressCountry: 'KR',
    },
    sameAs: [
      // 소셜 미디어 링크 추가 가능
    ],
  };
}

/**
 * 브레드크럼 스키마 생성
 */
export function buildBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * 매물 상세 스키마 (Product)
 */
export function buildListingProductSchema(listing: any): object {
  const {
    title,
    description,
    price,
    region,
    district,
    area_sqm,
    pc_count,
    deposit,
    monthly_rent,
    monthly_profit,
    main_image_url,
    id,
    created_at,
  } = listing;

  const location = district ? `${region} ${district}` : region;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    description: description || location,
    image: main_image_url || `${SITE_CONFIG.url}/og-listings.png`,
    url: `${SITE_CONFIG.url}/listings/${id}`,
    priceCurrency: 'KRW',
    price: price?.toString() || '0',
    offers: {
      '@type': 'Offer',
      price: price?.toString() || '0',
      priceCurrency: 'KRW',
      availability: 'https://schema.org/InStock',
    },
    additionalProperty: [
      area_sqm && {
        '@type': 'PropertyValue',
        name: '면적',
        value: `${area_sqm}평`,
      },
      pc_count && {
        '@type': 'PropertyValue',
        name: 'PC 대수',
        value: `${pc_count}대`,
      },
      deposit && {
        '@type': 'PropertyValue',
        name: '보증금',
        value: `${deposit}만원`,
      },
      monthly_rent && {
        '@type': 'PropertyValue',
        name: '월세',
        value: `${monthly_rent}만원`,
      },
      monthly_profit && {
        '@type': 'PropertyValue',
        name: '월 순익',
        value: `${monthly_profit}만원`,
      },
      {
        '@type': 'PropertyValue',
        name: '지역',
        value: location,
      },
    ].filter(Boolean),
    datePublished: created_at,
  };
}

/**
 * 중고 물품 스키마 (Product)
 */
export function buildSecondhandProductSchema(item: any): object {
  const { title, description, price, region, main_image_url, id, created_at, status } = item;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    description: description || `${region}의 중고 물품`,
    image: main_image_url || `${SITE_CONFIG.url}/og-secondhand.png`,
    url: `${SITE_CONFIG.url}/secondhand/${id}`,
    priceCurrency: 'KRW',
    price: price?.toString() || '0',
    offers: {
      '@type': 'Offer',
      price: price?.toString() || '0',
      priceCurrency: 'KRW',
      availability: status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: '지역',
        value: region,
      },
      {
        '@type': 'PropertyValue',
        name: '상태',
        value: status === 'active' ? '판매중' : status === 'reserved' ? '예약중' : '판매완료',
      },
    ],
    datePublished: created_at,
  };
}

/**
 * 일자리 공고 스키마 (JobPosting)
 */
export function buildJobPostingSchema(job: any): object {
  const { title, description, region, salary, employment_type, id, created_at } = job;

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: title,
    description: description || title,
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressRegion: region,
        addressCountry: 'KR',
      },
    },
    baseSalary: salary && {
      '@type': 'PriceSpecification',
      priceCurrency: 'KRW',
      price: salary,
    },
    employmentType: employment_type || 'TEMPORARY',
    datePosted: created_at,
    url: `${SITE_CONFIG.url}/jobs/${id}`,
    hiringOrganization: {
      '@type': 'Organization',
      name: SITE_CONFIG.businessName,
      url: SITE_CONFIG.url,
    },
  };
}

/**
 * 기사/게시글 스키마 (NewsArticle)
 */
export function buildNewsArticleSchema(post: any): object {
  const { title, content, id, created_at, user_profile_name } = post;

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    articleBody: content?.slice(0, 500) || title,
    datePublished: created_at,
    author: {
      '@type': 'Person',
      name: user_profile_name || SITE_CONFIG.businessName,
    },
    url: `${SITE_CONFIG.url}/community/${id}`,
    image: `${SITE_CONFIG.url}/og-community.png`,
  };
}

/**
 * FAQ 페이지 스키마
 */
export function buildFAQPageSchema(
  faqs: Array<{ question: string; answer: string }>
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * 컬렉션 페이지 스키마 (매물 목록 등)
 */
export function buildCollectionPageSchema(
  title: string,
  items: Array<{ name: string; url: string; description?: string }>,
  pageUrl: string
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': pageUrl,
    name: title,
    url: pageUrl,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: items.slice(0, 10).map((item, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: item.url,
        name: item.name,
        description: item.description || '',
      })),
    },
  };
}

/**
 * 로컬 비즈니스 스키마
 */
export function buildLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: SITE_CONFIG.businessName,
    url: SITE_CONFIG.url,
    image: `${SITE_CONFIG.url}/og-listings.png`,
    description: SITE_CONFIG.description,
    telephone: SITE_CONFIG.phone,
    email: SITE_CONFIG.email,
    address: {
      '@type': 'PostalAddress',
      addressRegion: SITE_CONFIG.region,
      addressCountry: 'KR',
    },
  };
}

/**
 * Person 스키마 (사용자/작성자)
 */
export function buildPersonSchema(name: string, url?: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: name,
    url: url || SITE_CONFIG.url,
  };
}

/**
 * 검색 결과 스키마를 JSON-LD 스크립트 태그 HTML로 변환
 */
export function schemaToScript(schema: object): string {
  return JSON.stringify(schema);
}
