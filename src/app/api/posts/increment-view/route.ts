import { createServiceRoleClient } from '@/lib/admin-session';

export async function POST(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return Response.json({ error: '게시글 ID가 필요합니다.' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('view_count')
      .eq('id', id)
      .eq('status', 'active')
      .single();

    if (fetchError || !post) {
      return Response.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
    }

    const nextCount = (post.view_count || 0) + 1;
    const { error } = await supabase.from('posts').update({ view_count: nextCount }).eq('id', id);

    if (error) {
      return Response.json({ error: '조회수 증가 실패' }, { status: 500 });
    }

    return Response.json({ success: true, view_count: nextCount });
  } catch (error) {
    console.error('[api/posts/increment-view]', error);
    return Response.json({ error: '오류 발생' }, { status: 500 });
  }
}
