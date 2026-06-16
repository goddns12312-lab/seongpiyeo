import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin-session';

/**
 * POST /api/upload-job-image
 * 로그인 사용자가 jobs bucket에 이미지를 업로드
 * SERVICE_ROLE_KEY 사용으로 RLS 정책 우회
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const userId = session?.id;

    if (!userId) {
      return NextResponse.json(
        { error: '로그인이 필요합니다', reason: 'no_session' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[api/upload-job-image] Supabase env missing');
      return NextResponse.json({ error: '서버 환경값 오류' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const filename = `${timestamp}-${random}.${ext}`;
    const path = `${userId}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from('jobs')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error('[api/upload-job-image]', uploadError.message);
      return NextResponse.json(
        { error: uploadError.message || '업로드 실패' },
        { status: uploadError.statusCode || 500 }
      );
    }

    const { data: urlData } = supabase.storage.from('jobs').getPublicUrl(path);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path,
      filename,
    });
  } catch (error) {
    console.error('[api/upload-job-image]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '서버 오류' },
      { status: 500 }
    );
  }
}
