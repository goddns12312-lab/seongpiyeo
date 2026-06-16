import { createServiceRoleClient, getSessionFromRequest } from '@/lib/admin-session';

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.id) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { postId, reason } = await request.json();
    if (!postId || !reason?.trim()) {
      return Response.json({ error: '신고 사유를 입력해주세요' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { data: post } = await supabase
      .from('posts')
      .select('id, status')
      .eq('id', postId)
      .single();

    if (!post || post.status !== 'active') {
      return Response.json({ error: '게시글을 찾을 수 없습니다' }, { status: 404 });
    }

    const { error } = await supabase.from('post_reports').insert({
      post_id: postId,
      reporter_id: session.id,
      reason: reason.trim(),
      status: 'pending',
    });

    if (error) {
      console.error('[api/posts/report]', error.message);
      return Response.json({ error: '신고 접수에 실패했습니다' }, { status: 500 });
    }

    return Response.json({ success: true, message: '신고가 접수되었습니다.' });
  } catch (error) {
    console.error('[api/posts/report]', error);
    return Response.json({ error: '오류 발생' }, { status: 500 });
  }
}
