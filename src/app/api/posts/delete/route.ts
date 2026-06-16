import { createServiceRoleClient, getSessionFromRequest } from '@/lib/admin-session';
import { canEditPostWithSession } from '@/lib/post-permissions';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.id) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { postId } = await request.json();
    if (!postId) {
      return Response.json({ error: '게시글 ID가 필요합니다' }, { status: 400 });
    }

    if (!(await canEditPostWithSession(session, postId))) {
      return Response.json({ error: '삭제 권한이 없습니다' }, { status: 403 });
    }

    const supabase = createServiceRoleClient();
    const { data: post } = await supabase.from('posts').select('category').eq('id', postId).single();

    const { error } = await supabase
      .from('posts')
      .update({ status: 'deleted', updated_at: new Date().toISOString() })
      .eq('id', postId);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    revalidatePath('/');
    revalidatePath('/community');
    revalidatePath('/exchange-info');

    const redirectTo = post?.category === 'exchange' ? '/exchange-info' : '/community';
    return Response.json({ success: true, redirectTo });
  } catch (error) {
    console.error('[api/posts/delete]', error);
    return Response.json({ error: '오류 발생' }, { status: 500 });
  }
}
