import type { Metadata } from 'next';
import Script from 'next/script';
import { SITE_CONFIG } from '@/lib/site';

export const metadata: Metadata = {
  title: 'PC방 구인구직 | 성인피씨 채용 정보 | 성피요',
  description: '성인피시 직원 구인·구직 정보를 등록하고 확인하세요. 성피요에서 성인pc 관련 일자리를 찾아보세요.',
  keywords: ['성인피씨', '성인피시', '성인피씨창업', '성인pc', 'PC방 구인', 'PC방 구직', 'PC방 구직정보'],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/jobs`,
  },
  openGraph: {
    title: 'PC방 구인구직 | 성인피씨 채용 정보',
    description: '성인피시 직원 구인·구직 정보를 등록하고 확인하세요. 성피요에서 성인pc 관련 일자리를 찾아보세요.',
    type: 'website',
    url: `${SITE_CONFIG.url}/jobs`,
    siteName: SITE_CONFIG.businessName,
    locale: 'ko_KR',
    images: [
      {
        url: `${SITE_CONFIG.url}/og-jobs.png`,
        width: 1200,
        height: 630,
        alt: 'PC방 구인구직 정보',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PC방 구인구직 | 성인PC 채용 정보',
    description: '성인PC방 직원 구인·구직 정보를 등록하고 확인하세요.',
    images: [`${SITE_CONFIG.url}/og-jobs.png`],
  },
};

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jobListingSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_CONFIG.url}/jobs`,
    name: 'PC방 구인구직',
    description: '성인PC방 직원 구인·구직 정보',
    url: `${SITE_CONFIG.url}/jobs`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: [],
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: '홈',
        item: SITE_CONFIG.url,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '구인구직',
        item: `${SITE_CONFIG.url}/jobs`,
      },
    ],
  };

  return (
    <>
      <Script
        id="jobs-collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobListingSchema) }}
      />
      <Script
        id="jobs-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
