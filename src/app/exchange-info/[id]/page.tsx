import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/site';
import { createPublicClient } from '@/lib/supabase/public';
import { buildArticleSchema, buildBreadcrumbSchema } from '@/lib/seo-schema';
import { getOgImageUrl } from '@/lib/seo-assets';
import { fetchPostComments } from '@/lib/posts-data';
import ExchangeDetailClient from './exchange-detail-client';
import { CommentSection } from '@/components/community/CommentSection';
import { PostContent } from '@/components/community/PostContent';
import { PostViewTracker } from '@/components/community/PostViewTracker';
import { ReportPostButton } from '@/components/community/ReportPostButton';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  try {
    const supabase = createPublicClient();
    const { data: post } = await supabase
      .from('posts')
      .select('id, title, content, category, created_at, status')
      .eq('id', id)
      .eq('category', 'exchange')
      .single();

    if (!post || post.status !== 'active') {
      notFound();
    }

    const cleanContent = (post.content || '')
      .replace(/<[^>]*>/g, '')
      .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
      .replace(/\n/g, ' ')
      .trim();
    const description = cleanContent.substring(0, 160);
    const url = `${SITE_CONFIG.url}/exchange-info/${id}`;
    const ogImage = getOgImageUrl();

    return {
      title: `${post.title} | 환수정보`,
      description: description || '성인PC 환수율 및 운영정보 게시글',
      keywords: ['성인PC', '환수정보', '운영정보', post.title],
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
  } catch {
    notFound();
  }
}

export default async function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createPublicClient();

  const { data: post, error } = await supabase
    .from('posts')
    .select('id, title, content, category, created_at, updated_at, status, view_count, user_id')
    .eq('id', id)
    .eq('category', 'exchange')
    .single();

  if (error || !post || post.status !== 'active') {
    notFound();
  }

  let authorNickname = '익명';
  if (post.user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', post.user_id)
      .maybeSingle();
    if (profile?.nickname) authorNickname = profile.nickname;
  }

  const comments = await fetchPostComments(id);

  const pageUrl = `${SITE_CONFIG.url}/exchange-info/${id}`;
  const articleSchema = buildArticleSchema({
    title: post.title,
    content: post.content,
    id,
    created_at: post.created_at,
    url: pageUrl,
  });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: '홈', url: SITE_CONFIG.url },
    { name: '환수정보', url: `${SITE_CONFIG.url}/exchange-info` },
    { name: post.title, url: pageUrl },
  ]);

  return (
    <div className="min-h-screen bg-bg-primary py-12">
      <PostViewTracker postId={id} />
      <div className="max-w-3xl mx-auto px-4">
        <Link href="/exchange-info" className="inline-flex items-center text-gold hover:text-gold-light mb-6">
          ← 목록으로
        </Link>

        <article>
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-4xl font-bold text-text-primary flex-1">{post.title}</h1>
            <ExchangeDetailClient postId={id} />
          </div>

          <div className="flex flex-wrap gap-4 text-text-secondary text-sm mb-8 pb-8 border-b border-border-light">
            <span>작성자: {authorNickname}</span>
            <span>작성일: {new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
            <span>조회수: {post.view_count || 0}</span>
            <span>댓글: {comments.length}</span>
          </div>

          <PostContent content={post.content || ''} />

          <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
            <CommentSection postId={id} initialComments={comments} />
            <ReportPostButton postId={id} />
          </div>
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
