import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, createServiceRoleClient } from '@/lib/admin-session';

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (!auth.ok) return auth.response;

  let body: { userId?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 });
  }

  const { userId, newPassword } = body;

  if (!userId || !newPassword) {
    return NextResponse.json({ error: 'userId와 newPassword가 필요합니다' }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: '비밀번호는 6자 이상이어야 합니다' }, { status: 400 });
  }

  try {
    const supabase = createServiceRoleClient();

    const { data: target, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    if (!target) {
      return NextResponse.json({ error: '회원을 찾을 수 없습니다' }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ password_hash: passwordHash })
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : '서버 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
