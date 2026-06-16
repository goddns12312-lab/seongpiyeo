import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug || '');

    // Anon key만 사용 (RLS 정책 준수)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // ID 기반으로 우선 조회, 실패 시 slug 기반 조회 (하위호환)
    let job = null;
    let error = null;

    // 먼저 ID로 조회 시도
    const { data: jobById } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', decodedSlug)
      .eq('status', 'active')
      .is('deleted_at', null)
      .single();

    if (jobById) {
      job = jobById;
    } else {
      const { data: jobBySlug, error: slugError } = await supabase
        .from('jobs')
        .select('*')
        .eq('slug', decodedSlug)
        .eq('status', 'active')
        .is('deleted_at', null)
        .single();

      job = jobBySlug;
      error = slugError;
    }

    if (error || !job) {
      return NextResponse.json(
        { error: '공고를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('[GET /api/jobs/[slug]] 오류:', error);
    return NextResponse.json(
      { error: '공고 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
