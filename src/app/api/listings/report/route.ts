import { createServiceRoleClient, getSessionFromRequest } from '@/lib/admin-session';

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.id) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { listingId, reason } = await request.json();
    if (!listingId || !reason?.trim()) {
      return Response.json({ error: '신고 사유를 입력해주세요' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { data: listing } = await supabase
      .from('listings')
      .select('id, status')
      .eq('id', listingId)
      .single();

    if (!listing || listing.status !== 'active') {
      return Response.json({ error: '매물을 찾을 수 없습니다' }, { status: 404 });
    }

    const { error } = await supabase.from('listing_reports').insert({
      listing_id: listingId,
      reporter_id: session.id,
      reason: reason.trim(),
      status: 'pending',
    });

    if (error) {
      console.error('[api/listings/report]', error.message);
      return Response.json({ error: '신고 접수에 실패했습니다' }, { status: 500 });
    }

    return Response.json({ success: true, message: '신고가 접수되었습니다.' });
  } catch (error) {
    console.error('[api/listings/report]', error);
    return Response.json({ error: '오류 발생' }, { status: 500 });
  }
}
