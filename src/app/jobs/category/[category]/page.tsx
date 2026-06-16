import Link from 'next/link';
import { fetchJobsByCategory, getJobPublicPath } from '@/lib/jobs-data';
import { EMPLOYMENT_TYPE_LABELS } from '@/types';

const JOB_CATEGORIES = {
  recruitment: { label: '구인', color: 'text-blue-500' },
  job_seeker: { label: '구직', color: 'text-green-500' },
};

type JobCategory = keyof typeof JOB_CATEGORIES;

function isCategoryValid(category: string): category is JobCategory {
  return category in JOB_CATEGORIES;
}

interface Props {
  params: Promise<{ category: string }>;
}

export default async function JobCategoryPage({ params }: Props) {
  const { category } = await params;

  if (!isCategoryValid(category)) {
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

  const categoryInfo = JOB_CATEGORIES[category];
  const jobs = await fetchJobsByCategory(category);

  return (
    <div className="bg-bg-primary min-h-screen py-8 lg:py-12">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-sm font-medium mb-8 transition-colors"
        >
          <span>←</span>
          <span>공고 목록으로</span>
        </Link>

        <div className="bg-gradient-to-r from-bg-secondary to-bg-tertiary rounded-xl p-6 lg:p-8 mb-8">
          <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-2">PC방 구인구직</p>
          <h1 className={`text-3xl lg:text-4xl font-bold mb-2 ${categoryInfo.color}`}>
            {categoryInfo.label}
          </h1>
          <p className="text-text-secondary">
            PC방 업계 {categoryInfo.label} 공고를 확인할 수 있습니다.
          </p>
        </div>

        {jobs.length === 0 ? (
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
            {jobs.map((job) => (
              <Link key={job.id} href={getJobPublicPath(job.slug)}>
                <div className="bg-bg-secondary border border-border-light rounded-lg p-6 hover:border-gold hover:shadow-lg transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-text-primary hover:text-gold transition-colors truncate mb-2">
                        {job.title}
                      </h3>

                      <div className="flex items-center gap-4 text-text-secondary text-sm mb-2 flex-wrap">
                        <span>📍 {job.region}</span>
                        {job.employment_type && (
                          <span className="bg-gold/10 text-gold px-2 py-1 rounded text-xs font-semibold">
                            {EMPLOYMENT_TYPE_LABELS[job.employment_type] || job.employment_type}
                          </span>
                        )}
                        {job.salary && <span>💰 {job.salary}</span>}
                      </div>

                      <div className="flex items-center gap-4 text-text-muted text-xs">
                        <span>{new Date(job.created_at).toLocaleDateString('ko-KR')}</span>
                        <span>조회 {job.view_count || 0}</span>
                      </div>
                    </div>

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
