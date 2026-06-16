import { createServiceRoleClient, getSessionFromRequest } from '@/lib/admin-session';
import { revalidatePath } from 'next/cache';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listingId');

  if (!listingId) {
    return Response.json({ error: 'listingId 필요' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: comments, error } = await supabase
    .from('listing_comments')
    .select('id, listing_id, user_id, nickname, content, status, created_at')
    .eq('listing_id', listingId)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[api/listings/comments GET]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ comments: comments || [] });
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.id) {
      return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { listingId, content } = await request.json();
    if (!listingId || !content?.trim()) {
      return Response.json({ error: '내용을 입력해주세요' }, { status: 400 });
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

    const { data, error } = await supabase
      .from('listing_comments')
      .insert({
        listing_id: listingId,
        user_id: session.id,
        nickname: session.nickname || '익명',
        content: content.trim(),
        status: 'active',
      })
      .select('id, listing_id, user_id, nickname, content, status, created_at')
      .single();

    if (error) {
      console.error('[api/listings/comments POST]', error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }

    revalidatePath(`/listings/${listingId}`);

    return Response.json({ comment: data });
  } catch (error) {
    console.error('[api/listings/comments POST]', error);
    return Response.json({ error: '오류 발생' }, { status: 500 });
  }
}
