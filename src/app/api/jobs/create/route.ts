import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface CreateJobPayload {
  category: 'recruitment' | 'job_seeker';
  slug: string;
  title: string;
  company_name?: string | null;
  description: string;
  region: string;
  employment_type?: string | null;
  salary?: string | null;
  contact?: string | null;
  images: Array<{ url: string; order: number; is_primary: boolean }>;
  status?: string;
  view_count?: number;
}

export async function POST(request: NextRequest) {
  try {
    // 1단계: pc_bang_session 쿠키에서 사용자 정보 추출
    const cookie = request.headers.get('cookie');
    console.log('[POST /api/jobs/create] 쿠키 수신됨');

    if (!cookie) {
      console.error('[POST /api/jobs/create] 쿠키가 없습니다');
      return NextResponse.json(
        { error: '쿠키가 없습니다. 다시 로그인해주세요.' },
        { status: 401 }
      );
    }

    // 쿠키에서 pc_bang_session 추출
    const sessionMatch = cookie.match(/pc_bang_session=([^;]+)/);
    if (!sessionMatch || !sessionMatch[1]) {
      console.error('[POST /api/jobs/create] pc_bang_session 쿠키를 찾을 수 없습니다');
      return NextResponse.json(
        { error: 'pc_bang_session 쿠키가 없습니다. 다시 로그인해주세요.' },
        { status: 401 }
      );
    }

    // 쿠키 값 파싱
    let session: any;
    try {
      session = JSON.parse(decodeURIComponent(sessionMatch[1]));
      console.log('[POST /api/jobs/create] ✓ 세션 파싱 성공:', {
        userId: session.id?.substring(0, 8) + '...',
        username: session.username,
      });
    } catch (parseErr) {
      console.error('[POST /api/jobs/create] 세션 파싱 실패:', parseErr);
      return NextResponse.json(
        { error: '세션 파싱 실패. 다시 로그인해주세요.' },
        { status: 401 }
      );
    }

    // 사용자 ID 검증
    if (!session.id || typeof session.id !== 'string') {
      console.error('[POST /api/jobs/create] 유효하지 않은 user_id:', { id: session.id });
      return NextResponse.json(
        { error: '유효하지 않은 사용자 정보입니다.' },
        { status: 401 }
      );
    }

    // 2단계: 요청 본문 파싱
    const payload: CreateJobPayload = await request.json();
    console.log('[POST /api/jobs/create] 요청 본문 수신:', {
      category: payload.category,
      title: payload.title?.substring(0, 30),
      imageCount: payload.images?.length || 0,
      userIdMatch: session.id === session.id ? '✓' : '✗',
    });

    // 필수 필드 검증
    if (!payload.title || !payload.description || !payload.region) {
      console.error('[POST /api/jobs/create] 필수 필드 누락:', {
        title: !!payload.title,
        description: !!payload.description,
        region: !!payload.region,
      });
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 3단계: Service Role Key로 Supabase 클라이언트 생성 (RLS 우회)
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 4단계: jobs 테이블에 데이터 삽입
    console.log('[POST /api/jobs/create] ✓ Supabase insert 시작...');
    console.log('[POST /api/jobs/create] 삽입 데이터:', {
      user_id: session.id,
      category: payload.category,
      slug: payload.slug,
      title: payload.title,
      region: payload.region,
      imageCount: payload.images?.length || 0,
    });

    const { data: job, error: insertErr } = await supabase
      .from('jobs')
      .insert({
        user_id: session.id,
        category: payload.category,
        slug: payload.slug,
        title: payload.title,
        company_name: payload.company_name || null,
        description: payload.description,
        region: payload.region,
        employment_type: payload.employment_type || null,
        salary: payload.salary || null,
        contact: payload.contact || null,
        images: payload.images || [],
        status: 'active',
        view_count: 0,
      })
      .select()
      .single();

    if (insertErr) {
      console.error('[POST /api/jobs/create] ❌ 데이터베이스 삽입 실패:', {
        message: insertErr.message,
        code: insertErr.code,
        details: insertErr.details,
        hint: insertErr.hint,
      });
      return NextResponse.json(
        {
          error: '공고 등록에 실패했습니다.',
          details: insertErr.message,
        },
        { status: 500 }
      );
    }

    console.log('[POST /api/jobs/create] ✅ 공고 등록 성공:', {
      jobId: job?.id?.substring(0, 8) + '...',
      title: job?.title,
      userId: session.id?.substring(0, 8) + '...',
    });

    return NextResponse.json(
      {
        success: true,
        jobId: job?.id,
        message: '공고가 등록되었습니다.',
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[POST /api/jobs/create] 🔴 예기치 않은 오류:', {
      message: err?.message,
      stack: err?.stack,
    });
    return NextResponse.json(
      {
        error: '공고 등록 중 오류가 발생했습니다.',
        details: err?.message,
      },
      { status: 500 }
    );
  }
}
