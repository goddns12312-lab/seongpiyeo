import { Metadata } from 'next';
import { buildJobsHubMetadata } from '@/lib/seo-metadata';
import { getSeoHubCounts } from '@/lib/listing-queries';
import { buildOgImageEntry, getOgImageUrl } from '@/lib/seo-assets';

export async function generateMetadata(): Promise<Metadata> {
  const { jobs } = await getSeoHubCounts();
  const meta = buildJobsHubMetadata(jobs);

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
      },
    },
    alternates: {
      canonical: meta.canonicalUrl,
    },
    openGraph: {
      title: meta.ogTitle || meta.title,
      description: meta.ogDescription || meta.description,
      type: 'website',
      url: meta.canonicalUrl,
      siteName: '성피요',
      locale: 'ko_KR',
      images: [buildOgImageEntry('성피요 PC방 구인구직')],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.ogTitle || meta.title,
      description: meta.ogDescription || meta.description,
      images: [getOgImageUrl()],
    },
  };
}

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
