import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/server';

export default async function CommunityPage() {
  let postsWithAuthor: any[] = [];

  try {
    const supabase = await createClient();

    // 모든 active 게시글 조회
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, title, created_at, status, category')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(6);

    console.log('[Community] Posts query result:', { count: posts?.length, error: error?.message });

    if (error) {
      console.error('Failed to fetch posts:', error);
      postsWithAuthor = [];
    } else if (posts && posts.length > 0) {
      postsWithAuthor = posts.map((post: any) => ({
        ...post,
        author: '작성자',
        date: new Date(post.created_at).toLocaleDateString('ko-KR'),
        views: 0,
        comments: 0,
      }));
    }
  } catch (err) {
    console.error('Community page error:', err);
    postsWithAuthor = [];
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-800 dark:to-pink-800 text-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">자유게시판</h1>
          <p className="text-lg text-purple-100 mb-6">성인PC 거래 관련 자유로운 주제를 나누는 커뮤니티입니다</p>
          <Link href="/community/new">
            <Button variant="primary" className="bg-gold hover:bg-gold-light">게시글 작성</Button>
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Category Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          <div className="bg-bg-secondary border border-border-light rounded-lg p-5 hover:shadow-md transition-shadow">
            <div className="text-3xl mb-2">💡</div>
            <h3 className="font-semibold text-text-primary mb-1">정보공유</h3>
            <p className="text-xs text-text-secondary">운영 노하우</p>
          </div>
          <div className="bg-bg-secondary border border-border-light rounded-lg p-5 hover:shadow-md transition-shadow">
            <div className="text-3xl mb-2">❓</div>
            <h3 className="font-semibold text-text-primary mb-1">질문답변</h3>
            <p className="text-xs text-text-secondary">궁금한 점 물어보기</p>
          </div>
          <div className="bg-bg-secondary border border-border-light rounded-lg p-5 hover:shadow-md transition-shadow">
            <div className="text-3xl mb-2">🎉</div>
            <h3 className="font-semibold text-text-primary mb-1">이벤트</h3>
            <p className="text-xs text-text-secondary">커뮤니티 이벤트</p>
          </div>
          <div className="bg-bg-secondary border border-border-light rounded-lg p-5 hover:shadow-md transition-shadow">
            <div className="text-3xl mb-2">🤝</div>
            <h3 className="font-semibold text-text-primary mb-1">거래후기</h3>
            <p className="text-xs text-text-secondary">만족스러운 거래</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">234</div>
            <div className="text-sm text-text-secondary">총 게시글</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">1.2K</div>
            <div className="text-sm text-text-secondary">총 댓글</div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-amber-600 dark:text-amber-400 mb-2">892</div>
            <div className="text-sm text-text-secondary">활성 회원</div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-text-primary mb-8">최신 게시글</h2>

          {postsWithAuthor.length > 0 ? (
            <div className="space-y-3">
              {postsWithAuthor.map((post, index) => (
                <div
                  key={post.id}
                  className="bg-bg-secondary border border-border-light rounded-lg p-5 hover:shadow-md hover:border-gold/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-text-secondary font-semibold text-lg w-8 flex-shrink-0">
                      {postsWithAuthor.length - index}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/community/${post.id}`}
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
          ) : (
            <div className="text-center py-12">
              <p className="text-text-secondary mb-4">등록된 게시글이 없습니다</p>
              <Link href="/community/new">
                <Button variant="primary" className="bg-gold hover:bg-gold-light">첫 게시글 작성하기</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Rules Section */}
        <div className="bg-bg-secondary border border-border-light rounded-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-text-primary mb-6">커뮤니티 규칙</h2>
          <ul className="space-y-3 text-text-secondary">
            <li className="flex gap-3">
              <span className="text-gold">✓</span>
              <span>모든 회원을 존중하는 태도로 댓글을 작성해 주세요</span>
            </li>
            <li className="flex gap-3">
              <span className="text-gold">✓</span>
              <span>광고성 글이나 스팸은 엄격하게 제재됩니다</span>
            </li>
            <li className="flex gap-3">
              <span className="text-gold">✓</span>
              <span>개인정보 공유는 삼가주세요</span>
            </li>
            <li className="flex gap-3">
              <span className="text-gold">✓</span>
              <span>부적절한 내용은 신고 버튼으로 신고해 주세요</span>
            </li>
          </ul>
        </div>

        {/* Pagination */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3].map((page) => (
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
