import { createPublicClient } from '@/lib/supabase/public';
import type { Job } from '@/types';

export async function fetchJobsList(options: {
  category: 'recruitment' | 'job_seeker';
  region?: string;
  employmentTypes?: string[];
  search?: string;
}): Promise<{ jobs: Job[]; total: number }> {
  const supabase = createPublicClient();

  let query = supabase
    .from('jobs')
    .select(
      'id, category, slug, title, company_name, region, employment_type, salary, images, view_count, status, created_at',
      { count: 'exact' }
    )
    .eq('status', 'active')
    .eq('category', options.category)
    .order('created_at', { ascending: false });

  if (options.region) {
    query = query.eq('region', options.region);
  }

  if (options.employmentTypes?.length) {
    query = query.in('employment_type', options.employmentTypes);
  }

  if (options.search?.trim()) {
    const q = options.search.trim();
    query = query.or(
      `title.ilike.%${q}%,company_name.ilike.%${q}%,description.ilike.%${q}%`
    );
  }

  const { data, count, error } = await query;

  if (error) {
    return { jobs: [], total: 0 };
  }

  return { jobs: (data || []) as Job[], total: count ?? 0 };
}
