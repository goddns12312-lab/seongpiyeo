import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/site';

export const metadata: Metadata = {
  title: '구인공고 등록 | 성피요',
  description: 'PC방 직원 채용 공고를 등록하세요. 신속한 채용 프로세스로 필요한 인력을 빠르게 모집할 수 있습니다.',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: '구인공고 등록 | 성피요',
    description: 'PC방 직원 채용 공고를 등록하세요.',
    type: 'website',
    url: `${SITE_CONFIG.url}/jobs/new`,
    siteName: SITE_CONFIG.businessName,
  },
};

export default function JobsNewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
