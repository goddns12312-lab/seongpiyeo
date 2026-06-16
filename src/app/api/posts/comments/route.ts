import { createServiceRoleClient, getSessionFromRequest } from '@/lib/admin-session';
import { revalidatePath } from 'next/cache';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get('postId');

  if (!postId) {
    return Response.json({ error: 'postId 필요' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: comments } = await supabase
    .from('comments')
    .select('id, post_id, user_id, content, created_at')
    .eq('post_id', postId)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (!comments?.length) {
    return Response.json({ comments: [] });
  }

  const userIds = [...new Set(comments.map((c) => c.user_id).filter(Boolean))] as string[];
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, nickname').in('id', userIds)
    : { data: [] as { id: string; nickname: string }[] };

  const nicknameMap = new Map((profiles || []).map((p) => [p.id, p.nickname || '익명']));

  return Response.json({
    comments: comments.map((c) => ({
      ...c,
      profiles: { nickname: c.user_id ? nicknameMap.get(c.user_id) || '익명' : '익명' },
    })),
  });
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.id) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { postId, content } = await request.json();
    if (!postId || !content?.trim()) {
      return Response.json({ error: '내용을 입력해주세요' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { data: post } = await supabase
      .from('posts')
      .select('id, category, status')
      .eq('id', postId)
      .single();

    if (!post || post.status !== 'active') {
      return Response.json({ error: '게시글을 찾을 수 없습니다' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: session.id,
        content: content.trim(),
        status: 'active',
      })
      .select('id, post_id, user_id, content, created_at')
      .single();

    if (error) {
      console.error('[api/posts/comments]', error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }

    revalidatePath(`/community/${postId}`);
    revalidatePath(`/exchange-info/${postId}`);

    return Response.json({
      comment: {
        ...data,
        profiles: { nickname: session.nickname || '익명' },
      },
    });
  } catch (error) {
    console.error('[api/posts/comments]', error);
    return Response.json({ error: '오류 발생' }, { status: 500 });
  }
}
