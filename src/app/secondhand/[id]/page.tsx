import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SecondhandDetailClient } from './secondhand-detail-client';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SecondhandDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item, error } = await supabase
    .from('secondhand_items')
    .select('id, title, description, price, region, status, created_at, main_image_url, user_id, updated_at')
    .eq('id', id)
    .eq('status', 'active')
    .single();

  if (error || !item) {
    notFound();
  }

  return <SecondhandDetailClient item={item} listingId={id} />;
}
