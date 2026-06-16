import { createServiceRoleClient, getSessionFromRequest } from '@/lib/admin-session';

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.id) {
    return Response.json({ notifications: [], unreadCount: 0 });
  }

  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from('user_notifications')
    .select('id, type, title, body, link_url, is_read, created_at')
    .eq('user_id', session.id)
    .order('created_at', { ascending: false })
    .limit(30);

  const unreadCount = (data || []).filter((n) => !n.is_read).length;

  return Response.json({ notifications: data || [], unreadCount });
}

export async function PATCH(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.id) {
    return Response.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const { notificationId, markAllRead } = await request.json();
  const supabase = createServiceRoleClient();

  if (markAllRead) {
    await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('user_id', session.id)
      .eq('is_read', false);
  } else if (notificationId) {
    await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', session.id);
  }

  return Response.json({ success: true });
}
