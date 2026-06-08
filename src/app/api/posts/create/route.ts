import { createClient } from '@/lib/supabase/server';
import { sanitizePostBeforeSave } from '@/lib/seo-title-auto-fix';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    // pc_bang_session 쿠키에서 사용자 세션 추출
    const cookieHeader = request.headers.get('cookie');
    console.log('[api/posts/create] Cookie header:', cookieHeader?.substring(0, 100) + '...');

    let userId: string | null = null;

    if (cookieHeader) {
      const cookies = cookieHeader.split('; ').reduce((acc, cookie) => {
        const [key, value] = cookie.split('=');
        acc[key] = decodeURIComponent(value);
        return acc;
      }, {} as Record<string, string>);

      const sessionCookie = cookies['pc_bang_session'];
      if (sessionCookie) {
        try {
          const session = JSON.parse(sessionCookie);
          userId = session.id;
          console.log('[api/posts/create] Session found:', { userId: userId?.substring(0, 8) + '...', username: session.username });
        } catch (e) {
          console.error('[api/posts/create] Failed to parse pc_bang_session:', e);
        }
      }
    }

    if (!userId) {
      console.error('[api/posts/create] No valid session found');
      return Response.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const data = await request.json();

    // SEO 제목 자동 보정 적용
    const sanitized = sanitizePostBeforeSave(data);
    console.log('[api/posts/create] SEO applied:', {
      original: data.title,
      fixed: sanitized.title,
    });

    // posts 테이블에 없는 컬럼 제거
    const { _seoApplied, _seoChanges, ...postData } = sanitized;

    // user_id 추가
    const finalData = {
      ...postData,
      user_id: userId,
    };

    console.log('[api/posts/create] Saving post:', {
      title: finalData.title,
      user_id: userId.substring(0, 8) + '...',
      category: finalData.category,
    });

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert([finalData])
      .select('id');

    if (postError) {
      console.error('[api/posts/create] DB error:', postError.message);
      return Response.json(
        { error: postError.message },
        { status: 500 }
      );
    }

    if (!post || post.length === 0) {
      console.error('[api/posts/create] Insert succeeded but no data returned');
      return Response.json(
        { error: '게시글 작성에 실패했습니다.' },
        { status: 500 }
      );
    }

    const newPost = post[0];

    // 캐시 무효화
    revalidatePath('/');
    revalidatePath('/community');
    revalidatePath(`/community/${newPost.id}`);

    console.log('[api/posts/create] Post created:', {
      postId: newPost.id.substring(0, 8) + '...',
      user_id: newPost.user_id?.substring(0, 8) + '...',
    });

    return Response.json({ success: true, postId: newPost.id });
  } catch (error) {
    console.error('[api/posts/create] Exception:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    );
  }
}
