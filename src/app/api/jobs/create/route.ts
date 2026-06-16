import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSessionFromRequest } from '@/lib/admin-session';
import { sanitizeJobBeforeSave } from '@/lib/seo-title-auto-fix';

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
    const session = await getSessionFromRequest(request);
    if (!session?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다. 다시 로그인해주세요.' }, { status: 401 });
    }

    const payload: CreateJobPayload = await request.json();

    if (!payload.title || !payload.description || !payload.region) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const sanitized = sanitizeJobBeforeSave({
      title: payload.title,
      region: payload.region,
      employment_type: payload.employment_type ?? undefined,
    });

    const { data: job, error: insertErr } = await supabase
      .from('jobs')
      .insert({
        user_id: session.id,
        category: payload.category,
        slug: payload.slug,
        title: sanitized.title,
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
      return NextResponse.json(
        { error: '공고 등록에 실패했습니다.', details: insertErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, jobId: job?.id, message: '공고가 등록되었습니다.' },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('[POST /api/jobs/create]', err);
    return NextResponse.json(
      {
        error: '공고 등록 중 오류가 발생했습니다.',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
