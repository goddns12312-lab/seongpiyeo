import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { SITE_CONFIG } from '@/lib/site';
import { createCanonicalUrl } from '@/lib/url-utils';
import { buildSecondhandMetadata, addRobotsToMetadata, buildOptimizedSecondhandTitle } from '@/lib/seo-metadata';

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from('secondhand_items')
    .select('*, secondhand_images(url, order_num)')
    .eq('id', id)
    .single();

  if (!item || item.status !== 'active') {
    return {
      title: '물품을 찾을 수 없습니다',
      robots: { index: false, follow: false },
    };
  }

  const itemMeta = buildSecondhandMetadata(item);
  const metaWithRobots = addRobotsToMetadata(itemMeta);

  // 최적화된 제목 생성 (짧은 제목 자동 확장)
  const optimizedTitle = buildOptimizedSecondhandTitle(item);

  return {
    title: optimizedTitle,
    description: metaWithRobots.description,
    keywords: metaWithRobots.keywords,
    robots: metaWithRobots.robots,
    alternates: {
      canonical: createCanonicalUrl(`/secondhand/${id}`),
    },
    openGraph: {
      title: itemMeta.ogTitle || metaWithRobots.title,
      description: itemMeta.ogDescription || metaWithRobots.description,
      type: 'website',
      url: `${SITE_CONFIG.url}/secondhand/${id}`,
      siteName: SITE_CONFIG.businessName,
      locale: 'ko_KR',
      images: [
        {
          url: itemMeta.ogImage || `${SITE_CONFIG.url}/og-image.png`,
          width: 1200,
          height: 630,
          alt: itemMeta.ogTitle || '중고 물품',
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: itemMeta.ogTitle || metaWithRobots.title,
      description: itemMeta.ogDescription || metaWithRobots.description,
      images: [itemMeta.ogImage || `${SITE_CONFIG.url}/og-image.png`],
    },
  };
}

export default function SecondhandDetailLayout({ children }: Props) {
  return children;
}
