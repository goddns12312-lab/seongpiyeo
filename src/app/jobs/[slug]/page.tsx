import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { EMPLOYMENT_TYPE_LABELS } from '@/types';
import { Button } from '@/components/ui/Button';
import { SITE_CONFIG } from '@/lib/site';

interface Props {
  params: {
    slug: string;
  };
}

// 안전한 메타데이터 생성 (anon key로 public API 호출)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const decodedSlug = decodeURIComponent(params.slug || '');

    // API Route를 통한 공개 데이터 조회 (SERVICE_ROLE_KEY 미사용)
    const res = await fetch(
      `${SITE_CONFIG.url}/api/jobs/${encodeURIComponent(decodedSlug)}`,
      { cache: 'revalidate' }
    );

    if (!res.ok) {
      return {
        title: '공고 없음 | 성피요',
        description: '찾을 수 없는 공고입니다.',
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const job = await res.json();

    const jobTitle = `${job.title} | ${job.location || '전국'} 구인 | 성피요`;
    const jobDescription = job.description?.substring(0, 155) || '성인PC방 구인구직 정보';

    return {
      title: jobTitle,
      description: jobDescription,
      keywords: [job.title, job.location || '전국', '구인', '구직', '성인PC', 'PC방'],
      robots: {
        index: true,
        follow: true,
      },
      alternates: {
        canonical: `${SITE_CONFIG.url}/jobs/${encodeURIComponent(job.slug)}`,
      },
      openGraph: {
        title: jobTitle,
        description: jobDescription,
        type: 'website',
        url: `${SITE_CONFIG.url}/jobs/${encodeURIComponent(job.slug)}`,
        siteName: '성피요',
        locale: 'ko_KR',
      },
      twitter: {
        card: 'summary',
        title: jobTitle,
        description: jobDescription,
      },
    };
  } catch (err) {
    console.error('[generateMetadata] 오류:', err);
    return {
      title: '공고 없음',
      description: '찾을 수 없는 공고입니다.',
    };
  }
}

