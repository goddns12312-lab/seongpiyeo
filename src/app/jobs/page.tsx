'use client';

import Link from 'next/link';
import Script from 'next/script';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getSession } from '@/lib/auth-session';
import { Job, REGIONS } from '@/types';
import { JobCard } from '@/components/jobs/JobCard';
import { JobFilters } from '@/components/jobs/JobFilters';
import { SITE_CONFIG } from '@/lib/site';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';

function JobsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const selectedCategory = useMemo(
    () => (searchParams.get('category') || 'recruitment') as 'recruitment' | 'job_seeker',
    [searchParams]
  );
  const selectedRegion = useMemo(
    () => searchParams.get('region') || '',
    [searchParams]
  );
  const selectedTypes = useMemo(
    () => searchParams.getAll('employment_type') || [],
    [searchParams]
  );
  const searchQuery = useMemo(
    () => searchParams.get('search') || '',
    [searchParams]
  );

  useEffect(() => {
    const session = getSession();
    setUser(session);
  }, []);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('jobs')
        .select(
          'id, category, slug, title, company_name, region, employment_type, salary, images, view_count, status, created_at',
          { count: 'exact' }
        )
        .eq('status', 'active')
        .eq('category', selectedCategory)
        .order('created_at', { ascending: false });

      if (selectedRegion) {
        query = query.eq('region', selectedRegion);
      }

      if (selectedTypes.length > 0) {
        query = query.in('employment_type', selectedTypes);
      }

      if (searchQuery) {
        query = query.or(
          `title.ilike.%${searchQuery}%,` +
          `company_name.ilike.%${searchQuery}%,` +
          `description.ilike.%${searchQuery}%`
        );
      }

      const { data, count } = await query;

      setJobs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      setJobs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedRegion, selectedTypes, searchQuery, supabase]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleNewJobClick = () => {
    if (!user) {
      router.push(`/login?redirect=/jobs/new`);
    } else {
      router.push('/jobs/new');
    }
  };

  const jobSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'PC방 구인구직',
    url: `${SITE_CONFIG.url}/jobs`,
  };

  return (
    <div className="page-shell">
      <Toast />
      <Script
        id="jobs-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobSchema) }}
      />

      <header className="page-hero">
        <div className="page-hero-inner-wide">
          <nav className="breadcrumb" aria-label="breadcrumb">
            <Link href="/">홈</Link>
            <span className="breadcrumb-sep">/</span>
            <span className="text-text-secondary">구인구직</span>
          </nav>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div className="flex-1 max-w-2xl">
              <h1 className="text-3xl lg:text-4xl font-bold text-text-primary tracking-tight mb-2">
                PC방 구인구직
              </h1>
              <p className="text-text-secondary text-sm md:text-base">
                성인PC방 직원 구인·구직 정보를 등록하고 확인하세요.
              </p>
            </div>
            <button
              onClick={handleNewJobClick}
              className="px-6 py-3 bg-gold text-bg-primary rounded-xl font-semibold hover:bg-gold-light transition whitespace-nowrap shadow-sm"
            >
              공고 올리기
            </button>
          </div>
        </div>
      </header>

      <section className="sticky top-16 z-30 border-b border-border-light bg-bg-secondary/90 backdrop-blur-md">
        <div className="max-w-full mx-auto px-4 lg:px-8">
          <div className="flex gap-0">
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set('category', 'recruitment');
                router.push(`/jobs?${params.toString()}`);
              }}
              className={`px-6 py-4 font-semibold text-sm border-b-2 transition ${
                selectedCategory === 'recruitment'
                  ? 'border-gold text-gold-light'
                  : 'border-transparent text-text-secondary hover:text-gold'
              }`}
            >
              📋 구인 공고
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set('category', 'job_seeker');
                router.push(`/jobs?${params.toString()}`);
              }}
              className={`px-6 py-4 font-semibold text-sm border-b-2 transition ${
                selectedCategory === 'job_seeker'
                  ? 'border-gold text-gold-light'
                  : 'border-transparent text-text-secondary hover:text-gold'
              }`}
            >
              👤 구직 등록
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-4 lg:px-8 py-8">
        {/* Filters */}
        <JobFilters
          selectedRegion={selectedRegion}
          selectedTypes={selectedTypes}
          searchQuery={searchQuery}
        />

        {/* Jobs Grid */}
        <section className="mt-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-bg-secondary rounded-lg h-80 animate-pulse" />
              ))}
            </div>
          ) : jobs.length > 0 ? (
            <>
              <div className="mb-4 text-text-secondary text-sm">
                총 {totalCount}개의 공고가 있습니다.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                {selectedCategory === 'recruitment' ? '등록된 구인 공고가 없습니다' : '등록된 구직 정보가 없습니다'}
              </h2>
              <p className="text-text-secondary mb-6">
                {selectedCategory === 'recruitment'
                  ? '원하는 공고를 등록하고 인재를 모집하세요.'
                  : '당신의 직무 정보를 등록하고 기회를 찾아보세요.'}
              </p>
              <button
                onClick={handleNewJobClick}
                className="px-6 py-3 bg-gold text-bg-primary rounded-lg font-semibold hover:bg-gold-light transition"
              >
                첫 공고 등록하기
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <JobsContent />
    </Suspense>
  );
}
