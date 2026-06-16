import { notFound, permanentRedirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { Metadata } from 'next';
import { EMPLOYMENT_TYPE_LABELS } from '@/types';
import { SITE_CONFIG } from '@/lib/site';
import { buildJobPostingSchema, buildBreadcrumbSchema } from '@/lib/seo-schema';
import { buildJobMetadata, addRobotsToMetadata, buildOptimizedJobTitle } from '@/lib/seo-metadata';
import { buildOgImageEntry, getOgImageUrl } from '@/lib/seo-assets';
import { createClient } from '@/lib/supabase/server';
import {
  fetchJobByIdentifier,
  getJobCanonicalUrl,
  getJobPublicPath,
  isJobUuid,
} from '@/lib/jobs-data';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const job = await fetchJobByIdentifier(slug);

    if (!job?.slug) {
      return {
        title: '공고 없음 | 성피요',
        description: '찾을 수 없는 공고입니다.',
        robots: { index: false, follow: false },
      };
    }

    const jobMeta = buildJobMetadata(job);
    const metaWithRobots = addRobotsToMetadata(jobMeta);
    const optimizedTitle = buildOptimizedJobTitle(job);
    const canonicalUrl = getJobCanonicalUrl(job.slug);

    return {
      title: optimizedTitle,
      description: metaWithRobots.description,
      keywords: metaWithRobots.keywords,
      robots: metaWithRobots.robots,
      alternates: metaWithRobots.alternates,
      openGraph: {
        title: metaWithRobots.ogTitle,
        description: metaWithRobots.ogDescription,
        type: 'website',
        url: canonicalUrl,
        siteName: SITE_CONFIG.businessName,
        locale: 'ko_KR',
        images: [buildOgImageEntry(`${job.title} - ${job.region || '전국'} PC방 구인`)],
      },
      twitter: {
        card: 'summary_large_image',
        title: metaWithRobots.ogTitle,
        description: metaWithRobots.ogDescription,
        images: [getOgImageUrl()],
      },
    };
  } catch {
    return {
      title: '공고 없음',
      description: '찾을 수 없는 공고입니다.',
      robots: { index: false, follow: false },
    };
  }
}

