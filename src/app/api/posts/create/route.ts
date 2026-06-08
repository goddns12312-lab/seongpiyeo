import { createClient } from '@/lib/supabase/server';
import { sanitizePostBeforeSave } from '@/lib/seo-title-auto-fix';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    // pc_bang_session 쿠키에서 사용자 세션 추출
    const cookieHeader = request.headers.get('cookie');

    console.log('='.repeat(80));
    console.log('[api/posts/create] 📋 Cookie 디버깅 시작');
    console.log('='.repeat(80));
    console.log('[api/posts/create] 1️⃣ cookieHeader (raw):', {
      exists: !!cookieHeader,
      length: cookieHeader?.length || 0,
      value: cookieHeader || 'null',
    });

    let userId: string | null = null;

    if (cookieHeader) {
      const cookies = cookieHeader.split('; ').reduce((acc, cookie) => {
        const eqIndex = cookie.indexOf('=');
        if (eqIndex > -1) {
          const key = cookie.substring(0, eqIndex);
          const value = cookie.substring(eqIndex + 1);
          acc[key] = decodeURIComponent(value);
        }
        return acc;
      }, {} as Record<string, string>);

      console.log('[api/posts/create] 2️⃣ 파싱된 cookies:', {
        keys: Object.keys(cookies),
        cookieCount: Object.keys(cookies).length,
      });

      const sessionCookie = cookies['pc_bang_session'];
      console.log('[api/posts/create] 3️⃣ sessionCookie (raw):', {
        exists: !!sessionCookie,
        length: sessionCookie?.length || 0,
        value: sessionCookie || 'null',
      });

      if (sessionCookie) {
        try {
          const session = JSON.parse(sessionCookie);
          console.log('[api/posts/create] 4️⃣ parsedSession (JSON parse 성공):', {
            session: session,
            id: session.id || 'undefined',
            username: session.username || 'undefined',
          });

          userId = session.id;
          console.log('[api/posts/create] 5️⃣ userId (최종):', {
            userId: userId || 'null',
            type: typeof userId,
          });
        } catch (e) {
          console.error('[api/posts/create] ❌ Session 파싱 실패:', {
            error: e instanceof Error ? e.message : String(e),
            sessionCookie: sessionCookie,
          });
        }
      } else {
        console.warn('[api/posts/create] ⚠️ pc_bang_session 쿠키 없음');
      }
    } else {
      console.warn('[api/posts/create] ⚠️ cookie header 자체가 없음');
    }

    console.log('[api/posts/create] 6️⃣ 최종 결과:', {
      userIdExists: !!userId,
      userId: userId || 'null',
    });
    console.log('='.repeat(80));

    if (!userId) {
      console.error('[api/posts/create] ❌ No valid session found');
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
