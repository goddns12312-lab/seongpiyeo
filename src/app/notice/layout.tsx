import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/site';
import { createCanonicalUrl } from '@/lib/url-utils';

export const metadata: Metadata = {
  title: 'PC방 창업 공지사항 | 성인PC 최신 뉴스 | 성피요',
  description: '성인PC 창업자 및 운영자를 위한 최신 소식, 정책 변경, 업데이트 안내를 확인하세요. 중요한 알림을 놓치지 마세요.',
  keywords: ['PC방 공지사항', '성인PC 뉴스', '창업 소식', '업데이트', '정책 변경'],
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
    canonical: createCanonicalUrl('/notice'),
  },
  openGraph: {
    title: '공지사항 | 성피요',
    description: '성피요 뉴스와 공지사항',
    type: 'website',
    url: `${SITE_CONFIG.url}/notice`,
    siteName: SITE_CONFIG.businessName,
    locale: 'ko_KR',
    images: [
      {
        url: `${SITE_CONFIG.url}/og-image.png`,
        width: 1200,
        height: 630,
        alt: '성피요 공지사항',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '공지사항',
    description: '성피요 뉴스와 공지사항',
    images: [`${SITE_CONFIG.url}/og-image.png`],
  },
};

export default function NoticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
