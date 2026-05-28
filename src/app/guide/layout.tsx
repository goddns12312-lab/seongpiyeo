import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/site';
import { createCanonicalUrl } from '@/lib/url-utils';

export const metadata: Metadata = {
  title: 'PC방 창업 가이드 | 성인피씨 운영 팁 | 성피요',
  description: 'PC방 창업부터 운영까지 필요한 모든 정보. 소방기준, 장비선택, 인테리어 팁, 고객관리 방법 등 전문가 가이드를 확인하세요.',
  keywords: ['PC방 가이드', 'PC방 창업', '성인PC', '운영 팁', '장비 선택', '인테리어'],
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
    images: [
      {
        url: `${SITE_CONFIG.url}/og-guide.png`,
        width: 1200,
        height: 630,
        alt: 'PC방 창업 가이드',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PC방 창업 가이드',
    description: 'PC방 창업 전략과 운영 가이드',
    images: [`${SITE_CONFIG.url}/og-guide.png`],
  },
};

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
