import { Metadata } from 'next';
import Script from 'next/script';
import { SITE_CONFIG } from '@/lib/site';
import { createCanonicalUrl } from '@/lib/url-utils';
import { getOgImageUrl } from '@/lib/seo-assets';
import { buildWebPageSchema } from '@/lib/seo-schema';

const ogImage = getOgImageUrl();

export const metadata: Metadata = {
  title: '고객 지원 | 문의하기',
  description: '성피요 고객 지원. 문의사항이 있으시면 언제든지 연락주세요. 빠른 답변을 드리겠습니다.',
  keywords: ['고객 지원', '문의', 'support', '도움', '연락'],
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
    canonical: createCanonicalUrl('/support'),
  },
  openGraph: {
    title: '고객 지원',
    description: '성피요 고객 지원',
    type: 'website',
    url: `${SITE_CONFIG.url}/support`,
    siteName: SITE_CONFIG.businessName,
    locale: 'ko_KR',
    images: [{ url: ogImage, width: 1200, height: 630, alt: '성피요 고객 지원', type: 'image/png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '고객 지원',
    description: '성피요 고객 지원',
    images: [ogImage],
  },
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const webPageSchema = buildWebPageSchema(
    '고객 지원',
    '성피요 고객 지원 및 문의',
    `${SITE_CONFIG.url}/support`
  );

  return (
    <>
      <Script
        id="support-webpage-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      {children}
    </>
  );
}
