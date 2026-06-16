import type { Metadata } from 'next';
import { fetchSecondhandItems } from '@/lib/secondhand-data';
import SecondhandPageClient from './secondhand-page-client';

type Props = {
  searchParams: Promise<{ q?: string; region?: string; sort?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  if (sp.q || (sp.region && sp.region !== '전체') || (sp.sort && sp.sort !== 'latest')) {
    return { robots: { index: false, follow: true } };
  }
  return {};
}

export default async function SecondhandPage({ searchParams }: Props) {
  const sp = await searchParams;
  const sort = (['latest', 'price_asc', 'price_desc'].includes(sp.sort || '')
    ? sp.sort
    : 'latest') as 'latest' | 'price_asc' | 'price_desc';

  const items = await fetchSecondhandItems({
    search: sp.q,
    region: sp.region || '전체',
    sort,
  });

  return (
    <SecondhandPageClient
      initialItems={items}
      searchQuery={sp.q || ''}
      regionFilter={sp.region || '전체'}
      sortBy={sort}
    />
  );
}
