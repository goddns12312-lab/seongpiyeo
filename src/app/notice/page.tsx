export default function NoticePage() {
  const notices = [
    {
      id: 1,
      title: '2026년 신규 기능 업데이트 안내',
      date: '2026-05-20',
      category: '업데이트'
    },
    {
      id: 2,
      title: '중고장터 오픈 예정',
      date: '2026-05-19',
      category: '새로운서비스'
    },
    {
      id: 3,
      title: '사이트 점검 안내',
      date: '2026-05-15',
      category: '점검'
    },
    {
      id: 4,
      title: '보안 업데이트 완료',
      date: '2026-05-10',
      category: '보안'
    },
    {
      id: 5,
      title: '커뮤니티 이용 규칙 안내',
      date: '2026-05-08',
      category: '공지'
    },
    {
      id: 6,
      title: '매물 등록 수수료 변경',
      date: '2026-05-05',
      category: '정책변경'
    }
  ];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      '업데이트': 'bg-blue-500/20 text-blue-400',
      '새로운서비스': 'bg-green-500/20 text-green-400',
      '점검': 'bg-yellow-500/20 text-yellow-400',
      '보안': 'bg-red-500/20 text-red-400',
      '공지': 'bg-purple-500/20 text-purple-400',
      '정책변경': 'bg-orange-500/20 text-orange-400'
    };
    return colors[category] || 'bg-bg-tertiary text-text-secondary';
  };

  return (
    <div className="bg-bg-primary min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-text-primary mb-4">공지사항</h1>
        <p className="text-text-secondary text-lg mb-8">성피요의 최신 공지사항을 확인하세요.</p>

        <div className="space-y-3">
          {notices.map((notice) => (
            <div key={notice.id} className="bg-bg-secondary border border-border-light rounded-lg p-4 hover:border-gold transition-colors cursor-pointer">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-text-primary font-semibold mb-2">{notice.title}</h3>
                  <p className="text-text-secondary text-sm">{notice.date}</p>
                </div>
                <span className={`px-3 py-1 rounded text-sm font-semibold whitespace-nowrap ${getCategoryColor(notice.category)}`}>
                  {notice.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
