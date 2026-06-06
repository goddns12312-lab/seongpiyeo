import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { SITE_CONFIG } from '@/lib/site';

export const metadata: Metadata = {
  title: '게시글 작성 | 자유게시판 | 성피요',
  description: '성인PC 관련 주제로 자유롭게 게시글을 작성할 수 있습니다.',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: '게시글 작성 | 자유게시판',
    description: '성인PC 관련 주제로 자유롭게 게시글을 작성할 수 있습니다.',
    type: 'website',
    url: `${SITE_CONFIG.url}/community/new`,
    siteName: SITE_CONFIG.businessName,
    locale: 'ko_KR',
  },
};

export default function NewPostPage() {
  return (
    <div className="min-h-screen bg-bg-primary py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back Button */}
        <Link href="/community" className="inline-flex items-center text-gold hover:text-gold-light mb-6">
          ← 목록으로
        </Link>

        {/* Form */}
        <div className="bg-bg-secondary border border-border-light rounded-lg p-8">
          <h1 className="text-3xl font-bold text-text-primary mb-8">게시글 작성</h1>

          <form className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-text-primary font-semibold mb-2">제목</label>
              <input
                type="text"
                placeholder="게시글 제목을 입력하세요"
                className="w-full bg-bg-primary border border-border-light rounded px-4 py-3 text-text-primary placeholder-text-secondary/50 focus:border-gold outline-none transition"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-text-primary font-semibold mb-2">카테고리</label>
              <select className="w-full bg-bg-primary border border-border-light rounded px-4 py-3 text-text-primary focus:border-gold outline-none transition">
                <option value="">카테고리를 선택하세요</option>
                <option value="info">💡 정보공유</option>
                <option value="qa">❓ 질문답변</option>
                <option value="event">🎉 이벤트</option>
                <option value="review">🤝 거래후기</option>
              </select>
            </div>

            {/* Content */}
            <div>
              <label className="block text-text-primary font-semibold mb-2">내용</label>
              <textarea
                placeholder="게시글 내용을 입력하세요"
                className="w-full bg-bg-primary border border-border-light rounded px-4 py-3 text-text-primary placeholder-text-secondary/50 focus:border-gold outline-none transition"
                rows={10}
              />
              <p className="text-xs text-text-secondary mt-2">## 제목, - 목록 마크다운 문법을 사용할 수 있습니다</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button variant="primary" className="flex-1">작성 완료</Button>
              <Link href="/community" className="flex-1">
                <Button variant="secondary" className="w-full">취소</Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
