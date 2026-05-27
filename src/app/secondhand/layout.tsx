import type { Metadata } from 'next';
import Script from 'next/script';
import { SITE_CONFIG } from '@/lib/site';

export const metadata: Metadata = {
  title: '중고장터 | PC방 기자재 거래 | 성인피씨 중고물품',
  description: 'PC방 기자재 및 중고 물품 거래 플랫폼. PC, 의자, 모니터 등 중고 기기를 사고팔 수 있습니다. 성피요 중고장터에서 안전한 거래를 시작하세요.',
  keywords: ['성인피씨', '성인피시', '성인피씨창업', '성인pc', '중고PC', 'PC방기자재', '중고의자', '중고모니터', 'PC방용품', '중고장터'],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/secondhand`,
  },
  openGraph: {
    title: '중고장터 | PC방 기자재 거래',
    description: 'PC방 기자재 및 중고 물품 거래 플랫폼. PC, 의자, 모니터 등 중고 기기를 사고팔 수 있습니다.',
    type: 'website',
    url: `${SITE_CONFIG.url}/secondhand`,
    siteName: SITE_CONFIG.businessName,
    locale: 'ko_KR',
    images: [
      {
        url: `${SITE_CONFIG.url}/og-secondhand.png`,
        width: 1200,
        height: 630,
        alt: 'PC방 중고장터',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '중고장터 | PC방 기자재 거래',
    description: 'PC방 기자재 및 중고 물품 거래 플랫폼',
    images: [`${SITE_CONFIG.url}/og-secondhand.png`],
  },
};

export default function SecondhandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const secondhandCollectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_CONFIG.url}/secondhand`,
    name: 'PC방 중고장터',
    description: 'PC방 기자재 및 중고 물품 거래 플랫폼',
    url: `${SITE_CONFIG.url}/secondhand`,
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
        name: '중고장터',
        item: `${SITE_CONFIG.url}/secondhand`,
      },
    ],
  };

  return (
    <>
      <Script
        id="secondhand-collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(secondhandCollectionSchema) }}
      />
      <Script
        id="secondhand-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
