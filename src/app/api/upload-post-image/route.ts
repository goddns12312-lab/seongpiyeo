import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin-session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: '서버 환경값 오류' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `post-images/${session.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage.from('listings').upload(path, file, { upsert: true });

    if (uploadError) {
      console.error('[api/upload-post-image]', uploadError.message);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from('listings').getPublicUrl(path);

    return NextResponse.json({ success: true, url: urlData.publicUrl });
  } catch (error) {
    console.error('[api/upload-post-image]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '서버 오류' },
      { status: 500 }
    );
  }
}
