import type { Metadata } from 'next';
import { fetchJobsList } from '@/lib/jobs-data';
import { getTopListingRegions } from '@/lib/listing-queries';
import JobsPageClient from './jobs-page-client';

type Props = {
  searchParams: Promise<{
    category?: string;
    region?: string;
    employment_type?: string | string[];
    search?: string;
  }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const hasFilters =
    sp.category ||
    sp.region ||
    sp.search ||
    (Array.isArray(sp.employment_type) ? sp.employment_type.length : sp.employment_type);
  if (hasFilters) {
    return { robots: { index: false, follow: true } };
  }
  return {};
}

export default async function JobsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const category = (sp.category === 'job_seeker' ? 'job_seeker' : 'recruitment') as 'recruitment' | 'job_seeker';
  const employmentTypes = Array.isArray(sp.employment_type)
    ? sp.employment_type
    : sp.employment_type
      ? [sp.employment_type]
      : [];

  const [{ jobs, total }, topRegions] = await Promise.all([
    fetchJobsList({
      category,
      region: sp.region || undefined,
      employmentTypes: employmentTypes.length ? employmentTypes : undefined,
      search: sp.search || undefined,
    }),
    getTopListingRegions(5),
  ]);

  return <JobsPageClient initialJobs={jobs} totalCount={total} topRegions={topRegions} />;
}
