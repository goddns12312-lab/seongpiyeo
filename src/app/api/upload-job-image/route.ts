import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/upload-job-image
 * 로그인 사용자가 jobs bucket에 이미지를 업로드
 * SERVICE_ROLE_KEY 사용으로 RLS 정책 우회
 */

export async function POST(request: NextRequest) {
  try {
    // 1. 클라이언트 세션 확인 (로그인 검증용)
    const cookieStore = await cookies();

    // 📋 DEBUG: 모든 쿠키 목록 출력
    const allCookies = cookieStore.getAll();
    console.log('[API] 📋 요청 쿠키 목록:', {
      개수: allCookies.length,
      이름들: allCookies.map(c => c.name),
    });

    // 모든 쿠키의 전체 내용 (디버깅용)
    allCookies.forEach((cookie) => {
      if (cookie.name.includes('session') || cookie.name.includes('auth')) {
        console.log(`[API] 🔍 ${cookie.name}:`, {
          값길이: cookie.value.length,
          처음50자: cookie.value.substring(0, 50),
        });
      }
    });

    // 두 가지 방식 모두 시도
    // 방식 1: pc_bang_session (쿠키에서 저장된 세션)
    const pcSessionStr = cookieStore.get('pc_bang_session')?.value;
    let userId: string | null = null;

    console.log('[API] 🔎 pc_bang_session 쿠키 확인:', {
      존재: !!pcSessionStr,
      길이: pcSessionStr ? pcSessionStr.length : 0,
    });

    if (pcSessionStr) {
      try {
        console.log('[API] 📝 pc_bang_session 파싱 시도...');
        const session = JSON.parse(pcSessionStr);
        userId = session.id;
        console.log('[API] ✓ pc_bang_session에서 userId 확인:', {
          userId,
          username: session.username,
          nickname: session.nickname,
        });
      } catch (e) {
        console.error('[API] ❌ pc_bang_session 파싱 실패:', {
          에러: e instanceof Error ? e.message : String(e),
          원본값: pcSessionStr.substring(0, 100),
        });
      }
    } else {
      console.log('[API] ⚠️  pc_bang_session 쿠키 없음');
    }

    // 방식 2: Supabase auth 세션 (Supabase 인증 사용 시)
    try {
      const supabaseClient = createRouteHandlerClient({ cookies });
      const { data: { session: authSession } } = await supabaseClient.auth.getSession();

      if (authSession?.user?.id) {
        userId = authSession.user.id;
        console.log('[API] ✓ Supabase auth에서 userId 확인:', userId);
      } else {
        console.log('[API] ⚠️  Supabase auth 세션 없음');
      }
    } catch (e) {
      console.log('[API] Supabase auth 확인 실패:', e instanceof Error ? e.message : String(e));
    }

    // 최종 검증
    if (!userId) {
      console.error('[API] ❌ 401: 로그인 정보를 찾을 수 없음');
      console.error('[API] 📊 상세 정보:', {
        pc_bang_session_쿠키: !!pcSessionStr,
        쿠키_개수: allCookies.length,
        쿠키_이름들: allCookies.map(c => c.name).join(', '),
        요청헤더쿠키: request.headers.get('cookie') || '(없음)',
      });
      return NextResponse.json(
        {
          error: '로그인이 필요합니다',
          reason: 'no_session',
          details: 'pc_bang_session 쿠키가 없거나 유효하지 않습니다',
        },
        { status: 401 }
      );
    }

    console.log('[API] ✓ 인증 완료:', { userId });

    // 2. 요청 데이터 추출
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('[API] 파일 없음');
      return NextResponse.json(
        { error: '파일이 없습니다' },
        { status: 400 }
      );
    }

    console.log('[API] 파일 정보:', {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // 3. Service Role Client 생성 (RLS 우회)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[API] Supabase 환경값 없음');
      return NextResponse.json(
        { error: '서버 환경값 오류' },
        { status: 500 }
      );
    }

    // Service Role로 Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 4. 파일 업로드
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const filename = `${timestamp}-${random}.${ext}`;
    const path = `${userId}/${filename}`;

    console.log('[API] 업로드 요청:', {
      bucket: 'jobs',
      path,
      size: file.size,
    });

    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('jobs')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error('[API] 업로드 실패:', {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        status: uploadError.status,
        code: uploadError.code,
        details: uploadError.details,
      });

      return NextResponse.json(
        {
          error: uploadError.message || '업로드 실패',
          details: uploadError.details,
        },
        { status: uploadError.statusCode || 500 }
      );
    }

    console.log('[API] 업로드 성공:', { path, data: uploadData });

    // 5. Public URL 생성
    const { data: urlData } = supabase.storage
      .from('jobs')
      .getPublicUrl(path);

    const publicUrl = urlData.publicUrl;

    console.log('[API] Public URL 생성:', publicUrl);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path,
      filename,
    });
  } catch (error: any) {
    console.error('[API] 예외 발생:', {
      message: error?.message,
      stack: error?.stack,
    });

    return NextResponse.json(
      { error: '서버 오류: ' + error?.message },
      { status: 500 }
    );
  }
}