export default async function JobDetailPage({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug || '');

  // API Route를 통해 안전하게 데이터 조회 (anon key 사용)
  let job: any = null;
  try {
    const res = await fetch(
      `${SITE_CONFIG.url}/api/jobs/${encodeURIComponent(decodedSlug)}`,
      { cache: 'no-store' }
    );
    if (!res.ok) {
      notFound();
    }
    job = await res.json();
  } catch (err) {
    console.error('[JobDetailPage] 공고 조회 실패:', err);
    notFound();
  }

  // 조회수 증가 (비동기 처리 - API Route 호출)
  try {
    fetch(`${SITE_CONFIG.url}/api/jobs-increment-view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: job.id }),
    }).catch(() => {
      // 조회수 증가 실패 무시
    });
  } catch (err) {
    // 조회수 증가 실패 무시
  }

  // 사용자 정보 조회 (anon key로 공개 프로필만 조회)
  let user: any = null;
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('nickname, phone')
      .eq('id', job.user_id)
      .single();
    user = data;
  } catch (err) {
    // 사용자 정보 조회 실패 무시
  }

  const isRecruitement = job.category === 'recruitment';
  const primaryImage = job.images?.[0]?.url;
  const additionalImages = job.images?.slice(1) || [];
  const postDate = new Date(job.created_at);
  const formattedDate = postDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect width="800" height="600" fill="%23222222"/%3E%3Ctext x="50%25" y="50%25" font-size="24" fill="%23888888" text-anchor="middle" dominant-baseline="middle"%3E공고 이미지%3C/text%3E%3C/svg%3E';

  return (
    <div className="bg-bg-primary min-h-screen py-8 lg:py-12">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        {/* 상단 네비게이션 */}
        <Link href="/jobs" className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-sm font-medium mb-8 transition-colors">
          <span>←</span>
          <span>공고 목록으로</span>
        </Link>

        {/* 메인 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* 좌측: 이미지 및 상세 내용 (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* 헤더 카드 */}
            <div className="bg-bg-secondary border border-border-light rounded-xl p-6 lg:p-8 space-y-5">
              {/* 배지 및 카테고리 */}
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
                    {EMPLOYMENT_TYPE_LABELS[job.employment_type] || job.employment_type}
                  </span>
                )}
              </div>

              {/* 제목 */}
              <div>
                <h1 className="text-2xl lg:text-4xl font-bold text-text-primary leading-tight mb-2">
                  {job.title}
                </h1>
                {isRecruitement && job.company_name && (
                  <p className="text-lg text-gold font-semibold">
                    {job.company_name}
                  </p>
                )}
              </div>

              {/* 메타 정보 */}
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

            {/* 이미지 영역 */}
            <div className="space-y-4">
              {/* 대표 이미지 */}
              <div className="relative w-full bg-bg-tertiary rounded-xl overflow-hidden aspect-video">
                <Image
                  src={primaryImage || PLACEHOLDER}
                  alt={job.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* 이미지 갤러리 썸네일 */}
              {additionalImages.length > 0 && (
                <div className="grid grid-cols-4 lg:grid-cols-5 gap-3">
                  {additionalImages.slice(0, 5).map((img, idx) => (
                    <div key={idx} className="relative w-full bg-bg-tertiary rounded-lg overflow-hidden aspect-square group cursor-pointer">
                      <Image
                        src={img.url}
                        alt={`이미지 ${idx + 2}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                  {additionalImages.length > 5 && (
                    <div className="relative w-full bg-bg-tertiary rounded-lg overflow-hidden aspect-square flex items-center justify-center">
                      <span className="text-text-muted font-semibold">+{additionalImages.length - 5}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 상세 내용 */}
            <div className="bg-bg-secondary border border-border-light rounded-xl p-6 lg:p-8 space-y-4">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <span className="w-1 h-6 bg-gold rounded-full"></span>
                상세 내용
              </h2>
              <div className="text-text-primary whitespace-pre-wrap leading-relaxed text-base lg:text-lg">
                {job.description}
              </div>
            </div>
          </div>

          {/* 우측: 공고 요약 카드 (1/3) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              {/* 공고 요약 카드 */}
              <div className="bg-bg-secondary border border-border-light rounded-xl p-6 space-y-6">
                <h3 className="text-lg font-bold text-text-primary">공고 정보</h3>

                {/* 연락처 섹션 */}
                <div className="space-y-4 pb-6 border-b border-border-light">
                  {job.contact && (
                    <div>
                      <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-2">연락처</p>
                      <a href={`tel:${job.contact}`} className="text-gold hover:text-gold/80 font-semibold break-all transition-colors">
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

                {/* 공고 상세 정보 */}
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
                        {EMPLOYMENT_TYPE_LABELS[job.employment_type] || job.employment_type}
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

              {/* 액션 버튼 */}
              <div className="space-y-3">
                {job.contact && (
                  <a href={`tel:${job.contact}`} className="block">
                    <button className="w-full bg-gold hover:bg-gold/90 text-bg-primary font-bold py-3 rounded-lg transition-colors">
                      📞 문의하기
                    </button>
                  </a>
                )}
                <Link href="/jobs" className="block">
                  <button className="w-full bg-bg-secondary border border-border-light hover:border-gold text-text-primary font-bold py-3 rounded-lg transition-colors">
                    ← 목록으로
                  </button>
                </Link>
              </div>

              {/* 추가 정보 */}
              <div className="text-center pt-4 border-t border-border-light">
                <p className="text-text-muted text-xs">
                  게시일: {formattedDate}
                </p>
                <p className="text-text-muted text-xs">
                  조회: {(job.view_count || 0) + 1}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 영역 - 관련 공고 */}
        <div className="mt-16 pt-12 border-t border-border-light">
          <h2 className="text-2xl lg:text-3xl font-bold text-text-primary mb-8">다른 공고 보기</h2>
          <div className="bg-bg-secondary border border-border-light rounded-xl p-8 text-center">
            <p className="text-text-secondary mb-4">
              더 많은 공고를 확인하려면 공고 목록을 방문하세요.
            </p>
            <Link href="/jobs" className="inline-block">
              <button className="bg-gold hover:bg-gold/90 text-bg-primary font-bold px-6 py-3 rounded-lg transition-colors">
                공고 목록으로 이동
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
