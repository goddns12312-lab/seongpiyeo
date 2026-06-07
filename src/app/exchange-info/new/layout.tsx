import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/site';

export const metadata: Metadata = {
  title: '게시글 작성 | 환수정보',
  description: '환수율 및 운영정보를 공유하는 게시글을 작성할 수 있습니다.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/exchange-info/new`,
  },
  openGraph: {
    title: '게시글 작성 | 환수정보',
    description: '환수율 및 운영정보를 공유하는 게시글을 작성할 수 있습니다.',
    type: 'website',
    url: `${SITE_CONFIG.url}/exchange-info/new`,
    siteName: SITE_CONFIG.businessName,
    locale: 'ko_KR',
  },
};

export default function ExchangeInfoNewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
