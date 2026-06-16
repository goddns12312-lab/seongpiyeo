import Link from 'next/link';
import { GUIDES } from '@/lib/guide-content';

export default function GuidePage() {
  return (
    <div className="bg-bg-primary min-h-screen py-8 lg:py-12">
      <div className="max-w-4xl mx-auto px-4 lg:px-8">
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-sm font-medium mb-6 transition-colors">
            <span>←</span>
            <span>홈으로</span>
          </Link>

          <h1 className="text-4xl lg:text-5xl font-bold text-text-primary mb-4">
            PC방 창업 가이드
          </h1>
          <p className="text-text-secondary text-lg">
            PC방 창업에 필요한 모든 정보를 한 곳에서 확인하세요.
          </p>
        </div>

        <div className="space-y-4 mb-12">
          {GUIDES.map((guide) => (
            <details
              key={guide.id}
              className="group bg-bg-secondary border border-border-light rounded-lg overflow-hidden hover:border-gold transition-all"
            >
              <summary className="w-full p-6 text-left cursor-pointer list-none hover:bg-bg-tertiary transition-colors [&::-webkit-details-marker]:hidden">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-text-primary group-open:text-gold mb-2">
                      {guide.title}
                    </h2>
                    <p className="text-text-secondary mb-3 line-clamp-2">
                      {guide.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <span className="bg-gold/10 text-gold px-2 py-1 rounded">
                        {guide.category}
                      </span>
                      <span>📖 {guide.readTime}</span>
                      <span>{guide.date}</span>
                    </div>
                  </div>
                  <span className="text-gold flex-shrink-0 transition-transform group-open:rotate-180">
                    ▼
                  </span>
                </div>
              </summary>

              <div className="px-6 py-8 bg-bg-tertiary border-t border-border-light prose prose-invert max-w-none">
                <div className="text-text-primary whitespace-pre-wrap leading-relaxed">
                  {guide.content}
                </div>
              </div>
            </details>
          ))}
        </div>

        <div className="bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-3">
            더 자세한 정보가 필요하신가요?
          </h2>
          <p className="text-text-secondary mb-6">
            PC방 창업에 관한 모든 질문을 FAQ에서 확인하세요.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/faq"
              className="bg-gold hover:bg-gold/90 text-bg-primary font-bold px-6 py-3 rounded-lg transition-colors"
            >
              자주 묻는 질문 보기
            </Link>
            <Link
              href="/listings"
              className="border border-gold text-gold hover:bg-gold/10 font-bold px-6 py-3 rounded-lg transition-colors"
            >
              전국 PC방 매물 보기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
