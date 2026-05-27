import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/site';

export const metadata: Metadata = {
  title: 'PC방 구인구직 | 성피요',
  description: '성인PC방 직원 구인·구직 정보를 등록하고 확인하세요. 성피요에서 PC방 관련 일자리를 찾아보세요.',
  keywords: ['PC방 구인', 'PC방 구직', '성인PC 채용', 'PC방 일자리', '성피요'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/jobs`,
  },
  openGraph: {
    title: 'PC방 구인구직 | 성피요',
    description: '성인PC방 직원 구인·구직 정보를 등록하고 확인하세요.',
    type: 'website',
    url: `${SITE_CONFIG.url}/jobs`,
    siteName: SITE_CONFIG.businessName,
  },
};

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
