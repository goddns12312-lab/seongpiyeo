import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/server';

export default async function ExchangeInfoPage() {
  let postsWithAuthor: any[] = [];

  try {
    const supabase = await createClient();

    // 환수정보 게시글 조회
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, title, created_at, status, category')
      .eq('status', 'active')
      .eq('category', 'exchange')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Failed to fetch exchange-info posts:', error);
      postsWithAuthor = [];
    } else if (posts && posts.length > 0) {
      postsWithAuthor = posts.map((post: any) => ({
        ...post,
        author: '작성자',
        date: new Date(post.created_at).toLocaleDateString('ko-KR'),
        views: 0,
        comments: 0,
        isPinned: false,
      }));
    }
  } catch (err) {
    console.error('Exchange-info page error:', err);
    postsWithAuthor = [];
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 text-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">환수 및 정보게시판</h1>
          <p className="text-lg text-blue-100 mb-6">슬롯 환수율과 성인PC 관련 정보를 공유하는 커뮤니티입니다</p>
          <div className="flex gap-4">
            <Link href="/exchange-info/new" className="inline-block">
              <Button variant="primary" className="bg-gold hover:bg-gold-light">게시글 작성</Button>
            </Link>
            <Link href="/support" className="inline-block">
              <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border border-white/50">고객센터 문의</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Info Boxes Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="text-3xl mb-3">🎰</div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">슬롯 환수율</h3>
            <p className="text-sm text-text-secondary">기종별 환수율 정보와 트렌드를 공유합니다</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <div className="text-3xl mb-3">🛡️</div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">성인PC 운영정보</h3>
            <p className="text-sm text-text-secondary">단속 동향, 법규 준수, 운영 노하우를 공유합니다</p>
          </div>
        </div>

        {/* Posts Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-text-primary mb-8">최신 공지사항</h2>

          {/* Posts */}
          {postsWithAuthor.length > 0 ? (
          <>
          {/* Pinned Posts */}
          <div className="space-y-4 mb-10">
            {postsWithAuthor.filter((p: any) => p.isPinned).map((post: any) => (
              <div
                key={post.id}
                className="bg-gold/10 dark:bg-gold/5 border-l-4 border-gold rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-xl">📌</span>
                  <div className="flex-1">
                    <Link
                      href={`/exchange-info/${post.id}`}
                      className="text-lg font-semibold text-gold hover:text-gold-light transition-colors block mb-2"
                    >
                      {post.title}
                    </Link>
                    <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                      <span>{post.author}</span>
                      <span>{post.date}</span>
                      <span>👁 {post.views}</span>
                      <span>💬 {post.comments}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Regular Posts */}
          <div className="space-y-3">
            {postsWithAuthor.filter((p: any) => !p.isPinned).map((post: any, index: number) => (
              <div
                key={post.id}
                className="bg-bg-secondary border border-border-light rounded-lg p-5 hover:shadow-md hover:border-gold/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="text-text-secondary font-semibold text-lg w-8 flex-shrink-0">
                    {postsWithAuthor.filter((p: any) => !p.isPinned).length - index}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/exchange-info/${post.id}`}
                      className="text-gold hover:text-gold-light font-semibold transition-colors block truncate mb-2"
                    >
                      {post.title}
                    </Link>
                    <div className="flex flex-wrap gap-4 text-xs text-text-secondary">
                      <span>{post.author}</span>
                      <span>{post.date}</span>
                      <span>👁 {post.views}</span>
                      <span>💬 {post.comments}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
          ) : (
            <div className="text-center py-12">
              <p className="text-text-secondary mb-4">등록된 게시글이 없습니다</p>
              <Link href="/exchange-info/new">
                <Button variant="primary" className="bg-gold hover:bg-gold-light">첫 게시글 작성하기</Button>
              </Link>
            </div>
          )}
        </div>

        {/* FAQ Section */}
        <div className="bg-bg-secondary border border-border-light rounded-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-text-primary mb-6">자주 묻는 질문</h2>
          <div className="space-y-4">
            {[
              { q: '슬롯 환수율은 어떻게 계산되나요?', a: '환수율은 투입금 대비 배당금의 비율을 백분율로 나타낸 것입니다. 기종과 설정에 따라 다양합니다.' },
              { q: '성인PC 단속이 강화되고 있나요?', a: '최근 교육청과 경찰의 단속이 증가하고 있습니다. 법규를 준수하고 정보를 공유하여 대비하세요.' },
              { q: '운영 시 꼭 지켜야 할 법규는?', a: '미성년자 출입 금지, 유해 물질 반입 금지, 보안 준수 등이 있습니다. 자세한 내용은 게시판의 법규 가이드를 참고하세요.' },
            ].map((faq, idx) => (
              <details key={idx} className="group border-b border-border-light/50 pb-4 last:border-0">
                <summary className="cursor-pointer font-semibold text-text-primary hover:text-gold transition-colors">
                  {faq.q}
                </summary>
                <p className="text-text-secondary text-sm mt-3">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-center gap-2">
          {[1, 2].map((page) => (
            <button
              key={page}
              className={`px-4 py-2 rounded border transition-colors font-medium ${
                page === 1
                  ? 'bg-gold text-white border-gold'
                  : 'border-border-light text-text-secondary hover:text-gold hover:border-gold'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
