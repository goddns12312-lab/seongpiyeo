import {
  PageShell,
  PageHero,
  PageContainer,
  SurfaceCard,
} from '@/components/layout/PageShell';

export default function NoticePage() {
  const notices = [
    { id: 1, title: '2026년 신규 기능 업데이트 안내', date: '2026-05-20', category: '업데이트' },
    { id: 2, title: '중고장터 오픈 예정', date: '2026-05-19', category: '새로운서비스' },
    { id: 3, title: '사이트 점검 안내', date: '2026-05-15', category: '점검' },
    { id: 4, title: '보안 업데이트 완료', date: '2026-05-10', category: '보안' },
    { id: 5, title: '커뮤니티 이용 규칙 안내', date: '2026-05-08', category: '공지' },
    { id: 6, title: '매물 등록 수수료 변경', date: '2026-05-05', category: '정책변경' },
  ];

  const categoryVariant = (category: string) => {
    const map: Record<string, string> = {
      업데이트: 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20',
      새로운서비스: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
      점검: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
      보안: 'bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/20',
      공지: 'bg-gold/10 text-gold border-gold/20',
      정책변경: 'bg-orange-500/10 text-orange-600 dark:text-orange-300 border-orange-500/20',
    };
    return map[category] || 'bg-bg-tertiary text-text-secondary border-border-light';
  };

  return (
    <PageShell>
      <PageHero
        title="공지사항"
        description="성피요의 최신 공지사항과 업데이트를 확인하세요."
        breadcrumb={[{ label: '홈', href: '/' }, { label: '공지사항' }]}
      />

      <PageContainer narrow className="py-10 md:py-12">
        <div className="space-y-3">
          {notices.map((notice) => (
            <SurfaceCard key={notice.id} hover className="p-5 cursor-pointer" as="article">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-text-primary font-semibold mb-2 leading-snug">{notice.title}</h2>
                  <time className="text-text-muted text-sm">{notice.date}</time>
                </div>
                <span
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border ${categoryVariant(notice.category)}`}
                >
                  {notice.category}
                </span>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </PageContainer>
    </PageShell>
  );
}
