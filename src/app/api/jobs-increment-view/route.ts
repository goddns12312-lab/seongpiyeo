import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: '공고 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 조회수 증가는 SERVICE_ROLE_KEY 필요 (RLS 정책 우회)
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('view_count')
      .eq('id', id)
      .single();

    if (fetchError || !job) {
      return NextResponse.json(
        { error: '공고를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('jobs')
      .update({ view_count: (job.view_count || 0) + 1 })
      .eq('id', id);

    if (error) {
      console.error('[POST /api/jobs-increment-view] 조회수 증가 실패:', error);
      return NextResponse.json(
        { error: '조회수 증가 실패' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      view_count: (job.view_count || 0) + 1
    });
  } catch (error) {
    console.error('[POST /api/jobs-increment-view] 오류:', error);
    return NextResponse.json(
      { error: '오류 발생' },
      { status: 500 }
    );
  }
}
