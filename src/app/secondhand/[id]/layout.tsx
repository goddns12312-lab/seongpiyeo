import { Metadata } from 'next';
import Script from 'next/script';
import { createPublicClient } from '@/lib/supabase/public';
import { getSecondhandById } from '@/lib/secondhand-queries';
import { SITE_CONFIG } from '@/lib/site';
import { createCanonicalUrl } from '@/lib/url-utils';
import { buildSecondhandMetadata, addRobotsToMetadata, buildOptimizedSecondhandTitle } from '@/lib/seo-metadata';
import { buildSecondhandProductSchema, buildBreadcrumbSchema } from '@/lib/seo-schema';
import { getOgImageUrl } from '@/lib/seo-assets';

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const { id } = await params;
  const item = await getSecondhandById(id);

  if (!item || item.status !== 'active') {
    return {
      title: '물품을 찾을 수 없습니다',
      robots: { index: false, follow: false },
    };
  }

  const itemMeta = buildSecondhandMetadata(item);
  const metaWithRobots = addRobotsToMetadata(itemMeta);
  const optimizedTitle = buildOptimizedSecondhandTitle(item);
  const fallbackOg = getOgImageUrl();
  const ogImage = itemMeta.ogImage || item.main_image_url || fallbackOg;

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
          url: ogImage,
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
      images: [ogImage],
    },
  };
}

export default async function SecondhandDetailLayout({ params, children }: Props) {
  const { id } = await params;
  const item = await getSecondhandById(id);

  if (!item || item.status !== 'active') {
    return children;
  }

  const productSchema = buildSecondhandProductSchema(item);
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: '홈', url: SITE_CONFIG.url },
    { name: '중고장터', url: `${SITE_CONFIG.url}/secondhand` },
    { name: String(item.title), url: `${SITE_CONFIG.url}/secondhand/${id}` },
  ]);

  return (
    <>
      <Script
        id={`secondhand-product-schema-${id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <Script
        id={`secondhand-breadcrumb-schema-${id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
