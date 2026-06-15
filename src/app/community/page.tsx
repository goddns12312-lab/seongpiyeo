import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { createPublicClient } from '@/lib/supabase/public';
import {
  PageShell,
  PageHero,
  PageContainer,
  StatCard,
  SectionHeader,
  SurfaceCard,
  EmptyState,
} from '@/components/layout/PageShell';

export default async function CommunityPage() {
  let postsWithAuthor: any[] = [];

  try {
    const supabase = createPublicClient();

    // 모든 active 게시글 조회
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, title, created_at, status, category')
      .eq('status', 'active')
      .neq('category', 'exchange')
      .order('created_at', { ascending: false })
      .limit(6);

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
    <PageShell>
      <PageHero
        title="자유게시판"
        description="성인PC 거래 관련 자유로운 주제를 나누는 커뮤니티입니다"
        breadcrumb={[{ label: '홈', href: '/' }, { label: '자유게시판' }]}
        actions={
          <Link href="/community/new">
            <Button variant="primary">게시글 작성</Button>
          </Link>
        }
      />

      <PageContainer className="py-10 md:py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            { icon: '💡', title: '정보공유', desc: '운영 노하우' },
            { icon: '❓', title: '질문답변', desc: '궁금한 점 물어보기' },
            { icon: '🎉', title: '이벤트', desc: '커뮤니티 이벤트' },
            { icon: '🤝', title: '거래후기', desc: '만족스러운 거래' },
          ].map((cat) => (
            <SurfaceCard key={cat.title} hover className="p-5 text-center">
              <div className="text-3xl mb-3">{cat.icon}</div>
              <h3 className="font-semibold text-text-primary mb-1">{cat.title}</h3>
              <p className="text-xs text-text-secondary">{cat.desc}</p>
            </SurfaceCard>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <StatCard label="총 게시글" value={postsWithAuthor.length || '—'} />
          <StatCard label="카테고리" value="4" accent="default" />
          <StatCard label="커뮤니티" value="활성" accent="default" />
        </div>

        <SectionHeader title="최신 게시글" />

        {postsWithAuthor.length > 0 ? (
          <div className="space-y-3 mb-12">
            {postsWithAuthor.map((post, index) => (
              <SurfaceCard key={post.id} hover className="p-5" as="article">
                <div className="flex items-start gap-4">
                  <span className="text-text-muted font-semibold text-sm w-8 shrink-0 tabular-nums">
                    {postsWithAuthor.length - index}
                  </span>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/community/${post.id}`}
                      className="text-text-primary hover:text-gold font-semibold transition-colors block truncate mb-2"
                    >
                      {post.title}
                    </Link>
                    <div className="flex flex-wrap gap-4 text-xs text-text-muted">
                      <span>{post.author}</span>
                      <time>{post.date}</time>
                    </div>
                  </div>
                </div>
              </SurfaceCard>
            ))}
          </div>
        ) : (
          <EmptyState
            title="등록된 게시글이 없습니다"
            description="첫 번째 글을 작성해 커뮤니티를 시작해 보세요"
            action={
              <Link href="/community/new">
                <Button variant="primary">첫 게시글 작성하기</Button>
              </Link>
            }
          />
        )}

        <SurfaceCard className="p-8 mb-8">
          <h2 className="section-heading mb-6">커뮤니티 규칙</h2>
          <ul className="space-y-3 text-text-secondary text-sm leading-relaxed">
            {[
              '모든 회원을 존중하는 태도로 댓글을 작성해 주세요',
              '광고성 글이나 스팸은 엄격하게 제재됩니다',
              '개인정보 공유는 삼가주세요',
              '부적절한 내용은 신고 버튼으로 신고해 주세요',
            ].map((rule) => (
              <li key={rule} className="flex gap-3">
                <span className="text-gold shrink-0">✓</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </SurfaceCard>
      </PageContainer>
    </PageShell>
  );
}
