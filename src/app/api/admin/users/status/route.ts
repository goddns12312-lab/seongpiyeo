import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, createServiceRoleClient } from '@/lib/admin-session';

const VALID_STATUSES = ['active', 'suspended', 'deleted'] as const;
type AccountStatus = (typeof VALID_STATUSES)[number];

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (!auth.ok) return auth.response;

  let body: { userId?: string; status?: AccountStatus; hideContent?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 });
  }

  const { userId, status, hideContent = true } = body;

  if (!userId || !status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'userId와 status가 필요합니다' }, { status: 400 });
  }

  if (userId === auth.session.id && status !== 'active') {
    return NextResponse.json({ error: '본인 계정은 정지·탈퇴 처리할 수 없습니다' }, { status: 400 });
  }

  try {
    const supabase = createServiceRoleClient();

    const { data: target, error: fetchError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    if (!target) {
      return NextResponse.json({ error: '회원을 찾을 수 없습니다' }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ account_status: status })
      .eq('id', userId);

    if (updateError) {
      const hint =
        updateError.message.includes('account_status') || updateError.code === '42703'
          ? ' (Supabase에서 013_profiles_account_status.sql 마이그레이션을 실행해주세요)'
          : '';
      return NextResponse.json({ error: updateError.message + hint }, { status: 500 });
    }

    if (hideContent && (status === 'suspended' || status === 'deleted')) {
      await supabase
        .from('listings')
        .update({ status: 'hidden' })
        .eq('user_id', userId)
        .in('status', ['active', 'pending']);

      await supabase
        .from('posts')
        .update({ status: 'hidden' })
        .eq('user_id', userId)
        .eq('status', 'active');
    }

    return NextResponse.json({ success: true, status });
  } catch (err) {
    const message = err instanceof Error ? err.message : '서버 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
