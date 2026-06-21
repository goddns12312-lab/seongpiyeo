import type { Metadata } from 'next';
import Script from 'next/script';
import { SITE_CONFIG } from '@/lib/site';
import { buildOgImageEntry, getOgImageUrl } from '@/lib/seo-assets';
import { buildExchangeHubMetadata } from '@/lib/seo-metadata';
import { getSeoHubCounts } from '@/lib/listing-queries';

export async function generateMetadata(): Promise<Metadata> {
  const { exchange } = await getSeoHubCounts();
  const meta = buildExchangeHubMetadata(exchange);

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    robots: { index: true, follow: true },
    alternates: { canonical: `${SITE_CONFIG.url}/exchange-info` },
    openGraph: {
      title: meta.ogTitle || meta.title,
      description: meta.ogDescription || meta.description,
      type: 'website',
      url: `${SITE_CONFIG.url}/exchange-info`,
      siteName: SITE_CONFIG.businessName,
      locale: 'ko_KR',
      images: [buildOgImageEntry('환수 및 정보게시판')],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.ogTitle || meta.title,
      description: meta.ogDescription || meta.description,
      images: [getOgImageUrl()],
    },
  };
}

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
