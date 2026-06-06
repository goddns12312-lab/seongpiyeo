import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/site';
import { createCanonicalUrl } from '@/lib/url-utils';

export const metadata: Metadata = {
  title: 'PC방 구인구직 | 성인피씨 채용정보 | 성피요',
  description: '성인PC방 구인구직 정보. 채용공고 및 일자리 정보를 한눈에 검색하고 지원하세요. 성피요에서 안전한 거래를 경험하세요.',
  keywords: ['구인', '구직', '성인피씨', '성인피시', 'PC방', '채용', '일자리', 'PC방구인'],
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
    canonical: createCanonicalUrl('/jobs'),
  },
  openGraph: {
    title: 'PC방 구인구직 | 성피요',
    description: '성인PC방 구인구직 채용정보',
    type: 'website',
    url: `${SITE_CONFIG.url}/jobs`,
    siteName: SITE_CONFIG.businessName,
    locale: 'ko_KR',
    images: [
      {
        url: `${SITE_CONFIG.url}/og-image.png`,
        width: 1200,
        height: 630,
        alt: '성피요 PC방 구인구직',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PC방 구인구직',
    description: '성인PC방 구인구직 채용정보',
    images: [`${SITE_CONFIG.url}/og-image.png`],
  },
};

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
