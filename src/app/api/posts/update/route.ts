import { createServiceRoleClient, getSessionFromRequest } from '@/lib/admin-session';
import { canEditPostWithSession } from '@/lib/post-permissions';
import { revalidatePath } from 'next/cache';

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.id) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { postId, title, content } = await request.json();
    if (!postId || !title?.trim() || !content?.trim()) {
      return Response.json({ error: '제목과 내용은 필수입니다' }, { status: 400 });
    }

    if (!(await canEditPostWithSession(session, postId))) {
      return Response.json({ error: '수정 권한이 없습니다' }, { status: 403 });
    }

    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from('posts')
      .update({
        title: title.trim(),
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    revalidatePath('/');
    revalidatePath('/community');
    revalidatePath('/exchange-info');
    revalidatePath(`/community/${postId}`);
    revalidatePath(`/exchange-info/${postId}`);

    return Response.json({ success: true, postId });
  } catch (error) {
    console.error('[api/posts/update]', error);
    return Response.json({ error: '오류 발생' }, { status: 500 });
  }
}
