import { createPublicClient } from '@/lib/supabase/public';

export type SecondhandListItem = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  region: string;
  category: string | null;
  status: string;
  created_at: string;
  main_image_url: string | null;
};

export async function fetchSecondhandItems(options?: {
  category?: string;
  region?: string;
  search?: string;
  sort?: 'latest' | 'price_asc' | 'price_desc';
  limit?: number;
}): Promise<SecondhandListItem[]> {
  const supabase = createPublicClient();

  let query = supabase
    .from('secondhand_items')
    .select('id, title, description, price, region, category, status, created_at, main_image_url')
    .eq('status', 'active');

  if (options?.category) {
    query = query.eq('category', options.category);
  }

  if (options?.region && options.region !== '전체') {
    query = query.eq('region', options.region);
  }

  if (options?.search?.trim()) {
    const q = options.search.trim();
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const sort = options?.sort || 'latest';
  if (sort === 'price_asc') {
    query = query.order('price', { ascending: true });
  } else if (sort === 'price_desc') {
    query = query.order('price', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  query = query.limit(options?.limit ?? 150);

  const { data, error } = await query;
  if (error) return [];
  return data || [];
}
