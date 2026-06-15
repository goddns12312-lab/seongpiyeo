import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/site';
import { createCanonicalUrl } from '@/lib/url-utils';
import { getOgImageUrl } from '@/lib/seo-assets';

const ogImage = getOgImageUrl();

export const metadata: Metadata = {
  title: '성인PC 창업 자주 묻는 질문 | PC방 매물 비용 법규',
  description: '성인PC방 창업 비용, 법규, 거래 방법, 구인구직 등 자주 묻는 질문(FAQ)을 한 곳에서 확인하세요. 초기비용 5,000만원~2억원, 월순이익 500~1,500만원.',
  keywords: [
    '성인PC FAQ',
    '성인피씨 자주묻는질문',
    'PC방 창업 비용',
    'PC방 월세',
    '권리금 설명',
    'PC방 보증금',
    '성인PC법규',
    'PC방 수익',
    'PC방 창업 가이드',
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: createCanonicalUrl('/faq'),
  },
  openGraph: {
    title: '성인PC 창업 자주 묻는 질문 | 성피요',
    description: '성인PC방 창업, 법규, 거래, 구인구직 FAQ - 초기비용부터 수익까지 모든 질문에 답변합니다.',
    type: 'website',
    url: `${SITE_CONFIG.url}/faq`,
    siteName: SITE_CONFIG.businessName,
    locale: 'ko_KR',
    images: [{ url: ogImage, width: 1200, height: 630, alt: '성인PC 창업 자주 묻는 질문', type: 'image/png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '성인PC 창업 자주 묻는 질문',
    description: '성인PC방 창업 비용, 법규, 거래 정보 FAQ',
    images: [ogImage],
  },
};

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
