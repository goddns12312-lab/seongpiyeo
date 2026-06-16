import { createServiceRoleClient, getSessionFromRequest } from '@/lib/admin-session';

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.id) {
    return Response.json({ liked: false, bookmarked: false, likeCount: 0 });
  }

  const { searchParams } = new URL(request.url);
  const postId = searchParams.get('postId');
  if (!postId) {
    return Response.json({ error: 'postId 필요' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const [likeRes, bookmarkRes, countRes] = await Promise.all([
    supabase.from('post_likes').select('id').eq('post_id', postId).eq('user_id', session.id).maybeSingle(),
    supabase.from('post_bookmarks').select('id').eq('post_id', postId).eq('user_id', session.id).maybeSingle(),
    supabase.from('post_likes').select('id', { count: 'exact', head: true }).eq('post_id', postId),
  ]);

  return Response.json({
    liked: !!likeRes.data,
    bookmarked: !!bookmarkRes.data,
    likeCount: countRes.count ?? 0,
  });
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.id) {
    return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const { postId, action } = await request.json();
  if (!postId || !['like', 'unlike', 'bookmark', 'unbookmark'].includes(action)) {
    return Response.json({ error: '잘못된 요청' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  if (action === 'like') {
    await supabase.from('post_likes').upsert(
      { user_id: session.id, post_id: postId },
      { onConflict: 'user_id,post_id' }
    );
  } else if (action === 'unlike') {
    await supabase.from('post_likes').delete().eq('user_id', session.id).eq('post_id', postId);
  } else if (action === 'bookmark') {
    await supabase.from('post_bookmarks').upsert(
      { user_id: session.id, post_id: postId },
      { onConflict: 'user_id,post_id' }
    );
  } else if (action === 'unbookmark') {
    await supabase.from('post_bookmarks').delete().eq('user_id', session.id).eq('post_id', postId);
  }

  const { count } = await supabase
    .from('post_likes')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postId);

  return Response.json({
    success: true,
    likeCount: count ?? 0,
    liked: action === 'like',
    unliked: action === 'unlike',
    bookmarked: action === 'bookmark',
  });
}
