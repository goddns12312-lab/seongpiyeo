import { createPublicClient } from '@/lib/supabase/public';
import { SITE_CONFIG } from '@/lib/site';
import type { Job } from '@/types';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const JOB_LIST_SELECT =
  'id, category, slug, title, company_name, region, employment_type, salary, images, view_count, status, created_at';

export const JOB_DETAIL_SELECT =
  'id, category, slug, title, company_name, region, employment_type, salary, description, contact, images, view_count, status, created_at, user_id';

export function isJobUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function getJobPublicPath(slug: string): string {
  return `/jobs/${encodeURIComponent(slug)}`;
}

export function getJobCanonicalUrl(slug: string): string {
  return `${SITE_CONFIG.url}${getJobPublicPath(slug)}`;
}

export async function fetchJobByIdentifier(identifier: string) {
  const supabase = createPublicClient();
  const decoded = decodeURIComponent(identifier);

  const base = supabase
    .from('jobs')
    .select(JOB_DETAIL_SELECT)
    .eq('status', 'active')
    .is('deleted_at', null);

  const { data } = isJobUuid(decoded)
    ? await base.eq('id', decoded).maybeSingle()
    : await base.eq('slug', decoded).maybeSingle();

  return data;
}

export async function fetchJobsByCategory(category: 'recruitment' | 'job_seeker') {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('jobs')
    .select('id, slug, title, region, employment_type, salary, created_at, view_count, category')
    .eq('status', 'active')
    .is('deleted_at', null)
    .eq('category', category)
    .order('created_at', { ascending: false });

  return data || [];
}

export async function fetchJobsByRegion(region: string) {
  const supabase = createPublicClient();

  const { count } = await supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .is('deleted_at', null)
    .eq('region', region);

  const { data } = await supabase
    .from('jobs')
    .select('id, slug, category, title, region, employment_type, salary, created_at, view_count')
    .eq('status', 'active')
    .is('deleted_at', null)
    .eq('region', region)
    .order('created_at', { ascending: false });

  return { jobs: data || [], count: count || 0 };
}

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
