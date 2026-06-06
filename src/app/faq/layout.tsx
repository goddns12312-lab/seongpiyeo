import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/site';
import { createCanonicalUrl } from '@/lib/url-utils';

export const metadata: Metadata = {
  title: 'PC방 자주묻는질문(FAQ) | 성인PC 창업 Q&A | 성피요',
  description: 'PC방 창업 시 자주하는 질문들과 답변. 비용, 법규, 거래 방법 등 모든 궁금증을 해결하세요.',
  keywords: ['FAQ', 'Q&A', 'PC방 질문', '성인PC', '창업 질문', '거래 방법'],
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
    canonical: createCanonicalUrl('/faq'),
  },
  openGraph: {
    title: 'PC방 자주묻는질문(FAQ) | 성피요',
    description: 'PC방 창업 Q&A',
    type: 'website',
    url: `${SITE_CONFIG.url}/faq`,
    siteName: SITE_CONFIG.businessName,
    locale: 'ko_KR',
    images: [
      {
        url: `${SITE_CONFIG.url}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'PC방 FAQ',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PC방 자주묻는질문(FAQ)',
    description: 'PC방 창업 Q&A',
    images: [`${SITE_CONFIG.url}/og-image.png`],
  },
};

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
