import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/site';
import { buildOgImageEntry, getOgImageUrl } from '@/lib/seo-assets';
import { createPublicClient } from '@/lib/supabase/public';

interface Props {
  params: Promise<{ region: string }>;
}

function buildRegionTitle(region: string, count: number): string {
  return `${region} 성인PC방 구인구직 공고 ${count}개`;
}

function buildRegionDescription(region: string, count: number): string {
  return `${region} 성인PC방 구인구직 ${count}개 공고. 정규직, 계약직, 아르바이트 채용정보를 성피요에서 확인하세요.`.slice(0, 160);
}

function buildRegionKeywords(region: string): string {
  return [
    `${region} PC방 구인`,
    `${region} PC방 알바`,
    `${region} 성인PC방 채용`,
    `${region} PC방 구직`,
    `${region} PC방 아르바이트`,
    `PC방 채용`,
    '성피요',
  ].join(', ');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region } = await params;
  const decodedRegion = decodeURIComponent(region);
  const supabase = createPublicClient();

  const { count } = await supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('region', decodedRegion)
    .eq('status', 'active')
    .is('deleted_at', null);

  const jobCount = count || 0;

  // Thin Content 정책 적용
  // 0개: noindex + nofollow
  if (jobCount === 0) {
    return {
      title: `${decodedRegion} PC방 구인구직`,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  // 1~4개: noindex (하지만 follow)
  if (jobCount < 5) {
    return {
      title: buildRegionTitle(decodedRegion, jobCount),
      description: buildRegionDescription(decodedRegion, jobCount),
      robots: {
        index: false,
        follow: true,
      },
      alternates: {
        canonical: `${SITE_CONFIG.url}/jobs/region/${encodeURIComponent(decodedRegion)}`,
      },
    };
  }

  // 5개 이상: index + 상세 메타데이터
  const title = buildRegionTitle(decodedRegion, jobCount);
  const description = buildRegionDescription(decodedRegion, jobCount);
  const keywords = buildRegionKeywords(decodedRegion);
  const ogImageEntry = buildOgImageEntry(`${decodedRegion} PC방 구인 - 성피요`);

  return {
    title,
    description,
    keywords,
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
      canonical: `${SITE_CONFIG.url}/jobs/region/${encodeURIComponent(decodedRegion)}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_CONFIG.url}/jobs/region/${encodeURIComponent(decodedRegion)}`,
      siteName: SITE_CONFIG.businessName,
      images: [ogImageEntry],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [getOgImageUrl()],
    },
  };
}

export default async function JobsRegionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
