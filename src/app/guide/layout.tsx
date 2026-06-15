import { Metadata } from 'next';
import Script from 'next/script';
import { SITE_CONFIG } from '@/lib/site';
import { createCanonicalUrl } from '@/lib/url-utils';
import { getOgImageUrl } from '@/lib/seo-assets';
import { buildGuideArticleSchema, buildWebPageSchema } from '@/lib/seo-schema';

const ogImage = getOgImageUrl();

export const metadata: Metadata = {
  title: 'PC방 창업 완벽 가이드 | 소방기준부터 수익화까지',
  description: '성인PC 창업자를 위한 완벽한 가이드. 법규, 소방기준, 장비 선택, 인테리어, 고객 관리, 수익화 전략까지 A부터 Z까지 배우세요.',
  keywords: ['PC방 창업 가이드', '성인PC 운영', 'PC방 법규', '소방기준', '창업 팁', '수익화'],
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
    canonical: createCanonicalUrl('/guide'),
  },
  openGraph: {
    title: 'PC방 창업 가이드 | 성피요',
    description: 'PC방 창업 전략과 운영 가이드',
    type: 'website',
    url: `${SITE_CONFIG.url}/guide`,
    siteName: SITE_CONFIG.businessName,
    locale: 'ko_KR',
    images: [{ url: ogImage, width: 1200, height: 630, alt: 'PC방 창업 가이드', type: 'image/png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PC방 창업 가이드',
    description: 'PC방 창업 전략과 운영 가이드',
    images: [ogImage],
  },
};

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const guideSchema = buildGuideArticleSchema();
  const webPageSchema = buildWebPageSchema(
    'PC방 창업 완벽 가이드',
    '성인PC 창업자를 위한 법규, 소방기준, 장비 선택, 수익화 전략 가이드',
    `${SITE_CONFIG.url}/guide`
  );

  return (
    <>
      <Script
        id="guide-article-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guideSchema) }}
      />
      <Script
        id="guide-webpage-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      {children}
    </>
  );
}
