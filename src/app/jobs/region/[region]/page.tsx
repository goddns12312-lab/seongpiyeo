'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { EMPLOYMENT_TYPE_LABELS } from '@/types';

interface Job {
  id: string;
  slug: string;
  category: string;
  title: string;
  region: string;
  employment_type?: string;
  salary?: string;
  created_at: string;
  view_count: number;
}

export default function JobsRegionPage({ params }: { params: { region: string } }) {
  const decodedRegion = decodeURIComponent(params.region);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchJobs();
  }, [decodedRegion]);

  const fetchJobs = async () => {
    try {
      const supabase = createClient();
      if (!supabase) throw new Error('Supabase not initialized');

      // 전체 개수 조회
      const { count } = await supabase
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('region', decodedRegion)
        .is('deleted_at', null);

      setTotalCount(count || 0);

      // Thin Content 정책: 콘텐츠 0개면 404
      if (!count || count === 0) {
        notFound();
      }

      // 데이터 조회
      const { data, error } = await supabase
        .from('jobs')
        .select('id, slug, category, title, region, employment_type, salary, created_at, view_count')
        .eq('status', 'active')
        .eq('region', decodedRegion)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string): string => {
    return category === 'recruitment' ? '구인' : '구직';
  };

  return (
    <div className="bg-bg-primary min-h-screen py-8 lg:py-12">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        {/* Navigation */}
        <Link href="/jobs" className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-sm font-medium mb-8 transition-colors">
          <span>←</span>
          <span>전체 공고 목록으로</span>
        </Link>

        {/* Header */}
        <div className="bg-gradient-to-r from-bg-secondary to-bg-tertiary rounded-xl p-6 lg:p-8 mb-8">
          <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-2">지역별 구인구직</p>
          <h1 className="text-3xl lg:text-4xl font-bold text-text-primary mb-2">
            {decodedRegion} PC방 공고
          </h1>
          <p className="text-text-secondary">
            {decodedRegion} 지역의 성인PC방 구인구직 정보를 한눈에 확인하세요.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-bg-secondary border border-border-light rounded-lg p-4">
            <p className="text-text-secondary text-sm">전체 공고</p>
            <p className="text-2xl font-bold text-gold">{totalCount}개</p>
          </div>
          <div className="bg-bg-secondary border border-border-light rounded-lg p-4">
            <p className="text-text-secondary text-sm">지역</p>
            <p className="text-2xl font-bold text-text-primary">{decodedRegion}</p>
          </div>
          <div className="bg-bg-secondary border border-border-light rounded-lg p-4">
            <p className="text-text-secondary text-sm">최근 공고</p>
            <p className="text-2xl font-bold text-text-primary">
              {jobs.length > 0
                ? new Date(jobs[0].created_at).toLocaleDateString('ko-KR')
                : '-'}
            </p>
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="text-center py-12 text-text-secondary">로딩 중...</div>
        ) : jobs.length === 0 ? (
          <div className="bg-bg-secondary border border-border-light rounded-xl p-12 text-center">
            <p className="text-text-secondary text-lg mb-4">아직 공고가 없습니다.</p>
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
                <div className="bg-bg-secondary border border-border-light rounded-lg p-5 hover:border-gold hover:shadow-lg transition-all cursor-pointer">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    {/* Left: Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-gold/10 text-gold text-xs font-semibold px-2 py-1 rounded">
                          {getCategoryLabel(job.category)}
                        </span>
                        {job.employment_type && (
                          <span className="bg-bg-tertiary text-text-secondary text-xs font-medium px-2 py-1 rounded">
                            {EMPLOYMENT_TYPE_LABELS[job.employment_type] || job.employment_type}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-text-primary hover:text-gold transition-colors line-clamp-2 mb-2">
                        {job.title}
                      </h3>

                      <p className="text-text-secondary text-sm mb-2">
                        📍 {job.region}
                      </p>

                      {job.salary && (
                        <p className="text-gold font-semibold text-sm">
                          {job.salary}
                        </p>
                      )}
                    </div>

                    {/* Right: Meta */}
                    <div className="flex flex-col items-end text-text-muted text-xs gap-2">
                      <span>👁️ {job.view_count.toLocaleString()}명 조회</span>
                      <span>{new Date(job.created_at).toLocaleDateString('ko-KR')}</span>
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
