import { notFound } from 'next/navigation';
import { getSecondhandById } from '@/lib/secondhand-queries';
import { SecondhandDetailClient } from './secondhand-detail-client';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SecondhandDetailPage({ params }: Props) {
  const { id } = await params;
  const item = await getSecondhandById(id);

  if (!item || item.status !== 'active') {
    notFound();
  }

  return <SecondhandDetailClient item={item} listingId={id} />;
}