export default async function JobDetailPage({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug || '');
  const job = await fetchJobByIdentifier(decodedSlug);

  if (!job) {
    notFound();
  }

  if (isJobUuid(decodedSlug) && job.slug) {
    permanentRedirect(getJobPublicPath(job.slug));
  }

  try {
    fetch(`${SITE_CONFIG.url}/api/jobs-increment-view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: job.id }),
    }).catch(() => undefined);
  } catch {
    // ignore
  }

  let user: { nickname?: string; phone?: string } | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('profiles')
      .select('nickname, phone')
      .eq('id', job.user_id)
      .single();
    user = data;
  } catch {
    // ignore
  }

  let relatedJobs: Array<{
    id: string;
    slug: string;
    title: string;
    region: string;
    employment_type?: string;
    salary?: string;
    created_at: string;
  }> | null = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('jobs')
      .select('id, slug, title, region, employment_type, salary, created_at')
      .eq('status', 'active')
      .is('deleted_at', null)
      .eq('region', job.region)
      .neq('id', job.id)
      .order('created_at', { ascending: false })
      .limit(4);
    relatedJobs = data;
  } catch {
    // ignore
  }

  const isRecruitement = job.category === 'recruitment';
  const primaryImage = (job.images as { url: string }[] | undefined)?.[0]?.url;
  const additionalImages = ((job.images as { url: string }[] | undefined) || []).slice(1);
  const postDate = new Date(job.created_at as string);
  const formattedDate = postDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const PLACEHOLDER =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect width="800" height="600" fill="%23222222"/%3E%3Ctext x="50%25" y="50%25" font-size="24" fill="%23888888" text-anchor="middle" dominant-baseline="middle"%3E공고 이미지%3C/text%3E%3C/svg%3E';

  const jobPostingSchema = buildJobPostingSchema(job);
  const jobUrl = getJobCanonicalUrl(job.slug);

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: '홈', url: SITE_CONFIG.url },
    { name: '채용공고', url: `${SITE_CONFIG.url}/jobs` },
    { name: job.title as string, url: jobUrl },
  ]);

  return (
    <div className="bg-bg-primary min-h-screen py-8 lg:py-12">
      <Script
        id="job-posting-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }}
      />
      <Script
        id="job-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-sm font-medium mb-8 transition-colors"
        >
          <span>←</span>
          <span>공고 목록으로</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-bg-secondary border border-border-light rounded-xl p-6 lg:p-8 space-y-5">
              <div className="flex items-center gap-3 flex-wrap">
                {isRecruitement ? (
                  <div className="bg-gold/90 text-bg-primary px-3 py-1.5 rounded-full text-xs lg:text-sm font-bold">
                    구인
                  </div>
                ) : (
                  <div className="bg-blue-500/90 text-white px-3 py-1.5 rounded-full text-xs lg:text-sm font-bold">
                    구직
                  </div>
                )}
                {job.employment_type && (
                  <span className="bg-gold/10 text-gold px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold">
                    {EMPLOYMENT_TYPE_LABELS[job.employment_type as keyof typeof EMPLOYMENT_TYPE_LABELS] ||
                      job.employment_type}
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-2xl lg:text-4xl font-bold text-text-primary leading-tight mb-2">
                  {job.title}
                </h1>
                {isRecruitement && job.company_name && (
                  <p className="text-lg text-gold font-semibold">{job.company_name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border-light">
                <div>
                  <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-1">지역</p>
                  <p className="text-text-primary font-semibold">{job.region}</p>
                </div>
                {job.salary && (
                  <div>
                    <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-1">급여</p>
                    <p className="text-gold font-bold">{job.salary}</p>
                  </div>
                )}
                <div>
                  <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-1">조회</p>
                  <p className="text-text-primary font-semibold">{(job.view_count || 0) + 1}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-1">게시일</p>
                  <p className="text-text-primary font-semibold text-sm">{formattedDate}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative w-full bg-bg-tertiary rounded-xl overflow-hidden aspect-video">
                <Image
                  src={primaryImage || PLACEHOLDER}
                  alt={job.title as string}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {additionalImages.length > 0 && (
                <div className="grid grid-cols-4 lg:grid-cols-5 gap-3">
                  {additionalImages.slice(0, 5).map((img, idx) => (
                    <div
                      key={idx}
                      className="relative w-full bg-bg-tertiary rounded-lg overflow-hidden aspect-square"
                    >
                      <Image
                        src={img.url}
                        alt={`${job.title} 이미지 ${idx + 2}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-bg-secondary border border-border-light rounded-xl p-6 lg:p-8 space-y-4">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <span className="w-1 h-6 bg-gold rounded-full" />
                상세 내용
              </h2>
              <div className="text-text-primary whitespace-pre-wrap leading-relaxed text-base lg:text-lg">
                {job.description}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              <div className="bg-bg-secondary border border-border-light rounded-xl p-6 space-y-6">
                <h3 className="text-lg font-bold text-text-primary">공고 정보</h3>
                <div className="space-y-4 pb-6 border-b border-border-light">
                  {job.contact && (
                    <div>
                      <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-2">연락처</p>
                      <a
                        href={`tel:${job.contact}`}
                        className="text-gold hover:text-gold/80 font-semibold break-all transition-colors"
                      >
                        {job.contact}
                      </a>
                    </div>
                  )}
                  {user?.phone && (
                    <div>
                      <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-2">담당자</p>
                      <p className="text-text-primary font-semibold">{user.nickname || '담당자'}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {isRecruitement && job.company_name && (
                    <div>
                      <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-2">업체명</p>
                      <p className="text-text-primary font-semibold">{job.company_name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-2">지역</p>
                    <p className="text-text-primary font-semibold">{job.region}</p>
                  </div>
                  {job.employment_type && (
                    <div>
                      <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-2">고용형태</p>
                      <p className="text-text-primary font-semibold">
                        {EMPLOYMENT_TYPE_LABELS[job.employment_type as keyof typeof EMPLOYMENT_TYPE_LABELS] ||
                          job.employment_type}
                      </p>
                    </div>
                  )}
                  {job.salary && (
                    <div>
                      <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-2">급여</p>
                      <p className="text-gold font-bold text-lg">{job.salary}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {job.contact && (
                  <a href={`tel:${job.contact}`} className="block">
                    <button
                      type="button"
                      className="w-full bg-gold hover:bg-gold/90 text-bg-primary font-bold py-3 rounded-lg transition-colors"
                    >
                      📞 문의하기
                    </button>
                  </a>
                )}
                <Link href="/jobs" className="block">
                  <button
                    type="button"
                    className="w-full bg-bg-secondary border border-border-light hover:border-gold text-text-primary font-bold py-3 rounded-lg transition-colors"
                  >
                    ← 목록으로
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-12 border-t border-border-light">
          <h2 className="text-2xl lg:text-3xl font-bold text-text-primary mb-8">
            🏢 {job.region} 다른 공고
          </h2>

          {relatedJobs && relatedJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedJobs.map((relatedJob) => (
                <Link
                  key={relatedJob.id}
                  href={getJobPublicPath(relatedJob.slug)}
                  className="group bg-bg-secondary border border-border-light rounded-lg p-4 hover:border-gold hover:shadow-lg transition-all"
                >
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <span className="bg-gold/10 text-gold px-2 py-1 rounded text-xs font-semibold">
                      {relatedJob.employment_type || '채용'}
                    </span>
                  </div>
                  <h3 className="text-text-primary font-bold text-sm mb-2 line-clamp-2 group-hover:text-gold transition-colors">
                    {relatedJob.title}
                  </h3>
                  <div className="space-y-1 mb-3">
                    <p className="text-text-secondary text-xs">📍 {relatedJob.region}</p>
                    {relatedJob.salary && (
                      <p className="text-gold text-xs font-semibold">{relatedJob.salary}</p>
                    )}
                  </div>
                  <p className="text-text-muted text-xs">
                    {new Date(relatedJob.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-bg-secondary border border-border-light rounded-xl p-8 text-center">
              <p className="text-text-secondary mb-4">이 지역의 다른 공고가 없습니다.</p>
              <Link href="/jobs" className="inline-block">
                <button
                  type="button"
                  className="bg-gold hover:bg-gold/90 text-bg-primary font-bold px-6 py-3 rounded-lg transition-colors"
                >
                  전체 공고 보기
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
