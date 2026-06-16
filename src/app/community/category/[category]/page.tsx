import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  COMMUNITY_CATEGORIES,
  CommunityCategory,
} from '@/lib/community-categories';
import { fetchCommunityPosts, POSTS_PAGE_SIZE } from '@/lib/posts-data';
import { CommunityPagination } from '@/components/community/CommunitySearchBar';

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page } = await searchParams;
  const pageNum = parseInt(page || '1', 10);
  if (pageNum > 1) {
    return { robots: { index: false, follow: true } };
  }
  return {};
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category } = await params;
  const { page } = await searchParams;
  const cat = COMMUNITY_CATEGORIES[category as CommunityCategory];

  if (!cat) {
    notFound();
  }

  const currentPage = Math.max(1, parseInt(page || '1', 10) || 1);
  const { posts, total } = await fetchCommunityPosts({
    category,
    page: currentPage,
    limit: POSTS_PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(total / POSTS_PAGE_SIZE));

  return (
    <div className="bg-bg-primary min-h-screen py-8 lg:py-12">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <Link
          href="/community"
          className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-sm font-medium mb-8 transition-colors"
        >
          <span>←</span>
          <span>커뮤니티로</span>
        </Link>

        <div className="bg-gradient-to-r from-bg-secondary to-bg-tertiary rounded-xl p-6 lg:p-8 mb-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-2">
                PC방 커뮤니티
              </p>
              <h1 className={`text-3xl lg:text-4xl font-bold mb-2 ${cat.color}`}>{cat.label}</h1>
              <p className="text-text-secondary">{cat.description}</p>
            </div>
            <Link href={`/community/new?category=${category}`}>
              <button className="bg-gold hover:bg-gold/90 text-bg-primary font-bold px-6 py-3 rounded-lg transition-colors whitespace-nowrap">
                + 글쓰기
              </button>
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="bg-bg-secondary border border-border-light rounded-xl p-12 text-center">
              <p className="text-text-secondary text-lg mb-4">아직 글이 없습니다.</p>
              <Link href={`/community/new?category=${category}`}>
                <button className="text-gold hover:text-gold/80 font-semibold">
                  첫 번째 글을 작성해보세요 →
                </button>
              </Link>
            </div>
          ) : (
            posts.map((post) => (
              <Link key={post.id} href={`/community/${post.id}`}>
                <div className="bg-bg-secondary border border-border-light rounded-lg p-6 hover:border-gold hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-text-primary hover:text-gold transition-colors truncate">
                        {post.title}
                      </h3>
                      <p className="text-text-secondary text-sm mt-1 line-clamp-2">
                        {post.content.replace(/!\[[^\]]*\]\([^)]+\)/g, '').slice(0, 120)}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
                        <span>{post.authorNickname}</span>
                        <span>조회 {post.view_count || 0}</span>
                        <span>댓글 {post.commentCount}</span>
                        <span>
                          {new Date(post.created_at).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${cat.color}`}>
                      {cat.label}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        <CommunityPagination currentPage={currentPage} totalPages={totalPages} />

        <div className="mt-12 pt-8 border-t border-border-light">
          <h2 className="text-2xl font-bold text-text-primary mb-6">다른 카테고리</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(COMMUNITY_CATEGORIES).map(([key, c]) => (
              <Link key={key} href={`/community/category/${key}`}>
                <div
                  className={`bg-bg-secondary border border-border-light rounded-lg p-4 text-center hover:border-gold transition-colors cursor-pointer ${
                    category === key ? 'border-gold bg-gold/5' : ''
                  }`}
                >
                  <h3 className={`font-semibold ${c.color}`}>{c.label}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
