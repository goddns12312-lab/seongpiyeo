import { createClient } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/lib/admin-session';
import { sanitizePostBeforeSave } from '@/lib/seo-title-auto-fix';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.id) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const supabase = await createClient();
    const data = await request.json();

    const sanitized = sanitizePostBeforeSave(data);
    const { _seoApplied, _seoChanges, ...postData } = sanitized;

    const finalData = {
      ...postData,
      user_id: session.id,
    };

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert([finalData])
      .select('id');

    if (postError) {
      console.error('[api/posts/create]', postError.message);
      return Response.json({ error: postError.message }, { status: 500 });
    }

    if (!post?.length) {
      return Response.json({ error: '게시글 작성에 실패했습니다.' }, { status: 500 });
    }

    const newPost = post[0];

    revalidatePath('/');
    revalidatePath('/community');
    revalidatePath(`/community/${newPost.id}`);

    return Response.json({ success: true, postId: newPost.id });
  } catch (error) {
    console.error('[api/posts/create]', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    );
  }
}
