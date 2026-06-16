import { createServiceRoleClient, getSessionFromRequest, requireAdminAuth } from '@/lib/admin-session';

export async function GET(request: Request) {
  const auth = await requireAdminAuth(request);
  if (!auth.ok) return auth.response;

  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';

  const { data: reports, error } = await supabase
    .from('post_reports')
    .select('id, post_id, reporter_id, reason, status, created_at')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (!reports?.length) {
    return Response.json({ reports: [] });
  }

  const postIds = [...new Set(reports.map((r) => r.post_id))];
  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, category, status')
    .in('id', postIds);

  const postMap = new Map((posts || []).map((p) => [p.id, p]));

  return Response.json({
    reports: reports.map((r) => ({
      ...r,
      post: postMap.get(r.post_id) || null,
    })),
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminAuth(request);
  if (!auth.ok) return auth.response;

  const { reportId, status, hidePost } = await request.json();
  if (!reportId || !status) {
    return Response.json({ error: 'reportId, status 필요' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: report } = await supabase
    .from('post_reports')
    .select('post_id')
    .eq('id', reportId)
    .single();

  await supabase.from('post_reports').update({ status }).eq('id', reportId);

  if (hidePost && report?.post_id) {
    await supabase.from('posts').update({ status: 'hidden' }).eq('id', report.post_id);
  }

  return Response.json({ success: true });
}
