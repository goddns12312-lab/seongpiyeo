import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import {
  PageShell,
  PageHero,
  PageContainer,
  StatCard,
  SectionHeader,
  SurfaceCard,
  EmptyState,
} from '@/components/layout/PageShell';
import {
  COMMUNITY_CATEGORIES,
  COMMUNITY_CATEGORY_ICONS,
  CommunityCategory,
} from '@/lib/community-categories';
import { fetchCommunityPosts, POSTS_PAGE_SIZE } from '@/lib/posts-data';
import { CommunitySearchBar, CommunityPagination } from '@/components/community/CommunitySearchBar';
import { getCategoryInfo } from '@/lib/community-categories';

type Props = {
  searchParams: Promise<{ page?: string; q?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page, q } = await searchParams;
  const pageNum = parseInt(page || '1', 10);

  if (pageNum > 1 || q) {
    return {
      robots: { index: false, follow: true },
    };
  }

  return {};
}

export default async function CommunityPage({ searchParams }: Props) {
  const { page, q } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || '1', 10) || 1);
  const searchQuery = q?.trim() || '';

  const { posts, total } = await fetchCommunityPosts({
    excludeExchange: true,
    page: currentPage,
    limit: POSTS_PAGE_SIZE,
    search: searchQuery || undefined,
  });

  const totalPages = Math.max(1, Math.ceil(total / POSTS_PAGE_SIZE));

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
          {(Object.entries(COMMUNITY_CATEGORIES) as [CommunityCategory, (typeof COMMUNITY_CATEGORIES)[CommunityCategory]][]).map(
            ([key, cat]) => (
              <Link key={key} href={`/community/category/${key}`}>
                <SurfaceCard hover className="p-5 text-center h-full">
                  <div className="text-3xl mb-3">{COMMUNITY_CATEGORY_ICONS[key]}</div>
                  <h3 className="font-semibold text-text-primary mb-1">{cat.label}</h3>
                  <p className="text-xs text-text-secondary line-clamp-2">{cat.description}</p>
                </SurfaceCard>
              </Link>
            )
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <StatCard label="총 게시글" value={total || '—'} />
          <StatCard label="카테고리" value="4" accent="default" />
          <StatCard label="커뮤니티" value="활성" accent="default" />
        </div>

        <CommunitySearchBar defaultQuery={searchQuery} />

        <SectionHeader title={searchQuery ? `"${searchQuery}" 검색 결과` : '최신 게시글'} />

        {posts.length > 0 ? (
          <>
            <div className="space-y-3 mb-4">
              {posts.map((post, index) => {
                const catInfo = getCategoryInfo(post.category);
                return (
                  <SurfaceCard key={post.id} hover className="p-5" as="article">
                    <div className="flex items-start gap-4">
                      <span className="text-text-muted font-semibold text-sm w-8 shrink-0 tabular-nums">
                        {total - ((currentPage - 1) * POSTS_PAGE_SIZE + index)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {post.is_notice && (
                            <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">공지</span>
                          )}
                          {post.is_pinned && (
                            <span className="text-xs font-bold text-gold bg-gold/10 px-2 py-0.5 rounded">📌 고정</span>
                          )}
                          {catInfo && (
                            <span className={`text-xs font-medium ${catInfo.color}`}>
                              {catInfo.label}
                            </span>
                          )}
                        </div>
                        <Link
                          href={`/community/${post.id}`}
                          className="text-text-primary hover:text-gold font-semibold transition-colors block truncate mb-2"
                        >
                          {post.title}
                        </Link>
                        <div className="flex flex-wrap gap-4 text-xs text-text-muted">
                          <span>{post.authorNickname}</span>
                          <time dateTime={post.created_at}>
                            {new Date(post.created_at).toLocaleDateString('ko-KR')}
                          </time>
                          <span>조회 {post.view_count || 0}</span>
                          <span>♥ {post.likeCount}</span>
                          <span>댓글 {post.commentCount}</span>
                        </div>
                      </div>
                    </div>
                  </SurfaceCard>
                );
              })}
            </div>
            <CommunityPagination
              currentPage={currentPage}
              totalPages={totalPages}
              q={searchQuery || undefined}
            />
          </>
        ) : (
          <EmptyState
            title={searchQuery ? '검색 결과가 없습니다' : '등록된 게시글이 없습니다'}
            description={
              searchQuery
                ? '다른 검색어로 시도해 보세요'
                : '첫 번째 글을 작성해 커뮤니티를 시작해 보세요'
            }
            action={
              !searchQuery ? (
                <Link href="/community/new">
                  <Button variant="primary">첫 게시글 작성하기</Button>
                </Link>
              ) : undefined
            }
          />
        )}

        <SurfaceCard className="p-8 mt-12 mb-8">
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
