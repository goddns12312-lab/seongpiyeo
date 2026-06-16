import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/site';
import { createPublicClient } from '@/lib/supabase/public';
import { getCategoryInfo } from '@/lib/community-categories';
import { buildArticleSchema, buildBreadcrumbSchema } from '@/lib/seo-schema';
import { getOgImageUrl } from '@/lib/seo-assets';
import { fetchPostComments } from '@/lib/posts-data';
import CommunityDetailClient from './community-detail-client';
import { CommentSection } from '@/components/community/CommentSection';
import { PostContent } from '@/components/community/PostContent';
import { PostViewTracker } from '@/components/community/PostViewTracker';
import { ReportPostButton } from '@/components/community/ReportPostButton';
import { PostSocialActions } from '@/components/community/PostSocialActions';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  try {
    const supabase = createPublicClient();
    const { data: post } = await supabase
      .from('posts')
      .select('id, title, content, created_at, status, category')
      .eq('id', id)
      .single();

    if (!post || post.status !== 'active') {
      notFound();
    }

    if (post.category === 'exchange') {
      redirect(`/exchange-info/${id}`);
    }

    const categoryLabel = getCategoryInfo(post.category)?.label || '커뮤니티';
    const cleanContent = (post.content || '')
      .replace(/<[^>]*>/g, '')
      .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
      .replace(/\n/g, ' ')
      .trim();
    const description = cleanContent.substring(0, 160);
    const url = `${SITE_CONFIG.url}/community/${id}`;
    const ogImage = getOgImageUrl();

    return {
      title: `${post.title} | ${categoryLabel}`,
      description: description || '성인PC 관련 정보를 공유하는 커뮤니티 게시글',
      keywords: ['성인PC', '커뮤니티', '정보공유', post.title],
      robots: { index: true, follow: true },
      alternates: { canonical: url },
      openGraph: {
        title: post.title,
        description,
        type: 'article',
        url,
        siteName: SITE_CONFIG.businessName,
        locale: 'ko_KR',
        publishedTime: post.created_at,
        images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description,
        images: [ogImage],
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    notFound();
  }
}

export default async function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createPublicClient();

  const { data: post, error } = await supabase
    .from('posts')
    .select('id, title, content, created_at, status, category, user_id, view_count')
    .eq('id', id)
    .single();

  if (error || !post || post.status !== 'active') {
    notFound();
  }

  if (post.category === 'exchange') {
    redirect(`/exchange-info/${id}`);
  }

  const categoryLabel = getCategoryInfo(post.category)?.label || '커뮤니티';

  let authorNickname = '익명';
  if (post.user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', post.user_id)
      .maybeSingle();
    if (profile?.nickname) authorNickname = profile.nickname;
  }

  const [relatedPosts, comments] = await Promise.all([
    supabase
      .from('posts')
      .select('id, title, category, created_at')
      .eq('status', 'active')
      .eq('category', post.category)
      .neq('id', id)
      .order('created_at', { ascending: false })
      .limit(4)
      .then((r) => r.data || []),
    fetchPostComments(id),
  ]);

  const pageUrl = `${SITE_CONFIG.url}/community/${id}`;
  const articleSchema = buildArticleSchema({
    title: post.title,
    content: post.content,
    id,
    created_at: post.created_at,
    url: pageUrl,
  });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: '홈', url: SITE_CONFIG.url },
    { name: '커뮤니티', url: `${SITE_CONFIG.url}/community` },
    { name: post.title, url: pageUrl },
  ]);

  return (
    <div className="min-h-screen bg-bg-primary py-12">
      <PostViewTracker postId={id} />
      <div className="max-w-3xl mx-auto px-4">
        <Link href="/community" className="inline-flex items-center text-gold hover:text-gold-light mb-6">
          ← 목록으로
        </Link>

        <article>
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-4xl font-bold text-text-primary flex-1">{post.title}</h1>
            <CommunityDetailClient postId={id} />
          </div>

          <div className="flex flex-wrap gap-4 text-text-secondary text-sm mb-8 pb-8 border-b border-border-light">
            <span>카테고리: {categoryLabel}</span>
            <span>작성자: {authorNickname}</span>
            <span>작성일: {new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
            <span>조회수: {post.view_count || 0}</span>
            <span>댓글: {comments.length}</span>
          </div>

          <PostContent content={post.content || ''} />

          <PostSocialActions postId={id} />

          <div className="bg-bg-secondary border border-border-light rounded-lg p-6 mb-12">
            <CommentSection postId={id} initialComments={comments} />
            <ReportPostButton postId={id} />
          </div>

          {relatedPosts.length > 0 && (
            <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
              <h2 className="text-xl font-bold text-text-primary mb-4">📰 다른 게시글</h2>
              <div className="space-y-3">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.id}
                    href={`/community/${relatedPost.id}`}
                    className="block group p-3 border border-border-light rounded hover:border-gold hover:bg-bg-primary transition-all"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-text-primary font-semibold text-sm line-clamp-2 group-hover:text-gold transition-colors">
                          {relatedPost.title}
                        </h3>
                        <p className="text-text-muted text-xs mt-1">
                          {new Date(relatedPost.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link href={`/community/category/${post.category}`} className="block mt-4">
                <button className="w-full bg-bg-tertiary hover:bg-gold/10 text-text-primary font-semibold py-2 rounded transition-colors text-sm">
                  {categoryLabel} 전체 보기
                </button>
              </Link>
            </div>
          )}
        </article>

        <Script
          id={`article-schema-${id}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
        <Script
          id={`breadcrumb-schema-${id}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      </div>
    </div>
  );
}
