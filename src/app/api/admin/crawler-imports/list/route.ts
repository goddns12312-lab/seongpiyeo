import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  console.log('[API] ===== 요청 시작 =====');

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('[API] Supabase URL:', supabaseUrl);
    console.log('[API] Supabase Key exists:', !!supabaseKey);

    if (!supabaseUrl || !supabaseKey) {
      console.error('[API] Supabase 환경변수 누락');
      return NextResponse.json(
        { error: 'Supabase 설정 오류' },
        { status: 500 }
      );
    }

    const supabase = createServiceClient(supabaseUrl, supabaseKey);
    console.log('[API] Supabase 클라이언트 생성 완료');

    const status = req.nextUrl.searchParams.get('status') || 'pending';
    console.log('[API] status 파라미터:', status);

    // 임시: 매우 단순한 쿼리 테스트
    console.log('[API] 쿼리 실행 시작: select(*)');
    const { data, error } = await supabase
      .from('crawler_imports')
      .select('*')
      .limit(5);

    console.log('[API] 쿼리 완료');
    console.log('[API] 에러 객체:', error);
    console.log('[API] 에러 메시지:', error?.message);
    console.log('[API] 에러 코드:', error?.code);
    console.log('[API] 에러 상태:', error?.status);
    console.log('[API] 데이터 개수:', data?.length);

    if (error) {
      console.error('[API] ===== 쿼리 실패 상세 =====');
      console.error('[API] Error:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          status: error.status,
        },
        { status: 500 }
      );
    }

    console.log('[API] ===== 성공 =====');
    console.log('[API] 반환 개수:', data?.length || 0);

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('[API] ===== 예외 발생 =====');
    console.error('[API] 예외:', error);
    console.error('[API] 예외 메시지:', error instanceof Error ? error.message : 'N/A');
    console.error('[API] 예외 스택:', error instanceof Error ? error.stack : 'N/A');

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
