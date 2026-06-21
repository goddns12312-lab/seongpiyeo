'use client';

import Link from 'next/link';
import Script from 'next/script';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense, useMemo } from 'react';
import { getSession, type AuthSession } from '@/lib/auth-session';
import type { Job } from '@/types';
import { JobCard } from '@/components/jobs/JobCard';
import { JobFilters } from '@/components/jobs/JobFilters';
import { SITE_CONFIG } from '@/lib/site';
import { Toast } from '@/components/ui/Toast';

type Props = {
  initialJobs: Job[];
  totalCount: number;
};

function JobsContent({ initialJobs, totalCount }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<AuthSession | null>(null);

  const selectedCategory = useMemo(
    () => (searchParams.get('category') || 'recruitment') as 'recruitment' | 'job_seeker',
    [searchParams]
  );
  const selectedRegion = useMemo(() => searchParams.get('region') || '', [searchParams]);
  const selectedTypes = useMemo(() => searchParams.getAll('employment_type') || [], [searchParams]);
  const searchQuery = useMemo(() => searchParams.get('search') || '', [searchParams]);

  useEffect(() => {
    setUser(getSession());
  }, []);

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

      <div className="max-w-full mx-auto px-4 lg:px-8 py-8">
        <JobFilters
          selectedRegion={selectedRegion}
          selectedTypes={selectedTypes}
          searchQuery={searchQuery}
        />

        <section className="mt-8 mb-12">
          {initialJobs.length > 0 ? (
            <>
              <div className="mb-4 text-text-secondary text-sm">
                총 {totalCount}개의 공고가 있습니다.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {initialJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                {selectedCategory === 'recruitment' ? '등록된 구인 공고가 없습니다' : '등록된 구직 정보가 없습니다'}
              </h2>
              <button
                onClick={handleNewJobClick}
                className="px-6 py-3 bg-gold text-bg-primary rounded-lg font-semibold hover:bg-gold-light transition"
              >
                첫 공고 등록하기
              </button>
            </div>
          )}
        </section>

        <section className="bg-bg-secondary border border-border-light rounded-lg p-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">
            지역별 매물 확인
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {['서울', '경기도', '인천', '부산', '대구'].map((region) => (
              <Link
                key={region}
                href={`/listings/region/${region}`}
                className="block p-4 bg-bg-tertiary hover:bg-gold/20 border border-border-light hover:border-gold rounded-lg text-center transition-colors"
              >
                <span className="font-semibold text-text-primary hover:text-gold">
                  {region}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function JobsPageClient(props: Props) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <JobsContent {...props} />
    </Suspense>
  );
}
