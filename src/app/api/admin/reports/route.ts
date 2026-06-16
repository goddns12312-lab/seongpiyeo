import { createServiceRoleClient, requireAdminAuth } from '@/lib/admin-session';

export async function GET(request: Request) {
  const auth = await requireAdminAuth(request);
  if (!auth.ok) return auth.response;

  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';

  const [postReportsResult, listingReportsResult] = await Promise.all([
    supabase
      .from('post_reports')
      .select('id, post_id, reporter_id, reason, status, created_at')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('listing_reports')
      .select('id, listing_id, reporter_id, reason, status, created_at')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  if (postReportsResult.error) {
    return Response.json({ error: postReportsResult.error.message }, { status: 500 });
  }

  const postReports = postReportsResult.data || [];
  const listingReports = listingReportsResult.error ? [] : listingReportsResult.data || [];

  const postIds = [...new Set(postReports.map((r) => r.post_id))];
  const listingIds = [...new Set(listingReports.map((r) => r.listing_id))];

  const [postsResult, listingsResult] = await Promise.all([
    postIds.length
      ? supabase.from('posts').select('id, title, category, status').in('id', postIds)
      : Promise.resolve({ data: [] as { id: string; title: string; category: string; status: string }[] }),
    listingIds.length
      ? supabase.from('listings').select('id, title, status').in('id', listingIds)
      : Promise.resolve({ data: [] as { id: string; title: string; status: string }[] }),
  ]);

  const postMap = new Map((postsResult.data || []).map((p) => [p.id, p]));
  const listingMap = new Map((listingsResult.data || []).map((l) => [l.id, l]));

  const reports = [
    ...postReports.map((r) => ({
      id: r.id,
      targetType: 'post' as const,
      targetId: r.post_id,
      reason: r.reason,
      status: r.status,
      created_at: r.created_at,
      post: postMap.get(r.post_id) || null,
      listing: null,
    })),
    ...listingReports.map((r) => ({
      id: r.id,
      targetType: 'listing' as const,
      targetId: r.listing_id,
      reason: r.reason,
      status: r.status,
      created_at: r.created_at,
      post: null,
      listing: listingMap.get(r.listing_id) || null,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return Response.json({ reports });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminAuth(request);
  if (!auth.ok) return auth.response;

  const { reportId, status, hidePost, hideListing, targetType } = await request.json();
  if (!reportId || !status) {
    return Response.json({ error: 'reportId, status 필요' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  if (targetType === 'listing') {
    const { data: report } = await supabase
      .from('listing_reports')
      .select('listing_id')
      .eq('id', reportId)
      .single();

    await supabase.from('listing_reports').update({ status }).eq('id', reportId);

    if (hideListing && report?.listing_id) {
      await supabase.from('listings').update({ status: 'hidden' }).eq('id', report.listing_id);
    }
  } else {
    const { data: report } = await supabase
      .from('post_reports')
      .select('post_id')
      .eq('id', reportId)
      .single();

    await supabase.from('post_reports').update({ status }).eq('id', reportId);

    if (hidePost && report?.post_id) {
      await supabase.from('posts').update({ status: 'hidden' }).eq('id', report.post_id);
    }
  }

  return Response.json({ success: true });
}
