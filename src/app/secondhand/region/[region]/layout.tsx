import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/site';
import { formatSeoCount } from '@/lib/seo-metadata';
import { createPublicClient } from '@/lib/supabase/public';
import { buildOgImageEntry, getOgImageUrl } from '@/lib/seo-assets';

interface Props {
  params: Promise<{ region: string }>;
}

function buildRegionTitle(region: string, count: number): string {
  return `${region} PC방 중고 ${formatSeoCount(count)} | 장비·용품`;
}

function buildRegionDescription(region: string, count: number): string {
  return `${region} PC방 중고 용품 ${count}개. 장비, 가구, 소모품 등을 구매하고 판매할 수 있습니다.`.slice(0, 160);
}

function buildRegionKeywords(region: string): string {
  return [
    `${region} PC방 중고`,
    `${region} PC방 장비`,
    `${region} 중고 PC방 용품`,
    `${region} PC방 가구`,
    `PC방 중고용품`,
    '성피요',
  ].join(', ');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region } = await params;
  const decodedRegion = decodeURIComponent(region);
  const supabase = createPublicClient();

  const { count } = await supabase
    .from('secondhand_items')
    .select('id', { count: 'exact', head: true })
    .eq('region', decodedRegion)
    .eq('status', 'active');

  const itemCount = count || 0;

  // Thin Content 정책 적용
  // 0개: noindex + nofollow
  if (itemCount === 0) {
    return {
      title: `${decodedRegion} 중고 PC방 용품`,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  // 1~2개: noindex (하지만 follow)
  if (itemCount < 3) {
    return {
      title: buildRegionTitle(decodedRegion, itemCount),
      description: buildRegionDescription(decodedRegion, itemCount),
      robots: {
        index: false,
        follow: true,
      },
      alternates: {
        canonical: `${SITE_CONFIG.url}/secondhand/region/${encodeURIComponent(decodedRegion)}`,
      },
    };
  }

  // 3개 이상: index + 상세 메타데이터
  const title = buildRegionTitle(decodedRegion, itemCount);
  const description = buildRegionDescription(decodedRegion, itemCount);
  const keywords = buildRegionKeywords(decodedRegion);

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
      canonical: `${SITE_CONFIG.url}/secondhand/region/${encodeURIComponent(decodedRegion)}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_CONFIG.url}/secondhand/region/${encodeURIComponent(decodedRegion)}`,
      siteName: SITE_CONFIG.businessName,
      images: [buildOgImageEntry(`${decodedRegion} 중고 PC방 용품 - 성피요`)],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [getOgImageUrl()],
    },
  };
}

export default async function SecondhandRegionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
