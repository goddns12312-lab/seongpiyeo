import { Metadata } from 'next';
import Script from 'next/script';
import { SITE_CONFIG } from '@/lib/site';
import { createCanonicalUrl } from '@/lib/url-utils';
import { getOgImageUrl } from '@/lib/seo-assets';
import { buildCollectionPageSchema } from '@/lib/seo-schema';
import { buildSecondhandHubMetadata } from '@/lib/seo-metadata';
import { getSeoHubCounts } from '@/lib/listing-queries';
import { fetchSecondhandItems } from '@/lib/secondhand-data';

const ogImage = getOgImageUrl();

export async function generateMetadata(): Promise<Metadata> {
  const { secondhand } = await getSeoHubCounts();
  const meta = buildSecondhandHubMetadata(secondhand);

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
      },
    },
    alternates: { canonical: createCanonicalUrl('/secondhand') },
    openGraph: {
      title: meta.ogTitle || meta.title,
      description: meta.ogDescription || meta.description,
      type: 'website',
      url: `${SITE_CONFIG.url}/secondhand`,
      siteName: SITE_CONFIG.businessName,
      locale: 'ko_KR',
      images: [{ url: ogImage, width: 1200, height: 630, alt: '성피요 PC방 중고장터', type: 'image/png' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.ogTitle || meta.title,
      description: meta.ogDescription || meta.description,
      images: [ogImage],
    },
  };
}

export default async function SecondhandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const items = await fetchSecondhandItems({ limit: 8 });

  const collectionItems = items.map((item) => ({
    name: item.title,
    url: `${SITE_CONFIG.url}/secondhand/${item.id}`,
    description: `${item.region} - ${item.price}만원`,
  }));

  const collectionSchema = buildCollectionPageSchema(
    'PC방 중고장터',
    collectionItems,
    `${SITE_CONFIG.url}/secondhand`
  );

  return (
    <>
      <Script
        id="secondhand-collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      {children}
    </>
  );
}
