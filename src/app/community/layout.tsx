import type { Metadata } from 'next';
import Script from 'next/script';
import { SITE_CONFIG } from '@/lib/site';
import { getOgImageUrl } from '@/lib/seo-assets';

const ogImage = getOgImageUrl();

export const metadata: Metadata = {
  title: 'PC방 커뮤니티 | 성인피씨 정보공유',
  description: '성인피시 창업 정보, 인테리어, 장비 정보를 공유하는 커뮤니티. PC방 구인구직, 운영 팁, 경험담을 나누는 공간입니다.',
  keywords: ['성인피씨', '성인피시', '성인피씨창업', '성인pc', 'PC방 커뮤니티', 'PC방 창업', 'PC방 정보', 'PC방 운영'],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/community`,
  },
  openGraph: {
    title: 'PC방 커뮤니티 | 성인PC 정보공유',
    description: '성인PC방 창업 정보, 인테리어, 장비 정보를 공유하는 커뮤니티.',
    type: 'website',
    url: `${SITE_CONFIG.url}/community`,
    siteName: SITE_CONFIG.businessName,
    locale: 'ko_KR',
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: 'PC방 커뮤니티',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PC방 커뮤니티 | 성인PC 정보공유',
    description: '성인PC방 창업 정보, 인테리어, 장비 정보를 공유하는 커뮤니티.',
    images: [ogImage],
  },
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const communityCollectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_CONFIG.url}/community`,
    name: 'PC방 커뮤니티',
    description: '성인PC방 정보공유 커뮤니티',
    url: `${SITE_CONFIG.url}/community`,
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
        name: '커뮤니티',
        item: `${SITE_CONFIG.url}/community`,
      },
    ],
  };

  return (
    <>
      <Script
        id="community-collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(communityCollectionSchema) }}
      />
      <Script
        id="community-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
