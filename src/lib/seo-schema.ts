import { SITE_CONFIG } from './site';
import { getOgImageUrl } from './seo-assets';
import { resolveListingLocation } from './listing-location';

/**
 * JSON-LD 구조화된 데이터 생성 함수 모음
 * schema.org 표준을 준수하여 구글 검색 및 AI 검색 최적화
 */

export function buildWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.businessName,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    inLanguage: 'ko-KR',
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

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.businessName,
    url: SITE_CONFIG.url,
    logo: {
      '@type': 'ImageObject',
      url: getOgImageUrl(),
    },
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

function resolveListingOfferPrice(listing: Record<string, unknown>): number {
  const premium = Number(listing.premium_price) || 0;
  const deposit = Number(listing.deposit) || 0;
  const monthly = Number(listing.monthly_rent) || 0;
  const price = Number(listing.price) || 0;
  if (premium > 0) return premium;
  if (deposit > 0) return deposit;
  if (monthly > 0) return monthly;
  return price;
}

/**
 * 매물 상세 스키마 (RealEstateListing + Offer)
 */
export function buildListingProductSchema(listing: Record<string, unknown>): object {
  const {
    title,
    description,
    area_sqm,
    pc_count,
    deposit,
    monthly_rent,
    premium_price,
    monthly_profit,
    main_image_url,
    thumbnail_url,
    id,
    created_at,
    price_type,
  } = listing;

  const resolved = resolveListingLocation(listing);
  const location = resolved.displayLocation;
  const offerPrice = resolveListingOfferPrice(listing);
  const imageUrl = main_image_url || thumbnail_url || getOgImageUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: title,
    description: description || location,
    image: imageUrl,
    url: `${SITE_CONFIG.url}/listings/${id}`,
    datePosted: created_at,
    address: {
      '@type': 'PostalAddress',
      addressRegion: resolved.region,
      addressLocality: resolved.district || resolved.locality || resolved.region,
      addressCountry: 'KR',
    },
    offers: {
      '@type': 'Offer',
      price: offerPrice,
      priceCurrency: 'KRW',
      availability: 'https://schema.org/InStock',
      businessFunction: price_type === 'sale' ? 'http://purl.org/goodrelations/v1#Sell' : 'http://purl.org/goodrelations/v1#LeaseOut',
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
      premium_price && {
        '@type': 'PropertyValue',
        name: '권리금',
        value: `${premium_price}만원`,
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
    ].filter(Boolean),
  };
}

export function buildSecondhandProductSchema(item: Record<string, unknown>): object {
  const { title, description, price, region, main_image_url, id, created_at, status } = item;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    description: description || `${region}의 중고 물품`,
    image: main_image_url || getOgImageUrl(),
    url: `${SITE_CONFIG.url}/secondhand/${id}`,
    offers: {
      '@type': 'Offer',
      price: Number(price) || 0,
      priceCurrency: 'KRW',
      availability: status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: '지역',
        value: region,
      },
    ],
    datePublished: created_at,
  };
}

export function buildJobPostingSchema(job: Record<string, unknown>): object {
  const { title, description, region, salary, employment_type, slug, created_at } = job;
  const jobSlug = slug || job.id;

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
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
    employmentType: employment_type || 'OTHER',
    datePosted: created_at,
    url: `${SITE_CONFIG.url}/jobs/${encodeURIComponent(String(jobSlug))}`,
    hiringOrganization: {
      '@type': 'Organization',
      name: SITE_CONFIG.businessName,
      url: SITE_CONFIG.url,
    },
  };
}

export function buildArticleSchema(post: {
  title: string;
  content?: string;
  id: string;
  created_at?: string;
  url: string;
  authorName?: string;
}): object {
  const plain = (post.content || '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    articleBody: plain.slice(0, 5000) || post.title,
    datePublished: post.created_at,
    author: {
      '@type': 'Person',
      name: post.authorName || SITE_CONFIG.businessName,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.businessName,
      logo: {
        '@type': 'ImageObject',
        url: getOgImageUrl(),
      },
    },
    url: post.url,
    image: getOgImageUrl(),
    mainEntityOfPage: post.url,
  };
}

/** @deprecated use buildArticleSchema */
export function buildNewsArticleSchema(post: Record<string, unknown>): object {
  return buildArticleSchema({
    title: String(post.title || ''),
    content: String(post.content || ''),
    id: String(post.id || ''),
    created_at: post.created_at as string | undefined,
    url: `${SITE_CONFIG.url}/community/${post.id}`,
    authorName: post.user_profile_name as string | undefined,
  });
}

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

export function buildLocalBusinessSchema(region?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `${SITE_CONFIG.businessName} - ${region || SITE_CONFIG.region}`,
    url: SITE_CONFIG.url,
    image: getOgImageUrl(),
    description: SITE_CONFIG.description,
    telephone: SITE_CONFIG.phone,
    email: SITE_CONFIG.email,
    address: {
      '@type': 'PostalAddress',
      addressRegion: region || SITE_CONFIG.region,
      addressCountry: 'KR',
    },
  };
}

export function buildWebPageSchema(name: string, description: string, url: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_CONFIG.businessName,
      url: SITE_CONFIG.url,
    },
  };
}

export function buildGuideArticleSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'PC방 창업 완벽 가이드',
    description: '성인PC 창업자를 위한 법규, 소방기준, 장비 선택, 수익화 전략 가이드',
    url: `${SITE_CONFIG.url}/guide`,
    author: {
      '@type': 'Organization',
      name: SITE_CONFIG.businessName,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.businessName,
      logo: {
        '@type': 'ImageObject',
        url: getOgImageUrl(),
      },
    },
    image: getOgImageUrl(),
    inLanguage: 'ko-KR',
  };
}

export function buildPersonSchema(name: string, url?: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url: url || SITE_CONFIG.url,
  };
}

export function schemaToScript(schema: object): string {
  return JSON.stringify(schema);
}
