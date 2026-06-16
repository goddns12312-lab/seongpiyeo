import { notFound, redirect } from 'next/navigation';
import { createPublicClient } from '@/lib/supabase/public';
import { getSessionFromRequest } from '@/lib/admin-session';
import { canEditPostWithSession } from '@/lib/post-permissions';
import CommunityEditClient from './community-edit-client';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CommunityEditPage({ params }: Props) {
  const { id } = await params;
  const supabase = createPublicClient();

  const { data: post, error } = await supabase
    .from('posts')
    .select('id, title, content, category, user_id, status, created_at')
    .eq('id', id)
    .neq('category', 'exchange')
    .single();

  if (error || !post) {
    notFound();
  }

  if (post.status === 'deleted' || post.status === 'hidden') {
    notFound();
  }

  const session = await getSessionFromRequest();
  if (!session) {
    redirect(`/login?redirect=/community/${id}/edit`);
  }

  if (!(await canEditPostWithSession(session, id))) {
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
