import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/site';

export const metadata: Metadata = {
  title: 'PC방 창업 가이드 | 소방기준, 양도양수, 창업 팁 | 성피요',
  description: 'PC방 창업에 필요한 모든 정보를 담은 상세 가이드. 소방기준, 양도양수 방법, 창업 팁 등을 전문가 관점으로 설명합니다.',
  keywords: ['PC방창업가이드', '소방기준', '양도양수', '창업팁', '성인PC방', 'PC방법규'],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/guide`,
  },
  openGraph: {
    title: 'PC방 창업 가이드 | 소방기준, 양도양수, 창업 팁',
    description: 'PC방 창업에 필요한 모든 정보를 담은 상세 가이드',
    type: 'website',
    url: `${SITE_CONFIG.url}/guide`,
    siteName: SITE_CONFIG.businessName,
    locale: 'ko_KR',
    images: [
      {
        url: `${SITE_CONFIG.url}/og-image.png`,
        width: 1200,
        height: 630,
        alt: '성피요 PC방 창업 가이드',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PC방 창업 가이드',
    description: 'PC방 창업에 필요한 소방기준, 양도양수, 창업팁 총정리',
    images: [`${SITE_CONFIG.url}/og-image.png`],
  },
};

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
