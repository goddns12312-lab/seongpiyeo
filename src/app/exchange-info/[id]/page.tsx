import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { SITE_CONFIG } from '@/lib/site';
import { createPublicClient } from '@/lib/supabase/public';
import { buildArticleSchema, buildBreadcrumbSchema } from '@/lib/seo-schema';
import { getOgImageUrl } from '@/lib/seo-assets';
import ExchangeDetailClient from './exchange-detail-client';

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
    .select('*')
    .eq('id', id)
    .eq('category', 'exchange')
    .single();

  if (error || !post || post.status !== 'active') {
    notFound();
  }

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
            <span>작성일: {new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
            <span>조회수: {post.view_count || 0}</span>
          </div>

          <div className="prose prose-invert max-w-none mb-12 text-text-secondary">
            {(post.content || '').split('\n').map((line: string, idx: number) => (
              <div key={idx}>
                {line.startsWith('## ') ? (
                  <h2 className="text-2xl font-bold text-text-primary mt-6 mb-3">
                    {line.replace('## ', '')}
                  </h2>
                ) : line.startsWith('- ') ? (
                  <li className="ml-6 my-2">{line.replace('- ', '')}</li>
                ) : (
                  <p className="my-2">{line}</p>
                )}
              </div>
            ))}
          </div>

          <div className="bg-bg-secondary border border-border-light rounded-lg p-6">
            <h3 className="text-xl font-bold text-text-primary mb-4">댓글 (0)</h3>
            <div className="space-y-4 mb-6 text-text-secondary text-sm">
              첫 번째 댓글을 달아보세요!
            </div>
            <textarea
              placeholder="댓글을 입력하세요..."
              className="w-full bg-bg-primary border border-border-light rounded px-4 py-3 text-text-primary placeholder-text-secondary/50 mb-3"
              rows={3}
            />
            <Button variant="primary">댓글 작성</Button>
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
