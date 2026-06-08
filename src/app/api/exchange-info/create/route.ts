import { createClient } from '@/lib/supabase/server';
import { sanitizePostBeforeSave } from '@/lib/seo-title-auto-fix';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      console.error('[api/exchange-info/create] No authorization token provided');
      return Response.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // 토큰을 사용하여 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    console.log('[api/exchange-info/create] Auth check:', {
      token: token.substring(0, 20) + '...',
      user: user ? { id: user.id.substring(0, 8) + '...', email: user.email } : null,
      error: authError?.message,
      timestamp: new Date().toISOString(),
    });

    if (!user) {
      console.error('[api/exchange-info/create] User is null - login required', { error: authError?.message });
      return Response.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const data = await request.json();

    // SEO 제목 자동 보정 적용
    const sanitized = sanitizePostBeforeSave(data);
    console.log('[api/exchange-info/create] SEO applied:', {
      original: data.title,
      fixed: sanitized.title,
    });

    // posts 테이블에 없는 컬럼 제거
    const { _seoApplied, _seoChanges, ...postData } = sanitized;

    // user_id 추가
    const finalData = {
      ...postData,
      user_id: user.id,
    };

    console.log('[api/exchange-info/create] Saving post:', {
      title: finalData.title,
      user_id: user.id.substring(0, 8) + '...',
      category: finalData.category,
    });

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert([finalData])
      .select('id');

    if (postError) {
      console.error('[api/exchange-info/create] DB error:', postError.message);
      return Response.json(
        { error: postError.message },
        { status: 500 }
      );
    }

    if (!post || post.length === 0) {
      console.error('[api/exchange-info/create] Insert succeeded but no data returned');
      return Response.json(
        { error: '게시글 작성에 실패했습니다.' },
        { status: 500 }
      );
    }

    const newPost = post[0];

    // 캐시 무효화
    revalidatePath('/');
    revalidatePath('/exchange-info');
    revalidatePath(`/exchange-info/${newPost.id}`);

    console.log('[api/exchange-info/create] Post created:', {
      postId: newPost.id.substring(0, 8) + '...',
      user_id: newPost.user_id?.substring(0, 8) + '...',
    });

    return Response.json({ success: true, postId: newPost.id });
  } catch (error) {
    console.error('[api/exchange-info/create] Exception:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    );
  }
}
