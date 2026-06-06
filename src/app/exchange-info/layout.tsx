import type { Metadata } from 'next';
import Script from 'next/script';
import { SITE_CONFIG } from '@/lib/site';

export const metadata: Metadata = {
  title: '환수 및 정보게시판 | 성인PC 운영정보 | 성피요',
  description: '성인PC 환수율, 운영정보, 거래 팁 등을 공유하는 게시판. PC방 창업자들의 경험과 정보를 한 곳에서 확인하세요.',
  keywords: ['성인PC', '환수율', '운영정보', 'PC방 정보', 'PC방 운영팁', '환수정보'],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/exchange-info`,
  },
  openGraph: {
    title: '환수 및 정보게시판 | 성인PC 운영정보',
    description: '성인PC 환수율 및 운영정보를 공유하는 게시판',
    type: 'website',
    url: `${SITE_CONFIG.url}/exchange-info`,
    siteName: SITE_CONFIG.businessName,
    locale: 'ko_KR',
    images: [
      {
        url: `${SITE_CONFIG.url}/og-image.png`,
        width: 1200,
        height: 630,
        alt: '환수 및 정보게시판',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '환수 및 정보게시판 | 성인PC 운영정보',
    description: '성인PC 환수율 및 운영정보를 공유하는 게시판',
    images: [`${SITE_CONFIG.url}/og-image.png`],
  },
};

export default function ExchangeInfoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_CONFIG.url}/exchange-info`,
    name: '환수 및 정보게시판',
    description: '성인PC 환수율 및 운영정보 게시판',
    url: `${SITE_CONFIG.url}/exchange-info`,
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
        name: '환수정보',
        item: `${SITE_CONFIG.url}/exchange-info`,
      },
    ],
  };

  return (
    <>
      <Script
        id="exchange-info-collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <Script
        id="exchange-info-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
