'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const JOB_CATEGORIES = {
  recruitment: { label: '구인', color: 'text-blue-500' },
  job_seeker: { label: '구직', color: 'text-green-500' },
};

type JobCategory = keyof typeof JOB_CATEGORIES;

function isCategoryValid(category: string): category is JobCategory {
  return category in JOB_CATEGORIES;
}

export default function JobCategoryPage({ params }: { params: { category: string } }) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const category = params.category as JobCategory;
  const categoryInfo = JOB_CATEGORIES[category];

  useEffect(() => {
    fetchJobs();
  }, [category]);

  const fetchJobs = async () => {
    try {
      const supabase = createClient();
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase
        .from('jobs')
        .select('id, slug, title, region, employment_type, salary, created_at, view_count')
        .eq('status', 'active')
        .is('deleted_at', null)
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!categoryInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary mb-4">카테고리를 찾을 수 없습니다.</p>
          <Link href="/jobs">
            <button className="text-gold hover:text-gold/80 font-semibold">
              ← 공고 목록으로 돌아가기
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-primary min-h-screen py-8 lg:py-12">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        {/* Navigation */}
        <Link href="/jobs" className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-sm font-medium mb-8 transition-colors">
          <span>←</span>
          <span>공고 목록으로</span>
        </Link>

        {/* Header */}
        <div className="bg-gradient-to-r from-bg-secondary to-bg-tertiary rounded-xl p-6 lg:p-8 mb-8">
          <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-2">PC방 구인구직</p>
          <h1 className={`text-3xl lg:text-4xl font-bold mb-2 ${categoryInfo.color}`}>
            {categoryInfo.label}
          </h1>
          <p className="text-text-secondary">
            PC방 업계 {categoryInfo.label} 공고를 확인할 수 있습니다.
          </p>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="text-center py-12 text-text-secondary">로딩 중...</div>
        ) : jobs.length === 0 ? (
          <div className="bg-bg-secondary border border-border-light rounded-xl p-12 text-center">
            <p className="text-text-secondary text-lg mb-4">아직 {categoryInfo.label} 공고가 없습니다.</p>
            <Link href="/jobs">
              <button className="text-gold hover:text-gold/80 font-semibold">
                전체 공고 보기 →
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <Link key={job.id} href={`/jobs/${encodeURIComponent(job.slug)}`}>
                <div className="bg-bg-secondary border border-border-light rounded-lg p-6 hover:border-gold hover:shadow-lg transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <h3 className="text-lg font-semibold text-text-primary hover:text-gold transition-colors truncate mb-2">
                        {job.title}
                      </h3>

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-text-secondary text-sm mb-2 flex-wrap">
                        <span>📍 {job.region}</span>
                        {job.employment_type && (
                          <span className="bg-gold/10 text-gold px-2 py-1 rounded text-xs font-semibold">
                            {job.employment_type}
                          </span>
                        )}
                        {job.salary && <span>💰 {job.salary}</span>}
                      </div>

                      {/* Date and Views */}
                      <div className="flex items-center gap-4 text-text-muted text-xs">
                        <span>{new Date(job.created_at).toLocaleDateString('ko-KR')}</span>
                        <span>조회 {job.view_count || 0}</span>
                      </div>
                    </div>

                    {/* Category Badge */}
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${categoryInfo.color}`}>
                      {categoryInfo.label}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
