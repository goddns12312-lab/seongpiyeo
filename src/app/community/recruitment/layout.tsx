import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/site';
import { createCanonicalUrl } from '@/lib/url-utils';
import { getOgImageUrl } from '@/lib/seo-assets';

export const metadata: Metadata = {
  title: 'PC방 구인구직 게시판 | 채용·일자리',
  description: 'PC방 관련 구인구직 정보. 채용공고와 구직글을 확인하고 PC방 일자리를 찾아보세요.',
  keywords: ['PC방 구인', 'PC방 구직', '성인PC 채용', 'PC방 알바', '일자리'],
  robots: { index: true, follow: true },
  alternates: {
    canonical: createCanonicalUrl('/community/recruitment'),
  },
  openGraph: {
    title: 'PC방 구인구직 게시판 | 성피요',
    description: 'PC방 관련 구인구직 정보',
    type: 'website',
    url: `${SITE_CONFIG.url}/community/recruitment`,
    siteName: SITE_CONFIG.businessName,
    locale: 'ko_KR',
    images: [{ url: getOgImageUrl(), width: 1200, height: 630, alt: 'PC방 구인구직' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PC방 구인구직 게시판',
    description: 'PC방 관련 구인구직 정보',
    images: [getOgImageUrl()],
  },
};

export default function RecruitmentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
