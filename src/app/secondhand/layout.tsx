import { Metadata } from 'next';
import Script from 'next/script';
import { SITE_CONFIG } from '@/lib/site';
import { createCanonicalUrl } from '@/lib/url-utils';
import { getOgImageUrl } from '@/lib/seo-assets';
import { buildCollectionPageSchema } from '@/lib/seo-schema';
import { fetchSecondhandItems } from '@/lib/secondhand-data';

const ogImage = getOgImageUrl();

export const metadata: Metadata = {
  title: 'PC방 중고장터 | 성인피씨 중고물품 거래',
  description: 'PC방 관련 중고 물품을 안전하게 거래하는 공간. 성인PC 장비, PC방 물품 구매, 판매, 렌탈 정보를 한곳에서 찾으세요.',
  keywords: ['중고', '중고장터', '성인피씨', '성인피시', 'PC방', '물품', '장비', '거래'],
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
  alternates: {
    canonical: createCanonicalUrl('/secondhand'),
  },
  openGraph: {
    title: 'PC방 중고장터 | 성피요',
    description: 'PC방 관련 중고물품 거래',
    type: 'website',
    url: `${SITE_CONFIG.url}/secondhand`,
    siteName: SITE_CONFIG.businessName,
    locale: 'ko_KR',
    images: [{ url: ogImage, width: 1200, height: 630, alt: '성피요 PC방 중고장터', type: 'image/png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PC방 중고장터',
    description: 'PC방 관련 중고물품 거래',
    images: [ogImage],
  },
};

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
