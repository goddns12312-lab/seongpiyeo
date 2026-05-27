import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { CommentSection } from '@/components/community/CommentSection';
import { formatDateTime } from '@/lib/utils';
import { CATEGORY_LABELS } from '@/types';
import { SITE_CONFIG } from '@/lib/site';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from('posts')
    .select('*, profiles(nickname)')
    .eq('id', id)
    .single();

  if (!post) {
    return {
      title: '게시글을 찾을 수 없습니다.',
    };
  }

  const categoryLabel = CATEGORY_LABELS[post.category as keyof typeof CATEGORY_LABELS] || '커뮤니티';
  const title = `${post.title} - ${categoryLabel}`;
  const rawDescription = post.content.replace(/[^\w\s가-힣]/g, ' ').replace(/\s+/g, ' ').trim();
  const description = rawDescription.substring(0, 160);
  const author = (post as any).profiles?.nickname || '익명의 사용자';

  return {
    title,
    description,
    authors: [{ name: author }],
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/community/${id}`,
    },
    openGraph: {
      title: `${title} | ${SITE_CONFIG.businessName}`,
      description,
      type: 'article',
      url: `${SITE_CONFIG.url}/community/${id}`,
      siteName: SITE_CONFIG.businessName,
      authors: [author],
      images: [
        {
          url: `${SITE_CONFIG.url}/og-community.png`,
          width: 1200,
          height: 630,
          alt: `${categoryLabel} - ${post.title}`,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_CONFIG.businessName}`,
      description,
      images: [`${SITE_CONFIG.url}/og-community.png`],
    },
  };
}

export default async function PostDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Get post
  const { data: post } = await supabase
    .from('posts')
    .select('*, profiles(nickname)')
    .eq('id', id)
    .single();

  if (!post) {
    notFound();
  }

  // Get comments
  const { data: comments } = await supabase
    .from('comments')
    .select('*, profiles(nickname)')
    .eq('post_id', id)
    .order('created_at', { ascending: true });

  // Increment view count
  await supabase
    .from('posts')
    .update({ view_count: post.view_count + 1 })
    .eq('id', id);

  // Article JSON-LD Schema
  const author = (post as any).profiles?.nickname || '익명의 사용자';
  const categoryLabel = CATEGORY_LABELS[post.category as keyof typeof CATEGORY_LABELS] || '커뮤니티';
  const rawDescription = post.content.replace(/[^\w\s가-힣]/g, ' ').replace(/\s+/g, ' ').trim();

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: rawDescription.substring(0, 160),
    image: `${SITE_CONFIG.url}/og-community.png`,
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    author: {
      '@type': 'Person',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.businessName,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.url}/423432.png`,
      },
    },
    articleSection: categoryLabel,
    keywords: [categoryLabel, '성인PC', '커뮤니티', 'PC방'],
    articleBody: post.content,
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: '홈',
        item: SITE_CONFIG.url,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '커뮤니티',
        item: `${SITE_CONFIG.url}/community`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `${SITE_CONFIG.url}/community/${id}`,
      },
    ],
  };

  return (
    <div className="bg-bg-primary min-h-screen py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="max-w-3xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex gap-2 text-sm text-text-secondary mb-6">
          <Link href="/" className="hover:text-gold">홈</Link>
          <span>/</span>
          <Link href="/community" className="hover:text-gold">커뮤니티</Link>
          <span>/</span>
          <span>{CATEGORY_LABELS[post.category as keyof typeof CATEGORY_LABELS]}</span>
        </div>

        {/* Post */}
        <article className="bg-bg-secondary border border-border-light rounded-lg p-6 md:p-8 mb-8">
          <div className="mb-4">
            <Badge variant="info">
              {CATEGORY_LABELS[post.category as keyof typeof CATEGORY_LABELS]}
            </Badge>
          </div>

          <h1 className="text-3xl font-bold text-text-primary mb-4">{post.title}</h1>

          <div className="flex justify-between items-center text-text-secondary text-sm mb-6 pb-6 border-b border-border-light">
            <div>
              <p className="font-semibold text-text-primary mb-1">
                {author}
              </p>
              <p>{formatDateTime(post.created_at)}</p>
            </div>
            <p>조회수 {post.view_count + 1}</p>
          </div>

          <div className="prose prose-invert max-w-none mb-6">
            <p className="text-text-primary whitespace-pre-wrap">{post.content}</p>
          </div>

          <Link href="/community" className="text-gold hover:text-opacity-80">
            ← 목록으로 돌아가기
          </Link>
        </article>

        {/* Comments */}
        <div className="bg-bg-secondary border border-border-light rounded-lg p-6 md:p-8">
          <CommentSection postId={id} initialComments={comments || []} />
        </div>
      </div>
    </div>
  );
}
