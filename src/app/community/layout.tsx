import type { Metadata } from 'next';
import Script from 'next/script';
import { SITE_CONFIG } from '@/lib/site';
import { getOgImageUrl } from '@/lib/seo-assets';
import { buildCommunityHubMetadata } from '@/lib/seo-metadata';
import { getSeoHubCounts } from '@/lib/listing-queries';
import { createPublicClient } from '@/lib/supabase/public';

const ogImage = getOgImageUrl();

export async function generateMetadata(): Promise<Metadata> {
  const { posts } = await getSeoHubCounts();
  const meta = buildCommunityHubMetadata(posts);

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    robots: { index: true, follow: true },
    alternates: { canonical: `${SITE_CONFIG.url}/community` },
    openGraph: {
      title: meta.ogTitle || meta.title,
      description: meta.ogDescription || meta.description,
      type: 'website',
      url: `${SITE_CONFIG.url}/community`,
      siteName: SITE_CONFIG.businessName,
      locale: 'ko_KR',
      images: [{ url: ogImage, width: 1200, height: 630, alt: 'PC방 커뮤니티', type: 'image/png' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.ogTitle || meta.title,
      description: meta.ogDescription || meta.description,
      images: [ogImage],
    },
  };
}

export default async function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createPublicClient();
  const { data: posts } = await supabase
    .from('posts')
    .select('id, title')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(8);

  const communityCollectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_CONFIG.url}/community`,
    name: 'PC방 커뮤니티',
    description: '성인PC방 정보공유 커뮤니티',
    url: `${SITE_CONFIG.url}/community`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: (posts || []).map((post, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${SITE_CONFIG.url}/community/${post.id}`,
        name: post.title,
      })),
    },
  };

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
        name: '커뮤니티',
        item: `${SITE_CONFIG.url}/community`,
      },
    ],
  };

  return (
    <>
      <Script
        id="community-collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(communityCollectionSchema) }}
      />
      <Script
        id="community-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
