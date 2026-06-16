import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchJobsByRegion, getJobPublicPath } from '@/lib/jobs-data';
import { EMPLOYMENT_TYPE_LABELS } from '@/types';

interface Props {
  params: Promise<{ region: string }>;
}

function getCategoryLabel(category: string): string {
  return category === 'recruitment' ? '구인' : '구직';
}

export default async function JobsRegionPage({ params }: Props) {
  const { region } = await params;
  const decodedRegion = decodeURIComponent(region);

  const { jobs, count } = await fetchJobsByRegion(decodedRegion);

  if (count === 0) {
    notFound();
  }

  return (
    <div className="bg-bg-primary min-h-screen py-8 lg:py-12">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-sm font-medium mb-8 transition-colors"
        >
          <span>←</span>
          <span>전체 공고 목록으로</span>
        </Link>

        <div className="bg-gradient-to-r from-bg-secondary to-bg-tertiary rounded-xl p-6 lg:p-8 mb-8">
          <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-2">지역별 구인구직</p>
          <h1 className="text-3xl lg:text-4xl font-bold text-text-primary mb-2">
            {decodedRegion} PC방 공고
          </h1>
          <p className="text-text-secondary">
            {decodedRegion} 지역의 성인PC방 구인구직 정보를 한눈에 확인하세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-bg-secondary border border-border-light rounded-lg p-4">
            <p className="text-text-secondary text-sm">전체 공고</p>
            <p className="text-2xl font-bold text-gold">{count}개</p>
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

        <div className="space-y-4">
          {jobs.map((job) => (
            <Link key={job.id} href={getJobPublicPath(job.slug)}>
              <div className="bg-bg-secondary border border-border-light rounded-lg p-5 hover:border-gold hover:shadow-lg transition-all cursor-pointer">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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

                  <div className="flex flex-col items-end text-text-muted text-xs gap-2">
                    <span>👁️ {job.view_count.toLocaleString()}명 조회</span>
                    <span>{new Date(job.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
