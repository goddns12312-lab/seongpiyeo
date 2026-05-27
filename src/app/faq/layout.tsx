import { Metadata } from 'next';
import Script from 'next/script';
import { SITE_CONFIG } from '@/lib/site';

export const metadata: Metadata = {
  title: '자주 묻는 질문 (FAQ) | PC방 창업 가이드 | 성피요',
  description: '성인피씨 창업, 거래, 구인구직에 관해 자주 묻는 질문들을 모았습니다. 성인pc 창업에 필요한 모든 정보를 얻을 수 있습니다.',
  keywords: ['성인피씨', '성인피시', '성인피씨창업', '성인pc', 'PC방창업', 'FAQ', '자주묻는질문', 'PC방비용', 'PC방운영팁'],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/faq`,
  },
  openGraph: {
    title: '자주 묻는 질문 (FAQ) | PC방 창업 가이드',
    description: 'PC방 창업, 거래, 구인구직에 관해 자주 묻는 질문들',
    type: 'website',
    url: `${SITE_CONFIG.url}/faq`,
    siteName: SITE_CONFIG.businessName,
    locale: 'ko_KR',
    images: [
      {
        url: `${SITE_CONFIG.url}/og-faq.png`,
        width: 1200,
        height: 630,
        alt: '성피요 FAQ',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '자주 묻는 질문 (FAQ)',
    description: 'PC방 창업에 필요한 자주 묻는 질문과 답변',
    images: [`${SITE_CONFIG.url}/og-image.png`],
  },
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        name: '자주 묻는 질문',
        item: `${SITE_CONFIG.url}/faq`,
      },
    ],
  };

  return (
    <>
      <Script
        id="faq-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
