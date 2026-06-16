import { createServiceRoleClient, getSessionFromRequest } from '@/lib/admin-session';
import { createNotification } from '@/lib/notifications';
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
    .select('id, post_id, user_id, parent_id, content, created_at')
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

    const { postId, content, parentId } = await request.json();
    if (!postId || !content?.trim()) {
      return Response.json({ error: '내용을 입력해주세요' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { data: post } = await supabase
      .from('posts')
      .select('id, category, status, user_id, title')
      .eq('id', postId)
      .single();

    if (!post || post.status !== 'active') {
      return Response.json({ error: '게시글을 찾을 수 없습니다' }, { status: 404 });
    }

    if (parentId) {
      const { data: parent } = await supabase
        .from('comments')
        .select('id, user_id')
        .eq('id', parentId)
        .eq('post_id', postId)
        .maybeSingle();
      if (!parent) {
        return Response.json({ error: '원 댓글을 찾을 수 없습니다' }, { status: 400 });
      }
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: session.id,
        parent_id: parentId || null,
        content: content.trim(),
        status: 'active',
      })
      .select('id, post_id, user_id, parent_id, content, created_at')
      .single();

    if (error) {
      console.error('[api/posts/comments]', error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }

    const linkUrl =
      post.category === 'exchange' ? `/exchange-info/${postId}` : `/community/${postId}`;

    if (parentId) {
      const { data: parentComment } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', parentId)
        .single();
      if (parentComment?.user_id && parentComment.user_id !== session.id) {
        await createNotification({
          userId: parentComment.user_id,
          type: 'reply',
          title: '내 댓글에 답글이 달렸습니다',
          body: content.trim().slice(0, 80),
          linkUrl,
        });
      }
    } else if (post.user_id && post.user_id !== session.id) {
      await createNotification({
        userId: post.user_id,
        type: 'comment',
        title: `「${post.title}」에 댓글이 달렸습니다`,
        body: content.trim().slice(0, 80),
        linkUrl,
      });
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
