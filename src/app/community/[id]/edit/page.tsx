import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { canDeletePost } from '@/lib/permissions';
import CommunityEditClient from './community-edit-client';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CommunityEditPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // 현재 로그인한 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();

  // 게시글 조회
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, content, category, user_id, status, created_at')
    .eq('id', id)
    .eq('category', 'free')
    .limit(1);

  const post = posts?.[0];

  if (error || !post) {
    notFound();
  }

  // 삭제된 게시글은 수정 불가
  if (post.status === 'deleted') {
    notFound();
  }

  // 권한 확인
  if (!user) {
    // 비로그인은 로그인 페이지로
    redirect(`/login?redirect=/community/${id}/edit`);
  }

  // 로그인한 사용자의 권한 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';
  const isAuthor = post.user_id === user.id;
  const isNullOwner = post.user_id === null;

  // user_id가 NULL이면 관리자만 수정 가능
  if (isNullOwner && !isAdmin) {
    notFound();
  }

  // user_id가 있으면 관리자 또는 작성자만
  if (!isNullOwner && !isAdmin && !isAuthor) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-bg-primary py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-text-primary mb-8">게시글 수정</h1>
        <CommunityEditClient postId={id} initialData={post} />
      </div>
    </div>
  );
}
