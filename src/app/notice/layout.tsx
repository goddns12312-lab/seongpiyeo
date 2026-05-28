import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/site';
import { createCanonicalUrl } from '@/lib/url-utils';

export const metadata: Metadata = {
  title: '공지사항 | 성인PC 뉴스 | 성피요',
  description: '성피요의 최신 소식과 공지사항. 서비스 업데이트, 이벤트, PC방 관련 뉴스를 확인하세요.',
  keywords: ['공지', '공지사항', '뉴스', '소식', '이벤트', '업데이트'],
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
        url: `${SITE_CONFIG.url}/og-notice.png`,
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
    images: [`${SITE_CONFIG.url}/og-notice.png`],
  },
};

export default function NoticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
