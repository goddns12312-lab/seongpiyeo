import type { Metadata } from 'next';
import Script from 'next/script';
import { SITE_CONFIG } from '@/lib/site';

export const metadata: Metadata = {
  title: '공지사항 | PC방 거래 플랫폼 소식 | 성피요',
  description: '성피요 플랫폼 공지사항, 업데이트 소식, 중요 알림을 확인하세요. 성인pc 거래 관련 최신 정보를 제공합니다.',
  keywords: ['성인피씨', '성인피시', '성인피씨창업', '성인pc', '공지사항', 'PC방', '거래플랫폼', '업데이트'],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/notice`,
  },
  openGraph: {
    title: '공지사항 | PC방 거래 플랫폼 소식',
    description: '성피요 플랫폼 공지사항, 업데이트 소식, 중요 알림을 확인하세요.',
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
    title: '공지사항 | 성피요',
    description: '플랫폼 공지사항, 업데이트 소식, 중요 알림',
    images: [`${SITE_CONFIG.url}/og-notice.png`],
  },
};

export default function NoticeLayout({
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
        name: '공지사항',
        item: `${SITE_CONFIG.url}/notice`,
      },
    ],
  };

  return (
    <>
      <Script
        id="notice-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
