import { createServiceRoleClient, getSessionFromRequest } from '@/lib/admin-session';
import { appendImagesToContent } from '@/lib/post-permissions';
import { sanitizePostBeforeSave } from '@/lib/seo-title-auto-fix';
import { revalidatePath } from 'next/cache';

const EXCHANGE_SUBTYPES: Record<string, string> = {
  slot: '슬롯 환수율',
  pc: '성인PC 운영정보',
};

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.id) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const data = await request.json();
    const subtype = data.category as string;
    const subtypeLabel = EXCHANGE_SUBTYPES[subtype] || '환수정보';

    const body = appendImagesToContent(data.content || '', data.imageUrls || []);
    const contentWithTag = `**${subtypeLabel}**\n\n${body}`;

    const sanitized = sanitizePostBeforeSave({
      title: data.title,
      content: contentWithTag,
      category: 'exchange',
    });
    const { _seoApplied, _seoChanges, ...postData } = sanitized;

    const supabase = createServiceRoleClient();
    const finalData = {
      ...postData,
      category: 'exchange',
      user_id: session.id,
      status: 'active',
    };

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert([finalData])
      .select('id');

    if (postError) {
      console.error('[api/exchange-info/create]', postError.message);
      return Response.json({ error: postError.message }, { status: 500 });
    }

    if (!post?.length) {
      return Response.json({ error: '게시글 작성에 실패했습니다.' }, { status: 500 });
    }

    const newPost = post[0];

    revalidatePath('/');
    revalidatePath('/exchange-info');
    revalidatePath(`/exchange-info/${newPost.id}`);

    return Response.json({ success: true, postId: newPost.id });
  } catch (error) {
    console.error('[api/exchange-info/create]', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    );
  }
}
